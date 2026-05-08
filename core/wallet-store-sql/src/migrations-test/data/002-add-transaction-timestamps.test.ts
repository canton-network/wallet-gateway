// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest'
import { sql } from 'kysely'

import {
    forEachDialect,
    migrateDownThrough,
    migrateUpThrough,
    migrateUpToBefore,
    hasColumn,
    listColumns,
} from '../helpers'
import {
    insertIdp,
    insertNetwork,
    insertTransaction as insertTransaction001,
} from '../seeds/001-init'
import { insertTransaction as insertTransaction002 } from '../seeds/002-transaction-timestamps'

const TARGET = 2

forEachDialect('migration 002 - add transaction timestamps', ({ getDb }) => {
    test('adds nullable created_at and signed_at columns and preserves existing rows', async () => {
        const db = getDb()
        await migrateUpToBefore(db, TARGET)

        await insertIdp(db, { id: 'idp1' })
        await insertNetwork(db, { id: 'net1', idpId: 'idp1' })
        await insertTransaction001(db, {
            commandId: 'cmd-001',
            userId: 'user1',
        })

        await migrateUpThrough(db, TARGET)

        const cols = await listColumns(db, 'transactions')
        const byName = new Map(cols.map((c) => [c.name, c]))
        expect(byName.get('created_at')?.nullable).toBe(true)
        expect(byName.get('signed_at')?.nullable).toBe(true)

        const rows = await sql`
            SELECT command_id, created_at, signed_at FROM transactions
        `.execute(db)
        expect(rows.rows).toHaveLength(1)
        expect(rows.rows[0]).toMatchObject({
            commandId: 'cmd-001',
            createdAt: null,
            signedAt: null,
        })
    })

    test('down removes the timestamp columns and preserves existing rows', async () => {
        const db = getDb()
        await migrateUpThrough(db, TARGET)
        await insertIdp(db, { id: 'idp1' })
        await insertNetwork(db, { id: 'net1', idpId: 'idp1' })
        await insertTransaction002(db, {
            commandId: 'cmd-002',
            userId: 'user1',
            createdAt: new Date('2026-01-01').toISOString(),
            signedAt: new Date('2026-01-02').toISOString(),
        })

        await migrateDownThrough(db, TARGET)

        expect(await hasColumn(db, 'transactions', 'created_at')).toBe(false)
        expect(await hasColumn(db, 'transactions', 'signed_at')).toBe(false)

        const rows = await sql<{ commandId: string }>`
            SELECT * FROM transactions
        `.execute(db)
        expect(rows.rows).toHaveLength(1)
        expect(rows.rows[0]).toMatchObject({
            commandId: 'cmd-002',
            userId: 'user1',
        })
        expect(rows.rows[0]).not.toHaveProperty('createdAt')
        expect(rows.rows[0]).not.toHaveProperty('signedAt')
    })
})
