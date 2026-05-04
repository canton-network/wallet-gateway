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
    indexExists,
    listColumns,
    primaryKeyColumns,
} from '../helpers'
import { insertIdp, insertNetwork } from '../seeds/001-init'
import { insertTransaction } from '../seeds/010-transaction-with-network'

const TARGET = 11
const COMMAND_NETWORK_IDX = 'transactions_command_user_network_idx'

forEachDialect('migration 011 - transaction id primary key', ({ getDb }) => {
    test('adds non-null id as primary key and command/network/user index', async () => {
        const db = getDb()
        await migrateUpToBefore(db, TARGET)

        await insertIdp(db, { id: 'idp1' })
        await insertNetwork(db, { id: 'net1', idpId: 'idp1' })
        await insertTransaction(db, {
            commandId: 'cmd-schema',
            userId: 'user1',
            networkId: 'net1',
            origin: 'ledger',
            externalTxId: null,
        })

        await migrateUpThrough(db, TARGET)

        expect(await primaryKeyColumns(db, 'transactions')).toEqual(['id'])

        const cols = await listColumns(db, 'transactions')
        const byName = new Map(cols.map((c) => [c.name, c]))
        expect(byName.get('id')?.nullable).toBe(false)
        expect(byName.get('command_id')?.nullable).toBe(false)

        expect(await indexExists(db, 'transactions', COMMAND_NETWORK_IDX)).toBe(
            true
        )
    })

    test('assigns each row a new id and preserves other columns', async () => {
        const db = getDb()
        await migrateUpToBefore(db, TARGET)

        await insertIdp(db, { id: 'idp1' })
        await insertNetwork(db, { id: 'net1', idpId: 'idp1' })
        await insertTransaction(db, {
            commandId: 'cmd-preserve',
            userId: 'user1',
            networkId: 'net1',
            origin: 'app',
            externalTxId: 'ext',
        })

        await migrateUpThrough(db, TARGET)

        const rows = await sql<{
            id: string
            commandId: string
            userId: string
            networkId: string
            origin: string | null
            externalTxId: string | null
        }>`
            SELECT id, command_id, user_id, network_id, origin, external_tx_id
            FROM transactions
        `.execute(db)

        expect(rows.rows).toHaveLength(1)
        const row = rows.rows[0]!
        expect(row.commandId).toBe('cmd-preserve')
        expect(row.userId).toBe('user1')
        expect(row.networkId).toBe('net1')
        expect(row.origin).toBe('app')
        expect(row.externalTxId).toBe('ext')
        expect(String(row.id ?? '').trim().length).toBeGreaterThan(0)
    })

    test('deleting a network cascades to transactions after the migration', async () => {
        const db = getDb()
        await migrateUpToBefore(db, TARGET)

        await insertIdp(db, { id: 'idp1' })
        await insertNetwork(db, { id: 'net-delete', idpId: 'idp1' })
        await insertTransaction(db, {
            commandId: 'cmd-cascade',
            userId: 'user1',
            networkId: 'net-delete',
            externalTxId: null,
        })

        await migrateUpThrough(db, TARGET)

        await sql`DELETE FROM networks WHERE id = 'net-delete'`.execute(db)

        const n = await sql<{ c: string | number }>`
            SELECT COUNT(*) AS c FROM transactions
        `.execute(db)
        expect(Number(n.rows[0]?.c)).toBe(0)
    })

    test('down drops id, restores command_id as primary key, and appends id to command_id', async () => {
        const db = getDb()
        await migrateUpToBefore(db, TARGET)

        await insertIdp(db, { id: 'idp1' })
        await insertNetwork(db, { id: 'net1', idpId: 'idp1' })
        await insertTransaction(db, {
            commandId: 'cmd-down',
            userId: 'user1',
            networkId: 'net1',
            externalTxId: null,
        })

        await migrateUpThrough(db, TARGET)

        const before = await sql<{ id: string; commandId: string }>`
            SELECT id, command_id FROM transactions
        `.execute(db)
        const idVal = before.rows[0]?.id
        const cmdVal = before.rows[0]?.commandId
        expect(idVal).toBeDefined()
        expect(cmdVal).toBe('cmd-down')

        await migrateDownThrough(db, TARGET)

        expect(await hasColumn(db, 'transactions', 'id')).toBe(false)
        expect(await primaryKeyColumns(db, 'transactions')).toEqual([
            'command_id',
        ])
        expect(await indexExists(db, 'transactions', COMMAND_NETWORK_IDX)).toBe(
            false
        )

        const after = await sql<{ commandId: string }>`
            SELECT command_id FROM transactions
        `.execute(db)
        expect(after.rows[0]?.commandId).toBe(`${cmdVal}:${idVal}`)
    })
})
