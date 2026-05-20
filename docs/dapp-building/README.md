# dApp Building

Build decentralized applications (dApps) that interact with the **Canton Network** through the **Wallet Gateway**. Use the **dApp SDK** in your frontend to connect users to their wallets, and the Wallet Gateway to mediate between your dApp, Canton validator nodes, and signing providers.

> [!IMPORTANT]
> This project is under active development and may introduce breaking changes until version 1.0.0. Migration guides for each release are published in [Discussions](https://github.com/canton-network/wallet/discussions).

## Contents

- [Overview](overview/index.md) — Architecture, key concepts, and how the pieces connect
- [dApp SDK](dapp-sdk/index.md) — TypeScript library for wallet connectivity, accounts, signing, and transactions
    - [Installation](dapp-sdk/installation.md)
    - [Usage](dapp-sdk/usage.md)
    - [Adapters & Discovery](dapp-sdk/discovery.md)
    - [API Reference](dapp-sdk/api-reference.md)
    - [Wallet providers (discovery)](dapp-sdk/provider.md) — How wallets and extensions appear in the SDK picker
    - [Best Practices](dapp-sdk/best-practices.md)
- [Wallet Gateway](wallet-gateway/index.md) — Server setup, configuration, APIs, signing providers, and troubleshooting
    - [Getting Started](wallet-gateway/getting-started/index.md)
    - [Configuration](wallet-gateway/configuration/index.md)
    - [Usage](wallet-gateway/usage/index.md)
    - [APIs](wallet-gateway/apis/index.md)
    - [Signing Providers](wallet-gateway/signing-providers/index.md)
    - [Troubleshooting](wallet-gateway/troubleshooting/index.md)
- [Examples](examples/index.md) — Sample dApps (Ping and Portfolio) you can run and learn from
