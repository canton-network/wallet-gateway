// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { SDKContext } from '../../../sdk.js'
import {
    CreatePartyOptions,
    ExecuteOptions,
    ParticipantEndpointConfig,
    MultiHashSignatures,
    OnboardingTransactions,
} from './types.js'

import { PartyId } from '@canton-network/core-types'
import {
    AbstractLedgerProvider,
    LedgerProvider,
    Ops,
} from '@canton-network/core-provider-ledger'
import { AuthTokenProvider } from '@canton-network/core-wallet-auth'

/**
 * Represents a signed party creation, ready to be allocated on the ledger.
 * Contains both the prepared topology transaction and its cryptographic signature.
 */
export class SignedPartyCreationService {
    constructor(
        private readonly ctx: SDKContext,
        private readonly signedPartyPromise: Promise<ExecuteOptions>,
        private readonly createPartyOptions?: CreatePartyOptions
    ) {}

    /**
     * Executes the party allocation on the ledger and optionally grants user rights.
     * Handles synchronizer lookup, party allocation, and additional participant synchronization.
     * @param options - Optional execution flags (expectHeavyLoad for timeout handling, grantUserRights to add user permissions)
     * @returns The confirmed GenerateTransactionResponse containing party details
     */
    public async execute(
        options?: Partial<{
            expectHeavyLoad?: boolean
            grantUserRights?: boolean
        }>
    ) {
        const { party, signature } = await this.signedPartyPromise

        if (!party || !signature)
            this.ctx.error.throw({
                message:
                    'There was a problem with creating or signing the party',
                type: 'SDKOperationUnsupported',
            })

        // When a specific synchronizerId is provided, the caller may be
        // registering an existing party on an additional synchronizer.
        // In that case we skip the participant-level existence check because
        // the party already exists (on a different synchronizer) but still
        // needs topology + allocation on the target synchronizer.
        const targetsSynchronizer = Boolean(
            this.createPartyOptions?.synchronizerId
        )
        if (
            !targetsSynchronizer &&
            (await this.checkIfPartyExists(party.partyId))
        ) {
            this.ctx.logger.info('Party already created.')
            return party
        }

        const executeOptions: ExecuteOptions = {
            party,
            signature,
        }

        await this.executeAllocateParty({
            ...executeOptions,
            withErrorHandling: true,
            expectHeavyLoad: Boolean(options?.expectHeavyLoad),
        })

        const endpointConfig = [
            ...(this.createPartyOptions?.confirmingParticipantEndpoints ?? []),
            ...(this.createPartyOptions?.observingParticipantEndpoints ?? []),
        ]

        if (endpointConfig && party.topologyTransactions) {
            await this.allocateExternalPartyForAdditionalParticipants({
                ...executeOptions,
                endpointConfig,
            })
        }

        const grantUserRights = options?.grantUserRights ?? true

        if (grantUserRights) {
            const HEAVY_LOAD_MAX_RETRIES = 100
            const HEAVY_LOAD_RETRY_INTERVAL = 5000
            await this.waitForPartyAndGrantUserRights(
                this.ctx.userId,
                party.partyId,
                options?.expectHeavyLoad ? HEAVY_LOAD_MAX_RETRIES : undefined,
                options?.expectHeavyLoad ? HEAVY_LOAD_RETRY_INTERVAL : undefined
            )
        }

        this.ctx.logger.info('Party allocated successfully.')
        return party
    }

    /**
     * Allocates the prepared party to additional participant nodes.
     * Ensures the party topology is synchronized across confirming and observing participants.
     * @param options - Execution options including endpoints, transaction response, signed hash, and optional admin flag
     */
    private async allocateExternalPartyForAdditionalParticipants(
        options: {
            endpointConfig: ParticipantEndpointConfig[]
        } & ExecuteOptions
    ) {
        const { endpointConfig, party, signature } = options
        for (const endpoint of endpointConfig) {
            const defaultLedgerProvider = new LedgerProvider({
                baseUrl: endpoint.url,
                accessTokenProvider: new AuthTokenProvider(
                    endpoint.tokenProviderConfig,
                    this.ctx.logger
                ),
            })

            await this.executeAllocateParty({
                defaultLedgerProvider,
                party,
                signature,
            })
        }
    }

