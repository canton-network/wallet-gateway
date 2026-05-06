// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { PartyId } from '@canton-network/core-types'
import { ScanClient, ScanProxyClient } from '@canton-network/core-splice-client'
import {
    ExerciseCommand,
    DisclosedContract,
    TokenStandardService,
} from '@canton-network/core-token-standard-service'

// TODO: This appears in a couple of places, either move it somewhere more
// central, or as part of the Service class hierarchy
const REQUESTED_AT_SKEW_MS = 60_000

/** AmuletService extends TokenStandardService to provide features that are
 *  available for amulet but not in the token standard, such as:
 *
 *   - Tapping
 *   - Transfer preapprovals
 *   - Featured apps
 */
export class AmuletService {
    constructor(
        readonly tokenStandard: TokenStandardService,
        private readonly scanProxyClient: ScanProxyClient,
        private readonly scanClient: ScanClient | undefined
    ) {}

    async getTransferPreApprovalByParty(partyId: PartyId) {
        const { transfer_preapproval } = await this.scanProxyClient.get(
            '/v0/scan-proxy/transfer-preapprovals/by-party/{party}',
            {
                path: {
                    party: partyId,
                },
            }
        )

        return transfer_preapproval
    }

    async getFeaturedAppsByParty(partyId: PartyId) {
        const { featured_app_right } = await this.scanProxyClient.get(
            '/v0/scan-proxy/featured-apps/{provider_party_id}',
            {
                path: {
                    provider_party_id: partyId,
                },
            }
        )

        return featured_app_right
    }

    async buyMemberTraffic(
        dso: PartyId,
        provider: PartyId,
        trafficAmount: number,
        synchronizerId: string,
        memberId: string,
        migrationId: number,
        inputUtxos?: string[]
    ): Promise<[ExerciseCommand, DisclosedContract[]]> {
        const amuletRules = await this.scanProxyClient.getAmuletRules()
        const activeRound =
            await this.scanProxyClient.getActiveOpenMiningRound()

        const inputHoldings = await this.tokenStandard.getInputHoldingsCids(
            provider,
            inputUtxos,
            trafficAmount
        )

        if (!amuletRules) {
            throw new Error('AmuletRules contract not found')
        }
        if (!activeRound) {
            throw new Error(
                'OpenMiningRound active at current moment not found'
            )
        }

        const disclosed: DisclosedContract[] = [
            {
                templateId: amuletRules.template_id,
                contractId: amuletRules.contract_id,
                createdEventBlob: amuletRules.created_event_blob,
                synchronizerId,
            },
            {
                templateId: activeRound.template_id!,
                contractId: activeRound.contract_id,
                createdEventBlob: activeRound.created_event_blob,
                synchronizerId,
            },
        ]

        const context = {
            openMiningRound: activeRound.contract_id,
            issuingMiningRounds: [],
            validatorRights: [],
            featuredAppRight: null,
        }

        const choiceArgs = {
            context,
            inputs: inputHoldings.map((cid) => ({
                tag: 'InputAmulet',
                value: cid,
            })),
            provider,
            memberId: this.tokenStandard.core.toQualifiedMemberId(memberId),
            synchronizerId,
            migrationId: migrationId.toString(),
            trafficAmount: trafficAmount.toString(),
            expectedDso: dso,
        }

        const exercise: ExerciseCommand = {
            templateId: '#splice-amulet:Splice.AmuletRules:AmuletRules',
            contractId: amuletRules.contract_id,
            choice: 'AmuletRules_BuyMemberTraffic',
            choiceArgument: choiceArgs,
        }

        return [exercise, disclosed]
    }

    async getMemberTrafficStatus(domainId: string, memberId: string) {
        if (!this.scanClient) {
            throw new Error('Scan API URL was not provided')
        }
        return this.scanClient.get(
            '/v0/domains/{domain_id}/members/{member_id}/traffic-status',
            {
                path: {
                    domain_id: domainId,
                    member_id:
                        this.tokenStandard.core.toQualifiedMemberId(memberId),
                },
            }
        )
    }

    async selfGrantFeatureAppRight(
        providerPartyId: PartyId,
        synchronizerId: string
    ): Promise<[ExerciseCommand, DisclosedContract[]]> {
        const amuletRules = await this.scanProxyClient.getAmuletRules()
        const disclosedContracts = {
            templateId: amuletRules.template_id,
            contractId: amuletRules.contract_id,
            createdEventBlob: amuletRules.created_event_blob,
            synchronizerId,
        }

        return [
            {
                templateId: amuletRules.template_id,
                contractId: amuletRules.contract_id,
                choice: 'AmuletRules_DevNet_FeatureApp',
                choiceArgument: {
                    provider: providerPartyId,
                },
            },
            [disclosedContracts],
        ]
    }

