import {
    localNetStaticConfig,
    SDK,
    signTransactionHash,
} from '@canton-network/wallet-sdk'
import { pino } from 'pino'
import { v4 } from 'uuid'
import {
    TOKEN_NAMESPACE_CONFIG,
    TOKEN_PROVIDER_CONFIG_DEFAULT,
    AMULET_NAMESPACE_CONFIG,
} from './utils/index.js'

const logger = pino({ name: 'v1-01-ping-localnet', level: 'info' })

const sdk = await SDK.create({
    auth: TOKEN_PROVIDER_CONFIG_DEFAULT,
    ledgerClientUrl: localNetStaticConfig.LOCALNET_APP_USER_LEDGER_URL,
    token: TOKEN_NAMESPACE_CONFIG,
    amulet: AMULET_NAMESPACE_CONFIG,
})

const senderKeys = sdk.keys.generate()

const sender = await sdk.party.external
    .create(senderKeys.publicKey, {
        partyHint: 'v1-01-alice',
    })
    .sign(senderKeys.privateKey)
    .execute()

const senderFingerprint = await sdk.keys.fingerprint(senderKeys.publicKey)

logger.info({ sender, senderFingerprint }, 'Sender party representation:')

if (sender.publicKeyFingerprint !== senderFingerprint)
    throw Error('Inconsistent fingerprints')

const receiverKeys = sdk.keys.generate()

const receiverPartyCreation = sdk.party.external.create(
    receiverKeys.publicKey,
    {
        partyHint: 'v1-01-bob',
    }
)

const unsignedReceiver = await receiverPartyCreation.topology()

// external signing simulation
const receiverPartySignature = signTransactionHash(
    unsignedReceiver.multiHash,
    receiverKeys.privateKey
)

const signedReceiverParty = await receiverPartyCreation.execute(
    receiverPartySignature
)

logger.info({ signedReceiverParty }, 'Receiver party representation:')

const pingCommand = [
    {
        CreateCommand: {
            templateId:
                '#canton-builtin-admin-workflow-ping:Canton.Internal.Ping:Ping',
            createArguments: {
                id: v4(),
                initiator: sender.partyId,
                responder: sender.partyId,
            },
        },
    },
]

logger.info({ pingCommand }, 'Ping command to be submitted:')

await sdk.ledger
    .prepare({
        partyId: sender.partyId,
        commands: pingCommand,
        disclosedContracts: [],
    })
    .sign(senderKeys.privateKey)
    .execute({ partyId: sender.partyId })

logger.info('Ping command submitted with online signing')

/*
offline signing example
*/

const preparedPingCommand = sdk.ledger.prepare({
    partyId: sender.partyId,
    commands: pingCommand,
    disclosedContracts: [],
})

const { response: preparedPingCommandResponse } =
    await preparedPingCommand.toJSON()

logger.info({ preparedPingCommand }, 'Prepared ping command:')

/*
Note: The following code uses the @canton-network/core-signing-lib as the 'custodian' of the private key to sign the prepared transaction hash,
but in a real scenario, the signing could be done using any compatible signing mechanism, such as a hardware wallet or an external signing service.
*/
const signature = signTransactionHash(
    preparedPingCommandResponse.preparedTransactionHash,
    senderKeys.privateKey
)

const signed = sdk.ledger.fromSignature(preparedPingCommandResponse, signature)

await sdk.ledger.execute(signed, { partyId: sender.partyId })

logger.info('Ping command submitted with offline signing')

const [amuletTapCommand, amuletTapDisclosedContracts] = await sdk.amulet.tap(
    sender.partyId,
    '10000'
)

await sdk.ledger
    .prepare({
        partyId: sender.partyId,
        commands: amuletTapCommand,
        disclosedContracts: amuletTapDisclosedContracts,
    })
    .sign(senderKeys.privateKey)
    .execute({ partyId: sender.partyId })

const senderUtxos = await sdk.token.utxos.list({ partyId: sender.partyId })

const senderAmuletUtxos = senderUtxos.filter((utxo) => {
    return (
        utxo.interfaceViewValue.amount === '10000.0000000000' &&
        utxo.interfaceViewValue.instrumentId.id === 'Amulet'
    )
})

if (senderAmuletUtxos.length === 0) {
    throw new Error('No UTXOs found for Sender')
}

logger.info('Tap command for Amulet for Sender submitted and UTXO received')
