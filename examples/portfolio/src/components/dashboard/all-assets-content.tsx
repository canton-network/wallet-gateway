// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import type { ReactNode } from 'react'
import { Alert, Avatar, Box, Paper, Skeleton, Typography } from '@mui/material'
import type { AllAccountAssetsResult } from '@hooks/useAllAccountAssets'
import type { AggregatedHolding } from '@utils/aggregate-holdings'
import { getInstrumentInitials } from '@utils/instrument-display'

export function AllAssetsContent({
    assets,
    isLoading,
    isError,
    error,
}: AllAccountAssetsResult) {
    if (isError) {
        return (
            <Alert severity="error">
                {error?.message ?? 'Unable to load assets across your wallets.'}
            </Alert>
        )
    }

    if (isLoading) {
        return (
            <AssetsPanel>
                {/* Render placeholder rows while balances load. */}
                {Array.from({ length: 5 }, (_, index) => (
                    <AssetRowSkeleton key={index} />
                ))}
            </AssetsPanel>
        )
    }

    if (assets.length === 0) {
        return (
            <Alert severity="info">
                There are currently no assets across your wallets.
            </Alert>
        )
    }

    return (
        <AssetsPanel>
            {assets.map((asset) => (
                <AssetRow key={getAssetKey(asset)} asset={asset} />
            ))}
        </AssetsPanel>
    )
}

type AssetsPanelProps = {
    children: ReactNode
}

function AssetsPanel({ children }: AssetsPanelProps) {
    return (
        <Box
            component={Paper}
            elevation={0}
            sx={{
                display: 'grid',
                gap: 2.5,
                bgcolor: 'background.paper',
                borderRadius: 1,
                p: 3,
            }}
        >
            {children}
        </Box>
    )
}

type AssetRowProps = {
    asset: AggregatedHolding
}

function AssetRow({ asset }: AssetRowProps) {
    const name = asset.instrument?.name ?? asset.instrumentId.id
    const symbol = asset.instrument?.symbol ?? asset.instrumentId.id
    const initials = getInstrumentInitials(name)

    return (
        <Box
            sx={{
                minHeight: 64,
                px: 2,
                py: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                border: (theme) => `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
            }}
        >
            <Box
                sx={{
                    minWidth: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                }}
            >
                <Avatar
                    aria-hidden="true"
                    sx={{
                        width: 32,
                        height: 32,
                        bgcolor: 'text.primary',
                        color: 'background.default',
                        fontSize: 13,
                        fontWeight: 700,
                    }}
                >
                    {initials}
                </Avatar>
                <Typography
                    variant="body1"
                    sx={{
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {name}
                </Typography>
            </Box>

            <Typography variant="body1" sx={{ whiteSpace: 'nowrap' }}>
                {asset.totalAmount} {symbol}
            </Typography>
        </Box>
    )
}

function AssetRowSkeleton() {
    return (
        <Box
            sx={{
                minHeight: 64,
                px: 2,
                py: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                border: (theme) => `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Skeleton variant="circular" width={32} height={32} />
                <Skeleton variant="text" width={160} />
            </Box>
            <Skeleton variant="text" width={140} />
        </Box>
    )
}

function getAssetKey(asset: AggregatedHolding) {
    return `${asset.instrumentId.admin}::${asset.instrumentId.id}`
}
