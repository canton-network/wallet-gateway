import { beforeAll } from 'vitest'
import { PartyId } from '@canton-network/core-types'
import {
    localNetStaticConfig,
    SDK,
    AmuletConfig,
    AssetConfig,
    TokenConfig,
    TokenProviderConfig,
} from '@canton-network/wallet-sdk'

declare global {
    var EXISTING_PARTY_1: PartyId
    var EXISTING_PARTY_1_KEYS: { publicKey: string; privateKey: string }

    var EXISTING_PARTY_2: PartyId
    var EXISTING_PARTY_2_KEYS: { publicKey: string; privateKey: string }

    var EXISTING_PARTY_WITH_PREAPPROVAL: PartyId
    var EXISTING_PARTY_WITH_PREAPPROVAL_KEYS: {
        publicKey: string
        privateKey: string
    }

    var INSTRUMENT_ADMIN_PARTY: PartyId

    var VALIDATOR_OPERATOR_PARTY: PartyId

    var EXISTING_TOPOLOGY: {
        multiHash: string
        partyId: string
        publicKeyFingerprint: string
        topologyTransactions?: string[]
    }

    var PREPARED_COMMAND: unknown
    var PREPARED_TRANSACTION: {
        preparedTransaction?: string
        preparedTransactionHash: string
        hashingSchemeVersion:
            | 'HASHING_SCHEME_VERSION_UNSPECIFIED'
            | 'HASHING_SCHEME_VERSION_V2'
            | 'HASHING_SCHEME_VERSION_V3'
        hashingDetails?: string
        costEstimation?: {
            estimationTimestamp?: string
            confirmationRequestTrafficCostEstimation: number
            confirmationResponseTrafficCostEstimation: number
            totalTrafficCostEstimation: number
        }
    }

    var TOKEN_PROVIDER_CONFIG_DEFAULT: TokenProviderConfig
    var TOKEN_NAMESPACE_CONFIG: TokenConfig
    var AMULET_NAMESPACE_CONFIG: AmuletConfig
    var ASSET_CONFIG: AssetConfig
}

