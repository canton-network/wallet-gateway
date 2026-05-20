import { Outlet, createFileRoute } from '@tanstack/react-router'
import { Container } from '@mui/material'
import { Header } from '../../components/header'
import { NetworkBanner } from '../../components/network-banner'
import { RegistryValidationModal } from '../../components/registry-validation-modal'
import { useRegistryValidation } from '../../hooks/useRegistryValidation'

export const Route = createFileRoute('/_legacy')({
    component: LegacyLayout,
})

function LegacyLayout() {
    const validationStatus = useRegistryValidation()

    return (
        <>
            <NetworkBanner />
            <Container maxWidth="lg">
                <Header />
                <Outlet />
            </Container>

            <RegistryValidationModal validationStatus={validationStatus} />
        </>
    )
}
