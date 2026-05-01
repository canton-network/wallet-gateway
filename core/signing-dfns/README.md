# @canton-network/core-signing-dfns

This package provides a signing driver for integrating the Wallet Gateway with [Dfns](https://www.dfns.co/). It implements the `SigningDriverInterface` defined in `@canton-network/core-signing-lib`, allowing the Wallet Gateway to manage keys and sign transactions using Dfns's infrastructure.

## Installation

This package is part of the Splice Wallet Kernel monorepo and is typically installed as a workspace dependency.

```bash
yarn add @canton-network/core-signing-dfns
```

## Usage

The `DfnsSigningDriver` is designed to be used within the Wallet Gateway's signing architecture. It requires a configuration object containing Dfns organization details and credentials.

### Initialization

```typescript
import DfnsSigningDriver, {
    DfnsConfig,
    DfnsCredentials,
} from '@canton-network/core-signing-dfns'

const credentials: DfnsCredentials = {
    credId: 'your-credential-id',
    privateKey: 'your-private-key',
    authToken: 'your-auth-token',
}

const config: DfnsConfig = {
    orgId: 'your-dfns-org-id',
    baseUrl: 'https://api.dfns.io', // Dfns API URL
    credentials,
}

const driver = new DfnsSigningDriver(config)
```

### Features

Dfns is used as a sign-only provider: the driver creates ed25519 keys and produces hash signatures, while topology submission and ledger interaction happen on the Wallet Gateway against its configured validator (bring-your-own-validator).

- **Key Management**:
    - `createKey`: Creates a new ed25519 key in Dfns.
    - `getKeys`: Lists active Canton-compatible (`EdDSA` / `ed25519`) keys.
- **Signing**:
    - `signTransaction`: Submits a hash signing request to Dfns for the resolved key. Returns immediately with a signature id; signature bytes are fetched via `getTransaction` once Dfns reports the request as `Signed`.
- **Signature Status**:
    - `getTransaction`: Retrieves the status and signature for a previously submitted signing request.
    - `getTransactions`: Retrieves multiple signatures filtered by id or public key.
- **Configuration**:
    - `getConfiguration` / `setConfiguration`.

### Integration

This driver is intended to be registered with the `SigningController` in the Wallet Gateway, which manages multiple signing providers.

```typescript
// Example integration (conceptual)
import { SigningController } from '@canton-network/core-signing-internal' // or similar

const signingController = new SigningController()
signingController.registerDriver(driver)
```

## Configuration

The driver accepts a `DfnsConfig` object:

| Property      | Type              | Required | Description                                                  |
| :------------ | :---------------- | :------- | :----------------------------------------------------------- |
| `orgId`       | `string`          | Yes      | Your Dfns organization ID.                                   |
| `baseUrl`     | `string`          | Yes      | The base URL for the Dfns API (e.g., `https://api.dfns.io`). |
| `credentials` | `DfnsCredentials` | Yes      | Credentials used to authenticate with Dfns.                  |

### DfnsCredentials

Dfns uses two-layer authentication: a long-lived service account JWT plus per-request signing with a private key.

| Property     | Type     | Description                                                                                                                                                                                 |
| :----------- | :------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `credId`     | `string` | ID of the Dfns credential registered against the service account.                                                                                                                           |
| `privateKey` | `string` | PEM-encoded private key paired with `credId`. Signs every sensitive Dfns API request as a U2F-style second factor. Configured once; not derived from `authToken`.                           |
| `authToken`  | `string` | Long-lived service account bearer JWT issued by the Dfns dashboard. Does not auto-expire and is not regenerated from `privateKey`/`credId`; rotate by issuing a new token in the dashboard. |

### Wallet Gateway Configuration

When running the Wallet Gateway (Remote), the Dfns signing driver is configured using the following environment variables:

- `DFNS_ORG_ID`: Your Dfns organization ID.
- `DFNS_BASE_URL`: The base URL for the Dfns API. Defaults to `https://api.dfns.io` if not set.
- `DFNS_CRED_ID`: The default credential ID for Dfns API authentication.
- `DFNS_PRIVATE_KEY`: The private key for signing Dfns API requests.
- `DFNS_AUTH_TOKEN`: The authentication token for the Dfns API.

Example usage:

```bash
DFNS_ORG_ID="your-org-id" \
DFNS_BASE_URL="https://api.dfns.io" \
DFNS_CRED_ID="your-cred-id" \
DFNS_PRIVATE_KEY="your-private-key" \
DFNS_AUTH_TOKEN="your-auth-token" \
yarn start
```

## Canton Network Support

Keys are created with `scheme: EdDSA` and `curve: ed25519`. The driver lists and resolves only `Active` ed25519 keys. The Wallet Gateway is responsible for binding keys to a specific Canton network via its own party allocation flow.

## License

Apache-2.0
