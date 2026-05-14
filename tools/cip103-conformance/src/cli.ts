// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { Command, InvalidArgumentError } from 'commander'
import { ConformanceService } from './conformance-service'
import { ProfileSchema } from './schemas'

function asProfile(value: string): 'sync' | 'async' {
    const parsed = ProfileSchema.safeParse(value)
    if (!parsed.success) {
        throw new InvalidArgumentError(
            `Invalid profile '${value}'. Use 'sync' or 'async'.`
        )
    }
    return parsed.data
}

function nonEmpty(value: string, optionName: string): string {
    const trimmed = value.trim()
    if (!trimmed) {
        throw new InvalidArgumentError(`${optionName} cannot be empty.`)
    }
    return trimmed
}

function toPath(value: string): string {
    return nonEmpty(value, 'Path')
}

const conformanceService = new ConformanceService()

async function runCommand(options: {
    profile: 'sync' | 'async'
    providerConfig: string
    out: string
    signingKey?: string
    keyId?: string
}): Promise<void> {
    const artifact = await conformanceService.run({
        profile: options.profile,
        providerConfigPath: options.providerConfig,
        outPath: options.out,
        ...(options.signingKey ? { signingKeyPath: options.signingKey } : {}),
        ...(options.keyId ? { keyId: options.keyId } : {}),
    })
    console.log(
        `Conformance completed: ${artifact.summary.status.toUpperCase()} (${artifact.summary.passed}/${artifact.summary.total})`
    )
    console.log(`Artifact written: ${options.out}`)
    if (artifact.summary.status !== 'pass') {
        process.exitCode = 1
    }
}

async function validateArtifactCommand(options: {
    artifact: string
    publicKey?: string
    requireSignature: boolean
}): Promise<void> {
    const result = await conformanceService.validate({
        artifactPath: options.artifact,
        ...(options.publicKey ? { publicKeyPath: options.publicKey } : {}),
        requireSignature: options.requireSignature,
    })
    if (!result.signatureValidated) {
        console.log(
            `Artifact is valid (unsigned check): ${result.artifact.summary.status.toUpperCase()}`
        )
        return
    }
    console.log('Artifact + signature validation succeeded.')
}

async function exportBadgeCommand(options: {
    artifact: string
    out: string
}): Promise<void> {
    await conformanceService.exportBadge({
        artifactPath: options.artifact,
        outPath: options.out,
    })
    console.log(`Badge exported: ${options.out}`)
}

async function main(): Promise<void> {
    const program = new Command()
        .name('conformance-cli')
        .description('CIP-103 sync/async conformance runner')
        .showSuggestionAfterError(true)
        .showHelpAfterError()

    program
        .command('run')
        .description('Run conformance checks against a provider endpoint')
        .requiredOption(
            '--profile <profile>',
            "Conformance profile: 'sync' or 'async'",
            asProfile
        )
        .requiredOption(
            '--provider-config <file>',
            'Provider config JSON file path',
            toPath
        )
        .option(
            '--out <file>',
            'Output path for conformance artifact',
            'dist/conformance/result.json'
        )
        .option(
            '--signing-key <pem>',
            'Optional Ed25519 private key (PEM) path',
            toPath
        )
        .option(
            '--key-id <id>',
            'Optional key identifier to include in the artifact',
            toPath
        )
        .action(runCommand)

    program
        .command('validate-artifact')
        .description(
            'Validate a conformance artifact (and signature if provided)'
        )
        .requiredOption('--artifact <file>', 'Artifact JSON path', toPath)
        .option(
            '--public-key <pem>',
            'Optional Ed25519 public key (PEM) path',
            toPath
        )
        .option(
            '--require-signature',
            'Fail when artifact has no signature (use for CI ingestion checks)',
            false
        )
        .action(validateArtifactCommand)

    program
        .command('export-badge')
        .description('Export badge JSON from a conformance artifact')
        .requiredOption('--artifact <file>', 'Artifact JSON path', toPath)
        .option(
            '--out <file>',
            'Output path for badge JSON',
            'dist/conformance/badge.json'
        )
        .action(exportBadgeCommand)

    await program.parseAsync(process.argv)
}

void main()
