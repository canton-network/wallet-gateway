// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import type { Profile } from './schemas'

interface OpenRpcMethod {
    name: string
}

interface OpenRpcDocument {
    methods?: OpenRpcMethod[]
}

function sortedUnique(values: string[]): string[] {
    return [...new Set(values)].sort((a, b) => a.localeCompare(b))
}

const EVENT_LIKE_METHODS = new Set([
    // These are delivered as events/notifications, not requestable JSON-RPC methods.
    'connected',
    'accountsChanged',
    'txChanged',
    'statusChanged',
])

const SIDE_EFFECTFUL_METHODS = new Set([
    // These can change session state or trigger UI; don't probe them in the generic
    // "is implemented" schema loop.
    'connect',
    'disconnect',
    'prepareExecute',
    'prepareExecuteAndWait',
])

async function loadSpecJson(relativePath: string): Promise<OpenRpcDocument> {
    const url = new URL(relativePath, import.meta.url)
    const res = await fetch(url)
    if (!res.ok) {
        throw new Error(
            `Failed to load OpenRPC spec (${relativePath}): HTTP ${res.status}`
        )
    }
    return (await res.json()) as OpenRpcDocument
}

/**
 * Browser-friendly method list loader.
 *
 * Loads the spec JSON that is copied into `dist/specs/` as part of the package build.
 * This avoids Node `fs` usage and keeps consumers (like web dApps) lightweight.
 */
export async function readRequiredMethodsBundled(
    profile: Profile
): Promise<string[]> {
    const file =
        profile === 'sync'
            ? './specs/openrpc-dapp-api.json'
            : './specs/openrpc-dapp-remote-api.json'
    const parsed = await loadSpecJson(file)
    const methods = parsed.methods?.map((m) => m.name).filter(Boolean) ?? []
    return sortedUnique(methods).filter(
        (m) => !EVENT_LIKE_METHODS.has(m) && !SIDE_EFFECTFUL_METHODS.has(m)
    )
}
