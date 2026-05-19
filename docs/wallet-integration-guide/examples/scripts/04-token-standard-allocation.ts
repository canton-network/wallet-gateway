import pino from 'pino'
import { localNetStaticConfig, SDK } from '@canton-network/wallet-sdk'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'
import { KeyPair } from '@canton-network/core-signing-lib'
import { ASSET_CONFIG } from './utils/index.js'
import { GenerateTransactionResponse } from '@canton-network/core-ledger-client'
import {
    TOKEN_NAMESPACE_CONFIG,
    TOKEN_PROVIDER_CONFIG_DEFAULT,
    AMULET_NAMESPACE_CONFIG,
} from './utils/index.js'

const logger = pino({ name: 'v1-token-standard-allocation', level: 'info' })

type PartyInfo = Omit<GenerateTransactionResponse, 'topologyTransactions'> & {
    topologyTransactions?: string[] | undefined
    keyPair: KeyPair
}

const sdk = await SDK.create({
    auth: TOKEN_PROVIDER_CONFIG_DEFAULT,
    ledgerClientUrl: localNetStaticConfig.LOCALNET_APP_USER_LEDGER_URL,
    token: TOKEN_NAMESPACE_CONFIG,
    amulet: AMULET_NAMESPACE_CONFIG,
    asset: ASSET_CONFIG,
})

// This example needs uploaded .dar for splice-token-test-trading-app
// It's in files of localnet, but it's not uploaded to participant, so we need to do this in the script
// Adjust if to your .localnet location
const PATH_TO_LOCALNET = '../../../../.localnet'
const PATH_TO_DAR_IN_LOCALNET = '/dars/splice-token-test-trading-app-1.0.0.dar'
const TRADING_APP_PACKAGE_ID =
    'e5c9847d5a88d3b8d65436f01765fc5ba142cc58529692e2dacdd865d9939f71'

const here = path.dirname(fileURLToPath(import.meta.url))

const tradingDarPath = path.join(
    here,
    PATH_TO_LOCALNET,
    PATH_TO_DAR_IN_LOCALNET
)

//upload dar
const darBytes = await fs.readFile(tradingDarPath)
await sdk.ledger.dar.upload(darBytes, TRADING_APP_PACKAGE_ID)

//allocate parties
const allocatedParties = await Promise.all(
    ['v1-04-alice', 'v1-04-bob', 'v1-04-venue'].map(async (partyHint) => {
        const partyKeys = sdk.keys.generate()
        const party = await sdk.party.external
            .create(partyKeys.publicKey, {
                partyHint,
            })
            .sign(partyKeys.privateKey)
            .execute()

        return [
            partyHint,
            {
                partyId: party.partyId,
                publicKeyFingerprint: party.publicKeyFingerprint,
                multiHash: party.multiHash,
                topologyTransactions: party.topologyTransactions,
                keyPair: partyKeys,
            },
        ] as const
    })
)

const partyInfo: Map<string, PartyInfo> = new Map(allocatedParties)

const sender = partyInfo.get('v1-04-alice')!
const recipient = partyInfo.get('v1-04-bob')!
const venue = partyInfo.get('v1-04-venue')!

// Mint holdings for alice

const [amuletTapCommand, amuletTapDisclosedContracts] = await sdk.amulet.tap(
    sender.partyId,
    '2000000'
)

await sdk.ledger
    .prepare({
        partyId: sender.partyId,
        commands: amuletTapCommand,
        disclosedContracts: amuletTapDisclosedContracts,
    })
    .sign(sender.keyPair.privateKey)
    .execute({ partyId: sender.partyId })

// Mint holdings for bob

const [amuletTapCommandBob, amuletTapDisclosedContractsBob] =
    await sdk.amulet.tap(recipient.partyId, '2000000')

await sdk.ledger
    .prepare({
        partyId: recipient.partyId,
        commands: amuletTapCommandBob,
        disclosedContracts: amuletTapDisclosedContractsBob,
    })
    .sign(recipient.keyPair.privateKey)
    .execute({ partyId: recipient.partyId })

//Alice creates OTCTradeProposal

const amuletAsset = await sdk.asset.find(
    'Amulet',
    localNetStaticConfig.LOCALNET_REGISTRY_API_URL
)

const transferLegs = {
    leg0: {
        sender: sender.partyId,
        receiver: recipient.partyId,
        amount: '100',
        instrumentId: { admin: amuletAsset.admin, id: 'Amulet' },
        meta: { values: {} },
    },
    leg1: {
        sender: recipient.partyId,
        receiver: sender.partyId,
        amount: '20',
        instrumentId: { admin: amuletAsset.admin, id: 'Amulet' },
        meta: { values: {} },
    },
}

