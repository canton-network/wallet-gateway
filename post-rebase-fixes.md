# Post-Rebase Fix Report

Branch: `jarekr/sdk_synchronizers` (merge of `wiktor/multisync-example`)
HEAD: `e1929f6c`

---

## Summary

After resolving rebase conflicts between `jarekr/sdk_synchronizers` and `wiktor/multisync-example`, six distinct bugs remained in the merged code. All were fixed. All 46 packages now compile cleanly, scripts 01–14 all pass, and the new multi-sync script 15 passes end-to-end.

---

## Fixes

### Fix 1 — Stale PnP manifest (missing `@canton-network/core-provider-dapp`)

`sdk/wallet-sdk/package.json` had a new dependency added in wiktor's branch but `yarn install` was not run after the merge. The PnP manifest was stale and could not resolve the module at build time.

**Fix:** Ran `yarn install` to regenerate `.pnp.cjs`.

---

### Fix 2 — Stale re-export in `sdk.ts` (`resolveGlobalSynchronizerId`)

**File:** `sdk/wallet-sdk/src/wallet/sdk.ts`

Wiktor's commit `c76aa8b4` removed `resolveGlobalSynchronizerId` from `common.ts` and moved its logic into `State.globalSynchronizerId()`. During rebase conflict resolution the old `export { resolveGlobalSynchronizerId }` was incorrectly kept, causing a compile error.

**Fix:** Removed the stale export line.

---

### Fix 3 — Dead import in `utils/index.ts` (`resolveGlobalSynchronizerId`)

**File:** `docs/wallet-integration-guide/examples/scripts/utils/index.ts`

`getGlobalSynchronizerId` still imported and called `resolveGlobalSynchronizerId` from `@canton-network/wallet-sdk` (which was removed in wiktor's branch). The rebase left the old implementation.

**Fix:** Removed the import; rewrote `getGlobalSynchronizerId` to delegate to `sdk.ledger.state.globalSynchronizerId()`.

---

### Fix 4 — `TypeError: err.cause.includes is not a function` in `sdk.ts`

**File:** `sdk/wallet-sdk/src/wallet/sdk.ts`

A catch block in `SDK.create()` assumed `err.cause` is always a string and called `.includes()` on it directly. At runtime `err.cause` can be an `Error` object or `undefined`, causing a `TypeError` on every SDK instantiation when the ledger returns a non-auth error.

**Fix:** Added runtime type guards — checks both `err.cause` and `err.message` via `typeof === 'string'` before joining and searching.

---

### Fix 5 — `sv` participant (P3) used for `app-synchronizer` operations in script 15

**Files:**

- `docs/wallet-integration-guide/examples/scripts/15-multi-sync/_setup.ts`
- `docs/wallet-integration-guide/examples/scripts/15-multi-sync/_trade_ops.ts`

The canton bootstrap script (`canton/multi-sync/app-synchronizer.sc`) explicitly connects only `app-user` (P1) and `app-provider` (P2) to `app-synchronizer`. The `sv` participant (P3) is **global-only**. The merged test code routed all `tokenAdmin` operations through `p3Sdk`, causing `PACKAGE_SERVICE_NOT_CONNECTED_TO_SYNCHRONIZER`, `INVALID_ARGUMENT`, and `PERMISSION_DENIED` errors.

**Fix:**

- `_setup.ts`: Generate `tokenAdminKey` from `p2Sdk`; allocate `tokenAdmin` party via `p2Sdk`; register `tokenAdmin` on `app-synchronizer` via `p2Sdk`.
- `_trade_ops.ts`: Route all `tokenAdmin` ledger submissions and ACS reads to `p2Sdk`. P3 (`tradingApp`) operations remain on `global-domain` only.
- DAR vetting: P1+P2 vet on both synchronizers; P3 vets on global only.
- `buildContractReadSpec`: Use `p2Sdk` for `tokenAdmin`'s `TokenRules` reads.

---

### Fix 6 — `SUBMITTER_ALWAYS_STAKEHOLDER` in self-transfer step (script 15, step 11)

**File:** `docs/wallet-integration-guide/examples/scripts/15-multi-sync/_trade_ops.ts`

After OTCTrade settlement, Alice's and Bob's TestToken holdings land on `global-domain`. Step 11 attempts to self-transfer them back to `app-synchronizer` via `TransferFactory_Transfer`. This failed because Canton requires the submitter to be a stakeholder on at least one contract **currently on the target synchronizer**. Since the tokens were still on global, neither Alice nor Bob had any contracts on `app-synchronizer` at submission time.

**Fix:** Added explicit `ledger.internal.reassign` calls in `aliceSelfTransferToApp` and `bobSelfTransferToApp` to move each token from `global` to `app-synchronizer` before the self-transfer.

---

## Test Results

| Test suite                                          | Result    |
| --------------------------------------------------- | --------- |
| `yarn build:all` (46 packages)                      | ✅ Exit 0 |
| `yarn script:test:examples` (scripts 01–14 + utils) | ✅ Exit 0 |
| `yarn script:test:examples:multi-sync` (script 15)  | ✅ Exit 0 |

---

## Infrastructure Note

Script 15 requires localnet started with the `--multi-sync` flag:

```
yarn tsx scripts/src/start-localnet.ts start --multi-sync
```

A plain `yarn start:localnet` starts without the `app-synchronizer`, and script 15 will immediately fail with "Expected at least 2 connected synchronizers". The CI job `wallet-sdk-scripts-e2e` already uses `setup_localnet` with `multi-sync: 'true'`.
