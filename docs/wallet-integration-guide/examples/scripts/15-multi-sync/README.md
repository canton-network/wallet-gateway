# Example 15: Multi-Synchronizer DvP Trade

## Overview

This example implements a Delivery vs Payment (DvP) flow across multiple
synchronizers. It demonstrates how to orchestrate a trade between Amulet
(on a global synchronizer) and a Token instrument (on a private/app
synchronizer) using the OTC Trading App.

Complete workflow covered:

- SDK initialization with multiple synchronizers
- Party allocation and registration across synchronizers
- Parallel asset minting (Amulet on global, Token on app-synchronizer)
- Multi-synchronizer trade settlement using only single-party submissions
- Cross-synchronizer contract reassignment via `ledger.internal.reassign`
- Canton disclosure-based authorization for cross-signatory contract creation

## Prerequisites

### 1. Download the localnet bundle (first time only)

If you have never run localnet before, or after a Splice version update:

```bash
yarn script:fetch:localnet
```

For mainnet network variant:

```bash
yarn script:fetch:localnet -- --network=mainnet
```

This populates `.localnet/docker-compose/` and `.localnet/dars/`.

The DARs required by this example come from two locations:

| DAR file                                  | Location                 | Purpose                                                                            |
| ----------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------- |
| `splice-token-test-trading-app-1.0.0.dar` | `.localnet/dars/`        | `OTCTrade` and `OTCTradeAllocationRequest` templates for orchestrating the trade   |
| `splice-test-token-v1-1.0.0.dar`          | `scripts/15-multi-sync/` | `Token` and `TokenRules` templates — the custom instrument on the app-synchronizer |

`splice-token-test-trading-app-1.0.0.dar` is fetched by `yarn script:fetch:localnet`.
`splice-test-token-v1-1.0.0.dar` is bundled directly in the script directory.

## Running Locally

All commands are run from the **repository root** unless noted otherwise.

### Full end-to-end (start → run → stop)

All `yarn start:localnet`, `yarn stop:localnet`, `yarn script:*` commands must be
run from the **repository root** (`splice-wallet-kernel/`).
The example script itself (`yarn run-15`) must be run from the
`docs/wallet-integration-guide/examples/` subdirectory.

```bash
# ── From the repository root ──────────────────────────────────────────────────

# Step 1: Fetch localnet bundle (first time or after a Splice version update)
yarn script:fetch:localnet
# For mainnet variant:
# yarn script:fetch:localnet -- --network=mainnet

# Step 2: Start localnet in multi-sync mode
#   This spins up 16 containers: the standard 14 localnet containers plus
#   multi-sync-startup (runs the app-synchronizer.sc bootstrap script, then exits)
#   and multi-sync-ready (health-gate container).
yarn start:localnet -- --multi-sync
# For mainnet variant:
# yarn start:localnet -- --network=mainnet --multi-sync

# Step 3: Wait until all containers are healthy
#   multi-sync-startup will appear as "Exited (0)" — that is expected and correct.
#   All other containers should show "(healthy)" before you proceed.
docker ps --format "table {{.Names}}\t{{.Status}}"

# ── From docs/wallet-integration-guide/examples/ ──────────────────────────────

# Step 4: Run the example
cd docs/wallet-integration-guide/examples
yarn run-15

# ── From the repository root ──────────────────────────────────────────────────

# Step 5: Stop the multi-sync localnet when done
cd -   # return to repository root
yarn stop:localnet -- --multi-sync
# For mainnet variant:
# yarn stop:localnet -- --network=mainnet --multi-sync
```

Alternatively, run the example from the repository root using the workspace shorthand:

```bash
yarn workspace docs-wallet-integration-guide-examples run-15
```

### Quick run (multi-sync localnet already running)

From `docs/wallet-integration-guide/examples/`:

```bash
cd docs/wallet-integration-guide/examples
yarn run-15
```

Or from the repository root:

```bash
yarn workspace docs-wallet-integration-guide-examples run-15
```

