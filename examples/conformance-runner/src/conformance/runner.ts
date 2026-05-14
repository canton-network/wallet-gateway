// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import type { ErrorResponse, JsonRpcResponse } from '@canton-network/core-types'

import type { ConformanceTransport } from './transport'

function rpcError(
    response: JsonRpcResponse
): ErrorResponse['error'] | undefined {
    return 'error' in response ? response.error : undefined
}

export type Profile = 'sync' | 'async'
export type TestStatus = 'pass' | 'fail' | 'skip'

export type TestCategory = 'protocol' | 'schema' | 'behavior'

export type TestResult = {
    id: string
    title: string
    category: TestCategory
    status: TestStatus
    elapsedMs: number
    details?: string | undefined
}

export type ArtifactProvider = {
    name: string
    version: string
    transport: 'injected'
    appUrl?: string | undefined
}

export type ArtifactSummary = {
    total: number
    passed: number
    failed: number
    skipped: number
    status: 'pass' | 'fail'
}

export type Artifact = {
    schemaVersion: 1
    suite: 'cip-103-conformance'
    profile: Profile
    provider: ArtifactProvider
    generatedAt: string
    summary: ArtifactSummary
    results: TestResult[]
}

function nowIso(): string {
    return new Date().toISOString()
}

function duration(startMs: number): number {
    return Math.max(0, Date.now() - startMs)
}

function makeResult(
    id: string,
    title: string,
    category: TestCategory,
    status: TestStatus,
    elapsedMs: number,
    details?: string
): TestResult {
    return { id, title, category, status, elapsedMs, details }
}

export type ConformanceProviderMeta = {
    name: string
    version: string
    transport?: 'injected' | undefined
    appUrl?: string | undefined
}

/** What the harness sent to the wallet for a given probe (for UI / debugging). */
export type CapturedRequest = {
    method: string
    params: unknown
}

/** JSON-RPC standard: method not found. */
const JSON_RPC_METHOD_NOT_FOUND = -32601
/** Used by some providers when the method is known but not supported for this wallet/session. */
const METHOD_NOT_SUPPORTED = -32004

function isMissingOrUnsupportedMethod(
    error?: ErrorResponse['error'] | null
): boolean {
    const c = error?.code
    return c === JSON_RPC_METHOD_NOT_FOUND || c === METHOD_NOT_SUPPORTED
}

function schemaProbeParams(methodName: string): unknown {
    // Some methods require non-empty params; probing them with {} can trigger
    // server-side errors that are artifacts of the test harness rather than the
    // provider implementation.
    switch (methodName) {
        case 'ledgerApi':
            return {
                requestMethod: 'get',
                resource: '/v2/version',
            }
        default:
            return {}
    }
}

function summarize(results: TestResult[]): ArtifactSummary {
    const passed = results.filter((r) => r.status === 'pass').length
    const failed = results.filter((r) => r.status === 'fail').length
    const skipped = results.filter((r) => r.status === 'skip').length
    const total = results.length
    return {
        total,
        passed,
        failed,
        skipped,
        status: failed > 0 ? 'fail' : 'pass',
    }
}

