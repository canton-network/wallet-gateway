# Signing Providers

The Wallet Gateway supports multiple signing providers that handle cryptographic key management and transaction signing. Each provider has different use cases and security characteristics.

## Available Providers

## Wallet Kernel (Internal)

The Wallet Kernel provider stores private keys directly in the signing store database. This is suitable for development and testing but **not recommended for production** use cases where security is critical.

**Configuration:**

This provider is automatically available when a `signingStore` is configured in the Gateway configuration. No additional setup is required.

**Use Cases:**

- Local development
- Testing environments
- Proof-of-concept applications

**Security Considerations:**

> [!IMPORTANT]
> Private keys are stored in the database. If the database is compromised, all keys are at risk. Use only in non-production environments.

## Participant-Based Signing

The Participant signing provider uses Canton's participant node for signing transactions. The participant maintains the key material and handles all cryptographic operations.

**Configuration:**

This provider is always available and requires no additional configuration. You simply select it when creating a party.

**Use Cases:**

- Enterprise deployments where the participant node manages keys
- Scenarios where key management is handled by the infrastructure
- Production environments with dedicated participant nodes

**How it Works:**

When a transaction is submitted, the Gateway forwards the command to the participant node, which signs it using the party's key stored in the participant's keystore.

## Fireblocks

Fireblocks is a third-party crypto custody service provider that offers enterprise-grade key management and signing services.

**Setup:**

1. Complete steps 1-3 from the [Fireblocks signing documentation](https://github.com/hyperledger-labs/splice-wallet-kernel/tree/main/core/signing-fireblocks)

2. Supply an environment variable named `FIREBLOCKS_API_KEY` containing your Fireblocks API key (from the `API User (ID)` column in the Fireblocks API users table).

**Configuration:**

The Fireblocks provider reads configuration from environment variables and key files. No additional Gateway configuration is needed beyond placing the required files.

**Use Cases:**

- Enterprise deployments requiring HSM-backed key storage
- Compliance-sensitive applications
- High-security production environments

## Blockdaemon

Blockdaemon provides signing services as part of their infrastructure offerings.

**Configuration:**

Set the following environment variables:

- `BLOCKDAEMON_API_URL` - The base URL for the Blockdaemon API
- `BLOCKDAEMON_API_KEY` - Your Blockdaemon API key

**Use Cases:**

- Managed infrastructure deployments
- Cloud-native applications
- Environments leveraging Blockdaemon's services

## Dfns

Dfns is a crypto custody platform that provides programmable key management and signing infrastructure.

**Configuration:**

Set the following environment variables:

- `DFNS_ORG_ID` - Your Dfns organization ID
- `DFNS_BASE_URL` - The Dfns API URL (defaults to `https://api.dfns.io`)
- `DFNS_CRED_ID` - Your service account credential ID
- `DFNS_PRIVATE_KEY` - Your service account private key (PEM format)
- `DFNS_AUTH_TOKEN` - Your service account authentication token

**Prerequisites:**

1. Set up a service account with appropriate permissions in Dfns
2. Generate and download the service account credentials

**Use Cases:**

- Enterprise deployments requiring MPC-based key management
- Programmable custody with policy controls
- Multi-party approval workflows
- High-security production environments

**How it Works:**

Dfns creates and activates Canton wallets directly through its validator integration. When the Gateway requests a wallet, Dfns provisions a Canton-formatted key, registers the party on the network, and returns the wallet ready for use. When signing a prepared transaction, Dfns broadcasts it to Canton in a single step and returns the resulting update ID. Only `Canton` and `CantonTestnet` network wallets are supported.

## Selecting a Provider

When creating a new party through the User API or web UI, you can select which signing provider to use. The choice depends on your security requirements, infrastructure setup, and compliance needs.

**Recommendations:**

- **Development/Testing**: Use Wallet Kernel (internal) or Participant-based signing
- **Production (Enterprise)**: Use Fireblocks, Dfns, or Participant-based signing
- **Production (Managed)**: Use Blockdaemon, Dfns, or Participant-based signing

The signing provider is selected per-party, so you can have different parties using different providers within the same Gateway instance.

## Key Management

Each provider handles key management differently:

- **Wallet Kernel**: Keys are stored in the signing store database
- **Participant**: Keys are managed by the Canton participant node
- **Fireblocks**: Keys are stored in Fireblocks' secure infrastructure (HSM-backed)
- **Blockdaemon**: Keys are managed by Blockdaemon's infrastructure
- **Dfns**: Keys are managed by Dfns' secure infrastructure

When migrating between providers, keys cannot be directly transferred. You'll need to:

1. Create a new party with the new provider
2. Transfer any assets/contracts to the new party
3. Update your dApp to use the new party
