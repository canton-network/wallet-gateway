// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * TestToken implementation of TransferHandlers.
 *
 * Resolves the TransferFactory by looking up the live TokenRules contract from the
 * ledger ACS, then exposes it as a disclosed contract in the choice context.
 *
 * transferKind is inferred from the choiceArguments:
 *  - 'self'  when sender === receiver (self-transfer, typically to move a token
 *             across synchronizers — Canton auto-reassigns the holding)
 *  - 'offer' otherwise (creates a TokenTransferOffer the receiver must accept)
 *
 * Synchronizer selection:
 *  - All transfers (self or offer) use the app-synchronizer TokenRules as the factory,
 *    because Token holdings live on app-sync. Disclosed TokenRules must match the
 *    transaction target synchronizer to avoid PRESCRIBED_SYNCHRONIZER_ID_MISMATCH.
 *
 * Accept/reject/withdraw context endpoints return an empty context — no extra
 * contracts need to be disclosed for those choices.
 */

import type {
    TransferFactoryWithChoiceContext,
    ChoiceContext,
    TransferHandlers,
    GetFactoryRequest,
} from '../../types.js'
import type { TokenRulesContract } from '../../ledger.js'

export interface TransferHandlerContext {
    getTokenRules: (
        synchronizerId?: string
    ) => Promise<TokenRulesContract | null>
    appSynchronizerId: string
}

export function createTransferHandlers(
    ctx: TransferHandlerContext
): TransferHandlers {
    return {
        getTransferFactory: async (
            req: GetFactoryRequest
        ): Promise<TransferFactoryWithChoiceContext | null> => {
            const args = req.choiceArguments as unknown as Record<
                string,
                unknown
            >
            const transfer = args?.transfer as
                | Record<string, unknown>
                | undefined
            const isSelf =
                transfer !== undefined &&
                transfer.sender !== undefined &&
                transfer.sender === transfer.receiver
            const transferKind: 'self' | 'offer' = isSelf ? 'self' : 'offer'

            const synchronizerId = ctx.appSynchronizerId
            const tokenRules = await ctx.getTokenRules(synchronizerId)
            if (!tokenRules) return null
            return {
                factoryId: tokenRules.contractId,
                transferKind,
                choiceContext: {
                    choiceContextData: { values: {} },
                    disclosedContracts: [
                        {
                            templateId: tokenRules.templateId,
                            contractId: tokenRules.contractId,
                            createdEventBlob: tokenRules.createdEventBlob,
                            synchronizerId: tokenRules.synchronizerId,
                        },
                    ],
                },
            }
        },

        getTransferInstructionAcceptContext:
            async (): Promise<ChoiceContext> => ({
                choiceContextData: { values: {} },
                disclosedContracts: [],
            }),

        getTransferInstructionRejectContext:
            async (): Promise<ChoiceContext> => ({
                choiceContextData: { values: {} },
                disclosedContracts: [],
            }),

        getTransferInstructionWithdrawContext:
            async (): Promise<ChoiceContext> => ({
                choiceContextData: { values: {} },
                disclosedContracts: [],
            }),
    }
}
