// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { ledgerTemplateId } from './paymaster-config'

export function buildPurchaseExercise(
    party: string,
    account: string,
    qty: number,
    holdingCid: string,
    purchaseCid: string
): Record<string, unknown> {
    return {
        ExerciseCommand: {
            templateId: ledgerTemplateId('Paymaster', 'PurchaseTraffic'),
            contractId: purchaseCid,
            choice: 'PurchaseTraffic_PurchaseCredits',
            choiceArgument: {
                party,
                account,
                qty,
                holdingCid,
            },
        },
    }
}
