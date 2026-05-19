import { Box, Avatar, Typography, Paper, Skeleton, Chip } from '@mui/material'
import { Link } from '@tanstack/react-router'
import { useAggregatedHoldings } from '../hooks/useAggregatedHoldings'
import type { AggregatedHolding } from '../utils/aggregate-holdings'

interface WalletPreviewProps {
    partyId: string
    walletName: string
    isPrimary?: boolean
}

export const WalletPreview: React.FC<WalletPreviewProps> = ({
    partyId,
    walletName,
    isPrimary,
}) => {
    const { instruments, isLoading } = useAggregatedHoldings(partyId)
    const hasInstruments = instruments.length > 0

    const noInstruments = (
        <Box
            sx={{
                p: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
            }}
        >
            <Avatar
                sx={{ visibility: 'hidden', m: 1, height: 25, width: 25 }}
            />
            <Typography sx={{ position: 'absolute' }}>
                There are currently no assets in this wallet
            </Typography>
        </Box>
    )

    const loadingState = (
        <Box sx={{ p: 1 }}>
            <Skeleton variant="rectangular" height={40} />
            <Skeleton variant="rectangular" height={40} sx={{ mt: 1 }} />
        </Box>
    )

    const renderedAssets = instruments.map((item) => (
        <InstrumentRow
            key={`${item.instrumentId.admin}::${item.instrumentId.id}`}
            item={item}
        />
    ))

    return (
        <Link
            to="/wallet/$walletId"
            params={{ walletId: partyId }}
            style={{ textDecoration: 'none', color: 'inherit' }}
        >
            <Box
                data-testid={`wallet-preview-${partyId}`}
                sx={{ display: 'flex', flexDirection: 'column' }}
            >
                <Box
                    sx={{
                        mb: 1,
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    <Typography
                        sx={{
                            fontWeight: 'bold',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            maxWidth: '200px',
                        }}
                        color="secondary"
                    >
                        {walletName}
                    </Typography>
                    {isPrimary && (
                        <Chip label="Primary" size="small" color="primary" />
                    )}
                </Box>
                <Box
                    component={Paper}
                    variant="outlined"
                    sx={{
                        background: (t) =>
                            t.palette.mode === 'dark'
                                ? undefined
                                : t.palette.grey[100],
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                            borderColor: 'primary.main',
                            boxShadow: 1,
                        },
                    }}
                >
                    {isLoading
                        ? loadingState
                        : hasInstruments
                          ? renderedAssets
                          : noInstruments}
                </Box>
            </Box>
        </Link>
    )
}

interface InstrumentRowProps {
    item: AggregatedHolding
}

const InstrumentRow: React.FC<InstrumentRowProps> = ({ item }) => {
    const symbol = item.instrument?.symbol ?? item.instrumentId.id
    const name = item.instrument?.name ?? item.instrumentId.id
    const hasLockedAmount = item.lockedAmount !== '0'

    return (
        <Box
            data-testid={`instrument-row-${symbol}`}
            sx={{
                borderRadius: 0,
                '&:not(:first-of-type)': {
                    borderTop: (theme) => `1px solid ${theme.palette.divider}`,
                },
                p: 1,
                display: 'flex',
                alignItems: 'center',
            }}
        >
            <Avatar sx={{ m: 1, height: 25, width: 25 }}>{symbol[0]}</Avatar>
            <Box>
                <Typography
                    sx={{
                        maxWidth: '100px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                    color="textSecondary"
                    variant="body2"
                >
                    {name}
                </Typography>
                <Typography
                    data-testid="instrument-total-amount"
                    variant="body2"
                    sx={{ fontWeight: '700' }}
                >
                    {item.totalAmount} {symbol}
                    {hasLockedAmount && (
                        <Typography
                            data-testid="instrument-available-amount"
                            component="span"
                            variant="body2"
                            color="textSecondary"
                            sx={{ ml: 0.5 }}
                        >
                            ({item.availableAmount} available)
                        </Typography>
                    )}
                </Typography>
            </Box>
        </Box>
    )
}
