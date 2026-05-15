// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * TestToken admin endpoint handlers.
 *
 * These endpoints allow the example to bootstrap on-ledger state
 * (TokenRules + Token holdings) entirely through the registry's off-ledger
 * HTTP API, without the example code ever calling the Daml Ledger API directly
 * for Token-related operations.
 *
 *   POST /admin/v1/setup — creates TokenRules on both synchronizers
 *   POST /admin/v1/mint  — mints a Token holding for tokenAdmin
 */

import type { AdminHandlers, SubmitAsTokenAdmin } from '../../types.js'
import { invalidateCache } from '../../ledger.js'

const TEST_TOKEN_PREFIX =
    '#splice-test-token-v1:Splice.Testing.Tokens.TestTokenV1'

export interface AdminHandlerContext {
    tokenAdminPartyId: string
    globalSynchronizerId: string
    appSynchronizerId: string
    submitAsTokenAdmin: SubmitAsTokenAdmin
}

export function createAdminHandlers(ctx: AdminHandlerContext): AdminHandlers {
    return {
        async setupTokenRules(): Promise<void> {
            // Create TokenRules on both synchronizers in parallel so the
            // registry's ACS cache picks them up on the next call.
            await Promise.all([
                ctx.submitAsTokenAdmin({
                    commands: {
                        CreateCommand: {
                            templateId: `${TEST_TOKEN_PREFIX}:TokenRules`,
                            createArguments: { admin: ctx.tokenAdminPartyId },
                        },
                    },
                    synchronizerId: ctx.globalSynchronizerId,
                }),
                ctx.submitAsTokenAdmin({
                    commands: {
                        CreateCommand: {
                            templateId: `${TEST_TOKEN_PREFIX}:TokenRules`,
                            createArguments: { admin: ctx.tokenAdminPartyId },
                        },
                    },
                    synchronizerId: ctx.appSynchronizerId,
                }),
            ])
            // Invalidate the ACS cache so transfer-factory requests see the
            // newly created TokenRules contracts immediately.
            invalidateCache()
        },

        async mintToken({ amount }: { amount: string }): Promise<void> {
            await ctx.submitAsTokenAdmin({
                commands: [
                    {
                        CreateCommand: {
                            templateId: `${TEST_TOKEN_PREFIX}:Token`,
                            createArguments: {
                                holding: {
                                    owner: ctx.tokenAdminPartyId,
                                    instrumentId: {
                                        admin: ctx.tokenAdminPartyId,
                                        id: 'TestToken',
                                    },
                                    amount,
                                    lock: null,
                                    meta: { values: {} },
                                },
                            },
                        },
                    },
                ],
                synchronizerId: ctx.appSynchronizerId,
            })
        },
    }
}
