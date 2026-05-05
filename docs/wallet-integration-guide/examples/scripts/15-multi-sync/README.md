# Example 15: Multi-Synchronizer DvP Trade

## Overview

This example implements a Delivery vs Payment (DvP) flow across multiple
synchronizers. It demonstrates how to orchestrate a trade between Amulet
(on a global synchronizer) and a Token instrument (on a private/app
synchronizer) using the OTC Trading App.

Complete workflow covered:

- SDK initialization with multiple synchronizers
- Party allocation and registration across synchronizers
- Parallel asset minting (Amulet on global, Token on private)
- Multi-synchronizer trade settlement with multi-party signing
- Cross-synchronizer contract reassignment

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

The two DARs required by this example are bundled in the same folder as the script:

| DAR file                                     | Purpose                                                                            |
| -------------------------------------------- | ---------------------------------------------------------------------------------- |
| `splice-token-test-trading-app-v2-1.0.0.dar` | `OTCTrade` and `OTCTradeAllocationRequest` templates for orchestrating the trade   |
| `splice-test-token-v1-1.0.0.dar`             | `Token` and `TokenRules` templates — the custom instrument on the app-synchronizer |

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

If the DARs are missing from the script folder, example 15 will fail immediately with:
`Required DAR not found`

### Expected output

```
[v1-15-multi-sync-trade] Connected synchronizers: global, app-synchronizer
[v1-15-multi-sync-trade] All required DARs uploaded successfully
[v1-15-multi-sync-trade] All DARs vetted on app-synchronizer
[v1-15-multi-sync-trade] Parties allocated — alice: ..., bob: ..., tradingApp: ...
[v1-15-multi-sync-trade] alice: registered on app-synchronizer
[v1-15-multi-sync-trade] bob: registered on app-synchronizer
[v1-15-multi-sync-trade] tradingApp: registered on app-synchronizer
[v1-15-multi-sync-trade] Alice: Amulet holding minted (2,000,000)
[v1-15-multi-sync-trade] TokenRules created by Bob (on app-synchronizer)
[v1-15-multi-sync-trade] Bob: Token holding minted (500 TestToken, on app-synchronizer)
[v1-15-multi-sync-trade] OTCTrade created by Trading App
[v1-15-multi-sync-trade] Trading App: Allocation requests created
[v1-15-multi-sync-trade] Alice: Amulet allocation created for leg-0
[v1-15-multi-sync-trade] Bob: TestToken allocation created for leg-1 (on app-synchronizer)
[v1-15-multi-sync-trade] Trading App: OTCTrade settled
[v1-15-multi-sync-trade] Alice: TestToken self-transferred on app-synchronizer
[v1-15-multi-sync-trade] Final contract state after step 12 (Transfer): ...
```

## How it Works

| Step | Who         | What                                     | Synchronizer                                          |
| ---- | ----------- | ---------------------------------------- | ----------------------------------------------------- |
| 1    | —           | Upload DARs to ledger                    | global                                                |
| 2    | —           | Vet DARs on app-synchronizer             | app                                                   |
| 3    | —           | Create parties (Alice, Bob, Trading App) | global                                                |
| 4    | —           | Register all parties on app-synchronizer | app                                                   |
| 5    | SDK         | Mint 2,000,000 Amulet for Alice          | global                                                |
| 6    | Bob         | Create `TokenRules` contract             | app                                                   |
| 7    | Bob         | Mint 500 `TestToken` holding             | app                                                   |
| 8    | Trading App | Create `OTCTrade` (2 legs)               | global                                                |
| 9    | Trading App | `OTCTrade_RequestAllocations`            | global                                                |
| 10   | Alice       | `AllocationFactory_Allocate` (Amulet)    | global                                                |
| 11   | Bob         | `AllocationFactory_Allocate` (Token)     | app                                                   |
| 12   | Trading App | `OTCTrade_Settle` (multi-party signing)  | global (Canton auto-reassigns Bob's Token allocation) |
| 13   | Alice       | `TransferFactory_Transfer` self-transfer | app (Canton auto-reassigns Alice's Token from global) |

## Troubleshooting

### `Required DAR not found`

Verify the DAR files are present in the script folder:

```bash
ls -la docs/wallet-integration-guide/examples/scripts/15-multi-sync/splice-token-test-trading-app-v2-1.0.0.dar \
        docs/wallet-integration-guide/examples/scripts/15-multi-sync/splice-test-token-v1-1.0.0.dar
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
