// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { TokenNamespaceConfig } from '../namespace.js'
import { PartyId } from '@canton-network/core-types'
import {
    TRANSFER_INSTRUCTION_INTERFACE_ID,
    TransferInstructionView,
} from '@canton-network/core-token-standard'
import { TransferAllocationChoiceParams, TransferParams } from './types.js'
import { PreparedCommand } from '../../transactions/types.js'
import { ProxyDelegationNamespace } from './proxyDelegation.js'
import { findAsset } from '../../asset/index.js'
import { parseAssets } from '../../utils/url.js'

export class TransferNamespace {
    public readonly delegatedProxy: ProxyDelegationNamespace
    constructor(private readonly sdkContext: TokenNamespaceConfig) {
        this.delegatedProxy = new ProxyDelegationNamespace(sdkContext)
    }

    async pending(partyId: PartyId) {
        return await this.sdkContext.tokenStandardService.listContractsByInterface<TransferInstructionView>(
            TRANSFER_INSTRUCTION_INTERFACE_ID,
            partyId
        )
    }

    async accept(
        params: TransferAllocationChoiceParams
    ): Promise<PreparedCommand> {
        const [ExerciseCommand, disclosedContracts] =
            await this.sdkContext.tokenStandardService.transfer.createAcceptTransferInstruction(
                params.transferInstructionCid,
                params.registryUrl.href
            )
        return [{ ExerciseCommand }, disclosedContracts]
    }

    async withdraw(
        params: TransferAllocationChoiceParams
    ): Promise<PreparedCommand> {
        const [ExerciseCommand, disclosedContracts] =
            await this.sdkContext.tokenStandardService.transfer.createWithdrawTransferInstruction(
                params.transferInstructionCid,
                params.registryUrl.href
            )
        return [{ ExerciseCommand }, disclosedContracts]
    }

    async reject(
        params: TransferAllocationChoiceParams
    ): Promise<PreparedCommand> {
        const [ExerciseCommand, disclosedContracts] =
            await this.sdkContext.tokenStandardService.transfer.createRejectTransferInstruction(
                params.transferInstructionCid,
                params.registryUrl.href
            )
        return [{ ExerciseCommand }, disclosedContracts]
    }

    async create(
        params: TransferParams
    ): Promise<PreparedCommand<'ExerciseCommand'>> {
        const assets = parseAssets(
            this.sdkContext.commonCtx,
            await this.sdkContext.tokenStandardService.registriesToAssets(
                this.sdkContext.registryUrls.map((url) => url.href)
            )
        )
        const asset = findAsset(
            assets,
            params.instrumentId,
            this.sdkContext.commonCtx.error,
            params.registryUrl
        )

        if (!asset || asset === undefined) {
            throw new Error(
                `Asset with id ${params.instrumentId} not found in asset list for registry URL: ${params.registryUrl.href}`
            )
        }

        const [transferCommand, disclosedContracts] =
            await this.sdkContext.tokenStandardService.transfer.createTransfer(
                params.sender,
                params.recipient,
                params.amount,
                asset.admin,
                asset.id,
                asset.registryUrl.href,
                params.inputUtxos,
                params.memo,
                params.expirationDate,
                params.meta
            )

        return [{ ExerciseCommand: transferCommand }, disclosedContracts]
    }
}
