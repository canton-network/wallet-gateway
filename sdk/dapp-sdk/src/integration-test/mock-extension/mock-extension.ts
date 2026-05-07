// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

// Mock wallet using postMessage transport for testing CIP-0103 sync API
import {
    CANTON_ANNOUNCE_PROVIDER_EVENT,
    CANTON_REQUEST_PROVIDER_EVENT,
    WalletEvent,
    isSpliceMessageEvent,
    type SpliceMessage,
} from '@canton-network/core-types'
import type {
    ConnectResult,
    ListAccountsResult,
    PrepareExecuteAndWaitResult,
    StatusEvent,
    Wallet,
} from '@canton-network/core-wallet-dapp-rpc-client'

export const MOCK_EXTENSION_TARGET = 'mock-splice-extension'
export const MOCK_EXTENSION_PROVIDER_ID =
    `browser:ext:${MOCK_EXTENSION_TARGET}` as const
export const MOCK_EXTENSION_NAME = 'Mock Splice Extension'
export const MOCK_EXTENSION_NETWORK_ID = 'extension-network'
export const MOCK_EXTENSION_TOKEN = 'integration-extension-token'
export const MOCK_EXTENSION_USER_ID = 'extension-user'

const primaryWallet: Wallet = {
    primary: true,
    partyId: 'SyncParty::1',
    status: 'allocated',
    hint: 'SyncParty',
    publicKey: 'pk',
    namespace: 'ns',
    networkId: MOCK_EXTENSION_NETWORK_ID,
    signingProviderId: 'sp',
}

export function extensionConnectResult(): ConnectResult {
    return {
        isConnected: true,
        reason: 'OK',
        isNetworkConnected: true,
        networkReason: 'OK',
    }
}

export function extensionStatusEvent(): StatusEvent {
    return {
        provider: {
            id: MOCK_EXTENSION_PROVIDER_ID,
            providerType: 'browser',
        },
        connection: extensionConnectResult(),
        network: {
            networkId: MOCK_EXTENSION_NETWORK_ID,
            ledgerApi: 'https://ledger.extension.test',
            accessToken: MOCK_EXTENSION_TOKEN,
        },
        session: {
            accessToken: MOCK_EXTENSION_TOKEN,
            userId: MOCK_EXTENSION_USER_ID,
        },
    }
}

export function extensionPrepareExecuteAndWaitResult(
    commandId: string
): PrepareExecuteAndWaitResult {
    return {
        tx: {
            status: 'executed',
            commandId,
            payload: {
                updateId: 'mock-update-id',
                completionOffset: 0,
            },
        },
    }
}

function handleMockRequest(
    method: string,
    params: unknown
): { result: unknown } | { error: { code: number; message: string } } {
    switch (method) {
        case 'connect':
            return { result: extensionConnectResult() }
        case 'status':
            return { result: extensionStatusEvent() }
        case 'disconnect':
            return { result: null }
        case 'listAccounts':
            return { result: [primaryWallet] satisfies ListAccountsResult }
        case 'prepareExecute':
            return { result: null }
        case 'prepareExecuteAndWait': {
            const commandId =
                (params as { commandId?: string } | undefined)?.commandId ??
                'extension-generated-cmd-id'
            return {
                result: extensionPrepareExecuteAndWaitResult(commandId),
            }
        }
        case 'getPrimaryAccount':
            return { result: primaryWallet }
        case 'getActiveNetwork':
            return {
                result: {
                    networkId: MOCK_EXTENSION_NETWORK_ID,
                    ledgerApi: 'https://ledger.extension.test',
                    accessToken: MOCK_EXTENSION_TOKEN,
                },
            }
        case 'signMessage':
            return { result: { signature: 'sync-integration-signature' } }
        case 'ledgerApi': {
            const resource = (params as { resource?: string })?.resource
            return { result: { mocked: true, resource } }
        }
        default:
            return {
                error: { code: -32601, message: `unhandled method: ${method}` },
            }
    }
}

export type MockExtensionOptions = {
    target?: string | undefined
}

export function startMockExtension(
    options: MockExtensionOptions = {}
): () => void {
    const target = options.target ?? MOCK_EXTENSION_TARGET

    const sendResponse = async (request: {
        id?: string | number | null | undefined
        method: string
        params?: unknown
    }): Promise<void> => {
        const res = handleMockRequest(request.method, request.params)
        // prepareExecuteAndWait blocks until the wallet emits a response
        // 1s gap lets tests assert the returned promise stays pending until wallet finishes it
        if (request.method === 'prepareExecuteAndWait') {
            await new Promise((resolve) => setTimeout(resolve, 1000))
        }
        const message: SpliceMessage = {
            type: WalletEvent.SPLICE_WALLET_RESPONSE,
            response: {
                jsonrpc: '2.0',
                id: request.id,
                ...res,
            },
        }
        window.postMessage(message, '*')
    }

    const messageHandler = (event: MessageEvent): void => {
        if (!isSpliceMessageEvent(event)) return
        const data = event.data

        // Extension-Wallet readiness handshake
        if (data.type === WalletEvent.SPLICE_WALLET_EXT_READY) {
            if (data.target && data.target !== target) return
            const ack: SpliceMessage = {
                type: WalletEvent.SPLICE_WALLET_EXT_ACK,
                target,
            }
            window.postMessage(ack, '*')
            return
        }

        // Send SPLICE_WALLET_RESPONSE message based on method
        if (data.type === WalletEvent.SPLICE_WALLET_REQUEST) {
            if (data.target && data.target !== target) return
            void sendResponse(data.request)
        }
    }

    // Announce extension to discovery client
    const announceHandler = (): void => {
        window.dispatchEvent(
            new CustomEvent(CANTON_ANNOUNCE_PROVIDER_EVENT, {
                detail: {
                    id: target,
                    name: MOCK_EXTENSION_NAME,
                    target,
                },
            })
        )
    }

    window.addEventListener('message', messageHandler)
    window.addEventListener(CANTON_REQUEST_PROVIDER_EVENT, announceHandler)

    // Return clear listeners callback
    return () => {
        window.removeEventListener('message', messageHandler)
        window.removeEventListener(
            CANTON_REQUEST_PROVIDER_EVENT,
            announceHandler
        )
    }
}
