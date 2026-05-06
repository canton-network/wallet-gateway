// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

// Actual server acting as mock wallet using HTTP with SSE transport for testing CIP-0103 async API.

import * as http from 'node:http'
import {
    handleMockJsonRpc,
    MOCK_DAPP_API_PATH,
    MOCK_SSE_PUSH_PATH,
} from './json-rpc-handlers'

const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
} as const

type HttpMethod = 'GET' | 'POST'

type RouteHandler = (
    req: http.IncomingMessage,
    res: http.ServerResponse
) => void | Promise<void>

type Routes = Record<string, Partial<Record<HttpMethod, RouteHandler>>>

function sendJson(
    res: http.ServerResponse,
    status: number,
    body: unknown
): void {
    res.writeHead(status, {
        ...cors,
        'Content-Type': 'application/json; charset=utf-8',
    })
    res.end(JSON.stringify(body))
}

function sendText(
    res: http.ServerResponse,
    status: number,
    text: string
): void {
    res.writeHead(status, { ...cors, 'Content-Type': 'text/plain' })
    res.end(text)
}

function readBody(req: http.IncomingMessage): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = []
        req.on('data', (c) => chunks.push(c))
        req.on('end', () => resolve(Buffer.concat(chunks)))
        req.on('error', reject)
    })
}

function createRoutes(
    rpcBase: string,
    sseClients: Set<http.ServerResponse>
): Routes {
    const eventsPath = `${MOCK_DAPP_API_PATH}/events`

    return {
        [MOCK_DAPP_API_PATH]: {
            POST: async (req, res): Promise<void> => {
                try {
                    const raw = (await readBody(req)).toString('utf8')
                    const body = JSON.parse(raw) as {
                        id: string | number | null
                        method: string
                        params?: unknown
                    }
                    const { status, json } = handleMockJsonRpc(rpcBase, body)
                    sendJson(res, status, json)
                } catch {
                    sendJson(res, 400, {
                        jsonrpc: '2.0',
                        id: null,
                        error: { code: -32700, message: 'Parse error' },
                    })
                }
            },
        },

        // SSE stream the dApp subscribes to for txChanged and statusChanged.
        [eventsPath]: {
            GET: (req, res): void => {
                sseClients.add(res)
                res.writeHead(200, {
                    ...cors,
                    'Content-Type': 'text/event-stream; charset=utf-8',
                    'Cache-Control': 'no-cache',
                    Connection: 'keep-alive',
                })
                res.write(':ok\n\n')
                // Prevent closing SSE stream
                const keepAlive = setInterval(() => {
                    res.write(':ok\n\n')
                }, 15000)
                req.on('close', () => {
                    clearInterval(keepAlive)
                    sseClients.delete(res)
                })
            },
        },

        // Lets tests push SSE like txChanged on demand.
        [MOCK_SSE_PUSH_PATH]: {
            POST: async (req, res): Promise<void> => {
                try {
                    const raw = (await readBody(req)).toString('utf8')
                    const { event, data } = JSON.parse(raw) as {
                        event: string
                        data: unknown
                    }
                    const frame = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
                    for (const client of sseClients) {
                        try {
                            client.write(frame)
                        } catch {
                            // client may have closed
                        }
                    }
                    sendJson(res, 200, { ok: true })
                } catch {
                    sendJson(res, 400, {
                        error: 'invalid JSON or missing event/data',
                    })
                }
            },
        },
    }
}

export function startMockRemoteGateway(port: number): Promise<{
    rpcBase: string
    server: http.Server
}> {
    const host = '127.0.0.1'
    const rpcBase = `http://${host}:${port}`
    const baseUrl = rpcBase
    const sseClients = new Set<http.ServerResponse>()
    const routes = createRoutes(rpcBase, sseClients)

    const server = http.createServer((req, res) => {
        void dispatch(req, res)
    })

    async function dispatch(
        req: http.IncomingMessage,
        res: http.ServerResponse
    ): Promise<void> {
        const url = new URL(req.url ?? '/', baseUrl)
        const method = req.method

        if (method !== 'GET' && method !== 'POST') {
            sendText(res, 404, 'not found')
            return
        }

        const handler = routes[url.pathname]?.[method]
        if (!handler) {
            sendText(res, 404, 'not found')
            return
        }

        try {
            await handler(req, res)
        } catch (err) {
            sendJson(res, 500, {
                error: err instanceof Error ? err.message : 'internal error',
            })
        }
    }

    return new Promise((resolve, reject) => {
        server.once('error', reject)
        server.listen(port, host, () => {
            resolve({ rpcBase, server })
        })
    })
}
