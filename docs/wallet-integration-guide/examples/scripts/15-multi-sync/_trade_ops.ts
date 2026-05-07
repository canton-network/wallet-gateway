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
// Custom token package (splice-test-token-self-transfer-v1) — a variant of
// splice-test-token-v1 that adds a `Token_SelfTransfer` choice on `Token`,
// so self-transfers do not need the `TokenRules` factory contract.
export const TEST_TOKEN_PREFIX =
    '#splice-test-token-self-transfer-v1:Splice.Testing.Tokens.SelfTransferTokenV1'
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
    tokenRulesCid: string
}

/**
 * Bob self-transfers a portion of his remaining TestToken holding from global
 * back to app-synchronizer. After the OTC settlement, Bob's senderChange Token
 * (the post-allocation remainder) and TokenRules both live on global. Bob is
 * the signatory of both contracts (Token: owner+admin, TokenRules: admin), so
 * when P2 submits this command targeting app-synchronizer, Canton automatically
 * reassigns both contracts global → app-synchronizer.
 *
 * This demonstrates a second automatic cross-synchronizer reassignment
 * (the inverse direction of step 10), with no manual reassign required.
 */
export async function selfTransferToken(
    setup: MultiSyncSetup,
    params: TransferParams,
    logger: Logger
): Promise<void> {
    const { p2Sdk, bob, appSynchronizerId } = setup
    const { tokenRulesCid } = params

    const bobTokens = await p2Sdk.ledger.acs.read({
        templateIds: [`${TEST_TOKEN_PREFIX}:Token`],
        parties: [bob.partyId],
        filterByParty: true,
    })
    const bobTokenCid = bobTokens[0]?.contractId
    if (!bobTokenCid)
        throw new Error(
            'Bob: remainder Token holding not found after settlement'
        )

    const selfTransferAmount = '100'

    await p2Sdk.ledger
        .prepare({
            partyId: bob.partyId,
            commands: [
                {
                    ExerciseCommand: {
                        templateId: `${TEST_TOKEN_PREFIX}:Token`,
                        contractId: bobTokenCid,
                        choice: 'Token_SelfTransfer',
                        choiceArgument: {
                            splitAmount: selfTransferAmount,
                        },
                    },
                },
            ],
            // No TokenRules needed: `Token_SelfTransfer` operates only on the
            // Token contract itself. P2 hosts Bob (signatory of Token), so
            // Canton auto-reassigns the Token global → app for this command.
            disclosedContracts: [],
            synchronizerId: appSynchronizerId,
        })
        .sign(bob.keyPair.privateKey)
        .execute({ partyId: bob.partyId })

    logger.info(
        `Bob: ${selfTransferAmount} TestToken self-transferred on app-synchronizer ` +
            `(Token_SelfTransfer choice — no TokenRules involved; ` +
            `Canton auto-reassigned Token global → app)`
    )
}

/**
 * Alice self-transfers her TestToken (received from the OTC settlement) from
 * global to app-synchronizer using the new `Token_SelfTransfer` choice on
 * `Token`. Because that choice operates only on the Token contract (and the
 * input Token already carries admin's signature, authorizing the new outputs),
 * no `TokenRules` contract has to be referenced or disclosed at all.
 * P1 hosts Alice (signatory of her Token), so Canton auto-reassigns the
 * Token global → app as part of this command.
 */
export async function aliceSelfTransferToApp(
    setup: MultiSyncSetup,
    logger: Logger
): Promise<void> {
    const { p1Sdk, alice, appSynchronizerId } = setup

    const aliceTokens = await p1Sdk.ledger.acs.read({
        templateIds: [`${TEST_TOKEN_PREFIX}:Token`],
        parties: [alice.partyId],
        filterByParty: true,
    })
    const aliceTokenCid = aliceTokens[0]?.contractId
    if (!aliceTokenCid)
        throw new Error('Alice: Token holding not found after settlement')

    await p1Sdk.ledger
        .prepare({
            partyId: alice.partyId,
            commands: [
                {
                    ExerciseCommand: {
                        templateId: `${TEST_TOKEN_PREFIX}:Token`,
                        contractId: aliceTokenCid,
                        choice: 'Token_SelfTransfer',
                        choiceArgument: {
                            splitAmount: TRADE_TOKEN_AMOUNT,
                        },
                    },
                },
            ],
            disclosedContracts: [],
            synchronizerId: appSynchronizerId,
        })
        .sign(alice.keyPair.privateKey)
        .execute({ partyId: alice.partyId })

    logger.info(
        `Alice: ${TRADE_TOKEN_AMOUNT} TestToken self-transferred on app-synchronizer ` +
            `(Token_SelfTransfer choice — no TokenRules involved; ` +
            `Canton auto-reassigned Alice's Token global → app)`
    )
}
