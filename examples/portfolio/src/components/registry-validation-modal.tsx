// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import {
    Dialog,
    DialogContent,
    DialogActions,
    Typography,
    Button,
    Box,
    Link as MuiLink,
} from '@mui/material'
import { createLink, useRouterState } from '@tanstack/react-router'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import type { RegistryValidationStatus } from '../hooks/useRegistryValidation'

const RouterLink = createLink(MuiLink)

interface RegistryValidationModalProps {
    validationStatus: RegistryValidationStatus
}

export function RegistryValidationModal({
    validationStatus,
}: RegistryValidationModalProps) {
    const routerState = useRouterState()
    const currentPath = routerState.location.pathname

    // TODO: remove this once old components are removed.
    const isOnSkippablePage = ['/settings', '/old'].includes(currentPath)

    const shouldShowModal =
        !isOnSkippablePage &&
        (validationStatus === 'no-registries' ||
            validationStatus === 'all-unreachable')

    if (!shouldShowModal) {
        return null
    }

    const isNoRegistries = validationStatus === 'no-registries'

    return (
        <Dialog
            open={true}
            maxWidth="sm"
            fullWidth
            slotProps={{
                backdrop: {
                    onClick: (e) => e.stopPropagation(),
                },
            }}
        >
            <DialogContent
                sx={{
                    backgroundColor: 'grey.900',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 2,
                    }}
                >
                    <WarningAmberIcon color="warning" />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Registry Configuration Required
                    </Typography>
                </Box>
                <Box>
                    {isNoRegistries ? (
                        <>
                            <Typography variant="body1" gutterBottom>
                                No token registries are configured. You need to
                                add at least one registry to use the portfolio.
                            </Typography>
                        </>
                    ) : (
                        <>
                            <Typography variant="body1" gutterBottom>
                                Unable to connect to any configured registries.
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                All configured registries are unreachable.
                                Please check your network connection or update
                                the registry URLs.
                            </Typography>
                        </>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, backgroundColor: 'grey.900' }}>
                <Button
                    component={RouterLink}
                    to="/settings"
                    variant="contained"
                    color="primary"
                >
                    Go to Settings
                </Button>
            </DialogActions>
        </Dialog>
    )
}
