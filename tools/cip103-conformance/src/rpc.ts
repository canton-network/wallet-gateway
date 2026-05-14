// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { setTimeout as sleep } from 'node:timers/promises'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type {
    InjectedProviderConfig,
    ProviderConfig,
    HttpProviderConfig,
} from './schemas'

export interface JsonRpcError {
    code: number
    message: string
}

export interface JsonRpcResponse {
    result?: unknown
    error?: JsonRpcError
}

export interface ConformanceTransport {
    request(method: string, params: unknown): Promise<JsonRpcResponse>
    requestInvalidEnvelope(): Promise<JsonRpcResponse | null>
    close(): Promise<void>
}

function isInjectedProvider(
    provider: ProviderConfig
): provider is InjectedProviderConfig {
    return provider.transport === 'injected'
}

function buildHeaders(provider: HttpProviderConfig): HeadersInit {
    return {
        'content-type': 'application/json',
        ...provider.headers,
    }
}

async function jsonRpcHttpRequest(
    provider: HttpProviderConfig,
    payload: unknown
): Promise<JsonRpcResponse> {
    const controller = new AbortController()
    const timeout = setTimeout(
        () => controller.abort(),
        provider.timeoutMs ?? 10000
    )

    try {
        const response = await fetch(provider.endpoint, {
            method: 'POST',
            headers: buildHeaders(provider),
            body: JSON.stringify(payload),
            signal: controller.signal,
        })
        const text = await response.text()
        if (!text.trim()) {
            return {
                error: {
                    code: -32000,
                    message: `Empty response with HTTP ${response.status}`,
                },
            }
        }
        return JSON.parse(text) as JsonRpcResponse
    } catch (error) {
        await sleep(1)
        const message = error instanceof Error ? error.message : String(error)
        return { error: { code: -32001, message } }
    } finally {
        clearTimeout(timeout)
    }
}

function normalizeUnknownError(error: unknown): JsonRpcError {
    if (typeof error === 'object' && error !== null) {
        const maybeCode = (error as { code?: unknown }).code
        const maybeMessage = (error as { message?: unknown }).message
        if (typeof maybeCode === 'number' && typeof maybeMessage === 'string') {
            return { code: maybeCode, message: maybeMessage }
        }
        if (typeof maybeMessage === 'string') {
            return { code: -32001, message: maybeMessage }
        }
    }
    return {
        code: -32001,
        message: error instanceof Error ? error.message : String(error),
    }
}

