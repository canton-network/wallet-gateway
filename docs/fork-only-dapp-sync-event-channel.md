# Fork-only: dApp Sync push-event channel

**Status:** local-only patch on `0xsend/wallet-gateway` (this fork). **Not** intended for the upstream PR #1726 (which is scoped to the `JsCommands` schema stub fix). A separate upstream conversation is needed to decide the canonical wire shape — see "Recommended upstream conversation" below.

**Affects:** any dApp that uses `@canton-network/dapp-sdk` with a CIP-103-compliant **browser extension** wallet provider (e.g. Send Connect). Wallet-gateway HTTP/SSE flows are unaffected.

## Symptom (Joel's report, 2026-05-15)

> I was testing again on the Ping example. Ledger query works as expected, but when I test creating the Ping contract, I get prompted to sign the transaction. I sign it successfully, but the transaction never seems to go through.

Verified locally against `wallet-gateway/examples/ping` (this repo, rebased onto `wallet-gateway/main`) with Send Connect webext v0.3.2 against testnet:

- The dApp calls `sdk.prepareExecute(createPingCommand(...))`.
- The Send approval popup appears; user signs.
- `apps/test-dapp`-style observers would now see `status: 'executed'` + `updateId`.
- **The wallet-gateway `examples/ping` dApp UI never updates.** The `Total transactions: 1` block expected by `useTransactions()` (driven by `sdk.onTxChanged(listener)`) never renders.
- The transaction _does_ land on the ledger. Confirmed via PQS:

    ```
    tx_id        : 12207e0cca4a2b8b909f9e147518f2fc962a34ca6fbe628e460683aceb5475d34336
    contract_id  : 0023446cd6f5a3dc7faf127f39683f04e4fb371b9a37abdae19ff2d227c4cbdad3ca…
    template_fqn : canton-builtin-admin-workflow-ping:Canton.Internal.Ping:Ping
    signatory    : cantonwallet-testnetallen2::1220dc8e9c5d…
    payload.id   : my-test-1778880360044
    effective_at : 2026-05-15 21:26:24 UTC
    ```

So the wallet did its job. The dApp is the one that thinks nothing happened.

## Root cause: missing push-event wiring in the Sync path

CIP-103 defines four wallet-emitted events for which the SDK exposes `on*` subscribers:

| SDK subscriber                    | Underlying provider event |
| --------------------------------- | ------------------------- |
| `sdk.onTxChanged(listener)`       | `txChanged`               |
| `sdk.onAccountsChanged(listener)` | `accountsChanged`         |
| `sdk.onStatusChanged(listener)`   | `statusChanged`           |
| `sdk.onConnected(listener)`       | `connected`               |

Internally these resolve to `provider.on('<eventName>', listener)` (see `sdk/dapp-sdk/src/client.ts:onTxChanged`). The provider class is `AbstractProvider` from `@canton-network/core-splice-provider`, which simply stores listeners on a per-event map and dispatches on `.emit(event, payload)`.

That means **somewhere in the provider plumbing, an external signal has to call `provider.emit('<eventName>', payload)`** for each wallet push event. Two providers ship today:

- **`DappAsyncProvider`** (HTTP/SSE wallet-gateway flow, `core/provider-dapp/src/DappAsyncProvider.ts`) installs an EventSource and explicitly calls `eventSource.addEventListener('txChanged', dispatchToProviders('txChanged'))` (and the other three names) so events flow into `emit`.
- **`DappSyncProvider`** (postMessage flow used by the `ExtensionAdapter` returned for any `canton:announceProvider` wallet, `core/provider-dapp/src/DappSyncProvider.ts`) constructs a `WindowTransport` and a JSON-RPC client wrapper. **Nothing wires postMessage events into `.emit`.**

Drop a `window.addEventListener('message', …)` tap in the dApp tab and click `create Ping contract`; you'll capture five frames:

| #   | direction     | `type`                   | `event`/`status`         | shape                                                        |
| --- | ------------- | ------------------------ | ------------------------ | ------------------------------------------------------------ |
| 0   | dApp → webext | `SPLICE_WALLET_REQUEST`  | (prepareExecute)         | `{ type, target, request: { jsonrpc, id, method, params } }` |
| 1   | webext → dApp | `SPLICE_WALLET_EVENT`    | `txChanged` / `pending`  | `{ type, event, payload: { status, commandId, payload } }`   |
| 2   | webext → dApp | `SPLICE_WALLET_EVENT`    | `txChanged` / `signed`   | same envelope                                                |
| 3   | webext → dApp | `SPLICE_WALLET_EVENT`    | `txChanged` / `executed` | same envelope, payload includes `updateId`                   |
| 4   | webext → dApp | `SPLICE_WALLET_RESPONSE` | —                        | `{ type, response: { jsonrpc, id, result } }`                |

`WindowTransport.submit` correlates frame #4 with the in-flight request id and resolves the `prepareExecute()` promise — that part works. Frames #1–#3 are silently dropped: `WindowTransport`'s only `message` listener (per-request, inside `submit`) filters for `data.type === SPLICE_WALLET_RESPONSE` and ignores everything else.

