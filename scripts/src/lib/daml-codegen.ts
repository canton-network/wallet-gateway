// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import * as path from 'path'
import * as fs from 'fs'
import { execSync } from 'child_process'
import {
    info,
    warn,
    error,
    getAllFilesWithExtension,
    ensureDir,
    copyFileRecursive,
} from './utils.js'

/**
 * Configuration for a DAML codegen target
 * Uses DPM (Daml Package Manager) for building and code generation
 * See: https://docs.digitalasset.com/build/3.4/dpm/dpm.html
 */
export interface DamlCodegenConfig {
    destDir: string
    packageName: string
    version: string
}

/**
 * Copy .daml files from source to destination, skipping test files
 * and maintaining directory structure (minus first directory level)
 */
export async function copyDamlFiles(
    sourceDir: string,
    destDir: string
): Promise<string[]> {
    console.log(info('Finding .daml files...'))
    const damlFiles = getAllFilesWithExtension(sourceDir, '.daml')

    if (damlFiles.length === 0) {
        console.log(warn('No .daml files found.'))
        return []
    }

    await ensureDir(destDir)

    console.log(
        info(`Copying ${damlFiles.length} .daml files to ${destDir}...`)
    )
    const copiedFiles: string[] = []
    for (const file of damlFiles) {
        if (file.includes('test')) continue // Skip test files
        const relativePath = path.relative(sourceDir, file)
        const parts = relativePath.split(path.sep)
        const newRelativePath =
            parts.length > 1 ? path.join(...parts.slice(1)) : relativePath
        const destPath = path.join(destDir, newRelativePath)
        await ensureDir(path.dirname(destPath))
        await copyFileRecursive(file, destPath)
        copiedFiles.push(destPath)
    }

    return copiedFiles
}

/**
 * Run dpm build in the specified directory
 * DPM (Daml Package Manager) replaces the legacy daml build command
 */
export function runDamlBuild(workingDir: string): void {
    console.log(info('Running "dpm build"...'))
    try {
        // Capture stdout/stderr to check for SDK_NOT_INSTALLED
        const output = execSync('dpm build', {
            cwd: workingDir,
            encoding: 'utf-8',
        })
        console.log(output)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        // Capture stdout/stderr from the error
        const stdout = err.stdout?.toString() || ''
        const stderr = err.stderr?.toString() || ''
        const combinedOutput = stdout + stderr

        // Display the output
        if (stdout) console.log(stdout)
        if (stderr) console.error(stderr)

        // Check if SDK is not installed
        if (combinedOutput.includes('SDK_NOT_INSTALLED')) {
            console.log(warn('SDK not installed, attempting to install...'))

            // Extract the install command from the output
            // Pattern: "via 'dpm install X.X.X...'"
            const installMatch = combinedOutput.match(
                /via\s+'dpm install ([^']+)'/
            )

            if (installMatch && installMatch[1]) {
                const version = installMatch[1]
                console.log(info(`Installing SDK version: ${version}`))

                try {
                    execSync(`dpm install ${version}`, {
                        cwd: workingDir,
                        stdio: 'inherit',
                    })

                    console.log(info('SDK installed, retrying build...'))
                    execSync('dpm build', {
                        cwd: workingDir,
                        stdio: 'inherit',
                    })
                    return
                } catch (installErr) {
                    console.error(
                        error(
                            `Failed to install SDK or retry build: ${installErr}`
                        )
                    )
                    throw installErr
                }
            } else {
                console.error(
                    error(
                        'Could not extract install command from error message'
                    )
                )
            }
        }

        // Re-throw if not SDK_NOT_INSTALLED or if we couldn't handle it
        throw err
    }
}

/**
 * Run dpm codegen js for a DAR file
 * Generates JavaScript/TypeScript bindings from compiled DAR
 */
export function runDamlCodegen(workingDir: string, darFileName: string): void {
    console.log(info('Running "dpm codegen-js"...'))
    try {
        console.log(info(`dpm codegen-js`))
        execSync(`dpm codegen-js .daml/dist/${darFileName} -o .`, {
            cwd: workingDir,
            stdio: 'inherit',
        })
        console.log(info('Codegen completed.'))
    } catch (err) {
        console.error(error(`Error running dpm codegen js: ${err}`))
        throw err
    }
}

/**
 * Generate DAML JavaScript bindings from an existing DAML project at destination
 * Uses DPM (Daml Package Manager) for the complete workflow:
 * 1. Validate destination contains a DAML project
 * 2. Build DAR with dpm build
 * 3. Generate JS bindings with dpm codegen js
 */
export async function generateDamlJsBindings(
    config: DamlCodegenConfig
): Promise<void> {
    const damlYamlPath = path.join(config.destDir, 'daml.yaml')
    if (!fs.existsSync(damlYamlPath)) {
        throw new Error(
            `Missing daml.yaml in destination project: ${damlYamlPath}`
        )
    }

    const damlFiles = getAllFilesWithExtension(config.destDir, '.daml')
    if (damlFiles.length === 0) {
        console.log(
            warn(
                `No .daml files found in ${config.destDir}. Skipping build and codegen.`
            )
        )
        return
    }

    runDamlBuild(config.destDir)

    const darFileName = `${config.packageName}-${config.version}.dar`
    runDamlCodegen(config.destDir, darFileName)
}
