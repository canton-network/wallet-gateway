// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { Kysely } from 'kysely'

export async function up(db: Kysely<unknown>): Promise<void> {
    await db.schema
        .createTable('messagesRaw')
        .addColumn('id', 'text', (col) => col.notNull().primaryKey())
        .addColumn('status', 'text', (col) => col.notNull())
        .addColumn('partyId', 'text', (col) => col.notNull())
        .addColumn('publicKey', 'text', (col) => col.notNull())
        .addColumn('message', 'text', (col) => col.notNull())
        .addColumn('origin', 'text')
        .addColumn('userId', 'text', (col) => col.notNull())
        .addColumn('networkId', 'text', (col) => col.notNull())
        .addColumn('createdAt', 'text', (col) => col.notNull())
        .addColumn('signedAt', 'text')
        .addColumn('signature', 'text')
        .execute()

    await db.schema
        .createIndex('idx_messagesRaw_user_network')
        .on('messagesRaw')
        .columns(['userId', 'networkId'])
        .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
    await db.schema.dropIndex('idx_messagesRaw_user_network').execute()
    await db.schema.dropTable('messagesRaw').execute()
}
