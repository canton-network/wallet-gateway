// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import {
    buildController,
    type CreateKeyParams,
    type CreateKeyResult,
    type GetConfigurationResult,
    type GetKeysResult,
    type GetTransactionParams,
    type GetTransactionResult,
    type GetTransactionsParams,
    type GetTransactionsResult,
    PartyMode,
    type SetConfigurationParams,
    type SetConfigurationResult,
    type SigningDriverInterface,
    SigningProvider,
    SignMessageResult,
    type SignTransactionParams,
    type SignTransactionResult,
    type SubscribeTransactionsParams,
    type SubscribeTransactionsResult,
} from '@canton-network/core-signing-lib'
import { AuthContext } from '@canton-network/core-wallet-auth'
import { SigningAPIClient, type CantonCaip2 } from './signing-api-sdk.js'

export { SigningAPIClient, type CantonCaip2 } from './signing-api-sdk.js'

export interface BlockdaemonConfig {
    baseUrl: string
    apiKey: string
    caip2?: CantonCaip2
}

export default class BlockdaemonSigningDriver implements SigningDriverInterface {
    private client: SigningAPIClient

    constructor(config: BlockdaemonConfig) {
        this.client = new SigningAPIClient(config.baseUrl)
        this.client.setConfiguration({
            ApiKey: config.apiKey,
            Caip2: config.caip2,
        })
    }

    public partyMode = PartyMode.EXTERNAL
    public signingProvider = SigningProvider.BLOCKDAEMON

    public controller = (userId: AuthContext['userId'] | undefined) =>
        buildController({
            signTransaction: async (
                params: SignTransactionParams
            ): Promise<SignTransactionResult> => {
                try {
                    if (!params.keyIdentifier.publicKey) {
                        return {
                            error: 'key_not_found',
                            error_description:
                                'The provided key identifier must include a publicKey.',
                        }
                    }
                    const tx = await this.client.signTransaction({
                        tx: params.tx,
                        txHash: params.txHash,
                        keyIdentifier: params.keyIdentifier,
                        ...(params.internalTxId !== undefined && {
                            internalTxId: params.internalTxId,
                        }),
                        userIdentifier: userId,
                    })
                    return {
                        txId: tx.txId,
                        status: tx.status,
                        ...(tx.signature !== undefined && {
                            signature: tx.signature,
                        }),
                        ...(tx.publicKey !== undefined && {
                            publicKey: tx.publicKey,
                        }),
                        ...(tx.metadata !== undefined && {
                            metadata: tx.metadata,
                        }),
                    }
                } catch (error) {
                    return {
                        error: 'signing_error',
                        error_description: (error as Error).message,
                    }
                }
            },

            signMessage: async (): Promise<SignMessageResult> => {
                return {
                    error: 'not_allowed',
                    error_description:
                        'Signing messages is not yet supported with Blockdaemon.',
                }
            },

            getTransaction: async (
                params: GetTransactionParams
            ): Promise<GetTransactionResult> => {
                try {
                    const tx = await this.client.getTransaction({
                        txId: params.txId,
                    })
                    return {
                        txId: tx.txId,
                        status: tx.status,
                        ...(tx.signature !== undefined && {
                            signature: tx.signature,
                        }),
                        ...(tx.publicKey !== undefined && {
                            publicKey: tx.publicKey,
                        }),
                        ...(tx.metadata !== undefined && {
                            metadata: tx.metadata,
                        }),
                    }
                } catch (error) {
                    return {
                        error: 'transaction_not_found',
                        error_description: (error as Error).message,
                    }
                }
            },

            getTransactions: async (
                params: GetTransactionsParams
            ): Promise<GetTransactionsResult> => {
                if (params.publicKeys || params.txIds) {
                    try {
                        const transactions = await this.client.getTransactions({
                            txIds: params.txIds!,
                            publicKeys: params.publicKeys!,
                            userIdentifier: userId,
                        })
                        return {
                            transactions: transactions.map((tx) => ({
                                txId: tx.txId,
                                status: tx.status,
                                ...(tx.signature !== undefined && {
                                    signature: tx.signature,
                                }),
                                ...(tx.publicKey !== undefined && {
                                    publicKey: tx.publicKey,
                                }),
                                ...(tx.metadata !== undefined && {
                                    metadata: tx.metadata,
                                }),
                            })),
                        }
                    } catch (error) {
                        return {
                            error: 'fetch_error',
                            error_description: (error as Error).message,
                        }
                    }
                } else {
                    return {
                        error: 'bad_arguments',
                        error_description:
                            'either public key or txIds must be supplied',
                    }
                }
            },

            getKeys: async (): Promise<GetKeysResult> => {
                try {
                    const keys = await this.client.getKeys()
                    return {
                        keys: keys.map((k) => ({
                            id: k.id,
                            name: k.name,
                            publicKey: k.publicKey,
                            userIdentifier: userId,
                        })),
                    }
                } catch (error) {
                    return {
                        error: 'fetch_error',
                        error_description: (error as Error).message,
                    }
                }
            },

            createKey: async (
                params: CreateKeyParams
            ): Promise<CreateKeyResult> => {
                try {
                    const key = await this.client.createKey({
                        name: params.name,
                        userIdentifier: userId,
                    })
                    return {
                        id: key.id,
                        name: key.name,
                        publicKey: key.publicKey,
                    }
                } catch (error) {
                    return {
                        error: 'create_key_error',
                        error_description: (error as Error).message,
                    }
                }
            },

            getConfiguration: async (): Promise<GetConfigurationResult> => {
                const config = this.client.getConfiguration()
                return {
                    ...config,
                    ApiKey: config.ApiKey ? '***HIDDEN***' : undefined,
                    MasterKey: config.MasterKey ? '***HIDDEN***' : undefined,
                }
            },

            setConfiguration: async (
                params: SetConfigurationParams
            ): Promise<SetConfigurationResult> => {
                this.client.setConfiguration({
                    BaseURL: params['BaseURL'] as string,
                    ApiKey: params['ApiKey'] as string,
                    MasterKey: params['MasterKey'] as string,
                    Caip2: params['Caip2'] as CantonCaip2,
                })
                return params
            },

            subscribeTransactions: async (
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                _params: SubscribeTransactionsParams
            ): Promise<SubscribeTransactionsResult> =>
                Promise.resolve({} as SubscribeTransactionsResult),
        })
}
