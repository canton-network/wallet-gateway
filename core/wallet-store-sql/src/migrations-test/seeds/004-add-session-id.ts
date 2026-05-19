// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { Kysely, sql } from 'kysely'
import { DB } from '../../schema'

export async function insertSession(
    db: Kysely<DB>,
    row: {
        id?: string | null
        network: string
        accessToken: string
        userId: string
    }
): Promise<void> {
    await sql`
        INSERT INTO sessions (id, network, access_token, user_id)
        VALUES (
            ${row.id ?? null},
            ${row.network},
            ${row.accessToken},
            ${row.userId}
        )
    `.execute(db)
}
