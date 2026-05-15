import pino from 'pino'
import { Event, localNetStaticConfig, SDK } from '@canton-network/wallet-sdk'
import { TOKEN_PROVIDER_CONFIG_DEFAULT } from './utils/index.js'

const logger = pino({ name: 'v1-12-subscribe-to-events', level: 'info' })

const userId = localNetStaticConfig.LOCALNET_USER_ID

const sdk = await SDK.create({
    auth: TOKEN_PROVIDER_CONFIG_DEFAULT,
    ledgerClientUrl: localNetStaticConfig.LOCALNET_APP_USER_LEDGER_URL,
    events: {
        websocketURL: new URL(
            `ws://${localNetStaticConfig.LOCALNET_APP_USER_LEDGER_URL.host}`
        ),
        auth: TOKEN_PROVIDER_CONFIG_DEFAULT,
    },
})

const allocatedParties = await Promise.all(
    ['v1-12-alice', 'v1-12-bob'].map((partyHint) => {
        const partyKeys = sdk.keys.generate()
        return sdk.party.external
            .create(partyKeys.publicKey, {
                partyHint,
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
        partyHint: 'v1-12-charlie',
        confirmingParticipantEndpoints: participantEndpoints,
    })
    .sign(charlieKeys.privateKey)
    .execute()

logger.info(charlie, 'Multi hosted party allocated successfully')

const commandsCompletionsEvents: Event[] = []
const commandsCompletionsController = new AbortController()
logger.info('subscribing to command completions')
const subscribeToCommandsMultiHostedParty = (async () => {
    try {
        const stream = sdk.events.completions({
            beginOffset: 0,
            parties: [charlie.partyId],
        })
        for await (const completion of stream!) {
            logger.debug(
                completion,
                'received command completion update for multi hosted party'
            )
            commandsCompletionsEvents.push(completion as any)
            if (commandsCompletionsController.signal.aborted) break
        }
    } catch (err) {
        if (!commandsCompletionsController.signal.aborted) throw err
    }
})()

subscribeToCommandsMultiHostedParty
logger.info('subscribed to command completion')

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
        partyHint: 'v1-12-observingCharlie',
        observingParticipantEndpoints: participantEndpoints,
    })
    .sign(observingCharlieKeys.privateKey)
    .execute()

logger.info(
    observingCharlie,
    'Multi hosted party with observing participant allocated successfully'
)

const updateEvents: Event[] = []
const updatesController = new AbortController()

const subscribeToPingUpdates = (async () => {
    try {
        const stream = sdk.events.updates({
            partyId: observingCharlie.partyId,
            templateIds: [
                '#canton-builtin-admin-workflow-ping:Canton.Internal.Ping:Ping',
            ],
        })
        for await (const update of stream!) {
            updateEvents.push(update)
            if (updatesController.signal.aborted) break
        }
    } catch (err) {
        if (!updatesController.signal.aborted) throw err
    }
})()

subscribeToPingUpdates

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

logger.debug(commandsCompletionsEvents, 'commands completions events')

if (commandsCompletionsEvents.length === 0) {
    logger.error(
        'No command completion events received, something went wrong with the subscription'
    )
    commandsCompletionsController.abort()
    process.exit(1)
}

logger.debug(updateEvents, 'Update events')

if (updateEvents.length === 0) {
    logger.error(
        'No command completion events received, something went wrong with the subscription'
    )
    updatesController.abort()
    process.exit(1)
}

commandsCompletionsController.abort()
updatesController.abort()
process.exit(0)
