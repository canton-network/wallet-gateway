// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import type { Logger } from 'pino'
import { localNetStaticConfig } from '@canton-network/wallet-sdk'
import type { ContractSpec } from '../utils/index.js'
import type { MultiSyncSetup } from './_setup.js'
import {
    PARTY_HINT_ALICE,
    PARTY_HINT_BOB,
    PARTY_HINT_TRADING_APP,
    PARTY_HINT_TOKEN_ADMIN,
} from './_config.js'

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

const TRANSFER_FACTORY_IFACE =
    '#splice-api-token-transfer-instruction-v1:Splice.Api.Token.TransferInstructionV1:TransferFactory'
export function buildContractReadSpec(setup: MultiSyncSetup): ContractSpec[] {
    const { p1Sdk, p2Sdk, p3Sdk, alice, bob, tradingApp, tokenAdmin } = setup
    return [
        {
            label: PARTY_HINT_ALICE,
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
            label: PARTY_HINT_BOB,
            sdk: p2Sdk,
            templateIds: [AMULET_TEMPLATE_ID, `${TEST_TOKEN_PREFIX}:Token`],
            parties: [bob.partyId],
        },
        {
            label: PARTY_HINT_TOKEN_ADMIN,
            sdk: p2Sdk,
            templateIds: [`${TEST_TOKEN_PREFIX}:TokenRules`],
            parties: [tokenAdmin.partyId],
        },
        {
            label: PARTY_HINT_TRADING_APP,
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

const MS_30_MIN = 30 * 60 * 1000
const MS_1_HOUR = 60 * 60 * 1000
const MS_24_HOURS = 24 * 60 * 60 * 1000

export async function mintAmuletForAlice(
    setup: MultiSyncSetup,
    logger: Logger
): Promise<void> {
    const { p1Sdk, alice, globalSynchronizerId, scanProxy } = setup
    const [amuletRulesContract, activeRoundContract] = await Promise.all([
        scanProxy.getAmuletRules(),
        scanProxy.getActiveOpenMiningRound(),
    ])
    if (!activeRoundContract) throw new Error('No active OpenMiningRound found')
    const amuletRulesCid = amuletRulesContract.contract_id
    const openMiningRoundCid = activeRoundContract.contract_id

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
    const { p2Sdk, bob, tokenAdmin, globalSynchronizerId, appSynchronizerId } =
        setup

    // tokenAdmin is hosted on P2; use p2Sdk for all tokenAdmin submissions
    await Promise.all([
        p2Sdk.ledger
            .prepare({
                partyId: tokenAdmin.partyId,
                commands: {
                    CreateCommand: {
                        templateId: `${TEST_TOKEN_PREFIX}:TokenRules`,
                        createArguments: { admin: tokenAdmin.partyId },
                    },
                },
                disclosedContracts: [],
                synchronizerId: globalSynchronizerId,
            })
            .sign(tokenAdmin.keyPair.privateKey)
            .execute({ partyId: tokenAdmin.partyId }),
        p2Sdk.ledger
            .prepare({
                partyId: tokenAdmin.partyId,
                commands: {
                    CreateCommand: {
                        templateId: `${TEST_TOKEN_PREFIX}:TokenRules`,
                        createArguments: { admin: tokenAdmin.partyId },
                    },
                },
                disclosedContracts: [],
                synchronizerId: appSynchronizerId,
            })
            .sign(tokenAdmin.keyPair.privateKey)
            .execute({ partyId: tokenAdmin.partyId }),
    ])

    // Mint Token on app-synchronizer via P2 (sv/P3 is global-only)
    await p2Sdk.ledger
        .prepare({
            partyId: tokenAdmin.partyId,
            commands: [
                {
                    CreateCommand: {
                        templateId: `${TEST_TOKEN_PREFIX}:Token`,
                        createArguments: {
                            holding: {
                                owner: tokenAdmin.partyId,
                                instrumentId: {
                                    admin: tokenAdmin.partyId,
                                    id: 'TestToken',
                                },
                                amount: BOB_TOKEN_MINT_AMOUNT,
                                lock: null,
                                meta: { values: {} },
                            },
                        },
                    },
                },
            ],
            disclosedContracts: [],
            synchronizerId: appSynchronizerId,
        })
        .sign(tokenAdmin.keyPair.privateKey)
        .execute({ partyId: tokenAdmin.partyId })

    // Read tokenAdmin's contracts via P2 (P2 is connected to both synchronizers)
    const [tokenRulesContracts, adminTokenHoldings] = await Promise.all([
        p2Sdk.ledger.acs.read({
            templateIds: [`${TEST_TOKEN_PREFIX}:TokenRules`],
            parties: [tokenAdmin.partyId],
            filterByParty: true,
        }),
        p2Sdk.ledger.acs.read({
            templateIds: [`${TEST_TOKEN_PREFIX}:Token`],
            parties: [tokenAdmin.partyId],
            filterByParty: true,
        }),
    ])
    const appTokenRules = tokenRulesContracts.find(
        (c) => c.synchronizerId === appSynchronizerId
    )
    if (!appTokenRules)
        throw new Error(
            'TokenRules not found on app synchronizer after creation'
        )
    const adminTokenCid = adminTokenHoldings[0]?.contractId
    if (!adminTokenCid)
        throw new Error('TokenAdmin Token holding not found after mint')

    // Transfer Token to Bob on app-synchronizer via P2 (sv/P3 is global-only)
    await p2Sdk.ledger
        .prepare({
            partyId: tokenAdmin.partyId,
            commands: [
                {
                    ExerciseCommand: {
                        templateId: TRANSFER_FACTORY_IFACE,
                        contractId: appTokenRules.contractId,
                        choice: 'TransferFactory_Transfer',
                        choiceArgument: {
                            expectedAdmin: tokenAdmin.partyId,
                            transfer: {
                                sender: tokenAdmin.partyId,
                                receiver: bob.partyId,
                                amount: BOB_TOKEN_MINT_AMOUNT,
                                instrumentId: {
                                    admin: tokenAdmin.partyId,
                                    id: 'TestToken',
                                },
                                requestedAt: new Date(Date.now()).toISOString(),
                                executeBefore: new Date(
                                    Date.now() + MS_24_HOURS
                                ).toISOString(),
                                inputHoldingCids: [adminTokenCid],
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
            disclosedContracts: [],
            synchronizerId: appSynchronizerId,
        })
        .sign(tokenAdmin.keyPair.privateKey)
        .execute({ partyId: tokenAdmin.partyId })

    const transferOffers = await p2Sdk.ledger.acs.read({
        templateIds: [`${TEST_TOKEN_PREFIX}:TokenTransferOffer`],
        parties: [bob.partyId],
        filterByParty: true,
    })
    const transferOfferCid = transferOffers[0]?.contractId
    if (!transferOfferCid)
        throw new Error('TokenTransferOffer not found for Bob')

    const transferInstructionIface =
        '#splice-api-token-transfer-instruction-v1:Splice.Api.Token.TransferInstructionV1:TransferInstruction'
    await p2Sdk.ledger
        .prepare({
            partyId: bob.partyId,
            commands: [
                {
                    ExerciseCommand: {
                        templateId: transferInstructionIface,
                        contractId: transferOfferCid,
                        choice: 'TransferInstruction_Accept',
                        choiceArgument: {
                            extraArgs: {
                                context: { values: {} },
                                meta: { values: {} },
                            },
                        },
                    },
                },
            ],
            disclosedContracts: [],
            synchronizerId: appSynchronizerId,
        })
        .sign(bob.keyPair.privateKey)
        .execute({ partyId: bob.partyId })

    logger.info(
        `TokenAdmin: TokenRules created on global + app synchronizers; Bob: ${BOB_TOKEN_MINT_AMOUNT} TestToken minted on app-synchronizer`
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

    const prepareUntil = new Date(Date.now() + MS_30_MIN).toISOString()
    const settleBefore = new Date(Date.now() + MS_1_HOUR).toISOString()

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
        tokenNamespaceP1: tokenNamespaceP1,
        alice,
        globalSynchronizerId,
        amuletAdmin,
    } = setup

    const pendingRequests = await tokenNamespaceP1.allocation.request.pending(
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

    const [command, disclosedContracts] =
        await tokenNamespaceP1.allocation.instruction.create({
            allocationSpecification: {
                settlement: requestView.settlement,
                transferLegId: legId,
                transferLeg: requestView.transferLegs[legId],
            },
            asset: {
                id: 'Amulet',
                displayName: 'Amulet',
                symbol: 'CC',
                registryUrl:
                    localNetStaticConfig.LOCALNET_REGISTRY_API_URL.href,
                admin: amuletAdmin,
            },
            inputUtxos: [amuletHoldingCid],
            requestedAt: new Date().toISOString(),
        })

    await p1Sdk.ledger
        .prepare({
            partyId: alice.partyId,
            commands: [command],
            disclosedContracts,
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
): Promise<{ legId: string }> {
    const { p2Sdk, tokenNamespaceP2, bob, tokenAdmin, globalSynchronizerId } =
        setup

    const pendingRequests = await tokenNamespaceP2.allocation.request.pending(
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
        // Read tokenAdmin's TokenRules via P2 (P2 is connected to both synchronizers)
        p2Sdk.ledger.acs.read({
            templateIds: [`${TEST_TOKEN_PREFIX}:TokenRules`],
            parties: [tokenAdmin.partyId],
            filterByParty: true,
        }),
    ])

    const tokenHolding = tokenHoldings[0]
    if (!tokenHolding) throw new Error('Token holding not found for Bob')
    const tokenRulesOnGlobal = tokenRulesContracts.find(
        (c) => c.synchronizerId === globalSynchronizerId
    )
    if (!tokenRulesOnGlobal)
        throw new Error('TokenRules not found on global synchronizer')

    // Explicitly reassign Bob's token from app-synchronizer to global before allocation.
    // Canton requires the submitter to be a stakeholder of a contract already on the
    // target synchronizer (SUBMITTER_ALWAYS_STAKEHOLDER policy). Without this step,
    // Bob has no contracts on global, so the allocation submission would be rejected.
    if (tokenHolding.synchronizerId !== globalSynchronizerId) {
        await p2Sdk.ledger.internal.reassign({
            submitter: bob.partyId,
            contractId: tokenHolding.contractId,
            source: tokenHolding.synchronizerId,
            target: globalSynchronizerId,
        })
    }

    const [command, disclosedFromHelper] =
        await tokenNamespaceP2.allocation.instruction.create({
            allocationSpecification: {
                settlement: requestView.settlement,
                transferLegId: legId,
                transferLeg: requestView.transferLegs[legId],
            },
            asset: {
                id: 'TestToken',
                displayName: 'TestToken',
                symbol: 'TT',
                registryUrl: 'http://unused.invalid',
                admin: tokenAdmin.partyId,
            },
            inputUtxos: [tokenHolding.contractId],
            requestedAt: new Date(Date.now()).toISOString(),
            prefetchedRegistryChoiceContext: {
                factoryId: tokenRulesOnGlobal.contractId,
                choiceContext: {
                    choiceContextData: {} as Record<string, never>,
                    disclosedContracts: [],
                },
            },
        })

    await p2Sdk.ledger
        .prepare({
            partyId: bob.partyId,
            commands: [command],
            disclosedContracts: [
                ...disclosedFromHelper,
                {
                    templateId: tokenRulesOnGlobal.templateId,
                    contractId: tokenRulesOnGlobal.contractId,
                    createdEventBlob: tokenRulesOnGlobal.createdEventBlob!,
                    synchronizerId: tokenRulesOnGlobal.synchronizerId,
                },
            ],
            synchronizerId: globalSynchronizerId,
        })
        .sign(bob.keyPair.privateKey)
        .execute({ partyId: bob.partyId })

    logger.info(
        'Bob: TestToken allocated for leg-1 (global synchronizer, single-party)'
    )
    return { legId }
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
        tokenNamespaceP1: tokenNamespaceP1,
        alice,
        tradingApp,
        globalSynchronizerId,
    } = setup
    const { otcTradeCid, legIdAlice, legIdBob, testTokenAllocationCid } = params

    const allocationsAlice = await tokenNamespaceP1.allocation.pending(
        alice.partyId
    )
    const amuletAllocation = allocationsAlice.find(
        (a) => a.interfaceViewValue.allocation.transferLegId === legIdAlice
    )
    if (!amuletAllocation) throw new Error('Amulet allocation not found')

    const amuletExecCtx = await tokenNamespaceP1.allocation.context.execute({
        allocationCid: amuletAllocation.contractId,
        registryUrl: localNetStaticConfig.LOCALNET_REGISTRY_API_URL,
    })

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

export async function aliceSelfTransferToApp(
    setup: MultiSyncSetup,
    logger: Logger
): Promise<void> {
    const { p1Sdk, p2Sdk, alice, tokenAdmin, appSynchronizerId } = setup

    const [aliceTokens, tokenRulesContracts] = await Promise.all([
        p1Sdk.ledger.acs.read({
            templateIds: [`${TEST_TOKEN_PREFIX}:Token`],
            parties: [alice.partyId],
            filterByParty: true,
        }),
        // Read tokenAdmin's TokenRules via P2 (sv/P3 is global-only)
        p2Sdk.ledger.acs.read({
            templateIds: [`${TEST_TOKEN_PREFIX}:TokenRules`],
            parties: [tokenAdmin.partyId],
            filterByParty: true,
        }),
    ])
    const aliceToken = aliceTokens[0]
    if (!aliceToken)
        throw new Error('Alice: Token holding not found after settlement')
    const tokenRules = tokenRulesContracts.find(
        (c) => c.synchronizerId === appSynchronizerId
    )
    if (!tokenRules) throw new Error('TokenRules not found on app-synchronizer')

    // Explicitly reassign Alice's token from global to app-synchronizer before the self-transfer.
    // Canton's SUBMITTER_ALWAYS_STAKEHOLDER policy requires the submitter to be a stakeholder
    // of a contract already on the target synchronizer. Without this, Alice has no
    // contracts on app-synchronizer and the submission is rejected.
    if (aliceToken.synchronizerId !== appSynchronizerId) {
        await p1Sdk.ledger.internal.reassign({
            submitter: alice.partyId,
            contractId: aliceToken.contractId,
            source: aliceToken.synchronizerId,
            target: appSynchronizerId,
        })
    }

    await p1Sdk.ledger
        .prepare({
            partyId: alice.partyId,
            commands: [
                {
                    ExerciseCommand: {
                        templateId: TRANSFER_FACTORY_IFACE,
                        contractId: tokenRules.contractId,
                        choice: 'TransferFactory_Transfer',
                        choiceArgument: {
                            expectedAdmin: tokenAdmin.partyId,
                            transfer: {
                                sender: alice.partyId,
                                receiver: alice.partyId,
                                amount: TRADE_TOKEN_AMOUNT,
                                instrumentId: {
                                    admin: tokenAdmin.partyId,
                                    id: 'TestToken',
                                },
                                requestedAt: new Date(Date.now()).toISOString(),
                                executeBefore: new Date(
                                    Date.now() + MS_24_HOURS
                                ).toISOString(),
                                inputHoldingCids: [aliceToken.contractId],
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
                    templateId: tokenRules.templateId,
                    contractId: tokenRules.contractId,
                    createdEventBlob: tokenRules.createdEventBlob!,
                    synchronizerId: tokenRules.synchronizerId,
                },
                // Disclose Alice's token so Canton can verify her as a stakeholder
                // when auto-reassigning it from global to app-synchronizer
                {
                    templateId: aliceToken.templateId,
                    contractId: aliceToken.contractId,
                    createdEventBlob: aliceToken.createdEventBlob!,
                    synchronizerId: aliceToken.synchronizerId,
                },
            ],
            synchronizerId: appSynchronizerId,
        })
        .sign(alice.keyPair.privateKey)
        .execute({ partyId: alice.partyId })

    logger.info(
        `Alice: ${TRADE_TOKEN_AMOUNT} TestToken self-transferred on app-synchronizer`
    )
}

export async function bobSelfTransferToApp(
    setup: MultiSyncSetup,
    logger: Logger
): Promise<void> {
    const { p2Sdk, bob, tokenAdmin, appSynchronizerId } = setup

    const [bobTokens, tokenRulesContracts] = await Promise.all([
        p2Sdk.ledger.acs.read({
            templateIds: [`${TEST_TOKEN_PREFIX}:Token`],
            parties: [bob.partyId],
            filterByParty: true,
        }),
        // Read tokenAdmin's TokenRules via P2 (sv/P3 is global-only)
        p2Sdk.ledger.acs.read({
            templateIds: [`${TEST_TOKEN_PREFIX}:TokenRules`],
            parties: [tokenAdmin.partyId],
            filterByParty: true,
        }),
    ])

    if (bobTokens.length === 0) {
        logger.info('Bob: no TestToken holdings to self-transfer')
        return
    }
    const tokenRules = tokenRulesContracts.find(
        (c) => c.synchronizerId === appSynchronizerId
    )
    if (!tokenRules) throw new Error('TokenRules not found on app-synchronizer')

    for (const token of bobTokens) {
        const holdingAmount = (
            token as unknown as {
                createArgument: { holding: { amount: string } }
            }
        ).createArgument?.holding?.amount
        if (!holdingAmount)
            throw new Error('Cannot read amount from Bob Token holding')

        // Explicitly reassign Bob's token to app-synchronizer before the self-transfer
        // (same SUBMITTER_ALWAYS_STAKEHOLDER constraint as above)
        if (token.synchronizerId !== appSynchronizerId) {
            await p2Sdk.ledger.internal.reassign({
                submitter: bob.partyId,
                contractId: token.contractId,
                source: token.synchronizerId,
                target: appSynchronizerId,
            })
        }

        await p2Sdk.ledger
            .prepare({
                partyId: bob.partyId,
                commands: [
                    {
                        ExerciseCommand: {
                            templateId: TRANSFER_FACTORY_IFACE,
                            contractId: tokenRules.contractId,
                            choice: 'TransferFactory_Transfer',
                            choiceArgument: {
                                expectedAdmin: tokenAdmin.partyId,
                                transfer: {
                                    sender: bob.partyId,
                                    receiver: bob.partyId,
                                    amount: holdingAmount,
                                    instrumentId: {
                                        admin: tokenAdmin.partyId,
                                        id: 'TestToken',
                                    },
                                    requestedAt: new Date(
                                        Date.now()
                                    ).toISOString(),
                                    executeBefore: new Date(
                                        Date.now() + MS_24_HOURS
                                    ).toISOString(),
                                    inputHoldingCids: [token.contractId],
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
                        templateId: tokenRules.templateId,
                        contractId: tokenRules.contractId,
                        createdEventBlob: tokenRules.createdEventBlob!,
                        synchronizerId: tokenRules.synchronizerId,
                    },
                    // Disclose the token so Canton can verify Bob as a stakeholder
                    // when auto-reassigning it from global to app-synchronizer
                    {
                        templateId: token.templateId,
                        contractId: token.contractId,
                        createdEventBlob: token.createdEventBlob!,
                        synchronizerId: token.synchronizerId,
                    },
                ],
                synchronizerId: appSynchronizerId,
            })
            .sign(bob.keyPair.privateKey)
            .execute({ partyId: bob.partyId })
    }

    logger.info(
        `Bob: TestToken self-transferred on app-synchronizer ` +
            `(Canton auto-reassigned Bob's Token from global → app)`
    )
}
