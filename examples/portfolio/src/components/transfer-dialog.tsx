// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { useState } from 'react'
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    CircularProgress,
} from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { toast } from 'sonner'
import Decimal from 'decimal.js'
import { usePrimaryAccount } from '../hooks/useAccounts'
import { useCreateTransfer } from '../hooks/useCreateTransfer'
import { InstrumentSelect } from './instrument-select'
import type { InstrumentId } from '@canton-network/core-token-standard'
import { useInstrumentAvailableBalance } from '../hooks/useInstrumentAvailableBalance'

interface TransferFormData {
    instrumentId: InstrumentId | null
    amount: string
    recipient: string
    memo: string
    expiry: Date
}

const instrumentValidator = z
    .object({
        admin: z.string(),
        id: z.string(),
    })
    .nullable()
    .refine((val) => val !== null, 'Please select an instrument')

interface TransferDialogProps {
    initialValues?: TransferFormData
    open: boolean
    onClose: () => void
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000

export const TransferDialog: React.FC<TransferDialogProps> = ({
    initialValues,
    open,
    onClose,
}) => {
    const [defaultInitialValues] = useState<TransferFormData>(() => ({
        instrumentId: null,
        amount: '',
        recipient: '',
        memo: '',
        expiry: new Date(Date.now() + ONE_DAY_MS),
    }))
    const primaryAccount = usePrimaryAccount()
    const primaryParty = primaryAccount?.partyId
    const createTransferMutation = useCreateTransfer()

    const form = useForm({
        defaultValues: initialValues ?? defaultInitialValues,

        onSubmit: async ({ value: formData }) => {
            if (!primaryParty || !formData.instrumentId) {
                return
            }

            createTransferMutation.mutate(
                {
                    sender: primaryParty,
                    receiver: formData.recipient,
                    instrumentId: formData.instrumentId,
                    amount: formData.amount,
                    expiry: formData.expiry,
                    memo: formData.memo?.trim() || undefined,
                },
                {
                    onSuccess: () => {
                        toast.success('Transfer initiated successfully')
                        onClose()
                    },
                    onError: (error) => {
                        toast.error(
                            `Transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                        )
                    },
                }
            )
        },
    })

    const handleClose = () => {
        if (!createTransferMutation.isPending) {
            onClose()
        }
    }

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Make Transfer</DialogTitle>
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    form.handleSubmit()
                }}
            >
                <DialogContent>
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 3,
                            pt: 1,
                        }}
                    >
                        <form.Field
                            name="instrumentId"
                            validators={{
                                onChange: instrumentValidator,
                            }}
                        >
                            {(field) => (
                                <InstrumentSelect
                                    partyId={primaryParty}
                                    value={field.state.value}
                                    onChange={(instrument) =>
                                        field.handleChange(instrument)
                                    }
                                    disabled={createTransferMutation.isPending}
                                    error={
                                        field.state.meta.isTouched &&
                                        field.state.meta.errors.length > 0
                                    }
                                    helperText={
                                        field.state.meta.isTouched
                                            ? field.state.meta.errors[0]
                                                  ?.message
                                            : undefined
                                    }
                                />
                            )}
                        </form.Field>

                        <form.Subscribe
                            selector={(state) => state.values.instrumentId}
                        >
                            {(selectedInstrument) => (
                                <AmountField
                                    form={form}
                                    primaryParty={primaryParty}
                                    selectedInstrument={selectedInstrument}
                                    disabled={createTransferMutation.isPending}
                                />
                            )}
                        </form.Subscribe>

                        <form.Field name="recipient">
                            {(field) => (
                                <TextField
                                    label="Recipient"
                                    value={field.state.value}
                                    onChange={(e) =>
                                        field.handleChange(e.target.value)
                                    }
                                    onBlur={field.handleBlur}
                                    disabled={createTransferMutation.isPending}
                                    fullWidth
                                />
                            )}
                        </form.Field>

                        <form.Field name="expiry">
                            {(field) => (
                                <DateTimePicker
                                    label="Expiry"
                                    value={field.state.value}
                                    onChange={(d) => d && field.handleChange(d)}
                                    disabled={createTransferMutation.isPending}
                                />
                            )}
                        </form.Field>

                        <form.Field name="memo">
                            {(field) => (
                                <TextField
                                    label="Message (optional)"
                                    value={field.state.value}
                                    onChange={(e) =>
                                        field.handleChange(e.target.value)
                                    }
                                    disabled={createTransferMutation.isPending}
                                    multiline
                                    rows={2}
                                    fullWidth
                                />
                            )}
                        </form.Field>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button
                        onClick={handleClose}
                        disabled={createTransferMutation.isPending}
                        variant="outlined"
                        color="inherit"
                    >
                        Cancel
                    </Button>
                    <form.Subscribe
                        selector={(state) => ({
                            canSubmit: state.canSubmit,
                            isSubmitting: state.isSubmitting,
                        })}
                    >
                        {({ canSubmit, isSubmitting }) => (
                            <Button
                                type="submit"
                                disabled={
                                    !canSubmit ||
                                    isSubmitting ||
                                    createTransferMutation.isPending ||
                                    !primaryParty
                                }
                                variant="contained"
                                sx={{ minWidth: 100 }}
                            >
                                {createTransferMutation.isPending ? (
                                    <CircularProgress
                                        size={20}
                                        color="inherit"
                                    />
                                ) : (
                                    'Transfer'
                                )}
                            </Button>
                        )}
                    </form.Subscribe>
                </DialogActions>
            </form>
        </Dialog>
    )
}

interface AmountFieldProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form: any
    primaryParty: string | undefined
    selectedInstrument: InstrumentId | null
    disabled: boolean
}

const AmountField: React.FC<AmountFieldProps> = ({
    form,
    primaryParty,
    selectedInstrument,
    disabled,
}) => {
    const availableHolding = useInstrumentAvailableBalance(
        primaryParty,
        selectedInstrument
    )
    const availableBalance = availableHolding?.availableAmount ?? '0'

    const amountValidator = z
        .string()
        .min(1, 'Amount is required')
        .refine((val) => {
            try {
                const num = new Decimal(val)
                return num.isPositive()
            } catch {
                return false
            }
        }, 'Amount must be a positive number')
        .refine((val) => {
            if (!selectedInstrument) return true
            try {
                const requested = new Decimal(val || '0')
                const available = new Decimal(availableBalance)
                return requested.lte(available)
            } catch {
                return false
            }
        }, `Amount exceeds available balance of ${availableBalance}`)

    return (
        <form.Field
            name="amount"
            validators={{
                onChange: amountValidator,
            }}
        >
            {(field: {
                state: {
                    value: string
                    meta: {
                        isTouched: boolean
                        errors: Array<{ message?: string }>
                    }
                }
                handleChange: (value: string) => void
                handleBlur: () => void
            }) => (
                <TextField
                    label="Amount"
                    type="number"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    disabled={disabled}
                    error={
                        field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0
                    }
                    helperText={
                        field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0
                            ? field.state.meta.errors[0]?.message
                            : selectedInstrument
                              ? `Available: ${availableBalance}`
                              : ''
                    }
                    slotProps={{
                        htmlInput: {
                            min: 0,
                            step: 'any',
                        },
                    }}
                    fullWidth
                />
            )}
        </form.Field>
    )
}
