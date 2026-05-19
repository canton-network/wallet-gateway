// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { Logger } from 'pino'
import {
    AuthContext,
    UserId,
    AuthAware,
    assertConnected,
    Idp,
} from '@canton-network/core-wallet-auth'
import {
    Store as BaseStore,
    Wallet,
    PartyId,
    Session,
    WalletFilter,
    Transaction,
    MessageRaw,
    MessageRawStatusUpdate,
    Network,
    StoreConfig,
    UpdateWallet,
    CurrentNetworkWalletFilter,
    PartyLevelRight,
    TransactionStatusUpdate,
    UserLevelRight,
} from '@canton-network/core-wallet-store'
import { CamelCasePlugin, Kysely, PostgresDialect, SqliteDialect } from 'kysely'
import Database from 'better-sqlite3'
import {
    DB,
    fromIdp,
    fromNetwork,
    fromTransaction,
    fromMessageRaw,
    fromWallet,
    fromPartyRight,
    fromUserRight,
    toWalletUpdateProperties,
    toIdp,
    toNetwork,
    toTransaction,
    toMessageRaw,
    toWallet,
} from './schema.js'
import pg from 'pg'

export class StoreSql implements BaseStore, AuthAware<StoreSql> {
    authContext: AuthContext | undefined

    constructor(
        private db: Kysely<DB>,
        private logger: Logger,
        authContext?: AuthContext
    ) {
        this.logger = logger.child({ component: 'StoreSql' })
        this.authContext = authContext
    }

    withAuthContext(context?: AuthContext): StoreSql {
        return new StoreSql(this.db, this.logger, context)
    }

    private assertConnected(): UserId {
        return assertConnected(this.authContext).userId
    }

    // Wallet methods

