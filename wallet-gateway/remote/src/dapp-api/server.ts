// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import express from 'express'
import cors from 'cors'
import { dappController } from './controller.js'
import { Logger } from 'pino'
import { jsonRpcHandler } from '../middleware/jsonRpcHandler.js'
import { Methods } from './rpc-gen/index.js'
import { Store } from '@canton-network/core-wallet-store'
import { AuthService, AuthAware } from '@canton-network/core-wallet-auth'
import { Server } from 'http'
import { NotificationService } from '../notification/NotificationService.js'
import { KernelInfo, ServerConfig } from '../config/Config.js'

function writeSSE(res: express.Response, event: string, data: unknown): void {
    res.write(`event: ${event}\n`)
    res.write(`data: ${JSON.stringify(data)}\n\n`)
}

export const dapp = (
    route: string,
    app: express.Express,
    logger: Logger,
    server: Server,
    kernelInfo: KernelInfo,
    dappUrl: string,
    userUrl: string,
    serverConfig: ServerConfig,
    notificationService: NotificationService,
    authService: AuthService,
    store: Store & AuthAware<Store>
) => {
    app.use(
        cors({
            origin: serverConfig.allowedOrigins,
        })
    )

    // SSE endpoint for real-time notifications (must be registered before the JSON-RPC route)
    app.get(`${route}/events`, async (req, res) => {
        const context = req.authContext
        if (!context) {
            res.status(401).json({ error: 'Unauthenticated' })
            return
        }

        const newStore = store.withAuthContext(context)
        const session = await newStore.getSession()
        const sessionId = session?.id

        if (!sessionId) {
            res.status(401).json({ error: 'No session' })
            return
        }

        logger.debug(
            `SSE connected for user: ${context.userId} with session ID: ${sessionId}`
        )

        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')
        res.setHeader('X-Accel-Buffering', 'no')
        res.flushHeaders?.()

        const notifier = notificationService.getNotifier(context.userId)

        const onAccountsChanged = (...event: unknown[]) => {
            writeSSE(res, 'accountsChanged', event)
        }
        const onStatusChanged = (...event: unknown[]) => {
            logger.debug({ sessionId }, 'Emitting statusChanged event via SSE')
            writeSSE(res, 'statusChanged', event)
        }
        const onConnected = (...event: unknown[]) => {
            writeSSE(res, 'connected', event)
        }
        const onTxChanged = (...event: unknown[]) => {
            writeSSE(res, 'txChanged', event)
        }
        const onMessageSignature = (...event: unknown[]) => {
            writeSSE(res, 'messageSignature', event)
        }

        notifier.on('accountsChanged', onAccountsChanged)
        notifier.on('connected', onConnected)
        notifier.on('statusChanged', onStatusChanged)
        notifier.on('txChanged', onTxChanged)
        notifier.on('messageSignature', onMessageSignature)

        const cleanup = () => {
            logger.debug('SSE client disconnected')
            notifier.removeListener('accountsChanged', onAccountsChanged)
            notifier.removeListener('connected', onConnected)
            notifier.removeListener('statusChanged', onStatusChanged)
            notifier.removeListener('txChanged', onTxChanged)
            notifier.removeListener('messageSignature', onMessageSignature)
        }

        req.on('close', cleanup)
        req.on('error', cleanup)
    })

    app.use(route, (req, res, next) => {
        const origin: string | null = req.headers.origin ?? null

        jsonRpcHandler<Methods>({
            controller: dappController(
                kernelInfo,
                dappUrl,
                userUrl,
                store.withAuthContext(req.authContext),
                notificationService,
                logger,
                origin,
                req.authContext
            ),
            logger,
        })(req, res, next)
    })

    return server
}