    async cancelTransferPreapproval(
        contractId: string,
        templateId: string,
        actor: PartyId
    ): Promise<[ExerciseCommand, DisclosedContract[]]> {
        const exercise: ExerciseCommand = {
            templateId,
            contractId,
            choice: 'TransferPreapproval_Cancel',
            choiceArgument: { p: actor },
        }
        return [exercise, []]
    }

    async renewTransferPreapproval(
        contractId: string,
        templateId: string,
        provider: PartyId,
        synchronizerId: PartyId,
        newExpiresAt?: Date,
        inputUtxos?: string[]
    ): Promise<[ExerciseCommand, DisclosedContract[]]> {
        const amuletRules = await this.scanProxyClient.getAmuletRules()
        const activeRound =
            await this.scanProxyClient.getActiveOpenMiningRound()

        if (!amuletRules) {
            throw new Error('AmuletRules contract not found')
        }
        if (!activeRound) {
            throw new Error(
                'OpenMiningRound active at current moment not found'
            )
        }

        const disclosed: DisclosedContract[] = [
            {
                templateId: amuletRules.template_id,
                contractId: amuletRules.contract_id,
                createdEventBlob: amuletRules.created_event_blob,
                synchronizerId,
            },
            {
                templateId: activeRound.template_id!,
                contractId: activeRound.contract_id,
                createdEventBlob: activeRound.created_event_blob,
                synchronizerId,
            },
        ]

        const inputHoldings = await this.tokenStandard.getInputHoldingsCids(
            provider,
            inputUtxos
        )

        const context = {
            context: {
                openMiningRound: activeRound.contract_id,
                issuingMiningRounds: [],
                validatorRights: [],
                featuredAppRight: null,
            },
            amuletRules: amuletRules.contract_id,
        }

        // Defaults to 90 days
        const effectiveNewExpiresAt: Date =
            newExpiresAt ?? new Date(Date.now() + 90 * 24 * 3600 * 1000)

        const exercise: ExerciseCommand = {
            templateId,
            contractId,
            choice: 'TransferPreapproval_Renew',
            choiceArgument: {
                context,
                inputs: inputHoldings.map((cid) => ({
                    tag: 'InputAmulet',
                    value: cid,
                })),
                newExpiresAt: effectiveNewExpiresAt.toISOString(),
            },
        }

        return [exercise, disclosed]
    }

    async createTap(
        receiver: string,
        amount: string,
        instrumentAdmin: string, // TODO (#907): replace with registry call
        instrumentId: string,
        registryUrl: string
    ): Promise<[ExerciseCommand, DisclosedContract[]]> {
        const now = new Date()
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        const choiceArgs = {
            expectedAdmin: instrumentAdmin,
            transfer: {
                sender: instrumentAdmin,
                receiver,
                amount,
                instrumentId: { admin: instrumentAdmin, id: instrumentId },
                lock: null,
                requestedAt: new Date(
                    Date.now() - REQUESTED_AT_SKEW_MS
                ).toISOString(),
                executeBefore: tomorrow.toISOString(),
                inputHoldingCids: [],
                meta: { values: {} },
            },
            extraArgs: {
                context: { values: {} },
                meta: { values: {} },
            },
        }

        const disclosedContracts = (
            await this.tokenStandard.transfer.fetchTransferFactoryChoiceContext(
                registryUrl,
                choiceArgs
            )
        ).choiceContext.disclosedContracts

        const amuletRules = await this.scanProxyClient.getAmuletRules()
        if (!amuletRules) {
            throw new Error('AmuletRules contract not found')
        }

        const latestOpenMiningRound =
            await this.scanProxyClient.getActiveOpenMiningRound()
        if (!latestOpenMiningRound) {
            throw new Error(
                'OpenMiningRound active at current moment not found'
            )
        }

        return [
            {
                templateId: amuletRules.template_id!,
                contractId: amuletRules.contract_id,
                choice: 'AmuletRules_DevNet_Tap',
                choiceArgument: {
                    receiver,
                    amount,
                    openRound: latestOpenMiningRound.contract_id,
                },
            },
            disclosedContracts,
        ]
    }

    async isDevNet(): Promise<boolean> {
        return await this.scanProxyClient.isDevNet()
    }
}