### Run via the dedicated multi-sync test suite

This is the same flow used in CI for the `wallet-sdk-scripts-e2e-multi-sync` job.
All commands run from the **repository root**.

```bash
# Step 1: Start multi-sync localnet
yarn start:localnet -- --multi-sync
# For mainnet variant:
# yarn start:localnet -- --network=mainnet --multi-sync

# Step 2: Run the multi-sync test suite (runs example 15 only)
yarn script:test:examples:multi-sync

# Step 3: Stop when done
yarn stop:localnet -- --multi-sync
```

### Run as part of the full example test suite

All commands run from the **repository root**.

```bash
# Ensure DARs are downloaded and multi-sync localnet is running (steps 1–3 above),
# then run the full suite (examples 01–14 + 15):
yarn script:test:examples
```

If `splice-token-test-trading-app-1.0.0.dar` is missing from `.localnet/dars/`, run
`yarn script:fetch:localnet` from the repository root.
If `splice-test-token-v1-1.0.0.dar` is missing from the script directory, it has been
accidentally deleted — restore it from version control.

### Expected output

```
[v1-15-multi-sync-trade] Connected synchronizers: global-synchronizer, app-synchronizer
[v1-15-multi-sync-trade] Synchronizer IDs — global: ..., app: ...
[v1-15-multi-sync-trade] DARs vetted: P1+P2 on both synchronizers, P3 on global only
[v1-15-multi-sync-trade] Parties allocated — alice: ... (P1), bob: ... (P2), tradingApp: ... (P3)
[v1-15-multi-sync-trade] Alice and Bob registered on app-synchronizer
[v1-15-multi-sync-trade] Amulet asset discovered — admin: ...
[v1-15-multi-sync-trade] Alice: Amulet minted (2000000) on global synchronizer
[v1-15-multi-sync-trade] TokenAdmin: TokenRules created on global + app synchronizers; Bob: 500 TestToken minted on app-synchronizer
[v1-15-multi-sync-trade] Alice: OTCTradeProposal created (leg-0: 100 Amulet → Bob, leg-1: 20 TestToken → Alice)
[v1-15-multi-sync-trade] Bob: OTCTradeProposal_Accept executed
[v1-15-multi-sync-trade] TradingApp: OTCTradeProposal_InitiateSettlement executed → OTCTrade created
[v1-15-multi-sync-trade] Alice: Amulet allocated for leg-0 (global synchronizer)
[v1-15-multi-sync-trade] Bob: TestToken allocated for leg-1 (global synchronizer, single-party)
[v1-15-multi-sync-trade] TradingApp: OTCTrade settled — 100 Amulet transferred to Bob, 20 TestToken transferred to Alice
[v1-15-multi-sync-trade] Alice: 20 TestToken self-transferred on app-synchronizer (Canton auto-reassigned Alice's Token from global → app)
[v1-15-multi-sync-trade] Bob: 1 TestToken holding(s) reassigned to app-synchronizer
[v1-15-multi-sync-trade] Final contract state:
```

> **Note:** Steps 9 (Alice allocates Amulet) and 10 (Bob allocates TestToken) run in parallel,
> as do the two self-transfers in step 12, so those log lines may appear in either order.

## How it Works

