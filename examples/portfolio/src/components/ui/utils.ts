import type { SxProps, Theme } from '@mui/material/styles'

export function normalizeSx(sx: SxProps<Theme> | undefined) {
    return Array.isArray(sx) ? sx : [sx]
}
