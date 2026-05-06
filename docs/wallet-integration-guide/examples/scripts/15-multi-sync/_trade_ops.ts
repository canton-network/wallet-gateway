// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import type { Logger } from 'pino'
import type { ContractSpec } from '../utils/index.js'
import type { MultiSyncSetup } from './_setup.js'

// ── ACS contract entry (as returned by ledger.acs.read) ───────────────────────

interface AcsContractEntry {
    contractId: string
    templateId: string
    createdEventBlob?: string
    synchronizerId: string
}

// ── Template / interface identifiers ─────────────────────────────────────────

export const AMULET_TEMPLATE_ID = '#splice-amulet:Splice.Amulet:Amulet'
export const TEST_TOKEN_PREFIX =
    '#splice-test-token-v1:Splice.Testing.Tokens.TestTokenV1'
export const TRADING_APP_PREFIX =
    '#splice-token-test-trading-app:Splice.Testing.Apps.TradingApp'

const ALLOCATION_FACTORY_IFACE =
    '#splice-api-token-allocation-instruction-v1:Splice.Api.Token.AllocationInstructionV1:AllocationFactory'
const TRANSFER_FACTORY_IFACE =
    '#splice-api-token-transfer-instruction-v1:Splice.Api.Token.TransferInstructionV1:TransferFactory'

export function buildAllPartySpecs(setup: MultiSyncSetup): ContractSpec[] {
    const { p1Sdk, p2Sdk, p3Sdk, alice, bob, tradingApp } = setup
    return [
        {
            label: 'Alice',
            sdk: p1Sdk,
            templateIds: [
                AMULET_TEMPLATE_ID,
                `${TEST_TOKEN_PREFIX}:Token`,
                `${TRADING_APP_PREFIX}:OTCTradeProposal`,
                `${TRADING_APP_PREFIX}:OTCTrade`,
            ],
            parties: [alice.partyId],
        },
        {
            label: 'Bob',
            sdk: p2Sdk,
            templateIds: [
                AMULET_TEMPLATE_ID,
                `${TEST_TOKEN_PREFIX}:TokenRules`,
                `${TEST_TOKEN_PREFIX}:Token`,
            ],
            parties: [bob.partyId],
        },
        {
            label: 'TradingApp',
            sdk: p3Sdk,
            templateIds: [
                `${TRADING_APP_PREFIX}:OTCTradeProposal`,
                `${TRADING_APP_PREFIX}:OTCTrade`,
            ],
            parties: [tradingApp.partyId],
        },
    ]
}

export const ALICE_AMULET_TAP_AMOUNT = '2000000'
export const BOB_TOKEN_MINT_AMOUNT = '500'
export const TRADE_AMULET_AMOUNT = '100'
export const TRADE_TOKEN_AMOUNT = '20'

export async function mintAmuletForAlice(
    setup: MultiSyncSetup,
    logger: Logger
): Promise<void> {
    const { p1Sdk, alice, globalSynchronizerId, scanProxy } = setup
    const {
        amuletRulesContract,
        amuletRulesCid,
        activeRoundContract,
        openMiningRoundCid,
    } = await scanProxy.fetchAmuletInfo()

    await p1Sdk.ledger
        .prepare({
            partyId: alice.partyId,
            commands: [
                {
                    ExerciseCommand: {
                        templateId:
                            '#splice-amulet:Splice.AmuletRules:AmuletRules',
                        contractId: amuletRulesCid,
                        choice: 'AmuletRules_DevNet_Tap',
                        choiceArgument: {
                            receiver: alice.partyId,
                            amount: ALICE_AMULET_TAP_AMOUNT,
                            openRound: openMiningRoundCid,
                        },
                    },
                },
            ],
            disclosedContracts: [
                {
                    templateId: amuletRulesContract.template_id,
                    contractId: amuletRulesCid,
                    createdEventBlob: amuletRulesContract.created_event_blob,
                    synchronizerId: globalSynchronizerId,
                },
                {
                    templateId: activeRoundContract.template_id,
                    contractId: openMiningRoundCid,
                    createdEventBlob: activeRoundContract.created_event_blob,
                    synchronizerId: globalSynchronizerId,
                },
            ],
            synchronizerId: globalSynchronizerId,
        })
        .sign(alice.keyPair.privateKey)
        .execute({ partyId: alice.partyId })

    logger.info(
        `Alice: Amulet minted (${ALICE_AMULET_TAP_AMOUNT}) on global synchronizer`
    )
}