| Step | Who         | What                                                                                                                                                                                                                                  | Synchronizer            |
| ---- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 1    | —           | Create SDKs (P1, P2, P3) and discover synchronizers                                                                                                                                                                                   | global + app            |
| 2    | —           | Vet DARs: P1+P2 on both synchronizers, P3 on global only                                                                                                                                                                              | global + app            |
| 3    | —           | Allocate parties (Alice/P1, Bob/P2, TradingApp/P3)                                                                                                                                                                                    | global                  |
| 4    | —           | Discover Token interface on app synchronizer                                                                                                                                                                                          | app                     |
| 5    | Alice       | Mint 2,000,000 Amulet for Alice                                                                                                                                                                                                       | global                  |
| 6a   | TokenAdmin  | Create `TokenRules` on global synchronizer (single-party)                                                                                                                                                                             | global                  |
| 6b   | TokenAdmin  | Create `TokenRules` on app-synchronizer (single-party, parallel with 6a)                                                                                                                                                              | app                     |
| 6c   | TokenAdmin  | Create `Token` (owner=TokenAdmin) on app-synchronizer — single-party because owner=admin=TokenAdmin                                                                                                                                   | app                     |
| 6d   | TokenAdmin  | `TransferFactory_Transfer` on app `TokenRules` → `TokenTransferOffer` to Bob — single-party (sender=TokenAdmin)                                                                                                                       | app                     |
| 6e   | Bob         | `TransferInstruction_Accept` → `Token` (owner=Bob, admin=TokenAdmin) on app-synchronizer — single-party (Bob is receiver/controller)                                                                                                  | app                     |
| 7a   | Alice       | Create `OTCTradeProposal` (2 legs)                                                                                                                                                                                                    | global                  |
| 7b   | Bob         | `OTCTradeProposal_Accept`                                                                                                                                                                                                             | global                  |
| 7c   | Trading App | `OTCTradeProposal_InitiateSettlement` → `OTCTrade` created                                                                                                                                                                            | global                  |
| 8    | —           | Read `OTCTrade` contract ID                                                                                                                                                                                                           | global                  |
| 9    | Alice       | `AllocationFactory_Allocate` (Amulet, leg-0) — single-party                                                                                                                                                                           | global                  |
| 10   | Bob         | `ledger.internal.reassign` Bob's `Token` app→global (interactive submission cannot auto-reassign multi-signatory contracts with single `actAs`), then `AllocationFactory_Allocate` (TestToken, leg-1), disclosing global `TokenRules` | app → global (explicit) |
| 11a  | —           | Locate Bob's TestToken allocation                                                                                                                                                                                                     | global                  |
| 11b  | Trading App | `OTCTrade_Settle` — single-party TradingApp submission                                                                                                                                                                                | global                  |
| 12   | Alice       | `TransferFactory_Transfer` self-transfer; Canton auto-reassigns Alice's `Token` to app-synchronizer                                                                                                                                   | global → app (auto)     |
| 12   | Bob         | `ledger.internal.reassign` — reassign remaining `Token` holding(s) to app-synchronizer (parallel with Alice's step 12)                                                                                                                | global → app            |

## Troubleshooting

### `Required DAR not found`

Verify the DAR files are present in their expected locations:

```bash
# Trading-app DAR — fetched into .localnet/dars/ by yarn script:fetch:localnet
ls -la .localnet/dars/splice-token-test-trading-app-1.0.0.dar

# Test-token DAR — bundled in the script directory
ls -la docs/wallet-integration-guide/examples/scripts/15-multi-sync/splice-test-token-v1-1.0.0.dar
```

### `App synchronizer not found (alias: app-synchronizer)`

This error means the `app-user` participant is not connected to the app-synchronizer.
The `scripts/localnet/app-synchronizer.sc` bootstrap script must connect **both**
`app-provider` and `app-user` to the app-synchronizer. Check that you are using
the current version of that file (it should reference both participants).

Check that the `multi-sync-startup` bootstrap container ran to completion:

```bash
docker logs $(docker ps -a --filter name=multi-sync-startup --format "{{.ID}}")
```

The last line should read:

```
app-synchronizer bootstrap with package vetting completed successfully for app-provider and app-user
```

If localnet was started with an older version of the bootstrap script, restart it:

```bash
yarn stop:localnet -- --multi-sync
yarn start:localnet -- --multi-sync
```

### `No connected synchronizers found`

Localnet may still be initialising. Wait until all containers show `(healthy)`:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Docker containers not starting

Ensure Docker Desktop has enough resources (≥ 8 GB RAM, ≥ 4 CPUs recommended).
Check current usage:

```bash
docker stats --no-stream
```