const createProposal = {
    CreateCommand: {
        templateId:
            '#splice-token-test-trading-app:Splice.Testing.Apps.TradingApp:OTCTradeProposal',
        createArguments: {
            venue: venue.partyId,
            tradeCid: null,
            transferLegs,
            approvers: [sender.partyId],
        },
    },
}

await sdk.ledger
    .prepare({
        partyId: sender.partyId,
        commands: createProposal,
        disclosedContracts: [],
    })
    .sign(sender.keyPair.privateKey)
    .execute({ partyId: sender.partyId })

logger.info(
    'OTC Trade Proposal created by Alice, ready for Bob to accept OTCTradeProposal'
)

// Bob accepts OTCTradeProposal

const activeTradeProposals = await sdk.ledger.acs.read({
    templateIds: [
        '#splice-token-test-trading-app:Splice.Testing.Apps.TradingApp:OTCTradeProposal',
    ],
    parties: [recipient.partyId],
    filterByParty: true,
})

const otcpCid = activeTradeProposals[0].contractId

if (otcpCid === undefined) {
    throw new Error('Unexpected lack of OTCTradeProposal contract')
}
const acceptCmd = [
    {
        ExerciseCommand: {
            templateId:
                '#splice-token-test-trading-app:Splice.Testing.Apps.TradingApp:OTCTradeProposal',
            contractId: otcpCid,
            choice: 'OTCTradeProposal_Accept',
            choiceArgument: { approver: recipient.partyId },
        },
    },
]

await sdk.ledger
    .prepare({
        partyId: recipient.partyId,
        commands: acceptCmd,
        disclosedContracts: [],
    })
    .sign(recipient.keyPair.privateKey)
    .execute({ partyId: recipient.partyId })

logger.info('Bob accepted OTCTradeProposal')

//Venue initiates settlement of OTCTradeProposal

const activeTradeProposals2 = await sdk.ledger.acs.read({
    templateIds: [
        '#splice-token-test-trading-app:Splice.Testing.Apps.TradingApp:OTCTradeProposal',
    ],
    parties: [venue.partyId],
    filterByParty: true,
})

const now = new Date()
const prepareUntil = new Date(now.getTime() + 60 * 60 * 1000).toISOString()
const settleBefore = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString()

const otcpCid2 = activeTradeProposals2[0].contractId

const initiateSettlementCmd = [
    {
        ExerciseCommand: {
            templateId:
                '#splice-token-test-trading-app:Splice.Testing.Apps.TradingApp:OTCTradeProposal',
            contractId: otcpCid2,
            choice: 'OTCTradeProposal_InitiateSettlement',
            choiceArgument: { prepareUntil, settleBefore },
        },
    },
]

await sdk.ledger
    .prepare({
        partyId: venue.partyId,
        commands: initiateSettlementCmd,
        disclosedContracts: [],
    })
    .sign(venue.keyPair.privateKey)
    .execute({ partyId: venue.partyId })

logger.info('Venue initated settlement of OTCTradeProposal')

const otcTrades = await sdk.ledger.acs.read({
    templateIds: [
        '#splice-token-test-trading-app:Splice.Testing.Apps.TradingApp:OTCTrade',
    ],
    parties: [venue.partyId],
    filterByParty: true,
})

const otcTradeCid = otcTrades[0].contractId
if (!otcTradeCid) throw new Error('OTCTrade not found for venue')

logger.info({ otcTradeCid }, `OtcTrades were found`)

const pendingAllocationRequestsAlice =
    await sdk.token.allocation.request.pending(sender.partyId)

const allocationRequestViewAlice =
    pendingAllocationRequestsAlice?.[0].interfaceViewValue!

const legIdAlice = Object.keys(allocationRequestViewAlice.transferLegs).find(
    (key) =>
        allocationRequestViewAlice.transferLegs[key].sender === sender.partyId
)!
if (!legIdAlice) throw new Error(`No leg found for Alice`)

const legAlice = allocationRequestViewAlice.transferLegs[legIdAlice]

const specAlice = {
    settlement: allocationRequestViewAlice.settlement,
    transferLegId: legIdAlice,
    transferLeg: legAlice,
}

//TODO: go over if we should pass in expectedAdmin or instrumentId/registryUrl

const [allocateCmdAlice, allocateDisclosedAlice] =
    await sdk.token.allocation.instruction.create({
        allocationSpecification: specAlice,
        asset: amuletAsset,
    })

