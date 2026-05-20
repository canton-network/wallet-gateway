// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { type Logger, pino } from 'pino'
import { LedgerClient } from '@canton-network/core-ledger-client'
import { TokenStandardService } from '@canton-network/core-token-standard-service'
import { AmuletService } from '@canton-network/core-amulet-service'
import { TokenStandardClient } from '@canton-network/core-token-standard'
import { ScanProxyClient } from '@canton-network/core-splice-client'
import { TransactionHistoryService } from './transaction-history-service'
import type { LedgerProvider } from '@canton-network/core-provider-ledger'
import {
    AuthTokenProvider,
    type AccessTokenProvider,
} from '@canton-network/core-wallet-auth'

// This module allows us to resolve (i.e. get an instance of) the different
// dependency services used throughout the project.

const resolveLedgerProvider = () => {
    if (window.canton) {
        return window.canton as unknown as LedgerProvider
    } else {
        throw new Error('window.canton is not available')
    }
}

const createTokenStandardClient = async ({
    logger,
    registryUrl,
    accessTokenProvider,
}: {
    logger: Logger
    registryUrl: string
    accessTokenProvider?: AccessTokenProvider
}): Promise<TokenStandardClient> => {
    return new TokenStandardClient(
        registryUrl,
        logger,
        accessTokenProvider ?? defaultAccessTokenProvider({ logger }) // access token provider
    )
}

const createTokenStandardService = async ({
    logger,
    accessTokenProvider,
}: {
    logger: Logger
    accessTokenProvider?: AccessTokenProvider
}): Promise<TokenStandardService> => {
    const provider = resolveLedgerProvider()

    const tokenStandardService = new TokenStandardService(
        provider,
        logger,
        accessTokenProvider ?? defaultAccessTokenProvider({ logger }), // access token provider
        false // isMasterUser
    )
    return tokenStandardService
}

const DEFAULT_SCAN_PROXY_URL = 'http://localhost:2000/api/validator'

const resolveScanProxyUrl = (): URL => {
    const scanProxyUrl = new URL(
        import.meta.env.VITE_SCAN_PROXY_URL ?? DEFAULT_SCAN_PROXY_URL
    )

    if (scanProxyUrl.protocol === 'http:') {
        logger.warn(
            { scanProxyUrl: scanProxyUrl.toString() },
            'Using a non-TLS scan proxy endpoint. This is acceptable only in trusted environments. Set VITE_SCAN_PROXY_URL to an HTTPS endpoint if the scan proxy is reachable over an untrusted network.'
        )
    }

    return scanProxyUrl
}

const createAmuletService = async ({
    sessionToken,
    tokenStandardService,
}: {
    sessionToken: string
    tokenStandardService: TokenStandardService
}): Promise<AmuletService> => {
    const scanProxyClient = new ScanProxyClient(
        resolveScanProxyUrl(),
        logger,
        AuthTokenProvider.fromToken(sessionToken, logger)
    )
    return new AmuletService(tokenStandardService, scanProxyClient, undefined)
}

// Global, but so is the dApp SDK.
const logger = pino({ name: 'example-portfolio', level: 'debug' })
const ledgerClient: { singleton: LedgerClient | undefined } = {
    singleton: undefined,
}
const tokenStandardClients = new Map()
const tokenStandardService: { singleton: TokenStandardService | undefined } = {
    singleton: undefined,
}
const amuletServices = new Map()
const transactionHistoryServices = new Map()

// Can be called to reset clients on disconnects.
export const clear = () => {
    ledgerClient.singleton = undefined
    tokenStandardClients.clear()
    tokenStandardService.singleton = undefined
    amuletServices.clear()
    transactionHistoryServices.clear()
}

export const resolveTokenStandardClient = async ({
    registryUrl,
}: {
    registryUrl: string
}): Promise<TokenStandardClient> => {
    const key = registryUrl
    if (tokenStandardClients.has(key)) return tokenStandardClients.get(key)
    const client = await createTokenStandardClient({ logger, registryUrl })
    tokenStandardClients.set(key, client)
    return client
}

export const resolveTokenStandardService =
    async (): Promise<TokenStandardService> => {
        if (!tokenStandardService.singleton) {
            tokenStandardService.singleton = await createTokenStandardService({
                logger,
            })
        }
        return tokenStandardService.singleton
    }

export const resolveAmuletService = async ({
    sessionToken, // todo: scan URLs?
}: {
    sessionToken: string
}): Promise<AmuletService> => {
    const key = sessionToken
    if (amuletServices.has(key)) return amuletServices.get(key)
    const tokenStandardService = await resolveTokenStandardService()
    const amuletService = await createAmuletService({
        sessionToken,
        tokenStandardService,
    })
    amuletServices.set(key, amuletService)
    return amuletService
}

export const resolveTransactionHistoryService = async ({
    party,
}: {
    party: string
}): Promise<TransactionHistoryService> => {
    const key = party
    const provider = resolveLedgerProvider()

    if (transactionHistoryServices.has(key))
        return transactionHistoryServices.get(key)

    const transactionHistoryService = new TransactionHistoryService({
        logger,
        provider,
        party,
    })
    transactionHistoryServices.set(key, transactionHistoryService)
    return transactionHistoryService
}

export const defaultAccessTokenProvider: (deps: {
    logger: Logger
}) => AccessTokenProvider = ({ logger }) => {
    return new AuthTokenProvider(
        {
            method: 'self_signed',
            issuer: 'unsafe-auth',
            credentials: {
                clientId: 'ledger-api-user',
                clientSecret: 'unsafe',
                audience: 'https://canton.network.global',
                scope: '',
            },
        },
        logger
    )
}
