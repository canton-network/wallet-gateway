import React from 'react'
import { Box, Typography } from '@mui/material'
import { CopyIconButton } from './ui/CopyIconButton'

interface CopyableIdentifierProps {
    value: string
    maxLength?: number
}

export const CopyableIdentifier: React.FC<CopyableIdentifierProps> = ({
    value,
    maxLength = 8,
}) => {
    const truncate = (str: string, len: number) => {
        if (str.length <= len) {
            return str
        }
        return `${str.slice(0, len)}...`
    }

    const formatPartyId = (val: string) => {
        const parts = val.split('::')
        const prefix = parts[0] || ''
        const suffix = parts[1] || ''
        return `${prefix}::${truncate(suffix, maxLength)}`
    }

    const getDisplayValue = () => {
        if (value.includes('::')) {
            return formatPartyId(value)
        }
        return truncate(value, maxLength)
    }

    const displayValue = getDisplayValue()

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" component="span">
                {displayValue}
            </Typography>
            <CopyIconButton value={value} sx={{ p: 0.5 }} />
        </Box>
    )
}
