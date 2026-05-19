// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from 'react'
import * as sdk from '@canton-network/dapp-sdk'
import { WalletConnectAdapter } from '@canton-network/dapp-sdk'
import { handleErrorToast } from '@canton-network/core-wallet-ui-components'

const wcProjectId = import.meta.env.VITE_WC_PROJECT_ID as string
const wcAdapter = wcProjectId
    ? WalletConnectAdapter.create({
          projectId: wcProjectId,
          signInWithCanton: {
              domain: 'http://localhost:3000',
              uri: 'http://localhost:3000/login',
              version: '1.0.0',
              nonce: '1234567890', // optional, defaults to a unique UUID
          },
          onSignInWithCanton: (result) => {
              console.log('onSignInWithCanton:', result)
          },
      })
    : undefined
const additionalAdapters = wcAdapter ? [wcAdapter] : []

/**
 * React hook that manages the connection to the wallet gateway.
 * Uses the dapp-sdk to connect and disconnect, and updates the connection status.
 */
export function useConnect(): {
    connect: () => Promise<void>
    disconnect: () => Promise<void>
    connectResult?: sdk.dappAPI.ConnectResult
} {
    const [connectResult, setConnectResult] =
        useState<sdk.dappAPI.ConnectResult>()

    async function connect() {
        await sdk
            .connect()
            .then(setConnectResult)
            .catch((err) => {
                console.error('Error connecting to wallet:', err)
                handleErrorToast(err)
                throw err
            })
    }

    async function disconnect() {
        try {
            await sdk.disconnect()
        } catch (err) {
            console.warn('Error during disconnect:', err)
        }
        setConnectResult(undefined)
    }

    useEffect(() => {
        sdk.init({ additionalAdapters })
            .then(() => sdk.status())
            .then((s) => setConnectResult(s.connection))
            .catch(() => {
                setConnectResult(undefined)
            })
    }, [])

    useEffect(() => {
        if (connectResult?.isConnected) {
            console.debug('[use-connect] Adding status changed listener')
            const onStatusChanged = (status: sdk.dappAPI.StatusEvent) => {
                console.debug(
                    '[use-connect] Received status changed event:',
                    status
                )
                setConnectResult(status.connection)
            }

            sdk.onStatusChanged(onStatusChanged)

            return () => {
                console.debug('[use-connect] Removing connect changed listener')
                sdk.removeOnStatusChanged(onStatusChanged)
            }
        }
    }, [connectResult])

    return {
        connect,
        disconnect,
        connectResult,
    }
}
