import { PillButton } from '@components/ui/PillButton'
import { Box, Typography } from '@mui/material'
import { createFileRoute } from '@tanstack/react-router'
import { AllAssetsContent } from '@components/dashboard/all-assets-content'
import { useAllAccountAssets } from '@hooks/useAllAccountAssets'

export const Route = createFileRoute('/next/dashboard/')({
    component: RouteComponent,
})

function RouteComponent() {
    const allAccountAssets = useAllAccountAssets()

    return (
        <Box sx={{ px: 5.5, py: 7.5 }}>
            <Box
                sx={{
                    mb: 5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Typography variant="h4" component="h1">
                    Dashboard
                </Typography>

                <PillButton>Transfer</PillButton>
            </Box>

            <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
                All assets
            </Typography>

            <AllAssetsContent {...allAccountAssets} />
        </Box>
    )
}
