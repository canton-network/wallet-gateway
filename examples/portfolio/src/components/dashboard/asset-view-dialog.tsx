// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import CloseIcon from '@mui/icons-material/Close'
import {
    Avatar,
    Box,
    Chip,
    Dialog,
    IconButton,
    Typography,
} from '@mui/material'
import type { PortfolioAssetView } from '@hooks/useAllAccountAssets'
import { portfolioColors } from '@lib/theme'
import { getInstrumentInitials } from '@utils/instrument-display'

type AssetViewDialogProps = {
    asset: PortfolioAssetView
    onClose: () => void
}

export function AssetViewDialog({ asset, onClose }: AssetViewDialogProps) {
    const assetName = asset.instrument?.name ?? asset.instrumentId.id
    const symbol = asset.instrument?.symbol ?? asset.instrumentId.id
    const assetInitials = getInstrumentInitials(assetName)
    const rows = asset.walletBalances
    const titleId = 'asset-view-dialog-title'

    return (
        <Dialog
            open
            onClose={onClose}
            aria-labelledby={titleId}
            maxWidth={false}
            slotProps={{
                paper: {
                    sx: {
                        width: 'min(100%, 640px)',
                        backgroundColor: portfolioColors.grey36,
                        backgroundImage: 'none',
                        borderRadius: 1,
                        boxShadow: 24,
                        color: 'text.primary',
                    },
                },
                backdrop: {
                    sx: {
                        bgcolor: 'rgba(0, 0, 0, 0.64)',
                        backdropFilter: 'blur(2px)',
                    },
                },
            }}
        >
            <Box sx={{ px: 3, pt: 3, pb: 2 }}>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: 'auto minmax(0, 1fr) auto',
                        alignItems: 'center',
                        gap: 2,
                        mb: 3,
                    }}
                >
                    <Avatar
                        aria-hidden="true"
                        sx={{
                            width: 44,
                            height: 44,
                            bgcolor: 'text.primary',
                            color: 'background.default',
                            fontSize: 20,
                            fontWeight: 700,
                        }}
                    >
                        {assetInitials}
                    </Avatar>
                    <Typography
                        id={titleId}
                        variant="h4"
                        component="h2"
                        sx={{
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {assetName}
                    </Typography>
                    <IconButton
                        type="button"
                        aria-label="Close asset details"
                        onClick={onClose}
                        sx={{
                            color: 'secondary.main',
                            transition: (theme) =>
                                theme.transitions.create(
                                    ['background-color', 'transform'],
                                    {
                                        duration:
                                            theme.transitions.duration.shortest,
                                    }
                                ),
                            '&:active': {
                                transform: 'scale(0.96)',
                            },
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
                    {rows.map((row) => (
                        <Box
                            component="li"
                            key={row.id}
                            sx={{
                                minHeight: 64,
                                display: 'grid',
                                gridTemplateColumns: 'minmax(0, 1fr) auto',
                                alignItems: 'center',
                                gap: 2,
                                borderBottom: (theme) =>
                                    `1px solid ${theme.palette.divider}`,
                            }}
                        >
                            <Box
                                sx={{
                                    minWidth: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.25,
                                }}
                            >
                                <Typography
                                    variant="body1"
                                    sx={{
                                        minWidth: 0,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        fontWeight: 700,
                                    }}
                                >
                                    {row.walletName}
                                </Typography>
                                {row.isPrimary && (
                                    <Chip
                                        label="Primary"
                                        size="small"
                                        sx={{
                                            height: 22,
                                            flexShrink: 0,
                                            bgcolor: 'primary.main',
                                            color: 'common.black',
                                            fontWeight: 500,
                                        }}
                                    />
                                )}
                            </Box>
                            <Typography
                                variant="body1"
                                sx={{
                                    color: 'text.secondary',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {row.amount} {symbol}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            </Box>
        </Dialog>
    )
}
