# WalletConnect “Wallet” (WalletKit) Example

This example is a small **Vite + React** app that runs a **WalletConnect v2 Wallet** using **Reown WalletKit** (`@reown/walletkit`). It’s intended for local development/testing with the Wallet Gateway ecosystem.

## What this is (and isn’t)

- **This is**: a “wallet-side” WalletConnect implementation (a wallet UI that can accept session proposals + requests).
- **This isn’t**: the dApp-side integration (see `examples/ping/` for a dApp that connects to wallets).

## Prerequisites

- **Node/Yarn**: use the repo’s normal toolchain (workspace/Yarn).
- **WalletConnect Cloud project**: you need a `VITE_WC_PROJECT_ID`.

## Configure

Create or edit `examples/wallet-connect-server/.env`:

```bash
# WalletConnect Cloud project ID (get one at https://dashboard.walletconnect.com/)
VITE_WC_PROJECT_ID=...
```

## Run

From the repo root:

```bash
yarn workspace @canton-network/example-wallet-connect-server dev
```

Or from this folder:

```bash
yarn dev
```

Then open the URL printed by Vite (usually `http://localhost:5173`).

## Using it with other examples

- Pair a dApp (for example `examples/ping/`) with this wallet by using the WalletConnect flow (QR / pairing URI), then approve proposals/requests in this UI.

## Notes on the folder name

`wallet-connect-server` is reasonable, but a slightly more explicit name would be one of:

- `walletconnect-walletkit-wallet`
- `walletconnect-wallet`
- `walletconnect-wallet-ui`

If you want, I can rename the folder and update workspace references.
