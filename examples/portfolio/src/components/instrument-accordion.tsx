// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Avatar,
    Box,
    Typography,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import type { Holding } from '@canton-network/core-tx-parser'
import type { AggregatedHolding } from '../utils/aggregate-holdings'
import { HoldingRow } from './holding-row'

interface InstrumentAccordionProps {
    aggregatedHolding: AggregatedHolding
    holdings: Holding[]
}

export const InstrumentAccordion: React.FC<InstrumentAccordionProps> = ({
    aggregatedHolding,
    holdings,
}) => {
    const symbol =
        aggregatedHolding.instrument?.symbol ??
        aggregatedHolding.instrumentId.id
    const name =
        aggregatedHolding.instrument?.name ?? aggregatedHolding.instrumentId.id
    const hasLockedAmount = aggregatedHolding.lockedAmount !== '0'

    return (
        <Accordion
            disableGutters
            sx={{
                '&:before': { display: 'none' },
                boxShadow: 'none',
                '&:not(:last-child)': {
                    borderBottom: (theme) =>
                        `1px solid ${theme.palette.divider}`,
                },
            }}
        >
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                    '&:hover': {
                        backgroundColor: 'action.hover',
                    },
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        width: '100%',
                        pr: 2,
                    }}
                >
                    <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                        {symbol[0]}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                        <Typography
                            variant="body2"
                            color="textSecondary"
                            sx={{
                                maxWidth: '150px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {name}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {aggregatedHolding.totalAmount} {symbol}
                        </Typography>
                    </Box>
                    {hasLockedAmount && (
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="body2" color="success.main">
                                {aggregatedHolding.availableAmount} available
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                {aggregatedHolding.lockedAmount} locked
                            </Typography>
                        </Box>
                    )}
                </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0, pl: 6 }}>
                <Typography
                    variant="caption"
                    color="textSecondary"
                    sx={{
                        px: 2,
                        pt: 1,
                        display: 'block',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                    }}
                >
                    {aggregatedHolding.numOfHoldings} holding
                    {aggregatedHolding.numOfHoldings !== 1 ? 's' : ''}
                </Typography>
                <Box>
                    {holdings.map((holding) => (
                        <HoldingRow
                            key={holding.contractId}
                            holding={holding}
                            symbol={symbol}
                        />
                    ))}
                </Box>
            </AccordionDetails>
        </Accordion>
    )
}
