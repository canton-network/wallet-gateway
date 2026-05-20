# Example 15: Multi-Synchronizer DvP Trade

This example implements a Delivery vs Payment (DvP) flow across two synchronizers: Amulet on the global synchronizer and a Token instrument on a private app-synchronizer, settled via the OTC Trading App using only single-party submissions.

## Running Locally

All commands are run from the **repository root** unless noted otherwise.

```bash
# Step 1: Fetch localnet bundle (first time or after a Splice version update)
yarn script:fetch:localnet

# Step 2: Start localnet in multi-sync mode
yarn start:localnet -- --multi-sync

# Step 3: Run the example
yarn workspace docs-wallet-integration-guide-examples run-15

# Step 4: Stop when done (from the repository root)
yarn stop:localnet -- --multi-sync
```
