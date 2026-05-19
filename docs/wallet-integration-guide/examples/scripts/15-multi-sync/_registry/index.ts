// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * TestToken Registry — entry point.
 *
 * Wires the HTTP router, all feature-slice route handlers, and the ledger client
 * into a single `startRegistry()` factory that is called from the example's
 * initialization phase once the tokenAdmin party ID is known.
 *
 * Implements all four Token Standard off-ledger registry APIs:
 *   api-specs/splice/0.6.1/token-metadata-v1.yaml
 *   api-specs/splice/0.6.1/transfer-instruction-v1.yaml
 *   api-specs/splice/0.6.1/allocation-v1.yaml
 *   api-specs/splice/0.6.1/allocation-instruction-v1.yaml
 */

import {
    createServer,
    type IncomingMessage,
    type ServerResponse,
} from 'node:http'
import type { Logger } from 'pino'
import { buildLedgerClient, readTokenRules } from './ledger.js'
import type { LedgerClient } from '@canton-network/core-ledger-client'
import type { TokenRulesContract } from './ledger.js'
import { createRouter, respond, readBody } from './http/router.js'
import type {
    GetFactoryRequest,
    GetChoiceContextRequest,
    SubmitAsTokenAdmin,
} from './types.js'
import { createMetadataHandlers } from './features/metadata/handlers.js'
import { createTransferHandlers } from './features/transfer/handlers.js'
import { createAllocationInstructionHandlers } from './features/allocation-instruction/handlers.js'
import { createAllocationHandlers } from './features/allocation/handlers.js'
import { createAdminHandlers } from './features/admin/handlers.js'

// ── static instrument metadata ─────────────────────────────────────────────
const TEST_TOKEN_INSTRUMENT_ID = 'TestToken'

const SUPPORTED_APIS: Record<string, number> = {
    'splice-api-token-metadata-v1': 0,
    'splice-api-token-transfer-instruction-v1': 1,
    'splice-api-token-allocation-instruction-v1': 0,
    'splice-api-token-allocation-v1': 1,
}

// ── Route table (source of truth: api-specs/splice/0.6.1/) ────────────────
interface RouteEntry {
    method: string
    pattern: string
    operationId: string
    nullable?: boolean
}

const ROUTES: RouteEntry[] = [
    // token-metadata-v1
    {
        method: 'GET',
        pattern: '/registry/metadata/v1/info',
        operationId: 'getRegistryInfo',
    },
    {
        method: 'GET',
        pattern: '/registry/metadata/v1/instruments',
        operationId: 'listInstruments',
    },
    {
        method: 'GET',
        pattern: '/registry/metadata/v1/instruments/:instrumentId',
        operationId: 'getInstrument',
        nullable: true,
    },
    // transfer-instruction-v1
    {
        method: 'POST',
        pattern: '/registry/transfer-instruction/v1/transfer-factory',
        operationId: 'getTransferFactory',
        nullable: true,
    },
    {
        method: 'POST',
        pattern:
            '/registry/transfer-instruction/v1/:transferInstructionId/choice-contexts/accept',
        operationId: 'getTransferInstructionAcceptContext',
    },
    {
        method: 'POST',
        pattern:
            '/registry/transfer-instruction/v1/:transferInstructionId/choice-contexts/reject',
        operationId: 'getTransferInstructionRejectContext',
    },
    {
        method: 'POST',
        pattern:
            '/registry/transfer-instruction/v1/:transferInstructionId/choice-contexts/withdraw',
        operationId: 'getTransferInstructionWithdrawContext',
    },
    // allocation-instruction-v1
    {
        method: 'POST',
        pattern: '/registry/allocation-instruction/v1/allocation-factory',
        operationId: 'getAllocationFactory',
        nullable: true,
    },
    // admin
    {
        method: 'POST',
        pattern: '/admin/v1/setup',
        operationId: 'adminSetupTokenRules',
    },
    {
        method: 'POST',
        pattern: '/admin/v1/mint',
        operationId: 'adminMintToken',
    },
    // allocation-v1
    {
        method: 'POST',
        pattern:
            '/registry/allocations/v1/:allocationId/choice-contexts/execute-transfer',
        operationId: 'getAllocationTransferContext',
    },
    {
        method: 'POST',
        pattern:
            '/registry/allocations/v1/:allocationId/choice-contexts/withdraw',
        operationId: 'getAllocationWithdrawContext',
    },
    {
        method: 'POST',
        pattern:
            '/registry/allocations/v1/:allocationId/choice-contexts/cancel',
        operationId: 'getAllocationCancelContext',
    },
]
export interface RegistryConfig {
    tokenAdminPartyId: string
    port: number
    ledgerUrl: URL
    logger: Logger
    globalSynchronizerId: string
    appSynchronizerId: string

    submitAsTokenAdmin: SubmitAsTokenAdmin
}

export interface RegistryHandle {
    stop(): Promise<void>
}

/**
 * Starts the TestToken registry HTTP server.
 *
 * @param config - Runtime configuration (party ID, port, ledger URL, logger).
 * @returns A handle with a `stop()` method for graceful shutdown.
 */
