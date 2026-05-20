// Copyright (c) 2025 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import * as sdk from '@canton-network/dapp-sdk'
import { WalletConnectAdapter } from '@canton-network/dapp-sdk'
import { queryKeys } from '../hooks/query-keys'
import { ConnectionContext } from './ConnectionContext'

const wcProjectId = import.meta.env.VITE_WC_PROJECT_ID as string
const wcAdapter = wcProjectId
    ? WalletConnectAdapter.create({ projectId: wcProjectId })
    : undefined
const additionalAdapters = wcAdapter ? [wcAdapter] : []

export const ConnectionProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const queryClient = useQueryClient()
    const [initialized, setInitialized] = useState(false)
    const [connectionStatus, setConnectionStatus] = useState<
        sdk.dappAPI.StatusEvent | undefined
    >()
    const [accounts, setAccounts] = useState<sdk.dappAPI.Wallet[]>([])
    const [error, setError] = useState<string | undefined>()

    const connect = useCallback(() => {
        sdk.connect()
            .then(() => sdk.status())
            .then((status) => {
                setConnectionStatus(status)
                setAccounts([])
            })
            .catch((err) => {
                setConnectionStatus(undefined)
                setError(err.details)
                setAccounts([])
            })
    }, [])

    const open = useCallback(() => sdk.open(), [])

    const doDisconnect = useCallback(() => {
        setConnectionStatus(undefined)
        setAccounts([])
        setError(undefined)
        sdk.disconnect().catch(() => {})
    }, [])

    const disconnect = useCallback(() => {
        doDisconnect()
    }, [doDisconnect])

    useEffect(() => {
        let active = true

        sdk.init({ additionalAdapters })
            .then(() => sdk.status())
            .then((status) => {
                if (active) {
                    setConnectionStatus(status)
                    setError(undefined)
                }
            })
            .catch((reason) => {
                const message =
                    reason instanceof Error ? reason.message : String(reason)

                if (message.includes('Not connected')) {
                    return
                }

                if (active) {
                    setError(`failed to get status: ${message}`)
                }
            })
            .finally(() => {
                if (active) {
                    setInitialized(true)
                }
            })

        return () => {
            active = false
        }
    }, [])

    // Listen for status changes when connected (re-registers after each connect/disconnect)
    useEffect(() => {
        if (!connectionStatus?.connection?.isConnected) return

        const onStatusChanged = (status: sdk.dappAPI.StatusEvent) => {
            if (!status.connection?.isConnected) {
                doDisconnect()
                return
            }
            setConnectionStatus(status)
        }

        sdk.onStatusChanged(onStatusChanged)

        return () => {
            void sdk.removeOnStatusChanged(onStatusChanged)
        }
    }, [connectionStatus?.connection?.isConnected, doDisconnect])

    // Second effect: request accounts only when connected
    useEffect(() => {
        const provider = window.canton
        if (!provider || !connectionStatus?.connection?.isConnected) return
        provider
            .request({
                method: 'listAccounts',
            })
            .then((wallets) => {
                const requestedAccounts =
                    wallets as sdk.dappAPI.ListAccountsResult
                setAccounts(requestedAccounts)
            })
            .catch((err) => {
                console.error('Error requesting wallets:', err)
                const msg = err instanceof Error ? err.message : String(err)
                setError(msg)
            })

        const messageListener = async (event: sdk.dappAPI.TxChangedEvent) => {
            console.log('incoming event', event)
            if (event.status === 'executed') {
                await queryClient.invalidateQueries({
                    queryKey: queryKeys.listPendingTransfers.all,
                })
                await queryClient.invalidateQueries({
                    queryKey: queryKeys.getTransactionHistory.all,
                })
            }
        }
        const onAccountsChanged = (wallets: sdk.dappAPI.AccountsChangedEvent) =>
            setAccounts(wallets)
        provider.on<sdk.dappAPI.TxChangedEvent>('txChanged', messageListener)
        provider.on<sdk.dappAPI.AccountsChangedEvent>(
            'accountsChanged',
            onAccountsChanged
        )
        return () => {
            provider.removeListener('txChanged', messageListener)
            provider.removeListener('accountsChanged', onAccountsChanged)
        }
    }, [connectionStatus?.connection?.isConnected, queryClient])

    return (
        <ConnectionContext.Provider
            value={{
                initialized,
                status: connectionStatus,
                accounts,
                error,
                connect,
                open,
                disconnect,
            }}
        >
            {children}
        </ConnectionContext.Provider>
    )
}
