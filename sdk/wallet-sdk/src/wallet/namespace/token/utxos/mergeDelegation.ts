// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { TokenNamespaceConfig } from '../../../sdk.js'
import { Metadata } from '@canton-network/core-token-standard'
import {
    DisclosedContract,
    ExerciseCommand,
} from '@canton-network/core-token-standard-service'
import { Holding, PrettyContract } from '@canton-network/core-tx-parser'
import { WrappedCommand } from '../../ledger/types.js'
import { PartyId } from '@canton-network/core-types'
import { LedgerNamespace } from '../../ledger/index.js'
import { UtxoNamespace } from './index.js'

export class MergeDelegationNamespace {
    private readonly ledger: LedgerNamespace
    constructor(
        private readonly ctx: TokenNamespaceConfig,
        private readonly utxoService: UtxoNamespace
    ) {
        this.ledger = new LedgerNamespace(ctx.commonCtx)
    }

    async setup(synchronizerId: string = '') {
        const commands = [
            {
                CreateCommand: {
                    templateId:
                        '#splice-util-token-standard-wallet:Splice.Util.Token.Wallet.MergeDelegation:BatchMergeUtility',
                    createArguments: {
                        operator: this.ctx.validatorParty,
                    },
                },
            },
        ]

        return await this.ledger.internal.submit({
            commands,
            synchronizerId,
            actAs: [this.ctx.validatorParty],
        })
    }

    async approve(args: { owner: PartyId; synchronizerId?: string }) {
        const { owner, synchronizerId = '' } = args

        const mergeDelegationProposals = await this.ledger.acs.readJsContracts({
            parties: [owner],
            templateIds: [
                '#splice-util-token-standard-wallet:Splice.Util.Token.Wallet.MergeDelegation:MergeDelegationProposal',
            ],
            filterByParty: true,
        })

        const mergeDelegationProposal = mergeDelegationProposals[0]

        if (!mergeDelegationProposal) {
            this.ctx.commonCtx.error.throw({
                message: 'Not an active contract',
                type: 'NotFound',
            })
        }

        const disclosedContracts = [
            this.activeContractToDisclosedContract(mergeDelegationProposal),
        ]

        const exercise = {
            templateId:
                '#splice-util-token-standard-wallet:Splice.Util.Token.Wallet.MergeDelegation:MergeDelegationProposal',
            contractId: mergeDelegationProposal.contractId,
            choice: 'MergeDelegationProposal_Accept',
            choiceArgument: {},
        }

        return await this.ledger.internal.submit({
            commands: [{ ExerciseCommand: exercise }],
            disclosedContracts,
            synchronizerId,
            actAs: [this.ctx.validatorParty],
        })
    }

    async execute(args: {
        party: PartyId
        synchronizerId?: string
        nodeLimit?: number
        inputUtxos?: PrettyContract<Holding>[]
    }) {
        const { party, nodeLimit = 200, inputUtxos, synchronizerId = '' } = args

        const utxos =
            inputUtxos ??
            (await this.utxoService.list({
                partyId: party,
                limit: nodeLimit,
            }))

        if (utxos.length < 10) {
            this.ctx.commonCtx.error.throw({
                message: `Utxos are less than 10, found ${utxos.length}`,
                type: 'SDKOperationUnsupported',
            })
        }

        const allMergeDelegationChoices: WrappedCommand<'ExerciseCommand'>[] =
            []

        const mergeDelegationContractsForUser =
            await this.ledger.acs.readJsContracts({
                parties: [party],
                templateIds: [
                    '#splice-util-token-standard-wallet:Splice.Util.Token.Wallet.MergeDelegation:MergeDelegation',
                ],
                filterByParty: true,
            })

        const mergeDelegationDisclosedContract =
            this.activeContractToDisclosedContract(
                mergeDelegationContractsForUser[0]
            )

        const batchMergeUtilityContracts =
            await this.ledger.acs.readJsContracts({
                parties: [this.ctx.validatorParty],
                templateIds: [
                    '#splice-util-token-standard-wallet:Splice.Util.Token.Wallet.MergeDelegation:BatchMergeUtility',
                ],
                filterByParty: true,
            })

        const batchMergeUtilityDisclosedContract =
            this.activeContractToDisclosedContract(
                batchMergeUtilityContracts[0]
            )

        const disclosedContractsFromInputUtxos: DisclosedContract[] = utxos.map(
            (u): DisclosedContract => ({
                templateId: u.activeContract.createdEvent!.templateId!,
                contractId: u.activeContract.createdEvent!.contractId!,
                createdEventBlob:
                    u.activeContract.createdEvent!.createdEventBlob!,
                synchronizerId: u.activeContract.synchronizerId!,
            })
        )

        const disclosedContracts: DisclosedContract[] = [
            mergeDelegationDisclosedContract,
            batchMergeUtilityDisclosedContract,
            ...disclosedContractsFromInputUtxos,
        ]

        const [transferCommands, transferCommandDisclosedContracts] =
            await this.utxoService.merge({
                partyId: party,
                ...(inputUtxos && { inputUtxos }),
                nodeLimit,
            })

        disclosedContracts.push(...transferCommandDisclosedContracts)

        const uniqueDisclosedContracts = Array.from(
            new Map(disclosedContracts.map((c) => [c.contractId, c])).values()
        )

        transferCommands.map((tc) => {
            const exercise: ExerciseCommand = {
                templateId:
                    '#splice-util-token-standard-wallet:Splice.Util.Token.Wallet.MergeDelegation:MergeDelegation',
                contractId: mergeDelegationDisclosedContract.contractId,
                choice: 'MergeDelegation_Merge',
                choiceArgument: {
                    optMergeTransfer: {
                        factoryCid: tc.ExerciseCommand.contractId,
                        choiceArg: tc.ExerciseCommand.choiceArgument,
                    },
                },
            }

            allMergeDelegationChoices.push({
                ExerciseCommand: exercise,
            })
        })

        const mergeCallInput = allMergeDelegationChoices.map((c) => {
            return {
                delegationCid: c.ExerciseCommand.contractId,
                choiceArg: c.ExerciseCommand.choiceArgument,
            }
        })

        const batchExerciseCommand: ExerciseCommand = {
            templateId:
                '#splice-util-token-standard-wallet:Splice.Util.Token.Wallet.MergeDelegation:BatchMergeUtility',
            contractId: batchMergeUtilityDisclosedContract.contractId,
            choice: 'BatchMergeUtility_BatchMerge',
            choiceArgument: {
                mergeCalls: mergeCallInput,
            },
        }

        return await this.ledger.internal.submit({
            commands: [{ ExerciseCommand: batchExerciseCommand }],
            synchronizerId,
            disclosedContracts: uniqueDisclosedContracts,
            actAs: [this.ctx.validatorParty],
        })
    }

    command = {
        propose: (args: { owner: PartyId; metadata?: Metadata }) => {
            const { owner, metadata = { values: {} } } = args
            return {
                CreateCommand: {
                    templateId:
                        '#splice-util-token-standard-wallet:Splice.Util.Token.Wallet.MergeDelegation:MergeDelegationProposal',
                    createArguments: {
                        delegation: {
                            operator: this.ctx.validatorParty,
                            owner,
                            meta: metadata,
                        },
                    },
                },
            }
        },
    }

    private activeContractToDisclosedContract(
        data: Awaited<
            ReturnType<LedgerNamespace['acs']['readJsContracts']>
        >[number]
    ) {
        return {
            templateId: data.templateId,
            contractId: data.contractId,
            createdEventBlob: data.createdEventBlob!,
            synchronizerId: data.synchronizerId,
        }
    }
}
