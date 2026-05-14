import { Box, Typography } from '@mui/material'
import { useAccounts } from '../hooks/useAccounts'
import { WalletPreview } from './wallet-preview'

export const WalletsPreview = () => {
    const wallets = useAccounts()
        .slice()
        .sort((a, b) => Number(a.primary) - Number(b.primary)) // make primary wallet first in the grid

    return (
        <Box sx={{ mt: 1 }}>
            <Typography
                variant="h6"
                sx={{ fontWeight: 'bold', textTransform: 'uppercase', mb: 2 }}
            >
                Wallets
            </Typography>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 6,
                }}
            >
                {wallets.map((w) => (
                    <WalletPreview
                        key={w.partyId}
                        partyId={w.partyId}
                        walletName={w.hint}
                        isPrimary={w.primary}
                    />
                ))}
            </Box>
        </Box>
    )
}
