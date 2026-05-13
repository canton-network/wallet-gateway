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
    Chip,
} from '@mui/material'
import { CopyableIdentifier } from './copyable-identifier'
import type { AllocationActionItem, TransferLegWithAllocation } from './types'
import { isSenderOfLeg, isReceiverOfLeg } from './utils'

interface AllocationActionDialogProps {
    item: AllocationActionItem | null
    open: boolean
    isLoading: boolean
    loadingLegId: string | null
    onClose: () => void
    onCreateAllocation: (leg: TransferLegWithAllocation) => void
    onWithdrawAllocation: (
        leg: TransferLegWithAllocation,
        allocationContractId: string
    ) => void
}

export const AllocationActionDialog: React.FC<AllocationActionDialogProps> = (
    props
) => {
    const {
        item,
        open,
        isLoading,
        loadingLegId,
        onClose,
        onCreateAllocation,
        onWithdrawAllocation,
    } = props

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
                    Allocation Details
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
                                p: 2,
                                borderRadius: 2,
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
                                }}
                            >
                                Type
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ fontWeight: 'medium' }}
                            >
                                Allocation Request
                            </Typography>
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
                                    Settlement Reference
                                </Typography>
                                <CopyableIdentifier
                                    value={item.settlement.settlementRef.id}
                                    maxLength={40}
                                />
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
                                    Allocate Before
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
                                Executor
                            </Typography>
                            <CopyableIdentifier
                                value={item.settlement.executor}
                                maxLength={60}
                            />
                        </Box>

                        <Box>
                            <Typography
                                variant="subtitle1"
                                sx={{ fontWeight: 'bold', mb: 2 }}
                            >
                                Transfer Legs ({item.transferLegs.length})
                            </Typography>
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2,
                                }}
                            >
                                {item.transferLegs.map((leg) => (
                                    <TransferLegCard
                                        key={leg.transferLegId}
                                        leg={leg}
                                        currentPartyId={item.currentPartyId}
                                        isLoading={isLoading}
                                        isLegLoading={
                                            loadingLegId === leg.transferLegId
                                        }
                                        onCreateAllocation={() =>
                                            onCreateAllocation(leg)
                                        }
                                        onWithdrawAllocation={(contractId) =>
                                            onWithdrawAllocation(
                                                leg,
                                                contractId
                                            )
                                        }
                                    />
                                ))}
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
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    )
}

interface TransferLegCardProps {
    leg: TransferLegWithAllocation
    currentPartyId: string
    isLoading: boolean
    isLegLoading: boolean
    onCreateAllocation: () => void
    onWithdrawAllocation: (allocationContractId: string) => void
}

const TransferLegCard: React.FC<TransferLegCardProps> = ({
    leg,
    currentPartyId,
    isLoading,
    isLegLoading,
    onCreateAllocation,
    onWithdrawAllocation,
}) => {
    const isSender = isSenderOfLeg(currentPartyId, leg)
    const isReceiver = isReceiverOfLeg(currentPartyId, leg)
    const hasAllocation = leg.allocations.length > 0

    const getRoleChip = () => {
        if (isSender && isReceiver) {
            return <Chip label="Self-transfer" size="small" color="info" />
        }
        if (isSender) {
            return <Chip label="Sender" size="small" color="primary" />
        }
        if (isReceiver) {
            return <Chip label="Receiver" size="small" color="secondary" />
        }
        return <Chip label="Observer" size="small" />
    }

    return (
        <Box
            sx={{
                p: 2,
                borderRadius: 1,
                border: '1px solid',
                borderColor: hasAllocation ? 'success.light' : 'divider',
                backgroundColor: hasAllocation ? 'success.50' : 'transparent',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 2,
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        Leg: {leg.transferLegId}
                    </Typography>
                    {getRoleChip()}
                    {hasAllocation && (
                        <Chip label="Allocated" size="small" color="success" />
                    )}
                </Box>
                {isSender && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {!hasAllocation ? (
                            <Button
                                variant="contained"
                                size="small"
                                disabled={isLoading}
                                onClick={onCreateAllocation}
                            >
                                {isLegLoading ? (
                                    <CircularProgress
                                        size={16}
                                        color="inherit"
                                    />
                                ) : (
                                    'Create Allocation'
                                )}
                            </Button>
                        ) : (
                            leg.allocations.map((allocation) => (
                                <Button
                                    key={allocation.contractId}
                                    variant="outlined"
                                    color="warning"
                                    size="small"
                                    disabled={isLoading}
                                    onClick={() =>
                                        onWithdrawAllocation(
                                            allocation.contractId
                                        )
                                    }
                                >
                                    {isLegLoading ? (
                                        <CircularProgress
                                            size={16}
                                            color="inherit"
                                        />
                                    ) : (
                                        'Withdraw'
                                    )}
                                </Button>
                            ))
                        )}
                    </Box>
                )}
            </Box>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 2,
                }}
            >
                <Box>
                    <Typography variant="caption" color="text.secondary">
                        Amount
                    </Typography>
                    <Typography variant="body2">
                        {leg.transferLeg.amount}{' '}
                        {leg.transferLeg.instrumentId.id}
                    </Typography>
                </Box>
                <Box>
                    <Typography variant="caption" color="text.secondary">
                        Sender
                    </Typography>
                    <CopyableIdentifier
                        value={leg.transferLeg.sender}
                        maxLength={20}
                    />
                </Box>
                <Box>
                    <Typography variant="caption" color="text.secondary">
                        Receiver
                    </Typography>
                    <CopyableIdentifier
                        value={leg.transferLeg.receiver}
                        maxLength={20}
                    />
                </Box>
            </Box>
        </Box>
    )
}
