// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { Logger } from 'pino'
import {
    AuthContext,
    UserId,
    AuthAware,
    assertConnected,
    Idp,
    AuthTokenProvider,
} from '@canton-network/core-wallet-auth'
import {
    Store,
    Wallet,
    PartyId,
    Session,
    WalletFilter,
    Transaction,
    Network,
    UpdateWallet,
    PartyLevelRight,
    TransactionStatusUpdate,
    UserLevelRight,
    MessageRaw,
    MessageRawStatusUpdate,
} from '@canton-network/core-wallet-store'
import {
    LedgerClient,
    defaultRetryableOptions,
} from '@canton-network/core-ledger-client'
import { CurrentNetworkWalletFilter } from '@canton-network/core-wallet-store'

interface UserStorage {
    wallets: Array<Wallet>
    transactions: Map<string, Transaction>
    messageRaws: Map<string, MessageRaw>
    session: Session | undefined
    userRightsByNetwork: Map<string, Set<UserLevelRight>>
}

export interface StoreInternalConfig {
    idps: Array<Idp>
    networks: Array<Network>
}

type Memory = Map<UserId, UserStorage>

// TODO: remove AuthAware and instead provide wrapper in clients
export class StoreInternal implements Store, AuthAware<StoreInternal> {
    private logger: Logger
    private systemStorage: StoreInternalConfig
    private userStorage: Memory

    authContext: AuthContext | undefined

    constructor(
        config: StoreInternalConfig,
        logger: Logger,
        authContext?: AuthContext,
        userStorage?: Memory
    ) {
        this.logger = logger.child({ component: 'StoreInternal' })
        this.systemStorage = config
        this.authContext = authContext
        this.userStorage = userStorage || new Map()

        this.syncWallets()
    }

    withAuthContext(context?: AuthContext): StoreInternal {
        return new StoreInternal(
            this.systemStorage,
            this.logger,
            context,
            this.userStorage
        )
    }

    static createStorage(): UserStorage {
        return {
            wallets: [],
            transactions: new Map<string, Transaction>(),
            messageRaws: new Map<string, MessageRaw>(),
            session: undefined,
            userRightsByNetwork: new Map<string, Set<UserLevelRight>>(),
        }
    }

    private assertConnected(): UserId {
        return assertConnected(this.authContext).userId
    }

    private getStorage(): UserStorage {
        const userId = this.assertConnected()
        if (!this.userStorage.has(userId)) {
            this.userStorage.set(userId, StoreInternal.createStorage())
        }
        return this.userStorage.get(userId)!
    }

    private updateStorage(storage: UserStorage): void {
        const userId = this.assertConnected()
        this.userStorage.set(userId, storage)
    }

    // Wallet methods

    private async syncWallets(): Promise<void> {
        try {
            const network = await this.getCurrentNetwork()

            // Get existing parties from participant
            const userAccessTokenProvider = AuthTokenProvider.fromToken(
                this.authContext!.accessToken,
                this.logger
            )

            const ledgerClient = new LedgerClient({
                baseUrl: new URL(network.ledgerApi.baseUrl),
                logger: this.logger,
                accessTokenProvider: userAccessTokenProvider,
            })
            const rights = await ledgerClient.getWithRetry(
                '/v2/users/{user-id}/rights',
                defaultRetryableOptions,
                {
                    path: {
                        'user-id': this.authContext!.userId,
                    },
                }
            )
            const rightsByParty = new Map<string, Set<PartyLevelRight>>()
            const getRights = (party: string) => {
                const existing = rightsByParty.get(party)
                if (existing) return existing
                const created = new Set<PartyLevelRight>()
                rightsByParty.set(party, created)
                return created
            }
            rights.rights?.forEach((right) => {
                if (!right || !right.kind) {
                    return
                }
                if ('CanActAs' in right.kind) {
                    getRights(right.kind.CanActAs.value.party).add(
                        PartyLevelRight.CanActAs
                    )
                } else if ('CanReadAs' in right.kind) {
                    getRights(right.kind.CanReadAs.value.party).add(
                        PartyLevelRight.CanReadAs
                    )
                } else if ('CanExecuteAs' in right.kind) {
                    getRights(right.kind.CanExecuteAs.value.party).add(
                        PartyLevelRight.CanExecuteAs
                    )
                }
            })
            const parties = Array.from(rightsByParty.keys())

            // Merge Wallets - check for duplicates by (partyId, networkId)
            const existingWallets = await this.getAllWallets({
                networkIds: [network.id],
            })
            const existingPartyNetworkPairs = new Set(
                existingWallets.map((w) => `${w.partyId}:${w.networkId}`)
            )
            const participantWallets: Array<Wallet> =
                parties
                    ?.filter(
                        (party) =>
                            !existingPartyNetworkPairs.has(
                                `${party}:${network.id}`
                            )
                        // todo: filter on idp id
                    )
                    .map((party) => {
                        const [hint, namespace] = party.split('::')
                        return {
                            primary: false,
                            partyId: party,
                            status: 'allocated',
                            hint: hint,
                            publicKey: namespace,
                            namespace: namespace,
                            networkId: network.id,
                            signingProviderId: 'participant', // todo: determine based on partyDetails.isLocal
                            rights: [...(rightsByParty.get(party) ?? [])],
                        }
                    }) || []
            const storage = this.getStorage()
            const wallets = [...storage.wallets, ...participantWallets]

            // Set primary wallet if none exists in this network
            const networkWallets = wallets.filter(
                (w) => w.networkId === network.id
            )
            const hasPrimary = networkWallets.some((w) => w.primary)
            if (!hasPrimary && networkWallets.length > 0) {
                networkWallets[0].primary = true
            }

            this.logger.debug(wallets, 'Wallets synchronized')

            // Update storage with new wallets
            storage.wallets = wallets
            this.updateStorage(storage)
        } catch {
            return
        }
    }

