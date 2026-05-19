import { useState } from 'react'
import {
    AppBar,
    Box,
    Button,
    IconButton,
    Menu,
    MenuItem,
    Link as MuiLink,
    Toolbar,
    Typography,
} from '@mui/material'
import { createLink } from '@tanstack/react-router'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'
import NotificationsIcon from '@mui/icons-material/Notifications'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import { useConnection } from '../contexts/ConnectionContext'
import { useTheme } from '../contexts/theme-context'
import { TransferDialogButton } from './transfer-dialog-button'
import { TransferDialog } from './transfer-dialog'

const RouterLink = createLink(MuiLink)

export const Header = () => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const [transferDialogOpen, setTransferDialogOpen] = useState(false)
    const menuOpen = Boolean(anchorEl)
    const { isDarkMode, toggleTheme } = useTheme()
    const { status, connect, open: openGateway, disconnect } = useConnection()
    const connected = status?.connection?.isConnected

    const action = connected ? disconnect : connect

    const handleTransferClick = () => {
        setAnchorEl(null)
        setTransferDialogOpen(true)
    }

    return (
        <AppBar
            position="static"
            elevation={0}
            sx={{
                backgroundColor: 'inherit',
                color: 'text.primary',
            }}
        >
            <Toolbar
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    '&.MuiToolbar-root': {
                        px: 0,
                    },
                }}
            >
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 600,
                        textDecoration: 'none',
                    }}
                >
                    <RouterLink
                        to="/"
                        sx={{ textDecoration: 'none', color: 'inherit', ml: 0 }}
                    >
                        Splice Portfolio
                    </RouterLink>
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton
                        onClick={toggleTheme}
                        size="small"
                        sx={{
                            color: 'text.secondary',
                        }}
                    >
                        {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                    </IconButton>

                    <Button
                        variant="contained"
                        sx={{
                            textTransform: 'none',
                        }}
                        onClick={() => openGateway()}
                    >
                        Gateway
                    </Button>

                    {!connected && (
                        <Button
                            variant="contained"
                            sx={{
                                textTransform: 'none',
                            }}
                            onClick={() => action()}
                        >
                            {connected ? 'Disconnect' : 'Connect'}
                        </Button>
                    )}

                    <IconButton
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                        size="small"
                        sx={{
                            color: 'text.secondary',
                        }}
                    >
                        <MoreVertIcon />
                    </IconButton>

                    <Menu
                        anchorEl={anchorEl}
                        open={menuOpen}
                        onClose={() => setAnchorEl(null)}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'right',
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        slotProps={{
                            paper: {
                                sx: {
                                    mt: 1,
                                    minWidth: 180,
                                },
                            },
                        }}
                    >
                        {connected && (
                            <TransferDialogButton
                                onClick={handleTransferClick}
                            />
                        )}

                        <MenuItem
                            component={RouterLink}
                            to="/notifications"
                            sx={{ py: 1.5 }}
                        >
                            <NotificationsIcon sx={{ mr: 2, fontSize: 20 }} />
                            Notifications
                        </MenuItem>

                        <MenuItem
                            component={RouterLink}
                            to="/settings"
                            sx={{ py: 1.5 }}
                        >
                            <SettingsIcon sx={{ mr: 2, fontSize: 20 }} />
                            Settings
                        </MenuItem>

                        {connected && (
                            <MenuItem sx={{ py: 1.5 }} onClick={() => action()}>
                                <LogoutIcon sx={{ mr: 2, fontSize: 20 }} />
                                Disconnect
                            </MenuItem>
                        )}
                    </Menu>
                </Box>
            </Toolbar>

            {transferDialogOpen && (
                <TransferDialog
                    open={transferDialogOpen}
                    onClose={() => setTransferDialogOpen(false)}
                />
            )}
        </AppBar>
    )
}
