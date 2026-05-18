// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { Kysely, sql } from 'kysely'
import { DB } from '../../schema.js'

export async function insertIdp(
    db: Kysely<DB>,
    row: {
        id: string
        type?: 'oauth' | 'self_signed'
        issuer?: string
        configUrl?: string | null
    }
): Promise<void> {
    await sql`
        INSERT INTO idps (id, type, issuer, config_url)
        VALUES (${row.id}, ${row.type ?? 'self_signed'}, ${
            row.issuer ?? 'http://issuer.local'
        }, ${row.configUrl ?? null})
    `.execute(db)
}

export async function insertNetwork(
    db: Kysely<DB>,
    row: {
        id: string
        name?: string
        idpId: string
        userId?: string | null
        ledgerApiBaseUrl?: string
        synchronizerId?: string | null
        description?: string | null
        auth?: string
    }
): Promise<void> {
    await sql`
        INSERT INTO networks (
            id, name, synchronizer_id, description, ledger_api_base_url,
            user_id, identity_provider_id, auth
        )
        VALUES (
            ${row.id},
            ${row.name ?? row.id},
            ${row.synchronizerId ?? null},
            ${row.description ?? null},
            ${row.ledgerApiBaseUrl ?? 'http://ledger.local'},
            ${row.userId ?? null},
            ${row.idpId},
            ${row.auth ?? '{"method":"self_signed"}'}
        )
    `.execute(db)
}

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
    }
): Promise<void> {
    await sql`
        INSERT INTO wallets (
            party_id, "primary", hint, public_key, namespace, user_id,
            network_id, signing_provider_id, status
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
            ${row.status ?? null}
        )
    `.execute(db)
}

export async function insertTransaction(
    db: Kysely<DB>,
    row: {
        commandId: string
        status?: string
        preparedTransaction?: string
        preparedTransactionHash?: string
        payload?: string | null
        userId: string
    }
): Promise<void> {
    await sql`
        INSERT INTO transactions (
            command_id, status, prepared_transaction, prepared_transaction_hash,
            payload, user_id
        )
        VALUES (
            ${row.commandId},
            ${row.status ?? 'pending'},
            ${row.preparedTransaction ?? 'prep'},
            ${row.preparedTransactionHash ?? 'hash'},
            ${row.payload ?? null},
            ${row.userId}
        )
    `.execute(db)
}

export async function insertSession(
    db: Kysely<DB>,
    row: {
        network: string
        accessToken: string
        userId: string
    }
): Promise<void> {
    await sql`
        INSERT INTO sessions (network, access_token, user_id)
        VALUES (${row.network}, ${row.accessToken}, ${row.userId})
    `.execute(db)
}
