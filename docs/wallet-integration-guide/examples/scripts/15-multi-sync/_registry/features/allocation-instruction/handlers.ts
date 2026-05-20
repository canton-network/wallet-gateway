// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * TestToken implementation of AllocationInstructionHandlers.
 *
 * Resolves the AllocationFactory by looking up the live TokenRules contract on the
 * *global* synchronizer from the ledger ACS. For trade settlement the token must
 * be allocated on the global (trade) synchronizer, so we always return the
 * TokenRules contract that lives there.  The TokenRules contract is also included
 * as a disclosed contract so the wallet SDK can pass it through to the Ledger API
 * when exercising AllocationFactory_Allocate via the interface.
 */

import type {
    FactoryWithChoiceContext,
    AllocationInstructionHandlers,
    GetFactoryRequest,
} from '../../types.js'
import type { TokenRulesContract } from '../../ledger.js'

export interface AllocationInstructionHandlerContext {
    getTokenRules: (
        synchronizerId?: string
    ) => Promise<TokenRulesContract | null>

    globalSynchronizerId: string
}

export function createAllocationInstructionHandlers(
    ctx: AllocationInstructionHandlerContext
): AllocationInstructionHandlers {
    return {
        getAllocationFactory: async (
            _req: GetFactoryRequest
        ): Promise<FactoryWithChoiceContext | null> => {
            const tokenRules = await ctx.getTokenRules(ctx.globalSynchronizerId)
            if (!tokenRules) return null
            return {
                factoryId: tokenRules.contractId,
                choiceContext: {
                    choiceContextData: {},
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
    }
}
