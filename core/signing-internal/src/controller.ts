// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

// Disabled unused vars rule to allow for future implementations
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    buildController,
    PartyMode,
    SigningDriverInterface,
    SigningProvider,
    signTransactionHash,
    signMessage,
    createKeyPair,
    SigningDriverStore,
    SigningTransaction,
    SigningKey,
} from '@canton-network/core-signing-lib'

import {
    SignTransactionParams,
    SignTransactionResult,
    GetTransactionParams,
    GetTransactionResult,
    GetTransactionsResult,
    GetTransactionsParams,
    GetKeysResult,
    CreateKeyParams,
    CreateKeyResult,
    GetConfigurationResult,
    SetConfigurationParams,
    SubscribeTransactionsParams,
    SubscribeTransactionsResult,
    SetConfigurationResult,
    Transaction,
    SignMessageParams,
    SignMessageResult,
} from '@canton-network/core-signing-lib'
import { randomUUID } from 'node:crypto'
import { AuthContext } from '@canton-network/core-wallet-auth'

interface InternalKey {
    id: string
    name: string
    publicKey: string
    privateKey: string
}

interface InternalTransaction {
    id: string
    hash: string
    signature: string
    publicKey: string
    createdAt: Date
}
const convertInternalTransaction = (tx: InternalTransaction): Transaction => {
    return {
        txId: tx.id,
        status: 'signed',
        signature: tx.signature,
        publicKey: tx.publicKey,
    }
}

export class InternalSigningDriver implements SigningDriverInterface {
    private store: SigningDriverStore

    public partyMode = PartyMode.EXTERNAL
    public signingProvider = SigningProvider.WALLET_KERNEL

    constructor(store: SigningDriverStore) {
        this.store = store
    }

    public controller = (_userId: AuthContext['userId'] | undefined) =>
        buildController({
            signTransaction: async (
                params: SignTransactionParams
            ): Promise<SignTransactionResult> => {
                // TODO: validate transaction here

                if (!params.keyIdentifier.publicKey) {
                    return Promise.resolve({
                        error: 'key_not_found',
                        error_description:
                            'The provided key identifier must include a publicKey.',
                    })
                }

                const key = await this.store.getSigningKeyByPublicKey(
                    params.keyIdentifier.publicKey
                )

                if (key?.privateKey && _userId) {
                    const txId = randomUUID()
                    const signature = signTransactionHash(
                        params.txHash,
                        key.privateKey
                    )

                    const now = new Date()
                    const internalTransaction: SigningTransaction = {
                        id: txId,
                        hash: params.txHash,
                        signature,
                        publicKey: params.keyIdentifier.publicKey,
                        createdAt: now,
                        status: 'signed',
                        updatedAt: now,
                        signedAt: now,
                    }

                    this.store.setSigningTransaction(
                        _userId,
                        internalTransaction
                    )

                    return Promise.resolve({
                        txId,
                        status: 'signed',
                        signature,
                    } as SignTransactionResult)
                } else {
                    if (!_userId) {
                        return Promise.resolve({
                            error: 'userId_not_found',
                            error_description:
                                'User ID is required for all signing operations.',
                        })
                    }
                    return Promise.resolve({
                        error: 'key_not_found',
                        error_description:
                            'The provided public key does not exist in the signing.',
                    })
                }
            },

            signMessage: async (
                params: SignMessageParams
            ): Promise<SignMessageResult> => {
                if (!params.keyIdentifier?.publicKey) {
                    return Promise.resolve({
                        error: 'key_not_found',
                        error_description:
                            'The provided key identifier must include a publicKey.',
                    })
                }

                const key = await this.store.getSigningKeyByPublicKey(
                    params.keyIdentifier.publicKey
                )
                if (!key?.privateKey) {
                    return Promise.resolve({
                        error: 'key_not_found',
                        error_description:
                            'The provided key identifier must include a privateKey.',
                    })
                }
                return Promise.resolve({
                    signature: signMessage(params.message, key.privateKey),
                })
            },

            getTransaction: async (
                params: GetTransactionParams
            ): Promise<GetTransactionResult> => {
                if (!_userId) {
                    return Promise.resolve({
                        error: 'userId_not_found',
                        error_description:
                            'User ID is required for all signing operations.',
                    })
                }

                const storedTx = await this.store.getSigningTransaction(
                    _userId,
                    params.txId
                )
                if (storedTx) {
                    return {
                        txId: storedTx.id,
                        status: storedTx.status,
                        signature: storedTx.signature || '',
                        publicKey: storedTx.publicKey,
                    }
                }
                return Promise.resolve({
                    error: 'transaction_not_found',
                    error_description:
                        'The requested transaction does not exist.',
                })
            },

            getTransactions: async (
                params: GetTransactionsParams
            ): Promise<GetTransactionsResult> => {
                if (!_userId) {
                    return Promise.resolve({
                        error: 'userId_not_found',
                        error_description:
                            'User ID is required for all signing operations.',
                    })
                }

                if (params.publicKeys || params.txIds) {
                    const transactions =
                        await this.store.listSigningTransactionsByTxIdsAndPublicKeys(
                            params.txIds || [],
                            params.publicKeys || []
                        )

                    return Promise.resolve({
                        transactions: transactions.map(
                            (tx: SigningTransaction) =>
                                convertInternalTransaction({
                                    ...tx,
                                    signature: tx.signature || 'signed',
                                    createdAt: new Date(tx.createdAt),
                                })
                        ),
                    })
                } else {
                    return Promise.resolve({
                        error: 'bad_arguments',
                        error_description:
                            'either public key or txIds must be supplied',
                    })
                }
            },

            getKeys: async (): Promise<GetKeysResult> => {
                if (!_userId) {
                    return Promise.resolve({
                        error: 'userId_not_found',
                        error_description:
                            'User ID is required for all signing operations.',
                    })
                }

                const keys = await this.store.listSigningKeys(_userId)
                if (keys.length > 0) {
                    return Promise.resolve({
                        keys: Array.from(keys).map((key) => ({
                            id: key.id,
                            name: key.name,
                            publicKey: key.publicKey,
                        })),
                    } as GetKeysResult)
                }

                return Promise.resolve({
                    keys: [],
                })
            },
            createKey: async (
                params: CreateKeyParams
            ): Promise<CreateKeyResult> => {
                if (!_userId) {
                    return Promise.resolve({
                        error: 'userId_not_found',
                        error_description:
                            'User ID is required for all signing operations.',
                    })
                }

                const { publicKey, privateKey } = createKeyPair()
                const id = randomUUID()

                const now = new Date()
                const internalKey: SigningKey = {
                    id,
                    name: params.name,
                    publicKey,
                    privateKey,
                    createdAt: now,
                    updatedAt: now,
                }

                await this.store.setSigningKey(_userId, internalKey)

                return {
                    id,
                    publicKey,
                    name: params.name,
                }
            },

            getConfiguration: async (): Promise<GetConfigurationResult> =>
                Promise.resolve({} as GetConfigurationResult),
            setConfiguration: async (
                params: SetConfigurationParams
            ): Promise<SetConfigurationResult> =>
                Promise.resolve({} as SetConfigurationResult),

            // TODO: implement subscribeTransactions - we will need to figure out how to handle subscriptions
            // when the controller is not running in a server context
            subscribeTransactions: async (
                params: SubscribeTransactionsParams
            ): Promise<SubscribeTransactionsResult> =>
                Promise.resolve({} as SubscribeTransactionsResult),
        })
}
