import pino from 'pino'
import { localNetStaticConfig, SDK } from '@canton-network/wallet-sdk'
import {
    TOKEN_PROVIDER_CONFIG_DEFAULT,
    AMULET_NAMESPACE_CONFIG,
    getGlobalSynchronizerId,
} from './utils/index.js'

const logger = pino({ name: 'v1-03-parties', level: 'info' })

const userId = localNetStaticConfig.LOCALNET_USER_ID

const sdk = await SDK.create({
    auth: TOKEN_PROVIDER_CONFIG_DEFAULT,
    ledgerClientUrl: localNetStaticConfig.LOCALNET_APP_USER_LEDGER_URL,
    amulet: AMULET_NAMESPACE_CONFIG,
})

const globalSynchronizerId = await getGlobalSynchronizerId(sdk)

const allocatedParties = await Promise.all(
    ['v1-03-alice', 'v1-03-bob'].map((partyHint) => {
        const partyKeys = sdk.keys.generate()
        return sdk.party.external
            .create(partyKeys.publicKey, {
                partyHint,
                synchronizerId: globalSynchronizerId,
            })
            .sign(partyKeys.privateKey)
            .execute()
    })
)

logger.info(allocatedParties, 'Allocated parties')

const listedParties = await sdk.party.list()

logger.info(listedParties, `Obtained parties for ${userId}`)

const allocatedPartiesIds = new Set(
    allocatedParties.map((party) => party.partyId)
)

if (!allocatedPartiesIds.isSubsetOf(new Set(listedParties))) {
    throw new Error(
        "At least some of the allocated parties haven't been listed."
    )
}

const featuredAppRights = await sdk.amulet.featuredApp.grant()

if (!featuredAppRights) {
    throw new Error(
        'Failed to obtain featured app rights for validator operator party'
    )
} else {
    logger.info(
        featuredAppRights,
        'Featured app rights for validator operator party'
    )
}

logger.info('Preparing multi hosted party...')

const participantEndpoints = [
    {
        url: new URL('http://127.0.0.1:3975'),
        tokenProviderConfig: TOKEN_PROVIDER_CONFIG_DEFAULT,
    },
]

const charlieKeys = sdk.keys.generate()
const charlie = await sdk.party.external
    .create(charlieKeys.publicKey, {
        partyHint: 'v1-03-charlie',
        synchronizerId: globalSynchronizerId,
        confirmingParticipantEndpoints: participantEndpoints,
    })
    .sign(charlieKeys.privateKey)
    .execute()

logger.info(charlie, 'Multi hosted party allocated successfully')

const charliePingCommand = sdk.utils.ping.create([
    { initiator: charlie.partyId, responder: charlie.partyId },
])

const pingResult = await sdk.ledger
    .prepare({
        partyId: charlie.partyId,
        commands: charliePingCommand,
    })
    .sign(charlieKeys.privateKey)
    .execute({
        partyId: charlie.partyId,
    })

logger.info(
    pingResult,
    'Successfully validated party allocation via Canton.Internal.Ping'
)

logger.info('Preparing multi hosted party with observing participant...')

const observingCharlieKeys = sdk.keys.generate()
const observingCharlie = await sdk.party.external
    .create(observingCharlieKeys.publicKey, {
        partyHint: 'v1-03-observingCharlie',
        synchronizerId: globalSynchronizerId,
        observingParticipantEndpoints: participantEndpoints,
    })
    .sign(observingCharlieKeys.privateKey)
    .execute()

logger.info(
    observingCharlie,
    'Multi hosted party with observing participant allocated successfully'
)

const observingConradPingCommand = sdk.utils.ping.create([
    {
        initiator: observingCharlie.partyId,
        responder: observingCharlie.partyId,
    },
])

const observingPingResult = await sdk.ledger
    .prepare({
        partyId: observingCharlie.partyId,
        commands: observingConradPingCommand,
    })
    .sign(observingCharlieKeys.privateKey)
    .execute({
        partyId: observingCharlie.partyId,
    })

logger.info(
    observingPingResult,
    'Successfully validated observing party allocation via Canton.Internal.Ping'
)
