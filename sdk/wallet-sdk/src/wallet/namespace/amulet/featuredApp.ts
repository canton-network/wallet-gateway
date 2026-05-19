// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { SDKLogger } from '../../logger/logger.js'
import {
    FeaturedAppRight,
    LookupFeaturedAppRightsOptions,
    GrantFeaturedAppRightsOptions,
} from './types.js'
import { AmuletNamespaceConfig } from './namespace.js'
import { LedgerNamespace } from '../ledger/namespace.js'

const defaultMaxRetries = 10
const defaultDelayMs = 5000

export class FeaturedAppNamespace {
    private readonly logger: SDKLogger
    private readonly ledger: LedgerNamespace

    constructor(private readonly ctx: AmuletNamespaceConfig) {
        this.logger = ctx.commonCtx.logger.child({
            namespace: 'FeaturedAppNamespace',
        })

        this.ledger = new LedgerNamespace(ctx.commonCtx)
    }

    /**
     * Looks up if a party has FeaturedAppRight.
     * Has an in built retry and delay between attempts
     * @returns If defined, a contract of Daml template `Splice.Amulet.FeaturedAppRight`.
     */
    public async rights(
        options: LookupFeaturedAppRightsOptions
    ): Promise<FeaturedAppRight | undefined> {
        const { partyId } = options
        const maxRetries = options.maxRetries ?? defaultMaxRetries
        const delayMs = options.delayMs ?? defaultDelayMs

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const result =
                await this.ctx.amuletService.getFeaturedAppsByParty(partyId)

            if (
                result &&
                typeof result == 'object' &&
                Object.keys(result).length > 0
            ) {
                return result
            }
            this.ctx.commonCtx.logger.info(
                `lookup featured apps attempt ${attempt} returned undefined. retrying again...`
            )

            if (attempt < maxRetries) {
                await new Promise((res) => setTimeout(res, delayMs))
            }

            return undefined
        }
    }

    /**
     * Submits a command to grant feature app rights for validator operator.
     * @returns A contract of Daml template `Splice.Amulet.FeaturedAppRight`.
     */
    public async grant(
        options: GrantFeaturedAppRightsOptions = {}
    ): Promise<FeaturedAppRight | undefined> {
        const featuredAppRights = await this.rights({
            partyId: this.ctx.validatorParty,
            maxRetries: 20,
            delayMs: 1000,
        })

        if (featuredAppRights) {
            return featuredAppRights
        }
        const synchronizerId =
            options.synchronizerId ?? this.ctx.commonCtx.defaultSynchronizerId

        const [featuredAppCommand, dc] =
            await this.ctx.amuletService.selfGrantFeatureAppRight(
                this.ctx.validatorParty,
                synchronizerId
            )

        await this.ledger.internal.submit({
            commands: [{ ExerciseCommand: featuredAppCommand }],
            disclosedContracts: dc,
            synchronizerId,
            actAs: [this.ctx.validatorParty],
        })

        return this.rights({
            partyId: this.ctx.validatorParty,
            maxRetries: options.maxRetries ?? defaultMaxRetries,
            delayMs: options.delayMs ?? defaultDelayMs,
        })
    }
}
