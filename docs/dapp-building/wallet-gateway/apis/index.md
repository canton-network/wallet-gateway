# APIs

The Wallet Gateway exposes two JSON-RPC 2.0 APIs: one for dApps interactions and one for user interactions. Both APIs use the same base URL but different paths.

## API Endpoints

- **dApp API**: `/api/v0/dapp` - Used by decentralized applications to interact with wallets and submit transactions
- **User API**: `/api/v0/user` - Used by users to manage wallets, networks, and signing providers

Both APIs follow the JSON-RPC 2.0 specification and use JWT-based authentication for secure access.

## dApp API Reference

The dApp API enables decentralized applications to connect to wallets, query ledger state, prepare transactions, and submit commands. This API is designed for programmatic access from web or mobile applications.

**Authentication:**

The dApp API requires a valid JWT token in the `Authorization` header:

```text
Authorization: Bearer <jwt-token>
```

**Full API Specification:**

The complete OpenRPC specification is available at [openrpc-dapp-api.json](https://github.com/canton-network/wallet/blob/main/api-specs/openrpc-dapp-api.json).

## User API Reference

The User API enables users to manage their wallets, configure networks, manage identity providers, create parties, and interact with their wallet through the web UI.

**Methods:**

| Category           | Method                 | Description                                                         |
| ------------------ | ---------------------- | ------------------------------------------------------------------- |
| Sessions           | `addSession()`         | Create a new session (unauthenticated, used for initial connection) |
|                    | `removeSession()`      | End the current session                                             |
|                    | `listSessions()`       | List sessions for the current user                                  |
| Networks           | `listNetworks()`       | List all configured networks                                        |
|                    | `addNetwork()`         | Add a new network configuration                                     |
|                    | `removeNetwork()`      | Remove a network configuration                                      |
| Identity Providers | `listIdps()`           | List all identity providers                                         |
|                    | `addIdp()`             | Add a new identity provider                                         |
|                    | `removeIdp()`          | Remove an identity provider                                         |
| Wallets            | `createWallet()`       | Create a new wallet (party) on a network                            |
|                    | `listWallets()`        | List all wallets for the current user                               |
|                    | `setPrimaryWallet()`   | Set the primary wallet                                              |
|                    | `removeWallet()`       | Remove a wallet                                                     |
|                    | `syncWallets()`        | Sync wallets with the ledger                                        |
|                    | `isWalletSyncNeeded()` | Check if wallet sync is needed                                      |
| Transactions       | `sign()`               | Sign a transaction                                                  |
|                    | `execute()`            | Execute a signed transaction                                        |
|                    | `getTransaction()`     | Get a transaction by ID                                             |
|                    | `listTransactions()`   | List transactions                                                   |

**Authentication:**

Most User API methods require authentication via JWT token. However, the following methods are available without authentication:

- `addSession()`
- `listNetworks()`
- `listIdps()`

**Full API Specification:**

The complete OpenRPC specification is available at [openrpc-user-api.json](https://github.com/canton-network/wallet/blob/main/api-specs/openrpc-user-api.json).

## Server-Sent Events (SSE) Support

The dApp API supports Server-Sent Events (SSE) for real-time notifications. Connect to the `/events` path relative to the dApp API base URL (e.g. `/api/v0/dapp/events`). Authenticate by passing the JWT token as the `token` query parameter (the `Authorization: Bearer` header is also supported):

```javascript
const eventsUrl = new URL('events', dappApiUrl + '/')
eventsUrl.searchParams.set('token', jwtToken)
const eventSource = new EventSource(eventsUrl.toString())

eventSource.addEventListener('accountsChanged', (e) => {
    /* ... */
})
eventSource.addEventListener('statusChanged', (e) => {
    /* ... */
})
eventSource.addEventListener('connected', (e) => {
    /* ... */
})
eventSource.addEventListener('txChanged', (e) => {
    /* ... */
})
```

SSE connections receive real-time updates about:

- Transaction status changes (`txChanged`)
- Account changes (`accountsChanged`)
- Session/connection state (`connected`, `statusChanged`)

## Rate Limiting

API requests are rate-limited to prevent abuse. The default limits can be configured in the server configuration. Rate limit headers are included in responses:

- `X-RateLimit-Limit` - Maximum number of requests per window
- `X-RateLimit-Remaining` - Remaining requests in current window
- `X-RateLimit-Reset` - Time when the rate limit resets

## CORS Configuration

Cross-Origin Resource Sharing (CORS) is configured via the `allowedOrigins` setting in the server configuration. By default, all origins are allowed (`['*']`), but for production deployments, you should restrict this to known dApp origins.

Example Configuration:

```json
{
    "server": {
        "allowedOrigins": [
            "https://my-dapp.example.com",
            "https://another-dapp.example.com"
        ]
    }
}
```

Alternatively, you can allow all origins by setting `allowedOrigins` to `"*"`.

```json
{
    "server": {
        "allowedOrigins": ["*"]
    }
}
```
