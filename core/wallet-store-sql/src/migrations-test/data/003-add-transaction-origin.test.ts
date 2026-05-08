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
import { insertIdp, insertNetwork } from '../seeds/001-init'
import { insertTransaction as insertTransaction002 } from '../seeds/002-transaction-timestamps'
import { insertTransaction as insertTransaction003 } from '../seeds/003-transaction-origin'

const TARGET = 3

forEachDialect('migration 003 - add transaction origin', ({ getDb }) => {
    test('adds nullable origin column and preserves existing rows', async () => {
        const db = getDb()
        await migrateUpToBefore(db, TARGET)

        await insertIdp(db, { id: 'idp1' })
        await insertNetwork(db, { id: 'net1', idpId: 'idp1' })
        await insertTransaction002(db, {
            commandId: 'cmd-001',
            userId: 'user1',
        })

        await migrateUpThrough(db, TARGET)

        const cols = await listColumns(db, 'transactions')
        const byName = new Map(cols.map((c) => [c.name, c]))
        expect(byName.get('origin')?.nullable).toBe(true)

        const rows = await sql`
            SELECT command_id, origin FROM transactions
        `.execute(db)
        expect(rows.rows).toHaveLength(1)
        expect(rows.rows[0]).toMatchObject({
            commandId: 'cmd-001',
            origin: null,
        })
    })

    test('down removes the origin column and preserves existing rows', async () => {
        const db = getDb()
        await migrateUpThrough(db, TARGET)
        await insertIdp(db, { id: 'idp1' })
        await insertNetwork(db, { id: 'net1', idpId: 'idp1' })
        await insertTransaction003(db, {
            commandId: 'cmd-002',
            userId: 'user1',
            origin: 'http://localhost:8080',
        })

        await migrateDownThrough(db, TARGET)

        expect(await hasColumn(db, 'transactions', 'origin')).toBe(false)

        const rows = await sql`
            SELECT * FROM transactions
        `.execute(db)
        expect(rows.rows).toHaveLength(1)
        expect(rows.rows[0]).toMatchObject({
            commandId: 'cmd-002',
            userId: 'user1',
        })
        expect(rows.rows[0]).not.toHaveProperty('origin')
    })
})
