// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { MergeUtxosParams, ListHoldingsParams } from './types.js'
import { HOLDING_INTERFACE_ID } from '@canton-network/core-token-standard'
import { TokenStandardService } from '@canton-network/core-token-standard-service'
import { Holding, PrettyContract } from '@canton-network/core-tx-parser'
import { WrappedCommand } from '../../ledger/types.js'
import { findAsset, LedgerTypes, TokenNamespaceConfig } from '../../../sdk.js'
import { Decimal } from 'decimal.js'
import { TransferNamespace } from '../transfer/index.js'
import { MergeDelegationNamespace } from './mergeDelegation.js'

export class UtxoNamespace {
    public readonly delegatedMerge: MergeDelegationNamespace
    constructor(
        private readonly sdkContext: TokenNamespaceConfig,
        private readonly transfer: TransferNamespace // Type this as your Transfer service
    ) {
        this.delegatedMerge = new MergeDelegationNamespace(sdkContext, this)
    }

    /**
     * Merges utxos by instrument
     * @param partyId partyId to create the transfer command for
     * @param inputUtxos optional utxos to provide as input (e.g. if you're already listing holdings and don't want to repeat the call)
     * @param nodeLimit json api maximum elements limit per node, default is 200
     * @returns an array of exercise commands, where each command can have up to 100 self-transfers
     * these need to be submitted separately as there is a limit of 100 transfers per execution
     */
    async merge(
        params: MergeUtxosParams
    ): Promise<
        [
            WrappedCommand<'ExerciseCommand'>[],
            LedgerTypes['DisclosedContract'][],
        ]
    > {
        const utxos =
            params.inputUtxos ??
            (await this.list({
                partyId: params.partyId,
                includeLocked: false,
                limit: params.nodeLimit ?? 200,
            }))

        const utxoGroupedByInstrument: Record<
            string,
            PrettyContract<Holding>[] | undefined
        > = Object.groupBy(
            utxos,
            (utxo) =>
                `${utxo.interfaceViewValue.instrumentId.id}::${utxo.interfaceViewValue.instrumentId.admin}`
        )

        const transferInputUtxoLimit = 100
        const allTransferResults = []

        for (const group of Object.values(utxoGroupedByInstrument)) {
            if (!group) continue
            const { id: instrumentId } =
                group[0].interfaceViewValue.instrumentId

            const assets =
                await this.sdkContext.tokenStandardService.registriesToAssets(
                    this.sdkContext.registryUrls.map((url) => url.href)
                )

            const registryUrl = new URL(
                findAsset(assets, instrumentId, this.sdkContext.commonCtx.error)
                    .registryUrl
            )

            const transfers = Math.ceil(group.length / transferInputUtxoLimit)

            const transferPromises = Array.from(
                { length: transfers },
                (_, i) => {
                    const start = i * transferInputUtxoLimit
                    const end = Math.min(
                        start + transferInputUtxoLimit,
                        group.length
                    )

                    const inputUtxos = group.slice(start, end)

                    const accumulatedAmount = inputUtxos.reduce(
                        (a, b) =>
                            a.plus(
                                new Decimal(
                                    b.interfaceViewValue.amount
                                ).toDecimalPlaces(10)
                            ),
                        new Decimal(0)
                    )

                    return this.transfer.create({
                        sender: params.partyId,
                        recipient: params.partyId,
                        amount: accumulatedAmount.toString(),
                        instrumentId: instrumentId,
                        registryUrl, //change to url,
                        inputUtxos: inputUtxos.map((h) => h.contractId),
                        memo: params.memo ?? 'merge-utxos',
                    })
                }
            )
            const transferResults = await Promise.all(transferPromises)
            allTransferResults.push(...transferResults)
        }

        const commands = allTransferResults.map(([cmd]) => cmd)
        const disclosedContracts = Array.from(
            new Map(
                allTransferResults
                    .flatMap(([, dc]) => dc)
                    .map((dc) => [dc.contractId, dc])
            ).values()
        )

        return [commands, disclosedContracts]
    }

    /**
     * Lists all holding UTXOs for the current party.
     * @param partyId
     * @returns  A promise that resolves to an array of holding UTXOs.
     */
    async list(params: ListHoldingsParams) {
        const {
            partyId,
            includeLocked,
            limit,
            offset,
            continueUntilCompletion,
        } = params
        const utxos =
            await this.sdkContext.tokenStandardService.listContractsByInterface<Holding>(
                HOLDING_INTERFACE_ID,
                partyId,
                limit,
                offset,
                continueUntilCompletion
            )

        const currentTime = new Date()

        const filteredUtxos = includeLocked
            ? utxos
            : utxos.filter(
                  (utxo) =>
                      !TokenStandardService.isHoldingLocked(
                          utxo.interfaceViewValue,
                          currentTime
                      )
              )

        return filteredUtxos
    }
}
