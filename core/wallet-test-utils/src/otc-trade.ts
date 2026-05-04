// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { type Logger } from 'pino'
import { PartyId } from '@canton-network/core-types'
import {
    SDK,
    SDKInterface,
    TokenProviderConfig,
    localNetStaticConfig,
} from '@canton-network/wallet-sdk'

// This example needs uploaded .dar for splice-token-test-trading-app
// It's in files of localnet, but it's not uploaded to participant, so we need to do this in the script
// Adjust if to your .localnet location
const PATH_TO_LOCALNET = '../../../.localnet'
const PATH_TO_DAR_IN_LOCALNET = '/dars/splice-token-test-trading-app-1.0.0.dar'
const TRADING_APP_PACKAGE_ID =
    'e5c9847d5a88d3b8d65436f01765fc5ba142cc58529692e2dacdd865d9939f71'

export class OTCTrade {
    private venue: PartyId
    private alice: PartyId
    private bob: PartyId
    private charlie: PartyId
    private logger: Logger
    private sdk: SDKInterface<'asset'> | null = null
    private expectedAllocationCount = 0

    constructor(args: {
        logger: Logger
        venue: PartyId
        alice: PartyId
        bob: PartyId
        charlie: PartyId
    }) {
        this.venue = args.venue
        this.alice = args.alice
        this.bob = args.bob
        this.charlie = args.charlie
        this.logger = args.logger
    }

    async setup(): Promise<{
        otcTradeCid: string
        expectedAllocationCount: number
        settlementRefCid: string
    }> {
        this.logger.info('SDK initialized')

        const localNetStaticAuth: TokenProviderConfig = {
            method: 'self_signed',
            issuer: 'unsafe-auth',
            credentials: {
                clientId: 'ledger-api-user',
                clientSecret: 'unsafe',
                audience: 'https://canton.network.global',
                scope: '',
            },
        }

        this.sdk = await SDK.create({
            auth: localNetStaticAuth,
            ledgerClientUrl: localNetStaticConfig.LOCALNET_APP_USER_LEDGER_URL,
            asset: {
                registries: [localNetStaticConfig.LOCALNET_REGISTRY_API_URL],
                auth: localNetStaticAuth,
            },
        })

        const here = path.dirname(fileURLToPath(import.meta.url))

        const tradingDarPath = path.join(
            here,
            PATH_TO_LOCALNET,
            PATH_TO_DAR_IN_LOCALNET
        )

        //upload dar
        const darBytes = await fs.readFile(tradingDarPath)
        await this.sdk.ledger.dar.upload(darBytes, TRADING_APP_PACKAGE_ID)

        // Alice creates OTCTradeProposal

        const amuletAsset = await this.sdk.asset.find(
            'Amulet',
            localNetStaticConfig.LOCALNET_REGISTRY_API_URL
        )

        // Define what holdings each party will trade

        const transferLegs = {
            leg0: {
                sender: this.alice,
                receiver: this.bob,
                amount: '100',
                instrumentId: { admin: amuletAsset.admin, id: 'Amulet' },
                meta: { values: {} },
            },
            leg1: {
                sender: this.bob,
                receiver: this.alice,
                amount: '20',
                instrumentId: { admin: amuletAsset.admin, id: 'Amulet' },
                meta: { values: {} },
            },
            leg2: {
                sender: this.alice,
                receiver: this.charlie,
                amount: '50',
                instrumentId: { admin: amuletAsset.admin, id: 'Amulet' },
                meta: { values: {} },
            },
            leg3: {
                sender: this.charlie,
                receiver: this.alice,
                amount: '80',
                instrumentId: { admin: amuletAsset.admin, id: 'Amulet' },
                meta: { values: {} },
            },
        }

        this.expectedAllocationCount = Object.keys(transferLegs).length

        const createProposal = {
            CreateCommand: {
                templateId:
                    '#splice-token-test-trading-app:Splice.Testing.Apps.TradingApp:OTCTradeProposal',
                createArguments: {
                    venue: this.venue,
                    tradeCid: null,
                    transferLegs,
                    approvers: [this.alice],
                },
            },
        }

        await this.sdk.ledger.internal.submit({
            commands: [createProposal],
            disclosedContracts: [],
            actAs: [this.alice],
        })

        this.logger.info('Alice created OTCTradeProposal')

        // Bob and Charlie accept the OTCTradeProposal
        const settlementRefCid = await this.acceptProposal(this.bob, 'Bob')
        await this.acceptProposal(this.charlie, 'Charlie')

        // Venue initiates settlement of OTCTradeProposal
        const activeTradeProposals2 = await this.sdk.ledger.acs.read({
            templateIds: [
                '#splice-token-test-trading-app:Splice.Testing.Apps.TradingApp:OTCTradeProposal',
            ],
            parties: [this.venue],
            filterByParty: true,
        })
        const now = new Date()
        const prepareUntil = new Date(
            now.getTime() + 60 * 60 * 1000
        ).toISOString()
        const settleBefore = new Date(
            now.getTime() + 2 * 60 * 60 * 1000
        ).toISOString()

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

        await this.sdk.ledger.internal.submit({
            commands: initiateSettlementCmd,
            actAs: [this.venue],
        })

        this.logger.info('Venue initated settlement of OTCTradeProposal')

        const otcTrades = await this.sdk.ledger.acs.read({
            templateIds: [
                '#splice-token-test-trading-app:Splice.Testing.Apps.TradingApp:OTCTrade',
            ],
            parties: [this.venue],
            filterByParty: true,
        })

        const otcTradeCid = otcTrades[0].contractId

        if (!otcTradeCid) throw new Error('OTCTrade not found for venue')

        return {
            otcTradeCid,
            expectedAllocationCount: this.expectedAllocationCount,
            settlementRefCid,
        }
    }

