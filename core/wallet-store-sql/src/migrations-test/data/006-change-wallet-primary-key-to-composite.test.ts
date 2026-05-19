// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest'
import { sql } from 'kysely'

import {
    forEachDialect,
    migrateDownThrough,
    migrateUpThrough,
    migrateUpToBefore,
    listColumns,
    primaryKeyColumns,
} from '../helpers.js'
import { insertIdp, insertNetwork } from '../seeds/001-init'
import { insertWallet as insertWallet005 } from '../seeds/005-add-wallet-disabled-reason'

const TARGET = 6

forEachDialect('migration 006 - composite wallet primary key', ({ getDb }) => {
    test('changes wallets PK to (party_id, network_id, user_id), enforces network_id NOT NULL, preserves rows', async () => {
        const db = getDb()
        await migrateUpToBefore(db, TARGET)

        await insertIdp(db, { id: 'idp1' })
        await insertNetwork(db, { id: 'net1', idpId: 'idp1' })
        await insertWallet005(db, {
            partyId: 'party-1',
            userId: 'user1',
            networkId: 'net1',
            disabled: 1,
            reason: 'pre-existing',
        })

        expect(await primaryKeyColumns(db, 'wallets')).toEqual(['party_id'])

        await migrateUpThrough(db, TARGET)

        expect(await primaryKeyColumns(db, 'wallets')).toEqual([
            'party_id',
            'network_id',
            'user_id',
        ])

        const cols = await listColumns(db, 'wallets')
        const byName = new Map(cols.map((c) => [c.name, c]))
        expect(byName.get('network_id')?.nullable).toBe(false)

        const rows = await sql<{
            partyId: string
            userId: string
            networkId: string
            disabled: number
            reason: string | null
        }>`
                SELECT party_id, user_id, network_id, disabled, reason
                FROM wallets
            `.execute(db)
        expect(rows.rows).toEqual([
            {
                partyId: 'party-1',
                userId: 'user1',
                networkId: 'net1',
                disabled: 1,
                reason: 'pre-existing',
            },
        ])
    })

    test('after up, the same party_id can exist on a different network', async () => {
        const db = getDb()
        await migrateUpThrough(db, TARGET)

        await insertIdp(db, { id: 'idp1' })
        await insertNetwork(db, { id: 'net1', idpId: 'idp1' })
        await insertNetwork(db, { id: 'net2', idpId: 'idp1' })

        await insertWallet005(db, {
            partyId: 'party-shared',
            userId: 'user1',
            networkId: 'net1',
        })
        await expect(
            insertWallet005(db, {
                partyId: 'party-shared',
                userId: 'user1',
                networkId: 'net2',
            })
        ).resolves.toBeUndefined()

        await expect(
            insertWallet005(db, {
                partyId: 'party-shared',
                userId: 'user1',
                networkId: 'net1',
            })
        ).rejects.toThrow()
    })

    test('down reverts PK to party_id, restores network_id nullability, deduplicates rows by party_id keeping the first inserted', async () => {
        const db = getDb()
        await migrateUpThrough(db, TARGET)

        await insertIdp(db, { id: 'idp1' })
        await insertNetwork(db, { id: 'net1', idpId: 'idp1' })
        await insertNetwork(db, { id: 'net2', idpId: 'idp1' })

        await insertWallet005(db, {
            partyId: 'party-shared',
            userId: 'user1',
            networkId: 'net1',
            hint: 'first',
        })
        await insertWallet005(db, {
            partyId: 'party-shared',
            userId: 'user1',
            networkId: 'net2',
            hint: 'second',
        })
        await insertWallet005(db, {
            partyId: 'party-unique',
            userId: 'user1',
            networkId: 'net1',
            hint: 'lonely',
        })

        await migrateDownThrough(db, TARGET)

        expect(await primaryKeyColumns(db, 'wallets')).toEqual(['party_id'])

        const cols = await listColumns(db, 'wallets')
        const byName = new Map(cols.map((c) => [c.name, c]))
        expect(byName.get('network_id')?.nullable).toBe(true)

        const rows = await sql<{ partyId: string; hint: string }>`
                SELECT party_id, hint FROM wallets ORDER BY party_id
            `.execute(db)
        expect(rows.rows).toEqual([
            { partyId: 'party-shared', hint: 'first' },
            { partyId: 'party-unique', hint: 'lonely' },
        ])
    })
})
