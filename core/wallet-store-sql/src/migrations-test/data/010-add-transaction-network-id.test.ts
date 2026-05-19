// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest'
import { Kysely, sql } from 'kysely'

import {
    forEachDialect,
    migrateDownThrough,
    migrateUpThrough,
    migrateUpToBefore,
    hasColumn,
    listColumns,
    primaryKeyColumns,
} from '../helpers'
import { DB } from '../../schema'
import { insertIdp, insertNetwork } from '../seeds/001-init'
import { insertTransaction as insertTransaction003 } from '../seeds/003-transaction-origin'
import { insertTransaction as insertTransaction008 } from '../seeds/008-transaction-external-tx-id'

const TARGET = 10

async function insertOwnedNetwork(
    db: Kysely<DB>,
    networkId: string,
    userId: string
): Promise<void> {
    await insertIdp(db, { id: 'idp1' })
    await insertNetwork(db, {
        id: networkId,
        idpId: 'idp1',
        userId,
    })
}

forEachDialect('migration 010 - transaction network_id', ({ getDb }) => {
    test('adds NOT NULL network_id and preserves other transaction columns after backfill', async () => {
        const db = getDb()
        await migrateUpToBefore(db, TARGET)

        await insertOwnedNetwork(db, 'net1', 'user1')
        await insertTransaction008(db, {
            commandId: 'cmd-schema',
            userId: 'user1',
            origin: 'ledger',
            externalTxId: null,
        })

        await migrateUpThrough(db, TARGET)

        expect(await hasColumn(db, 'transactions', 'network_id')).toBe(true)
        const cols = await listColumns(db, 'transactions')
        const byName = new Map(cols.map((c) => [c.name, c]))
        expect(byName.get('network_id')?.nullable).toBe(false)

        expect(await primaryKeyColumns(db, 'transactions')).toEqual([
            'command_id',
        ])

        const rows = await sql`
            SELECT command_id, user_id, network_id, origin, external_tx_id FROM transactions
        `.execute(db)
        expect(rows.rows).toHaveLength(1)
        expect(rows.rows[0]).toMatchObject({
            commandId: 'cmd-schema',
            userId: 'user1',
            networkId: 'net1',
            origin: 'ledger',
            externalTxId: null,
        })
    })

    test('deleting a network cascades away transactions that reference it', async () => {
        const db = getDb()
        await migrateUpToBefore(db, TARGET)

        await insertOwnedNetwork(db, 'net-cascade', 'user1')
        await insertTransaction003(db, {
            commandId: 'cmd-fk',
            userId: 'user1',
        })

        await migrateUpThrough(db, TARGET)

        await sql`DELETE FROM networks WHERE id = 'net-cascade'`.execute(db)

        const rows = await sql<{ n: string | number }>`
            SELECT COUNT(*) AS n FROM transactions
        `.execute(db)
        expect(Number(rows.rows[0]?.n)).toBe(0)
    })

    test('backfills network_id when the transaction owner has exactly one user-owned network', async () => {
        const db = getDb()
        await migrateUpToBefore(db, TARGET)

        await insertOwnedNetwork(db, 'net1', 'user1')
        await insertTransaction003(db, {
            commandId: 'cmd-single',
            userId: 'user1',
            origin: 'app',
        })

        await migrateUpThrough(db, TARGET)

        const cols = await listColumns(db, 'transactions')
        expect(cols.find((c) => c.name === 'network_id')?.nullable).toBe(false)

        const rows = await sql`
            SELECT command_id, network_id, user_id FROM transactions
        `.execute(db)
        expect(rows.rows).toHaveLength(1)
        expect(rows.rows[0]).toMatchObject({
            commandId: 'cmd-single',
            networkId: 'net1',
            userId: 'user1',
        })
    })

    test('removes transactions when the owner has no user-owned network (only global networks)', async () => {
        const db = getDb()
        await migrateUpToBefore(db, TARGET)

        await insertIdp(db, { id: 'idp1' })
        await insertNetwork(db, {
            id: 'net-global',
            idpId: 'idp1',
            userId: null,
        })
        await insertTransaction003(db, {
            commandId: 'cmd-orphan',
            userId: 'user1',
        })

        await migrateUpThrough(db, TARGET)

        const rows = await sql<{ n: string | number }>`
            SELECT COUNT(*) AS n FROM transactions
        `.execute(db)
        expect(Number(rows.rows[0]?.n)).toBe(0)
    })

    test('removes transactions when the owner has more than one user-owned network', async () => {
        const db = getDb()
        await migrateUpToBefore(db, TARGET)

        await insertIdp(db, { id: 'idp1' })
        await insertNetwork(db, {
            id: 'net-a',
            idpId: 'idp1',
            userId: 'user1',
        })
        await insertNetwork(db, {
            id: 'net-b',
            idpId: 'idp1',
            userId: 'user1',
        })
        await insertTransaction003(db, {
            commandId: 'cmd-ambiguous',
            userId: 'user1',
        })

        await migrateUpThrough(db, TARGET)

        const rows = await sql<{ n: string | number }>`
            SELECT COUNT(*) AS n FROM transactions
        `.execute(db)
        expect(Number(rows.rows[0]?.n)).toBe(0)
    })

    test('backfills each user transaction from that user single owned network', async () => {
        const db = getDb()
        await migrateUpToBefore(db, TARGET)

        await insertIdp(db, { id: 'idp1' })
        await insertNetwork(db, {
            id: 'net-u1',
            idpId: 'idp1',
            userId: 'user1',
        })
        await insertNetwork(db, {
            id: 'net-u2',
            idpId: 'idp1',
            userId: 'user2',
        })
        await insertTransaction003(db, {
            commandId: 'cmd-u1',
            userId: 'user1',
        })
        await insertTransaction003(db, {
            commandId: 'cmd-u2',
            userId: 'user2',
        })

        await migrateUpThrough(db, TARGET)

        const rows = await sql<{ commandId: string; networkId: string }>`
            SELECT command_id, network_id FROM transactions ORDER BY command_id
        `.execute(db)
        expect(rows.rows).toEqual([
            { commandId: 'cmd-u1', networkId: 'net-u1' },
            { commandId: 'cmd-u2', networkId: 'net-u2' },
        ])
    })

    test('down removes network_id and preserves transaction rows', async () => {
        const db = getDb()
        await migrateUpToBefore(db, TARGET)

        await insertOwnedNetwork(db, 'net1', 'user1')
        await insertTransaction008(db, {
            commandId: 'cmd-down',
            userId: 'user1',
            externalTxId: 'ext',
        })

        await migrateUpThrough(db, TARGET)

        expect(await hasColumn(db, 'transactions', 'network_id')).toBe(true)

        await migrateDownThrough(db, TARGET)

        expect(await hasColumn(db, 'transactions', 'network_id')).toBe(false)

        const rows = await sql`
            SELECT command_id, user_id, external_tx_id FROM transactions
        `.execute(db)
        expect(rows.rows).toHaveLength(1)
        expect(rows.rows[0]).toMatchObject({
            commandId: 'cmd-down',
            userId: 'user1',
            externalTxId: 'ext',
        })
        expect(rows.rows[0]).not.toHaveProperty('networkId')
    })
})
