import pino from 'pino'
import { localNetStaticConfig, SDK } from '@canton-network/wallet-sdk'
import {
    TOKEN_NAMESPACE_CONFIG,
    TOKEN_PROVIDER_CONFIG_DEFAULT,
    AMULET_NAMESPACE_CONFIG,
} from './utils/index.js'

const logger = pino({ name: 'v1-06-merge-utxos', level: 'info' })

const sdk = await SDK.create({
    auth: TOKEN_PROVIDER_CONFIG_DEFAULT,
    ledgerClientUrl: localNetStaticConfig.LOCALNET_APP_USER_LEDGER_URL,
    token: TOKEN_NAMESPACE_CONFIG,
    amulet: AMULET_NAMESPACE_CONFIG,
})

const aliceKeys = sdk.keys.generate()

const alice = await sdk.party.external
    .create(aliceKeys.publicKey, {
        partyHint: 'v1-06-alice',
    })
    .sign(aliceKeys.privateKey)
    .execute()

// Mint holdings for alice

const tapIndices = Array.from({ length: 15 })

const tapPromises = tapIndices.map(async () => {
    const [amuletTapCommand, amuletTapDisclosedContracts] =
        await sdk.amulet.tap(alice.partyId, '2000000')

    return sdk.ledger
        .prepare({
            partyId: alice.partyId,
            commands: amuletTapCommand,
            disclosedContracts: amuletTapDisclosedContracts,
        })
        .sign(aliceKeys.privateKey)
        .execute({ partyId: alice.partyId })
})

await Promise.all(tapPromises)

const utxosAlice = await sdk.token.utxos.list({
    partyId: alice.partyId,
})

logger.info(`number of unlocked utxos for alice ${utxosAlice.length}`)

const [mergeUtxoCommands, mergedDisclosedContracts] =
    await sdk.token.utxos.merge({
        partyId: alice.partyId,
    })

const mergePromises = mergeUtxoCommands.map((mergeCommand) => {
    return sdk.ledger
        .prepare({
            partyId: alice.partyId,
            commands: mergeCommand,
            disclosedContracts: mergedDisclosedContracts,
        })
        .sign(aliceKeys.privateKey)
        .execute({ partyId: alice.partyId })
})

await Promise.all(mergePromises)

const utxosAliceMerged = await sdk.token.utxos.list({
    partyId: alice.partyId,
})

if (utxosAliceMerged.length === 1) {
    logger.info(`utxos successfully merged from ${utxosAlice.length} to 1`)
} else {
    throw new Error(`utxos not successfully merged`)
}