export async function runConformanceAgainstConnectedProvider(args: {
    profile: Profile
    transport: ConformanceTransport
    requiredMethods: string[]
    providerMeta: ConformanceProviderMeta
    onProgress?:
        | ((event: {
              phase: 'protocol' | 'schema' | 'behavior' | 'finalize'
              current?: number | undefined
              total?: number | undefined
              message: string
              lastResult?: TestResult | undefined
              lastResponse?: JsonRpcResponse | null | undefined
              lastRequest?: CapturedRequest | null | undefined
          }) => void)
        | undefined
}): Promise<Artifact> {
    const { profile, transport, requiredMethods, providerMeta, onProgress } =
        args
    try {
        const results: TestResult[] = []

        onProgress?.({
            phase: 'protocol',
            message: 'Running protocol checks…',
        })
        {
            const start = Date.now()
            const req001: CapturedRequest = {
                method: '__cip103_unknown_method__',
                params: {},
            }
            const response = await transport.request(
                req001.method,
                req001.params
            )
            const err = rpcError(response)
            const pass = err?.code === JSON_RPC_METHOD_NOT_FOUND
            const r = makeResult(
                'CIP103-RPC-001',
                'Unknown method returns method-not-found',
                'protocol',
                pass ? 'pass' : 'fail',
                duration(start),
                pass
                    ? undefined
                    : `Expected ${JSON_RPC_METHOD_NOT_FOUND}, got ${err?.code ?? 'no error'}`
            )
            results.push(r)
            onProgress?.({
                phase: 'protocol',
                message: r.title,
                lastResult: r,
                lastResponse: response,
                lastRequest: req001,
            })
        }

        {
            const start = Date.now()
            const response = await transport.requestInvalidEnvelope()
            if (!response) {
                const r = makeResult(
                    'CIP103-RPC-002',
                    'Invalid JSON-RPC request returns error',
                    'protocol',
                    'skip',
                    duration(start),
                    'Skipped: connected provider does not expose raw JSON-RPC envelope'
                )
                results.push(r)
                onProgress?.({
                    phase: 'protocol',
                    message: r.title,
                    lastResult: r,
                    lastResponse: null,
                    lastRequest: {
                        method: '(skipped)',
                        params: {
                            reason: 'Connected transport does not expose a raw malformed JSON-RPC envelope',
                        },
                    },
                })
            } else {
                const pass = 'error' in response && Boolean(response.error)
                const r = makeResult(
                    'CIP103-RPC-002',
                    'Invalid JSON-RPC request returns error',
                    'protocol',
                    pass ? 'pass' : 'fail',
                    duration(start),
                    pass
                        ? undefined
                        : 'Expected JSON-RPC error for malformed request'
                )
                results.push(r)
                onProgress?.({
                    phase: 'protocol',
                    message: r.title,
                    lastResult: r,
                    lastResponse: response,
                    lastRequest: {
                        method: '(malformed JSON-RPC envelope)',
                        params: { note: 'Non-standard payload per transport' },
                    },
                })
            }
        }

        onProgress?.({
            phase: 'schema',
            current: 0,
            total: requiredMethods.length,
            message: `Checking method presence (${requiredMethods.length})…`,
        })
        let i = 0
        for (const methodName of requiredMethods) {
            onProgress?.({
                phase: 'schema',
                current: i,
                total: requiredMethods.length,
                message: `Requesting ${methodName}…`,
            })
            i += 1
            const start = Date.now()
            const probeParams = schemaProbeParams(methodName)
            const reqSchema: CapturedRequest = {
                method: methodName,
                params: probeParams,
            }
            const response = await transport.request(
                reqSchema.method,
                reqSchema.params
            )
            const err = rpcError(response)
            const pass = !isMissingOrUnsupportedMethod(err)
            const r = makeResult(
                `CIP103-SCHEMA-${methodName}`,
                `Method '${methodName}' is implemented`,
                'schema',
                pass ? 'pass' : 'fail',
                duration(start),
                pass
                    ? undefined
                    : `Method missing or unsupported (expected neither ${JSON_RPC_METHOD_NOT_FOUND} nor ${METHOD_NOT_SUPPORTED}; got ${err?.code ?? 'no error'})`
            )
            results.push(r)
            onProgress?.({
                phase: 'schema',
                current: i,
                total: requiredMethods.length,
                message: `Checked ${methodName}`,
                lastResult: r,
                lastResponse: response,
                lastRequest: reqSchema,
            })
        }

        onProgress?.({
            phase: 'behavior',
            message: 'Running behavior smoke checks…',
        })
        {
            const start = Date.now()
            const reqConnect: CapturedRequest = {
                method: 'connect',
                params: {},
            }
            const response = await transport.request(
                reqConnect.method,
                reqConnect.params
            )
            const err = rpcError(response)
            const pass = !isMissingOrUnsupportedMethod(err)
            const r = makeResult(
                profile === 'sync' ? 'CIP103-BEH-001' : 'CIP103-BEH-101',
                "Provider exposes 'connect' lifecycle method",
                'behavior',
                pass ? 'pass' : 'fail',
                duration(start),
                pass
                    ? undefined
                    : `'connect' missing or not supported (code ${err?.code ?? 'n/a'})`
            )
            results.push(r)
            onProgress?.({
                phase: 'behavior',
                message: r.title,
                lastResult: r,
                lastResponse: response,
                lastRequest: reqConnect,
            })
        }

        onProgress?.({
            phase: 'finalize',
            message: 'Finalizing report…',
        })
        return {
            schemaVersion: 1,
            suite: 'cip-103-conformance',
            profile,
            provider: {
                name: providerMeta.name,
                version: providerMeta.version,
                transport: 'injected',
                appUrl: providerMeta.appUrl,
            },
            generatedAt: nowIso(),
            summary: summarize(results),
            results,
        }
    } finally {
        await transport.close()
    }
}
