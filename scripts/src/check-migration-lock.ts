// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const LOCK_VERSION = 1

interface LockFile {
    version: number
    migrations: Record<string, string>
}

const cwd = process.cwd()
const migrationsDir = resolve(cwd, 'src/migrations')
const lockPath = resolve(cwd, 'migrations.lock.json')

const update = process.argv.slice(2).includes('--update')

const computeCurrent = (): Record<string, string> => {
    if (!existsSync(migrationsDir)) {
        console.error(`No migrations directory found at ${migrationsDir}`)
        process.exit(1)
    }
    const entries: Record<string, string> = {}
    const files = readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.ts'))
        .sort()
    for (const file of files) {
        const content = readFileSync(join(migrationsDir, file))
        const hash = createHash('sha256').update(content).digest('hex')
        entries[file.replace(/\.ts$/, '')] = hash
    }
    return entries
}

const writeLock = (migrations: Record<string, string>) => {
    const lock: LockFile = { version: LOCK_VERSION, migrations }
    writeFileSync(lockPath, JSON.stringify(lock, null, 4) + '\n')
}

const readLock = (): LockFile | null => {
    if (!existsSync(lockPath)) return null
    return JSON.parse(readFileSync(lockPath, 'utf8')) as LockFile
}

const current = computeCurrent()

if (update) {
    writeLock(current)
    console.log(
        `Updated ${lockPath} (${Object.keys(current).length} migrations)`
    )
    process.exit(0)
}

const lock = readLock()
if (!lock) {
    console.error(
        `migrations.lock.json not found at ${lockPath}. Run "yarn migrations:update-lock" to create it.`
    )
    process.exit(1)
}

const errors: string[] = []
const seen = new Set<string>()

for (const [name, hash] of Object.entries(current)) {
    seen.add(name)
    const locked = lock.migrations[name]
    if (locked === undefined) {
        errors.push(` ${name}: new migration not present in lock file`)
    } else if (locked !== hash) {
        errors.push(` ${name}: contents changed since lock was last updated`)
    }
}

for (const name of Object.keys(lock.migrations)) {
    if (!seen.has(name)) {
        errors.push(` ${name}: missing in files but present in lock file`)
    }
}

if (errors.length > 0) {
    console.error('Migration lock check failed:\n' + errors.join('\n'))
    console.info(
        'Migrations are immutable once committed. If you added a new one, or consciously want to edit existing one run yarn migrations:update-lock and commit the updated migrations.lock.json.'
    )
    process.exit(1)
}

console.log(
    `Migration lock OK (${Object.keys(current).length} migrations verified)`
)
