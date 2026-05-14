// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
    readArtifact,
    signArtifact,
    toBadgeData,
    verifyArtifactSignature,
    writeArtifact,
} from './artifact'
import { runConformance } from './runner'
import {
    ProviderConfigSchema,
    type Artifact,
    type Profile,
    type ProviderConfig,
} from './schemas'

export interface RunConformanceCommandOptions {
    profile: Profile
    providerConfigPath: string
    outPath: string
    signingKeyPath?: string | undefined
    keyId?: string | undefined
}

export interface ValidateArtifactCommandOptions {
    artifactPath: string
    publicKeyPath?: string | undefined
    requireSignature: boolean
}

export interface ExportBadgeCommandOptions {
    artifactPath: string
    outPath: string
}

export interface ValidateArtifactResult {
    artifact: Artifact
    signatureValidated: boolean
}

export class ConformanceService {
    async readProviderConfig(path: string): Promise<ProviderConfig> {
        const raw = await readFile(resolve(process.cwd(), path), 'utf8')
        return ProviderConfigSchema.parse(JSON.parse(raw))
    }

    async run(options: RunConformanceCommandOptions): Promise<Artifact> {
        if (options.keyId && !options.signingKeyPath) {
            throw new Error('--key-id requires --signing-key.')
        }

        const provider = await this.readProviderConfig(
            options.providerConfigPath
        )
        let artifact = await runConformance(options.profile, provider)
        if (options.signingKeyPath) {
            artifact = await signArtifact(
                artifact,
                options.signingKeyPath,
                options.keyId
            )
        }
        await writeArtifact(options.outPath, artifact)
        return artifact
    }

    async validate(
        options: ValidateArtifactCommandOptions
    ): Promise<ValidateArtifactResult> {
        const artifact = await readArtifact(options.artifactPath)
        if (options.requireSignature && !artifact.signature) {
            throw new Error(
                'Artifact does not contain a signature. Use a signed artifact.'
            )
        }

        if (!options.publicKeyPath) {
            return { artifact, signatureValidated: false }
        }

        const ok = await verifyArtifactSignature(
            artifact,
            options.publicKeyPath
        )
        if (!ok) {
            throw new Error('Signature validation failed.')
        }
        return { artifact, signatureValidated: true }
    }

    async exportBadge(options: ExportBadgeCommandOptions): Promise<void> {
        const artifact = await readArtifact(options.artifactPath)
        const badge = toBadgeData(artifact)
        const absoluteOut = resolve(process.cwd(), options.outPath)
        await writeFile(
            absoluteOut,
            `${JSON.stringify(badge, null, 2)}\n`,
            'utf8'
        )
    }
}
