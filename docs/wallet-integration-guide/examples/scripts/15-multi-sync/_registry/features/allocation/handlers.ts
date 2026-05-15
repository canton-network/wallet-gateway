// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * TestToken implementation of AllocationHandlers.
 *
 * All allocation choice-context endpoints return an empty context — no extra
 * contracts need to be disclosed for execute-transfer, withdraw, or cancel.
 */

import type { ChoiceContext, AllocationHandlers } from '../../types.js'

export function createAllocationHandlers(): AllocationHandlers {
    const emptyContext: ChoiceContext = {
        choiceContextData: {},
        disclosedContracts: [],
    }

    return {
        getAllocationTransferContext: async (): Promise<ChoiceContext> =>
            emptyContext,
        getAllocationWithdrawContext: async (): Promise<ChoiceContext> =>
            emptyContext,
        getAllocationCancelContext: async (): Promise<ChoiceContext> =>
            emptyContext,
    }
}
