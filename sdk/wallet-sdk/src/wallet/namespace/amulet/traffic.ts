// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { PartyId } from '@canton-network/core-types'
import { PreparedCommand } from '../transactions/types.js'
import { Ops } from '@canton-network/core-provider-ledger'
import { AmuletNamespaceConfig, fetchAmulet } from './namespace.js'
import { resolveGlobalSynchronizerId } from '../state/client.js'

export class TrafficNamespace {
    constructor(private readonly sdkContext: AmuletNamespaceConfig) {}

    async status(params?: Partial<{ memberId?: string }>) {
        const synchronizerId = await resolveGlobalSynchronizerId(
            this.sdkContext.commonCtx.ledgerProvider
        )

        const memberId =
            params?.memberId ??
            (
                await this.sdkContext.commonCtx.ledgerProvider.request<Ops.GetV2PartiesParticipantId>(
                    {
                        method: 'ledgerApi',
                        params: {
                            resource: '/v2/parties/participant-id',
                            requestMethod: 'get',
                        },
                    }
                )
            ).participantId

        return this.sdkContext.amuletService.getMemberTrafficStatus(
            synchronizerId,
            memberId
        )
    }

    async buy(params: {
        buyer: PartyId
        ccAmount: number
        memberId?: string
        inputUtxos: string[]
        migrationId?: number
    }): Promise<PreparedCommand> {
        const { buyer, ccAmount, inputUtxos } = params
        const migrationId = params.migrationId ?? 0
        const defaultAmulet = await fetchAmulet(this.sdkContext)
        const [memberId, synchronizerId] = await Promise.all([
            params.memberId ??
                this.sdkContext.commonCtx.ledgerProvider
                    .request<Ops.GetV2PartiesParticipantId>({
                        method: 'ledgerApi',
                        params: {
                            resource: '/v2/parties/participant-id',
                            requestMethod: 'get',
                        },
                    })
                    .then((r) => r.participantId),
            resolveGlobalSynchronizerId(
                this.sdkContext.commonCtx.ledgerProvider
            ),
        ])

        const [command, dc] =
            await this.sdkContext.amuletService.buyMemberTraffic(
                defaultAmulet.admin,
                buyer,
                ccAmount,
                synchronizerId,
                memberId,
                migrationId,
                inputUtxos
            )
        return [{ ExerciseCommand: command }, dc]
    }
}
