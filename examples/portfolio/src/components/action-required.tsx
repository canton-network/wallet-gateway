// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import React, { useState, useMemo } from 'react'
import { Box, Typography, Badge } from '@mui/material'
import type { PartyId } from '@canton-network/core-types'
import { toast } from 'sonner'
import { useExerciseTransfer } from '../hooks/useExerciseTransfer'
import { useCreateAllocation } from '../hooks/useCreateAllocation'
import { useWithdrawAllocation } from '../hooks/useWithdrawAllocation'
import { TransferActionDialog } from './transfer-action-dialog'
import { TransferActionItemCard } from './transfer-action-item'
import { AllocationActionItemCard } from './allocation-action-item'
import { AllocationActionDialog } from './allocation-action-dialog'
import type {
    ActionItem,
    TransferActionItem,
    AllocationActionItem,
    TransferLegWithAllocation,
} from './types'

interface ActionRequiredProps {
    items: ActionItem[]
}

export const ActionRequired: React.FC<ActionRequiredProps> = ({ items }) => {
    const [selectedTransferItem, setSelectedTransferItem] =
        useState<TransferActionItem | null>(null)
    const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)

    // store only ID, derive item from props to stay in sync
    const [selectedAllocationItemId, setSelectedAllocationItemId] = useState<
        string | null
    >(null)
    const [isAllocationDialogOpen, setIsAllocationDialogOpen] = useState(false)
    const [loadingLegId, setLoadingLegId] = useState<string | null>(null)

    // Derive the selected allocation item from props so it stays in sync with query data
    const selectedAllocationItem = useMemo(() => {
        if (!selectedAllocationItemId) return null
        const item = items.find(
            (i) => i.kind === 'allocation' && i.id === selectedAllocationItemId
        )
        return item ? (item as AllocationActionItem) : null
    }, [items, selectedAllocationItemId])

    const [loadingItemId, setLoadingItemId] = useState<string | null>(null)

    const exerciseTransferMutation = useExerciseTransfer()
    const createAllocationMutation = useCreateAllocation()
    const withdrawAllocationMutation = useWithdrawAllocation()

    const handleTransferCardClick = (item: TransferActionItem) => {
        setSelectedTransferItem(item)
        setIsTransferDialogOpen(true)
    }

    const handleCloseTransferDialog = () => {
        setIsTransferDialogOpen(false)
        setSelectedTransferItem(null)
    }

    const handleTransferAction = (
        item: TransferActionItem,
        action: 'Accept' | 'Reject' | 'Withdraw'
    ) => {
        setLoadingItemId(item.id)
        exerciseTransferMutation.mutate(
            {
                party: item.currentPartyId as PartyId,
                contractId: item.id,
                instrumentId: item.instrumentId,
                instructionChoice: action,
            },
            {
                onSuccess: () => {
                    toast.success(`${action} transfer successful`)
                    handleCloseTransferDialog()
                },
                onError: (error) =>
                    toast.error(
                        `Failed to ${action.toLowerCase()} transfer: ${error instanceof Error ? error.message : 'Unknown error'}`
                    ),
                onSettled: () => setLoadingItemId(null),
            }
        )
    }

    const handleAllocationCardClick = (item: AllocationActionItem) => {
        setSelectedAllocationItemId(item.id)
        setIsAllocationDialogOpen(true)
    }

    const handleCloseAllocationDialog = () => {
        setIsAllocationDialogOpen(false)
        setSelectedAllocationItemId(null)
    }

    const handleCreateAllocation = (
        item: AllocationActionItem,
        leg: TransferLegWithAllocation
    ) => {
        setLoadingItemId(item.id)
        setLoadingLegId(leg.transferLegId)
        createAllocationMutation.mutate(
            {
                party: item.currentPartyId as PartyId,
                allocationSpecification: {
                    settlement: item.settlement,
                    transferLegId: leg.transferLegId,
                    transferLeg: leg.transferLeg,
                },
            },
            {
                onSuccess: () => {
                    toast.success('Allocation created successfully')
                },
                onError: (error) =>
                    toast.error(
                        `Failed to create allocation: ${error instanceof Error ? error.message : 'Unknown error'}`
                    ),
                onSettled: () => {
                    setLoadingItemId(null)
                    setLoadingLegId(null)
                },
            }
        )
    }

    const handleWithdrawAllocation = (
        item: AllocationActionItem,
        leg: TransferLegWithAllocation,
        allocationContractId: string
    ) => {
        setLoadingItemId(item.id)
        setLoadingLegId(leg.transferLegId)
        withdrawAllocationMutation.mutate(
            {
                party: item.currentPartyId as PartyId,
                contractId: allocationContractId,
                instrumentId: leg.transferLeg.instrumentId,
            },
            {
                onSuccess: () => {
                    toast.success('Allocation withdrawn successfully')
                },
                onError: (error) =>
                    toast.error(
                        `Failed to withdraw allocation: ${error instanceof Error ? error.message : 'Unknown error'}`
                    ),
                onSettled: () => {
                    setLoadingItemId(null)
                    setLoadingLegId(null)
                },
            }
        )
    }

    if (items.length === 0) return null

    return (
        <Box sx={{ mb: 6 }}>
            <Box sx={{ display: 'flex', mb: 2 }}>
                <Typography
                    variant="h6"
                    sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}
                >
                    Action Required
                </Typography>
                <Badge
                    badgeContent={items.length}
                    color="error"
                    sx={{ ml: 2 }}
                />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {items.map((item) => {
                    const isItemLoading = loadingItemId === item.id

                    switch (item.kind) {
                        case 'allocation':
                            return (
                                <AllocationActionItemCard
                                    key={item.id}
                                    item={item}
                                    isLoading={isItemLoading}
                                    onClick={() =>
                                        handleAllocationCardClick(item)
                                    }
                                />
                            )
                        case 'transfer':
                            return (
                                <TransferActionItemCard
                                    key={item.id}
                                    item={item}
                                    isLoading={isItemLoading}
                                    onClick={() =>
                                        handleTransferCardClick(item)
                                    }
                                    onAccept={() =>
                                        handleTransferAction(item, 'Accept')
                                    }
                                    onReject={() =>
                                        handleTransferAction(item, 'Reject')
                                    }
                                    onWithdraw={() =>
                                        handleTransferAction(item, 'Withdraw')
                                    }
                                />
                            )
                    }
                })}
            </Box>

            <TransferActionDialog
                item={selectedTransferItem}
                open={isTransferDialogOpen}
                isLoading={loadingItemId !== null}
                onClose={handleCloseTransferDialog}
                onAccept={(item) => handleTransferAction(item, 'Accept')}
                onReject={(item) => handleTransferAction(item, 'Reject')}
                onWithdraw={(item) => handleTransferAction(item, 'Withdraw')}
            />

            <AllocationActionDialog
                item={selectedAllocationItem}
                open={isAllocationDialogOpen}
                isLoading={loadingItemId !== null}
                loadingLegId={loadingLegId}
                onClose={handleCloseAllocationDialog}
                onCreateAllocation={(leg) =>
                    selectedAllocationItem &&
                    handleCreateAllocation(selectedAllocationItem, leg)
                }
                onWithdrawAllocation={(leg, contractId) =>
                    selectedAllocationItem &&
                    handleWithdrawAllocation(
                        selectedAllocationItem,
                        leg,
                        contractId
                    )
                }
            />
        </Box>
    )
}
