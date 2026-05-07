import { localNetStaticConfig, SDK } from '@canton-network/wallet-sdk'
import { TOKEN_PROVIDER_CONFIG_DEFAULT } from '../utils/index.js'
import pino from 'pino'

const logger = pino({ name: 'stress-03-acs-cache', level: 'info' })

const partiesToCreate = parseInt(process.env.PARTIES_AMOUNT ?? '') || 25

const sdk = await SDK.create({
    auth: TOKEN_PROVIDER_CONFIG_DEFAULT,
    ledgerClientUrl: localNetStaticConfig.LOCALNET_APP_USER_LEDGER_URL,
})

const setupParty = async () => {
    const keys = sdk.keys.generate()

    const { partyId } = await sdk.party.external
        .create(keys.publicKey)
        .sign(keys.privateKey)
        .execute()

    const [pingCommand] = sdk.utils.ping.create([
        { initiator: partyId, responder: partyId },
    ])

    await sdk.ledger
        .prepare({
            commands: pingCommand,
            partyId,
        })
        .sign(keys.privateKey)
        .execute({
            partyId,
        })

    return { partyId, keys }
}

// Create parties in batches to avoid overwhelming the server
const parties = []
const batchSize = 5

logger.info(`Creating ${partiesToCreate} parties in batches of ${batchSize}...`)

for (let i = 0; i < partiesToCreate; i += batchSize) {
    const batch = Math.min(batchSize, partiesToCreate - i)
    const batchNum = Math.floor(i / batchSize) + 1
    const totalBatches = Math.ceil(partiesToCreate / batchSize)

    logger.info(
        `Creating batch ${batchNum}/${totalBatches} (${batch} parties)...`
    )

    const batchParties = await Promise.all(
        [...Array(batch)].map(() => setupParty())
    )
    parties.push(...batchParties)

    logger.info(
        `Batch ${batchNum}/${totalBatches} complete. Total parties: ${parties.length}`
    )
}

logger.info(`All ${parties.length} parties created successfully!`)

const timeResults: [number, number][] = []

for (const party of parties) {
    const firstStartTime = performance.now()
    await sdk.ledger.acs.read({
        parties: [party.partyId],
        filterByParty: true,
        templateIds: [
            '#canton-builtin-admin-workflow-ping:Canton.Internal.Ping:Ping',
        ],
    })
    const secondStartTime = performance.now()
    await sdk.ledger.acs.read({
        parties: [party.partyId],
        filterByParty: true,
        templateIds: [
            '#canton-builtin-admin-workflow-ping:Canton.Internal.Ping:Ping',
        ],
    })
    const endTime = performance.now()

    timeResults.push([
        secondStartTime - firstStartTime,
        endTime - secondStartTime,
    ])
}

const isCacheFaster = timeResults.map(
    ([beforeCacheTime, afterCacheTime]) => beforeCacheTime >= afterCacheTime
)

const timesFaster = isCacheFaster.reduce((acc, value) => +value + acc, 0)
const timesSlower = isCacheFaster.length - timesFaster

logger.info(
    { timesFaster, timesSlower },
    'Times when caching mechanism was faster'
)
