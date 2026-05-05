// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { dapp } from './dapp-api/server.js'
import { user } from './user-api/server.js'
import { web } from './web/server.js'
import { Logger } from 'pino'
import {
    StoreSql,
    bootstrap,
    connection,
    migrator,
} from '@canton-network/core-wallet-store-sql'
import {
    StoreSql as SigningStoreSql,
    bootstrap as signingBootstrap,
    connection as signingConnection,
    migrator as signingMigrator,
} from '@canton-network/core-signing-store-sql'
import { ConfigUtils } from './config/ConfigUtils.js'
import {
    SigningDriverInterface,
    SigningProvider,
} from '@canton-network/core-signing-lib'
import { ParticipantSigningDriver } from '@canton-network/core-signing-participant'
import { InternalSigningDriver } from '@canton-network/core-signing-internal'
import DfnsSigningProvider from '@canton-network/core-signing-dfns'
import FireblocksSigningProvider from '@canton-network/core-signing-fireblocks'
import BlockdaemonSigningProvider, {
    CantonCaip2,
} from '@canton-network/core-signing-blockdaemon'
import { jwtAuthService } from './auth/jwt-auth-service.js'
import express from 'express'
import { CliOptions } from './index.js'
import { jwtAuth } from './middleware/jwtAuth.js'
import {
    authenticatedRateLimiter,
    preAuthIpRateLimiter,
    rateLimiter,
} from './middleware/rateLimit.js'
import { Config } from './config/Config.js'
import { deriveUrls } from './config/ConfigUtils.js'
import { existsSync } from 'fs'
import { GATEWAY_VERSION } from './version.js'
import { sessionHandler } from './middleware/sessionHandler.js'
import { NotificationService } from './notification/NotificationService.js'
import { sql } from 'kysely'
import { Env } from './env.js'

let isReady = false

async function initializeDatabase(
    config: Config,
    logger: Logger
): Promise<StoreSql> {
    logger.info('Checking for database migrations...')

    let exists = true
    if (config.store.connection.type === 'sqlite') {
        exists = existsSync(config.store.connection.database)
    }

    if (config.store.connection.type === 'postgres') {
        const db = connection({
            ...config.store,
            connection: { ...config.store.connection, database: 'postgres' },
        })
        const result = await sql
            .raw<{
                '?column?': number
            }>(
                `select 1 from pg_database where datname='${config.store.connection.database}';`
            )
            .execute(db)
        const databaseExist = result.rows.length > 0
        if (!databaseExist) {
            // Ignore error because postgres does not support `create database if nor exists` clause
            await sql
                .raw(`create database ${config.store.connection.database};`)
                .execute(db)
                .catch(() => {})
            exists = false
        }
        await db.destroy()
    }

    const db = connection(config.store)
    const umzug = migrator(db)
    const pending = await umzug.pending()

    if (pending.length > 0) {
        logger.info(
            { pendingMigrations: pending.map((m) => m.name) },
            'Applying database migrations...'
        )
        await umzug.up()
        logger.info('Database migrations applied successfully.')
    } else {
        logger.info('No pending database migrations found.')
    }

    // bootstrap database from config file if it did not exist before
    if (!exists) {
        logger.info('Bootstrapping database from config...')
        await bootstrap(db, config.bootstrap, logger)
    }

    return new StoreSql(db, logger)
}

async function initializeSigningDatabase(
    config: Config,
    logger: Logger
): Promise<SigningStoreSql> {
    logger.info('Checking for signing database migrations...')

    let exists = true
    if (config.signingStore.connection.type === 'sqlite') {
        exists = existsSync(config.signingStore.connection.database)
    }

    if (config.signingStore.connection.type === 'postgres') {
        const db = signingConnection({
            ...config.signingStore,
            connection: {
                ...config.signingStore.connection,
                database: 'postgres',
            },
        })
        const result = await sql
            .raw<{
                '?column?': number
            }>(
                `select 1 from pg_database where datname='${config.signingStore.connection.database}';`
            )
            .execute(db)
        const databaseExist = result.rows.length > 0
        if (!databaseExist) {
            // Ignore error because postgres does not support `create database if nor exists` clause
            await sql
                .raw(
                    `create database ${config.signingStore.connection.database};`
                )
                .execute(db)
                .catch(() => {})
            exists = false
        }
        await db.destroy()
    }

    const db = signingConnection(config.signingStore)
    const umzug = signingMigrator(db)
    const pending = await umzug.pending()

    if (pending.length > 0) {
        logger.info(
            { pendingMigrations: pending.map((m) => m.name) },
            'Applying database migrations...'
        )
        await umzug.up()
        logger.info('Database migrations applied successfully.')
    } else {
        logger.info('No pending database migrations found.')
    }

    // bootstrap database from config file if it did not exist before
    if (!exists) {
        logger.info('Bootstrapping signing database from config...')
        await signingBootstrap(db, config.signingStore, logger)
    }

    return new SigningStoreSql(db, logger)
}

