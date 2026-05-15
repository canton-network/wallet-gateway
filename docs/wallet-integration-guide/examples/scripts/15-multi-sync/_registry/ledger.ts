// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Ledger access helpers for the TestToken registry server.
 *
 * Reads `TokenRules` contracts from P3 (sv participant, port 4975) on behalf of the
 * tokenAdmin party, and caches results for a configurable TTL to avoid hammering the ledger on
 * every incoming HTTP request.
 */

import { LedgerClient } from '@canton-network/core-ledger-client'
import { AuthTokenProvider } from '@canton-network/core-wallet-auth'
import type { Logger } from 'pino'

// Template ID of the TestToken TokenRules contract (package:module:entity)
export const TOKEN_RULES_TEMPLATE_ID =
    '#splice-test-token-v1:Splice.Testing.Tokens.TestTokenV1:TokenRules'

// Matches the fields from jsActiveContract.createdEvent + synchronizerId
export interface TokenRulesContract {
    contractId: string
    templateId: string
    createdEventBlob: string
    synchronizerId: string
}

// ── cache ─────────────────────────────────────────────────────────────────────
interface Cache {
    contracts: TokenRulesContract[]
    expireAt: number
}

let cache: Cache | null = null
const CACHE_TTL_MS = 5_000

// ── client factory ────────────────────────────────────────────────────────────
export function buildLedgerClient(
    ledgerUrl: URL,
    logger: Logger
): LedgerClient {
    const accessTokenProvider = new AuthTokenProvider(
        {
            method: 'self_signed',
            issuer: 'unsafe-auth',
            credentials: {
                clientId: 'ledger-api-user',
                clientSecret: 'unsafe',
                audience: 'https://canton.network.global',
                scope: '',
            },
        },
        logger
    )

    return new LedgerClient({ baseUrl: ledgerUrl, logger, accessTokenProvider })
}

// ── ACS read ──────────────────────────────────────────────────────────────────
/**
 * Returns all `TokenRules` contracts visible to `tokenAdminPartyId`, served from a
 * short-lived cache so each HTTP request does not cause a ledger round-trip.
 */
export async function readTokenRules(
    client: LedgerClient,
    tokenAdminPartyId: string,
    logger: Logger
): Promise<TokenRulesContract[]> {
    const now = Date.now()
    if (cache && now < cache.expireAt) {
        logger.debug('TokenRules cache hit')
        return cache.contracts
    }

    logger.debug('Fetching TokenRules from ledger ACS…')

    // Get the current ledger end so the ACS query is anchored to a consistent offset
    const ledgerEnd = await client.get('/v2/state/ledger-end')
    const offset = ledgerEnd.offset ?? 0

    const rawAcs = await client.activeContracts({
        offset,
        templateIds: [TOKEN_RULES_TEMPLATE_ID],
        parties: [tokenAdminPartyId],
    })

    const contracts: TokenRulesContract[] = rawAcs
        .filter(
            (entry) =>
                entry.contractEntry != null &&
                'JsActiveContract' in entry.contractEntry
        )
        .map((entry) => {
            const jsAC = (
                entry.contractEntry as {
                    JsActiveContract: {
                        createdEvent: {
                            contractId: string
                            templateId: string
                            createdEventBlob: string
                        }
                        synchronizerId: string
                    }
                }
            ).JsActiveContract

            return {
                contractId: jsAC.createdEvent.contractId,
                templateId: jsAC.createdEvent.templateId,
                createdEventBlob: jsAC.createdEvent.createdEventBlob,
                synchronizerId: jsAC.synchronizerId,
            }
        })

    logger.debug(
        { count: contracts.length },
        'TokenRules contracts fetched from ledger'
    )

    cache = { contracts, expireAt: now + CACHE_TTL_MS }
    return contracts
}

/** Invalidate the ACS cache (call after known on-ledger state changes). */
export function invalidateCache(): void {
    cache = null
}