That's the bug. The wallet pushes the lifecycle events; the Sync transport never delivers them to the provider, so `provider.emit('txChanged', …)` never fires, so `sdk.onTxChanged(listener)` never invokes the listener.

## Why the upstream type system can't even _describe_ the events today

Even before talking about wiring, the upstream `WalletEvent` enum in `core/types/src/index.ts` only defines:

```
SPLICE_WALLET_REQUEST | SPLICE_WALLET_RESPONSE |
SPLICE_WALLET_EXT_READY | SPLICE_WALLET_EXT_ACK | SPLICE_WALLET_EXT_OPEN |
SPLICE_WALLET_IDP_AUTH_SUCCESS | SPLICE_WALLET_LOGOUT
```

The `SpliceMessage` Zod union has matching variants for each of those — and **no variant for a push-event envelope**. So Send's `{ type: 'SPLICE_WALLET_EVENT', event: 'txChanged', payload: {...} }` frames don't satisfy `SpliceMessage.safeParse(...)` and would fail `isSpliceMessageEvent` even if `WindowTransport` were extended naïvely.

The fork patch therefore has to extend both:

1. **Wire vocabulary** (`core/types/src/index.ts`) — add `WalletEvent.SPLICE_WALLET_EVENT` and a matching `SpliceMessage` discriminated-union variant carrying `{ event, payload, target? }`.
2. **Transport plumbing** (`core/rpc-transport/src/index.ts`) — extend `WindowTransport` with a single shared message listener that fans `SPLICE_WALLET_EVENT` frames out to all `onEvent` subscribers, gated by `target` when the transport was constructed with one (so a dApp connected to extension A doesn't see events posted by extension B). `RpcTransport` interface gains an **optional** `onEvent` so non-push transports (e.g. `HttpTransport`) keep working without change.
3. **Provider wiring** (`core/provider-dapp/src/DappSyncProvider.ts`) — in the constructor, if `transport.onEvent` is present, subscribe and forward each event via `this.emit(event, payload)`. The HTTP/SSE provider already does the equivalent via `EventSource`; this brings the postMessage path to parity.

After the patch, frames #1–#3 land on `AbstractProvider.listeners['txChanged']`, the dApp's `useTransactions` hook receives them, and `Total transactions: N` renders. Verified locally against the same testnet flow.

## Is this a CIP-103 spec problem?

Partially. The relevant parts of CIP-103 today are:

- **`api-specs/openrpc-dapp-api.json`** lists `accountsChanged`, `statusChanged`, `connected`, and `txChanged` as **methods** (`params: []`, returning the matching event schema). In OpenRPC terms, that models them as pollable getters, _not_ a push channel.
- **`docs/dapp-building/dapp-sdk/api-reference.md`** explicitly labels these four as "Events" and says under Sync API: _"In this model, methods and events are executed in a standard request-response fashion"_ — but doesn't define an event wire envelope for the extension/postMessage transport. The Async API doc just refers to events being "emitted" via the gateway, which the implementation realizes as SSE.
- **`docs/dapp-building/dapp-sdk/provider.md`** documents the `canton:requestProvider` / `canton:announceProvider` discovery handshake and the `SPLICE_WALLET_*` envelope for request/response. It does not document an envelope for push events.

So CIP-103 says these events exist and are part of the contract, but stops short of specifying _how_ they are pushed in the extension/postMessage flow. The HTTP/SSE flow has a de facto answer (SSE event-name). The postMessage flow has no documented answer, and the upstream code's behavior is "you can poll for the latest event by calling the eponymous method". That is the gap that lets an extension like Send (which _does_ push events) silently fail to drive the SDK's `on*` subscribers.

**The fork's `SPLICE_WALLET_EVENT` envelope is one possible answer**, mirroring how `DappAsyncProvider` treats SSE event names: the message carries the same `event` discriminator the dApp would `on()`-subscribe to, plus the payload shape from the matching method's result schema. There are reasonable alternatives — see the next section.

## Recommended upstream conversation

If/when this is taken upstream, three things are worth nailing down on canton-network/wallet-gateway:

1. **Is the postMessage push-event envelope a `SPLICE_WALLET_*` extension or a JSON-RPC 2.0 notification?**
    - Option A — extension envelope (this fork): `{ type: 'SPLICE_WALLET_EVENT', event, payload, target? }`. Symmetric with `SPLICE_WALLET_REQUEST`/`_RESPONSE` already used on the wire; needs a new enum + schema variant.
    - Option B — JSON-RPC notification: `{ type: 'SPLICE_WALLET_REQUEST', request: { jsonrpc: '2.0', method: '<eventName>', params: [...] } }` with no `id`. Reuses the existing request envelope; sidesteps a new wire type; matches how some other wallet ecosystems push events. Trade-off: conflates "wallet asks dApp to do something" with "wallet notifies dApp", and the request-response correlation code in `WindowTransport.submit` would need a guard to ignore notifications.
2. **Should `RpcTransport.onEvent` be part of the interface contract, or only on transports that support push?** This fork makes it optional. Promoting to required forces every transport (e.g. unit-test fakes) to model the event channel — probably worth it for clarity, even when the implementation is a no-op.
3. **Should the OpenRPC spec gain an explicit channel/subscription concept** (OpenRPC has no native subscription, but conventions exist) **or stay with the current "events-as-methods" model and add a non-normative section describing the push channel for each transport**?

Independent of those questions, the fork-only patch here is intentionally minimal so it can survive any of the three resolutions: replace the envelope, replace the wiring, or replace the type names without touching the bug-fix shape.

## Known gap: `DappSyncProvider.teardown()` is dead code under the current SDK lifecycle

The patch adds `DappSyncProvider.teardown()` that calls the `transport.onEvent` unsubscribe and clears the field. **Nothing in the current SDK calls it.** Tracing the disconnect path on `wallet-gateway/main` (pre-patch and unchanged by this fork):

- `sdk/dapp-sdk/src/adapter/extension-adapter.ts:105-107` — `ExtensionAdapter.teardown()` is a `// No cleanup needed for extensions` no-op. The adapter constructs `new DappSyncProvider(...)` on every `provider()` call (`:96-103`) and stores no reference.
- `core/wallet-discovery/src/client.ts:201-213` — `DiscoveryClient.disconnect()` calls `adapter.teardown()` only. There is no per-provider cleanup hook on the discovery side, and the session struct holds a `provider` ref but never invokes anything on it during teardown.

Pre-patch this gap was benign: `DappSyncProvider` had no `teardown()` method, so there was nothing for the lifecycle to call. The fork introduces a method that needs a caller; the upstream lifecycle has none.

Consequence in practice:

- On `DiscoveryClient.disconnect()`, the `WindowTransport.eventListeners` Set retains the closure capturing the old provider's `this.emit`. The provider object is otherwise eligible for GC, but the closure keeps it alive.
- If the dApp reconnects in the same page session, a new `DappSyncProvider` constructs a new subscription. Both subscriptions are now live. The wallet's next `SPLICE_WALLET_EVENT` fires both — including any stale `onTxChanged` listeners the user registered on the previous provider.
- A page reload clears the DOM listener and the Set, so the bug only manifests on intra-page disconnect/reconnect cycles. The default `examples/ping` flow does not exercise this, which is why testnet repro succeeded.

The fix is upstream's, not the fork's. Two minimal options:

1. `ExtensionAdapter` stores the most recently returned provider on a private field and calls `provider.teardown?.()` from its own `teardown()`.
2. `DiscoveryClient.disconnect()` calls `session.provider.teardown?.()` before `adapter.teardown()`. Cleaner because it generalizes to any provider, not just extension-backed ones.

This fork ships `DappSyncProvider.teardown()` ready to be called by whichever option upstream picks. If upstream rejects both, the method can be deleted with no behavioral consequence — the lifecycle was already a no-op before this patch and remains one until upstream wires it.

## File map

| Path                                         | What changed                                                                                                            |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `core/types/src/index.ts`                    | `WalletEvent.SPLICE_WALLET_EVENT` + matching `SpliceMessage` variant.                                                   |
| `core/rpc-transport/src/index.ts`            | `RpcTransport.onEvent?` (optional) + `WindowTransport.onEvent` with single shared `message` listener gated on `target`. |
| `core/provider-dapp/src/DappSyncProvider.ts` | Wires `transport.onEvent` → `AbstractProvider.emit(event, payload)`; adds `teardown()`.                                 |
| `docs/fork-only-dapp-sync-event-channel.md`  | This document.                                                                                                          |

## Repro / verification recipe (local)

```bash
# 1. Send webext loaded as unpacked from canton-monorepo/apps/webext/.output/chrome-mv3-dev
# 2. Wallet-gateway example dApp:
yarn workspace @canton-network/example-ping dev   # http://localhost:8080

# 3. Loki tail for testnet api-gateway (correlates with what the wallet ends up hitting):
sloki query '{worker="canton-api-gateway-testnet"} |~ "(?i)(prepare|execute|allen2|dapp)"' --tail

# 4. PQS lookup for the resulting update:
sinfra psql pqs-testnet --exec \
  "SELECT effective_at, transaction_id FROM __transactions WHERE effective_at > NOW() - INTERVAL '5 minutes' ORDER BY effective_at DESC LIMIT 5"
```

In the dApp tab DevTools, the four observable signals (in order):

```
> __rawMsgs[1].data.event        // 'txChanged' status: 'pending'
> __rawMsgs[2].data.event        // 'txChanged' status: 'signed'
> __rawMsgs[3].data.event        // 'txChanged' status: 'executed'   ← the one that has to reach `provider.emit`
> document.body.innerText.includes('Total transactions: 1')          // true after patch, false before
```
