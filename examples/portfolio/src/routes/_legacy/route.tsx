import { Outlet, createFileRoute } from '@tanstack/react-router'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
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
                <TanStackDevtools
                    plugins={[
                        {
                            name: 'TanStack Query',
                            render: <ReactQueryDevtoolsPanel />,
                            defaultOpen: true,
                        },
                        {
                            name: 'TanStack Router',
                            render: <TanStackRouterDevtoolsPanel />,
                            defaultOpen: false,
                        },
                    ]}
                />
            </Container>

            <RegistryValidationModal validationStatus={validationStatus} />
        </>
    )
}
