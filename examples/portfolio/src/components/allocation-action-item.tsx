// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react'
import { Box, Paper, Typography } from '@mui/material'
import type { AllocationActionItem } from './types'
import { getLegsPendingAllocation, getLegsWithAllocation } from './utils'

interface AllocationActionItemCardProps {
    item: AllocationActionItem
    isLoading: boolean
    onClick: () => void
}

export const AllocationActionItemCard: React.FC<
    AllocationActionItemCardProps
> = (props: AllocationActionItemCardProps) => {
    const { item, isLoading, onClick } = props

    const legsPending = getLegsPendingAllocation(item)
    const legsAllocated = getLegsWithAllocation(item)
    const hasPendingAllocations = legsPending.length > 0
    const hasAllocations = legsAllocated.length > 0

    const getStatusText = () => {
        if (hasPendingAllocations && hasAllocations) {
            return `${legsPending.length} pending, ${legsAllocated.length} allocated`
        }

        if (hasPendingAllocations) {
            return `${legsPending.length} transfer leg${legsPending.length > 1 ? 's' : ''} requires allocation`
        }
        return `${legsAllocated.length} allocated`
    }

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
                        Allocation
                    </Typography>
                </Box>

                <Box sx={{ minWidth: 100, flexShrink: 0 }}>
                    <Typography variant="body2" color="textSecondary">
                        Allocate Before
                    </Typography>
                    <Typography variant="body1">{item.expiry}</Typography>
                </Box>

                <Box sx={{ minWidth: 100, flexShrink: 0 }}>
                    <Typography variant="body2" color="textSecondary">
                        Transfer Legs
                    </Typography>
                    <Typography variant="body1">
                        {item.transferLegs.length}
                    </Typography>
                </Box>

                <Box sx={{ flex: 1, minWidth: 150 }}>
                    <Typography variant="body2" color="textSecondary">
                        Status
                    </Typography>
                    <Typography
                        variant="body1"
                        sx={{
                            color: hasPendingAllocations
                                ? 'warning.main'
                                : 'success.main',
                        }}
                    >
                        {getStatusText()}
                    </Typography>
                </Box>
            </Box>
        </Paper>
    )
}
