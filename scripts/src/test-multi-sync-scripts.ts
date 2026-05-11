// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs'
import path from 'path'
import { error, getRepoRoot, success } from './lib/utils.js'
import child_process from 'child_process'

const maxIoListeners = Number.parseInt(process.env.MAX_IO_LISTENERS ?? '', 10)
if (Number.isFinite(maxIoListeners) && maxIoListeners > 0) {
    process.stdout.setMaxListeners(maxIoListeners)
    process.stderr.setMaxListeners(maxIoListeners)
}

const dir = path.join(
    getRepoRoot(),
    'docs/wallet-integration-guide/examples/scripts'
)

// do not run these tests; exceptions can be full filename or just any length subset of its starting characters
const EXCEPTIONS_FILE_NAMES = ['_', 'utils', 'types.ts', 'upload-dars.ts']

function getMultiSyncScripts(): string[] {
    const multiSyncDir = path.join(dir, '15-multi-sync')
    return fs.readdirSync(multiSyncDir).flatMap((f) => {
        if (!f.endsWith('.ts')) return []
        if (EXCEPTIONS_FILE_NAMES.find((e) => f.startsWith(e))) return []
        return [path.relative(dir, path.join(multiSyncDir, f))]
    })
}

const scripts = getMultiSyncScripts()

async function executeScript(name: string) {
    console.log(success(`\n=== Executing script: ${name} ===`))
    await cmd('yarn', ['tsx', path.join(dir, name)]).then(() => {
        console.log(success(`Script ${name} executed successfully`))
    })
    console.log(success(`=== Finished script: ${name} ===\n`))
}

async function cmd(bin: string, args: string[]): Promise<string> {
    const child = child_process.spawn(bin, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
    })

    const pretty = child_process.spawn('yarn', ['pino-pretty'], {
        stdio: ['pipe', 'pipe', 'pipe'],
    })

    child.stdout.pipe(pretty.stdin)

    let logs = ''
    child.stderr.on('data', (data: Buffer) => {
        logs += data.toString()
    })
    pretty.stdout.on('data', (data: Buffer) => {
        logs += data.toString()
    })
    pretty.stderr.on('data', (data: Buffer) => {
        logs += data.toString()
    })

    const childCode = await new Promise<number>((resolve) => {
        child.on('close', (code) => resolve(code ?? 1))
    })
    pretty.stdin.end()

    await new Promise<void>((resolve) => {
        pretty.on('close', resolve)
    })

    if (childCode !== 0) {
        throw Object.assign(
            new Error(`Command failed: ${bin} ${args.join(' ')}`),
            { logs }
        )
    }
    return logs
}

const results: Array<{
    script: string
    result: PromiseSettledResult<void>
}> = []

for (const script of scripts) {
    const result = await executeScript(script).then(
        () => ({
            script,
            result: { status: 'fulfilled', value: undefined } as const,
        }),
        (reason) => ({
            script,
            result: { status: 'rejected', reason } as const,
        })
    )
    results.push(result)
}

const failedScripts = results.flatMap(({ script, result }) =>
    result.status === 'rejected' ? [{ script, result } as const] : []
)

if (failedScripts.length > 0) {
    for (const { script, result } of failedScripts) {
        const logs = (result.reason as { logs?: string }).logs ?? ''
        if (logs) process.stdout.write(logs)
        console.log(error(`=== Failed running script: ${script} ===\n`))
    }
    process.exit(1)
}
