// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { Logger } from 'pino'
import { LedgerClient } from '@canton-network/core-ledger-client'
import {
    Store,
    Transaction,
    Wallet,
    Network,
} from '@canton-network/core-wallet-store'
import type { SignResult } from '../user-api/rpc-gen/typings.js'
import {
    Error as SigningError,
    GetTransactionResult,
    SigningDriverInterface,
    SigningProvider,
    SignTransactionResult,
} from '@canton-network/core-signing-lib'
import {
    ExecuteParams,
    ExecuteResult,
    SignParams,
    SignResultSigned,
} from '../user-api/rpc-gen/typings.js'
import { UserId } from '../dapp-api/rpc-gen/typings.js'
import { Notifier } from '../notification/NotificationService.js'
import { ledgerPrepareParams, type PrepareParams } from '../utils.js'

function handleSigningError<T extends object>(result: SigningError | T): T {
    if ('error' in result) {
        throw new Error(
            `Error from signing driver: ${result.error_description}`
        )
    }
    return result
}

export class TransactionService {
    constructor(
        private store: Store,
        private logger: Logger,
        private signingDrivers: Partial<
            Record<SigningProvider, SigningDriverInterface>
        > = {},
        private notifier: Notifier
    ) {}

    private async loadPreparedTransactionForSigning(
        transactionId: Transaction['id']
    ): Promise<Transaction> {
        const existingTx = await this.store.getTransaction(transactionId)

        if (!existingTx) {
            throw new Error(`Transaction not found with id: ${transactionId}`)
        }
        return existingTx
    }

    public signWithParticipant(wallet: Wallet): SignResultSigned {
        return {
            status: 'signed',
            signature: 'none',
            signedBy: wallet.namespace,
            partyId: wallet.partyId,
        }
    }

    public async signWithWalletKernel(
        userId: UserId,
        wallet: Wallet,
        signParams: SignParams
    ): Promise<SignResultSigned> {
        const signingProvider =
            this.signingDrivers[SigningProvider.WALLET_KERNEL]
        if (!signingProvider) {
            throw new Error('Wallet Kernel signing driver not available')
        }
        const driver = signingProvider.controller(userId)

        const tx = await this.loadPreparedTransactionForSigning(
            signParams.transactionId
        )
        const { signature } = await driver
            .signTransaction({
                tx: tx.preparedTransaction,
                txHash: tx.preparedTransactionHash,
                keyIdentifier: {
                    publicKey: wallet.publicKey,
                },
            })
            .then(handleSigningError)

        if (!signature) {
            throw new Error(
                'Failed to sign transaction: ' + JSON.stringify(signature)
            )
        }

        const now = new Date()

        const signedTx: Transaction = {
            id: tx.id,
            commandId: tx.commandId,
            status: 'signed',
            preparedTransaction: tx.preparedTransaction,
            preparedTransactionHash: tx.preparedTransactionHash,
            origin: tx?.origin ?? null,
            ...(tx?.createdAt && {
                createdAt: tx.createdAt,
            }),
            signedAt: now,
        }

        await this.store.setTransactionSigned(tx.id, now)
        this.notifier.emit('txChanged', signedTx)

        return {
            status: 'signed',
            signature,
            signedBy: wallet.namespace,
            partyId: wallet.partyId,
        }
    }

