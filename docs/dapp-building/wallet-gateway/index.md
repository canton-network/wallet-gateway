# Wallet Gateway

The Wallet Gateway is a JavaScript/TypeScript-based server that facilitates secure communication between decentralized applications (dApps), Canton Validator nodes, and Wallet Providers. It acts as a mediator, enabling seamless transaction signing and ledger interactions while maintaining the privacy and security guarantees of the Canton protocol.

> [!IMPORTANT]
> This guide is under active development, not all sections are complete and sections will be added and adjusted over time.

**What is Wallet Gateway?**

The Wallet Gateway enables transparent interaction between a dApp, Validator Node, and a Wallet Provider. Unlike public permissionless blockchains where a total state is shared amongst all nodes, Canton's unique approach to security and privacy results in fractured states shared amongst selected Validator nodes. Simply showing ownership of an associated private key does not reveal your entire financial data to a counter-party (such as a dApp).

**Wallet Gateway aims to**

- Maintain the high-level of security and trust inherent in the Canton Protocol
- Enable seamless communication between a dApp, Validator Node, and Signature Provider, similar in experience to other blockchains
- Provide transparency against malicious dApps, Validator Nodes, or Signature Providers
- Create a standardized communication framework that allows anybody to extend or integrate with the Wallet Gateway

**Key Features**

- **JSON-RPC APIs**: Two distinct APIs for dApp and user interactions
- **Multiple Signing Providers**: Support for participant-based signing, internal signing, Dfns, Fireblocks, and Blockdaemon
- **Flexible Identity Providers**: Support for OAuth 2.0 and self-signed JWT tokens
- **Network Management**: Configure and manage multiple Canton networks
- **Session Management**: Secure session handling with JWT authentication
- **Web UI**: User-friendly web interface for wallet management
- **Multiple Storage Backends**: Support for in-memory, SQLite, and PostgreSQL storage

## Contents

- [Getting Started](getting-started/index.md)
- [Configuration](configuration/index.md)
- [Usage](usage/index.md)
- [APIs](apis/index.md)
- [Signing Providers](signing-providers/index.md)
- [Deployment](deployment/index.md)
- [Troubleshooting](troubleshooting/index.md)
