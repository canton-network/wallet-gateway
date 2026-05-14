// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { createPrivateKey, createPublicKey, sign, verify } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { mkdir } from 'node:fs/promises'
import { ArtifactSchema, type Artifact } from './schemas'

function canonicalize(value: unknown): string {
    if (Array.isArray(value)) {
        return `[${value.map(canonicalize).join(',')}]`
    }
    if (value && typeof value === 'object') {
        const entries = Object.entries(value as Record<string, unknown>).sort(
            ([a], [b]) => a.localeCompare(b)
        )
        return `{${entries
            .map(([key, val]) => `${JSON.stringify(key)}:${canonicalize(val)}`)
            .join(',')}}`
    }
    return JSON.stringify(value)
}

function toSignPayload(artifact: Artifact): Buffer {
    const unsigned = { ...artifact, signature: undefined }
    return Buffer.from(canonicalize(unsigned), 'utf8')
}

export async function writeArtifact(
    path: string,
    artifact: Artifact
): Promise<void> {
    const absolutePath = resolve(process.cwd(), path)
    await mkdir(dirname(absolutePath), { recursive: true })
    await writeFile(
        absolutePath,
        `${JSON.stringify(artifact, null, 2)}\n`,
        'utf8'
    )
}

export async function readArtifact(path: string): Promise<Artifact> {
    const absolutePath = resolve(process.cwd(), path)
    const raw = await readFile(absolutePath, 'utf8')
    return ArtifactSchema.parse(JSON.parse(raw))
}

export async function signArtifact(
    artifact: Artifact,
    privateKeyPath: string,
    keyId?: string
): Promise<Artifact> {
    const rawKey = await readFile(
        resolve(process.cwd(), privateKeyPath),
        'utf8'
    )
    const privateKey = createPrivateKey(rawKey)
    const signature = sign(null, toSignPayload(artifact), privateKey).toString(
        'base64'
    )
    return {
        ...artifact,
        signature: {
            algorithm: 'ed25519',
            value: signature,
            keyId,
        },
    }
}

export async function verifyArtifactSignature(
    artifact: Artifact,
    publicKeyPath: string
): Promise<boolean> {
    if (!artifact.signature) {
        return false
    }
    const rawKey = await readFile(resolve(process.cwd(), publicKeyPath), 'utf8')
    const publicKey = createPublicKey(rawKey)
    return verify(
        null,
        toSignPayload(artifact),
        publicKey,
        Buffer.from(artifact.signature.value, 'base64')
    )
}

export function toBadgeData(artifact: Artifact): Record<string, unknown> {
    return {
        schemaVersion: 1,
        label: `cip-103 ${artifact.profile}`,
        message: artifact.summary.status,
        color: artifact.summary.status === 'pass' ? 'green' : 'red',
    }
}
