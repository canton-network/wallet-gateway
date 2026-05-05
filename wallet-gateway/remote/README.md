# Wallet Gateway

The RPC-based (server-side) Wallet Gateway.

# Usage

Install the Wallet Gateway

```shell
$ npm install -g @canton-network/wallet-gateway-remote

...

$ wallet-gateway -c ./config.json
```

Alternatively, you can run it directly through npx (tested with NodeJS v24):

`npx @canton-network/wallet-gateway-remote -c ./config.json`

By default, the service runs on port `3030`, but this can be overridden via the `-p, --port` CLI argument.

- The User web interface runs on `localhost:3030`
- The dApp JSON-RPC API is exposed on `localhost:3030/api/v0/dapp`
- The User JSON-RPC API is exposed on `localhost:3030/api/v0/user`

## Configuration

A configuration file is required to start up the Gateway. Create an example config to edit as a starting point:

```bash
wallet-gateway --config-example > config.json
```

To show the full [JSON Schema](https://json-schema.org/) representation of the configuration file:

```bash
wallet-gateway --config-schema
```

# Developing

## Codegen

The JSON-RPC API specs from `api-specs/` are generated into strongly-typed method builders for the remote RPC server. To update the codegen, run `yarn generate:dapp`.

## Dfns

1. Create a service account in the Dfns dashboard with permissions to create and sign with Canton wallets, then download its credentials.

2. Set the following environment variables before starting the Gateway:
    - `DFNS_ORG_ID` — your Dfns organization ID (required; the driver is skipped if unset)
    - `DFNS_BASE_URL` — Dfns API base URL (defaults to `https://api.dfns.io`)
    - `DFNS_CRED_ID` — service account credential ID
    - `DFNS_PRIVATE_KEY` — service account private key (PEM)
    - `DFNS_AUTH_TOKEN` — service account auth token

Dfns provisions and activates Canton wallets through its validator integration, so no additional Gateway configuration is required. Only `Canton` and `CantonTestnet` network wallets are supported. See [`@canton-network/core-signing-dfns`](../../core/signing-dfns/README.md) for full driver details.

## Fireblocks

1. Complete steps 1–3 from the instructions at https://github.com/hyperledger-labs/splice-wallet-kernel/tree/main/core/signing-fireblocks

2. set the environment variable `FIREBLOCKS_API_KEY` (get it from `API User (ID)` column in fireblocks api users table).

## Postgres connection

To create a Postgres database you need to:

1. Start Postgres in Docker using:

```shell
$ docker run --network=host --name some-postgres -e POSTGRES_PASSWORD=postgres -d postgres
```

2. In the file `splice-wallet-kernel/wallet-gateway/test/config.json`, specify the connection settings for both databases (store and signingStore). The connection should look like this (it is important that `store.connection.database !== signingStore.connection.database !== 'postgres'`):

```json
{
    "store": {
        "connection": {
            "type": "postgres",
            "password": "postgres",
            "port": 5432,
            "user": "postgres",
            "host": "0.0.0.0",
            "database": "wallet_store"
        }
    },
    "signingStore": {
        "connection": {
            "type": "postgres",
            "password": "postgres",
            "port": 5432,
            "user": "postgres",
            "host": "0.0.0.0",
            "database": "signing_store"
        }
    }
}
```
