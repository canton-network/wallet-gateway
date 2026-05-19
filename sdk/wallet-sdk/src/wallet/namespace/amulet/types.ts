// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { PartyId } from '@canton-network/core-types'

export type PreapprovalParties = {
    receiver: PartyId
    provider?: PartyId
}

export interface FeaturedAppService {
    /**
     * Looks up if a party has FeaturedAppRight.
     * Has an in built retry and delay between attempts
     * @returns If defined, a contract of Daml template `Splice.Amulet.FeaturedAppRight`.
     */
    rights: (
        options: LookupFeaturedAppRightsOptions
    ) => Promise<FeaturedAppRight | undefined>
    /**
     * Submits a command to grant feature app rights for validator operator.
     * @returns A contract of Daml template `Splice.Amulet.FeaturedAppRight`.
     */
    grant: (
        options?: GrantFeaturedAppRightsOptions
    ) => Promise<FeaturedAppRight | undefined>
}

export type FeaturedAppRight = {
    template_id: string
    contract_id: string
    payload: Record<string, never>
    created_event_blob: string
    created_at: string
}

export type LookupFeaturedAppRightsOptions = {
    partyId: string
    maxRetries?: number
    delayMs?: number
}

export type GrantFeaturedAppRightsOptions = {
    maxRetries?: number
    delayMs?: number
}