await sdk.ledger
    .prepare({
        partyId: sender.partyId,
        commands: allocateCmdAlice,
        disclosedContracts: allocateDisclosedAlice,
    })
    .sign(sender.keyPair.privateKey)
    .execute({ partyId: sender.partyId })

logger.info('Alice created Allocation for her TransferLeg')

const pendingAllocationRequestsBob = await sdk.token.allocation.request.pending(
    recipient.partyId
)

const allocationRequestViewBob =
    pendingAllocationRequestsBob?.[0].interfaceViewValue!

const legIdBob = Object.keys(allocationRequestViewAlice.transferLegs).find(
    (key) =>
        allocationRequestViewAlice.transferLegs[key].sender ===
        recipient!.partyId
)!
if (!legIdBob) throw new Error(`No leg found for Bob`)

const legBob = allocationRequestViewAlice.transferLegs[legIdBob]

const specBob = {
    settlement: allocationRequestViewBob.settlement,
    transferLegId: legIdBob,
    transferLeg: legBob,
}

//TODO: go over if we should pass in expectedAdmin or instrumentId/registryUrl

const [allocateCmdBob, allocateDisclosedBlice] =
    await sdk.token.allocation.instruction.create({
        allocationSpecification: specBob,
        asset: amuletAsset,
    })

await sdk.ledger
    .prepare({
        partyId: recipient.partyId,
        commands: allocateCmdBob,
        disclosedContracts: allocateDisclosedBlice,
    })
    .sign(recipient.keyPair.privateKey)
    .execute({ partyId: recipient.partyId })

logger.info('Bob created Allocation for his TransferLeg')

// Once the legs have been allocated, venue settles the trade triggering transfer of holdings

const allocationsVenue = await sdk.token.allocation.pending(venue.partyId)

const settlementRefId = allocationRequestViewAlice.settlement.settlementRef.id
const relevantAllocations = allocationsVenue.filter(
    (a) =>
        a.interfaceViewValue.allocation.settlement.executor ===
            venue!.partyId &&
        a.interfaceViewValue.allocation.settlement.settlementRef.id ===
            settlementRefId
)

if (relevantAllocations.length === 0)
    throw new Error('No matching allocations for this trade')

const allocationEntries = await Promise.all(
    relevantAllocations.map(async (a) => {
        const cid = a.contractId
        const choiceContext = await sdk.token.allocation.context.execute({
            allocationCid: cid,
            registryUrl: localNetStaticConfig.LOCALNET_REGISTRY_API_URL,
        })

        return {
            cid,
            legId: a.interfaceViewValue.allocation.transferLegId,
            extraArgs: {
                context: {
                    values: choiceContext.choiceContextData?.values ?? {},
                },
                meta: { values: {} },
            },
            disclosedContracts: choiceContext.disclosedContracts ?? [],
        }
    })
)

const allocationsWithContext: Record<string, { _1: string; _2: any }> =
    Object.fromEntries(
        allocationEntries.map((e) => [e.legId, { _1: e.cid, _2: e.extraArgs }])
    )

const uniqueDisclosedContracts = Array.from(
    new Map(
        allocationEntries
            .flatMap((e) => e.disclosedContracts)
            .map((d: any) => [d.contractId, d])
    ).values()
)

const settleCmd = [
    {
        ExerciseCommand: {
            templateId:
                '#splice-token-test-trading-app:Splice.Testing.Apps.TradingApp:OTCTrade',
            contractId: otcTradeCid,
            choice: 'OTCTrade_Settle',
            choiceArgument: { allocationsWithContext },
        },
    },
]

await sdk.ledger
    .prepare({
        partyId: venue.partyId,
        commands: settleCmd,
        disclosedContracts: uniqueDisclosedContracts,
    })
    .sign(venue.keyPair.privateKey)
    .execute({ partyId: venue.partyId })

logger.info(
    'Venue settled the OTCTrade, holdings are transfered to Alice and Bob'
)

await sdk.token.utxos
    .list({
        partyId: sender.partyId,
    })
    .then((transactions) => {
        logger.info(
            transactions,
            'Token Standard Holding Transactions (Alice):'
        )
    })

await sdk.token.utxos
    .list({
        partyId: recipient.partyId,
    })
    .then((transactions) => {
        logger.info(transactions, 'Token Standard Holding Transactions (Bob):')
    })

await sdk.token.holdings({ partyId: recipient.partyId }).then((allHoldings) => {
    logger.info(allHoldings, 'List holding transactions (Bob)')
})
