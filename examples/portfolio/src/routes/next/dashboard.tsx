import { useMemo, type ReactNode } from 'react'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import DashboardIcon from '@mui/icons-material/Dashboard'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import {
    Box,
    Divider,
    Drawer,
    Typography,
    type SxProps,
    type Theme,
} from '@mui/material'
import {
    createFileRoute,
    Link,
    Navigate,
    Outlet,
    useLocation,
    useMatchRoute,
    type LinkComponentProps,
} from '@tanstack/react-router'
import type { RegisteredRouter } from '@tanstack/router-core'
import { PillButton } from '@components/ui/PillButton'
import { useConnection } from '@contexts/ConnectionContext'
import { useAccounts } from '@hooks/useAccounts'

const SIDEBAR_WIDTH = (theme: Theme) =>
    `clamp(${theme.spacing(25)}, 18vw, ${theme.spacing(35)})`

export const Route = createFileRoute('/next/dashboard')({
    component: RouteComponent,
})

function RouteComponent() {
    const accounts = useAccounts()
    const { initialized, status, open, disconnect } = useConnection()
    const pathname = useLocation({ select: (location) => location.pathname })
    const matchRoute = useMatchRoute()
    const wallets = useMemo(
        () =>
            accounts.slice().sort(
                // make sure primary account is first
                (a, b) =>
                    Number(b.primary) - Number(a.primary) ||
                    a.hint.localeCompare(b.hint)
            ),
        [accounts]
    )

    if (!initialized) {
        return null
    }

    if (!status?.connection?.isConnected) {
        return <Navigate to="/next/connect" replace />
    }

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Drawer
                variant="permanent"
                sx={{
                    width: SIDEBAR_WIDTH,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: SIDEBAR_WIDTH,
                        boxSizing: 'border-box',
                        bgcolor: 'portfolio.sidebar.background',
                        borderColor: 'divider',
                        color: 'text.primary',
                    },
                }}
            >
                <Box
                    component="nav"
                    aria-label="Portfolio navigation"
                    sx={{
                        display: 'flex',
                        minHeight: '100%',
                        flexDirection: 'column',
                        px: 1,
                        py: 3,
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            px: 3,
                            mb: 2,
                        }}
                    >
                        <Typography
                            variant="h6"
                            component="div"
                            sx={{ fontWeight: 600, letterSpacing: 0.2 }}
                        >
                            Splice Portfolio
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'grid', gap: 0.5 }}>
                        <SidebarLink
                            to="/next/dashboard"
                            active={Boolean(
                                matchRoute({
                                    to: '/next/dashboard',
                                })
                            )}
                            icon={<DashboardIcon fontSize="small" />}
                        >
                            Dashboard
                        </SidebarLink>
                        <SidebarLink
                            to="/next/dashboard/offers"
                            active={pathname === '/next/dashboard/offers'}
                            icon={<NotificationsNoneIcon fontSize="small" />}
                        >
                            Offers
                        </SidebarLink>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box
                        sx={{
                            flex: 1,
                            minHeight: 0,
                            display: 'grid',
                            alignContent: 'start',
                            gap: 0.5,
                            overflowY: 'auto',
                            pr: 0.5,
                            mb: 2,
                            scrollbarWidth: 'thin',
                        }}
                    >
                        {wallets.map((wallet) => (
                            <SidebarLink
                                key={wallet.partyId}
                                to="/next/dashboard/wallet/$walletId"
                                params={{ walletId: wallet.partyId }}
                                active={Boolean(
                                    matchRoute({
                                        to: '/next/dashboard/wallet/$walletId',
                                        params: { walletId: wallet.partyId },
                                    })
                                )}
                                icon={
                                    <AccountBalanceWalletIcon fontSize="small" />
                                }
                            >
                                {wallet.hint}
                            </SidebarLink>
                        ))}
                    </Box>

                    <Box sx={{ display: 'grid', gap: 1.5, pb: 4 }}>
                        <PillButton type="button" fullWidth onClick={open}>
                            Wallet Gateway
                        </PillButton>
                        <PillButton
                            type="button"
                            tone="danger"
                            fullWidth
                            onClick={disconnect}
                        >
                            Disconnect
                        </PillButton>
                    </Box>
                </Box>
            </Drawer>

            <Box
                component="main"
                sx={{
                    flex: 1,
                    minWidth: 0,
                    bgcolor: 'background.default',
                }}
            >
                <Outlet />
            </Box>
        </Box>
    )
}

type SidebarLinkProps = {
    active: boolean
    icon: ReactNode
    children: ReactNode
} & LinkComponentProps<'a', RegisteredRouter>

function SidebarLink({
    active,
    icon,
    children,
    ...linkProps
}: SidebarLinkProps) {
    return (
        <Link
            {...linkProps}
            aria-current={active ? 'page' : undefined}
            style={{ color: 'inherit', textDecoration: 'none' }}
        >
            <Box sx={sidebarLinkSx(active)}>
                <Box
                    aria-hidden="true"
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        color: 'text.secondary',
                    }}
                >
                    {icon}
                </Box>
                <Typography
                    component="span"
                    variant="body2"
                    sx={{
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {children}
                </Typography>
            </Box>
        </Link>
    )
}

const sidebarLinkSx = (active: boolean): SxProps<Theme> => ({
    display: 'grid',
    gridTemplateColumns: '18px minmax(0, 1fr)',
    alignItems: 'center',
    gap: 1,
    minHeight: 34,
    px: 3,
    color: 'text.primary',
    bgcolor: active ? 'action.hover' : 'transparent',
    borderRadius: 1,
    transition: (theme) =>
        theme.transitions.create(['background-color', 'color'], {
            duration: theme.transitions.duration.shortest,
        }),
    '&:hover': {
        bgcolor: 'action.hover',
    },
})
