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
    insertWallet as insertWallet001,
} from '../seeds/001-init'
import { insertWallet as insertWallet005 } from '../seeds/005-add-wallet-disabled-reason'

const TARGET = 5

forEachDialect('migration 005 - add wallet disabled / reason', ({ getDb }) => {
    test('adds disabled (NOT NULL) and reason (nullable) columns and preserves existing rows', async () => {
        const db = getDb()
        await migrateUpToBefore(db, TARGET)

        await insertIdp(db, { id: 'idp1' })
        await insertNetwork(db, { id: 'net1', idpId: 'idp1' })
        await insertWallet001(db, {
            partyId: 'party-1',
            userId: 'user1',
            networkId: 'net1',
        })

        await migrateUpThrough(db, TARGET)

        const cols = await listColumns(db, 'wallets')
        const byName = new Map(cols.map((c) => [c.name, c]))
        expect(byName.get('disabled')?.nullable).toBe(false)
        expect(byName.get('reason')?.nullable).toBe(true)

        const rows = await sql`
                SELECT party_id, disabled, reason FROM wallets
            `.execute(db)
        expect(rows.rows).toHaveLength(1)
        expect(rows.rows[0]).toMatchObject({
            partyId: 'party-1',
            disabled: 0,
            reason: null,
        })
    })

    test('down removes the disabled and reason columns and preserves existing rows', async () => {
        const db = getDb()
        await migrateUpThrough(db, TARGET)
        await insertIdp(db, { id: 'idp1' })
        await insertNetwork(db, { id: 'net1', idpId: 'idp1' })
        await insertWallet005(db, {
            partyId: 'party-2',
            userId: 'user1',
            networkId: 'net1',
            disabled: 1,
            reason: 'disabled_reason',
        })

        await migrateDownThrough(db, TARGET)

        expect(await hasColumn(db, 'wallets', 'disabled')).toBe(false)
        expect(await hasColumn(db, 'wallets', 'reason')).toBe(false)

        const rows = await sql`
                SELECT * FROM wallets
            `.execute(db)
        expect(rows.rows).toHaveLength(1)
        expect(rows.rows[0]).toMatchObject({
            partyId: 'party-2',
            userId: 'user1',
            networkId: 'net1',
        })
        expect(rows.rows[0]).not.toHaveProperty('disabled')
        expect(rows.rows[0]).not.toHaveProperty('reason')
    })
})
