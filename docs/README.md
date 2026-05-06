# Documentation

This directory contains two developer guides and supporting reference documents for the Wallet Gateway project.

## Guides

### dApp Building Guide

**Published:** TBD
**Path:** [`dapp-building/`](dapp-building/)

For **dApp developers** who want to build applications on the Canton Network using the Wallet Gateway and the dApp SDK.

**Topics covered:**

| Section            | Description                                                                                                |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| **Overview**       | Architecture, discovery and connection flow, dApp API (CIP-103), User API                                  |
| **dApp SDK**       | Installation, usage patterns, API reference, best practices                                                |
| **Wallet Gateway** | Getting started, configuration, running the server, APIs (dApp + User), signing providers, troubleshooting |
| **Examples**       | Walkthrough of the included example dApps                                                                  |

**Audience:** Frontend and backend developers building dApps that connect users to Canton wallets. Start here if you want to call `connect()`, list accounts, or prepare and execute transactions.

**Preview locally:**

```bash
cd docs/dapp-building
poetry install
poetry run sphinx-autobuild -c . src build -W
```

---

### Wallet Integration Guide

**Published:** [docs.digitalasset.com](https://docs.digitalasset.com/integrate/devnet/index.html)
**Path:** [`wallet-integration-guide/`](wallet-integration-guide/)

For **wallet providers, exchanges, and custodians** integrating directly with the Canton Network. Covers lower-level topics from party management and transaction signing through to exchange-specific workflows.

**Topics covered:**

| Section                                | Description                                                                        |
| -------------------------------------- | ---------------------------------------------------------------------------------- |
| **Canton Network Overview**            | Network topology, synchronizers, participants                                      |
| **Integrating with Canton Network**    | Connection setup, authentication, environment configuration                        |
| **Party Management**                   | Creating and managing external parties with keypairs                               |
| **Finding and Reading Data**           | Querying active contracts and ledger state                                         |
| **Preparing and Signing Transactions** | Interactive submission flow, transaction hashing, signature formats                |
| **Signing Transactions from dApps**    | End-to-end flow when a dApp requests a signature through the Wallet Gateway        |
| **Token Standard**                     | Canton Token Standard (CTS) contracts, transfers, holdings                         |
| **Wallet SDK Configuration**           | Configuring the `@canton-network/wallet-sdk`                                       |
| **Traffic**                            | Traffic management and rate limiting                                               |
| **Tokenomics and Rewards**             | Reward mechanisms and validator economics                                          |
| **User Management**                    | Identity providers, user rights, multi-tenancy                                     |
| **Canton Coin Considerations**         | Canton Coin-specific implementation details                                        |
| **Deposits into Exchanges**            | Deposit detection, reconciliation patterns                                         |
| **USDCx Support**                      | USDCx-specific integration notes                                                   |
| **Exchange Integration**               | Full exchange architecture, workflows, testing, disaster recovery, node operations |
| **Release Notes**                      | Version history and breaking changes                                               |

**Audience:** Teams building custodial wallets, exchange integrations, or any backend that talks directly to the Canton Ledger API. The guide recommends using the Wallet SDK but also documents raw API usage.

**Preview locally:**

```bash
cd docs/wallet-integration-guide
poetry install
poetry run sphinx-autobuild -c . src build -W
```

The guide includes runnable TypeScript examples under [`wallet-integration-guide/examples/`](wallet-integration-guide/examples/).

---

## Reference Documents

| File                               | Description                                                           |
| ---------------------------------- | --------------------------------------------------------------------- |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute to the project (branching, PRs, code review)        |
| [CLEANCODING.md](CLEANCODING.md)   | Clean coding guidelines and conventions                               |
| [GLOSSARY.md](GLOSSARY.md)         | Terminology reference for Canton, Splice, and Wallet Gateway concepts |
| [RELEASES.md](RELEASES.md)         | Release process and versioning policy                                 |
