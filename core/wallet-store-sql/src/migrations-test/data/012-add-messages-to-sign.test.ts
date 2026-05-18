// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest'

import {
    columnNames,
    forEachDialect,
    indexExists,
    listColumns,
    migrateDownThrough,
    migrateUpThrough,
    migrateUpToBefore,
    primaryKeyColumns,
    tableExists,
} from '../helpers.js'
import { insertMessageRaw } from '../seeds/012-add-messages-to-sign.js'

const TARGET = 12
const TABLE = 'messages_raw'
const INDEX_NAME = 'idx_messages_raw_user_network'

forEachDialect('migration 012 - messages to sign', ({ getDb }) => {
    test('creates messages_raw table with expected columns, primary key, and index', async () => {
        const db = getDb()
        await migrateUpToBefore(db, TARGET)
        expect(await tableExists(db, TABLE)).toBe(false)

        await migrateUpThrough(db, TARGET)

        expect(await tableExists(db, TABLE)).toBe(true)
        expect(await primaryKeyColumns(db, TABLE)).toEqual(['id'])
        expect(await columnNames(db, TABLE)).toEqual(
            [
                'created_at',
                'id',
                'message',
                'network_id',
                'origin',
                'party_id',
                'public_key',
                'signature',
                'signed_at',
                'status',
                'user_id',
            ].sort()
        )

        const cols = await listColumns(db, TABLE)
        const byName = new Map(cols.map((c) => [c.name, c]))
        expect(byName.get('origin')?.nullable).toBe(true)
        expect(byName.get('signed_at')?.nullable).toBe(true)
        expect(byName.get('signature')?.nullable).toBe(true)
        expect(byName.get('status')?.nullable).toBe(false)
        expect(byName.get('message')?.nullable).toBe(false)

        expect(await indexExists(db, TABLE, INDEX_NAME)).toBe(true)
    })

    test('down drops messages_raw table and index', async () => {
        const db = getDb()
        await migrateUpThrough(db, TARGET)

        await insertMessageRaw(db, {
            id: 'msg-1',
            status: 'signed',
            partyId: 'party::1',
            publicKey: 'pk-1',
            message: 'hello world',
            userId: 'user2',
            networkId: 'net1',
            createdAt: '2026-05-08T13:00:00.000Z',
            signedAt: '2026-05-08T13:01:00.000Z',
            signature: 'signature',
        })

        await migrateDownThrough(db, TARGET)

        expect(await tableExists(db, TABLE)).toBe(false)
        expect(await indexExists(db, TABLE, INDEX_NAME)).toBe(false)
    })
})