    async getAllWallets(filter: WalletFilter = {}): Promise<Array<Wallet>> {
        const { networkIds, signingProviderIds } = filter
        const networkIdSet = networkIds ? new Set(networkIds) : null
        const signingProviderIdSet = signingProviderIds
            ? new Set(signingProviderIds)
            : null

        return this.getStorage().wallets.filter((wallet) => {
            const matchedNetworkIds = networkIdSet
                ? networkIdSet.has(wallet.networkId)
                : true
            const matchedSigningProviderIds = signingProviderIdSet
                ? signingProviderIdSet.has(wallet.signingProviderId)
                : true
            return matchedNetworkIds && matchedSigningProviderIds
        })
    }

    async getWallets(
        filter: CurrentNetworkWalletFilter = {}
    ): Promise<Array<Wallet>> {
        const network = await this.getCurrentNetwork()
        return this.getAllWallets({
            ...filter,
            networkIds: [network.id],
        })
    }

    async getPrimaryWallet(): Promise<Wallet | undefined> {
        const wallets = await this.getWallets()
        return wallets.find((w) => w.primary === true)
    }

    async setPrimaryWallet(partyId: PartyId): Promise<void> {
        const network = await this.getCurrentNetwork()
        const storage = this.getStorage()
        const networkWallets = storage.wallets.filter(
            (w) => w.networkId === network.id
        )

        if (!networkWallets.some((w) => w.partyId === partyId)) {
            throw new Error(
                `Wallet with partyId "${partyId}" not found in network "${network.id}"`
            )
        }

        const wallets = storage.wallets.map((w) => {
            if (w.networkId === network.id) {
                if (w.partyId === partyId) {
                    w.primary = true
                } else {
                    w.primary = false
                }
            }
            return w
        })
        storage.wallets = wallets
        this.updateStorage(storage)
    }

    async addWallet(wallet: Wallet): Promise<void> {
        const storage = this.getStorage()
        if (
            storage.wallets.some(
                (w) =>
                    w.partyId === wallet.partyId &&
                    w.networkId === wallet.networkId
            )
        ) {
            throw new Error(
                `Wallet with partyId "${wallet.partyId}" already exists in network "${wallet.networkId}"`
            )
        }
        const networkWallets = await this.getAllWallets({
            networkIds: [wallet.networkId],
        })

        // If this is the first wallet in this network, set it as primary automatically
        if (networkWallets.length === 0) {
            wallet.primary = true
        }

        if (wallet.primary) {
            // If the new wallet is primary, set all others in the same network to non-primary
            storage.wallets
                .filter((w) => w.networkId === wallet.networkId)
                .map((w) => (w.primary = false))
        }
        storage.wallets.push(wallet)
        this.updateStorage(storage)
    }

    async updateWallet(params: UpdateWallet): Promise<void> {
        const storage = this.getStorage()
        const { partyId, networkId, ...updates } = params
        const targetNetworkId = networkId ?? (await this.getCurrentNetwork()).id
        if (Object.keys(updates).length === 0) return

        const wallets = storage.wallets.map((wallet) =>
            wallet.partyId === partyId && wallet.networkId === targetNetworkId
                ? { ...wallet, ...updates }
                : wallet
        )

        storage.wallets = wallets
        this.updateStorage(storage)
    }

