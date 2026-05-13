// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { SDKContext } from '../../sdk.js'
import { Ops } from '@canton-network/core-provider-ledger'
import { SDKLogger } from '../../logger/index.js'
import { v3_4 } from '@canton-network/core-ledger-client-types'

/** Maps the two synchronizer roles used in multi-synchronizer setups. */
export type SynchronizerMap = {
    globalSynchronizerId: string
    appSynchronizerId: string
}

export type ConnectedSynchronizersOptions = {
    party?: string
    participantId?: string
    identityProviderId?: string
}

export type ConnectedSynchronizer =
    v3_4.components['schemas']['ConnectedSynchronizer']

export class State {
    private readonly logger: SDKLogger

    constructor(private readonly ctx: SDKContext) {
        this.logger = ctx.logger.child({ namespace: 'State' })
    }

    /**
     * Returns the ID of the global synchronizer for this participant.
     *
     * Fetches the connected synchronizers list and selects the entry whose alias
     * is `'global'`. Falls back to the first entry when no alias matches (e.g.
     * single-synchronizer setups).
     *
     * @returns The `synchronizerId` of the global synchronizer.
     * @throws {Error} When no synchronizers are connected.
     */
    public async globalSynchronizerId(): Promise<string> {
        const result = await this.connectedSynchronizers()
        const synchronizers = result.connectedSynchronizers ?? []
        const global =
            synchronizers.find((s) => s.synchronizerAlias === 'global') ??
            synchronizers[0]
        if (!global) throw new Error('No connected synchronizers found')
        return global.synchronizerId
    }

    /**
     * Returns the list of connected synchronizers for the given party / participant.
     *
     * Calls GET /v2/state/connected-synchronizers with optional query parameters.
     *
     * @param options - Optional filters: party, participantId, identityProviderId.
     */
    public async connectedSynchronizers(
        options?: ConnectedSynchronizersOptions
    ) {
        this.logger.debug({ options }, 'Fetching connected synchronizers')

        const result =
            await this.ctx.ledgerProvider.request<Ops.GetV2StateConnectedSynchronizers>(
                {
                    method: 'ledgerApi',
                    params: {
                        resource: '/v2/state/connected-synchronizers',
                        requestMethod: 'get',
                        query: {
                            ...(options?.party !== undefined && {
                                party: options.party,
                            }),
                            ...(options?.participantId !== undefined && {
                                participantId: options.participantId,
                            }),
                            ...(options?.identityProviderId !== undefined && {
                                identityProviderId: options.identityProviderId,
                            }),
                        },
                    },
                }
            )

        return result
    }
}