    async getAllWallets(filter: WalletFilter = {}): Promise<Array<Wallet>> {
        const userId = this.assertConnected()
        const { networkIds, signingProviderIds } = filter
        const networkIdSet = networkIds ? new Set(networkIds) : null
        const signingProviderIdSet = signingProviderIds
            ? new Set(signingProviderIds)
            : null

        const wallets = await this.db
            .selectFrom('wallets')
            .selectAll()
            .where('userId', '=', userId)
            .execute()

        const userPartyRights = await this.db
            .selectFrom('userPartyRights')
            .selectAll()
            .where('userId', '=', userId)
            .execute()

        const rightsByWallet = new Map<string, PartyLevelRight[]>()
        for (const row of userPartyRights) {
            const right = fromPartyRight(row.right)
            if (!right) continue
            const key = `${row.partyId}:${row.networkId}`
            const existing = rightsByWallet.get(key) ?? []
            rightsByWallet.set(key, [...existing, right])
        }

        return wallets
            .filter((wallet) => {
                const matchedNetworkIds = networkIdSet
                    ? networkIdSet.has(wallet.networkId)
                    : true
                const matchedSigningProviderIds = signingProviderIdSet
                    ? signingProviderIdSet.has(wallet.signingProviderId)
                    : true
                return matchedNetworkIds && matchedSigningProviderIds
            })
            .map((table) => {
                const wallet = toWallet(table)
                const rights = rightsByWallet.get(
                    `${table.partyId}:${table.networkId}`
                )
                return {
                    ...wallet,
                    rights: rights ?? [],
                }
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
        const userId = this.assertConnected()
        const wallets = await this.getWallets()

        if (!wallets.some((w) => w.partyId === partyId)) {
            throw new Error(
                `Wallet with partyId "${partyId}" not found in network "${network.id}"`
            )
        }

        const primary = wallets.find((w) => w.primary === true)

        await this.db.transaction().execute(async (trx) => {
            if (primary) {
                // Unset primary for current network only
                await trx
                    .updateTable('wallets')
                    .set({ primary: 0 })
                    .where((eb) =>
                        eb.and([
                            eb('partyId', '=', primary.partyId),
                            eb('networkId', '=', network.id),
                            eb('userId', '=', userId),
                        ])
                    )
                    .execute()
            }
            // Set new primary for current network
            await trx
                .updateTable('wallets')
                .set({ primary: 1 })
                .where((eb) =>
                    eb.and([
                        eb('partyId', '=', partyId),
                        eb('networkId', '=', network.id),
                        eb('userId', '=', userId),
                    ])
                )
                .execute()
        })
    }

    async addWallet(wallet: Wallet): Promise<void> {
        this.logger.info('Adding wallet')
        const userId = this.assertConnected()

        const wallets = await this.getWallets()
        if (
            wallets.some(
                (w) =>
                    w.partyId === wallet.partyId &&
                    w.networkId === wallet.networkId
            )
        ) {
            throw new Error(
                `Wallet with partyId "${wallet.partyId}" networkId "${wallet.networkId}" userId "${userId}" already exists`
            )
        }

        if (
            !wallet.disabled &&
            wallet.status === 'allocated' &&
            !wallets.some((wallet) => wallet.primary)
        ) {
            // If there is no primary wallet yet, set current one as primary (unless disabled or not allocated).
            // In regular case it would be the first added wallet.
            wallet.primary = true
        }

        await this.db.transaction().execute(async (trx) => {
            if (wallet.primary) {
                // If the new wallet is primary, set all others in the same network and for this user to non-primary
                await trx
                    .updateTable('wallets')
                    .set({ primary: 0 })
                    .where((eb) =>
                        eb.and([
                            eb('primary', '=', 1),
                            eb('networkId', '=', wallet.networkId),
                            eb('userId', '=', userId),
                        ])
                    )
                    .execute()
            }
            await trx
                .insertInto('wallets')
                .values(fromWallet(wallet, userId))
                .execute()

            if (wallet.rights && wallet.rights.length > 0) {
                await trx
                    .insertInto('userPartyRights')
                    .values(
                        wallet.rights.map((right) => ({
                            userId,
                            networkId: wallet.networkId,
                            partyId: wallet.partyId,
                            right,
                        }))
                    )
                    .execute()
            }
        })
    }

    async updateWallet(params: UpdateWallet): Promise<void> {
        const { partyId, networkId, rights } = params
        this.logger.info('Updating wallet')
        const userId = this.assertConnected()

        const updates = toWalletUpdateProperties(params)

        const targetNetworkId = networkId ?? (await this.getCurrentNetwork()).id
        if (Object.keys(updates).length === 0 && rights === undefined) return

        await this.db.transaction().execute(async (trx) => {
            if (Object.keys(updates).length > 0) {
                await trx
                    .updateTable('wallets')
                    .set(updates)
                    .where((eb) =>
                        eb.and([
                            eb('partyId', '=', partyId),
                            eb('networkId', '=', targetNetworkId),
                            eb('userId', '=', userId),
                        ])
                    )
                    .execute()
            }

            if (rights !== undefined) {
                await trx
                    .deleteFrom('userPartyRights')
                    .where((eb) =>
                        eb.and([
                            eb('partyId', '=', partyId),
                            eb('networkId', '=', targetNetworkId),
                            eb('userId', '=', userId),
                        ])
                    )
                    .execute()

                if (rights.length > 0) {
                    await trx
                        .insertInto('userPartyRights')
                        .values(
                            rights.map((right) => ({
                                userId,
                                networkId: targetNetworkId,
                                partyId,
                                right,
                            }))
                        )
                        .execute()
                }
            }
        })
    }

    async removeWallet(partyId: PartyId): Promise<void> {
        this.logger.info('Removing wallet')
        const userId = this.assertConnected()

        // Remove wallet from current network only
        const network = await this.getCurrentNetwork()

        await this.db.transaction().execute(async (trx) => {
            await trx
                .deleteFrom('wallets')
                .where((eb) =>
                    eb.and([
                        eb('partyId', '=', partyId),
                        eb('networkId', '=', network.id),
                        eb('userId', '=', userId),
                    ])
                )
                .execute()
        })
    }

    async getUserRights(networkId?: string): Promise<Array<UserLevelRight>> {
        const userId = this.assertConnected()
        const targetNetworkId = networkId ?? (await this.getCurrentNetwork()).id
        const rows = await this.db
            .selectFrom('userRights')
            .selectAll()
            .where((eb) =>
                eb.and([
                    eb('userId', '=', userId),
                    eb('networkId', '=', targetNetworkId),
                ])
            )
            .execute()

        return rows
            .map((row) => fromUserRight(row.right))
            .filter((right): right is UserLevelRight => right !== undefined)
    }

    async setUserRights(
        networkId: string,
        rights: Array<UserLevelRight>
    ): Promise<void> {
        const userId = this.assertConnected()

        await this.db.transaction().execute(async (trx) => {
            await trx
                .deleteFrom('userRights')
                .where((eb) =>
                    eb.and([
                        eb('userId', '=', userId),
                        eb('networkId', '=', networkId),
                    ])
                )
                .execute()

            if (rights.length > 0) {
                await trx
                    .insertInto('userRights')
                    .values(
                        rights.map((right) => ({
                            userId,
                            networkId,
                            right,
                        }))
                    )
                    .execute()
            }
        })
    }

    // Session methods
    async getSession(): Promise<Session | undefined> {
        const userId = this.assertConnected()
        const sessions = await this.db
            .selectFrom('sessions')
            .selectAll()
            .where('userId', '=', userId)
            .executeTakeFirst()
        return sessions
    }

    async setSession(session: Session): Promise<void> {
        const userId = this.assertConnected()
        await this.db.transaction().execute(async (trx) => {
            const deleted = await trx
                .deleteFrom('sessions')
                .where('userId', '=', userId)
                .execute()
            this.logger.debug(deleted, 'Deleted old session')
            const inserted = await trx
                .insertInto('sessions')
                .values({ ...session, userId })
                .execute()
            this.logger.debug(inserted, 'Inserted new session')
        })
    }

    async removeSession(): Promise<void> {
        const userId = this.assertConnected()
        await this.db
            .deleteFrom('sessions')
            .where('userId', '=', userId)
            .execute()
    }

    // IDP methods

    async getIdp(idpId: string): Promise<Idp> {
        this.assertConnected()

        const idps = await this.listIdps()
        if (!idps) throw new Error('No IDPs available')

        const idp = idps.find((n) => n.id === idpId)
        if (!idp) throw new Error(`IDP "${idpId}" not found`)
        return idp
    }

    async listIdps(): Promise<Array<Idp>> {
        // All IDPs are global for now -- TO-DO: user-specific IDPs
        const query = this.db.selectFrom('idps').selectAll()

        const idps = await query.execute()
        return idps.map((table) => toIdp(table))
    }

    async updateIdp(idp: Idp): Promise<void> {
        // todo: check and compare userid of existing idp
        await this.db.transaction().execute(async (trx) => {
            const idpEntry = fromIdp(idp)
            this.logger.info(idpEntry, 'Updating idp table')
            await trx
                .updateTable('idps')
                .set(idpEntry)
                .where('id', '=', idp.id)
                .execute()
        })
    }

    async addIdp(idp: Idp): Promise<void> {
        await this.db.transaction().execute(async (trx) => {
            const idpAlreadyExists = await trx
                .selectFrom('idps')
                .selectAll()
                .where('id', '=', idp.id)
                .executeTakeFirst()
            if (idpAlreadyExists) {
                throw new Error(`IDP ${idp.id} already exists`)
            } else {
                await trx.insertInto('idps').values(fromIdp(idp)).execute()
            }
        })
    }

    async removeIdp(idpId: string): Promise<void> {
        const networks = await this.listNetworks()
        if (networks.some((n) => n.identityProviderId === idpId)) {
            throw new Error(
                `Cannot delete IDP ${idpId} as it is in use by existing networks`
            )
        }

        await this.db.transaction().execute(async (trx) => {
            const idp = await trx
                .selectFrom('idps')
                .selectAll()
                .where('id', '=', idpId)
                .executeTakeFirst()
            if (!idp) {
                throw new Error(`IDP ${idpId} does not exists`)
            }
            await trx.deleteFrom('idps').where('id', '=', idpId).execute()
        })
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
        const session = await this.getSession()
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
        let query = this.db.selectFrom('networks').selectAll()

        if (this.authContext) {
            const userId = this.assertConnected()
            query = query.where((eb) =>
                eb.or([
                    eb('userId', 'is', null), // Global networks
                    eb('userId', '=', userId), // User-specific networks
                ])
            )
        } else {
            query = query.where('userId', 'is', null) // Only global networks
        }

        const networks = await query.execute()
        return networks.map((table) => toNetwork(table))
    }

    async updateNetwork(network: Network): Promise<void> {
        // todo: check and compare idpId of existing network
        this.assertConnected()
        await this.db.transaction().execute(async (trx) => {
            // we do not set a userId for now and leave all networks global when updating
            const networkEntry = fromNetwork(network, undefined)
            this.logger.info(networkEntry, 'Updating network table')
            await trx
                .updateTable('networks')
                .set(networkEntry)
                .where('id', '=', network.id)
                .execute()
        })
    }

    async addNetwork(network: Network): Promise<void> {
        const userId = this.authContext?.userId
        const idps = await this.listIdps()
        const networkIdp = idps.find(
            (idp) => idp.id === network.identityProviderId
        )

        if (!networkIdp) {
            throw new Error(
                `Identity provider "${network.identityProviderId}" not found`
            )
        }

        await this.db.transaction().execute(async (trx) => {
            const networkAlreadyExists = await trx
                .selectFrom('networks')
                .selectAll()
                .where('id', '=', network.id)
                .executeTakeFirst()
            if (networkAlreadyExists) {
                throw new Error(`Network ${network.id} already exists`)
            } else {
                await trx
                    .insertInto('networks')
                    .values(fromNetwork(network, userId))
                    .execute()
            }
        })
    }

    async removeNetwork(networkId: string): Promise<void> {
        const userId = this.assertConnected()
        await this.db.transaction().execute(async (trx) => {
            const network = await trx
                .selectFrom('networks')
                .selectAll()
                .where('id', '=', networkId)
                .executeTakeFirst()
            if (!network) {
                throw new Error(`Network ${networkId} does not exists`)
            }
            if (network.userId !== userId) {
                throw new Error(
                    `Network ${networkId} is not owned by user ${userId}`
                )
            }
            await trx
                .deleteFrom('networks')
                .where('id', '=', networkId)
                .execute()
        })
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
        const userId = this.assertConnected()
        const network = await this.getCurrentNetwork()

        await this.db
            .insertInto('transactions')
            .values(fromTransaction(transaction, userId, network.id))
            .execute()
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
        const userId = this.assertConnected()
        const network = await this.getCurrentNetwork()
        const existing = await this.getTransaction(transactionId)
        if (!existing) {
            throw new Error(`Transaction not found with id: ${transactionId}`)
        }

        const updated = this.mergeTransactionStatusUpdate(
            existing,
            status,
            updates
        )

        await this.db
            .updateTable('transactions')
            .set(fromTransaction(updated, userId, network.id))
            .where((eb) =>
                eb.and([
                    eb('id', '=', transactionId),
                    eb('userId', '=', userId),
                    eb('networkId', '=', network.id),
                ])
            )
            .execute()
    }

    async getTransaction(
        transactionId: string
    ): Promise<Transaction | undefined> {
        const userId = this.assertConnected()
        const network = await this.getCurrentNetwork()
        const transaction = await this.db
            .selectFrom('transactions')
            .selectAll()
            .where((eb) =>
                eb.and([
                    eb('id', '=', transactionId),
                    eb('userId', '=', userId),
                    eb('networkId', '=', network.id),
                ])
            )
            .executeTakeFirst()
        return transaction ? toTransaction(transaction) : undefined
    }

    async getLatestTransactionByCommandId(
        commandId: string
    ): Promise<Transaction | undefined> {
        const userId = this.assertConnected()
        const network = await this.getCurrentNetwork()
        const transaction = await this.db
            .selectFrom('transactions')
            .selectAll()
            .where((eb) =>
                eb.and([
                    eb('commandId', '=', commandId),
                    eb('userId', '=', userId),
                    eb('networkId', '=', network.id),
                ])
            )
            .orderBy('createdAt', 'desc')
            .orderBy('id', 'desc')
            .executeTakeFirst()

        return transaction ? toTransaction(transaction) : undefined
    }

    async listTransactions(): Promise<Array<Transaction>> {
        const userId = this.assertConnected()
        const network = await this.getCurrentNetwork()
        const transactions = await this.db
            .selectFrom('transactions')
            .selectAll()
            .where((eb) =>
                eb.and([
                    eb('userId', '=', userId),
                    eb('networkId', '=', network.id),
                ])
            )
            .execute()
        return transactions.map((table) => toTransaction(table))
    }

    async removeTransaction(transactionId: string): Promise<void> {
        const userId = this.assertConnected()
        const network = await this.getCurrentNetwork()
        await this.db
            .deleteFrom('transactions')
            .where((eb) =>
                eb.and([
                    eb('id', '=', transactionId),
                    eb('userId', '=', userId),
                    eb('networkId', '=', network.id),
                ])
            )
            .execute()
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
        const network = await this.getCurrentNetwork()
        await this.db
            .insertInto('messagesRaw')
            .values(fromMessageRaw(message, userId, network.id))
            .execute()
    }

    async setMessageRawStatus(
        messageId: string,
        status: MessageRaw['status'],
        updates: MessageRawStatusUpdate = {}
    ): Promise<void> {
        const userId = this.assertConnected()
        const network = await this.getCurrentNetwork()
        const existing = await this.getMessageRaw(messageId)
        if (!existing) {
            throw new Error(`MessageRaw not found with id: ${messageId}`)
        }

        const updated = this.mergeMessageRawStatusUpdate(
            existing,
            status,
            updates
        )

        await this.db
            .updateTable('messagesRaw')
            .set(fromMessageRaw(updated, userId, network.id))
            .where((eb) =>
                eb.and([
                    eb('id', '=', messageId),
                    eb('userId', '=', userId),
                    eb('networkId', '=', network.id),
                ])
            )
            .execute()
    }

    async getMessageRaw(messageId: string): Promise<MessageRaw | undefined> {
        const userId = this.assertConnected()
        const network = await this.getCurrentNetwork()
        const message = await this.db
            .selectFrom('messagesRaw')
            .selectAll()
            .where((eb) =>
                eb.and([
                    eb('id', '=', messageId),
                    eb('userId', '=', userId),
                    eb('networkId', '=', network.id),
                ])
            )
            .executeTakeFirst()
        return message ? toMessageRaw(message) : undefined
    }

    async listMessageRaws(): Promise<Array<MessageRaw>> {
        const userId = this.assertConnected()
        const network = await this.getCurrentNetwork()
        const messages = await this.db
            .selectFrom('messagesRaw')
            .selectAll()
            .where((eb) =>
                eb.and([
                    eb('userId', '=', userId),
                    eb('networkId', '=', network.id),
                ])
            )
            .orderBy('createdAt', 'desc')
            .orderBy('id', 'desc')
            .execute()
        return messages.map((m) => toMessageRaw(m))
    }

    async removeMessageRaw(messageId: string): Promise<void> {
        const userId = this.assertConnected()
        const network = await this.getCurrentNetwork()
        await this.db
            .deleteFrom('messagesRaw')
            .where((eb) =>
                eb.and([
                    eb('id', '=', messageId),
                    eb('userId', '=', userId),
                    eb('networkId', '=', network.id),
                ])
            )
            .execute()
    }
}

export const connection = (config: StoreConfig) => {
    let database
    switch (config.connection.type) {
        case 'sqlite':
            database = new Database(config.connection.database)
            // normally sqlite3 has foreign_keys = OFF for each connection,
            // but better-sqlite3 uses custom build with compile flag SQLITE_DEFAULT_FOREIGN_KEYS=1,
            // making it ON by default.
            // Set explicitly ON anyway as redundancy
            database.pragma('foreign_keys = ON')
            return new Kysely<DB>({
                dialect: new SqliteDialect({
                    database,
                }),
                plugins: [new CamelCasePlugin()],
            })
        case 'postgres':
            return new Kysely<DB>({
                dialect: new PostgresDialect({
                    pool: new pg.Pool({
                        database: config.connection.database,
                        user: config.connection.user,
                        password: config.connection.password,
                        port: config.connection.port,
                        host: config.connection.host,
                    }),
                }),
                plugins: [new CamelCasePlugin()],
            })
        case 'memory':
            database = new Database(':memory:')
            database.pragma('foreign_keys = ON')
            return new Kysely<DB>({
                dialect: new SqliteDialect({
                    database,
                }),
                plugins: [new CamelCasePlugin()],
            })
    }
}