// @disable-snapshot-test
async function beforeEachSetup() {
    global.TOKEN_PROVIDER_CONFIG_DEFAULT = {
        method: 'self_signed',
        issuer: 'unsafe-auth',
        credentials: {
            clientId: 'ledger-api-user',
            clientSecret: 'unsafe',
            audience: 'https://canton.network.global',
            scope: '',
        },
    }

    global.TOKEN_NAMESPACE_CONFIG = {
        validatorUrl: localNetStaticConfig.LOCALNET_APP_VALIDATOR_URL,
        registries: [localNetStaticConfig.LOCALNET_REGISTRY_API_URL],
        auth: TOKEN_PROVIDER_CONFIG_DEFAULT,
    }

    global.AMULET_NAMESPACE_CONFIG = {
        validatorUrl: localNetStaticConfig.LOCALNET_APP_VALIDATOR_URL,
        scanApiUrl: localNetStaticConfig.LOCALNET_SCAN_API_URL,
        auth: TOKEN_PROVIDER_CONFIG_DEFAULT,
        registryUrl: localNetStaticConfig.LOCALNET_REGISTRY_API_URL,
    }

    global.ASSET_CONFIG = {
        registries: [localNetStaticConfig.LOCALNET_REGISTRY_API_URL],
        auth: TOKEN_PROVIDER_CONFIG_DEFAULT,
    }

    const sdk = await SDK.create({
        auth: global.TOKEN_PROVIDER_CONFIG_DEFAULT,
        ledgerClientUrl: localNetStaticConfig.LOCALNET_APP_USER_LEDGER_URL,
        token: global.TOKEN_NAMESPACE_CONFIG,
        amulet: global.AMULET_NAMESPACE_CONFIG,
        asset: global.ASSET_CONFIG,
    })

    // ========= Setup Existing Party 1 =========

    global.EXISTING_PARTY_1_KEYS = sdk.keys.generate()
    global.EXISTING_PARTY_1 = (
        await sdk.party.external
            .create(global.EXISTING_PARTY_1_KEYS.publicKey, {})
            .sign(global.EXISTING_PARTY_1_KEYS.privateKey)
            .execute()
    ).partyId

    // ========= Setup Existing Party 2 =========
    global.EXISTING_PARTY_2_KEYS = sdk.keys.generate()
    global.EXISTING_PARTY_2 = (
        await sdk.party.external
            .create(global.EXISTING_PARTY_2_KEYS.publicKey, {})
            .sign(global.EXISTING_PARTY_2_KEYS.privateKey)
            .execute()
    ).partyId

    // ========= Setup Prepared Command =========
    {
        global.PREPARED_COMMAND = sdk.utils.ping.create([
            {
                initiator: global.EXISTING_PARTY_2,
                responder: global.EXISTING_PARTY_2,
            },
        ])
    }

    // ========= Setup Prepared Transaction =========
    {
        global.PREPARED_TRANSACTION = await sdk.ledger.prepare({
            partyId: global.EXISTING_PARTY_2,
            commands: global.PREPARED_COMMAND,
        }).preparedPromise
    }

    // ========= Setup non-submitted Topology for Existing Party 1 =========
    global.EXISTING_TOPOLOGY = await sdk.party.external
        .create(global.EXISTING_PARTY_1_KEYS.publicKey, {
            partyHint: 'my-party',
        })
        .sign(global.EXISTING_PARTY_1_KEYS.privateKey)
        .execute()

    // ========= Setup Instrument Admin Party =========
    global.INSTRUMENT_ADMIN_PARTY = (
        await sdk.asset.find(
            'Amulet',
            localNetStaticConfig.LOCALNET_REGISTRY_API_URL
        )
    ).admin

    // ========= Setup Validator Operator Party =========

    // ========= Setup Existing Party with Preapproval =========
    global.EXISTING_PARTY_WITH_PREAPPROVAL_KEYS = sdk.keys.generate()
    global.EXISTING_PARTY_WITH_PREAPPROVAL = (
        await sdk.party.external
            .create(global.EXISTING_PARTY_WITH_PREAPPROVAL_KEYS.publicKey, {})
            .sign(global.EXISTING_PARTY_WITH_PREAPPROVAL_KEYS.privateKey)
            .execute()
    ).partyId

    // ========== SETUP PREAPPROVAL FOR EXISTING PARTY WITH PREAPPROVAL ==========
    {
        const createPreapprovalCommand =
            await sdk.amulet.preapproval.command.create({
                parties: {
                    receiver: global.EXISTING_PARTY_WITH_PREAPPROVAL,
                },
            })

        await sdk.ledger
            .prepare({
                partyId: global.EXISTING_PARTY_WITH_PREAPPROVAL,
                commands: createPreapprovalCommand,
            })
            .sign(global.EXISTING_PARTY_WITH_PREAPPROVAL_KEYS.privateKey)
            .execute({
                partyId: global.EXISTING_PARTY_WITH_PREAPPROVAL,
            })
    }

    // ========== SETUP TRANSFER PENDING FROM PARTY 1 TO PARTY 2 ==========
    {
        const [amuletTapCommand, amuletTapDisclosedContracts] =
            await sdk.amulet.tap(global.EXISTING_PARTY_1, '2000000')

        await sdk.ledger
            .prepare({
                partyId: global.EXISTING_PARTY_1,
                commands: amuletTapCommand,
                disclosedContracts: amuletTapDisclosedContracts,
            })
            .sign(global.EXISTING_PARTY_1_KEYS.privateKey)
            .execute({ partyId: global.EXISTING_PARTY_1 })

        const [transferCommand, transferDisclosedContracts] =
            await sdk.token.transfer.create({
                sender: global.EXISTING_PARTY_1,
                recipient: global.EXISTING_PARTY_2,
                instrumentId: 'Amulet',
                registryUrl: localNetStaticConfig.LOCALNET_REGISTRY_API_URL,
                amount: '100',
            })

        await sdk.ledger
            .prepare({
                partyId: global.EXISTING_PARTY_1,
                commands: transferCommand,
                disclosedContracts: transferDisclosedContracts,
            })
            .sign(global.EXISTING_PARTY_1_KEYS.privateKey)
            .execute({ partyId: global.EXISTING_PARTY_1 })
    }
    console.log('Setup complete')
}

beforeAll(async () => {
    await beforeEachSetup()
}, 60_000)
