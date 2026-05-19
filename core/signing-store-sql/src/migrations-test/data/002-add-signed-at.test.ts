// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest'

import {
    forEachDialect,
    hasColumn,
    listColumns,
    migrateDownThrough,
    migrateUpThrough,
} from '../helpers.js'

const TARGET = 2

forEachDialect('migration 002 - add signed_at', ({ getDb }) => {
    test('adds nullable signed_at on signing_transactions', async () => {
        const db = getDb()
        await migrateUpThrough(db, TARGET)

        expect(await hasColumn(db, 'signing_transactions', 'signed_at')).toBe(
            true
        )

        const cols = await listColumns(db, 'signing_transactions')
        const signedAt = cols.find((c) => c.name === 'signed_at')
        expect(signedAt?.nullable).toBe(true)
    })

    test('down removes signed_at', async () => {
        const db = getDb()
        await migrateUpThrough(db, TARGET)
        await migrateDownThrough(db, TARGET)

        expect(await hasColumn(db, 'signing_transactions', 'signed_at')).toBe(
            false
        )
    })
})
