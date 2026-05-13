# PR Review — Example 15: Multi-Synchronizer DvP Trade

---

## 1. Does README.md Correctly Describe the Scenario?

**Mostly yes, with a few inaccuracies.**

### Inaccuracy: Step 4 "used in Steps 6b and 10"

The README setup table says:

> Step 4: Discover Token interface on app synchronizer for Bob's token (used in Steps 6b and 10)

`tokenP2` is **not** used in step 6b. Step 6b (`createTokenRulesAndMintForBob`) only calls `p2Sdk.ledger.prepare()` — never `tokenP2`. `tokenP2` is actually used in:

- Step 10: `tokenP2.allocation.request.pending(bob.partyId)` in `allocateTokenForBob`
- Step 11a: `tokenP2.allocation.pending(bob.partyId)` in `index.ts`

The README should read "used in Steps 10 and 11a".

### Inaccuracy: Expected output — synchronizer alias

The README expected output shows:

```
Connected synchronizers: global-synchronizer, app-synchronizer
```

Actual output:

```
Connected synchronizers: app-synchronizer, global
```

Two differences:

1. **Order is reversed** — the actual output lists app-synchronizer first (it was returned first by the ledger API)
2. **Alias name differs** — README says `global-synchronizer`, actual is `global`

The setup code correctly looks for `synchronizerAlias === 'global'` (matches the actual alias), but the README shows a stale alias name. The expected output block in the README should be updated.

### Minor: Troubleshooting section references wrong error message

The troubleshooting section for "App synchronizer not found" uses `(alias: app-synchronizer)` in the heading, but the actual thrown error message in `_setup.ts` is:

```
App synchronizer not found — start localnet with --multi-sync to enable it.
```

The heading and code don't match.

### Everything else is accurate

The step table, the DvP trade logic, the reassignment steps, the expected final state — all match the implementation.

---

## 2. Does the Scenario Work? (Tested Locally)

**Yes. Ran successfully twice end-to-end.**

Multi-sync localnet was already running (`multi-sync-startup` and `multi-sync-ready` containers exited cleanly 2 days ago). Both runs completed with the correct final contract state:

```
+---------------+------------+--------------------+---------------------+------------------+
| Party / Owner | Template   | Amount             | Contract ID         | Synchronizer     |
+---------------+------------+--------------------+---------------------+------------------+
| v1-15-alice   | Amulet     | 1999900.0000000000 | ...                 | global           |
| v1-15-alice   | Token      | 20.0000000000      | ...                 | app-synchronizer |
| v1-15-bob     | Amulet     | 100.0000000000     | ...                 | global           |
| Bob           | TokenRules |                    | ...                 | app-synchronizer |
| v1-15-bob     | Token      | 480.0000000000     | ...                 | app-synchronizer |
| TradingApp    | (none)     | -                  | -                   | -                |
+---------------+------------+--------------------+---------------------+------------------+
```

This is the expected outcome:

- Alice paid 100 Amulet (global) → Bob; received 20 TestToken (app-sync) ✓
- Bob delivered 20 TestToken; received 100 Amulet (global); keeps 480 remainder on app-sync ✓
- TokenRules and Bob's Token reassigned back to app-synchronizer ✓

One observation: the SDK emits multiple `WARN: Found 2 synchronizers, defaulting to app-synchronizer::...` lines during SDK initialisation. This is harmless (all `ledger.prepare()` calls pass explicit `synchronizerId`), but it will likely confuse users who see it. Worth adding a note to the README troubleshooting section or explaining the warning in a code comment.

---

## 3. Do We Call /v2/ or /v1/ Services Directly? (Should use `sdk` object)

**Yes, in one place — `utils/dar.ts` via a private SDK escape hatch.**

### `dar.ts` — direct `/v2/packages` call

```typescript
// utils/dar.ts
await ledgerProvider.request({
    method: 'ledgerApi',
    params: {
        resource: '/v2/packages', // ← direct v2 call
        requestMethod: 'post',
        query: { synchronizerId, vetAllPackages: true },
        body: darBytes,
        headers: { 'Content-Type': 'application/octet-stream' },
    },
})
```

`ledgerProvider` is accessed via an unsafe cast in `_setup.ts`:

```typescript
// _setup.ts
const p1SdkCtx = (p1Sdk.ledger as unknown as { sdkContext: SDKContext })
    .sdkContext
// then:
vetDar(p1SdkCtx.ledgerProvider, dar, sid)
```

This bypasses the SDK's public interface entirely. The TODO in `dar.ts` acknowledges it:

> TODO: replace this function with the usage of built-in upload() function after the latter one is fixed to support vetting of uploaded package on multiple synchronizers

