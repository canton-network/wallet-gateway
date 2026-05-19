// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import type { Holding } from '@canton-network/core-tx-parser'
import { useInstruments } from '../contexts/RegistryServiceContext'
import { listHoldings } from '../services/portfolio-service-implementation'
import {
    aggregateHoldings,
    enrichWithInstrumentInfo,
    type AggregatedHolding,
} from '../utils/aggregate-holdings'
import { useAccounts } from './useAccounts'
import { queryKeys } from './query-keys'

export interface AllAccountAssetsResult {
    assets: AggregatedHolding[]
    holdings: Holding[]
    isLoading: boolean
    isError: boolean
    error: Error | null
    refetch: () => void
}

export const useAllAccountAssets = (): AllAccountAssetsResult => {
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

    const assets = useMemo(
        () =>
            enrichWithInstrumentInfo(
                aggregateHoldings(holdings),
                registryInstruments
            ),
        [holdings, registryInstruments]
    )

    const refetch = useCallback(() => {
        void Promise.all(holdingsQueries.map((query) => query.refetch()))
    }, [holdingsQueries])

    const error = holdingsQueries.find((query) => query.error)?.error

    return {
        assets,
        holdings,
        isLoading: holdingsQueries.some((query) => query.isLoading),
        isError: holdingsQueries.some((query) => query.isError),
        error: error instanceof Error ? error : null,
        refetch,
    }
}
