// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest'
import { sql } from 'kysely'

import {
    columnNames,
    forEachDialect,
    indexExists,
    listColumns,
    migrateDownThrough,
    migrateUpThrough,
    migrateUpToBefore,
} from '../helpers.js'
import {
    insertSigningKey,
    insertSigningTransaction,
} from '../seeds/001-init.js'
import { insertSigningTransaction002 } from '../seeds/002-add-signed-at.js'

const TARGET = 3

forEachDialect('migration 003 - alter date fields to text', ({ getDb }) => {
    test('switches signing_keys timestamps from integer to text and casts existing values to strings', async () => {
        const db = getDb()
        await migrateUpToBefore(db, TARGET)

        const before = await listColumns(db, 'signing_keys')
        const beforeByName = new Map(before.map((c) => [c.name, c]))
        expect(beforeByName.get('created_at')?.dataType).toBe('integer')
        expect(beforeByName.get('updated_at')?.dataType).toBe('integer')

        await insertSigningKey(db, {
            id: 'key-1',
            userId: 'user1',
            createdAt: 1000,
            updatedAt: 2000,
        })

        await migrateUpThrough(db, TARGET)

        const after = await listColumns(db, 'signing_keys')
        const afterByName = new Map(after.map((c) => [c.name, c]))
        expect(afterByName.get('created_at')?.dataType).toBe('text')
        expect(afterByName.get('updated_at')?.dataType).toBe('text')
        expect(afterByName.get('created_at')?.nullable).toBe(false)
        expect(afterByName.get('updated_at')?.nullable).toBe(false)

        const rows = await sql<{
            id: string
            createdAt: string
            updatedAt: string
        }>`
            SELECT id, created_at, updated_at FROM signing_keys
        `.execute(db)
        expect(rows.rows).toHaveLength(1)
        expect(rows.rows[0]).toEqual({
            id: 'key-1',
            createdAt: '1000',
            updatedAt: '2000',
        })
    })

    test('switches signing_transactions timestamps from integer to text and preserves signed_at', async () => {
        const db = getDb()
        await migrateUpToBefore(db, TARGET)

        const before = await listColumns(db, 'signing_transactions')
        const beforeByName = new Map(before.map((c) => [c.name, c]))
        expect(beforeByName.get('created_at')?.dataType).toBe('integer')
        expect(beforeByName.get('updated_at')?.dataType).toBe('integer')
        expect(beforeByName.get('signed_at')?.dataType).toBe('text')

        await insertSigningTransaction002(db, {
            id: 'tx-int-only',
            userId: 'user1',
            createdAt: 100,
            updatedAt: 200,
        })
        await insertSigningTransaction002(db, {
            id: 'tx-with-signed-at',
            userId: 'user1',
            createdAt: 300,
            updatedAt: 400,
            signedAt: '2026-04-30T12:34:56.000Z',
        })

        await migrateUpThrough(db, TARGET)

        const after = await listColumns(db, 'signing_transactions')
        const afterByName = new Map(after.map((c) => [c.name, c]))
        expect(afterByName.get('created_at')?.dataType).toBe('text')
        expect(afterByName.get('updated_at')?.dataType).toBe('text')
        expect(afterByName.get('signed_at')?.dataType).toBe('text')
        expect(afterByName.get('signed_at')?.nullable).toBe(true)

        const rows = await sql<{
            id: string
            createdAt: string
            updatedAt: string
            signedAt: string | null
        }>`
            SELECT id, created_at, updated_at, signed_at
            FROM signing_transactions
            ORDER BY id
        `.execute(db)
        expect(rows.rows).toEqual([
            {
                id: 'tx-int-only',
                createdAt: '100',
                updatedAt: '200',
                signedAt: null,
            },
            {
                id: 'tx-with-signed-at',
                createdAt: '300',
                updatedAt: '400',
                signedAt: '2026-04-30T12:34:56.000Z',
            },
        ])
    })

    test('keeps the post-003 column set and recreates indexes', async () => {
        const db = getDb()
        await migrateUpThrough(db, TARGET)

        expect(await columnNames(db, 'signing_keys')).toEqual(
            [
                'created_at',
                'id',
                'metadata',
                'name',
                'private_key',
                'public_key',
                'updated_at',
                'user_id',
            ].sort()
        )
        expect(await columnNames(db, 'signing_transactions')).toEqual(
            [
                'created_at',
                'hash',
                'id',
                'metadata',
                'public_key',
                'signature',
                'signed_at',
                'status',
                'updated_at',
                'user_id',
            ].sort()
        )

        expect(
            await indexExists(db, 'signing_keys', 'idx_signing_keys_user_id')
        ).toBe(true)
        expect(
            await indexExists(db, 'signing_keys', 'idx_signing_keys_public_key')
        ).toBe(true)
        expect(
            await indexExists(
                db,
                'signing_transactions',
                'idx_signing_transactions_user_id'
            )
        ).toBe(true)
        expect(
            await indexExists(
                db,
                'signing_transactions',
                'idx_signing_transactions_status'
            )
        ).toBe(true)
        expect(
            await indexExists(
                db,
                'signing_transactions',
                'idx_signing_transactions_created_at'
            )
        ).toBe(true)
    })

    test('down reverts timestamps back to integer and casts text values to numbers', async () => {
        const db = getDb()
        await migrateUpToBefore(db, TARGET)

        await insertSigningKey(db, {
            id: 'key-down',
            userId: 'user1',
            createdAt: 7777,
            updatedAt: 8888,
        })
        await insertSigningTransaction(db, {
            id: 'tx-down',
            userId: 'user1',
            createdAt: 11,
            updatedAt: 22,
        })

        await migrateUpThrough(db, TARGET)
        await migrateDownThrough(db, TARGET)

        const keyCols = await listColumns(db, 'signing_keys')
        const keyByName = new Map(keyCols.map((c) => [c.name, c]))
        expect(keyByName.get('created_at')?.dataType).toBe('integer')
        expect(keyByName.get('updated_at')?.dataType).toBe('integer')

        const txCols = await listColumns(db, 'signing_transactions')
        const txByName = new Map(txCols.map((c) => [c.name, c]))
        expect(txByName.get('created_at')?.dataType).toBe('integer')
        expect(txByName.get('updated_at')?.dataType).toBe('integer')

        const keys = await sql<{
            id: string
            createdAt: number
            updatedAt: number
        }>`
            SELECT id, created_at, updated_at FROM signing_keys
        `.execute(db)
        expect(keys.rows).toHaveLength(1)
        expect(keys.rows[0]?.id).toBe('key-down')
        expect(Number(keys.rows[0]?.createdAt)).toBe(7777)
        expect(Number(keys.rows[0]?.updatedAt)).toBe(8888)

        const txs = await sql<{
            id: string
            createdAt: number
            updatedAt: number
        }>`
            SELECT id, created_at, updated_at FROM signing_transactions
        `.execute(db)
        expect(txs.rows).toHaveLength(1)
        expect(txs.rows[0]?.id).toBe('tx-down')
        expect(Number(txs.rows[0]?.createdAt)).toBe(11)
        expect(Number(txs.rows[0]?.updatedAt)).toBe(22)
    })
})