    private async acceptProposal(
        approver: PartyId,
        approverName: string
    ): Promise<string> {
        if (!this.sdk) throw new Error('SDK not initialized')

        const activeTradeProposals = await this.sdk.ledger.acs.read({
            templateIds: [
                '#splice-token-test-trading-app:Splice.Testing.Apps.TradingApp:OTCTradeProposal',
            ],
            parties: [approver],
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
                    choiceArgument: { approver },
                },
            },
        ]

        await this.sdk.ledger.internal.submit({
            commands: acceptCmd,
            actAs: [approver],
        })

        this.logger.info(`${approverName} accepted OTCTradeProposal`)

        return otcpCid
    }

    async settle(args: {
        otcTradeCid: string
        settlementRefCid?: string
    }): Promise<void> {
        // Once the legs have been allocated, venue settles the trade triggering transfer of holdings

        const localNetStaticAuth: TokenProviderConfig = {
            method: 'self_signed',
            issuer: 'unsafe-auth',
            credentials: {
                clientId: 'ledger-api-user',
                clientSecret: 'unsafe',
                audience: 'https://canton.network.global',
                scope: '',
            },
        }

        const extendedSDK = this.sdk
            ? await this.sdk.extend({
                  token: {
                      validatorUrl:
                          localNetStaticConfig.LOCALNET_APP_VALIDATOR_URL,
                      registries: [
                          localNetStaticConfig.LOCALNET_REGISTRY_API_URL,
                      ],
                      auth: localNetStaticAuth,
                  },
              })
            : await SDK.create({
                  auth: localNetStaticAuth,
                  ledgerClientUrl:
                      localNetStaticConfig.LOCALNET_APP_USER_LEDGER_URL,
                  token: {
                      validatorUrl:
                          localNetStaticConfig.LOCALNET_APP_VALIDATOR_URL,
                      registries: [
                          localNetStaticConfig.LOCALNET_REGISTRY_API_URL,
                      ],
                      auth: localNetStaticAuth,
                  },
              })
        // await this.sdk.setPartyId(this.venue)

        // Poll until all allocations are visible
        const maxAttempts = 10
        const expectedLegs = this.expectedAllocationCount

        if (!expectedLegs) {
            throw new Error('Expected allocation count is unknown')
        }

        // TODO: check settlementRefId?
        const fetchRelevantAllocations = async () => {
            const allocationContracts =
                await extendedSDK.token.allocation.pending(this.venue)
            return allocationContracts.filter((a) => {
                const { settlement } = a.interfaceViewValue.allocation
                return settlement.executor === this.venue
            })
        }

        let relevantAllocations = await fetchRelevantAllocations()
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            if (relevantAllocations.length >= expectedLegs) break
            this.logger.info(
                `Waiting for allocations to be visible (attempt ${attempt}/${maxAttempts}, found ${relevantAllocations.length}/${expectedLegs})`
            )
            await new Promise((resolve) => setTimeout(resolve, 1000))
            relevantAllocations = await fetchRelevantAllocations()
        }
        if (relevantAllocations.length < expectedLegs) {
            throw new Error(
                `Expected ${expectedLegs} matching allocations for this trade, found ${relevantAllocations.length}`
            )
        }

        const allocationEntries = await Promise.all(
            relevantAllocations.map(async (a) => {
                const cid = a.contractId
                const choiceContext =
                    await extendedSDK.token.allocation.context.execute({
                        allocationCid: cid,
                        registryUrl:
                            localNetStaticConfig.LOCALNET_REGISTRY_API_URL,
                    })

                return {
                    cid,
                    legId: a.interfaceViewValue.allocation.transferLegId,
                    extraArgs: {
                        context: {
                            values:
                                choiceContext.choiceContextData?.values ?? {},
                        },
                        meta: { values: {} },
                    },
                    disclosedContracts: choiceContext.disclosedContracts ?? [],
                }
            })
        )

        const allocationsWithContext: Record<
            string,
            { _1: string; _2: unknown }
        > = Object.fromEntries(
            allocationEntries.map((e) => [
                e.legId,
                { _1: e.cid, _2: e.extraArgs },
            ])
        )

        const uniqueDisclosedContracts = Array.from(
            new Map(
                allocationEntries
                    .flatMap((e) => e.disclosedContracts)
                    .map((d) => [d.contractId, d])
            ).values()
        )

        const settleCmd = [
            {
                ExerciseCommand: {
                    templateId:
                        '#splice-token-test-trading-app:Splice.Testing.Apps.TradingApp:OTCTrade',
                    contractId: args.otcTradeCid,
                    choice: 'OTCTrade_Settle',
                    choiceArgument: { allocationsWithContext },
                },
            },
        ]

        await extendedSDK.ledger.internal.submit({
            commands: settleCmd,
            disclosedContracts: uniqueDisclosedContracts,
            actAs: [this.venue],
        })

        this.logger.info(
            'Venue settled the OTCTrade, holdings are transferred to Alice, Bob, and Charlie'
        )
    }
}