    async removeWallet(partyId: PartyId): Promise<void> {
        const network = await this.getCurrentNetwork()
        const storage = this.getStorage()
        const wallets = storage.wallets.filter(
            (w) => !(w.partyId === partyId && w.networkId === network.id)
        )

        storage.wallets = wallets
        this.updateStorage(storage)
    }

    async getUserRights(networkId?: string): Promise<Array<UserLevelRight>> {
        const targetNetworkId = networkId ?? (await this.getCurrentNetwork()).id
        const rights =
            this.getStorage().userRightsByNetwork.get(targetNetworkId) ??
            new Set<UserLevelRight>()
        return [...rights]
    }

    async setUserRights(
        networkId: string,
        rights: Array<UserLevelRight>
    ): Promise<void> {
        const storage = this.getStorage()
        storage.userRightsByNetwork.set(networkId, new Set(rights))
        this.updateStorage(storage)
    }

    // Session methods
    async getSession(): Promise<Session | undefined> {
        return this.getStorage().session
    }

    async setSession(session: Session): Promise<void> {
        const storage = this.getStorage()
        storage.session = session
        this.updateStorage(storage)
    }

    async removeSession(): Promise<void> {
        const storage = this.getStorage()
        storage.session = undefined
        this.updateStorage(storage)
    }

    // IDP methods
    async getIdp(idpId: string): Promise<Idp> {
        this.assertConnected()
        const idps = await this.listIdps()
        const idp = idps.find((i) => i.id === idpId)
        if (!idp) {
            throw new Error(`IdP "${idpId}" not found`)
        }
        return idp
    }

    async listIdps(): Promise<Array<Idp>> {
        this.assertConnected()
        return this.systemStorage.idps
    }

    async addIdp(idp: Idp): Promise<void> {
        this.assertConnected()
        const existingIdp = await this.listIdps()

        if (existingIdp.find((i) => i.id === idp.id)) {
            throw new Error(`IdP "${idp.id}" already exists`)
        }

        this.systemStorage.idps.push(idp)
    }

    async updateIdp(idp: Idp): Promise<void> {
        this.assertConnected()
        const existingIdps = await this.listIdps()
        const index = existingIdps.findIndex((i) => i.id === idp.id)
        if (index === -1) {
            throw new Error(`IdP "${idp.id}" not found`)
        }
        this.systemStorage.idps[index] = idp
    }

    async removeIdp(idpId: string): Promise<void> {
        this.assertConnected()
        this.systemStorage.idps = this.systemStorage.idps.filter(
            (i) => i.id !== idpId
        )
    }

    // Network methods
    async getNetwork(networkId: string): Promise<Network> {
        this.assertConnected()

        const networks = await this.listNetworks()
        if (!networks) throw new Error('No networks available')

        const network = networks.find((n) => n.id === networkId)
        if (!network) throw new Error(`Network "${networkId}" not found`)
        return network
    }

    async getCurrentNetwork(): Promise<Network> {
        const session = this.getStorage().session
        if (!session) {
            throw new Error('No session found')
        }
        const networkId = session.network
        if (!networkId) {
            throw new Error('No current network set in session')
        }

        const networks = await this.listNetworks()
        const network = networks.find((n) => n.id === networkId)
        if (!network) {
            throw new Error(`Network "${networkId}" not found`)
        }
        return network
    }

    async listNetworks(): Promise<Array<Network>> {
        return this.systemStorage.networks
    }

    async updateNetwork(network: Network): Promise<void> {
        this.assertConnected()
        this.removeNetwork(network.id) // Ensure no duplicates
        this.systemStorage.networks.push(network)
    }

    async addNetwork(network: Network): Promise<void> {
        const networkAlreadyExists = this.systemStorage.networks.find(
            (n) => n.id === network.id
        )
        if (networkAlreadyExists) {
            throw new Error(`Network ${network.id} already exists`)
        } else {
            this.systemStorage.networks.push(network)
        }
    }

    async removeNetwork(networkId: string): Promise<void> {
        this.assertConnected()
        this.systemStorage.networks = this.systemStorage.networks.filter(
            (n) => n.id !== networkId
        )
    }

    private mergeTransactionStatusUpdate(
        existing: Transaction,
        status: Transaction['status'],
        updates: TransactionStatusUpdate = {}
    ): Transaction {
        const payload = updates.payload ?? existing.payload
        const signedAt = updates.signedAt ?? existing.signedAt
        const externalTxId = updates.externalTxId ?? existing.externalTxId

        return {
            id: existing.id,
            commandId: existing.commandId,
            status,
            preparedTransaction: existing.preparedTransaction,
            preparedTransactionHash: existing.preparedTransactionHash,
            origin: existing.origin,
            ...(payload !== undefined && { payload }),
            ...(existing.createdAt !== undefined && {
                createdAt: existing.createdAt,
            }),
            ...(signedAt !== undefined && { signedAt }),
            ...(externalTxId !== undefined && { externalTxId }),
        }
    }

