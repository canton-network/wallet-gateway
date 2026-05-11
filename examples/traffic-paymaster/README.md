# Traffic paymaster example

Minimal **Daml** contracts plus a **React + Vite + Tailwind CSS** dApp using the workspace [`@canton-network/dapp-sdk`](../../sdk/dapp-sdk). The UI follows the traffic paymaster mock layout (wallet overview, conversion rates, local accounts, purchase form, events table). The on-chain **purchase** flow uses a `traffic-purchase:` command id prefix (stand-in for command metadata in the Traffic Accounting design).

## Daml

From this directory:

```bash
daml build
```

Run `Setup.setup` on your ledger (see `daml/Setup.daml`) and copy the logged contract ids into `.env`.

## Frontend

From the **repository root**:

```bash
yarn install
yarn workspace @canton-network/example-traffic-paymaster dev
```

Or from this directory after a root `yarn install`:

```bash
cp .env.example .env
# edit .env
yarn dev
```

Dev server defaults to **port 8083** (see `vite.config.ts`).

## Wallet-provided paymaster config

`src/paymaster-config.ts` reads optional `window.__CANTON_PAYMASTER_METADATA__` so a wallet can override hard-coded / env values in a future integration.
