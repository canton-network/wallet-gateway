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
import { insertSession as insertSession001 } from '../seeds/001-init'
import { insertSession as insertSession004 } from '../seeds/004-add-session-id'

const TARGET = 4

forEachDialect('migration 004 - add session id', ({ getDb }) => {
    test('adds nullable id column and preserves existing rows', async () => {
        const db = getDb()
        await migrateUpToBefore(db, TARGET)

        await insertSession001(db, {
            network: 'net1',
            accessToken: 'token-1',
            userId: 'user1',
        })

        await migrateUpThrough(db, TARGET)

        const cols = await listColumns(db, 'sessions')
        const byName = new Map(cols.map((c) => [c.name, c]))
        expect(byName.get('id')?.nullable).toBe(true)

        const rows = await sql`
            SELECT id, network, access_token, user_id FROM sessions
        `.execute(db)
        expect(rows.rows).toHaveLength(1)
        expect(rows.rows[0]).toMatchObject({
            id: null,
            network: 'net1',
            accessToken: 'token-1',
            userId: 'user1',
        })
    })

    test('down removes the id column and preserves existing rows', async () => {
        const db = getDb()
        await migrateUpThrough(db, TARGET)
        await insertSession004(db, {
            id: 'session-xyz',
            network: 'net1',
            accessToken: 'token-2',
            userId: 'user1',
        })

        await migrateDownThrough(db, TARGET)

        expect(await hasColumn(db, 'sessions', 'id')).toBe(false)

        const rows = await sql`
            SELECT * FROM sessions
        `.execute(db)
        expect(rows.rows).toHaveLength(1)
        expect(rows.rows[0]).toMatchObject({
            network: 'net1',
            accessToken: 'token-2',
            userId: 'user1',
        })
        expect(rows.rows[0]).not.toHaveProperty('id')
    })
})
