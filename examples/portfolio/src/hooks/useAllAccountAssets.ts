// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { useInstruments } from '../contexts/RegistryServiceContext'
import { listHoldings } from '../services/portfolio-service-implementation'
import {
    aggregateHoldings,
    enrichWithInstrumentInfo,
    type AggregatedHolding,
} from '../utils/aggregate-holdings'
import { useAccounts } from './useAccounts'
import { queryKeys } from './query-keys'

export interface PortfolioAssetWalletBalanceView {
    id: string
    walletName: string
    isPrimary: boolean
    amount: string
}

export interface PortfolioAssetView extends Omit<
    AggregatedHolding,
    'walletBalances'
> {
    walletBalances: PortfolioAssetWalletBalanceView[]
}

export interface PortfolioAssetsResult {
    assets: PortfolioAssetView[]
    isLoading: boolean
    isError: boolean
    error: Error | null
    refetch: () => void
}

export const useAllAccountAssets = (): PortfolioAssetsResult => {
    const accounts = useAccounts()
    const registryInstruments = useInstruments()

    const holdingsQueries = useQueries({
        queries: accounts.map((account) => ({
            queryKey: queryKeys.listHoldings.forParty(account.partyId),
            queryFn: () => listHoldings({ party: account.partyId }),
        })),
    })

    const holdings = useMemo(
        () =>
            holdingsQueries.flatMap((query) =>
                query.data && !query.isError ? query.data : []
            ),
        [holdingsQueries]
    )

    const assets = useMemo(() => {
        const accountByParty = new Map(
            accounts.map((account) => [account.partyId, account])
        )

        return enrichWithInstrumentInfo(
            aggregateHoldings(holdings),
            registryInstruments
        ).map((asset) => ({
            ...asset,
            walletBalances: asset.walletBalances
                .map((balance) => {
                    const account = accountByParty.get(balance.owner)

                    return {
                        id: balance.owner,
                        walletName: account?.hint ?? balance.owner,
                        isPrimary: Boolean(account?.primary),
                        amount: balance.totalAmount,
                    }
                })
                .sort(
                    (a, b) =>
                        Number(b.isPrimary) - Number(a.isPrimary) ||
                        a.walletName.localeCompare(b.walletName)
                ),
        }))
    }, [accounts, holdings, registryInstruments])

    const refetch = useCallback(() => {
        void Promise.all(holdingsQueries.map((query) => query.refetch()))
    }, [holdingsQueries])

    const error = holdingsQueries.find((query) => query.error)?.error

    return {
        assets,
        isLoading: holdingsQueries.some((query) => query.isLoading),
        isError: holdingsQueries.some((query) => query.isError),
        error: error instanceof Error ? error : null,
        refetch,
    }
}
