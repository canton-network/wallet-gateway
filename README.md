# Wallet Gateway

A TypeScript framework for building wallet integrations on the [Canton Network](https://www.canton.network/). It provides the **Wallet Gateway** (server and browser extension), the **dApp SDK**, the **Wallet SDK**, and a set of shared core modules.

## Architecture

```
┌─────────────┐      dApp API (CIP-103)    ┌──────────────────┐     Ledger API      ┌──────────────────┐
│   Your dApp │ ◄────────────────────────► │  Wallet Gateway  │ ◄─────────────────► │ Canton Validator │
│ (dApp SDK)  │    (HTTP / postMessage)    │                  │                     │                  │
└─────────────┘                            │  ┌────────────┐  │     Signing         └──────────────────┘
       │                                   │  │  User API  │  │
       │      User interactions            │  │  User UI   │  │     ┌──────────────────┐
       └──────────────────────────────────►│  └────────────┘  │ ◄──►│ Signing Provider │
              (User UI / User API)         │                  │     │ (Participant,    │
                                           └──────────────────┘     │  Fireblocks, …)  │
                                                                    └──────────────────┘
```

- **dApp → Wallet Gateway**: dApps use the dApp SDK to call the **dApp API**.
- **User → Wallet Gateway**: Users manage wallets and approve transactions via the **User UI**.
- **Wallet Gateway → Canton / Signing**: The Gateway authenticates to validator Ledger APIs and forwards signing requests to the configured signing provider.

## dApp API (CIP-103)

The **dApp API** is a JSON-RPC 2.0 interface specified by [CIP-103](https://github.com/canton-foundation/cips/blob/main/cip-0103/cip-0103.md). It defines how dApps communicate with wallet providers on the Canton Network. Key methods include:

The dApp SDK (`@canton-network/dapp-sdk`) implements this protocol and adds a higher-level API, multi-transport support, and an [EIP-1193](https://eips.ethereum.org/EIPS/eip-1193)-style provider (`window.canton`).

## Wallet SDK

The **Wallet SDK** (`@canton-network/wallet-sdk`) is a TypeScript SDK for wallet providers and exchanges integrating directly with the Canton Network.
Unlike the dApp SDK (which talks to a Wallet Gateway), the Wallet SDK operates at a lower level — authenticating to synchronizers, allocating parties with external keypairs, reading active contracts, and signing and submitting transactions.

Key capabilities:

- Authenticate and connect to a Canton synchronizer
- Allocate parties with an external keypair
- Read active contracts on the ledger
- Decode and validate prepared transactions
- Sign and submit transactions via the Ledger API
- Integrate with the Token Standard

See the [Wallet SDK README](sdk/wallet-sdk) and the [integration guide](https://docs.digitalasset.com/integrate/devnet/index.html) for usage details.

## Project Structure

### Wallet Gateway

Two implementations of the Wallet Gateway, both exposing the same dApp API and User API:

| Package                                    | Path                                                   | Description                                                                                                                                       |
| ------------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@canton-network/wallet-gateway-remote`    | [`wallet-gateway/remote`](wallet-gateway/remote)       | Server-side implementation over HTTP (Express.js). Connects to SQL stores and external signing providers.                                         |
| `@canton-network/wallet-gateway-extension` | [`wallet-gateway/extension`](wallet-gateway/extension) | [NOT IMPLEMENTED YET] Client-side implementation as a Manifest V3 browser extension. Uses browser storage for persistence and in-browser signing. |

### SDKs

| Package                      | Path                               | Description                                                                                                           |
| ---------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `@canton-network/dapp-sdk`   | [`sdk/dapp-sdk`](sdk/dapp-sdk)     | Browser SDK for dApp development. Implements the CIP-103 dApp API with multi-transport support (HTTP, `postMessage`). |
| `@canton-network/wallet-sdk` | [`sdk/wallet-sdk`](sdk/wallet-sdk) | SDK for wallet providers and exchanges to integrate with Canton and the Token Standard.                               |

### Core Modules

Shared libraries used by the Wallet Gateway, SDKs, and signing providers:

| Package                       | Path                                                         | Description                                                             |
| ----------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------- |
| **Store**                     |                                                              |                                                                         |
| `core-wallet-store`           | [`core/wallet-store`](core/wallet-store)                     | Store interface for wallets, sessions, networks, IDPs, and transactions |
| `core-wallet-store-sql`       | [`core/wallet-store-sql`](core/wallet-store-sql)             | SQL implementation (SQLite / PostgreSQL) via Kysely                     |
| `core-wallet-store-inmemory`  | [`core/wallet-store-inmemory`](core/wallet-store-inmemory)   | In-memory implementation for testing and development                    |
| **Signing**                   |                                                              |                                                                         |
| `core-signing-lib`            | [`core/signing-lib`](core/signing-lib)                       | Core library and interfaces for signing driver implementations          |
| `core-signing-store-sql`      | [`core/signing-store-sql`](core/signing-store-sql)           | SQL persistence for signing keys and transactions                       |
| `core-signing-internal`       | [`core/signing-internal`](core/signing-internal)             | Internal (wallet-kernel) signing driver using Ed25519                   |
| `core-signing-participant`    | [`core/signing-participant`](core/signing-participant)       | Canton participant-managed signing driver                               |
| `core-signing-fireblocks`     | [`core/signing-fireblocks`](core/signing-fireblocks)         | Fireblocks signing driver integration                                   |
| `core-signing-blockdaemon`    | [`core/signing-blockdaemon`](core/signing-blockdaemon)       | Blockdaemon signing driver integration                                  |
| **RPC & Transport**           |                                                              |                                                                         |
| `core-types`                  | [`core/types`](core/types)                                   | Shared types and transport-agnostic parsers                             |
| `core-rpc-transport`          | [`core/rpc-transport`](core/rpc-transport)                   | RPC transport implementations                                           |
| `core-rpc-errors`             | [`core/rpc-errors`](core/rpc-errors)                         | Standardized JSON-RPC error types                                       |
| `core-rpc-generator`          | [`core/rpc-generator`](core/rpc-generator)                   | Code generator for JSON-RPC interfaces                                  |
| **Auth & Ledger**             |                                                              |                                                                         |
| `core-wallet-auth`            | [`core/wallet-auth`](core/wallet-auth)                       | Authentication middleware and user management (JWT, OAuth)              |
| `core-ledger-client`          | [`core/ledger-client`](core/ledger-client)                   | TypeScript Canton Ledger API client (generated from OpenAPI)            |
| `core-ledger-client-types`    | [`core/ledger-client-types`](core/ledger-client-types)       | Type definitions for the Ledger API client                              |
| **UI & Clients**              |                                                              |                                                                         |
| `core-wallet-ui-components`   | [`core/wallet-ui-components`](core/wallet-ui-components)     | Reusable Lit web components for wallet UIs                              |
| `core-wallet-user-rpc-client` | [`core/wallet-user-rpc-client`](core/wallet-user-rpc-client) | Generated RPC client for the User API                                   |
| `core-wallet-dapp-rpc-client` | [`core/wallet-dapp-rpc-client`](core/wallet-dapp-rpc-client) | Generated RPC client for the dApp API                                   |
| **Splice**                    |                                                              |                                                                         |
| `core-splice-client`          | [`core/splice-client`](core/splice-client)                   | Client for Splice network services                                      |
| `core-splice-provider`        | [`core/splice-provider`](core/splice-provider)               | Splice network provider integration                                     |
| `core-token-standard`         | [`core/token-standard`](core/token-standard)                 | Canton Token Standard implementation                                    |

### Examples

| Path                                       | Description                                                       |
| ------------------------------------------ | ----------------------------------------------------------------- |
| [`examples/ping`](examples/ping)           | Minimal dApp demonstrating connect, prepare, and execute flows    |
| [`examples/portfolio`](examples/portfolio) | Portfolio dApp showcasing account listing and transaction history |

### Documentation

| Path                                                             | Description                                       |
| ---------------------------------------------------------------- | ------------------------------------------------- |
| [`docs/dapp-building`](docs/dapp-building)                       | dApp building guide (dApp SDK, Wallet Gateway)    |
| [`docs/wallet-integration-guide`](docs/wallet-integration-guide) | Step-by-step integration guide with code examples |
| [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md)                   | Contribution guidelines                           |
| [`docs/GLOSSARY.md`](docs/GLOSSARY.md)                           | Terminology reference                             |

## Getting Started

### Prerequisites

- Node.js 20+
- Yarn 4 (Corepack)
- A running Canton participant node (or use the included local setup)

### Quick Start

```bash
# Install dependencies
yarn install

# Build everything
yarn build:all

# Start all services (Wallet Gateway, mock OAuth, Example dApps, etc.)
yarn start:all

# Start a local Canton Participant Node
yarn start:canton
```

Active processes can be monitored with:

```bash
yarn pm2 list
```

To stop everything:

```bash
yarn stop:all
```

### Running the Browser Extension

TBD.

## Contributing

For information about contributing, please refer to the [Contributing Guide](docs/CONTRIBUTING.md).

## License

Apache-2.0
