// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Minimal path-parameter router for the TestToken registry server.
 *
 * Provides `createRouter()` for route registration / matching, and two
 * standalone helpers (`respond`, `readBody`) that every feature slice shares.
 */

import type { IncomingMessage, ServerResponse } from 'node:http'

export type RouteHandler = (
    req: IncomingMessage,
    res: ServerResponse,
    body: unknown,
    params: Record<string, string>
) => Promise<void>

interface Route {
    method: string
    /** Literal path segments or `:paramName` placeholders. */
    pattern: string[]
    handler: RouteHandler
}

export interface Router {
    route: (method: string, pattern: string, handler: RouteHandler) => void
    matchRoute: (
        method: string,
        pathname: string
    ) => { handler: RouteHandler; params: Record<string, string> } | null
}

export function createRouter(): Router {
    const routes: Route[] = []

    function route(
        method: string,
        pattern: string,
        handler: RouteHandler
    ): void {
        routes.push({ method, pattern: pattern.split('/'), handler })
    }

    function matchRoute(
        method: string,
        pathname: string
    ): { handler: RouteHandler; params: Record<string, string> } | null {
        const segments = pathname.split('/')
        for (const r of routes) {
            if (r.method !== method) continue
            if (r.pattern.length !== segments.length) continue
            const params: Record<string, string> = {}
            let ok = true
            for (let i = 0; i < r.pattern.length; i++) {
                const p = r.pattern[i]!
                if (p.startsWith(':')) {
                    params[p.slice(1)] = decodeURIComponent(segments[i]!)
                } else if (p !== segments[i]) {
                    ok = false
                    break
                }
            }
            if (ok) return { handler: r.handler, params }
        }
        return null
    }

    return { route, matchRoute }
}

export function respond(
    res: ServerResponse,
    status: number,
    body: unknown
): void {
    const payload = JSON.stringify(body)
    res.writeHead(status, {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
    })
    res.end(payload)
}

export async function readBody(req: IncomingMessage): Promise<unknown> {
    return new Promise((resolve, reject) => {
        let raw = ''
        req.on('data', (chunk: Buffer) => (raw += chunk.toString()))
        req.on('end', () => {
            try {
                resolve(raw.length ? JSON.parse(raw) : {})
            } catch {
                reject(new Error('Invalid JSON body'))
            }
        })
        req.on('error', reject)
    })
}
