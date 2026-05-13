// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react'
import { Box, Paper, Typography, Button, CircularProgress } from '@mui/material'
import { CopyableIdentifier } from './copyable-identifier'
import type { TransferActionItem } from './types'
import { getCounterparty, isReceiver } from './utils'

interface TransferActionItemCardProps {
    item: TransferActionItem
    isLoading: boolean
    onClick: () => void
    onAccept: () => void
    onReject: () => void
    onWithdraw: () => void
}

export const TransferActionItemCard: React.FC<TransferActionItemCardProps> = (
    props: TransferActionItemCardProps
) => {
    const { item, isLoading, onClick, onAccept, onReject, onWithdraw } = props

    return (
        <Paper
            elevation={1}
            variant="elevation"
            sx={{
                p: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderRadius: 0,
                gap: 2,
                cursor: isLoading ? 'default' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                '&:hover': {
                    backgroundColor: isLoading ? 'inherit' : 'action.hover',
                },
            }}
            onClick={() => !isLoading && onClick()}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                }}
            >
                <Box sx={{ minWidth: 120, flexShrink: 0 }}>
                    <Typography variant="body2" color="textSecondary">
                        Type
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {item.type}
                    </Typography>
                </Box>

                <Box sx={{ minWidth: 80, flexShrink: 0 }}>
                    <Typography variant="body2" color="textSecondary">
                        Amount
                    </Typography>
                    <Typography variant="body1">
                        {item.amount} {item.instrumentId.id}
                    </Typography>
                </Box>

                <Box sx={{ minWidth: 100, flexShrink: 0 }}>
                    <Typography variant="body2" color="textSecondary">
                        Expires
                    </Typography>
                    <Typography variant="body1">{item.expiry}</Typography>
                </Box>

                <Box sx={{ minWidth: 100, flexShrink: 0 }}>
                    <Typography variant="body2" color="textSecondary">
                        {getCounterparty(item).label}
                    </Typography>
                    <CopyableIdentifier value={getCounterparty(item).value} />
                </Box>

                <Box sx={{ flex: 1, minWidth: 150 }}>
                    <Typography variant="body2" color="textSecondary">
                        Message
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{ wordBreak: 'break-word' }}
                    >
                        {item.message.slice(0, 30) + '...'}
                    </Typography>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
                {isReceiver(item) ? (
                    <>
                        <Button
                            variant="contained"
                            size="small"
                            sx={{ minWidth: 80 }}
                            disabled={isLoading}
                            onClick={(e) => {
                                e.stopPropagation()
                                onAccept()
                            }}
                        >
                            {isLoading ? (
                                <CircularProgress size={16} color="inherit" />
                            ) : (
                                'Accept'
                            )}
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            sx={{ minWidth: 80 }}
                            disabled={isLoading}
                            onClick={(e) => {
                                e.stopPropagation()
                                onReject()
                            }}
                        >
                            {isLoading ? (
                                <CircularProgress size={16} color="inherit" />
                            ) : (
                                'Reject'
                            )}
                        </Button>
                    </>
                ) : (
                    <Button
                        variant="outlined"
                        color="warning"
                        size="small"
                        sx={{ minWidth: 80 }}
                        disabled={isLoading}
                        onClick={(e) => {
                            e.stopPropagation()
                            onWithdraw()
                        }}
                    >
                        {isLoading ? (
                            <CircularProgress size={16} color="inherit" />
                        ) : (
                            'Withdraw'
                        )}
                    </Button>
                )}
            </Box>
        </Paper>
    )
}
