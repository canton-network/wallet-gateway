// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { Kysely, sql } from 'kysely'
import { DB } from '../../schema'

export async function insertWallet(
    db: Kysely<DB>,
    row: {
        partyId: string
        primary?: boolean
        hint?: string
        publicKey?: string
        namespace?: string
        userId: string
        networkId: string
        signingProviderId?: string
        status?: string | null
        disabled?: number
        reason?: string | null
    }
): Promise<void> {
    await sql`
        INSERT INTO wallets (
            party_id, "primary", hint, public_key, namespace, user_id,
            network_id, signing_provider_id, status, disabled, reason
        )
        VALUES (
            ${row.partyId},
            ${row.primary ? 1 : 0},
            ${row.hint ?? 'hint'},
            ${row.publicKey ?? 'pk'},
            ${row.namespace ?? 'ns'},
            ${row.userId},
            ${row.networkId},
            ${row.signingProviderId ?? 'internal'},
            ${row.status ?? null},
            ${row.disabled ?? 0},
            ${row.reason ?? null}
        )
    `.execute(db)
}