    public async signWithBlockdaemon(
        userId: UserId,
        wallet: Wallet,
        signParams: SignParams
    ): Promise<SignResult> {
        const signingProvider = this.signingDrivers[SigningProvider.BLOCKDAEMON]
        if (!signingProvider) {
            throw new Error('Blockdaemon signing driver not available')
        }
        const driver = signingProvider.controller(userId)

        const tx = await this.loadPreparedTransactionForSigning(
            signParams.transactionId
        )

        let signingResult: Exclude<
            GetTransactionResult | SignTransactionResult,
            SigningError
        >
        if (tx && tx.externalTxId) {
            signingResult = await driver
                .getTransaction({
                    userId,
                    txId: tx.externalTxId,
                })
                .then(handleSigningError)
        } else {
            const internalTxId = crypto
                .randomUUID()
                .replace(/-/g, '')
                .substring(0, 16)
            signingResult = await driver
                .signTransaction({
                    tx: tx.preparedTransaction,
                    txHash: tx.preparedTransactionHash,
                    keyIdentifier: {
                        publicKey: wallet.publicKey,
                    },
                    internalTxId,
                })
                .then(handleSigningError)
        }

        const now = new Date()

        if (signingResult.status === 'signed') {
            if (!signingResult.signature) {
                throw new Error('No signature returned from signing driver')
            }

            const signedTx: Transaction = {
                id: tx.id,
                commandId: tx.commandId,
                status: signingResult.status,
                preparedTransaction: tx.preparedTransaction,
                preparedTransactionHash: tx.preparedTransactionHash,
                origin: tx?.origin ?? null,
                ...(tx?.createdAt && {
                    createdAt: tx.createdAt,
                }),
                signedAt: now,
                externalTxId: signingResult.txId,
            }

            await this.store.setTransactionSigned(
                tx.id,
                now,
                signingResult.txId
            )
            this.notifier.emit('txChanged', signedTx)

            return {
                status: signingResult.status,
                signature: signingResult.signature,
                signedBy: wallet.namespace,
                partyId: wallet.partyId,
                externalTxId: signingResult.txId,
            }
        } else {
            const status =
                signingResult.status === 'pending' ? 'pending' : 'failed'
            const pendingTx: Transaction = {
                id: tx.id,
                commandId: tx.commandId,
                status,
                preparedTransaction: tx.preparedTransaction,
                preparedTransactionHash: tx.preparedTransactionHash,
                externalTxId: signingResult.txId,
                origin: tx?.origin ?? null,
                ...(tx?.createdAt && {
                    createdAt: tx.createdAt,
                }),
            }

            await this.store.setTransactionStatus(tx.id, status, {
                externalTxId: signingResult.txId,
            })

            this.notifier.emit('txChanged', pendingTx)

            return {
                status: signingResult.status,
                externalTxId: signingResult.txId,
                partyId: wallet.partyId,
            }
        }
    }

    public async signWithFireblocks(
        userId: UserId,
        wallet: Wallet,
        signParams: SignParams
    ): Promise<SignResult> {
        const signingProvider = this.signingDrivers[SigningProvider.FIREBLOCKS]
        if (!signingProvider) {
            throw new Error('Fireblocks signing driver not available')
        }
        const driver = signingProvider.controller(userId)

        const tx = await this.loadPreparedTransactionForSigning(
            signParams.transactionId
        )
        let signingResult: Exclude<
            GetTransactionResult | SignTransactionResult,
            SigningError
        >

        if (tx && tx.externalTxId) {
            signingResult = await driver
                .getTransaction({
                    userId,
                    txId: tx.externalTxId,
                })
                .then(handleSigningError)
        } else {
            signingResult = await driver
                .signTransaction({
                    userId,
                    tx: tx.preparedTransaction,
                    txHash: Buffer.from(
                        tx.preparedTransactionHash,
                        'base64'
                    ).toString('hex'),
                    keyIdentifier: {
                        publicKey: wallet.publicKey,
                    },
                })
                .then(handleSigningError)
        }

        const now = new Date()

        if (signingResult.status === 'signed') {
            if (!signingResult.signature) {
                throw new Error('No signature returned from signing driver')
            }

            const signedTx: Transaction = {
                id: tx.id,
                commandId: tx.commandId,
                status: signingResult.status,
                preparedTransaction: tx.preparedTransaction,
                preparedTransactionHash: tx.preparedTransactionHash,
                origin: tx?.origin ?? null,
                ...(tx?.createdAt && {
                    createdAt: tx.createdAt,
                }),
                signedAt: now,
                externalTxId: signingResult.txId,
            }

            await this.store.setTransactionSigned(
                tx.id,
                now,
                signingResult.txId
            )
            this.notifier.emit('txChanged', signedTx)

            // return signature in format that is already usable in execute
            const decodedSignature = Buffer.from(
                signingResult.signature,
                'hex'
            ).toString('base64')

            return {
                status: signingResult.status,
                signature: decodedSignature,
                signedBy: wallet.namespace,
                partyId: wallet.partyId,
                externalTxId: signingResult.txId,
            }
        } else {
            const status =
                signingResult.status === 'pending' ? 'pending' : 'failed'
            const pendingTx: Transaction = {
                id: tx.id,
                commandId: tx.commandId,
                status,
                preparedTransaction: tx.preparedTransaction,
                preparedTransactionHash: tx.preparedTransactionHash,
                externalTxId: signingResult.txId,
                origin: tx?.origin ?? null,
                ...(tx?.createdAt && {
                    createdAt: tx.createdAt,
                }),
            }

            await this.store.setTransactionStatus(tx.id, status, {
                externalTxId: signingResult.txId,
            })
            this.notifier.emit('txChanged', pendingTx)

            return {
                status: signingResult.status,
                externalTxId: signingResult.txId,
                partyId: wallet.partyId,
            }
        }
    }