export async function createTokenRulesAndMintForBob(
    setup: MultiSyncSetup,
    logger: Logger
): Promise<void> {
    const { p2Sdk, bob, appSynchronizerId } = setup

    await Promise.all([
        p2Sdk.ledger
            .prepare({
                partyId: bob.partyId,
                commands: {
                    CreateCommand: {
                        templateId: `${TEST_TOKEN_PREFIX}:TokenRules`,
                        createArguments: { admin: bob.partyId },
                    },
                },
                disclosedContracts: [],
                synchronizerId: appSynchronizerId,
            })
            .sign(bob.keyPair.privateKey)
            .execute({ partyId: bob.partyId }),

        p2Sdk.ledger
            .prepare({
                partyId: bob.partyId,
                commands: {
                    CreateCommand: {
                        templateId: `${TEST_TOKEN_PREFIX}:Token`,
                        createArguments: {
                            holding: {
                                owner: bob.partyId,
                                instrumentId: {
                                    admin: bob.partyId,
                                    id: 'TestToken',
                                },
                                amount: BOB_TOKEN_MINT_AMOUNT,
                                lock: null,
                                meta: { values: {} },
                            },
                        },
                    },
                },
                disclosedContracts: [],
                synchronizerId: appSynchronizerId,
            })
            .sign(bob.keyPair.privateKey)
            .execute({ partyId: bob.partyId }),
    ])

    logger.info(
        `Bob: TokenRules created + Token minted (${BOB_TOKEN_MINT_AMOUNT} TestToken) on app-synchronizer`
    )
}

/**
/**
 * Low-level helper: executes a two-phase Canton reassignment (UnassignCommand →
 * AssignCommand) for a single contract. Submits both phases against the Canton
 * Ledger API v2 `/v2/commands/submit-and-wait-for-reassignment` endpoint.
 *
 * @param ledgerProvider - raw provider obtained via `sdkContext.ledgerProvider`
 * @param submitter      - party ID that owns/witnesses the contract
 * @param contractId     - contract ID to move
 * @param source         - synchronizer the contract currently lives on
 * @param target         - synchronizer to move it to
 * @param label          - human-readable name used in error messages
 */
async function reassignContract(
    ledgerProvider: { request(params: unknown): Promise<unknown> },
    submitter: string,
    contractId: string,
    source: string,
    target: string,
    label: string
): Promise<void> {
    // Phase 1: Unassign.
    // eventFormat MUST be provided; without it the response contains no events
    // and the reassignmentId cannot be extracted.
    const unassignResponse = await ledgerProvider.request({
        method: 'ledgerApi',
        params: {
            resource: '/v2/commands/submit-and-wait-for-reassignment',
            requestMethod: 'post',
            body: {
                reassignmentCommands: {
                    commandId: `${label}-unassign-${Date.now()}`,
                    submitter,
                    commands: [
                        {
                            command: {
                                UnassignCommand: {
                                    value: { contractId, source, target },
                                },
                            },
                        },
                    ],
                },
                eventFormat: {
                    filtersByParty: { [submitter]: {} },
                    verbose: false,
                },
            },
        },
    })

    const events: unknown[] =
        (unassignResponse as { reassignment?: { events?: unknown[] } })
            ?.reassignment?.events ?? []
    const unassignedEvent = events.find(
        (e) => typeof e === 'object' && e !== null && 'JsUnassignedEvent' in e
    ) as
        | { JsUnassignedEvent: { value: { reassignmentId: string } } }
        | undefined
    if (!unassignedEvent)
        throw new Error(
            `No unassigned event returned for ${label} reassignment`
        )
    const reassignmentId =
        unassignedEvent.JsUnassignedEvent.value.reassignmentId

    // Phase 2: Assign
    await ledgerProvider.request({
        method: 'ledgerApi',
        params: {
            resource: '/v2/commands/submit-and-wait-for-reassignment',
            requestMethod: 'post',
            body: {
                reassignmentCommands: {
                    commandId: `${label}-assign-${Date.now()}`,
                    submitter,
                    commands: [
                        {
                            command: {
                                AssignCommand: {
                                    value: { reassignmentId, source, target },
                                },
                            },
                        },
                    ],
                },
            },
        },
    })
}

