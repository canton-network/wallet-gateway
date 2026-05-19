// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 *
 * Bytestring of the prepared transaction for verification purposes.
 *
 */
export type Tx = string
/**
 *
 * Hash of the prepared transaction that will be signed.
 *
 */
export type TxHash = string
/**
 *
 * Public key used to sign the transaction.
 *
 */
export type PublicKey = string
/**
 *
 * Unique identifier for the key
 *
 */
export type Id = string
/**
 *
 * Key identifier with publicKey (id is optional).
 *
 */
export interface KeyIdentifierWithPublicKey {
    publicKey: PublicKey
    id?: Id
}
/**
 *
 * Key identifier with id (publicKey is optional).
 *
 */
export interface KeyIdentifierWithId {
    publicKey?: PublicKey
    id: Id
}
/**
 *
 * Identifier for the key to use for signing. At least one of publicKey or id must be provided.
 *
 */
export type KeyIdentifier = KeyIdentifierWithPublicKey | KeyIdentifierWithId
/**
 *
 * Internal txId used by the Wallet Gateway to store the transaction.
 *
 */
export type InternalTxId = string
type AlwaysTrue = any
/**
 *
 * Arbitrary UTF-8 message to sign.
 *
 */
export type Message = string
/**
 *
 * Unique identifier of the signed transaction given by the Signing Provider. This may not be the same as the internal txId given by the Wallet Gateway.
 *
 */
export type TxId = string
/**
 *
 * Unique identifiers assigned by the Signing Provider of the transactions to subscribe to.
 *
 */
export type TxIds = TxId[]
/**
 *
 * List of public keys to filter transactions by
 *
 */
export type PublicKeys = PublicKey[]
/**
 *
 * A human readable name for the key
 *
 */
export type Name = string
/**
 *
 * error code
 *
 */
export type ErrorCode = string
/**
 *
 * A human readable error description
 *
 */
export type ErrorDescription = string
export interface Error {
    error: ErrorCode
    error_description: ErrorDescription
}
/**
 *
 * Status of the transaction signing process.
 *
 */
export type SigningStatus = 'pending' | 'signed' | 'rejected' | 'failed'
/**
 *
 * Signature of the transaction if it was signed.
 *
 */
export type Signature = string
/**
 *
 * Additional metadata about the transaction.
 *
 */
export interface Metadata {
    [key: string]: any
}
export interface Transaction {
    txId: TxId
    status: SigningStatus
    signature?: Signature
    publicKey?: PublicKey
    metadata?: Metadata
}
export interface SignatureResult {
    signature: Signature
}
/**
 *
 * List of transactions matching the provided filters
 *
 */
export type Transactions = Transaction[]
export interface TransactionsResult {
    transactions?: Transactions
}
export interface Key {
    id: Id
    name: Name
    publicKey: PublicKey
}
/**
 *
 * List of keys availabile at the Wallet Provider
 *
 */
export type KeysList = Key[]
export interface Keys {
    keys: KeysList
}
export interface SignTransactionParams {
    tx: Tx
    txHash: TxHash
    keyIdentifier: KeyIdentifier
    internalTxId?: InternalTxId
    [k: string]: any
}
export interface SignMessageParams {
    message: Message
    keyIdentifier?: KeyIdentifier
}
export interface GetTransactionParams {
    txId: TxId
    [k: string]: any
}
export interface GetTransactionsParams {
    txIds?: TxIds
    publicKeys?: PublicKeys
    [k: string]: any
}
export interface CreateKeyParams {
    name: Name
    [k: string]: any
}
/**
 *
 * Configuration parameters to set
 *
 */
export interface SetConfigurationParams {
    [key: string]: any
}
export interface SubscribeTransactionsParams {
    txIds: TxIds
}
export type SignTransactionResult = Error | Transaction
export type SignMessageResult = Error | SignatureResult
export type GetTransactionResult = Error | Transaction
export type GetTransactionsResult = Error | TransactionsResult
export type GetKeysResult = Error | Keys
export type CreateKeyResult = Error | Key
export interface GetConfigurationResult {
    [key: string]: any
}
export interface SetConfigurationResult {
    [key: string]: any
}
export interface SubscribeTransactionsResult {
    txId: TxId
    status: SigningStatus
    signature?: Signature
    publicKey?: PublicKey
    metadata?: Metadata
}
/**
 *
 * Generated! Represents an alias to any of the provided schemas
 *
 */

export type SignTransaction = (
    params: SignTransactionParams
) => Promise<SignTransactionResult>
export type SignMessage = (
    params: SignMessageParams
) => Promise<SignMessageResult>
export type GetTransaction = (
    params: GetTransactionParams
) => Promise<GetTransactionResult>
export type GetTransactions = (
    params: GetTransactionsParams
) => Promise<GetTransactionsResult>
export type GetKeys = () => Promise<GetKeysResult>
export type CreateKey = (params: CreateKeyParams) => Promise<CreateKeyResult>
export type GetConfiguration = () => Promise<GetConfigurationResult>
export type SetConfiguration = (
    params: SetConfigurationParams
) => Promise<SetConfigurationResult>
export type SubscribeTransactions = (
    params: SubscribeTransactionsParams
) => Promise<SubscribeTransactionsResult>