export async function initialize(opts: CliOptions, logger: Logger) {
    const config = ConfigUtils.loadConfigFile(opts.config)

    // Use CLI port override or config port
    const port = opts.port ? Number(opts.port) : config.server.port
    const { serviceUrl, publicUrl, dappApiUrl, userApiUrl } = deriveUrls(
        config,
        port
    )

    const app = express()
    app.set('trust proxy', config.server.trustProxy)

    const server = app.listen(port, () => {
        logger.info(`Remote Wallet Gateway starting on ${serviceUrl})`)
    })
    app.use(express.json({ limit: config.server.requestSizeLimit }))

    const preAuthRateLimit = preAuthIpRateLimiter(
        config.server.requestRateLimit
    )
    const postAuthRateLimit = authenticatedRateLimiter(
        config.server.requestRateLimit
    )
    const healthCheckRateLimit = rateLimiter(1000) // Allow more requests for health checks

    app.use('/healthz', healthCheckRateLimit, (_req, res) =>
        res.status(200).send('OK')
    )
    app.use('/readyz', healthCheckRateLimit, (_req, res) => {
        if (isReady) {
            res.status(200).send('OK')
        } else {
            res.status(503).send('UNAVAILABLE')
        }
    })

    const notificationService = new NotificationService(logger)

    const store = await initializeDatabase(config, logger)
    const signingStore = await initializeSigningDatabase(config, logger)
    const authService = jwtAuthService(store, logger)

    let apiKey = Env.FIREBLOCKS_API_KEY()
    let apiSecret = Env.FIREBLOCKS_SECRET()

    if (!apiKey || !apiSecret) {
        apiKey = 'missing'
        apiSecret = 'missing'
        logger.warn('Fireblocks key files are missing')
    }

    const keyInfo = { apiKey, apiSecret }
    const userApiKeys = new Map([['user', keyInfo]])

    const drivers: Partial<Record<SigningProvider, SigningDriverInterface>> = {
        [SigningProvider.PARTICIPANT]: new ParticipantSigningDriver(),
        [SigningProvider.WALLET_KERNEL]: new InternalSigningDriver(
            signingStore
        ),
        [SigningProvider.FIREBLOCKS]: new FireblocksSigningProvider({
            defaultKeyInfo: keyInfo,
            userApiKeys,
        }),
        [SigningProvider.BLOCKDAEMON]: new BlockdaemonSigningProvider({
            baseUrl: Env.BLOCKDAEMON_API_URL(
                'http://localhost:5080/api/cwp/canton'
            ),
            apiKey: Env.BLOCKDAEMON_API_KEY(''),
            caip2: Env.BLOCKDAEMON_CAIP2('canton:testnet') as CantonCaip2,
        }),
    }

    if (
        Env.DFNS_ORG_ID() &&
        Env.DFNS_CRED_ID() &&
        Env.DFNS_PRIVATE_KEY() &&
        Env.DFNS_AUTH_TOKEN()
    ) {
        drivers[SigningProvider.DFNS] = new DfnsSigningProvider({
            orgId: Env.DFNS_ORG_ID()!,
            baseUrl: Env.DFNS_BASE_URL('https://api.dfns.io'),
            credentials: {
                credId: Env.DFNS_CRED_ID()!,
                privateKey: Env.DFNS_PRIVATE_KEY()!,
                authToken: Env.DFNS_AUTH_TOKEN()!,
            },
        })
    } else {
        logger.warn(
            'Dfns env vars not fully set — Dfns signing provider will be unavailable'
        )
    }

    const allowedPaths = {
        [config.server.dappPath]: ['*'],
        [config.server.userPath]: [
            'addSession',
            'listNetworks',
            'listIdps',
            'getUser',
        ],
    }

    app.use('/api/*splat', express.json())
    app.use('/api/*splat', preAuthRateLimit)
    app.use(
        '/api/*splat',
        jwtAuth(authService, logger.child({ component: 'JwtHandler' }))
    )
    app.use('/api/*splat', postAuthRateLimit)
    app.use(
        '/api/*splat',
        sessionHandler(
            store,
            allowedPaths,
            logger.child({ component: 'SessionHandler' })
        )
    )

    logger.info({ ...config.server, port }, 'Server configuration')

    const kernelInfo = config.kernel

    // register dapp API handlers
    dapp(
        config.server.dappPath,
        app,
        logger,
        server,
        kernelInfo,
        dappApiUrl,
        publicUrl,
        config.server,
        notificationService,
        authService,
        store
    )

    // register user API handlers
    user(
        config.server.userPath,
        app,
        logger,
        kernelInfo,
        publicUrl,
        notificationService,
        drivers,
        store,
        config.server.admin
    )

    // register web handler
    web(app, server, userApiUrl)
    isReady = true

    logger.info(
        `Wallet Gateway (version: ${GATEWAY_VERSION}) initialization complete`
    )
    logger.info(`Wallet Gateway UI available on ${publicUrl}`)
    logger.info(`dApp API available on ${dappApiUrl}`)
}