    /**
     * Dfns broadcasts the prepared transaction to Canton itself, so we get back
     * an updateId rather than a raw signature. We persist the updateId as the
     * signature payload (the controller short-circuits Dfns execute) and surface
     * the same SignResult shape the other external providers use.
     */
    public async signWithDfns(
        userId: UserId,
        wallet: Wallet,
        signParams: SignParams
    ): Promise<SignResult> {
        const signingProvider = this.signingDrivers[SigningProvider.DFNS]
        if (!signingProvider) {
            throw new Error('Dfns signing driver not available')
        }
        const driver = signingProvider.controller(userId)

        const tx = await this.loadPreparedTransactionForSigning(
            signParams.transactionId
        )

        let signingResult: Exclude<
            GetTransactionResult | SignTransactionResult,
            SigningError
        >
        if (tx.externalTxId) {
            signingResult = await driver
                .getTransaction({
                    userId,
                    txId: tx.externalTxId,
                })
                .then(handleSigningError)
        } else {
            signingResult = await driver
                .signTransaction({
                    tx: tx.preparedTransaction,
                    txHash: tx.preparedTransactionHash,
                    keyIdentifier: {
                        publicKey: wallet.publicKey,
                    },
                })
                .then(handleSigningError)
        }

        const now = new Date()

        if (signingResult.status === 'signed') {
            if (!signingResult.signature) {
                throw new Error('No updateId returned from Dfns')
            }

            const signedTx: Transaction = {
                id: tx.id,
                commandId: tx.commandId,
                status: signingResult.status,
                preparedTransaction: tx.preparedTransaction,
                preparedTransactionHash: tx.preparedTransactionHash,
                origin: tx?.origin ?? null,
                ...(tx?.createdAt && {
                    createdAt: tx.createdAt,
                }),
                signedAt: now,
                externalTxId: signingResult.txId,
            }

            await this.store.setTransactionSigned(
                tx.id,
                now,
                signingResult.txId
            )
            this.notifier.emit('txChanged', signedTx)

            return {
                status: signingResult.status,
                signature: signingResult.signature,
                signedBy: wallet.namespace,
                partyId: wallet.partyId,
                externalTxId: signingResult.txId,
            }
        } else {
            const status =
                signingResult.status === 'pending' ? 'pending' : 'failed'
            const pendingTx: Transaction = {
                id: tx.id,
                commandId: tx.commandId,
                status,
                preparedTransaction: tx.preparedTransaction,
                preparedTransactionHash: tx.preparedTransactionHash,
                externalTxId: signingResult.txId,
                origin: tx?.origin ?? null,
                ...(tx?.createdAt && {
                    createdAt: tx.createdAt,
                }),
            }

            await this.store.setTransactionStatus(tx.id, status, {
                externalTxId: signingResult.txId,
            })
            this.notifier.emit('txChanged', pendingTx)

            return {
                status: signingResult.status,
                externalTxId: signingResult.txId,
                partyId: wallet.partyId,
            }
        }
    }

