// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { access, readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Profile } from './schemas'

interface OpenRpcMethod {
    name: string
}

interface OpenRpcDocument {
    methods?: OpenRpcMethod[]
}

async function openRpcPath(profile: Profile): Promise<string> {
    const moduleDir =
        typeof __dirname === 'string'
            ? __dirname
            : dirname(fileURLToPath(import.meta.url))
    const file =
        profile === 'sync'
            ? 'openrpc-dapp-api.json'
            : 'openrpc-dapp-remote-api.json'

    // Built package path: dist/specs/*.json (moduleDir is dist)
    const distPath = resolve(moduleDir, 'specs', file)
    try {
        await access(distPath)
        return distPath
    } catch {
        // Dev path when running source directly via tsx.
        return resolve(moduleDir, '..', 'dist', 'specs', file)
    }
}

export async function readRequiredMethods(profile: Profile): Promise<string[]> {
    const path = await openRpcPath(profile)
    const raw = await readFile(path, 'utf8')
    const parsed = JSON.parse(raw) as OpenRpcDocument
    const methods = parsed.methods?.map((m) => m.name).filter(Boolean) ?? []
    return [...new Set(methods)].sort((a, b) => a.localeCompare(b))
}
