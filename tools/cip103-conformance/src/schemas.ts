// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod'

export const ProfileSchema = z.enum(['sync', 'async'])
export type Profile = z.infer<typeof ProfileSchema>

const BaseProviderConfigSchema = z.object({
    name: z.string().min(1),
    version: z.string().min(1).optional(),
    timeoutMs: z.number().int().positive().optional(),
})

export const HttpProviderConfigSchema = BaseProviderConfigSchema.extend({
    transport: z.literal('http').optional(),
    endpoint: z.url(),
    headers: z.record(z.string(), z.string()).optional(),
})

export const InjectedProviderConfigSchema = BaseProviderConfigSchema.extend({
    transport: z.literal('injected'),
    appUrl: z.url(),
    injectedNamespace: z.string().min(1).optional(),
    /**
     * Convenience selector for namespaced injected providers, e.g.:
     * - "canton.console" -> resolves "window.canton.console"
     * - "splice"        -> resolves "window.splice"
     *
     * If provided, this takes precedence over injectedNamespace.
     */
    providerId: z.string().min(1).optional(),
    /**
     * Deterministic selector for postMessage-based extension wallets.
     * When set, JSON-RPC requests are sent via window.postMessage with `target`.
     */
    extensionTarget: z.string().min(1).optional(),
    extensionPath: z.string().min(1).optional(),
    headless: z.boolean().optional(),
})

export const ProviderConfigSchema = z.union([
    HttpProviderConfigSchema,
    InjectedProviderConfigSchema,
])
export type ProviderConfig = z.infer<typeof ProviderConfigSchema>
export type HttpProviderConfig = z.infer<typeof HttpProviderConfigSchema>
export type InjectedProviderConfig = z.infer<
    typeof InjectedProviderConfigSchema
>

export const TestStatusSchema = z.enum(['pass', 'fail', 'skip'])
export type TestStatus = z.infer<typeof TestStatusSchema>

export const TestResultSchema = z.object({
    id: z.string(),
    title: z.string(),
    category: z.enum(['protocol', 'schema', 'behavior', 'stability']),
    status: TestStatusSchema,
    details: z.string().optional(),
    elapsedMs: z.number().int().nonnegative(),
})
export type TestResult = z.infer<typeof TestResultSchema>

export const ArtifactSchema = z.object({
    schemaVersion: z.literal(1),
    suite: z.literal('cip-103-conformance'),
    profile: ProfileSchema,
    provider: z.object({
        name: z.string(),
        version: z.string().optional(),
        transport: z.enum(['http', 'injected']),
        endpoint: z.url().optional(),
        appUrl: z.url().optional(),
    }),
    generatedAt: z.string(),
    summary: z.object({
        total: z.number().int().nonnegative(),
        passed: z.number().int().nonnegative(),
        failed: z.number().int().nonnegative(),
        skipped: z.number().int().nonnegative(),
        status: z.enum(['pass', 'fail']),
    }),
    results: z.array(TestResultSchema),
    signature: z
        .object({
            algorithm: z.literal('ed25519'),
            value: z.string(),
            keyId: z.string().optional(),
        })
        .optional(),
})
export type Artifact = z.infer<typeof ArtifactSchema>
