// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react'
import {
    Box,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
} from '@mui/material'
import { CopyableIdentifier } from './copyable-identifier'
import type { TransferActionItem } from './types'
import { getCounterparty, isReceiver } from './utils'

interface TransferActionDialogProps {
    item: TransferActionItem | null
    open: boolean
    isLoading: boolean
    onClose: () => void
    onAccept: (item: TransferActionItem) => void
    onReject: (item: TransferActionItem) => void
    onWithdraw: (item: TransferActionItem) => void
}

export const TransferActionDialog: React.FC<TransferActionDialogProps> = (
    props
) => {
    const { item, open, isLoading, onClose, onAccept, onReject, onWithdraw } =
        props

    const handleClose = () => {
        if (!isLoading) {
            onClose()
        }
    }

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ pb: 1 }}>
                <Typography
                    variant="h6"
                    component="div"
                    sx={{ fontWeight: 'bold' }}
                >
                    Transfer Details
                </Typography>
            </DialogTitle>
            <DialogContent sx={{ py: 2 }}>
                {item && (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 3,
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 3,
                                p: 2,
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                            }}
                        >
                            <Box sx={{ flex: 1 }}>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                        fontWeight: 500,
                                        textTransform: 'uppercase',
                                        letterSpacing: 0.5,
                                    }}
                                >
                                    Amount
                                </Typography>
                                <Typography
                                    variant="h6"
                                    sx={{ fontWeight: 'bold' }}
                                >
                                    {item.amount} {item.instrumentId.id}
                                </Typography>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                        fontWeight: 500,
                                        textTransform: 'uppercase',
                                        letterSpacing: 0.5,
                                    }}
                                >
                                    Type
                                </Typography>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        sx={{ fontWeight: 'medium' }}
                                    >
                                        Transfer Offer
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: 3,
                            }}
                        >
                            <Box
                                sx={{
                                    p: 2,
                                    borderRadius: 1,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                }}
                            >
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                        fontWeight: 500,
                                        textTransform: 'uppercase',
                                        letterSpacing: 0.5,
                                        mb: 1,
                                        display: 'block',
                                    }}
                                >
                                    Created
                                </Typography>
                                <Typography
                                    variant="body1"
                                    sx={{ fontWeight: 'medium' }}
                                >
                                    {item.date}
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    p: 2,
                                    borderRadius: 1,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                }}
                            >
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                        fontWeight: 500,
                                        textTransform: 'uppercase',
                                        letterSpacing: 0.5,
                                        mb: 1,
                                        display: 'block',
                                    }}
                                >
                                    Expires
                                </Typography>
                                <Typography
                                    variant="body1"
                                    sx={{ fontWeight: 'medium' }}
                                >
                                    {item.expiry}
                                </Typography>
                            </Box>
                        </Box>

                        <Box
                            sx={{
                                p: 2,
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                            }}
                        >
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                    fontWeight: 500,
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                    mb: 1,
                                    display: 'block',
                                }}
                            >
                                {getCounterparty(item).label}
                            </Typography>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                            >
                                <CopyableIdentifier
                                    value={getCounterparty(item).value}
                                    maxLength={60}
                                />
                            </Box>
                        </Box>

                        <Box
                            sx={{
                                p: 2,
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                            }}
                        >
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                    fontWeight: 500,
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                    mb: 1,
                                    display: 'block',
                                }}
                            >
                                Message
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    wordBreak: 'break-word',
                                    lineHeight: 1.6,
                                    color: 'text.primary',
                                }}
                            >
                                {item.message}
                            </Typography>
                        </Box>

                        <Box
                            sx={{
                                p: 2,
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                            }}
                        >
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                    fontWeight: 500,
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.5,
                                    mb: 1,
                                    display: 'block',
                                }}
                            >
                                Contract ID
                            </Typography>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                }}
                            >
                                <CopyableIdentifier
                                    value={item.id}
                                    maxLength={60}
                                />
                            </Box>
                        </Box>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, gap: 2 }}>
                <Button
                    onClick={handleClose}
                    variant="outlined"
                    color="inherit"
                    sx={{ minWidth: 100 }}
                    disabled={isLoading}
                >
                    Cancel
                </Button>
                <Box sx={{ flex: 1 }} />
                {item && isReceiver(item) ? (
                    <>
                        <Button
                            variant="outlined"
                            color="error"
                            sx={{ minWidth: 100 }}
                            disabled={isLoading}
                            onClick={() => onReject(item)}
                        >
                            {isLoading ? (
                                <CircularProgress size={20} color="inherit" />
                            ) : (
                                'Reject'
                            )}
                        </Button>
                        <Button
                            variant="contained"
                            sx={{ minWidth: 100 }}
                            disabled={isLoading}
                            onClick={() => onAccept(item)}
                        >
                            {isLoading ? (
                                <CircularProgress size={20} color="inherit" />
                            ) : (
                                'Accept'
                            )}
                        </Button>
                    </>
                ) : (
                    <Button
                        variant="outlined"
                        color="warning"
                        sx={{ minWidth: 100 }}
                        disabled={isLoading}
                        onClick={() => item && onWithdraw(item)}
                    >
                        {isLoading ? (
                            <CircularProgress size={20} color="inherit" />
                        ) : (
                            'Withdraw'
                        )}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    )
}
