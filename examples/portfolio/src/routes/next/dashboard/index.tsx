import { PillButton } from '@components/ui/PillButton'
import { Alert, Box, Typography } from '@mui/material'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/next/dashboard/')({
    component: RouteComponent,
})

function RouteComponent() {
    return (
        <Box sx={{ px: 5.5, py: 7.5 }}>
            <Box
                sx={{
                    mb: 5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    // gap: 3,
                }}
            >
                <Typography variant="h4" component="h1">
                    Dashboard
                </Typography>

                <PillButton>Transfer</PillButton>
            </Box>

            <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
                All Assets
            </Typography>
            <Alert severity="info">
                {/* <AlertTitle>Info</AlertTitle> */}
                There are currently no assets across your wallets.
            </Alert>
        </Box>
    )
}
