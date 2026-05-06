# provider-ledger

This package provides a SpliceProvider (see https://github.com/canton-network/wallet-gateway/tree/main/core/splice-provider) implementation intended for direct Ledger usage. It is suitable for both NodeJS and browser environments, but if you are building a Canton dApp, then you likely want to use the [`dapp-sdk`](https://www.npmjs.com/package/@canton-network/dapp-sdk) instead, which gives a `DappProvider`.

This provider only supports a single method, `ledgerApi`, which proxies request through to an underlying Ledger JSON-API client. Due to the nature of the Canton Ledger JSON-API, the only supported transport is HTTP.

## usage

```ts
import { LedgerProvider } from '@canton-network/core-provider-ledger'

const provider = new LedgerProvider({
    baseUrl: 'https://ledger-api.example.com',
    accessToken: 'jwt...',
})

const version = await provider.request({
    method: 'ledgerApi',
    params: {
        resource: '/v2/version',
        requestMethod: 'get',
    },
})
```

## types

Due to some type inference limitations, the return type of request collapses to `unknown`. In order to aid the compiler, you can supply an optional type argument corresponding to the operation you are using on the ledgerApi. Afterwards, the response is cleanly typed:

```ts
import { LedgerProvider, Ops } from '@canton-network/core-provider-ledger'

// ...

const party = await provider.request<Ops.PostV2Parties>({
    method: 'ledgerApi',
    params: {
        resource: '/v2/parties',
        requestMethod: 'post',
        body: {
            partyHint: 'my-party',
        },
    },
})

console.log(party.partyDetails?.party)
```

## data

There are various ways to pass data into the request, depending on the operation. Let type inference guide you, but know there are three possibilities:

```ts

provider.request({
    method: 'ledgerApi',
    params: {
        ...,
        body?: {
            // usually for POST requests (JSON object body)
        },
        path?: {
            // `path` arguments, usually for GET requests (i.e., `/v2/parties/{party-id}`)
            "party-id": "some-party-id"
        },
        query?: {
            // `query` params, usually for GET requests (i.e., `/v2/...?param=data`)
            "param": "data"
        }
    }
})
```

Any particular operation may require just one, none, or multiple client data inputs.
