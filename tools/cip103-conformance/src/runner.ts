// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { readRequiredMethods } from './openrpc'
import { createTransport, type ConformanceTransport } from './rpc'
import type {
    Artifact,
    HttpProviderConfig,
    InjectedProviderConfig,
    Profile,
    ProviderConfig,
    TestResult,
    TestStatus,
} from './schemas'

function nowIso(): string {
    return new Date().toISOString()
}

function duration(startMs: number): number {
    return Math.max(0, Date.now() - startMs)
}

function makeResult(
    id: string,
    title: string,
    category: TestResult['category'],
    status: TestStatus,
    elapsedMs: number,
    details?: string
): TestResult {
    return { id, title, category, status, elapsedMs, details }
}

/** JSON-RPC standard: method not found. */
const JSON_RPC_METHOD_NOT_FOUND = -32601
/** Used by some providers when the method is known but not supported for this wallet/session. */
const METHOD_NOT_SUPPORTED = -32004

function isMissingOrUnsupportedMethod(error?: { code?: number }): boolean {
    const c = error?.code
    return c === JSON_RPC_METHOD_NOT_FOUND || c === METHOD_NOT_SUPPORTED
}

function schemaProbeParams(methodName: string): unknown {
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

async function runProtocolTests(
    transport: ConformanceTransport
): Promise<TestResult[]> {
    const results: TestResult[] = []

    {
        const start = Date.now()
        const response = await transport.request(
            '__cip103_unknown_method__',
            {}
        )
        const pass = response.error?.code === JSON_RPC_METHOD_NOT_FOUND
        results.push(
            makeResult(
                'CIP103-RPC-001',
                'Unknown method returns method-not-found',
                'protocol',
                pass ? 'pass' : 'fail',
                duration(start),
                pass
                    ? undefined
                    : `Expected ${JSON_RPC_METHOD_NOT_FOUND}, got ${response.error?.code ?? 'no error'}`
            )
        )
    }

    {
        const start = Date.now()
        const response = await transport.requestInvalidEnvelope()
        if (!response) {
            results.push(
                makeResult(
                    'CIP103-RPC-002',
                    'Invalid JSON-RPC request returns error',
                    'protocol',
                    'skip',
                    duration(start),
                    'Skipped: injected transport does not expose raw JSON-RPC envelope'
                )
            )
            return results
        }
        const pass = Boolean(response.error)
        results.push(
            makeResult(
                'CIP103-RPC-002',
                'Invalid JSON-RPC request returns error',
                'protocol',
                pass ? 'pass' : 'fail',
                duration(start),
                pass
                    ? undefined
                    : 'Expected JSON-RPC error for malformed request'
            )
        )
    }

    return results
}

async function runSchemaTests(
    profile: Profile,
    transport: ConformanceTransport
): Promise<TestResult[]> {
    const methodNames = await readRequiredMethods(profile)
    const results: TestResult[] = []

    for (const methodName of methodNames) {
        const start = Date.now()
        const response = await transport.request(
            methodName,
            schemaProbeParams(methodName)
        )

        const pass = !isMissingOrUnsupportedMethod(response.error)
        results.push(
            makeResult(
                `CIP103-SCHEMA-${methodName}`,
                `Method '${methodName}' is implemented`,
                'schema',
                pass ? 'pass' : 'fail',
                duration(start),
                pass
                    ? undefined
                    : `Method missing or unsupported (expected neither ${JSON_RPC_METHOD_NOT_FOUND} nor ${METHOD_NOT_SUPPORTED}; got ${response.error?.code ?? 'no error'})`
            )
        )
    }

    return results
}

async function runBehaviorSmokeTests(
    profile: Profile,
    transport: ConformanceTransport
): Promise<TestResult[]> {
    const start = Date.now()
    const response = await transport.request('connect', {})

    const pass = !isMissingOrUnsupportedMethod(response.error)
    return [
        makeResult(
            profile === 'sync' ? 'CIP103-BEH-001' : 'CIP103-BEH-101',
            "Provider exposes 'connect' lifecycle method",
            'behavior',
            pass ? 'pass' : 'fail',
            duration(start),
            pass
                ? undefined
                : `'connect' missing or not supported (code ${response.error?.code ?? 'n/a'})`
        ),
    ]
}

function artifactProvider(provider: ProviderConfig): Artifact['provider'] {
    if (provider.transport === 'injected') {
        const injected = provider as InjectedProviderConfig
        return {
            name: injected.name,
            version: injected.version,
            transport: 'injected',
            appUrl: injected.appUrl,
        }
    }

    const http = provider as HttpProviderConfig
    return {
        name: http.name,
        version: http.version,
        transport: 'http',
        endpoint: http.endpoint,
    }
}

function summarize(results: TestResult[]): Artifact['summary'] {
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

export async function runConformance(
    profile: Profile,
    provider: ProviderConfig
): Promise<Artifact> {
    const transport = await createTransport(provider)
    try {
        const [protocol, schema, behavior] = await Promise.all([
            runProtocolTests(transport),
            runSchemaTests(profile, transport),
            runBehaviorSmokeTests(profile, transport),
        ])
        const results = [...protocol, ...schema, ...behavior]
        return {
            schemaVersion: 1,
            suite: 'cip-103-conformance',
            profile,
            provider: artifactProvider(provider),
            generatedAt: nowIso(),
            summary: summarize(results),
            results,
        }
    } finally {
        await transport.close()
    }
}
