// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { Kysely, sql } from 'kysely'
import { DB } from '../schema.js'
import { isPostgres } from '../utils.js'

export async function up(db: Kysely<DB>): Promise<void> {
    console.log('Adding network_id column to transactions table')

    await db.schema
        .alterTable('transactions')
        .addColumn('network_id', 'text')
        .execute()

    // Remove records we cannot map to exactly one network for the user.
    await sql`
        DELETE FROM transactions
        WHERE (
            SELECT COUNT(*)
            FROM networks n
            WHERE n.user_id = transactions.user_id
        ) <> 1
    `.execute(db)

    // Backfill from the single network owned by the transaction user.
    await sql`
        UPDATE transactions
        SET network_id = (
            SELECT n.id
            FROM networks n
            WHERE n.user_id = transactions.user_id
        )
        WHERE network_id IS NULL
    `.execute(db)

    const pg = await isPostgres(db)
    if (pg) {
        await sql`
            ALTER TABLE transactions
            ADD CONSTRAINT transactions_network_fk
            FOREIGN KEY (network_id) REFERENCES networks(id) ON DELETE CASCADE
        `.execute(db)

        await sql`
            ALTER TABLE transactions
            ALTER COLUMN network_id SET NOT NULL
        `.execute(db)
        return
    }

    // SQLite: recreate table to enforce NOT NULL on network_id.
    await db.schema.dropTable('transactions_new').ifExists().execute()

    await db.schema
        .createTable('transactions_new')
        .addColumn('command_id', 'text', (col) => col.primaryKey())
        .addColumn('status', 'text', (col) => col.notNull())
        .addColumn('prepared_transaction', 'text', (col) => col.notNull())
        .addColumn('prepared_transaction_hash', 'text', (col) => col.notNull())
        .addColumn('payload', 'text')
        .addColumn('origin', 'text')
        .addColumn('user_id', 'text', (col) => col.notNull())
        .addColumn('network_id', 'text', (col) =>
            col.references('networks.id').onDelete('cascade').notNull()
        )
        .addColumn('created_at', 'text')
        .addColumn('signed_at', 'text')
        .addColumn('external_tx_id', 'text')
        .execute()

    await sql`
        INSERT INTO transactions_new (
            command_id,
            status,
            prepared_transaction,
            prepared_transaction_hash,
            payload,
            origin,
            user_id,
            network_id,
            created_at,
            signed_at,
            external_tx_id
        )
        SELECT
            command_id,
            status,
            prepared_transaction,
            prepared_transaction_hash,
            payload,
            origin,
            user_id,
            network_id,
            created_at,
            signed_at,
            external_tx_id
        FROM transactions
    `.execute(db)

    await db.schema.dropTable('transactions').execute()
    await db.schema
        .alterTable('transactions_new')
        .renameTo('transactions')
        .execute()
}

export async function down(db: Kysely<DB>): Promise<void> {
    console.log('Dropping network_id column from transactions table')

    const pg = await isPostgres(db)
    if (pg) {
        await sql`
            ALTER TABLE transactions
            DROP CONSTRAINT IF EXISTS transactions_network_fk
        `.execute(db)

        await sql`
            ALTER TABLE transactions
            DROP COLUMN network_id
        `.execute(db)
        return
    }

    // SQLite: recreate table without network_id.
    await db.schema.dropTable('transactions_new').ifExists().execute()

    await db.schema
        .createTable('transactions_new')
        .addColumn('command_id', 'text', (col) => col.primaryKey())
        .addColumn('status', 'text', (col) => col.notNull())
        .addColumn('prepared_transaction', 'text', (col) => col.notNull())
        .addColumn('prepared_transaction_hash', 'text', (col) => col.notNull())
        .addColumn('payload', 'text')
        .addColumn('origin', 'text')
        .addColumn('user_id', 'text', (col) => col.notNull())
        .addColumn('created_at', 'text')
        .addColumn('signed_at', 'text')
        .addColumn('external_tx_id', 'text')
        .execute()

    await sql`
        INSERT INTO transactions_new (
            command_id,
            status,
            prepared_transaction,
            prepared_transaction_hash,
            payload,
            origin,
            user_id,
            created_at,
            signed_at,
            external_tx_id
        )
        SELECT
            command_id,
            status,
            prepared_transaction,
            prepared_transaction_hash,
            payload,
            origin,
            user_id,
            created_at,
            signed_at,
            external_tx_id
        FROM transactions
    `.execute(db)

    await db.schema.dropTable('transactions').execute()
    await db.schema
        .alterTable('transactions_new')
        .renameTo('transactions')
        .execute()
}
