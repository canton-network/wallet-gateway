import {
    Box,
    Button,
    Card,
    CardContent,
    Divider,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { CopyableIdentifier } from './copyable-identifier'
import {
    useRegistryService,
    useRegistryUrls,
} from '../contexts/RegistryServiceContext'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { toast } from 'sonner'

interface Registry {
    partyId: string
    registryUrl: string
}

const INSECURE_REGISTRY_URL_WARNING =
    'Registry responses can be spoofed by network attackers. Use HTTPS.'
const registryUrlSchema = z.url({
    message: 'Must be a valid HTTP or HTTPS URL',
    protocol: /^https?$/,
})

const isInsecureRegistryUrl = (value: string) => {
    const result = registryUrlSchema.safeParse(value)
    return result.success && new URL(result.data).protocol === 'http:'
}

const registryFormSchema = z.object({
    partyId: z.string().min(1, 'Party ID is required'),
    registryUrl: registryUrlSchema,
})

type RegistryFormData = z.infer<typeof registryFormSchema>

export function RegistrySettings() {
    const registryService = useRegistryService()
    const registryUrls = useRegistryUrls()
    const registries = Array.from(registryUrls.entries()).map(
        ([partyId, registryUrl]) =>
            ({
                partyId,
                registryUrl,
            }) as Registry
    )

    const form = useForm({
        defaultValues: {
            partyId: '',
            registryUrl: '',
        } as RegistryFormData,

        onSubmit: async ({ value: formData }) => {
            // TODO: this is temporary for easy developemnt
            const partyId =
                formData.partyId.trim() === '' ? undefined : formData.partyId
            registryService.setRegistryUrl(partyId, formData.registryUrl)
            if (isInsecureRegistryUrl(formData.registryUrl)) {
                toast.warning(INSECURE_REGISTRY_URL_WARNING)
            } else {
                toast.success('Registry URL set')
            }
            form.reset()
        },
        validators: {
            onChange: registryFormSchema,
        },
    })

    const handleDeleteRegistry = (partyId: string) => {
        registryService.deleteRegistryUrl(partyId)
        toast.success('Registry URL deleted')
    }

    return (
        <Card sx={{ mb: 3 }}>
            <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                    Registries
                </Typography>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 3 }}
                >
                    The API URLs provided by the party managing the token
                    standard compliant instruments
                </Typography>

                <Box sx={{ mb: 3 }}>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            form.handleSubmit()
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 2,
                                mb: 2,
                            }}
                        >
                            <form.Field name="partyId">
                                {(field) => (
                                    <TextField
                                        label="Party ID"
                                        value={field.state.value}
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        onBlur={field.handleBlur}
                                        error={
                                            field.state.meta.isTouched &&
                                            field.state.meta.errors.length > 0
                                        }
                                        helperText={
                                            field.state.meta.isTouched &&
                                            field.state.meta.errors[0]?.message
                                        }
                                        fullWidth
                                        size="small"
                                    />
                                )}
                            </form.Field>
                            <form.Field name="registryUrl">
                                {(field) => {
                                    const hasError =
                                        field.state.meta.isTouched &&
                                        field.state.meta.errors.length > 0
                                    const showInsecureWarning =
                                        !hasError &&
                                        isInsecureRegistryUrl(field.state.value)

                                    return (
                                        <TextField
                                            label="Registry URL"
                                            value={field.state.value}
                                            onChange={(e) =>
                                                field.handleChange(
                                                    e.target.value
                                                )
                                            }
                                            onBlur={field.handleBlur}
                                            error={hasError}
                                            helperText={
                                                hasError
                                                    ? field.state.meta.errors[0]
                                                          ?.message
                                                    : showInsecureWarning
                                                      ? INSECURE_REGISTRY_URL_WARNING
                                                      : undefined
                                            }
                                            slotProps={{
                                                formHelperText: {
                                                    sx: showInsecureWarning
                                                        ? {
                                                              color: 'warning.main',
                                                          }
                                                        : undefined,
                                                },
                                            }}
                                            fullWidth
                                            size="small"
                                        />
                                    )
                                }}
                            </form.Field>
                            <form.Subscribe
                                selector={(state) => ({
                                    canSubmit: state.canSubmit,
                                    isSubmitting: state.isSubmitting,
                                })}
                            >
                                {({ canSubmit, isSubmitting }) => (
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        disabled={!canSubmit || isSubmitting}
                                        sx={{ minHeight: 40 }}
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Add'}
                                    </Button>
                                )}
                            </form.Subscribe>
                        </Box>
                    </form>
                </Box>

                <Divider sx={{ mb: 3 }} />

                <TableContainer
                    component={Paper}
                    variant="outlined"
                    sx={{ borderRadius: 1 }}
                >
                    <Table size="medium">
                        <TableHead>
                            <TableRow sx={{ backgroundColor: 'action.hover' }}>
                                <TableCell
                                    sx={{
                                        py: 2,
                                        px: 3,
                                        fontWeight: 'medium',
                                    }}
                                >
                                    Party ID
                                </TableCell>
                                <TableCell
                                    sx={{
                                        py: 2,
                                        px: 3,
                                        fontWeight: 'medium',
                                    }}
                                >
                                    Registry URL
                                </TableCell>
                                <TableCell
                                    sx={{
                                        py: 2,
                                        px: 3,
                                        fontWeight: 'medium',
                                    }}
                                >
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {registries.length > 0 ? (
                                registries.map((registry) => (
                                    <TableRow
                                        key={registry.partyId}
                                        sx={{
                                            '&:hover': {
                                                backgroundColor: 'action.hover',
                                            },
                                        }}
                                    >
                                        <TableCell sx={{ py: 2.5, px: 3 }}>
                                            <CopyableIdentifier
                                                value={registry.partyId}
                                                maxLength={30}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ py: 2.5, px: 3 }}>
                                            {registry.registryUrl}
                                        </TableCell>
                                        <TableCell sx={{ py: 2.5, px: 3 }}>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    gap: 1,
                                                }}
                                            >
                                                <IconButton
                                                    size="small"
                                                    onClick={() =>
                                                        handleDeleteRegistry(
                                                            registry.partyId
                                                        )
                                                    }
                                                    color="error"
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={3}
                                        sx={{ py: 4, px: 3 }}
                                    >
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography
                                                variant="body1"
                                                color="text.secondary"
                                            >
                                                No registries configured
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </CardContent>
        </Card>
    )
}
