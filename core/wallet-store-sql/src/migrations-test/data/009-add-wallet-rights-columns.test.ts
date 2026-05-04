// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import {
    PartyLevelRight,
    UserLevelRight,
} from '@canton-network/core-wallet-store'
import { expect, test } from 'vitest'
import { Kysely, sql } from 'kysely'

import { DB } from '../../schema'

import {
    columnNames,
    forEachDialect,
    migrateDownThrough,
    migrateUpThrough,
    migrateUpToBefore,
    primaryKeyColumns,
    tableExists,
} from '../helpers'
import { insertIdp, insertNetwork } from '../seeds/001-init'
import { insertWallet } from '../seeds/005-add-wallet-disabled-reason'
import {
    insertUserPartyRight,
    insertUserRight,
} from '../seeds/009-add-wallet-rights-columns'

const TARGET = 9

async function baseStoresThrough008(db: Kysely<DB>): Promise<void> {
    await insertIdp(db, { id: 'idp1' })
    await insertNetwork(db, { id: 'net1', idpId: 'idp1' })
    await insertWallet(db, {
        partyId: 'party1:1',
        userId: 'user1',
        networkId: 'net1',
        primary: true,
    })
}

forEachDialect('migration 009 - rights tables', ({ getDb }) => {
    test('up creates user_party_rights and user_rights with expected primary keys', async () => {
        const db = getDb()
        await migrateUpToBefore(db, TARGET)
        await baseStoresThrough008(db)

        await migrateUpThrough(db, TARGET)

        expect(await tableExists(db, 'user_party_rights')).toBe(true)
        expect(await tableExists(db, 'user_rights')).toBe(true)

        expect(await primaryKeyColumns(db, 'user_party_rights')).toEqual([
            'user_id',
            'network_id',
            'party_id',
            'right',
        ])
        expect(await primaryKeyColumns(db, 'user_rights')).toEqual([
            'user_id',
            'network_id',
            'right',
        ])

        expect(await columnNames(db, 'user_party_rights')).toEqual(
            ['network_id', 'party_id', 'right', 'user_id'].sort()
        )
        expect(await columnNames(db, 'user_rights')).toEqual(
            ['network_id', 'right', 'user_id'].sort()
        )
    })

    test('user_party_rights: insert succeeds when a matching wallet row exists', async () => {
        const db = getDb()
        await migrateUpToBefore(db, TARGET)
        await baseStoresThrough008(db)
        await migrateUpThrough(db, TARGET)

        await expect(
            insertUserPartyRight(db, {
                userId: 'user1',
                networkId: 'net1',
                partyId: 'party1:1',
                right: PartyLevelRight.CanReadAs,
            })
        ).resolves.toBeUndefined()
    })

    test('user_party_rights: composite FK rejects rows with no matching wallet (wrong party_id)', async () => {
        const db = getDb()
        await migrateUpToBefore(db, TARGET)
        await baseStoresThrough008(db)
        await migrateUpThrough(db, TARGET)

        await expect(
            insertUserPartyRight(db, {
                userId: 'user1',
                networkId: 'net1',
                partyId: 'party-unknown',
                right: PartyLevelRight.CanActAs,
            })
        ).rejects.toThrow()
    })

    test('user_party_rights: composite FK rejects rows when user_id does not match the wallet triple', async () => {
        const db = getDb()
        await migrateUpToBefore(db, TARGET)
        await baseStoresThrough008(db)
        await migrateUpThrough(db, TARGET)

        await expect(
            insertUserPartyRight(db, {
                userId: 'user2',
                networkId: 'net1',
                partyId: 'party1:1',
                right: PartyLevelRight.CanActAs,
            })
        ).rejects.toThrow()
    })

    test('user_party_rights: composite FK rejects rows when network_id does not match the wallet triple', async () => {
        const db = getDb()
        await migrateUpToBefore(db, TARGET)
        await insertIdp(db, { id: 'idp1' })
        await insertNetwork(db, { id: 'net1', idpId: 'idp1' })
        await insertNetwork(db, { id: 'net2', idpId: 'idp1' })
        await insertWallet(db, {
            partyId: 'party1:1',
            userId: 'user1',
            networkId: 'net1',
            primary: true,
        })
        await migrateUpThrough(db, TARGET)

        await expect(
            insertUserPartyRight(db, {
                userId: 'user1',
                networkId: 'net2',
                partyId: 'party1:1',
                right: PartyLevelRight.CanReadAs,
            })
        ).rejects.toThrow()
    })

    test('user_party_rights: duplicate primary key is rejected', async () => {
        const db = getDb()
        await migrateUpToBefore(db, TARGET)
        await baseStoresThrough008(db)
        await migrateUpThrough(db, TARGET)

        await insertUserPartyRight(db, {
            userId: 'user1',
            networkId: 'net1',
            partyId: 'party1:1',
            right: PartyLevelRight.CanReadAs,
        })

        await expect(
            insertUserPartyRight(db, {
                userId: 'user1',
                networkId: 'net1',
                partyId: 'party1:1',
                right: PartyLevelRight.CanReadAs,
            })
        ).rejects.toThrow()
    })

    test('user_party_rights: deleting the wallet cascades away dependent rights rows', async () => {
        const db = getDb()
        await migrateUpToBefore(db, TARGET)
        await baseStoresThrough008(db)
        await migrateUpThrough(db, TARGET)

        await insertUserPartyRight(db, {
            userId: 'user1',
            networkId: 'net1',
            partyId: 'party1:1',
            right: PartyLevelRight.CanExecuteAs,
        })

        await sql`
            DELETE FROM wallets
            WHERE party_id = 'party1:1'
              AND network_id = 'net1'
              AND user_id = 'user1'
        `.execute(db)

        const rows = await sql<{ n: string | number }>`
            SELECT COUNT(*) AS n FROM user_party_rights
        `.execute(db)
        expect(Number(rows.rows[0]?.n)).toBe(0)
    })

    test('user_rights: insert succeeds when the network exists', async () => {
        const db = getDb()
        await migrateUpToBefore(db, TARGET)
        await baseStoresThrough008(db)
        await migrateUpThrough(db, TARGET)

        await expect(
            insertUserRight(db, {
                userId: 'user1',
                networkId: 'net1',
                right: UserLevelRight.CanReadAsAnyParty,
            })
        ).resolves.toBeUndefined()
    })

    test('user_rights: FK rejects inserts for an unknown network_id', async () => {
        const db = getDb()
        await migrateUpToBefore(db, TARGET)
        await baseStoresThrough008(db)
        await migrateUpThrough(db, TARGET)

        await expect(
            insertUserRight(db, {
                userId: 'user1',
                networkId: 'net-missing',
                right: UserLevelRight.CanExecuteAsAnyParty,
            })
        ).rejects.toThrow()
    })

    test('user_rights: deleting a network cascades away user_rights for that network', async () => {
        const db = getDb()
        await migrateUpToBefore(db, TARGET)
        await insertIdp(db, { id: 'idp1' })
        await insertNetwork(db, { id: 'net1', idpId: 'idp1' })
        await insertNetwork(db, { id: 'net2', idpId: 'idp1' })
        await migrateUpThrough(db, TARGET)

        await insertUserRight(db, {
            userId: 'user1',
            networkId: 'net2',
            right: UserLevelRight.CanReadAsAnyParty,
        })

        await sql`DELETE FROM networks WHERE id = 'net2'`.execute(db)

        const rows = await sql<{ n: string | number }>`
            SELECT COUNT(*) AS n FROM user_rights WHERE network_id = 'net2'
        `.execute(db)
        expect(Number(rows.rows[0]?.n)).toBe(0)
    })

    test('down drops both rights tables', async () => {
        const db = getDb()
        await migrateUpThrough(db, TARGET)

        expect(await tableExists(db, 'user_party_rights')).toBe(true)
        expect(await tableExists(db, 'user_rights')).toBe(true)

        await migrateDownThrough(db, TARGET)

        expect(await tableExists(db, 'user_party_rights')).toBe(false)
        expect(await tableExists(db, 'user_rights')).toBe(false)
    })
})
