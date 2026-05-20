// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import Decimal from 'decimal.js'
import { TokenStandardService } from '@canton-network/core-token-standard-service'
import { type Holding } from '@canton-network/core-tx-parser'
import type { Instruments } from '../services/registry-service'

export interface AggregatedWalletBalance {
    owner: string
    totalAmount: string
}

export interface AggregatedHolding {
    instrumentId: { admin: string; id: string }
    totalAmount: string
    lockedAmount: string
    availableAmount: string
    numOfHoldings: number
    walletBalances: AggregatedWalletBalance[]
    instrument?: {
        name: string
        symbol: string
        decimals: number
    }
}

export function aggregateHoldings(
    holdings: Holding[],
    currentTime: Date = new Date()
): Map<string, AggregatedHolding> {
    const aggregated = new Map<string, AggregatedHolding>()

    for (const holding of holdings) {
        const key = `${holding.instrumentId.admin}::${holding.instrumentId.id}`
        const existing = aggregated.get(key)
        const isLocked = TokenStandardService.isHoldingLocked(
            holding,
            currentTime
        )
        const amount = new Decimal(holding.amount)

        if (existing) {
            const newTotal = new Decimal(existing.totalAmount).plus(amount)
            const newLocked = isLocked
                ? new Decimal(existing.lockedAmount).plus(amount)
                : new Decimal(existing.lockedAmount)

            existing.totalAmount = newTotal.toString()
            existing.lockedAmount = newLocked.toString()
            existing.availableAmount = newTotal.minus(newLocked).toString()
            existing.numOfHoldings += 1
            addWalletBalance(existing.walletBalances, holding.owner, amount)
        } else {
            const lockedAmount = isLocked ? amount : new Decimal(0)
            aggregated.set(key, {
                instrumentId: holding.instrumentId,
                totalAmount: amount.toString(),
                lockedAmount: lockedAmount.toString(),
                availableAmount: amount.minus(lockedAmount).toString(),
                numOfHoldings: 1,
                walletBalances: [
                    {
                        owner: holding.owner,
                        totalAmount: amount.toString(),
                    },
                ],
            })
        }
    }

    return aggregated
}

function addWalletBalance(
    balances: AggregatedWalletBalance[],
    owner: string,
    amount: Decimal
) {
    const existing = balances.find((balance) => balance.owner === owner)

    if (existing) {
        existing.totalAmount = new Decimal(existing.totalAmount)
            .plus(amount)
            .toString()
        return
    }

    balances.push({ owner, totalAmount: amount.toString() })
}

export function enrichWithInstrumentInfo(
    aggregated: Map<string, AggregatedHolding>,
    instruments: Instruments
): AggregatedHolding[] {
    return Array.from(aggregated.values(), (item) => {
        const instrumentInfo = instruments
            .get(item.instrumentId.admin)
            ?.find((i) => i.id === item.instrumentId.id)

        return {
            ...item,
            instrument: instrumentInfo
                ? {
                      name: instrumentInfo.name,
                      symbol: instrumentInfo.symbol,
                      decimals: instrumentInfo.decimals,
                  }
                : undefined,
        }
    })
}