export async function createAndInitiateOtcTrade(
    setup: MultiSyncSetup,
    transferLegs: Record<string, unknown>,
    logger: Logger
): Promise<string> {
    const {
        p1Sdk,
        p2Sdk,
        p3Sdk,
        alice,
        bob,
        tradingApp,
        globalSynchronizerId,
    } = setup

    const readProposalCid = async (
        sdk: typeof p1Sdk,
        party: string
    ): Promise<string> => {
        const contracts = await sdk.ledger.acs.read({
            templateIds: [`${TRADING_APP_PREFIX}:OTCTradeProposal`],
            parties: [party],
            filterByParty: true,
        })
        if (!contracts.length) throw new Error('OTCTradeProposal not found')
        return contracts[0].contractId
    }

    await p1Sdk.ledger
        .prepare({
            partyId: alice.partyId,
            commands: {
                CreateCommand: {
                    templateId: `${TRADING_APP_PREFIX}:OTCTradeProposal`,
                    createArguments: {
                        venue: tradingApp.partyId,
                        tradeCid: null,
                        transferLegs,
                        approvers: [alice.partyId],
                    },
                },
            },
            disclosedContracts: [],
            synchronizerId: globalSynchronizerId,
        })
        .sign(alice.keyPair.privateKey)
        .execute({ partyId: alice.partyId })
    logger.info(
        `Alice: OTCTradeProposal created (leg-0: ${TRADE_AMULET_AMOUNT} Amulet → Bob, leg-1: ${TRADE_TOKEN_AMOUNT} TestToken → Alice)`
    )

    await p2Sdk.ledger
        .prepare({
            partyId: bob.partyId,
            commands: [
                {
                    ExerciseCommand: {
                        templateId: `${TRADING_APP_PREFIX}:OTCTradeProposal`,
                        contractId: await readProposalCid(p2Sdk, bob.partyId),
                        choice: 'OTCTradeProposal_Accept',
                        choiceArgument: { approver: bob.partyId },
                    },
                },
            ],
            disclosedContracts: [],
            synchronizerId: globalSynchronizerId,
        })
        .sign(bob.keyPair.privateKey)
        .execute({ partyId: bob.partyId })
    logger.info('Bob: OTCTradeProposal_Accept executed')

    const prepareUntil = new Date(Date.now() + 1800 * 1000).toISOString()
    const settleBefore = new Date(Date.now() + 3600 * 1000).toISOString()

    await p3Sdk.ledger
        .prepare({
            partyId: tradingApp.partyId,
            commands: [
                {
                    ExerciseCommand: {
                        templateId: `${TRADING_APP_PREFIX}:OTCTradeProposal`,
                        contractId: await readProposalCid(
                            p3Sdk,
                            tradingApp.partyId
                        ),
                        choice: 'OTCTradeProposal_InitiateSettlement',
                        choiceArgument: { prepareUntil, settleBefore },
                    },
                },
            ],
            disclosedContracts: [],
            synchronizerId: globalSynchronizerId,
        })
        .sign(tradingApp.keyPair.privateKey)
        .execute({ partyId: tradingApp.partyId })
    logger.info(
        'TradingApp: OTCTradeProposal_InitiateSettlement executed → OTCTrade created'
    )

    const otcTradeContracts = await p3Sdk.ledger.acs.read({
        templateIds: [`${TRADING_APP_PREFIX}:OTCTrade`],
        parties: [tradingApp.partyId],
        filterByParty: true,
    })
    const otcTradeCid = otcTradeContracts[0]?.contractId
    if (!otcTradeCid)
        throw new Error('OTCTrade contract not found after initiation')
    return otcTradeCid
}

