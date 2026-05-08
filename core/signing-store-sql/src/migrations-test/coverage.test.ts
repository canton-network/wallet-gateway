// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { describe, expect, test } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = resolve(here, '../migrations')
const TESTS_DIR = resolve(here, 'data')

const migrationNames = (): string[] =>
    readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith('.ts'))
        .map((f) => f.replace(/\.ts$/, ''))

const testNames = (): string[] =>
    readdirSync(TESTS_DIR)
        .filter((f) => f.endsWith('.test.ts'))
        .map((f) => f.replace(/\.test\.ts$/, ''))

describe('migration test coverage', () => {
    const migrations = new Set(migrationNames())
    const tests = new Set(testNames())

    test('every migration has a sibling test file with the same name', () => {
        const missing = [...migrations]
            .filter((name) => !tests.has(name))
            .map((name) => `expected src/migrations-test/data/${name}.test.ts`)
        expect(
            missing,
            `Migrations without corresponding tests:\n  ${missing.join('\n  ')}`
        ).toEqual([])
    })

    test('every migration test file matches an existing migration', () => {
        const orphans = [...tests]
            .filter((name) => !migrations.has(name))
            .map((name) => `no migration src/migrations/${name}.ts found`)
        expect(
            orphans,
            `Test files without a backing migration:\n  ${orphans.join('\n  ')}`
        ).toEqual([])
    })
})