    // Transaction methods
    async setTransaction(transaction: Transaction): Promise<void> {
        this.assertConnected()
        const storage = this.getStorage()

        storage.transactions.set(transaction.id, transaction)
        this.updateStorage(storage)
    }

    async setTransactionSigned(
        transactionId: string,
        signedAt: Date,
        externalTxId?: string
    ): Promise<void> {
        await this.setTransactionStatus(transactionId, 'signed', {
            signedAt,
            ...(externalTxId !== undefined && { externalTxId }),
        })
    }

    async setTransactionStatus(
        transactionId: string,
        status: Transaction['status'],
        updates: TransactionStatusUpdate = {}
    ): Promise<void> {
        this.assertConnected()
        const storage = this.getStorage()
        const existing = storage.transactions.get(transactionId)
        if (!existing) {
            throw new Error(`Transaction not found with id: ${transactionId}`)
        }

        const updated = this.mergeTransactionStatusUpdate(
            existing,
            status,
            updates
        )

        storage.transactions.set(transactionId, updated)
        this.updateStorage(storage)
    }

    async getTransaction(
        transactionId: string
    ): Promise<Transaction | undefined> {
        this.assertConnected()
        const storage = this.getStorage()

        return storage.transactions.get(transactionId)
    }

    async getLatestTransactionByCommandId(
        commandId: string
    ): Promise<Transaction | undefined> {
        this.assertConnected()
        const storage = this.getStorage()

        return Array.from(storage.transactions.values())
            .filter((tx) => tx.commandId === commandId)
            .sort((a, b) => {
                const aTime = a.createdAt?.getTime() ?? 0
                const bTime = b.createdAt?.getTime() ?? 0
                if (aTime !== bTime) {
                    return bTime - aTime
                }
                return b.id.localeCompare(a.id)
            })[0]
    }

    async listTransactions(): Promise<Array<Transaction>> {
        this.assertConnected()
        const storage = this.getStorage()

        return Array.from(storage.transactions.values())
    }

    async removeTransaction(transactionId: string): Promise<void> {
        this.assertConnected()
        const storage = this.getStorage()

        storage.transactions.delete(transactionId)
        this.updateStorage(storage)
    }

    private mergeMessageRawStatusUpdate(
        existing: MessageRaw,
        status: MessageRaw['status'],
        updates: MessageRawStatusUpdate = {}
    ): MessageRaw {
        const signedAt = updates.signedAt ?? existing.signedAt
        const signature = updates.signature ?? existing.signature

        return {
            ...existing,
            status,
            ...(signedAt !== undefined && { signedAt }),
            ...(signature !== undefined && { signature }),
        }
    }

    // Message signing request methods
    async setMessageRaw(message: MessageRaw): Promise<void> {
        const userId = this.assertConnected()
        if (message.userId !== userId) {
            throw new Error(
                `MessageRaw userId mismatch: expected ${userId}, got ${message.userId}`
            )
        }
        const storage = this.getStorage()
        storage.messageRaws.set(message.id, message)
        this.updateStorage(storage)
    }

    async setMessageRawStatus(
        messageId: string,
        status: MessageRaw['status'],
        updates: MessageRawStatusUpdate = {}
    ): Promise<void> {
        this.assertConnected()
        const storage = this.getStorage()
        const existing = storage.messageRaws.get(messageId)
        if (!existing) {
            throw new Error(`MessageRaw not found with id: ${messageId}`)
        }
        const updated = this.mergeMessageRawStatusUpdate(
            existing,
            status,
            updates
        )
        storage.messageRaws.set(messageId, updated)
        this.updateStorage(storage)
    }

    async getMessageRaw(messageId: string): Promise<MessageRaw | undefined> {
        this.assertConnected()
        const storage = this.getStorage()
        return storage.messageRaws.get(messageId)
    }

    async listMessageRaws(): Promise<Array<MessageRaw>> {
        this.assertConnected()
        const storage = this.getStorage()
        return Array.from(storage.messageRaws.values())
    }

    async removeMessageRaw(messageId: string): Promise<void> {
        this.assertConnected()
        const storage = this.getStorage()
        storage.messageRaws.delete(messageId)
        this.updateStorage(storage)
    }
}