**This is a known workaround, not an oversight** — the SDK's built-in `upload()` doesn't yet support multi-synchronizer vetting. But users reading this example will see a pattern they shouldn't copy. The TODO comment is sufficient for now, but once the SDK is fixed this must be cleaned up.

### `scan-proxy.ts` — direct `fetch()` to scan proxy API

`ScanProxyClient` makes raw `fetch()` calls to paths like:

- `/v0/scan-proxy/amulet-rules`
- `/registry/allocation-instruction/v1/allocation-factory`
- `/registry/allocations/v1/{id}/choice-contexts/execute-transfer`

These go to the **validator's scan proxy** (`LOCALNET_REGISTRY_API_URL = .../api/validator/v0/scan-proxy`), not to the Canton ledger `/v2/` API. The `/v1/` in these paths is the scan proxy's own API versioning. This is acceptable since the SDK doesn't wrap scan proxy operations — calling the scan proxy directly is the intended pattern here.

**Summary**: The only true `/v2/` bypass is `vetDar()`, which is a known temporary workaround. Everything else either goes through the `sdk` object or through the scan proxy (which the SDK doesn't wrap).

---

## 4. Code Quality / Readability

### Issue: `p1SdkCtx`, `p2SdkCtx`, `p3SdkCtx` unnecessarily exported in `MultiSyncSetup`

These three fields are used **only inside `setupMultiSyncTrade()`** for DAR vetting. They are never accessed from `_trade_ops.ts` or `index.ts`. Yet they appear in the `MultiSyncSetup` interface and in the return value. This leaks an internal implementation detail (the SDK's private `SDKContext`) into the public setup contract.

**Fix**: keep them as local variables inside `setupMultiSyncTrade()`, remove from `MultiSyncSetup`.

### Issue: Unsafe SDK internal access

```typescript
const p1SdkCtx = (p1Sdk.ledger as unknown as { sdkContext: SDKContext })
    .sdkContext
```

This `as unknown as` double-cast is a red flag in example code. Readers will copy the pattern. The cast exists solely to call `vetDar()`, which itself is a workaround (see §3). Once the SDK supports multi-sync vetting natively, both the cast and `sdkContext` go away. Until then, the cast should at minimum have a comment explaining why it exists and that it should not be emulated.

### Issue: Inconsistent `requestedAt` values

| Location                 | Value                                                            |
| ------------------------ | ---------------------------------------------------------------- |
| `allocateAmuletForAlice` | `new Date().toISOString()` (current time)                        |
| `allocateTokenForBob`    | `new Date(Date.now() - 60_000).toISOString()` (60 s in the past) |
| `aliceSelfTransferToApp` | `new Date(Date.now() - 60_000).toISOString()` (60 s in the past) |

The `-60_000` offset is presumably needed because the ledger's internal time may run ahead of wall clock time, and Daml requires `requestedAt ≤ ledger time`. The Amulet allocation apparently doesn't enforce this (or the scan proxy normalises it). The difference is unexplained and inconsistent. Either apply the offset everywhere or add a comment justifying why Amulet doesn't need it.

### Minor: `p3Sdk` created with `TOKEN_NAMESPACE_CONFIG` but doesn't use `token` namespace

`p3Sdk` (TradingApp) is created with `token: TOKEN_NAMESPACE_CONFIG`, which configures the token namespace (registers the validator URL, registry, etc.). But `p3Sdk.token` is never accessed — `p3Sdk` only uses `p3Sdk.ledger`. Creating the SDK with full `token` config for P3 is unnecessary noise. Consider either:

- Creating `p3Sdk` without the `token` namespace config, or
- Adding a comment explaining why it's included (e.g., "included for DAR vetting parity, even though token ops are not needed on P3")

### Minor: `TOKEN_NAMESPACE_CONFIG` uses app-user's validator for all three SDKs

All three SDKs (P1, P2, P3) are initialised with `TOKEN_NAMESPACE_CONFIG.validatorUrl = LOCALNET_APP_VALIDATOR_URL` (P1's validator). This works in localnet because P2 and P3 don't call validator-dependent token operations through `tokenP2`/`tokenP3`, but the asymmetry is invisible and would break silently in a multi-validator environment. A comment would help.

### Positive notes

- The step-by-step structure in `index.ts` (with `──` section headers) is clear and readable.
- `logAllContracts` / the ASCII table is a great debugging tool and makes the flow easy to follow.
- The parallel `Promise.all` usage for setup (SDK creation, DAR vetting, party allocation) is correct and efficient.
- `buildContractReadSpec` centralises the ACS query specs cleanly.
- The `reassignBobTokensToApp` and `aliceSelfTransferToApp` functions are well-commented with the Canton mechanics.
- Error messages throughout are specific and actionable.