    /**
     * Performs the actual party allocation transaction on a ledger client.
     * Includes error handling for timeout scenarios when heavy load is expected.
     * @param options - Allocation options including transaction data, ledger client, and optional error handling flags
     */
    private async executeAllocateParty(
        options: {
            withErrorHandling?: boolean
            expectHeavyLoad?: boolean
            defaultLedgerProvider?: AbstractLedgerProvider
        } & ExecuteOptions
    ) {
        const {
            party,
            signature,
            withErrorHandling,
            expectHeavyLoad,
            defaultLedgerProvider,
        } = options
        const ledgerProvider = defaultLedgerProvider ?? this.ctx.ledgerProvider
        try {
            const synchronizerId =
                this.createPartyOptions?.synchronizerId ??
                this.ctx.defaultSynchronizerId

            await this.allocate(
                ledgerProvider,
                synchronizerId,
                party.topologyTransactions!.map((transaction) => ({
                    transaction,
                })),
                [
                    {
                        format: 'SIGNATURE_FORMAT_CONCAT',
                        signature,
                        signedBy: party.publicKeyFingerprint,
                        signingAlgorithmSpec: 'SIGNING_ALGORITHM_SPEC_ED25519',
                    },
                ]
            )
        } catch (e) {
            if (!withErrorHandling) throw e

            const errorMsg =
                typeof e === 'string' ? e : e instanceof Error ? e.message : ''
            if (
                expectHeavyLoad &&
                errorMsg.includes(
                    'The server was not able to produce a timely response to your request'
                )
            ) {
                this.ctx.logger.warn(
                    'Received timeout from ledger api when allocating party, however expecting heavy load is set to true'
                )
                // this is a timeout and we just have to wait until the party exists
                while (!(await this.checkIfPartyExists(party.partyId))) {
                    await new Promise((resolve) => setTimeout(resolve, 1000))
                }
            } else {
                throw e
            }
        }
    }

    private async checkIfPartyExists(partyId: PartyId): Promise<boolean> {
        try {
            const party =
                await this.ctx.ledgerProvider.request<Ops.GetV2PartiesParty>({
                    method: 'ledgerApi',
                    params: {
                        resource: '/v2/parties/{party}',
                        requestMethod: 'get',
                        path: { party: partyId },
                        query: {},
                    },
                })
            return (
                party.partyDetails !== undefined &&
                party.partyDetails[0].party === partyId
            )
        } catch {
            return false
        }
    }

    private async waitForPartyAndGrantUserRights(
        userId: string,
        partyId: PartyId,
        maxTries: number = 30,
        retryIntervalMs: number = 2000
    ) {
        // Wait for party to appear on participant
        let partyFound = false
        let tries = 0

        while (!partyFound && tries < maxTries) {
            partyFound = await this.checkIfPartyExists(partyId)

            await new Promise((resolve) => setTimeout(resolve, retryIntervalMs))
            tries++
        }

        if (tries >= maxTries) {
            throw new Error(
                `timed out waiting for new party to appear after ${maxTries} tries`
            )
        }

        const result = await this.grantRights(userId, {
            actAs: [partyId],
        })

        if (!result.newlyGrantedRights) {
            throw new Error('Failed to grant user rights')
        }

        return
    }

    private async grantRights(
        userId: string,
        userRightsOptions: {
            canReadAsAnyParty?: boolean
            canExecuteAsAnyParty?: boolean
            readAs?: PartyId[]
            actAs?: PartyId[]
        }
    ) {
        const rights = []

        for (const partyId of userRightsOptions.readAs ?? []) {
            rights.push({
                kind: {
                    CanReadAs: {
                        value: {
                            party: partyId,
                        },
                    },
                },
            })
        }

        for (const partyId of userRightsOptions.actAs ?? []) {
            rights.push({
                kind: {
                    CanActAs: {
                        value: {
                            party: partyId,
                        },
                    },
                },
            })
        }

        if (userRightsOptions.canReadAsAnyParty) {
            rights.push({
                kind: {
                    CanReadAsAnyParty: { value: {} as Record<string, never> },
                },
            })
        }
        if (userRightsOptions.canExecuteAsAnyParty) {
            rights.push({
                kind: {
                    CanExecuteAsAnyParty: {
                        value: {} as Record<string, never>,
                    },
                },
            })
        }

        const result =
            await this.ctx.ledgerProvider.request<Ops.PostV2UsersUserIdRights>({
                method: 'ledgerApi',
                params: {
                    resource: '/v2/users/{user-id}/rights',
                    requestMethod: 'post',
                    path: { 'user-id': userId },
                    body: {
                        identityProviderId: '',
                        userId,
                        rights,
                    },
                },
            })
        if (!result.newlyGrantedRights) {
            throw new Error('Failed to grant user rights')
        }

        return result
    }

    private async allocate(
        ledgerProvider: AbstractLedgerProvider,
        synchronizerId: string,
        onboardingTransactions: OnboardingTransactions,
        multiHashSignatures: MultiHashSignatures
    ): Promise<Ops.PostV2PartiesExternalAllocate['ledgerApi']['result']> {
        if (!onboardingTransactions || !multiHashSignatures) {
            throw new Error(
                'onboardingTransactions and multiHashSignatures must be provided for party allocation'
            )
        }
        const resp =
            await ledgerProvider.request<Ops.PostV2PartiesExternalAllocate>({
                method: 'ledgerApi',
                params: {
                    resource: '/v2/parties/external/allocate',
                    requestMethod: 'post',
                    body: {
                        synchronizer: synchronizerId,
                        identityProviderId: '',
                        onboardingTransactions,
                        multiHashSignatures,
                    },
                },
            })

        return resp
    }
}