export async function startRegistry(
    config: RegistryConfig
): Promise<RegistryHandle> {
    const {
        tokenAdminPartyId,
        port,
        ledgerUrl,
        logger,
        globalSynchronizerId,
        appSynchronizerId,
        submitAsTokenAdmin,
    } = config

    const ledgerClient: LedgerClient = buildLedgerClient(ledgerUrl, logger)

    async function getTokenRules(
        synchronizerId?: string
    ): Promise<TokenRulesContract | null> {
        const all = await readTokenRules(
            ledgerClient,
            tokenAdminPartyId,
            logger
        )
        if (all.length === 0) return null
        if (!synchronizerId) return all[0]!
        return all.find((c) => c.synchronizerId === synchronizerId) ?? all[0]!
    }

    const metadata = createMetadataHandlers({
        tokenAdminPartyId,
        supportedApis: SUPPORTED_APIS,
        instrumentId: TEST_TOKEN_INSTRUMENT_ID,
    })
    const transfer = createTransferHandlers({
        getTokenRules,
        appSynchronizerId,
    })
    const allocInstr = createAllocationInstructionHandlers({
        getTokenRules,
        globalSynchronizerId,
    })
    const alloc = createAllocationHandlers()
    const admin = createAdminHandlers({
        tokenAdminPartyId,
        globalSynchronizerId,
        appSynchronizerId,
        submitAsTokenAdmin,
    })

    // Dispatch map: operationId → (params, body) → Promise<result | null>
    type DispatchFn = (
        params: Record<string, string>,
        body: unknown
    ) => Promise<unknown>
    const dispatch = new Map<string, DispatchFn>([
        // Metadata
        ['getRegistryInfo', async () => metadata.getRegistryInfo()],
        ['listInstruments', async () => metadata.listInstruments()],
        [
            'getInstrument',
            async (p) =>
                metadata.getInstrument({ instrumentId: p['instrumentId']! }),
        ],
        // Transfer
        [
            'getTransferFactory',
            async (_, b) => transfer.getTransferFactory(b as GetFactoryRequest),
        ],
        [
            'getTransferInstructionAcceptContext',
            async (p, b) =>
                transfer.getTransferInstructionAcceptContext(
                    { transferInstructionId: p['transferInstructionId']! },
                    b as GetChoiceContextRequest
                ),
        ],
        [
            'getTransferInstructionRejectContext',
            async (p, b) =>
                transfer.getTransferInstructionRejectContext(
                    { transferInstructionId: p['transferInstructionId']! },
                    b as GetChoiceContextRequest
                ),
        ],
        [
            'getTransferInstructionWithdrawContext',
            async (p, b) =>
                transfer.getTransferInstructionWithdrawContext(
                    { transferInstructionId: p['transferInstructionId']! },
                    b as GetChoiceContextRequest
                ),
        ],
        // Admin
        [
            'adminSetupTokenRules',
            async () => {
                await admin.setupTokenRules()
                return {}
            },
        ],
        [
            'adminMintToken',
            async (_, b) => {
                await admin.mintToken(b as { amount: string })
                return {}
            },
        ],
        // Allocation Instruction
        [
            'getAllocationFactory',
            async (_, b) =>
                allocInstr.getAllocationFactory(b as GetFactoryRequest),
        ],
        // Allocation
        [
            'getAllocationTransferContext',
            async (p, b) =>
                alloc.getAllocationTransferContext(
                    { allocationId: p['allocationId']! },
                    b as GetChoiceContextRequest
                ),
        ],
        [
            'getAllocationWithdrawContext',
            async (p, b) =>
                alloc.getAllocationWithdrawContext(
                    { allocationId: p['allocationId']! },
                    b as GetChoiceContextRequest
                ),
        ],
        [
            'getAllocationCancelContext',
            async (p, b) =>
                alloc.getAllocationCancelContext(
                    { allocationId: p['allocationId']! },
                    b as GetChoiceContextRequest
                ),
        ],
    ])

    const { route, matchRoute } = createRouter()
    for (const { method, pattern, operationId, nullable = false } of ROUTES) {
        route(method, pattern, async (_req, res, body, params) => {
            const fn = dispatch.get(operationId)!
            const result = await fn(params, body)
            if (nullable && result === null) {
                respond(res, 404, { error: `${operationId}: not found` })
            } else {
                respond(res, 200, result)
            }
        })
    }

    const server = createServer(
        async (req: IncomingMessage, res: ServerResponse) => {
            const url = new URL(req.url ?? '/', 'http://localhost')
            const method = req.method?.toUpperCase() ?? 'GET'
            const pathname = url.pathname

            logger.debug({ method, pathname }, 'incoming request')

            try {
                const match = matchRoute(method, pathname)
                if (!match) {
                    respond(res, 404, {
                        error: `${method} ${pathname} not found`,
                    })
                    return
                }
                const body =
                    method === 'POST' || method === 'PUT'
                        ? await readBody(req)
                        : {}
                await match.handler(req, res, body, match.params)
            } catch (err) {
                logger.error(err, 'request handler error')
                if (!res.headersSent) {
                    respond(res, 500, {
                        error: err instanceof Error ? err.message : String(err),
                    })
                }
            }
        }
    )

    await new Promise<void>((resolve) => server.listen(port, resolve))

    logger.info(
        { port, tokenAdminPartyId, ledgerUrl: ledgerUrl.href },
        'TestToken registry server started'
    )
    logger.info(`  GET  http://localhost:${port}/registry/metadata/v1/info`)
    logger.info(
        `  GET  http://localhost:${port}/registry/metadata/v1/instruments`
    )
    logger.info(
        `  POST http://localhost:${port}/registry/transfer-instruction/v1/transfer-factory`
    )
    logger.info(
        `  POST http://localhost:${port}/registry/allocation-instruction/v1/allocation-factory`
    )

    return {
        stop(): Promise<void> {
            return new Promise<void>((resolve, reject) =>
                server.close((err) => (err ? reject(err) : resolve()))
            )
        },
    }
}
