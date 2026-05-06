// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Interface for persistent storage of signing driver data.
 * Provides granular operations for keys, transactions, and configuration
 * to enable efficient partial updates and performance optimization.
 */
export interface SigningDriverStore {
    // Key management
    getSigningKey(
        userId: string,
        keyId: string
    ): Promise<SigningKey | undefined>
    getSigningKeyByPublicKey(publicKey: string): Promise<SigningKey | undefined>
    getSigningKeyByName(
        userId: string,
        name: string
    ): Promise<SigningKey | undefined>
    listSigningTransactionsByTxIdsAndPublicKeys(
        txIds: string[],
        publicKeys: string[]
    ): Promise<SigningTransaction[]>
    setSigningKey(userId: string, key: SigningKey): Promise<void>
    deleteSigningKey(userId: string, keyId: string): Promise<void>
    listSigningKeys(userId: string): Promise<SigningKey[]>

    // Transaction management
    getSigningTransaction(
        userId: string,
        txId: string
    ): Promise<SigningTransaction | undefined>
    setSigningTransaction(
        userId: string,
        transaction: SigningTransaction
    ): Promise<void>
    updateSigningTransactionStatus(
        userId: string,
        txId: string,
        status: SigningDriverStatus
    ): Promise<void>
    listSigningTransactions(
        userId: string,
        limit?: number,
        before?: string
    ): Promise<SigningTransaction[]>

    // Configuration management
    getSigningDriverConfiguration(
        userId: string,
        driverId: string
    ): Promise<SigningDriverConfig | undefined>
    setSigningDriverConfiguration(
        userId: string,
        config: SigningDriverConfig
    ): Promise<void>

    // Batch operations for performance
    setSigningKeys(userId: string, keys: SigningKey[]): Promise<void>
    setSigningTransactions(
        userId: string,
        transactions: SigningTransaction[]
    ): Promise<void>
}

/**
 * Represents a signing key with metadata
 */
export interface SigningKey {
    id: string
    name: string
    publicKey: string
    privateKey?: string // Optional for external signing providers
    metadata?: Record<string, unknown> // Driver-specific data (e.g., derivation path)
    createdAt: Date
    updatedAt: Date
}

/**
 * Represents a signing transaction with status tracking
 */
export interface SigningTransaction {
    id: string
    hash: string
    signature?: string
    publicKey: string
    status: SigningDriverStatus
    metadata?: Record<string, unknown> // Driver-specific data
    createdAt: Date
    updatedAt: Date
    signedAt?: Date
}

/**
 * Represents driver-specific configuration
 */
export interface SigningDriverConfig {
    driverId: string
    config: Record<string, unknown> // Driver-specific configuration
}

/**
 * Transaction signing status
 */
export type SigningDriverStatus = 'pending' | 'signed' | 'rejected' | 'failed'