export async function allocateAmuletForAlice(
    setup: MultiSyncSetup,
    logger: Logger
): Promise<string> {
    const {
        p1Sdk,
        tokenP1,
        alice,
        globalSynchronizerId,
        scanProxy,
        amuletAdmin,
    } = setup

    const pendingRequests = await tokenP1.allocation.request.pending(
        alice.partyId
    )
    const requestView = pendingRequests[0].interfaceViewValue!
    const legId = Object.keys(requestView.transferLegs).find(
        (key) => requestView.transferLegs[key].sender === alice.partyId
    )!
    if (!legId) throw new Error('No transfer leg found for Alice')

    const amuletHoldings = await p1Sdk.ledger.acs.read({
        templateIds: [AMULET_TEMPLATE_ID],
        parties: [alice.partyId],
        filterByParty: true,
    })
    const amuletHoldingCid = amuletHoldings[0]?.contractId
    if (!amuletHoldingCid) throw new Error('Amulet holding not found for Alice')

    const allocationArgs = {
        expectedAdmin: amuletAdmin,
        allocation: {
            settlement: requestView.settlement,
            transferLegId: legId,
            transferLeg: requestView.transferLegs[legId],
        },
        requestedAt: new Date(Date.now() - 60_000).toISOString(),
        inputHoldingCids: [amuletHoldingCid],
        extraArgs: {
            context: { values: {} as Record<string, unknown> },
            meta: { values: {} },
        },
    }

    const { factoryId, choiceContext } =
        await scanProxy.fetchAllocationFactory(allocationArgs)
    allocationArgs.extraArgs.context = {
        ...(choiceContext.choiceContextData ?? {}),
        values:
            (choiceContext.choiceContextData?.values as Record<
                string,
                unknown
            >) ?? {},
    }

    await p1Sdk.ledger
        .prepare({
            partyId: alice.partyId,
            commands: [
                {
                    ExerciseCommand: {
                        templateId: ALLOCATION_FACTORY_IFACE,
                        contractId: factoryId,
                        choice: 'AllocationFactory_Allocate',
                        choiceArgument: allocationArgs,
                    },
                },
            ],
            disclosedContracts: choiceContext.disclosedContracts ?? [],
            synchronizerId: globalSynchronizerId,
        })
        .sign(alice.keyPair.privateKey)
        .execute({ partyId: alice.partyId })

    logger.info('Alice: Amulet allocated for leg-0 (global synchronizer)')
    return legId
}

export async function allocateTokenForBob(
    setup: MultiSyncSetup,
    logger: Logger
): Promise<{
    legId: string
    tokenRulesCid: string
    tokenRulesContract: AcsContractEntry
}> {
    const { p2Sdk, tokenP2, bob, globalSynchronizerId } = setup

    const pendingRequests = await tokenP2.allocation.request.pending(
        bob.partyId
    )
    const requestView = pendingRequests[0].interfaceViewValue!
    const legId = Object.keys(requestView.transferLegs).find(
        (key) => requestView.transferLegs[key].sender === bob.partyId
    )!
    if (!legId) throw new Error('No transfer leg found for Bob')

    const [tokenHoldings, tokenRulesContracts] = await Promise.all([
        p2Sdk.ledger.acs.read({
            templateIds: [`${TEST_TOKEN_PREFIX}:Token`],
            parties: [bob.partyId],
            filterByParty: true,
        }),
        p2Sdk.ledger.acs.read({
            templateIds: [`${TEST_TOKEN_PREFIX}:TokenRules`],
            parties: [bob.partyId],
            filterByParty: true,
        }),
    ])

    const tokenHoldingCid = tokenHoldings[0]?.contractId
    if (!tokenHoldingCid) throw new Error('Token holding not found for Bob')
    const tokenRulesCid = tokenRulesContracts[0]?.contractId
    if (!tokenRulesCid) throw new Error('TokenRules contract not found')
    const tokenRulesContract = tokenRulesContracts[0]

    await p2Sdk.ledger
        .prepare({
            partyId: bob.partyId,
            commands: [
                {
                    ExerciseCommand: {
                        templateId: ALLOCATION_FACTORY_IFACE,
                        contractId: tokenRulesCid,
                        choice: 'AllocationFactory_Allocate',
                        choiceArgument: {
                            expectedAdmin: bob.partyId,
                            allocation: {
                                settlement: requestView.settlement,
                                transferLegId: legId,
                                transferLeg: requestView.transferLegs[legId],
                            },
                            requestedAt: new Date(
                                Date.now() - 60_000
                            ).toISOString(),
                            inputHoldingCids: [tokenHoldingCid],
                            extraArgs: {
                                context: { values: {} },
                                meta: { values: {} },
                            },
                        },
                    },
                },
            ],
            disclosedContracts: [],
            synchronizerId: globalSynchronizerId,
        })
        .sign(bob.keyPair.privateKey)
        .execute({ partyId: bob.partyId })

    logger.info('Bob: TestToken allocated for leg-1 (global)')
    return { legId, tokenRulesCid, tokenRulesContract }
}

