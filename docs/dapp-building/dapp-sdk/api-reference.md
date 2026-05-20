# API Reference

The dApp SDK implements the **dApp API** as defined in [CIP-0103](https://github.com/canton-foundation/cips/blob/main/cip-0103/cip-0103.md). The API provides a standardized, transport-agnostic interface that enables decentralized applications (dApps) to securely interact with the Canton Network via Wallets.

The dApp API exists in two variants, each targeting a different deployment model and interaction pattern.

## OpenRPC Specifications

The machine-readable API specifications are maintained in the repository:

- **Sync API**: [openrpc-dapp-api.json](https://github.com/canton-network/wallet/blob/main/api-specs/openrpc-dapp-api.json)
- **Async API**: [openrpc-dapp-remote-api.json](https://github.com/canton-network/wallet/blob/main/api-specs/openrpc-dapp-remote-api.json)

## Synchronous dApp API (Sync API)

The **Synchronous dApp API** is intended for clients that have direct access to a Wallet, such as browser extensions or desktop applications.
In this model, methods and events are executed in a standard request-response fashion, allowing dApps to perform ledger reads, transaction preparation, and signing operations immediately.

This variant is the canonical choice for end-user applications, providing a familiar synchronous programming model and minimizing latency between user actions and dApp responses.

**Methods:**

| Method              | Output        | Description                                                     |
| ------------------- | ------------- | --------------------------------------------------------------- |
| `connect`           | ConnectResult | Establishes a connection to the Wallet                          |
| `disconnect`        | void          | Closes the session between the client and the provider          |
| `isConnected`       | ConnectResult | Indicates connectivity to the Wallet                            |
| `status`            | StatusEvent   | Contains information regarding the connected Wallet and Network |
| `getActiveNetwork`  | Network       | Details of the connected network                                |
| `listAccounts`      | Account[]     | Lists all accounts the user has access to                       |
| `getPrimaryAccount` | Account       | Returns the single account set as primary                       |
| `signMessage`       | string        | Signs an arbitrary string message                               |
| `prepareExecute`    | void          | Prepares, signs, and executes Daml commands                     |
| `ledgerApi`         | string        | Proxies requests to the JSON Ledger API                         |

**Events:**

| Event             | Payload              | Description                                                                           |
| ----------------- | -------------------- | ------------------------------------------------------------------------------------- |
| `accountsChanged` | AccountsChangedEvent | Emitted when accounts change; contains all accounts and indicates the primary account |
| `statusChanged`   | StatusEvent          | Emitted when provider status changes (authentication, network connectivity)           |
| `txChanged`       | TxChangedEvent       | Announces changes to the lifecycle of initiated transactions                          |

## Asynchronous dApp API (Async API)

The **Asynchronous dApp API** is designed for server-side Wallets or Wallets deployed as remote services, where synchronous interactions are not feasible due to transport limitations (e.g., HTTP request timeouts) or the need for multi-step user authorization.

This variant mirrors the Sync API but decomposes operations that require user interaction into multi-phase workflows. For such operations, the API returns a `userUrl` that directs the user to complete the required action (e.g., login or transaction approval), and emits the corresponding event once the action is finalized.

**Key Differences from Sync API:**

| Method           | Output                                | Difference                                                                                                                                                         |
| ---------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `connect`        | { ...ConnectResult, userUrl: string } | If no prior connection exists, returns a `userUrl` pointing to a login facility. After successful login, a `connected` event is emitted.                           |
| `prepareExecute` | { userUrl: string }                   | Returns a `userUrl` pointing to a review facility where the user can approve or decline signing. A `txChanged` event is emitted after the prepare phase completes. |

**Additional Event:**

| Event       | Payload     | Description                                                                |
| ----------- | ----------- | -------------------------------------------------------------------------- |
| `connected` | StatusEvent | Same payload as `statusChanged` but only emitted as part of the login flow |

## Choosing Between Sync and Async API

| Consideration        | Sync API                                 | Async API                            |
| -------------------- | ---------------------------------------- | ------------------------------------ |
| **Deployment Model** | Client-side (browser extension, desktop) | Server-side, remote custody services |
| **User Interaction** | Direct, real-time                        | Via `userUrl` redirects              |
| **Blocking Calls**   | Supported                                | Not supported                        |
| **Transport**        | postMessage, in-app bridges              | HTTPS, SSE                           |

Clients such as frontends that work against the Sync API **should** also work against a server exposing the Async API. The dApp SDK provides this compatibility by implementing the Sync API interface while relaying calls to an Async API server internally.

## Provider Interface

Both API variants are accessed through a **Provider** interface, following the pattern established by [EIP-1193](https://eips.ethereum.org/EIPS/eip-1193):

```typescript
interface Provider {
    request<T>(args: {
        method: string
        params?: unknown[] | Record<string, unknown>
    }): Promise<T>
    on<T>(event: string, listener: (...args: T[]) => void): Provider
    emit<T>(event: string, ...args: T[]): boolean
    removeListener<T>(event: string, listener: (...args: T[]) => void): Provider
}
```

## Error Codes

The dApp API adopts standardized error codes from [EIP-1193](https://eips.ethereum.org/EIPS/eip-1193) and [EIP-1474](https://eips.ethereum.org/EIPS/eip-1474):

| Code   | Message               | Meaning                                              |
| ------ | --------------------- | ---------------------------------------------------- |
| 4001   | User Rejected Request | The user rejected the request                        |
| 4100   | Unauthorized          | The requested method/account has not been authorized |
| 4200   | Unsupported Method    | The Provider does not support the requested method   |
| 4900   | Disconnected          | The Provider is disconnected from all chains         |
| 4901   | Chain Disconnected    | The Provider is not connected to the requested chain |
| -32700 | Parse error           | Invalid JSON                                         |
| -32600 | Invalid request       | JSON is not a valid request object                   |
| -32601 | Method not found      | Method does not exist                                |
| -32602 | Invalid params        | Invalid method parameters                            |
| -32603 | Internal error        | Internal JSON-RPC error                              |

For the complete specification, refer to [CIP-0103](https://github.com/canton-foundation/cips/blob/main/cip-0103/cip-0103.md).
