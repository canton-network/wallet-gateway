import pino from 'pino'
import { localNetStaticConfig, SDK } from '@canton-network/wallet-sdk'
import {
    TOKEN_NAMESPACE_CONFIG,
    TOKEN_PROVIDER_CONFIG_DEFAULT,
    AMULET_NAMESPACE_CONFIG,
} from '../utils/index.js'
import { batchTap } from './utils.js'
import Decimal from 'decimal.js'

const logger = pino({ name: 'v1-01-merge-utxos', level: 'info' })

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

const TOTAL_TAPS = 115
const BATCH_SIZE = 10

const totalSum = await batchTap(
    TOTAL_TAPS,
    BATCH_SIZE,
    sdk,
    alice.partyId,
    aliceKeys.privateKey,
    logger
)

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

const result = {
    length: utxosAliceMerged.length,
    amount: utxosAliceMerged.reduce(
        (acc, utxo) => acc.plus(new Decimal(utxo.interfaceViewValue.amount)),
        new Decimal(0)
    ),
}

if (result.length !== 2 || !result.amount.equals(totalSum))
    throw Error('Utxos were not merged successfully')
