// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import type { ErrorResponse, JsonRpcResponse } from '@canton-network/core-types'

const DEFAULT_CODE = -32001

function normalizeUnknownError(error: unknown): ErrorResponse['error'] {
    if (typeof error === 'object' && error !== null) {
        const o = error as Record<string, unknown>
        const inner = o.error
        if (typeof inner === 'object' && inner !== null) {
            const n = inner as Record<string, unknown>
            if (typeof n.code === 'number' && typeof n.message === 'string') {
                const data = n.data
                const message =
                    typeof data === 'string' && data.trim()
                        ? `${n.message}\n\n${data}`
                        : n.message
                return { code: n.code, message }
            }
        }
        if (typeof o.code === 'number' && typeof o.message === 'string') {
            return { code: o.code, message: o.message }
        }
        if (typeof o.message === 'string') {
            return {
                code: typeof o.code === 'number' ? o.code : DEFAULT_CODE,
                message: o.message,
            }
        }
        try {
            return { code: DEFAULT_CODE, message: JSON.stringify(error) }
        } catch {
            // fall through
        }
    }
    return {
        code: DEFAULT_CODE,
        message: error instanceof Error ? error.message : String(error),
    }
}

export interface ConformanceTransport {
    request(method: string, params: unknown): Promise<JsonRpcResponse>
    requestInvalidEnvelope(): Promise<JsonRpcResponse | null>
    close(): Promise<void>
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return promise
    return new Promise<T>((resolve, reject) => {
        const t = setTimeout(() => {
            reject(new Error(`Timeout after ${timeoutMs}ms`))
        }, timeoutMs)
        promise.then(
            (v) => {
                clearTimeout(t)
                resolve(v)
            },
            (e) => {
                clearTimeout(t)
                reject(e)
            }
        )
    })
}

export type ConnectedProvider = {
    request(args: { method: string; params?: unknown }): Promise<unknown>
}

export function createConnectedProviderTransport(
    provider: ConnectedProvider,
    options?: { timeoutMs?: number | undefined }
): ConformanceTransport {
    const timeoutMs = options?.timeoutMs ?? 15000
    return {
        async request(
            method: string,
            params: unknown
        ): Promise<JsonRpcResponse> {
            try {
                const result = await withTimeout(
                    provider.request({ method, params }),
                    timeoutMs
                )
                return { jsonrpc: '2.0', result }
            } catch (error) {
                return { jsonrpc: '2.0', error: normalizeUnknownError(error) }
            }
        },
        async requestInvalidEnvelope(): Promise<JsonRpcResponse | null> {
            return null
        },
        async close(): Promise<void> {},
    }
}