/**
 * After settlement, reassigns TokenRules (Bob) and Alice's Token from global-domain
 * back to app-synchronizer, so the final self-transfer runs on app-synchronizer.
 * Returns a fresh TokenRules ACS entry with the updated synchronizerId.
 */
export async function reassignToAppAfterSettlement(
    setup: MultiSyncSetup,
    params: { aliceTokenCid: string; tokenRulesCid: string },
    logger: Logger
): Promise<AcsContractEntry> {
    const {
        p2Sdk,
        p1SdkCtx,
        p2SdkCtx,
        alice,
        bob,
        appSynchronizerId,
        globalSynchronizerId,
    } = setup
    const { aliceTokenCid, tokenRulesCid } = params

    // Reassign TokenRules (Bob) from global-domain → app-synchronizer
    await reassignContract(
        p2SdkCtx.ledgerProvider,
        bob.partyId,
        tokenRulesCid,
        globalSynchronizerId,
        appSynchronizerId,
        'bob-TokenRules'
    )
    logger.info(
        'Bob: TokenRules reassigned from global-domain to app-synchronizer'
    )

    // Reassign Alice's Token from global-domain → app-synchronizer
    await reassignContract(
        p1SdkCtx.ledgerProvider,
        alice.partyId,
        aliceTokenCid,
        globalSynchronizerId,
        appSynchronizerId,
        'alice-Token'
    )
    logger.info(
        'Alice: Token reassigned from global-domain to app-synchronizer'
    )

    // Re-read TokenRules so the caller gets the updated synchronizerId for disclosedContracts
    const tokenRulesContracts = await p2Sdk.ledger.acs.read({
        templateIds: [`${TEST_TOKEN_PREFIX}:TokenRules`],
        parties: [bob.partyId],
        filterByParty: true,
    })
    const freshTokenRules = tokenRulesContracts[0]
    if (!freshTokenRules)
        throw new Error('TokenRules not found after reassignment to app')
    return freshTokenRules
}

export interface SettleParams {
    otcTradeCid: string
    legIdAlice: string
    legIdBob: string
    testTokenAllocationCid: string
}