    /**
     * Dfns has already broadcast the transaction at sign-time, so execute is a
     * state reconciliation: mark the stored transaction as executed and return
     * the updateId Dfns gave us. We deliberately don't post to the ledger here.
     */
    public async executeWithDfns(
        transaction: Transaction
    ): Promise<ExecuteResult> {
        if (!transaction.externalTxId) {
            throw new Error(
                'Cannot execute Dfns transaction without externalTxId from Dfns'
            )
        }

        const executedTx: Transaction = {
            id: transaction.id,
            commandId: transaction.commandId,
            status: 'executed',
            preparedTransaction: transaction.preparedTransaction,
            preparedTransactionHash: transaction.preparedTransactionHash,
            origin: transaction.origin ?? null,
            ...(transaction.createdAt && {
                createdAt: transaction.createdAt,
            }),
            ...(transaction.signedAt && {
                signedAt: transaction.signedAt,
            }),
            externalTxId: transaction.externalTxId,
        }
        await this.store.setTransactionStatus(transaction.id, 'executed', {
            externalTxId: transaction.externalTxId,
        })
        this.notifier.emit('txChanged', executedTx)

        return { updateId: transaction.externalTxId } as ExecuteResult
    }

    public async executeWithParticipant(
        userId: UserId,
        executeParams: ExecuteParams,
        transaction: Transaction,
        ledgerClient: LedgerClient,
        network: Network
    ): Promise<ExecuteResult> {
        const { partyId } = executeParams
        const { commandId } = transaction

        const synchronizerId =
            network.synchronizerId ?? (await ledgerClient.getSynchronizerId())

        const prep = ledgerPrepareParams(
            userId,
            partyId,
            synchronizerId,
            transaction.payload as PrepareParams
        )
        const res = await ledgerClient.postWithRetry(
            '/v2/commands/submit-and-wait',
            prep
        )

        const executedTx: Transaction = {
            id: transaction.id,
            commandId,
            status: 'executed',
            preparedTransaction: transaction.preparedTransaction,
            preparedTransactionHash: transaction.preparedTransactionHash,
            payload: res,
            origin: transaction.origin ?? null,
            ...(transaction.createdAt && {
                createdAt: transaction.createdAt,
            }),
            ...(transaction.signedAt && {
                signedAt: transaction.signedAt,
            }),
        }
        await this.store.setTransactionStatus(transaction.id, 'executed', {
            payload: res,
        })
        this.notifier.emit('txChanged', executedTx)

        return res as ExecuteResult
    }

    public async executeWithExternal(
        userId: UserId,
        executeParams: ExecuteParams,
        transaction: Transaction,
        ledgerClient: LedgerClient
    ): Promise<ExecuteResult> {
        const { partyId, signature, signedBy } = executeParams
        const { commandId } = transaction

        const result = await ledgerClient.postWithRetry(
            '/v2/interactive-submission/executeAndWait',
            {
                userId,
                preparedTransaction: transaction.preparedTransaction,
                hashingSchemeVersion: 'HASHING_SCHEME_VERSION_V2',
                submissionId: commandId,
                deduplicationPeriod: {
                    Empty: {},
                },
                partySignatures: {
                    signatures: [
                        {
                            party: partyId,
                            signatures: [
                                {
                                    signature,
                                    signedBy,
                                    format: 'SIGNATURE_FORMAT_CONCAT',
                                    signingAlgorithmSpec:
                                        'SIGNING_ALGORITHM_SPEC_ED25519',
                                },
                            ],
                        },
                    ],
                },
            }
        )

        const executedTx: Transaction = {
            id: transaction.id,
            commandId,
            status: 'executed',
            preparedTransaction: transaction.preparedTransaction,
            preparedTransactionHash: transaction.preparedTransactionHash,
            payload: result,
            origin: transaction.origin ?? null,
            ...(transaction.createdAt && {
                createdAt: transaction.createdAt,
            }),
            ...(transaction.signedAt && {
                signedAt: transaction.signedAt,
            }),
        }
        await this.store.setTransactionStatus(transaction.id, 'executed', {
            payload: result,
        })
        this.notifier.emit('txChanged', executedTx)

        return result as ExecuteResult
    }
}
