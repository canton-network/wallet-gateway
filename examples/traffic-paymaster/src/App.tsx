// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import * as sdk from '@canton-network/dapp-sdk'
import { RemoteAdapter } from '@canton-network/dapp-sdk'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getPaymasterConfig } from './paymaster-config'
import {
    formatPurchaseEstimate,
    mockConversionRates,
    mockLocalAccounts,
    mockPurchaseHistory,
    mockWalletAssets,
    type PaymentAsset,
} from './mockUiData'
import { buildPurchaseExercise } from './purchaseCommand'

function configLooksReady(): boolean {
    const cfg = getPaymasterConfig()
    const bad = (s: string) => !s || s.startsWith('REPLACE')
    return !(
        bad(cfg.paymasterParty) ||
        bad(cfg.purchaseTrafficContractId) ||
        bad(cfg.eligibleRateContractId) ||
        bad(cfg.demoHoldingContractId)
    )
}

export function App() {
    const paymaster = useMemo(() => getPaymasterConfig(), [])
    const [connected, setConnected] = useState(false)
    const [partyId, setPartyId] = useState<string | null>(null)
    const [initError, setInitError] = useState<string | null>(null)
    const [targetAccount, setTargetAccount] = useState('default')
    const [luQty, setLuQty] = useState('500')
    const [paymentAsset, setPaymentAsset] = useState<PaymentAsset>('CC')
    const [selectedAssetIds, setSelectedAssetIds] = useState<
        Record<string, boolean>
    >({})
    const [purchasing, setPurchasing] = useState(false)
    const [purchaseBanner, setPurchaseBanner] = useState<string | null>(null)

    const totalLu = useMemo(
        () => mockLocalAccounts.reduce((sum, a) => sum + a.balance, 0),
        []
    )

    const luParsed = Math.max(0, Math.floor(Number.parseInt(luQty, 10) || 0))

    const refreshWallet = useCallback(async () => {
        const status = await sdk.isConnected()
        setConnected(!!status.isConnected)
        if (!status.isConnected) {
            setPartyId(null)
            return
        }
        const acc = await sdk.listAccounts()
        setPartyId(acc[0]?.partyId ?? null)
    }, [])

    useEffect(() => {
        let cancelled = false
        async function boot(): Promise<void> {
            try {
                const gw = import.meta.env.VITE_WALLET_GATEWAY_URL
                if (typeof gw === 'string' && gw.length > 0) {
                    await sdk.init({
                        additionalAdapters: [
                            new RemoteAdapter({
                                name: 'Configured gateway',
                                rpcUrl: gw,
                            }),
                        ],
                    })
                } else {
                    await sdk.init()
                }
            } catch (e) {
                if (!cancelled) setInitError(String(e))
            }
            if (!cancelled) await refreshWallet()
        }
        void boot()
        return () => {
            cancelled = true
        }
    }, [refreshWallet])

    useEffect(() => {
        if (!connected) return

        const onWalletEvent = () => {
            void refreshWallet()
        }

        void sdk.onStatusChanged(onWalletEvent)
        void sdk.onAccountsChanged(onWalletEvent)

        return () => {
            void sdk.removeOnStatusChanged(onWalletEvent)
            void sdk.removeOnAccountsChanged(onWalletEvent)
        }
    }, [connected, refreshWallet])

    const onConnect = useCallback(async () => {
        setPurchaseBanner(null)
        try {
            await sdk.connect()
            await refreshWallet()
        } catch (e) {
            setPurchaseBanner(`Connect failed: ${String(e)}`)
        }
    }, [refreshWallet])

    const onDisconnect = useCallback(async () => {
        await sdk.disconnect()
        await refreshWallet()
    }, [refreshWallet])

    const onPurchase = useCallback(async () => {
        setPurchaseBanner(null)
        if (!connected || !partyId) {
            setPurchaseBanner('Connect a wallet and authorize a party first.')
            return
        }
        if (!configLooksReady()) {
            setPurchaseBanner(
                'Configure .env (contract ids and paymaster party) before purchasing.'
            )
            return
        }
        const qty = Math.max(1, luParsed || 1)
        setPurchasing(true)
        try {
            const cfg = getPaymasterConfig()
            const cmdId = `traffic-purchase:${crypto.randomUUID()}`
            await sdk.prepareExecuteAndWait({
                commandId: cmdId,
                actAs: [partyId],
                commands: [
                    buildPurchaseExercise(
                        partyId,
                        targetAccount,
                        qty,
                        cfg.demoHoldingContractId,
                        cfg.purchaseTrafficContractId
                    ),
                ],
            })
            setPurchaseBanner(
                'Purchase transaction completed (see wallet / ledger for details).'
            )
        } catch (e) {
            setPurchaseBanner(`Purchase failed: ${String(e)}`)
        } finally {
            setPurchasing(false)
        }
    }, [connected, luParsed, partyId, targetAccount])

    const toggleAsset = (id: string): void => {
        setSelectedAssetIds((prev) => ({ ...prev, [id]: !prev[id] }))
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8 text-gray-900">
            <div className="mx-auto max-w-7xl space-y-8">
                {initError ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        SDK init: {initError}
                    </div>
                ) : null}

                <div>
                    <h1 className="text-4xl font-bold tracking-tight">
                        Traffic Paymaster dApp
                    </h1>
                    <p className="mt-2 text-lg text-gray-600">
                        Reference UI for local traffic accounts, LU purchases,
                        and paymaster-based traffic funding.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                        <div className="flex items-center justify-between gap-2">
                            <h2 className="text-xl font-semibold">
                                Wallet Overview
                            </h2>
                            <span
                                className={
                                    connected
                                        ? 'rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700'
                                        : 'rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600'
                                }
                            >
                                {connected ? 'Connected' : 'Disconnected'}
                            </span>
                        </div>

                        <div className="mt-6 space-y-4">
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => void onConnect()}
                                    className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                                >
                                    Connect wallet
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void onDisconnect()}
                                    className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100"
                                >
                                    Disconnect
                                </button>
                            </div>

                            <div>
                                <div className="text-sm text-gray-500">
                                    Party
                                </div>
                                <div className="font-mono text-sm break-all">
                                    {partyId ?? '— (connect wallet)'}
                                </div>
                            </div>

                            <div>
                                <div className="text-sm text-gray-500">
                                    Total Local Units
                                </div>
                                <div className="text-3xl font-bold">
                                    {totalLu} LU
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    Illustrative balances; enforcement
                                    projection not wired here.
                                </p>
                            </div>

                            <div>
                                <div className="text-sm text-gray-500">
                                    Active Paymaster
                                </div>
                                <div className="font-medium">
                                    {paymaster.displayName}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-200 lg:col-span-2">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">
                                EligiblePaymentAssetConversionRate
                            </h2>
                            <span className="text-sm text-gray-500">
                                Supported payment assets
                            </span>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                            {mockConversionRates.map((rate) => (
                                <div
                                    key={rate.asset}
                                    className="rounded-2xl border border-gray-200 p-4"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="text-lg font-semibold">
                                            {rate.asset}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                window.alert(
                                                    'ValidateAssets: in production this would exercise the rate template with readAs paymaster (demo stub).'
                                                )
                                            }
                                            className="rounded-xl border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100"
                                        >
                                            Validate Assets
                                        </button>
                                    </div>

                                    <div className="mt-3 text-gray-600">
                                        {rate.rate}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">
                                Local Traffic Accounts
                            </h2>
                            <button
                                type="button"
                                onClick={() => void refreshWallet()}
                                className="rounded-xl bg-black px-4 py-2 text-white hover:opacity-90"
                            >
                                Refresh
                            </button>
                        </div>

                        <div className="mt-6 space-y-4">
                            {mockLocalAccounts.map((account) => (
                                <div
                                    key={account.name}
                                    className="rounded-2xl border border-gray-200 p-5"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <div className="font-semibold">
                                                {account.name}
                                            </div>
                                            <div className="mt-1 text-sm text-gray-500">
                                                Synchronizers:{' '}
                                                {account.synchronizers.join(
                                                    ', '
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-sm text-gray-500">
                                                Balance
                                            </div>
                                            <div className="text-xl font-bold">
                                                {account.balance} LU
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">
                                PurchaseTraffic Choice
                            </h2>
                            <span className="text-sm text-gray-500">
                                Purchase LU credits
                            </span>
                        </div>

                        <div className="mt-6 space-y-5">
                            <div>
                                <label
                                    htmlFor="target-account"
                                    className="mb-2 block text-sm font-medium"
                                >
                                    Target Account
                                </label>
                                <select
                                    id="target-account"
                                    value={targetAccount}
                                    onChange={(e) =>
                                        setTargetAccount(e.target.value)
                                    }
                                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                                >
                                    {mockLocalAccounts.map((a) => (
                                        <option key={a.name} value={a.name}>
                                            {a.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="lu-qty"
                                    className="mb-2 block text-sm font-medium"
                                >
                                    LU Credits to Purchase
                                </label>
                                <input
                                    id="lu-qty"
                                    value={luQty}
                                    onChange={(e) => setLuQty(e.target.value)}
                                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="pay-asset"
                                    className="mb-2 block text-sm font-medium"
                                >
                                    Payment Asset
                                </label>
                                <select
                                    id="pay-asset"
                                    value={paymentAsset}
                                    onChange={(e) =>
                                        setPaymentAsset(
                                            e.target.value as PaymentAsset
                                        )
                                    }
                                    className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                                >
                                    {mockConversionRates.map((r) => (
                                        <option key={r.asset} value={r.asset}>
                                            {r.asset}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-3 block text-sm font-medium">
                                    Select Assets
                                </label>

                                <div className="space-y-3">
                                    {mockWalletAssets.map((asset) => (
                                        <div
                                            key={asset.id}
                                            className="flex items-center justify-between rounded-2xl border border-gray-200 p-4"
                                        >
                                            <div>
                                                <div className="font-medium">
                                                    {asset.symbol}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    Asset ID: {asset.id}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="font-semibold">
                                                    {asset.amount}{' '}
                                                    {asset.symbol}
                                                </div>

                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        !!selectedAssetIds[
                                                            asset.id
                                                        ]
                                                    }
                                                    onChange={() =>
                                                        toggleAsset(asset.id)
                                                    }
                                                    className="h-5 w-5"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <p className="text-xs text-gray-500">
                                On-chain demo uses the{' '}
                                <code className="rounded bg-gray-100 px-1">
                                    DEMO
                                </code>{' '}
                                holding from{' '}
                                <code className="rounded bg-gray-100 px-1">
                                    .env
                                </code>
                                ; asset rows above are UI mock only.
                            </p>

                            <div className="rounded-2xl bg-gray-100 p-4 text-sm text-gray-700">
                                Estimated conversion:{' '}
                                {formatPurchaseEstimate(
                                    Math.max(1, luParsed),
                                    paymentAsset
                                )}
                            </div>

                            {purchaseBanner ? (
                                <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800">
                                    {purchaseBanner}
                                </div>
                            ) : null}

                            <button
                                type="button"
                                disabled={purchasing || !configLooksReady()}
                                onClick={() => void onPurchase()}
                                className="w-full rounded-2xl bg-black px-5 py-4 text-lg font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {purchasing
                                    ? 'Submitting…'
                                    : 'Purchase Credits'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">
                            TrafficPurchaseReceipt / Traffic Events
                        </h2>
                        <span className="text-sm text-gray-500">
                            Observed by enforcement container
                        </span>
                    </div>

                    <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold">
                                        Timestamp
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold">
                                        Account
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold">
                                        Change
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold">
                                        Source
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100 bg-white">
                                {mockPurchaseHistory.map((event, idx) => (
                                    <tr key={idx}>
                                        <td className="px-4 py-4">
                                            {event.timestamp}
                                        </td>
                                        <td className="px-4 py-4">
                                            {event.account}
                                        </td>
                                        <td className="px-4 py-4 font-medium">
                                            {event.amount}
                                        </td>
                                        <td className="px-4 py-4 text-gray-600">
                                            {event.asset}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
                    <div className="font-semibold text-gray-900">
                        Covered DAML templates / concepts
                    </div>

                    <ul className="mt-3 list-disc space-y-2 pl-5">
                        <li>EligiblePaymentAssetConversionRate</li>
                        <li>
                            PurchaseTraffic → PurchaseTraffic_PurchaseCredits
                        </li>
                        <li>
                            TrafficPurchaseReceipt (user-signed receipt for
                            enforcement)
                        </li>
                        <li>
                            Local LU account balances (illustrative in this UI)
                        </li>
                        <li>Synchronizer / account visibility</li>
                        <li>Asset validation UX</li>
                        <li>Traffic purchase workflow</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
