import { Holding, PrettyContract } from '@canton-network/core-tx-parser'
import { localNetStaticConfig, SDK } from '@canton-network/wallet-sdk'
import { pino } from 'pino'
import {
    TOKEN_NAMESPACE_CONFIG,
    TOKEN_PROVIDER_CONFIG_DEFAULT,
    AMULET_NAMESPACE_CONFIG,
} from './utils/index.js'

const logger = pino({ name: 'v1-05-preapproval', level: 'info' })

const sdk = await SDK.create({
    auth: TOKEN_PROVIDER_CONFIG_DEFAULT,
    ledgerClientUrl: localNetStaticConfig.LOCALNET_APP_USER_LEDGER_URL,
    token: TOKEN_NAMESPACE_CONFIG,
    amulet: AMULET_NAMESPACE_CONFIG,
})

await sdk.amulet.tapInternal('1000')

const aliceKeys = sdk.keys.generate()

const alice = await sdk.party.external
    .create(aliceKeys.publicKey, {
        partyHint: 'v1-05-alice',
    })
    .sign(aliceKeys.privateKey)
    .execute()

const [amuletTapCommand, amuletTapDisclosedContracts] = await sdk.amulet.tap(
    alice.partyId,
    '10000'
)

await sdk.ledger
    .prepare({
        partyId: alice.partyId,
        commands: amuletTapCommand,
        disclosedContracts: amuletTapDisclosedContracts,
    })
    .sign(aliceKeys.privateKey)
    .execute({ partyId: alice.partyId })

const bobKeys = sdk.keys.generate()

const bob = await sdk.party.external
    .create(bobKeys.publicKey, {
        partyHint: 'v1-05-bob',
    })
    .sign(bobKeys.privateKey)
    .execute()

// --- TEST CREATE COMMAND

const createPreapprovalCommand = await sdk.amulet.preapproval.command.create({
    parties: {
        receiver: bob.partyId,
    },
})

logger.info(
    { createPreapprovalCommand },
    'Successfully created a preapproval command'
)

await sdk.ledger
    .prepare({
        partyId: bob.partyId,
        commands: createPreapprovalCommand,
    })
    .sign(bobKeys.privateKey)
    .execute({
        partyId: bob.partyId,
    })

logger.info('Successfully registered the preapproval.')

// --- TEST FETCH

logger.info('Fetching for preapproval status')

const fetchedPreapprovalStatus = await sdk.amulet.preapproval.fetchStatus(
    bob.partyId
)

logger.info({ fetchedPreapprovalStatus }, 'Fetched preapproval status')

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

logger.info({ sentValue }, 'Executed transfer from Alice to Bob with value:')

const aliceUtxos = await sdk.token.utxos.list({ partyId: alice.partyId })
const bobUtxos = await sdk.token.utxos.list({ partyId: bob.partyId })

const partyAmuletValue = (utxos: PrettyContract<Holding>[]) =>
    utxos.reduce(
        (acc, utxo) => acc + parseFloat(utxo.interfaceViewValue.amount),
        0
    )
const aliceAmuletValue = partyAmuletValue(aliceUtxos)
const bobAmuletValue = partyAmuletValue(bobUtxos)

if (aliceAmuletValue !== 8000 || bobAmuletValue !== 2000)
    throw Error(
        `Wrong end results for utxos: ${JSON.stringify({ aliceAmuletValue, bobAmuletValue })}`
    )

logger.info({ aliceAmuletValue, bobAmuletValue }, 'Result:')

// --- TEST RENEW COMMAND

logger.info('Renewing preapproval...')

const newExpiresAt = new Date(fetchedPreapprovalStatus!.expiresAt)
newExpiresAt.setDate(newExpiresAt.getDate() + 2)

await sdk.amulet.preapproval.renew({
    parties: {
        receiver: bob.partyId,
    },
    expiresAt: newExpiresAt,
})

const fetchedStatusAfterRenew = await sdk.amulet.preapproval.fetchStatus(
    bob.partyId,
    {
        oldCid: fetchedPreapprovalStatus!.contractId,
    }
)

const before = fetchedPreapprovalStatus!.expiresAt
const after = fetchedStatusAfterRenew!.expiresAt

if (!(after.getTime() > before.getTime())) {
    throw new Error(
        `Expected expiresAt to increase after renewal. before=${fetchedPreapprovalStatus!.expiresAt.toISOString()} after=${fetchedStatusAfterRenew!.expiresAt.toISOString()}`
    )
}

logger.info(
    {
        before: before.toISOString(),
        after: after.toISOString(),
        extendedSeconds: Math.round(
            (after.getTime() - before.getTime()) / 1000
        ),
    },
    'TransferPreapproval expiry extended, managed to renew preapproval'
)

// --- TEST CANCEL COMMAND
logger.info('Testing out cancel command')

if (!fetchedStatusAfterRenew?.templateId) {
    throw new Error('No preapproval found - fetchedPreapprovalStatus is null')
}
const [cancelPreapprovalCommand, cancelDisclosedContracts] =
    await sdk.amulet.preapproval.command.cancel({
        parties: {
            receiver: bob.partyId,
        },
    })

if (!cancelPreapprovalCommand) {
    throw Error(
        'Cancel preapproval command is null even though one has been created before'
    )
}

await sdk.ledger
    .prepare({
        partyId: bob.partyId,
        commands: cancelPreapprovalCommand,
        disclosedContracts: cancelDisclosedContracts,
    })
    .sign(bobKeys.privateKey)
    .execute({
        partyId: bob.partyId,
    })

logger.info('Submitted cancel command; now polling')
const cancelled = await sdk.amulet.preapproval.fetchStatus(bob.partyId, {
    cancelled: true,
})

const preapprovalACS = await sdk.ledger.acs.read({
    parties: [bob.partyId],
    filterByParty: true,
})

const renewedPreapprovalStillActive = preapprovalACS.some(
    (contract) => contract.contractId === fetchedStatusAfterRenew?.contractId
)

if (cancelled === null && !renewedPreapprovalStillActive) {
    logger.info(`Successfully cancelled`)
}
