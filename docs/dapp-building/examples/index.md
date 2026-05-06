# Examples

The following example dApps demonstrate how to use the dApp SDK and Wallet Gateway. You can find them in the [`/examples`](https://github.com/canton-network/wallet-gateway/tree/main/examples) directory of the repository.

## Ping

A minimal example dApp that imports the dApp SDK and communicates with a Wallet Gateway. Built with React + TypeScript using the Vite template, this is the best starting point for understanding the basics of dApp SDK integration.

**Running:**

```bash
yarn install
yarn dev
```

[Source code](https://github.com/canton-network/wallet-gateway/tree/main/examples/ping)

## Portfolio

A more complete example dApp that showcases a minimal but functional portfolio application using the dApp SDK and Wallet Gateway. Built with React + TypeScript using Vite, it demonstrates real-world patterns including holdings, allocations, transactions, and transfer workflows.

**Building and running:**

Because this example has a number of dependencies, it is recommended to use the scripts in the root repository for development:

```bash
yarn build:all
yarn start:all   # this service lives at http://localhost:8081
yarn stop:all
```

[Source code](https://github.com/canton-network/wallet-gateway/tree/main/examples/portfolio)
