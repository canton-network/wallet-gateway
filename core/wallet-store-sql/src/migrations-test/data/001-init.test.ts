// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest'
import { sql } from 'kysely'

import {
    forEachDialect,
    migrateUpThrough,
    columnNames,
    primaryKeyColumns,
    tableExists,
} from '../helpers.js'
import { insertIdp, insertNetwork, insertWallet } from '../seeds/001-init'

const TARGET = 1

forEachDialect('migration 001 - init schema', ({ getDb }) => {
    test('creates all base tables with the expected columns and primary keys', async () => {
        const db = getDb()
        await migrateUpThrough(db, TARGET)

        for (const table of [
            'idps',
            'networks',
            'wallets',
            'transactions',
            'sessions',
        ]) {
            expect(await tableExists(db, table)).toBe(true)
        }

        expect(await columnNames(db, 'idps')).toEqual(
            ['id', 'type', 'issuer', 'config_url'].sort()
        )
        expect(await columnNames(db, 'networks')).toEqual(
            [
                'id',
                'name',
                'synchronizer_id',
                'description',
                'ledger_api_base_url',
                'user_id',
                'identity_provider_id',
                'auth',
                'admin_auth',
            ].sort()
        )
        expect(await columnNames(db, 'wallets')).toEqual(
            [
                'party_id',
                'primary',
                'hint',
                'public_key',
                'namespace',
                'user_id',
                'network_id',
                'signing_provider_id',
                'status',
                'external_tx_id',
                'topology_transactions',
            ].sort()
        )
        expect(await columnNames(db, 'transactions')).toEqual(
            [
                'command_id',
                'status',
                'prepared_transaction',
                'prepared_transaction_hash',
                'payload',
                'user_id',
            ].sort()
        )
        expect(await columnNames(db, 'sessions')).toEqual(
            ['network', 'access_token', 'user_id'].sort()
        )

        expect(await primaryKeyColumns(db, 'idps')).toEqual(['id'])
        expect(await primaryKeyColumns(db, 'networks')).toEqual(['id'])
        expect(await primaryKeyColumns(db, 'wallets')).toEqual(['party_id'])
        expect(await primaryKeyColumns(db, 'transactions')).toEqual([
            'command_id',
        ])
    })

    test('deleting a network cascades to its wallets', async () => {
        const db = getDb()
        await migrateUpThrough(db, TARGET)

        await insertIdp(db, { id: 'idp1' })
        await insertNetwork(db, { id: 'net1', idpId: 'idp1' })
        await insertNetwork(db, { id: 'net2', idpId: 'idp1' })
        await insertWallet(db, {
            partyId: 'party-net1',
            userId: 'user1',
            networkId: 'net1',
        })
        await insertWallet(db, {
            partyId: 'party-net2',
            userId: 'user1',
            networkId: 'net2',
        })

        await sql`DELETE FROM networks WHERE id = 'net1'`.execute(db)

        const wallets = await sql<{ partyId: string; networkId: string }>`
            SELECT party_id, network_id FROM wallets
        `.execute(db)
        expect(wallets.rows).toEqual([
            { partyId: 'party-net2', networkId: 'net2' },
        ])
    })

    test('deleting an idp cascades through networks to wallets', async () => {
        const db = getDb()
        await migrateUpThrough(db, TARGET)

        await insertIdp(db, { id: 'idp1' })
        await insertIdp(db, { id: 'idp2' })
        await insertNetwork(db, { id: 'net1', idpId: 'idp1' })
        await insertNetwork(db, { id: 'net2', idpId: 'idp2' })
        await insertWallet(db, {
            partyId: 'party-1',
            userId: 'user1',
            networkId: 'net1',
        })
        await insertWallet(db, {
            partyId: 'party-2',
            userId: 'user1',
            networkId: 'net2',
        })

        await sql`DELETE FROM idps WHERE id = 'idp1'`.execute(db)

        const networks = await sql<{ id: string }>`
            SELECT id FROM networks
        `.execute(db)
        expect(networks.rows).toEqual([{ id: 'net2' }])

        const wallets = await sql<{ partyId: string; networkId: string }>`
            SELECT party_id, network_id FROM wallets
        `.execute(db)
        expect(wallets.rows).toEqual([
            { partyId: 'party-2', networkId: 'net2' },
        ])
    })
})
