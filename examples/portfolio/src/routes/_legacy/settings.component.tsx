import { Box, Typography } from '@mui/material'
import { RegistrySettings } from '../../components/registry-settings'
import { TapSettings } from '../../components/tap-settings'
import { useIsDevNet } from '../../hooks/useIsDevNet'

export function SettingsPage() {
    const { data: isDevNet } = useIsDevNet()

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Settings
            </Typography>

            <RegistrySettings />
            {isDevNet && <TapSettings />}
        </Box>
    )
}
