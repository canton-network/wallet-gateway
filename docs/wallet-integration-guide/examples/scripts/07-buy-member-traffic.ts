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
        partyHint: 'v1-07-alice',
    })
    .sign(aliceKeys.privateKey)
    .execute()

const bobKeys = sdk.keys.generate()

const bob = await sdk.party.external
    .create(bobKeys.publicKey, {
        partyHint: 'v1-07-bob',
    })
    .sign(bobKeys.privateKey)
    .execute()

const createPreapprovalCommand = await sdk.amulet.preapproval.command.create({
    parties: {
        receiver: bob.partyId,
    },
})

await sdk.ledger
    .prepare({
        partyId: bob.partyId,
        commands: createPreapprovalCommand,
    })
    .sign(bobKeys.privateKey)
    .execute({
        partyId: bob.partyId,
    })

// Mint holdings for alice

const [amuletTapCommand, amuletTapDisclosedContracts] = await sdk.amulet.tap(
    alice.partyId,
    '2000000'
)

await sdk.ledger
    .prepare({
        partyId: alice.partyId,
        commands: amuletTapCommand,
        disclosedContracts: amuletTapDisclosedContracts,
    })
    .sign(aliceKeys.privateKey)
    .execute({ partyId: alice.partyId })

logger.info(`Tapped holdings for alice`)

const trafficStatusBeforePurchase = await sdk.amulet.traffic.status()

logger.info(
    `Traffic status before purchase: ${JSON.stringify(trafficStatusBeforePurchase)}`
)

const ccAmount = 200000

const [buyTrafficCommand, buyTrafficDisclosedContracts] =
    await sdk.amulet.traffic.buy({
        buyer: alice.partyId,
        ccAmount,
        inputUtxos: [],
    })

await sdk.ledger
    .prepare({
        partyId: alice.partyId,
        commands: buyTrafficCommand,
        disclosedContracts: buyTrafficDisclosedContracts,
    })
    .sign(aliceKeys.privateKey)
    .execute({ partyId: alice.partyId })

logger.info(`buy member traffic for sender (${alice.partyId}) party completed`)

const utxos = await sdk.token.utxos.list({ partyId: alice.partyId })
logger.info(utxos, 'alice utxos')

const sentValue = 2000

const [transferCommand, transferDisclosedContracts] =
    await sdk.token.transfer.create({
        sender: alice.partyId,
        recipient: bob.partyId,
        amount: sentValue.toString(),
        instrumentId: 'Amulet',
        registryUrl: localNetStaticConfig.LOCALNET_REGISTRY_API_URL,
    })

await sdk.ledger
    .prepare({
        partyId: alice.partyId,
        commands: transferCommand,
        disclosedContracts: transferDisclosedContracts,
    })
    .sign(aliceKeys.privateKey)
    .execute({ partyId: alice.partyId })

//TODO: This does not work when we run multiple code snippets parallel

// await new Promise((resolve) => setTimeout(resolve, 61_000))

// const trafficStatusAfterPurchaseAndSomeTime = await amulet.traffic.status()

// const difference =
//     trafficStatusAfterPurchaseAndSomeTime.traffic_status.target
//         .total_purchased -
//     trafficStatusBeforePurchase.traffic_status.target.total_purchased

// if (difference === ccAmount) {
//     logger.info(
//         {
//             trafficStatusBeforePurchase,
//             trafficStatusAfterPurchaseAndSomeTime,
//         },
//         'MemberTraffic status. Traffic purchased successfully'
//     )
// } else {
//     logger.error(
//         {
//             trafficStatusBeforePurchase,
//             trafficStatusAfterPurchaseAndSomeTime,
//         },
//         'MemberTraffic status.'
//     )
//     throw new Error(
//         `Member traffic difference is ${difference}, expected ${ccAmount} `
//     )
// }
