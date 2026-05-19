// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { PartyId } from '@canton-network/core-types'
import { AssetBody, SDKContext } from '../../sdk.js'
import { PreparedCommand } from '../transactions/types.js'
import { AmuletService } from '@canton-network/core-amulet-service'
import { TokenStandardService } from '@canton-network/core-token-standard-service'
import { TrafficNamespace } from './traffic.js'
import { LedgerNamespace } from '../ledger/namespace.js'
import { PreapprovalNamespace } from './preapproval.js'
import { Decimal } from 'decimal.js'
import { FeaturedAppNamespace } from './featuredApp.js'

export type AmuletNamespaceConfig = {
    commonCtx: SDKContext
    registry: URL | AssetBody
    amuletService: AmuletService
    tokenStandardService: TokenStandardService
    validatorParty: PartyId
}

export class AmuletNamespace {
    public readonly traffic: TrafficNamespace
    public readonly preapproval: PreapprovalNamespace
    public readonly featuredApp: FeaturedAppNamespace
    private readonly ledger: LedgerNamespace
    constructor(private readonly sdkContext: AmuletNamespaceConfig) {
        this.preapproval = new PreapprovalNamespace(sdkContext)
        this.traffic = new TrafficNamespace(sdkContext)
        this.featuredApp = new FeaturedAppNamespace(sdkContext)
        this.ledger = new LedgerNamespace(sdkContext.commonCtx)
    }

    private async amulet(): Promise<AssetBody> {
        return this.sdkContext.registry instanceof URL
            ? (
                  await this.sdkContext.tokenStandardService.registriesToAssets(
                      [this.sdkContext.registry.href]
                  )
              )[0]
            : this.sdkContext.registry
    }

    /**
     * Creates a new tap for the specified receiver and amount.
     * @param partyId The party of the receiver.
     * @param amount The amount to be tapped.
     * @returns A promise that resolves to the ExerciseCommand, which creates the tap, and the Disclosed Contracts.
     */
    async tap(partyId: PartyId, amount: string): Promise<PreparedCommand> {
        const amulet = await this.amulet()

        const [tapCommand, disclosedContracts] =
            await this.sdkContext.amuletService.createTap(
                partyId,
                new Decimal(amount).toFixed(10),
                amulet.admin,
                amulet.id,
                amulet.registryUrl
            )
        return [{ ExerciseCommand: tapCommand }, disclosedContracts]
    }

    /**
     * Creates and submits a tap command for a specified amount for an internal party
     * This is useful for tests and can only be used locally or against devnet
     * @param amount The amount to be tapped.
     * @param options Optional settings.
     * @param options.synchronizerId defaults to the first connected synchronizer
     * @param options.partyId optional internal party to receive tap, defaults to validator operator party
     * @returns the updateId and completionOffset for the submitted tap command
     */

    async tapInternal(
        amount: string,
        options?: { partyId?: PartyId; synchronizerId?: string }
    ) {
        const partyId = options?.partyId ?? this.sdkContext.validatorParty
        const synchronizerId =
            options?.synchronizerId ??
            this.sdkContext.commonCtx.defaultSynchronizerId
        const [tapCommand, disclosedContracts] = await this.tap(partyId, amount)

        return await this.ledger.internal.submit({
            commands: [tapCommand],
            disclosedContracts,
            synchronizerId,
            actAs: [partyId],
        })
    }
}

export async function fetchAmulet(
    amuletCtx: AmuletNamespaceConfig
): Promise<AssetBody> {
    return amuletCtx.registry instanceof URL
        ? (
              await amuletCtx.tokenStandardService.registriesToAssets([
                  amuletCtx.registry.href,
              ])
          )[0]
        : amuletCtx.registry
}
