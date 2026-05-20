// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { PublicKey } from '@canton-network/core-signing-lib'
import { v4 } from 'uuid'
import { SDKContext } from '../../../sdk.js'
import { ParticipantEndpointConfig } from './types.js'
import { PreparedPartyCreationService } from './prepared.js'
import { CreatePartyOptions } from './types.js'
import { SDKLogger } from '../../../logger/index.js'
import { LedgerProvider, Ops } from '@canton-network/core-provider-ledger'
import { AuthTokenProvider } from '@canton-network/core-wallet-auth'

export class ExternalPartyNamespace {
    private readonly logger: SDKLogger

    constructor(private readonly ctx: SDKContext) {
        this.logger = ctx.logger.child({ namespace: 'ExternalPartyClient' })
    }

    /**
     * Initiates party creation with the given public key.
     * @param publicKey - The public key for the party
     * @param options - Optional configuration (party hint, participant endpoints, thresholds)
     * @returns PreparedPartyCreation builder for chaining sign() and execute()
     */
    public create(publicKey: PublicKey, options?: CreatePartyOptions) {
        const partyCreationPromise = Promise.all([
            this.resolveParticipantUids(
                options?.observingParticipantEndpoints ?? []
            ),
            this.resolveParticipantUids(
                options?.confirmingParticipantEndpoints ?? []
            ),
            options?.synchronizerId || this.resolveSynchronizerId(),
        ]).then(
            ([
                observingParticipantUids,
                otherHostingParticipantUids,
                synchronizerId,
            ]) =>
                this.ctx.ledgerProvider.request<Ops.PostV2PartiesExternalGenerateTopology>(
                    {
                        method: 'ledgerApi',
                        params: {
                            resource: '/v2/parties/external/generate-topology',
                            body: {
                                synchronizer: synchronizerId,
                                partyHint: options?.partyHint ?? v4(),
                                publicKey: {
                                    format: 'CRYPTO_KEY_FORMAT_RAW',
                                    keyData: publicKey,
                                    keySpec: 'SIGNING_KEY_SPEC_EC_CURVE25519',
                                },
                                localParticipantObservationOnly:
                                    options?.localParticipantObservationOnly ??
                                    false,
                                confirmationThreshold:
                                    options?.confirmingThreshold ?? 1,
                                otherConfirmingParticipantUids:
                                    otherHostingParticipantUids,
                                observingParticipantUids:
                                    observingParticipantUids,
                            },
                            requestMethod: 'post',
                        },
                    }
                )
        )

        this.logger.debug('Prepared party creation successfully.')
        return new PreparedPartyCreationService(
            {
                ...this.ctx,
                logger: this.logger,
            },
            partyCreationPromise,
            options
        )
    }

    private async resolveSynchronizerId() {
        const connectedSynchronizers =
            await this.ctx.ledgerProvider.request<Ops.GetV2StateConnectedSynchronizers>(
                {
                    method: 'ledgerApi',
                    params: {
                        resource: '/v2/state/connected-synchronizers',
                        requestMethod: 'get',
                        query: {},
                    },
                }
            )

        if (!connectedSynchronizers.connectedSynchronizers?.[0]) {
            throw new Error('No connected synchronizers found')
        }

        const synchronizerId =
            connectedSynchronizers.connectedSynchronizers[0].synchronizerId
        if (connectedSynchronizers.connectedSynchronizers.length > 1) {
            this.logger.warn(
                `Found ${connectedSynchronizers.connectedSynchronizers.length} synchronizers, defaulting to ${synchronizerId}`
            )
        }

        return synchronizerId
    }

    /**
     * Retrieves participant IDs from the given endpoints by querying their ledger API.
     * @param hostingParticipantConfigs - Participant endpoint configurations to query
     * @returns Array of participant IDs from the endpoints
     */
    private async resolveParticipantUids(
        hostingParticipantConfigs: ParticipantEndpointConfig[]
    ) {
        return Promise.all(
            hostingParticipantConfigs?.map((endpoint) => {
                const provider = new LedgerProvider({
                    accessTokenProvider: new AuthTokenProvider(
                        endpoint.tokenProviderConfig,
                        this.logger
                    ),
                    baseUrl: endpoint.url,
                })

                return provider
                    .request<Ops.GetV2PartiesParticipantId>({
                        method: 'ledgerApi',
                        params: {
                            resource: '/v2/parties/participant-id',
                            requestMethod: 'get',
                        },
                    })
                    .then((res) => res.participantId)
            }) || []
        )
    }
}
