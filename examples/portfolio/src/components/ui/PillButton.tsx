import { Button, type ButtonProps } from '@mui/material'
import { normalizeSx } from './utils'

const DEFAULT_VARIANT_BY_TONE = {
    primary: 'contained',
    secondary: 'contained',
    danger: 'outlined',
    neutral: 'outlined',
} satisfies Record<PillButtonTone, ButtonProps['variant']>

const DEFAULT_COLOR_BY_TONE = {
    primary: 'primary',
    secondary: 'secondary',
    danger: 'error',
    neutral: 'primary',
} satisfies Record<PillButtonTone, ButtonProps['color']>

const NEUTRAL_STYLES: ButtonProps['sx'] = {
    color: 'text.primary',
    borderColor: 'divider',
    '&:hover': {
        borderColor: 'text.secondary',
        bgcolor: 'action.hover',
    },
}

type PillButtonTone = 'primary' | 'secondary' | 'danger' | 'neutral'

type PillButtonProps = ButtonProps & {
    tone?: PillButtonTone
}

export function PillButton({
    tone = 'primary',
    variant,
    color,
    sx,
    ...props
}: PillButtonProps) {
    const toneStyles = tone === 'neutral' ? NEUTRAL_STYLES : undefined

    return (
        <Button
            variant={variant ?? DEFAULT_VARIANT_BY_TONE[tone]}
            color={color ?? DEFAULT_COLOR_BY_TONE[tone]}
            sx={[{ borderRadius: 999 }, toneStyles, ...normalizeSx(sx)]}
            {...props}
        />
    )
}
