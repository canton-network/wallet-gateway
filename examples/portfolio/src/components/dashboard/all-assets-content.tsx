// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { useState, type ReactNode } from 'react'
import {
    Alert,
    Avatar,
    Box,
    ButtonBase,
    Paper,
    Skeleton,
    Typography,
} from '@mui/material'
import type {
    PortfolioAssetView,
    PortfolioAssetsResult,
} from '@hooks/useAllAccountAssets'
import { getInstrumentInitials } from '@utils/instrument-display'
import { AssetViewDialog } from '@components/dashboard/asset-view-dialog'

export function AllAssetsContent({
    assets,
    isLoading,
    isError,
    error,
}: PortfolioAssetsResult) {
    const [selectedAsset, setSelectedAsset] =
        useState<PortfolioAssetView | null>(null)

    const handleCloseAssetDialog = () => {
        setSelectedAsset(null)
    }

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
        <>
            <AssetsPanel>
                {assets.map((asset) => (
                    <AssetRow
                        key={getAssetKey(asset)}
                        asset={asset}
                        onClick={() => setSelectedAsset(asset)}
                    />
                ))}
            </AssetsPanel>
            {selectedAsset && (
                <AssetViewDialog
                    asset={selectedAsset}
                    onClose={handleCloseAssetDialog}
                />
            )}
        </>
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
    asset: PortfolioAssetView
    onClick: () => void
}

function AssetRow({ asset, onClick }: AssetRowProps) {
    const name = asset.instrument?.name ?? asset.instrumentId.id
    const symbol = asset.instrument?.symbol ?? asset.instrumentId.id
    const initials = getInstrumentInitials(name)

    return (
        <Box
            component={ButtonBase}
            type="button"
            aria-haspopup="dialog"
            aria-label={`View ${name} holdings by wallet`}
            onClick={onClick}
            sx={{
                width: '100%',
                minHeight: 64,
                px: 2,
                py: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                color: 'text.primary',
                textAlign: 'left',
                border: (theme) => `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
                transition: (theme) =>
                    theme.transitions.create(
                        ['background-color', 'border-color', 'transform'],
                        { duration: theme.transitions.duration.short }
                    ),
                '&:hover': {
                    bgcolor: 'action.hover',
                    borderColor: 'text.secondary',
                },
                '&.Mui-focusVisible': {
                    outline: (theme) =>
                        `2px solid ${theme.palette.secondary.main}`,
                    outlineOffset: 2,
                },
                '&:active': {
                    transform: 'scale(0.99)',
                },
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

function getAssetKey(asset: PortfolioAssetView) {
    return `${asset.instrumentId.admin}::${asset.instrumentId.id}`
}
