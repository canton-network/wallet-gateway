// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { SDKLogger } from './logger/logger.js'
import { SDKErrorHandler } from './error/handler.js'
import {
    AbstractLedgerProvider,
    LedgerProvider,
    Ops,
} from '@canton-network/core-provider-ledger'
import { AcsReader } from '@canton-network/core-acs-reader'
import {
    EXTENDED_SDK_OPTION_KEYS,
    ExtendedSDKOptions,
    BasicSDKOptions,
    OfflineSDKInterface,
    GetExtendedKeys,
    SDKInterface,
} from './init/types/sdk.js'
import { AuthTokenProvider } from '@canton-network/core-wallet-auth'
import { toURL } from './common.js'
import {
    ExtendedInitializedSDK,
    OfflineInitializedSDK,
} from './init/initializedSDK.js'
import {
    LedgerTypes as LedgerRpc,
    type LedgerCommonSchemas,
} from '@canton-network/core-ledger-client-types'
import { AllowedLogAdapters } from './logger/types.js'
import { DappLedgerRpc } from '@canton-network/core-provider-dapp'
export * from './namespace/asset/index.js'
export type * from './namespace/token/index.js'
export type * from './namespace/amulet/index.js'
export { type TokenProviderConfig } from '@canton-network/core-wallet-auth'
export { LedgerProvider } from '@canton-network/core-provider-ledger'
export { type Event } from './namespace/events/index.js'
export {
    signTransactionHash,
    getPublicKeyFromPrivate,
} from '@canton-network/core-signing-lib'
export type LedgerTypes = LedgerCommonSchemas

export type SDKContext = {
    ledgerProvider: AbstractLedgerProvider
    acsReader: AcsReader
    userId: string
    logger: SDKLogger
    error: SDKErrorHandler
    defaultSynchronizerId: string
}

export type OfflineSDKContext = {
    logger: SDKLogger
    error: SDKErrorHandler
}

export type * from './init/index.js'
export { PrepareOptions, ExecuteOptions } from './namespace/ledger/index.js'
export * from './namespace/transactions/prepared.js'
export * from './namespace/transactions/signed.js'

export class SDK {
    static async create<
        L extends LedgerRpc = DappLedgerRpc,
        Options extends BasicSDKOptions<L> & Partial<ExtendedSDKOptions> =
            BasicSDKOptions<L> & Partial<ExtendedSDKOptions>,
    >(options: Options): Promise<SDKInterface<GetExtendedKeys<Options>>> {
        const logger = new SDKLogger(options.logAdapter ?? 'pino')
        const error = new SDKErrorHandler(logger)
        let authTokenProvider: AuthTokenProvider | undefined

        const ledgerProvider =
            'ledgerProvider' in options
                ? (options.ledgerProvider as AbstractLedgerProvider)
                : (() => {
                      authTokenProvider = new AuthTokenProvider(
                          options.auth,
                          logger
                      )

                      const ledgerApiUrl = toURL(options.ledgerClientUrl, error)
                      return new LedgerProvider({
                          baseUrl: ledgerApiUrl,
                          accessTokenProvider: authTokenProvider,
                      })
                  })()

        const authenticatedUser = await ledgerProvider
            .request<Ops.GetV2AuthenticatedUser>({
                method: 'ledgerApi',
                params: {
                    requestMethod: 'get',
                    resource: '/v2/authenticated-user',
                    query: {},
                },
            })
            .catch((err) => {
                if (
                    //this is only the cause if authentication is completely disabled on the ledger.
                    err.cause.contains(
                        'the submitted request is missing a user-id'
                    )
                ) {
                    return undefined
                } else throw err
            })

        const userIdFromAuthContext =
            !authenticatedUser?.user?.id && authTokenProvider
                ? await authTokenProvider
                      .getAuthContext()
                      .then((authContext) => authContext.userId)
                      .catch(() => undefined)
                : undefined

        const userId = authenticatedUser?.user?.id ?? userIdFromAuthContext
        if (!userId) {
            error.throw({
                message: 'Not an authenticated user',
                type: 'Unauthenticated',
            })
        }

        const defaultSynchronizerId = await getDefaultSynchronizerId(
            ledgerProvider,
            logger
        )

        const acsReader = new AcsReader(ledgerProvider)

        const ctx: SDKContext = {
            ledgerProvider,
            acsReader,
            userId: userId!,
            logger,
            error,
            defaultSynchronizerId,
        }

        const config = {} as Pick<
            ExtendedSDKOptions,
            GetExtendedKeys<typeof options>
        >

        Object.entries(options).forEach(([item, value]) => {
            if (EXTENDED_SDK_OPTION_KEYS.some((k) => k === item) && value) {
                Object.defineProperty(config, item, {
                    value,
                    enumerable: true,
                })
            }
        })

        return await ExtendedInitializedSDK.create(ctx, config)
    }

    /**
     * @param options logAdapter to use for logging output
     * @returns An OfflineSdkInterface that has namespaces initialized that don't require any external connectivity
     */
    static createOffline(options?: {
        logAdapter?: AllowedLogAdapters
    }): OfflineSDKInterface {
        const logger = new SDKLogger(options?.logAdapter ?? 'pino')
        const error = new SDKErrorHandler(logger)
        return new OfflineInitializedSDK({ logger, error })
    }
}

async function getDefaultSynchronizerId(
    provider: AbstractLedgerProvider,
    logger: SDKLogger
) {
    const connectedSynchronizers =
        await provider.request<Ops.GetV2StateConnectedSynchronizers>({
            method: 'ledgerApi',
            params: {
                resource: '/v2/state/connected-synchronizers',
                requestMethod: 'get',
                query: {},
            },
        })

    if (!connectedSynchronizers.connectedSynchronizers?.[0]) {
        throw new Error('No connected synchronizers found')
    }

    const defaultSynchronizerId =
        connectedSynchronizers.connectedSynchronizers[0].synchronizerId
    if (connectedSynchronizers.connectedSynchronizers.length > 1) {
        logger.warn(
            `Found ${connectedSynchronizers.connectedSynchronizers.length} synchronizers, defaulting to ${defaultSynchronizerId}`
        )
    }

    return defaultSynchronizerId
}
