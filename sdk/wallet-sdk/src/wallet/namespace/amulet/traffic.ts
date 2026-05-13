// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { PartyId } from '@canton-network/core-types'
import { PreparedCommand } from '../transactions/types.js'
import { Ops } from '@canton-network/core-provider-ledger'
import { AmuletNamespaceConfig, fetchAmulet } from './namespace.js'

export class TrafficNamespace {
    constructor(private readonly sdkContext: AmuletNamespaceConfig) {}

    async status(
        params?: Partial<{ memberId?: string; synchronizerId?: string }>
    ) {
        const synchronizerId = params?.synchronizerId
        if (!synchronizerId)
            throw new Error(
                'synchronizerId is required for traffic.status — pass the global synchronizer ID explicitly'
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
        synchronizerId?: string
    }): Promise<PreparedCommand> {
        const { buyer, ccAmount, inputUtxos } = params
        const migrationId = params.migrationId ?? 0
        const defaultAmulet = await fetchAmulet(this.sdkContext)
        const memberId =
            params.memberId ??
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

        const synchronizerId = params.synchronizerId
        if (!synchronizerId)
            throw new Error(
                'synchronizerId is required for traffic.buy — pass the global synchronizer ID explicitly'
            )

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
