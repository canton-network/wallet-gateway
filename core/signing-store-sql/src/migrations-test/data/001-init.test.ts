// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest'

import {
    columnNames,
    forEachDialect,
    indexExists,
    migrateUpThrough,
    primaryKeyColumns,
    tableExists,
} from '../helpers.js'
import {
    insertSigningDriverConfig,
    insertSigningKey,
    insertSigningTransaction,
} from '../seeds/001-init.js'

const TARGET = 1

forEachDialect('migration 001 - init signing store schema', ({ getDb }) => {
    test('creates base tables, columns, primary keys, and indexes', async () => {
        const db = getDb()
        await migrateUpThrough(db, TARGET)

        for (const table of [
            'signing_keys',
            'signing_transactions',
            'signing_driver_configs',
        ]) {
            expect(await tableExists(db, table)).toBe(true)
        }

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
                'status',
                'updated_at',
                'user_id',
            ].sort()
        )
        expect(await columnNames(db, 'signing_driver_configs')).toEqual(
            ['config', 'driver_id', 'user_id'].sort()
        )

        expect(await primaryKeyColumns(db, 'signing_keys')).toEqual(['id'])
        expect(await primaryKeyColumns(db, 'signing_transactions')).toEqual([
            'id',
        ])
        expect(await primaryKeyColumns(db, 'signing_driver_configs')).toEqual([
            'user_id',
            'driver_id',
        ])

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

    test('enforces unique constraint (user_id, id) on signing_keys', async () => {
        const db = getDb()
        await migrateUpThrough(db, TARGET)

        await insertSigningKey(db, {
            id: 'same-key-id',
            userId: 'same-user',
            name: 'first',
            publicKey: 'pk1',
        })

        await expect(
            insertSigningKey(db, {
                id: 'same-key-id',
                userId: 'same-user',
                name: 'duplicate',
                publicKey: 'pk2',
            })
        ).rejects.toThrow()
    })

    test('enforces unique constraint (user_id, id) on signing_transactions', async () => {
        const db = getDb()
        await migrateUpThrough(db, TARGET)

        await insertSigningTransaction(db, {
            id: 'same-key-id',
            userId: 'same-user',
            publicKey: 'pk1',
        })

        await expect(
            insertSigningTransaction(db, {
                id: 'same-key-id',
                userId: 'same-user',
                publicKey: 'pk2',
            })
        ).rejects.toThrow()
    })

    test('enforces primary key constraint (user_id, driver_id) on signing_driver_configs', async () => {
        const db = getDb()
        await migrateUpThrough(db, TARGET)

        await insertSigningDriverConfig(db, {
            driverId: 'same-driver-id',
            userId: 'same-user',
        })

        await expect(
            insertSigningDriverConfig(db, {
                driverId: 'same-driver-id',
                userId: 'same-user',
            })
        ).rejects.toThrow()
    })
})
