import { SDK, localNetStaticConfig } from '@canton-network/wallet-sdk'

export default async function () {
    const sdk = await SDK.create({
        auth: {
            method: 'self_signed',
            issuer: 'unsafe-auth',
            credentials: {
                clientId: 'ledger-api-user',
                clientSecret: 'unsafe',
                audience: 'https://canton.network.global',
                scope: '',
            },
        },
        ledgerClientUrl: 'http://localhost:2975',
        token: {
            validatorUrl: 'http://localhost:2000/api/validator',
            registries: ['http://localhost:2000/api/validator/v0/scan-proxy'],
            auth: global.TOKEN_PROVIDER_CONFIG_DEFAULT,
        },
        amulet: {
            validatorUrl: localNetStaticConfig.LOCALNET_APP_VALIDATOR_URL,
            scanApiUrl: localNetStaticConfig.LOCALNET_SCAN_API_URL,
            auth: TOKEN_PROVIDER_CONFIG_DEFAULT,
            registryUrl: localNetStaticConfig.LOCALNET_REGISTRY_API_URL,
        },
        asset: {
            registries: [localNetStaticConfig.LOCALNET_REGISTRY_API_URL],
            auth: TOKEN_PROVIDER_CONFIG_DEFAULT,
        },
    })

    const myParty = global.EXISTING_PARTY_1

    await sdk.token.utxos.list({ partyId: myParty })

    await sdk.amulet.traffic.status()

    // OR, you can defer loading config by calling .extend()

    const basicSDK = await SDK.create({
        auth: {
            method: 'self_signed',
            issuer: 'unsafe-auth',
            credentials: {
                clientId: 'ledger-api-user',
                clientSecret: 'unsafe',
                audience: 'https://canton.network.global',
                scope: '',
            },
        },
        ledgerClientUrl: 'http://localhost:2975',
    })

    // Extend with token namespace
    const tokenExtendedSDK = await basicSDK.extend({
        token: {
            validatorUrl: 'http://localhost:2000/api/validator',
            registries: ['http://localhost:2000/api/validator/v0/scan-proxy'],
            auth: global.TOKEN_PROVIDER_CONFIG_DEFAULT,
        },
    })

    // Now token namespace is available
    await tokenExtendedSDK.token.utxos.list({ partyId: myParty })

    // Can extend further with more namespaces
    const fullyExtendedSDK = await tokenExtendedSDK.extend({
        amulet: {
            validatorUrl: localNetStaticConfig.LOCALNET_APP_VALIDATOR_URL,
            scanApiUrl: localNetStaticConfig.LOCALNET_SCAN_API_URL,
            auth: global.TOKEN_PROVIDER_CONFIG_DEFAULT,
            registryUrl: localNetStaticConfig.LOCALNET_REGISTRY_API_URL,
        },
    })

    // Now both token and amulet are available
    await fullyExtendedSDK.token.utxos.list({ partyId: myParty })
    await fullyExtendedSDK.amulet.traffic.status()
}
