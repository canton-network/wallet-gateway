import { localNetStaticConfig, SDK } from '@canton-network/wallet-sdk'
import { pino } from 'pino'
import {
    TOKEN_PROVIDER_CONFIG_DEFAULT,
    AMULET_NAMESPACE_CONFIG,
} from './utils/index.js'

const logger = pino({ name: 'v1-11-hashing', level: 'info' })

const sdk = await SDK.create({
    auth: TOKEN_PROVIDER_CONFIG_DEFAULT,
    ledgerClientUrl: localNetStaticConfig.LOCALNET_APP_USER_LEDGER_URL,
    amulet: AMULET_NAMESPACE_CONFIG,
})

const senderKeys = sdk.keys.generate()

const sender = await sdk.party.external
    .create(senderKeys.publicKey, {
        partyHint: 'v1-11-alice',
    })
    .sign(senderKeys.privateKey)
    .execute()

logger.info({ sender }, 'Sender party representation:')

const [amuletTapCommand, amuletTapDisclosedContracts] = await sdk.amulet.tap(
    sender.partyId,
    '10000'
)

const preparedTapCommand = sdk.ledger.prepare({
    partyId: sender.partyId,
    commands: amuletTapCommand,
    disclosedContracts: amuletTapDisclosedContracts,
})

const { response: preparedTapCommandResponse } =
    await preparedTapCommand.toJSON()

if (!preparedTapCommandResponse.preparedTransaction)
    throw Error('prepared tx not found')

await preparedTapCommand
    .sign(senderKeys.privateKey)
    .execute({ partyId: sender.partyId })

const calculatedTxHash = await sdk.utils.hash.preparedTransacation(
    preparedTapCommandResponse.preparedTransaction
)
const hex = calculatedTxHash.toHex()
const base64 = calculatedTxHash.toBase64()
logger.info(
    {
        hex,
        base64,
        originalHash: preparedTapCommandResponse.preparedTransactionHash,
    },
    'Calculated hashes:'
)

if (base64 !== preparedTapCommandResponse.preparedTransactionHash)
    throw Error('Incorrect hash calculated')