export async function settleOtcTrade(
    setup: MultiSyncSetup,
    params: SettleParams,
    logger: Logger
): Promise<void> {
    const {
        p3Sdk,
        tokenP1,
        alice,
        tradingApp,
        globalSynchronizerId,
        scanProxy,
    } = setup
    const { otcTradeCid, legIdAlice, legIdBob, testTokenAllocationCid } = params

    const allocationsAlice = await tokenP1.allocation.pending(alice.partyId)
    const amuletAllocation = allocationsAlice.find(
        (a) => a.interfaceViewValue.allocation.transferLegId === legIdAlice
    )
    if (!amuletAllocation) throw new Error('Amulet allocation not found')

    const amuletExecCtx = await scanProxy.fetchExecuteTransferContext(
        amuletAllocation.contractId
    )

    const allocationsWithContext = {
        [legIdAlice]: {
            _1: amuletAllocation.contractId,
            _2: {
                context: {
                    ...(amuletExecCtx.choiceContextData ?? {}),
                    values:
                        (amuletExecCtx.choiceContextData?.values as Record<
                            string,
                            unknown
                        >) ?? {},
                },
                meta: { values: {} },
            },
        },
        [legIdBob]: {
            _1: testTokenAllocationCid,
            _2: { context: { values: {} }, meta: { values: {} } },
        },
    }

    // Amulet system contracts from scan proxy; synchronizerId='' → Canton infers from blob
    const disclosedContracts = (amuletExecCtx.disclosedContracts ?? []).map(
        (c) => ({ ...c, synchronizerId: '' })
    )

    await p3Sdk.ledger
        .prepare({
            partyId: tradingApp.partyId,
            commands: [
                {
                    ExerciseCommand: {
                        templateId: `${TRADING_APP_PREFIX}:OTCTrade`,
                        contractId: otcTradeCid,
                        choice: 'OTCTrade_Settle',
                        choiceArgument: { allocationsWithContext },
                    },
                },
            ],
            disclosedContracts,
            synchronizerId: globalSynchronizerId,
        })
        .sign(tradingApp.keyPair.privateKey)
        .execute({ partyId: tradingApp.partyId })

    logger.info(
        `TradingApp: OTCTrade settled — ${TRADE_AMULET_AMOUNT} Amulet transferred to Bob, ${TRADE_TOKEN_AMOUNT} TestToken transferred to Alice`
    )
}

export interface TransferParams {
    aliceTokenCid: string
    tokenRulesCid: string
    tokenRulesContract: AcsContractEntry
}

/**
 * Self-transfers Alice's TestToken on app-synchronizer via TransferFactory_Transfer.
 * Both TokenRules (the factory) and Alice's Token have been reassigned to app-synchronizer
 * in step 11c, so the submission targets app-synchronizer.
 */
export async function selfTransferToken(
    setup: MultiSyncSetup,
    params: TransferParams,
    logger: Logger
): Promise<void> {
    const { p1Sdk, alice, bob, appSynchronizerId } = setup
    const { aliceTokenCid, tokenRulesCid, tokenRulesContract } = params

    await p1Sdk.ledger
        .prepare({
            partyId: alice.partyId,
            commands: [
                {
                    ExerciseCommand: {
                        templateId: TRANSFER_FACTORY_IFACE,
                        contractId: tokenRulesCid,
                        choice: 'TransferFactory_Transfer',
                        choiceArgument: {
                            expectedAdmin: bob.partyId,
                            transfer: {
                                sender: alice.partyId,
                                receiver: alice.partyId,
                                amount: TRADE_TOKEN_AMOUNT,
                                instrumentId: {
                                    admin: bob.partyId,
                                    id: 'TestToken',
                                },
                                requestedAt: new Date(
                                    Date.now() - 60_000
                                ).toISOString(),
                                executeBefore: new Date(
                                    Date.now() + 86_400_000
                                ).toISOString(),
                                inputHoldingCids: [aliceTokenCid],
                                meta: { values: {} },
                            },
                            extraArgs: {
                                context: { values: {} },
                                meta: { values: {} },
                            },
                        },
                    },
                },
            ],
            disclosedContracts: [
                {
                    templateId: tokenRulesContract.templateId,
                    contractId: tokenRulesCid,
                    createdEventBlob: tokenRulesContract.createdEventBlob!,
                    synchronizerId: tokenRulesContract.synchronizerId,
                },
            ],
            synchronizerId: appSynchronizerId,
        })
        .sign(alice.keyPair.privateKey)
        .execute({ partyId: alice.partyId })

    logger.info(
        'Alice: TestToken self-transferred on app-synchronizer via TransferFactory_Transfer'
    )
}
