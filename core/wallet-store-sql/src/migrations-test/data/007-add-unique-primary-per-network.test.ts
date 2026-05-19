// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, test } from 'vitest'
import { sql } from 'kysely'

import {
    forEachDialect,
    migrateDownThrough,
    migrateUpThrough,
    migrateUpToBefore,
    indexExists,
} from '../helpers'
import { insertIdp, insertNetwork } from '../seeds/001-init'
import { insertWallet } from '../seeds/005-add-wallet-disabled-reason'

const TARGET = 7
const INDEX_NAME = 'wallets_one_primary_per_network_user'

forEachDialect(
    'migration 007 - unique primary per network per user',
    ({ getDb }) => {
        test('up clears duplicate primaries for the same network and user, then creates partial unique index', async () => {
            const db = getDb()
            await migrateUpToBefore(db, TARGET)

            await insertIdp(db, { id: 'idp1' })
            await insertNetwork(db, { id: 'net1', idpId: 'idp1' })

            await insertWallet(db, {
                partyId: 'party1:1',
                userId: 'user1',
                networkId: 'net1',
                primary: true,
                hint: 'party1',
            })
            await insertWallet(db, {
                partyId: 'party2:1',
                userId: 'user1',
                networkId: 'net1',
                primary: true,
                hint: 'party2',
            })

            expect(await indexExists(db, 'wallets', INDEX_NAME)).toBe(false)

            await migrateUpThrough(db, TARGET)

            expect(await indexExists(db, 'wallets', INDEX_NAME)).toBe(true)

            const rows = await sql<{
                partyId: string
                primary: boolean | number
            }>`
            SELECT party_id, "primary" FROM wallets ORDER BY party_id
        `.execute(db)
            expect(rows.rows).toHaveLength(2)

            const primaryCount = rows.rows.filter(
                (r) => r.primary === true || r.primary === 1
            ).length
            expect(primaryCount).toBe(1)

            const kept = rows.rows.find(
                (r) => r.primary === true || r.primary === 1
            )
            expect(kept?.partyId).toBe('party1:1')
        })

        test('up forbids a second primary wallet for the same network and user', async () => {
            const db = getDb()
            await migrateUpToBefore(db, TARGET)

            await insertIdp(db, { id: 'idp1' })
            await insertNetwork(db, { id: 'net1', idpId: 'idp1' })
            await insertWallet(db, {
                partyId: 'party1:1',
                userId: 'user1',
                networkId: 'net1',
                hint: 'party1',
                primary: true,
            })

            await migrateUpThrough(db, TARGET)

            await expect(
                insertWallet(db, {
                    partyId: 'party2:1',
                    userId: 'user1',
                    networkId: 'net1',
                    hint: 'party2',
                    primary: true,
                })
            ).rejects.toThrow()
        })

        test('down drops the index so two primaries for the same network and user are allowed again', async () => {
            const db = getDb()
            await migrateUpThrough(db, TARGET)

            await insertIdp(db, { id: 'idp1' })
            await insertNetwork(db, { id: 'net1', idpId: 'idp1' })
            await insertWallet(db, {
                partyId: 'party1:1',
                userId: 'user1',
                networkId: 'net1',
                hint: 'party1',
                primary: true,
            })

            expect(await indexExists(db, 'wallets', INDEX_NAME)).toBe(true)

            await migrateDownThrough(db, TARGET)

            expect(await indexExists(db, 'wallets', INDEX_NAME)).toBe(false)

            await insertWallet(db, {
                partyId: 'party2:1',
                userId: 'user1',
                networkId: 'net1',
                hint: 'party2',
                primary: true,
            })

            const primaries = await sql<{
                partyId: string
                primary: boolean | number
            }>`
            SELECT party_id, "primary" FROM wallets ORDER BY party_id
        `.execute(db)
            expect(primaries.rows).toHaveLength(2)
            expect(
                primaries.rows.every(
                    (r) => r.primary === true || r.primary === 1
                )
            ).toBe(true)
        })
    }
)
