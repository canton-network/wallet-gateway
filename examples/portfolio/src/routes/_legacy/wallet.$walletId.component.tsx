// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { Link, getRouteApi } from '@tanstack/react-router'
import { Box, Typography, Paper, Skeleton, Button } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useAccounts } from '../../hooks/useAccounts'
import { useWalletHoldings } from '../../hooks/useWalletHoldings'
import {
    useTransactionHistoryForParty,
    useDeduplicatedTransactionHistoryForParty,
} from '../../hooks/useTransactionHistory'
import { CopyableIdentifier } from '../../components/copyable-identifier'
import { InstrumentAccordion } from '../../components/instrument-accordion'
import { TransactionTable } from '../../components/TransactionTable'

const walletRouteApi = getRouteApi('/_legacy/wallet/$walletId')

export function WalletDetailPage() {
    const { walletId } = walletRouteApi.useParams()
    const accounts = useAccounts()
    const wallet = accounts.find((a) => a.partyId === walletId)
    const walletName = wallet?.hint ?? 'Unknown Wallet'

    const { instruments, holdings, isLoading, isError } =
        useWalletHoldings(walletId)

    const {
        status: txStatus,
        fetchNextPage,
        isFetchingNextPage,
        hasNextPage,
    } = useTransactionHistoryForParty(walletId)

    const transactions = useDeduplicatedTransactionHistoryForParty(walletId)

    const getHoldingsForInstrument = (instrumentId: {
        admin: string
        id: string
    }) =>
        holdings.filter(
            (h) =>
                h.instrumentId.admin === instrumentId.admin &&
                h.instrumentId.id === instrumentId.id
        )

    return (
        <Box sx={{ my: 4 }}>
            <Button
                component={Link}
                to="/"
                startIcon={<ArrowBackIcon />}
                sx={{ mb: 2 }}
            >
                Back to Dashboard
            </Button>

            <Box sx={{ mb: 4 }}>
                <Typography
                    variant="h4"
                    component="h1"
                    sx={{ fontWeight: 'bold' }}
                >
                    {walletName}
                </Typography>
                <Box sx={{ mt: 1 }}>
                    <CopyableIdentifier value={walletId} maxLength={16} />
                </Box>
            </Box>

            <Typography
                variant="h6"
                sx={{ fontWeight: 'bold', mb: 2, textTransform: 'uppercase' }}
            >
                Holdings
            </Typography>

            <Paper variant="outlined">
                {isLoading ? (
                    <Box sx={{ p: 2 }}>
                        <Skeleton variant="rectangular" height={60} />
                        <Skeleton
                            variant="rectangular"
                            height={60}
                            sx={{ mt: 1 }}
                        />
                    </Box>
                ) : isError ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography color="error">
                            Failed to load holdings
                        </Typography>
                    </Box>
                ) : instruments.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography color="textSecondary">
                            No holdings in this wallet
                        </Typography>
                    </Box>
                ) : (
                    instruments.map((instrument) => (
                        <InstrumentAccordion
                            key={`${instrument.instrumentId.admin}::${instrument.instrumentId.id}`}
                            aggregatedHolding={instrument}
                            holdings={getHoldingsForInstrument(
                                instrument.instrumentId
                            )}
                        />
                    ))
                )}
            </Paper>

            <Typography
                variant="h6"
                sx={{
                    fontWeight: 'bold',
                    mb: 2,
                    mt: 4,
                    textTransform: 'uppercase',
                }}
            >
                Transaction History
            </Typography>

            <TransactionTable
                transactions={transactions}
                walletId={walletId}
                hasNextPage={hasNextPage}
                isFetching={txStatus === 'pending'}
                isFetchingNextPage={isFetchingNextPage}
                onLoadMore={fetchNextPage}
            />
        </Box>
    )
}
