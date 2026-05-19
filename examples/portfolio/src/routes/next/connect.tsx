import { Box, Typography } from '@mui/material'
import { createFileRoute, Navigate } from '@tanstack/react-router'
import { PillButton } from '@components/ui/PillButton'
import { useConnection } from '@contexts/ConnectionContext'

export const Route = createFileRoute('/next/connect')({
    component: RouteComponent,
})

function RouteComponent() {
    const { connect, status } = useConnection()

    if (status?.connection?.isConnected) {
        return <Navigate to="/" />
    }

    return (
        <Box
            sx={{
                position: 'fixed',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                // bgcolor: 'background.paper',
                px: 2,
            }}
        >
            <Typography variant="h4" sx={{ color: 'text.primary' }}>
                Welcome to
            </Typography>
            <Typography
                variant="h2"
                component="h1"
                sx={{
                    color: 'text.primary',
                    fontWeight: 700,
                    textAlign: 'center',
                }}
            >
                Splice Portfolio
            </Typography>
            <PillButton
                onClick={() => connect()}
                size="large"
                sx={{ mt: 2, px: 4, py: 2 }}
            >
                Connect Wallet
            </PillButton>
        </Box>
    )
}