async function createInjectedTransport(
    provider: InjectedProviderConfig
): Promise<ConformanceTransport> {
    const { chromium } = await import('playwright')
    const userDataDir = await mkdtemp(join(tmpdir(), 'cip103-conformance-'))
    const args = provider.extensionPath
        ? [
              `--disable-extensions-except=${provider.extensionPath}`,
              `--load-extension=${provider.extensionPath}`,
          ]
        : []

    const context = await chromium.launchPersistentContext(userDataDir, {
        headless: provider.headless ?? false,
        args,
    })
    const page = context.pages().at(0) ?? (await context.newPage())
    await page.goto(provider.appUrl, { waitUntil: 'domcontentloaded' })
    const namespace =
        provider.providerId && !provider.providerId.startsWith('window.')
            ? `window.${provider.providerId}`
            : (provider.providerId ??
              provider.injectedNamespace ??
              'window.canton')

    if (provider.extensionTarget) {
        const target = provider.extensionTarget
        const request = async (
            method: string,
            params: unknown
        ): Promise<JsonRpcResponse> => {
            try {
                const response = await page.evaluate(
                    async ({
                        rpcMethod,
                        rpcParams,
                        target,
                        timeoutMs,
                    }: {
                        rpcMethod: string
                        rpcParams: unknown
                        target: string
                        timeoutMs: number
                    }) => {
                        const id =
                            typeof crypto !== 'undefined' &&
                            'randomUUID' in crypto &&
                            typeof crypto.randomUUID === 'function'
                                ? crypto.randomUUID()
                                : `req-${Date.now()}-${Math.random()}`

                        const requestMessage = {
                            type: 'SPLICE_WALLET_REQUEST',
                            target,
                            request: {
                                jsonrpc: '2.0',
                                id,
                                method: rpcMethod,
                                params: rpcParams,
                            },
                        }

                        const awaitResponse = () =>
                            new Promise<JsonRpcResponse>((resolve) => {
                                const listener = (event: MessageEvent) => {
                                    const data = event.data as {
                                        type?: unknown
                                        response?: {
                                            id?: unknown
                                            error?: unknown
                                        }
                                    }
                                    if (
                                        !data ||
                                        data.type !==
                                            'SPLICE_WALLET_RESPONSE' ||
                                        !data.response ||
                                        data.response.id !== id
                                    ) {
                                        return
                                    }
                                    window.removeEventListener(
                                        'message',
                                        listener
                                    )
                                    if ('error' in data.response) {
                                        resolve({
                                            error: data.response.error as {
                                                code: number
                                                message: string
                                            },
                                        })
                                    } else {
                                        resolve({
                                            result: (
                                                data.response as {
                                                    result?: unknown
                                                }
                                            ).result,
                                        })
                                    }
                                }

                                window.addEventListener('message', listener)
                                window.postMessage(requestMessage, '*')
                                setTimeout(() => {
                                    window.removeEventListener(
                                        'message',
                                        listener
                                    )
                                    resolve({
                                        error: {
                                            code: -32001,
                                            message: `Timeout waiting for extensionTarget='${target}'`,
                                        },
                                    })
                                }, timeoutMs)
                            })

                        return await awaitResponse()
                    },
                    {
                        rpcMethod: method,
                        rpcParams: params,
                        target,
                        timeoutMs: provider.timeoutMs ?? 10000,
                    }
                )
                return response as JsonRpcResponse
            } catch (error) {
                return { error: normalizeUnknownError(error) }
            }
        }

        return {
            request,
            async requestInvalidEnvelope(): Promise<JsonRpcResponse | null> {
                return null
            },
            async close(): Promise<void> {
                await context.close()
                await rm(userDataDir, { recursive: true, force: true })
            },
        }
    }

    try {
        await page.waitForFunction(
            (namespacePath: string) => {
                const getAtPath = (
                    root: Record<string, unknown>,
                    path: string
                ): unknown =>
                    path
                        .split('.')
                        .reduce<unknown>(
                            (acc, key) =>
                                acc && typeof acc === 'object'
                                    ? (acc as Record<string, unknown>)[key]
                                    : undefined,
                            root
                        )

                const value = getAtPath(
                    globalThis as Record<string, unknown>,
                    namespacePath
                )
                return !!value
            },
            namespace,
            { timeout: provider.timeoutMs ?? 10000 }
        )
    } catch {
        // handled in request() with a clearer error message
    }

    const request = async (
        method: string,
        params: unknown
    ): Promise<JsonRpcResponse> => {
        try {
            const response = await page.evaluate(
                async ({
                    namespacePath,
                    rpcMethod,
                    rpcParams,
                }: {
                    namespacePath: string
                    rpcMethod: string
                    rpcParams: unknown
                }) => {
                    const getAtPath = (
                        root: Record<string, unknown>,
                        path: string
                    ): unknown =>
                        path
                            .split('.')
                            .reduce<unknown>(
                                (acc, key) =>
                                    acc && typeof acc === 'object'
                                        ? (acc as Record<string, unknown>)[key]
                                        : undefined,
                                root
                            )

                    const value = getAtPath(
                        globalThis as Record<string, unknown>,
                        namespacePath
                    )
                    if (!value || typeof value !== 'object') {
                        return {
                            error: {
                                code: -32001,
                                message: `Injected provider '${namespacePath}' not found`,
                            },
                        }
                    }

                    const requestFn = (value as { request?: unknown }).request
                    if (typeof requestFn !== 'function') {
                        return {
                            error: {
                                code: -32001,
                                message: `Injected provider '${namespacePath}' has no request() method`,
                            },
                        }
                    }

                    try {
                        const result = await (
                            requestFn as (args: {
                                method: string
                                params: unknown
                            }) => Promise<unknown>
                        )({
                            method: rpcMethod,
                            params: rpcParams,
                        })
                        return { result }
                    } catch (error) {
                        if (typeof error === 'object' && error !== null) {
                            const maybeCode = (error as { code?: unknown }).code
                            const maybeMessage = (
                                error as { message?: unknown }
                            ).message
                            if (
                                typeof maybeCode === 'number' &&
                                typeof maybeMessage === 'string'
                            ) {
                                return {
                                    error: {
                                        code: maybeCode,
                                        message: maybeMessage,
                                    },
                                }
                            }
                            if (typeof maybeMessage === 'string') {
                                return {
                                    error: {
                                        code: -32001,
                                        message: maybeMessage,
                                    },
                                }
                            }
                        }
                        return {
                            error: {
                                code: -32001,
                                message:
                                    error instanceof Error
                                        ? error.message
                                        : String(error),
                            },
                        }
                    }
                },
                {
                    namespacePath: namespace,
                    rpcMethod: method,
                    rpcParams: params,
                }
            )
            return response as JsonRpcResponse
        } catch (error) {
            return { error: normalizeUnknownError(error) }
        }
    }

    return {
        request,
        async requestInvalidEnvelope(): Promise<JsonRpcResponse | null> {
            return null
        },
        async close(): Promise<void> {
            await context.close()
            await rm(userDataDir, { recursive: true, force: true })
        },
    }
}

export async function createTransport(
    provider: ProviderConfig
): Promise<ConformanceTransport> {
    if (isInjectedProvider(provider)) {
        return createInjectedTransport(provider)
    }

    return {
        async request(
            method: string,
            params: unknown
        ): Promise<JsonRpcResponse> {
            return jsonRpcHttpRequest(provider, {
                jsonrpc: '2.0',
                id: `rpc-${method}`,
                method,
                params,
            })
        },
        async requestInvalidEnvelope(): Promise<JsonRpcResponse | null> {
            return jsonRpcHttpRequest(provider, { nonsense: true })
        },
        async close(): Promise<void> {},
    }
}
