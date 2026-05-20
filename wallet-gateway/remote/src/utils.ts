// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { v4 } from 'uuid'
import { LedgerClient, Types } from '@canton-network/core-ledger-client'
import type {
    DisclosedContracts,
    Commands,
    PackageIdSelectionPreference,
} from './dapp-api/rpc-gen/typings.js'

type NetworkStatus = {
    isConnected: boolean
    reason?: string
    cantonVersion?: string
}

export async function networkStatus(
    ledgerClient: LedgerClient
): Promise<NetworkStatus> {
    try {
        const response = await ledgerClient.get('/v2/version')
        return {
            isConnected: true,
            cantonVersion: response.version,
        }
    } catch (e) {
        return {
            isConnected: false,
            reason: `Ledger unreachable: ${(e as Error).message}`,
        }
    }
}

export interface PrepareParams {
    commandId?: string
    commands?: Commands
    actAs?: string[]
    readAs?: string[]
    disclosedContracts?: DisclosedContracts
    packageIdSelectionPreference?: PackageIdSelectionPreference
}

export function ledgerPrepareParams(
    userId: string,
    partyId: string,
    synchronizerId: string,
    params: PrepareParams
): Types['JsPrepareSubmissionRequest'] {
    // Map disclosed contracts to ledger api format (which wrongly defines optional fields as mandatory)
    const disclosedContracts =
        params.disclosedContracts?.map((d) => {
            return {
                templateId: d.templateId || '',
                contractId: d.contractId || '',
                createdEventBlob: d.createdEventBlob,
                synchronizerId: d.synchronizerId || '',
            }
        }) || []
    return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- because OpenRPC codegen type is incompatible with ledger codegen type
        commands: params.commands as any,
        commandId: params.commandId || v4(),
        userId,
        actAs: params.actAs || [partyId],
        readAs: params.readAs || [],
        disclosedContracts,
        synchronizerId,
        verboseHashing: false,
        packageIdSelectionPreference: params.packageIdSelectionPreference || [],
    }
}
