# dApp SDK

**`@canton-network/dapp-sdk`** — TypeScript SDK for building decentralized applications on the [Canton Network](https://www.canton.network/). Connect users to Canton wallets, manage accounts, sign messages, and execute transactions — all through a vendor-neutral interface defined by [CIP-0103](https://github.com/canton-foundation/cips/blob/main/cip-0103/cip-0103.md).

> [!IMPORTANT]
> This project is under active development and may introduce breaking changes until version 1.0.0. Migration guides for each release are published in [Discussions](https://github.com/canton-network/wallet/discussions).

## Features

- **Wallet Discovery** — Remote gateways, EIP-6963-style `canton:announceProvider` events, and pluggable adapters
- **Wallet Picker UI** — Built-in, framework-agnostic Web Component that lets users choose a wallet, enter custom gateway URLs, and manage recently used connections
- **Wallet Connectivity** — Connect, disconnect, and monitor connection status
- **Account Management** — List accounts and respond to account changes
- **Transaction Execution** — Request user approval and signatures for Daml transactions
- **Ledger API Access** — Proxy authenticated requests to the Canton JSON Ledger API
- **Real-time Events** — Subscribe to status changes, account changes, and transaction lifecycle events
- **Multi-transport** — HTTP/SSE for remote Wallet Gateways, `postMessage` for browser extension wallets
- **Provider Interface** — `window.canton` provider following CIP-103 conventions

## Installation

```shell
npm install @canton-network/dapp-sdk
```

```shell
yarn add @canton-network/dapp-sdk
```

```shell
pnpm add @canton-network/dapp-sdk
```

## Quick Start

The fastest way to get going is through the module-level convenience API. It manages a singleton `DappClient` behind the scenes, opens the wallet picker, and handles adapter registration for you.

```typescript
import * as sdk from '@canton-network/dapp-sdk'

// Opens the wallet picker and connects to the selected wallet
const result = await sdk.connect()
console.log(result.isConnected)

// List the user's accounts (parties)
const accounts = await sdk.listAccounts()

// Execute a transaction
await sdk.prepareExecute({
    commands: [
        {
            CreateCommand: {
                templateId: '#MyApp:MyModule:MyTemplate',
                createArguments: { owner: accounts[0].partyId },
            },
        },
    ],
})

// Listen for real-time updates
sdk.onTxChanged((tx) => {
    console.log('Transaction update:', tx)
})

// Disconnect when done
await sdk.disconnect()
```

## Architecture

The SDK is built around three layers:

```
┌──────────────────────────────────────────────┐
│  DappClient                                  │
│  Thin wrapper: typed RPC helpers, events,    │
│  session persist                             │
├──────────────────────────────────────────────┤
│  DiscoveryClient                             │
│  Adapter registry, session restore,          │
│  wallet picker integration                   │
├──────────────────────────────────────────────┤
│  ProviderAdapter implementations             │
│  ExtensionAdapter (announce protocol)        │
│  (browser / postMessage)                     │
│  RemoteAdapter (HTTP/SSE gateway)            │
└──────────────────────────────────────────────┘
```

## Wallet providers

Wallet and extension authors: see **[Wallet providers (discovery)](https://github.com/canton-network/wallet/blob/main/docs/dapp-building/dapp-sdk/provider.md)** in the dApp Building docs for how to appear in the picker (`RemoteAdapter`, `canton:announceProvider`, and `additionalAdapters`).

## Usage

### Option A: Module-level API (recommended for most apps)

Import the SDK as a namespace. The `connect()` function opens the built-in wallet picker, registers available adapters, and returns a `ConnectResult`.

```typescript
import * as sdk from '@canton-network/dapp-sdk'
import { RemoteAdapter } from '@canton-network/dapp-sdk'

await sdk.connect()
const status = await sdk.status()
```

You can supply additional adapters at connect time:

```typescript
await sdk.connect({
    additionalAdapters: [
        new RemoteAdapter({
            name: 'My Gateway',
            rpcUrl: 'https://gateway.example.com/api/json-rpc',
        }),
    ],
})
```

### Option B: DappClient with DiscoveryClient

For more control over adapter registration and the connection flow, use `DiscoveryClient` directly and pass the resulting provider to `DappClient`.

```typescript
import {
    DappClient,
    DiscoveryClient,
    RemoteAdapter,
} from '@canton-network/dapp-sdk'

const discovery = await DiscoveryClient.create({
    adapters: [
        new RemoteAdapter({
            name: 'Splice Wallet Gateway',
            rpcUrl: 'https://gateway.example.com/api/json-rpc',
        }),
    ],
})
await discovery.connect() // opens the picker if configured

const session = discovery.getActiveSession()!
const client = new DappClient(session.provider, {
    providerType: session.adapter.type,
})

const status = await client.status()
```

### Option C: DappClient with a provider directly

If you already have a `Provider<DappRpcTypes>` (for example from your own adapter), you can skip discovery entirely.

```typescript
import { DappClient, RemoteAdapter } from '@canton-network/dapp-sdk'

const provider = new RemoteAdapter({
    name: 'Splice Wallet Gateway',
    rpcUrl: 'https://gateway.example.com/api/json-rpc',
}).provider()

const client = new DappClient(provider)
const result = await client.connect()
```

## API Reference

### DappClient

| Method                          | Returns                       | Description                          |
| ------------------------------- | ----------------------------- | ------------------------------------ |
| `connect()`                     | `ConnectResult`               | Initiate connection via the provider |
| `disconnect()`                  | `void`                        | Disconnect and clear local state     |
| `status()`                      | `StatusEvent`                 | Current connection status            |
| `listAccounts()`                | `ListAccountsResult`          | List the user's accounts (parties)   |
| `prepareExecute(params)`        | `null`                        | Submit a transaction for signing     |
| `prepareExecuteAndWait(params)` | `PrepareExecuteAndWaitResult` | Submit and wait for completion       |
| `ledgerApi(params)`             | `LedgerApiResult`             | Proxy a Ledger API request           |
| `open()`                        | `void`                        | Open the wallet UI                   |
| `getProvider()`                 | `Provider`                    | Access the underlying provider       |
| `onStatusChanged(listener)`     | `void`                        | Subscribe to status changes          |
| `onAccountsChanged(listener)`   | `void`                        | Subscribe to account changes         |
| `onTxChanged(listener)`         | `void`                        | Subscribe to transaction changes     |

### DappClientOptions

| Option         | Type           | Default    | Description                                                               |
| -------------- | -------------- | ---------- | ------------------------------------------------------------------------- |
| `providerType` | `ProviderType` | `'remote'` | Affects `open()` routing (`'browser'` uses postMessage, others use popup) |

### DiscoveryClient

| Method                           | Description                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------- |
| `create(config)`                 | Create an initialized client and attempt session restore                      |
| `registerAdapter(adapter)`       | Add a `ProviderAdapter` at runtime                                            |
| `listAdapters()`                 | List registered adapters                                                      |
| `connect(providerId?)`           | Connect to a specific adapter or open the picker                              |
| `disconnect()`                   | Disconnect the active session                                                 |
| `getActiveSession()`             | Get the current `ActiveSession` or `null`                                     |
| `on(event, handler)`             | Listen for `discovery:connected`, `discovery:disconnected`, `discovery:error` |
| `removeListener(event, handler)` | Remove an event listener                                                      |

### Built-in Adapters

| Adapter            | Provider Type | Transport     | Description                                                                                                                                                                         |
| ------------------ | ------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ExtensionAdapter` | `'browser'`   | `postMessage` | Browser extensions discovered via `canton:announceProvider` ([Wallet providers guide](https://github.com/canton-network/wallet/blob/main/docs/dapp-building/dapp-sdk/provider.md)). |
| `RemoteAdapter`    | `'remote'`    | HTTP/SSE      | CIP-103 Wallet Gateways over the network.                                                                                                                                           |

## Documentation

Full documentation, including detailed usage guides, API reference, and configuration for the Wallet Gateway:

- [dApp Building Guide](https://github.com/canton-network/wallet/tree/main/docs/dapp-building)
- [dApp SDK Documentation](https://github.com/canton-network/wallet/tree/main/docs/dapp-building/dapp-sdk)
- [Wallet providers (discovery)](https://github.com/canton-network/wallet/blob/main/docs/dapp-building/dapp-sdk/provider.md)
- [API Specifications (OpenRPC)](https://github.com/canton-network/wallet/tree/main/api-specs)
- [Example dApps](https://github.com/canton-network/wallet/tree/main/examples)

## License

[Apache-2.0](https://github.com/canton-network/wallet/blob/main/LICENSE)
