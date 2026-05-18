// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { Idp } from '@canton-network/core-wallet-auth'
import { Network } from './config/schema'

export enum AddressType {
    PaperAddress = 'PaperAddress',
    CCSPAddress = 'CCSPAddress',
}

export type PartyId = string

export interface SigningDriver {
    signingDriverId: string
}

export interface SigningProvider {
    signingProviderId: string
    privateKey?: string
    addressType: AddressType
}

export interface WalletFilter {
    networkIds?: string[]
    signingProviderIds?: string[]
}

export type CurrentNetworkWalletFilter = Omit<WalletFilter, 'networkIds'>

export enum PartyLevelRight {
    CanActAs = 'CanActAs',
    CanReadAs = 'CanReadAs',
    CanExecuteAs = 'CanExecuteAs',
}

export enum UserLevelRight {
    CanReadAsAnyParty = 'CanReadAsAnyParty',
    CanExecuteAsAnyParty = 'CanExecuteAsAnyParty',
}

export interface UpdateWallet {
    partyId: PartyId
    networkId?: string
    status?: WalletStatus
    externalTxId?: string
    topologyTransactions?: string
    disabled?: boolean
    reason?: string
    primary?: boolean
    rights?: PartyLevelRight[]
}

export type WalletStatus = 'initialized' | 'allocated' | 'removed'

export interface Wallet {
    primary: boolean
    status: WalletStatus
    partyId: PartyId
    hint: string
    publicKey: string
    namespace: string
    networkId: string
    signingProviderId: string
    externalTxId?: string
    topologyTransactions?: string
    disabled?: boolean
    reason?: string
    rights: PartyLevelRight[]
    // hosted: [network]
}

// Session management

export interface Session {
    id: string
    network: string
    accessToken: string
}

export interface Transaction {
    id: string
    status: 'pending' | 'signed' | 'executed' | 'failed'
    commandId: string
    preparedTransaction: string
    preparedTransactionHash: string
    payload?: unknown
    origin: string | null
    createdAt?: Date
    signedAt?: Date
    externalTxId?: string
}

export interface TransactionStatusUpdate {
    payload?: unknown
    signedAt?: Date
    externalTxId?: string
}

export interface MessageRaw {
    id: string
    status: 'pending' | 'signed' | 'failed'
    userId: string
    partyId: PartyId
    publicKey: string
    message: string
    origin: string | null
    createdAt: Date
    signedAt?: Date
    signature?: string
}

export interface MessageRawStatusUpdate {
    signedAt?: Date
    signature?: string
}

// Store interface for managing wallets, sessions, networks, and transactions

export interface Store {
    // Wallet methods
    getWallets(filter?: CurrentNetworkWalletFilter): Promise<Array<Wallet>>
    getAllWallets(filter?: WalletFilter): Promise<Array<Wallet>>
    getPrimaryWallet(): Promise<Wallet | undefined>
    setPrimaryWallet(partyId: PartyId): Promise<void>
    addWallet(wallet: Wallet): Promise<void>
    updateWallet(params: UpdateWallet): Promise<void>
    removeWallet(partyId: PartyId): Promise<void>
    getUserRights(networkId?: string): Promise<Array<UserLevelRight>>
    setUserRights(
        networkId: string,
        rights: Array<UserLevelRight>
    ): Promise<void>

    // Session methods
    getSession(): Promise<Session | undefined>
    setSession(session: Session): Promise<void>
    removeSession(): Promise<void>

    // IDP methods
    getIdp(idpId: string): Promise<Idp>
    listIdps(): Promise<Array<Idp>>
    updateIdp(idp: Idp): Promise<void>
    addIdp(idp: Idp): Promise<void>
    removeIdp(idpId: string): Promise<void>

    // Network methods
    getNetwork(networkId: string): Promise<Network>
    getCurrentNetwork(): Promise<Network>
    listNetworks(): Promise<Array<Network>>
    updateNetwork(network: Network): Promise<void>
    addNetwork(network: Network): Promise<void>
    removeNetwork(networkId: string): Promise<void>

    // Transaction methods
    setTransaction(tx: Transaction): Promise<void>
    setTransactionSigned(
        transactionId: string,
        signedAt: Date,
        externalTxId?: string
    ): Promise<void>
    setTransactionStatus(
        transactionId: string,
        status: Transaction['status'],
        updates?: TransactionStatusUpdate
    ): Promise<void>
    getTransaction(transactionId: string): Promise<Transaction | undefined>
    getLatestTransactionByCommandId(
        commandId: string
    ): Promise<Transaction | undefined>
    listTransactions(): Promise<Array<Transaction>>
    removeTransaction(transactionId: string): Promise<void>

    // Message signing request methods
    setMessageRaw(message: MessageRaw): Promise<void>
    setMessageRawStatus(
        messageId: string,
        status: MessageRaw['status'],
        updates?: MessageRawStatusUpdate
    ): Promise<void>
    getMessageRaw(messageId: string): Promise<MessageRaw | undefined>
    listMessageRaws(): Promise<Array<MessageRaw>>
    removeMessageRaw(messageId: string): Promise<void>
}
