// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/** Illustrative local accounts (balances / syncs are not yet read from enforcement). */
export const mockLocalAccounts = [
    {
        name: 'default',
        balance: 1240,
        synchronizers: ['global-sync', 'payments-sync'],
    },
    {
        name: 'high-priority',
        balance: 240,
        synchronizers: ['global-sync'],
    },
] as const

export const mockConversionRates = [
    { asset: 'CC', rate: '1 CC = 100 LU', luPerUnit: 100 },
    { asset: 'USDx', rate: '1 USDx = 80 LU', luPerUnit: 80 },
] as const

export const mockWalletAssets = [
    { id: 'asset-1', symbol: 'CC', amount: 25 },
    { id: 'asset-2', symbol: 'USDx', amount: 100 },
] as const

export const mockPurchaseHistory = [
    {
        timestamp: '2026-05-11 13:02',
        account: 'default',
        amount: '+500 LU',
        asset: '5 CC',
    },
    {
        timestamp: '2026-05-11 12:31',
        account: 'high-priority',
        amount: '-48 LU',
        asset: 'Traffic burn',
    },
] as const

export type PaymentAsset = (typeof mockConversionRates)[number]['asset']

export function formatPurchaseEstimate(
    lu: number,
    asset: PaymentAsset
): string {
    const row = mockConversionRates.find((r) => r.asset === asset)
    if (!row || lu <= 0) return '—'
    const units = lu / row.luPerUnit
    const label = Number.isInteger(units) ? String(units) : units.toFixed(4)
    return `${label} ${asset} → ${lu} LU`
}
