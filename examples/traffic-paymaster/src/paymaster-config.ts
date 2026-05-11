// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Metadata the wallet should eventually supply when connecting.
 * For now we merge `HARDCODED_PAYMASTER` with `import.meta.env` (Vite).
 */
export interface PaymasterMetadata {
    /** Paymaster party id (ledger string). */
    paymasterParty: string
    /** Human label for UI. */
    displayName: string
    /** Contract id of `PurchaseTraffic`. */
    purchaseTrafficContractId: string
    /** Contract id of `EligiblePaymentAssetConversionRate` for the purchase flow. */
    eligibleRateContractId: string
    /** User's `DemoHolding` contract id used to pay (DEMO currency). */
    demoHoldingContractId: string
    /** Local traffic account name (metadata / property-bag analogue). */
    defaultTrafficAccount: string
    /** Must match on-chain rate template `currencySymbol`. */
    currencySymbol: string
    /** Same numeric as on-chain `unitsPerLu` (for UI estimate only). */
    unitsPerLu: number
}

declare global {
    interface Window {
        /** Optional hook for wallets to inject paymaster routing before we read env. */
        __CANTON_PAYMASTER_METADATA__?: Partial<PaymasterMetadata>
    }
}

/** Replace with your ledger ids after `daml build` + `Setup.setup` (or manual create). */
const HARDCODED_PAYMASTER: PaymasterMetadata = {
    paymasterParty: 'REPLACE_WITH_PAYMASTER_PARTY_ID',
    displayName: 'Demo validator paymaster',
    purchaseTrafficContractId: 'REPLACE_WITH_PURCHASE_TRAFFIC_CID',
    eligibleRateContractId: 'REPLACE_WITH_RATE_CID',
    demoHoldingContractId: 'REPLACE_WITH_HOLDING_CID',
    defaultTrafficAccount: 'traffic-purchase',
    currencySymbol: 'DEMO',
    unitsPerLu: 1.0,
}

function envOr(key: keyof ImportMetaEnv, fallback: string): string {
    const v = import.meta.env[key]
    if (typeof v === 'string' && v.length > 0 && !v.startsWith('REPLACE'))
        return v
    return fallback
}

function envNumber(key: keyof ImportMetaEnv, fallback: number): number {
    const v = import.meta.env[key]
    if (typeof v === 'string' && v.length > 0) {
        const n = Number(v)
        if (!Number.isNaN(n)) return n
    }
    return fallback
}

export function getPaymasterConfig(): PaymasterMetadata {
    const fromWindow =
        typeof window !== 'undefined'
            ? window.__CANTON_PAYMASTER_METADATA__
            : undefined
    const base: PaymasterMetadata = {
        ...HARDCODED_PAYMASTER,
        paymasterParty: envOr(
            'VITE_PAYMASTER_PARTY',
            HARDCODED_PAYMASTER.paymasterParty
        ),
        purchaseTrafficContractId: envOr(
            'VITE_PURCHASE_TRAFFIC_CID',
            HARDCODED_PAYMASTER.purchaseTrafficContractId
        ),
        eligibleRateContractId: envOr(
            'VITE_ELIGIBLE_RATE_CID',
            HARDCODED_PAYMASTER.eligibleRateContractId
        ),
        demoHoldingContractId: envOr(
            'VITE_DEMO_HOLDING_CID',
            HARDCODED_PAYMASTER.demoHoldingContractId
        ),
        defaultTrafficAccount: envOr(
            'VITE_DEFAULT_TRAFFIC_ACCOUNT',
            HARDCODED_PAYMASTER.defaultTrafficAccount
        ),
        currencySymbol: envOr(
            'VITE_CURRENCY_SYMBOL',
            HARDCODED_PAYMASTER.currencySymbol
        ),
        unitsPerLu: envNumber(
            'VITE_UNITS_PER_LU',
            HARDCODED_PAYMASTER.unitsPerLu
        ),
    }
    return { ...base, ...fromWindow }
}

/**
 * Update `VITE_PACKAGE_ID` after `daml build` (see DAR path) if this fallback does not match your build.
 */
const PACKAGE_ID_FALLBACK =
    '53b9285ee3e1c024eb1bc2f52574ab9081c78827e855baf57dee88e7ba64d3f2'

export function ledgerTemplateId(
    moduleName: string,
    entityName: string
): string {
    const pid = envOr('VITE_PACKAGE_ID', PACKAGE_ID_FALLBACK)
    return `#${pid}:${moduleName}:${entityName}`
}
