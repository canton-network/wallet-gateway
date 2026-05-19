// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { Kysely, sql } from 'kysely'

import { DB } from '../../schema.js'
export async function insertSigningTransaction002(
    db: Kysely<DB>,
    row: {
        id: string
        userId: string
        hash?: string
        signature?: string | null
        publicKey?: string
        status?: string
        metadata?: string | null
        createdAt?: number
        updatedAt?: number
        signedAt?: string | null
    }
): Promise<void> {
    const created = row.createdAt ?? 123
    const updated = row.updatedAt ?? created
    await sql`
        INSERT INTO signing_transactions (
            id, user_id, hash, signature, public_key, status, metadata,
            created_at, updated_at, signed_at
        )
        VALUES (
            ${row.id},
            ${row.userId},
            ${row.hash ?? 'hash'},
            ${row.signature ?? null},
            ${row.publicKey ?? 'pk'},
            ${row.status ?? 'pending'},
            ${row.metadata ?? null},
            ${created},
            ${updated},
            ${row.signedAt ?? null}
        )
    `.execute(db)
}
