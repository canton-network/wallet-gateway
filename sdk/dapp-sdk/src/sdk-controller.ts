// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { DappAsyncProvider } from '@canton-network/core-provider-dapp'
import buildController from './dapp-api/rpc-gen'
import {
    ConnectResult,
    LedgerApiParams,
    Network,
    PrepareExecuteAndWaitResult,
    PrepareExecuteParams,
    SignMessageParams,
    SignMessageResult,
    Wallet,
} from './dapp-api/rpc-gen/typings'
import { ErrorCode } from './error'
import { popup } from '@canton-network/core-wallet-ui-components'
import * as dappAsyncAPI from '@canton-network/core-wallet-dapp-remote-rpc-client'
import { WalletEvent } from '@canton-network/core-types'

const withTimeout = (
    reject: (reason?: unknown) => void,
    details: string,
    timeoutMs: number = 5 * 60 * 1000 // default to 5 minutes
) =>
    setTimeout(() => {
        console.warn(`SDK: ${details}`)
        reject({
            status: 'error',
            error: ErrorCode.Timeout,
            details,
        })
    }, timeoutMs)

export const dappSDKController = (provider: DappAsyncProvider) =>
    buildController({
        connect: async (): Promise<ConnectResult> => {
            const response = await provider.request({
                method: 'connect',
            })

            popup.open(response.userUrl ?? '')
            const promise = new Promise<ConnectResult>((resolve, reject) => {
                // 5 minutes timeout
                const timeout = withTimeout(
                    reject,
                    'Timeout waiting for connection',
                    5 * 60 * 1000
                )
                provider.on<dappAsyncAPI.StatusEvent>(
                    'statusChanged',
                    (event) => {
                        if (event.connection.isConnected) {
                            clearTimeout(timeout)
                            resolve(event.connection)
                        }
                    }
                )
            })

            return promise
        },
        disconnect: async () => {
            return await provider.request({
                method: 'disconnect',
            })
        },
        isConnected: async () => {
            return await provider.request({
                method: 'isConnected',
            })
        },
        ledgerApi: async (params: LedgerApiParams) =>
            provider.request({
                method: 'ledgerApi',
                params,
            }),
        prepareExecute: async (params: PrepareExecuteParams) => {
            const response = await provider.request({
                method: 'prepareExecute',
                params,
            })

            if (response.userUrl) popup.open(response.userUrl)

            return null
        },
        prepareExecuteAndWait: async (
            params: PrepareExecuteParams
        ): Promise<PrepareExecuteAndWaitResult> => {
            const commandId = params.commandId ?? crypto.randomUUID()
            const response = await provider.request({
                method: 'prepareExecute',
                params: {
                    ...params,
                    commandId,
                },
            })

            if (response.userUrl) popup.open(response.userUrl)

            const promise = new Promise<PrepareExecuteAndWaitResult>(
                (resolve, reject) => {
                    const timeout = withTimeout(
                        reject,
                        'Timed out waiting for transaction approval'
                    )

                    // TODO: ensure that the event corresponds to the correct transaction
                    const listener = (event: dappAsyncAPI.TxChangedEvent) => {
                        if (event.commandId !== commandId) return
                        if (event.status === 'failed') {
                            provider.removeListener('txChanged', listener)
                            clearTimeout(timeout)
                            reject({
                                status: 'error',
                                error: ErrorCode.TransactionFailed,
                                details: `Transaction with commandId ${event.commandId} failed to execute.`,
                            })
                        }
                        if (event.status === 'executed') {
                            provider.removeListener('txChanged', listener)
                            clearTimeout(timeout)
                            resolve({
                                tx: event,
                            })
                        }
                    }

                    provider.on<dappAsyncAPI.TxChangedEvent>(
                        'txChanged',
                        listener
                    )
                }
            )

            return promise
        },
        status: async () => {
            return provider.request({ method: 'status' })
        },
        listAccounts: async () =>
            provider.request({
                method: 'listAccounts',
            }),
        accountsChanged: async () => {
            throw new Error('Only for events.')
        },
        txChanged: async () => {
            throw new Error('Only for events.')
        },
        getActiveNetwork: async (): Promise<Network> =>
            provider.request({
                method: 'getActiveNetwork',
            }),
        signMessage: async (
            params: SignMessageParams
        ): Promise<SignMessageResult> => {
            const response = await provider.request({
                method: 'signMessage',
                params,
            })

            // Remote gateways return a userUrl for interactive confirmation.
            // Non-remote providers may return the signature directly.
            if (
                typeof (response as unknown as { userUrl?: unknown })
                    .userUrl === 'string'
            ) {
                const { userUrl } = response as unknown as { userUrl: string }
                popup.open(userUrl)

                const messageId = new URL(userUrl).searchParams.get('messageId')
                if (!messageId) {
                    throw new Error(
                        'Remote signMessage userUrl is missing messageId query param'
                    )
                }

                return await new Promise<SignMessageResult>(
                    (resolve, reject) => {
                        const timeout = withTimeout(
                            reject,
                            'Timed out waiting for message signing approval'
                        )

                        const listener = (event: MessageEvent) => {
                            if (
                                event.data?.type !==
                                WalletEvent.SPLICE_WALLET_SIGN_MESSAGE_RESULT
                            ) {
                                return
                            }
                            if (event.data?.messageId !== messageId) {
                                return
                            }

                            window.removeEventListener('message', listener)
                            clearTimeout(timeout)

                            if (event.data.status !== 'signed') {
                                reject({
                                    status: 'error',
                                    error: ErrorCode.TransactionFailed,
                                    details:
                                        event.data.status === 'rejected'
                                            ? 'Message signing was rejected.'
                                            : 'Message signing failed.',
                                })
                                return
                            }

                            if (!event.data.signature) {
                                reject({
                                    status: 'error',
                                    error: ErrorCode.TransactionFailed,
                                    details:
                                        'Missing signature in signMessage result.',
                                })
                                return
                            }

                            resolve({
                                signature: event.data.signature,
                            })
                        }

                        window.addEventListener('message', listener)
                    }
                )
            }

            return response as unknown as SignMessageResult
        },
        getPrimaryAccount: async (): Promise<Wallet> =>
            provider.request({
                method: 'getPrimaryAccount',
            }),
    })
