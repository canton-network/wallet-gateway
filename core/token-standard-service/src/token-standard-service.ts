// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import {
    TokenStandardClient,
    TRANSFER_FACTORY_INTERFACE_ID,
    HOLDING_INTERFACE_ID,
    ALLOCATION_FACTORY_INTERFACE_ID,
    ALLOCATION_INTERFACE_ID,
    ALLOCATION_REQUEST_INTERFACE_ID,
    ALLOCATION_INSTRUCTION_INTERFACE_ID,
    TRANSFER_INSTRUCTION_INTERFACE_ID,
    HoldingView,
    AllocationFactory_Allocate,
    AllocationSpecification,
    Transfer,
    transferInstructionRegistryTypes,
    allocationInstructionRegistryTypes,
    ExtraArgs,
    Metadata,
    FEATURED_APP_DELEGATE_PROXY_INTERFACE_ID,
    Holding,
    ContractId,
    Beneficiaries,
} from '@canton-network/core-token-standard'
import {
    EventFilterBySetup,
    type LedgerCommonSchemas,
} from '@canton-network/core-ledger-client-types'
import { Logger, PartyId } from '@canton-network/core-types'
import { AcsReader, AcsOptions } from '@canton-network/core-acs-reader'
import {
    TokenStandardTransactionInterfaces,
    ensureInterfaceViewIsPresent,
    TransactionParser,
    PrettyContract,
    renderTransaction,
    ViewValue,
    Holding as TxParseHolding,
    PrettyTransactions,
    Transaction,
    TransferObject,
} from '@canton-network/core-tx-parser'
import { AccessTokenProvider } from '@canton-network/core-wallet-auth'
import {
    AbstractLedgerProvider,
    Ops,
} from '@canton-network/core-provider-ledger'

const REQUESTED_AT_SKEW_MS = 60_000

export type ExerciseCommand = LedgerCommonSchemas['ExerciseCommand']
export type DisclosedContract = LedgerCommonSchemas['DisclosedContract']
const EMPTY_META: Metadata = { values: {} }

type JsGetActiveContractsResponse =
    LedgerCommonSchemas['JsGetActiveContractsResponse']
type JsGetUpdatesResponse =
    Ops.PostV2UpdatesFlats['ledgerApi']['result'][number]
type JsGetTransactionResponse = LedgerCommonSchemas['JsGetTransactionResponse']
type OffsetCheckpoint2 = LedgerCommonSchemas['OffsetCheckpoint2']
type JsTransaction = LedgerCommonSchemas['JsTransaction']
type TransactionFormat = LedgerCommonSchemas['TransactionFormat']

type JsActiveContract = LedgerCommonSchemas['JsActiveContract']

type OffsetCheckpointUpdate = {
    update: { OffsetCheckpoint: OffsetCheckpoint2 }
}
type TransactionUpdate = {
    update: { Transaction: { value: JsTransaction } }
}

type JsActiveContractEntryResponse = JsGetActiveContractsResponse & {
    contractEntry: {
        JsActiveContract: {
            createdEvent: LedgerCommonSchemas['CreatedEvent']
        }
    }
}

type CreateTransferChoiceArgs = {
    expectedAdmin: PartyId
    transfer: Transfer
    extraArgs: ExtraArgs
}

export class CoreService {
    constructor(
        private ledgerProvider: AbstractLedgerProvider,
        private readonly logger: Logger,
        private accessTokenProvider: AccessTokenProvider,
        private readonly isMasterUser: boolean
    ) {}

    getTokenStandardClient(registryUrl: string): TokenStandardClient {
        return new TokenStandardClient(
            registryUrl,
            this.logger,
            this.accessTokenProvider
        )
    }

    // TODO: probably needs a filter by instrument ID as well?
    async getInputHoldingsCids(
        sender: PartyId,
        inputUtxos?: string[],
        amount?: number,
        continueUntilCompletion?: boolean
    ) {
        const now = new Date()
        if (inputUtxos && inputUtxos.length > 0) {
            return inputUtxos
        }
        const senderHoldings = await this.listContractsByInterface<HoldingView>(
            HOLDING_INTERFACE_ID,
            sender,
            undefined,
            undefined,
            continueUntilCompletion
        )
        if (senderHoldings.length === 0) {
            throw new Error(
                "Sender has no holdings, so transfer can't be executed."
            )
        }

        const unlockedSenderHoldings = senderHoldings.filter((utxo) => {
            //filter out locked holdings
            const lock = utxo.interfaceViewValue.lock
            if (!lock) return true

            const expiresAt = lock.expiresAt
            if (!expiresAt) return false

            const expiresAtDate = new Date(expiresAt)
            return expiresAtDate <= now
        })

        if (unlockedSenderHoldings.length > 100) {
            this.logger.warn(`Sender has more than 100 unlocked utxos.`)
        }

        if (amount) {
            return CoreService.getInputHoldingsCidsForAmount(
                amount,
                unlockedSenderHoldings
            )
        } else {
            return unlockedSenderHoldings.map((h) => h.contractId)
        }
    }

    static async getInputHoldingsCidsForAmount(
        amount: number,
        unlockedSenderHoldings: PrettyContract<HoldingView>[]
    ) {
        //find holding that is the exact amount if possible
        const exactAmount = unlockedSenderHoldings.find(
            (holding) =>
                parseFloat(holding.interfaceViewValue.amount) === amount
        )

        if (exactAmount) {
            return [exactAmount.contractId]
        }

        //sort holdings from smallest to largest
        const sortedUnlockedSenderHoldings = unlockedSenderHoldings.toSorted(
            (a, b) =>
                parseFloat(a.interfaceViewValue.amount) -
                parseFloat(b.interfaceViewValue.amount)
        )

        const largestHoldingAmount = sortedUnlockedSenderHoldings.pop()

        if (!largestHoldingAmount) {
            throw new Error(`Sender doesn't have any unlocked holdings`)
        }

        let currentSum = parseFloat(
            largestHoldingAmount.interfaceViewValue.amount
        )
        const cIds = [largestHoldingAmount.contractId]

        for (const h of sortedUnlockedSenderHoldings) {
            if (currentSum >= amount) {
                break
            }

            const currentHoldingAmount = parseFloat(h.interfaceViewValue.amount)

            currentSum += currentHoldingAmount
            cIds.push(h.contractId)
        }

        if (currentSum < amount) {
            throw new Error(
                `Sender doesn't have sufficient funds for this transfer. Missing amount: ${amount - currentSum}`
            )
        }

        if (cIds.length > 100) {
            throw new Error(
                `Exceeded the maximum of 100 utxos in 1 transaction`
            )
        }

        return cIds
    }

    async listContractsByInterface<T = ViewValue>(
        interfaceId: string,
        partyId?: PartyId,
        limit?: number,
        offset?: number,
        continueUntilCompletion?: boolean
    ): Promise<PrettyContract<T>[]> {
        try {
            const ledgerEnd =
                offset ??
                (
                    await this.ledgerProvider.request<Ops.GetV2StateLedgerEnd>({
                        method: 'ledgerApi',
                        params: {
                            resource: '/v2/state/ledger-end',
                            requestMethod: 'get',
                        },
                    })
                ).offset!

            const options: AcsOptions = {
                offset: ledgerEnd,
                interfaceIds: [interfaceId],
                parties: [partyId!],
                filterByParty: true,
                continueUntilCompletion: Boolean(continueUntilCompletion),
            }

            if (limit !== undefined) {
                options.limit = limit
            }

            //TODO: based on the. provider design we can't pass in the continue to completion, so right now it's defaulted to true in the ledger provider. we need to figure out how to add an ACS functionality and ensure better composability
            this.logger.info(
                `continue to completion: ${Boolean(continueUntilCompletion)}`
            )

            const reader = new AcsReader(this.ledgerProvider)

            const acsResponses: JsGetActiveContractsResponse[] =
                (await reader.getActiveContracts(
                    options
                ))! as JsGetActiveContractsResponse[]

            /*  This filters out responses with entries of:
                - JsEmpty
                - JsIncompleteAssigned
                - JsIncompleteUnassigned
                while leaving JsActiveContract.
                It works fine only with single synchronizer
                TODO (#353) add support for multiple synchronizers
             */
            const isActiveContractEntry = (
                acsResponse: JsGetActiveContractsResponse
            ): acsResponse is JsActiveContractEntryResponse =>
                acsResponse.contractEntry != null &&
                'JsActiveContract' in acsResponse.contractEntry &&
                acsResponse.contractEntry.JsActiveContract != null &&
                acsResponse.contractEntry.JsActiveContract.createdEvent != null

            const results: PrettyContract<T>[] = acsResponses
                .filter(isActiveContractEntry)
                .map((response) =>
                    this.toPrettyContract<T>(
                        interfaceId,
                        response as JsActiveContractEntryResponse,
                        ledgerEnd
                    )
                )
            return results
        } catch (err) {
            this.logger.error(
                `Failed to list contracts of interface ${interfaceId}`,
                err
            )
            throw err
        }
    }

    async toPrettyTransactions(
        updates: JsGetUpdatesResponse[],
        partyId: PartyId
    ): Promise<PrettyTransactions> {
        // Runtime filters that also let TS know which of OneOfs types to check against
        const isOffsetCheckpointUpdate = (
            updateResponse: JsGetUpdatesResponse
        ): updateResponse is OffsetCheckpointUpdate =>
            updateResponse.update != null &&
            'OffsetCheckpoint' in updateResponse.update

        const isTransactionUpdate = (
            updateResponse: JsGetUpdatesResponse
        ): updateResponse is TransactionUpdate =>
            updateResponse.update != null &&
            'Transaction' in updateResponse.update &&
            !!updateResponse.update.Transaction?.value

        const offsetCheckpoints: number[] = updates
            .filter(isOffsetCheckpointUpdate)
            .map(
                (update) =>
                    (update.update as OffsetCheckpointUpdate['update'])
                        .OffsetCheckpoint.value.offset
            )
        const latestCheckpointOffset =
            offsetCheckpoints.length > 0 ? Math.max(...offsetCheckpoints) : 0

        const transactions: Transaction[] = await Promise.all(
            updates
                // exclude OffsetCheckpoint, Reassignment, TopologyTransaction
                .filter(isTransactionUpdate)
                .map(async (update) => {
                    const txUpdate = update as TransactionUpdate
                    const tx = txUpdate.update.Transaction
                        .value as JsTransaction
                    const parser = new TransactionParser(
                        this.ledgerProvider,
                        tx,
                        partyId,
                        this.isMasterUser
                    )

                    return await parser.parseTransaction()
                })
        )

        const transactionOffsets = transactions
            .map((tx) => tx.offset)
            .filter((offset): offset is number => offset !== undefined)

        return {
            // OffsetCheckpoint can be anywhere... or not at all, maybe
            nextOffset: Math.max(
                latestCheckpointOffset,
                ...(transactionOffsets.length > 0 ? transactionOffsets : [0])
            ),
            transactions: transactions
                .filter((tx) => tx.events.length > 0)
                .map(renderTransaction),
        }
    }

    async toPrettyTransaction(
        getTransactionResponse: JsGetTransactionResponse,
        partyId: PartyId
    ): Promise<Transaction> {
        const tx = getTransactionResponse.transaction
        const parser = new TransactionParser(
            this.ledgerProvider,
            tx,
            partyId,
            this.isMasterUser
        )
        const parsedTx = await parser.parseTransaction()
        return renderTransaction(parsedTx)
    }

    async toPrettyTransferObjects(
        getTransactionResponse: JsGetTransactionResponse,
        partyId: PartyId
    ): Promise<TransferObject[]> {
        const tx = getTransactionResponse.transaction
        const parser = new TransactionParser(
            this.ledgerProvider,
            tx,
            partyId,
            this.isMasterUser
        )
        return await parser.parseTransferObjects()
    }

    async toPrettyTransactionsPerParty(
        updates: JsGetUpdatesResponse[],
        parties: PartyId[]
    ): Promise<Map<PartyId, PrettyTransactions>> {
        const all = await Promise.all(
            parties.map(
                async (partyId): Promise<[PartyId, PrettyTransactions]> => [
                    partyId,
                    await this.toPrettyTransactions(updates, partyId),
                ]
            )
        )
        return new Map(all)
    }

    // returns object with JsActiveContract content
    // and contractId and interface view value extracted from it as separate fields for convenience
    private toPrettyContract<T>(
        interfaceId: string,
        response: JsActiveContractEntryResponse,
        offset?: number
    ): PrettyContract<T> {
        const activeContract = response.contractEntry
            .JsActiveContract as JsActiveContract
        const { createdEvent } = activeContract
        return {
            contractId: createdEvent.contractId,
            activeContract,
            interfaceViewValue: ensureInterfaceViewIsPresent(
                createdEvent,
                interfaceId
            ).viewValue as T,
            fetchedAtOffset: offset,
        }
    }

    toQualifiedMemberId(memberId: string) {
        if (!memberId) throw new Error('memberId is required')

        return /^(PAR|MED)::/.test(memberId) ? memberId : `PAR::${memberId}`
    }
}

class AllocationService {
    constructor(
        private core: CoreService,
        private readonly logger: Logger
    ) {}

    public async buildAllocationFactoryChoiceArgs(
        allocationSpecification: AllocationSpecification,
        expectedAdmin: PartyId,
        inputUtxos?: string[],
        requestedAt?: string
    ): Promise<AllocationFactory_Allocate> {
        const allocationSpecificationNormalized: AllocationSpecification = {
            ...allocationSpecification,
            settlement: {
                ...allocationSpecification.settlement,
                meta: allocationSpecification.settlement.meta ?? { values: {} },
            },
            transferLeg: {
                ...allocationSpecification.transferLeg,
                meta: allocationSpecification.transferLeg.meta ?? {
                    values: {},
                },
            },
        }

        const inputHoldingCids = await this.core.getInputHoldingsCids(
            allocationSpecificationNormalized.transferLeg.sender,
            inputUtxos
        )

        return {
            expectedAdmin,
            allocation: allocationSpecificationNormalized,
            requestedAt:
                requestedAt ??
                new Date(Date.now() - REQUESTED_AT_SKEW_MS).toISOString(),
            inputHoldingCids:
                inputHoldingCids as unknown as ContractId<Holding>[],
            extraArgs: {
                context: { values: {} },
                meta: { values: {} },
            },
        }
    }

    async fetchAllocationFactoryChoiceContext(
        registryUrl: string,
        choiceArgs: AllocationFactory_Allocate,
        excludeDebugFields: boolean = true
    ): Promise<
        allocationInstructionRegistryTypes['schemas']['FactoryWithChoiceContext']
    > {
        return this.core
            .getTokenStandardClient(registryUrl)
            .post('/registry/allocation-instruction/v1/allocation-factory', {
                choiceArguments: choiceArgs as unknown as Record<string, never>,
                excludeDebugFields,
            })
    }

    async createAllocationInstructionFromContext(
        factoryId: string,
        choiceArgs: AllocationFactory_Allocate,
        choiceContext: allocationInstructionRegistryTypes['schemas']['ChoiceContext']
    ): Promise<[ExerciseCommand, DisclosedContract[]]> {
        choiceArgs.extraArgs.context = {
            ...choiceContext.choiceContextData,
            values: choiceContext.choiceContextData?.values ?? {},
        }
        const exercise: ExerciseCommand = {
            templateId: ALLOCATION_FACTORY_INTERFACE_ID,
            contractId: factoryId,
            choice: 'AllocationFactory_Allocate',
            choiceArgument: choiceArgs,
        }
        return [exercise, choiceContext.disclosedContracts]
    }

    async createAllocationInstruction(
        allocationSpecification: AllocationSpecification,
        expectedAdmin: PartyId,
        registryUrl: string,
        inputUtxos?: string[],
        requestedAt?: string,
        prefetchedRegistryChoiceContext?: {
            factoryId: string
            choiceContext: allocationInstructionRegistryTypes['schemas']['ChoiceContext']
        }
    ): Promise<[ExerciseCommand, DisclosedContract[]]> {
        const choiceArgs = await this.buildAllocationFactoryChoiceArgs(
            allocationSpecification,
            expectedAdmin,
            inputUtxos,
            requestedAt
        )

        if (prefetchedRegistryChoiceContext) {
            return this.createAllocationInstructionFromContext(
                prefetchedRegistryChoiceContext.factoryId,
                choiceArgs,
                prefetchedRegistryChoiceContext.choiceContext
            )
        }

        const { factoryId, choiceContext } =
            await this.fetchAllocationFactoryChoiceContext(
                registryUrl,
                choiceArgs
            )
        return this.createAllocationInstructionFromContext(
            factoryId,
            choiceArgs,
            choiceContext
        )
    }

    private buildAllocationExerciseWithContext(
        templateId: string,
        contractId: string,
        choice:
            | 'Allocation_ExecuteTransfer'
            | 'Allocation_Withdraw'
            | 'Allocation_Cancel',
        choiceContext: allocationInstructionRegistryTypes['schemas']['ChoiceContext']
    ): [ExerciseCommand, DisclosedContract[]] {
        const exercise: ExerciseCommand = {
            templateId,
            contractId,
            choice,
            choiceArgument: {
                extraArgs: {
                    context: choiceContext.choiceContextData,
                    meta: EMPTY_META,
                },
            },
        }
        return [exercise, choiceContext.disclosedContracts ?? []]
    }

    async fetchExecuteTransferChoiceContext(
        allocationId: string,
        registryUrl: string
    ) {
        return this.core.getTokenStandardClient(registryUrl).post(
            '/registry/allocations/v1/{allocationId}/choice-contexts/execute-transfer',
            {
                excludeDebugFields: true,
            },
            {
                path: {
                    allocationId,
                },
            }
        )
    }

    createExecuteTransferAllocationFromContext(
        allocationCid: string,
        choiceContext: allocationInstructionRegistryTypes['schemas']['ChoiceContext']
    ): [ExerciseCommand, DisclosedContract[]] {
        return this.buildAllocationExerciseWithContext(
            ALLOCATION_INTERFACE_ID,
            allocationCid,
            'Allocation_ExecuteTransfer',
            choiceContext
        )
    }

    async createExecuteTransferAllocation(
        allocationCid: string,
        registryUrl: string,
        prefetchedRegistryChoiceContext?: allocationInstructionRegistryTypes['schemas']['ChoiceContext']
    ): Promise<[ExerciseCommand, DisclosedContract[]]> {
        if (prefetchedRegistryChoiceContext) {
            return this.createExecuteTransferAllocationFromContext(
                allocationCid,
                prefetchedRegistryChoiceContext
            )
        }
        const choiceContext = await this.fetchExecuteTransferChoiceContext(
            allocationCid,
            registryUrl
        )
        return this.createExecuteTransferAllocationFromContext(
            allocationCid,
            choiceContext
        )
    }

    async fetchWithdrawAllocationChoiceContext(
        allocationCid: string,
        registryUrl: string
    ): Promise<allocationInstructionRegistryTypes['schemas']['ChoiceContext']> {
        return this.core.getTokenStandardClient(registryUrl).post(
            '/registry/allocations/v1/{allocationId}/choice-contexts/withdraw',
            {
                excludeDebugFields: true,
            },
            { path: { allocationId: allocationCid } }
        )
    }

    createWithdrawAllocationFromContext(
        allocationCid: string,
        choiceContext: allocationInstructionRegistryTypes['schemas']['ChoiceContext']
    ): [ExerciseCommand, DisclosedContract[]] {
        return this.buildAllocationExerciseWithContext(
            ALLOCATION_INTERFACE_ID,
            allocationCid,
            'Allocation_Withdraw',
            choiceContext
        )
    }

    async createWithdrawAllocation(
        allocationCid: string,
        registryUrl: string,
        prefetchedRegistryChoiceContext?: allocationInstructionRegistryTypes['schemas']['ChoiceContext']
    ): Promise<[ExerciseCommand, DisclosedContract[]]> {
        if (prefetchedRegistryChoiceContext) {
            return this.createWithdrawAllocationFromContext(
                allocationCid,
                prefetchedRegistryChoiceContext
            )
        }
        const choiceContext = await this.fetchWithdrawAllocationChoiceContext(
            allocationCid,
            registryUrl
        )
        return this.createWithdrawAllocationFromContext(
            allocationCid,
            choiceContext
        )
    }

    async fetchCancelAllocationChoiceContext(
        allocationCid: string,
        registryUrl: string
    ): Promise<allocationInstructionRegistryTypes['schemas']['ChoiceContext']> {
        return this.core.getTokenStandardClient(registryUrl).post(
            '/registry/allocations/v1/{allocationId}/choice-contexts/cancel',
            {
                excludeDebugFields: true,
            },
            { path: { allocationId: allocationCid } }
        )
    }

    createCancelAllocationFromContext(
        allocationCid: string,
        choiceContext: allocationInstructionRegistryTypes['schemas']['ChoiceContext']
    ): [ExerciseCommand, DisclosedContract[]] {
        return this.buildAllocationExerciseWithContext(
            ALLOCATION_INTERFACE_ID,
            allocationCid,
            'Allocation_Cancel',
            choiceContext
        )
    }

    async createCancelAllocation(
        allocationCid: string,
        registryUrl: string,
        prefetchedRegistryChoiceContext?: allocationInstructionRegistryTypes['schemas']['ChoiceContext']
    ): Promise<[ExerciseCommand, DisclosedContract[]]> {
        if (prefetchedRegistryChoiceContext) {
            return this.createCancelAllocationFromContext(
                allocationCid,
                prefetchedRegistryChoiceContext
            )
        }
        const choiceContext = await this.fetchCancelAllocationChoiceContext(
            allocationCid,
            registryUrl
        )
        return this.createCancelAllocationFromContext(
            allocationCid,
            choiceContext
        )
    }

    async createWithdrawAllocationInstruction(
        allocationInstructionCid: string
    ): Promise<[ExerciseCommand, DisclosedContract[]]> {
        const exercise: ExerciseCommand = {
            templateId: ALLOCATION_INSTRUCTION_INTERFACE_ID,
            contractId: allocationInstructionCid,
            choice: 'AllocationInstruction_Withdraw',
            choiceArgument: {
                extraArgs: {
                    context: { values: {} },
                    meta: { values: {} },
                },
            },
        }
        return [exercise, []]
    }

    async createUpdateAllocationInstruction(
        allocationInstructionCid: string,
        extraActors: PartyId[] = [],
        extraArgsContext: Record<string, unknown> = {},
        extraArgsMeta: Record<string, unknown> = {}
    ): Promise<[ExerciseCommand, DisclosedContract[]]> {
        const exercise: ExerciseCommand = {
            templateId: ALLOCATION_INSTRUCTION_INTERFACE_ID,
            contractId: allocationInstructionCid,
            choice: 'AllocationInstruction_Update',
            choiceArgument: {
                extraActors,
                extraArgs: {
                    context: { values: extraArgsContext },
                    meta: { values: extraArgsMeta },
                },
            },
        }
        return [exercise, []]
    }

    async createRejectAllocationRequest(
        allocationRequestCid: string,
        actor: PartyId
    ): Promise<[ExerciseCommand, DisclosedContract[]]> {
        const exercise: ExerciseCommand = {
            templateId: ALLOCATION_REQUEST_INTERFACE_ID,
            contractId: allocationRequestCid,
            choice: 'AllocationRequest_Reject',
            choiceArgument: {
                actor,
                extraArgs: {
                    context: { values: {} },
                    meta: { values: {} },
                },
            },
        }
        return [exercise, []]
    }

    async createWithdrawAllocationRequest(
        allocationRequestCid: string
    ): Promise<[ExerciseCommand, DisclosedContract[]]> {
        const exercise: ExerciseCommand = {
            templateId: ALLOCATION_REQUEST_INTERFACE_ID,
            contractId: allocationRequestCid,
            choice: 'AllocationRequest_Withdraw',
            choiceArgument: {
                extraArgs: {
                    context: { values: {} },
                    meta: { values: {} },
                },
            },
        }
        return [exercise, []]
    }
}

class TransferService {
    constructor(
        private core: CoreService,
        private readonly logger: Logger
    ) {}

    public async buildTransferChoiceArgs(
        sender: PartyId,
        receiver: PartyId,
        amount: string,
        instrumentAdmin: PartyId,
        instrumentId: string,
        inputUtxos?: string[],
        memo?: string,
        expiryDate?: Date,
        meta?: Metadata,
        continueUntilCompletion?: boolean
    ): Promise<CreateTransferChoiceArgs> {
        const inputHoldingCids: string[] = await this.core.getInputHoldingsCids(
            sender,
            inputUtxos,
            parseFloat(amount),
            continueUntilCompletion
        )

        return {
            expectedAdmin: instrumentAdmin,
            transfer: {
                sender,
                receiver,
                amount,
                instrumentId: { admin: instrumentAdmin, id: instrumentId },
                requestedAt: new Date(
                    Date.now() - REQUESTED_AT_SKEW_MS
                ).toISOString(),
                executeBefore: (
                    expiryDate ?? new Date(Date.now() + 24 * 60 * 60 * 1000)
                ).toISOString(),
                inputHoldingCids:
                    inputHoldingCids as unknown as ContractId<Holding>[],
                meta: {
                    values: {
                        [TokenStandardService.MEMO_KEY]: memo || '',
                        ...meta?.values,
                    },
                },
            },
            extraArgs: {
                context: { values: {} },
                meta: { values: {} },
            },
        }
    }

    async fetchTransferFactoryChoiceContext(
        registryUrl: string,
        choiceArgs: CreateTransferChoiceArgs,
        excludeDebugFields: boolean = true
    ): Promise<
        transferInstructionRegistryTypes['schemas']['TransferFactoryWithChoiceContext']
    > {
        return await this.core
            .getTokenStandardClient(registryUrl)
            .post('/registry/transfer-instruction/v1/transfer-factory', {
                choiceArguments: choiceArgs as unknown as Record<string, never>,
                excludeDebugFields,
            })
    }

    async createTransferFromContext(
        factoryId: string,
        choiceArgs: CreateTransferChoiceArgs,
        choiceContext: transferInstructionRegistryTypes['schemas']['ChoiceContext']
    ): Promise<[ExerciseCommand, DisclosedContract[]]> {
        this.logger.debug('Creating transfer from pre-fetched context...')
        choiceArgs.extraArgs.context = {
            ...choiceContext.choiceContextData,
            values: choiceContext.choiceContextData?.values ?? {},
        }
        const exercise: ExerciseCommand = {
            templateId: TRANSFER_FACTORY_INTERFACE_ID,
            contractId: factoryId,
            choice: 'TransferFactory_Transfer',
            choiceArgument: choiceArgs,
        }
        return [exercise, choiceContext.disclosedContracts]
    }

    // TODO: use named parameters
    async createTransfer(
        sender: PartyId,
        receiver: PartyId,
        amount: string,
        instrumentAdmin: PartyId, // TODO (#907): replace with registry call
        instrumentId: string,
        registryUrl: string,
        inputUtxos?: string[],
        memo?: string,
        expiryDate?: Date,
        meta?: Metadata,
        prefetchedRegistryChoiceContext?: {
            factoryId: string
            choiceContext: transferInstructionRegistryTypes['schemas']['ChoiceContext']
        },
        continueUntilCompletion?: boolean
    ): Promise<[ExerciseCommand, DisclosedContract[]]> {
        try {
            const choiceArgs = await this.buildTransferChoiceArgs(
                sender,
                receiver,
                amount,
                instrumentAdmin,
                instrumentId,
                inputUtxos,
                memo,
                expiryDate,
                meta,
                continueUntilCompletion
            )

            if (prefetchedRegistryChoiceContext) {
                return this.createTransferFromContext(
                    prefetchedRegistryChoiceContext.factoryId,
                    choiceArgs,
                    prefetchedRegistryChoiceContext.choiceContext
                )
            }

            const { factoryId, choiceContext } =
                await this.fetchTransferFactoryChoiceContext(
                    registryUrl,
                    choiceArgs
                )

            return this.createTransferFromContext(
                factoryId,
                choiceArgs,
                choiceContext
            )
        } catch (e) {
            this.logger.error('Failed to execute transfer:', e)
            throw e
        }
    }

    async fetchAcceptTransferInstructionChoiceContext(
        transferInstructionCid: string,
        registryUrl: string
    ): Promise<{
        choiceContextData: unknown
        disclosedContracts: DisclosedContract[]
    }> {
        const client = this.core.getTokenStandardClient(registryUrl)
        const choiceContext = await client.post(
            '/registry/transfer-instruction/v1/{transferInstructionId}/choice-contexts/accept',
            {
                excludeDebugFields: true,
            },
            {
                path: {
                    transferInstructionId: transferInstructionCid,
                },
            }
        )
        return {
            choiceContextData: choiceContext.choiceContextData,
            disclosedContracts: choiceContext.disclosedContracts,
        }
    }

    async createAcceptTransferInstructionFromContext(
        transferInstructionCid: string,
        choiceContext: {
            choiceContextData: unknown
            disclosedContracts: DisclosedContract[]
        }
    ): Promise<[ExerciseCommand, DisclosedContract[]]> {
        try {
            const exercise: ExerciseCommand = {
                templateId: TRANSFER_INSTRUCTION_INTERFACE_ID,
                contractId: transferInstructionCid,
                choice: 'TransferInstruction_Accept',
                choiceArgument: {
                    extraArgs: {
                        context: choiceContext.choiceContextData,
                        meta: { values: {} },
                    },
                },
            }
            return [exercise, choiceContext.disclosedContracts]
        } catch (e) {
            this.logger.error(
                'Failed to create accept transfer instruction:',
                e
            )
            throw e
        }
    }

    async exerciseDelegateProxyTransferInstructionAccept(
        proxyCid: string,
        transferInstructionCid: string,
        registryUrl: URL,
        featuredAppRightCid: string,
        beneficiaries: Beneficiaries[]
    ): Promise<[ExerciseCommand, DisclosedContract[]]> {
        const [acceptTransferInstructionContext, disclosedContracts] =
            await this.createAcceptTransferInstruction(
                transferInstructionCid,
                registryUrl.href
            )

        const choiceArgs = {
            cid: acceptTransferInstructionContext.contractId,
            proxyArg: {
                featuredAppRightCid: featuredAppRightCid,
                beneficiaries: beneficiaries,
                choiceArg: acceptTransferInstructionContext.choiceArgument,
            },
        }

        return [
            {
                templateId: FEATURED_APP_DELEGATE_PROXY_INTERFACE_ID,
                contractId: proxyCid,
                choice: 'DelegateProxy_TransferInstruction_Accept',
                choiceArgument: choiceArgs,
            },
            disclosedContracts,
        ]
    }

    async exerciseDelegateProxyTransferInstructionReject(
        proxyCid: string,
        transferInstructionCid: string,
        registryUrl: URL,
        featuredAppRightCid: string,
        beneficiaries: Beneficiaries[]
    ): Promise<[ExerciseCommand, DisclosedContract[]]> {
        const [rejectTransferInstructionContext, disclosedContracts] =
            await this.createRejectTransferInstruction(
                transferInstructionCid,
                registryUrl.href
            )

        const choiceArgs = {
            cid: rejectTransferInstructionContext.contractId,
            proxyArg: {
                featuredAppRightCid: featuredAppRightCid,
                beneficiaries,
                choiceArg: rejectTransferInstructionContext.choiceArgument,
            },
        }

        return [
            {
                templateId: FEATURED_APP_DELEGATE_PROXY_INTERFACE_ID,
                contractId: proxyCid,
                choice: 'DelegateProxy_TransferInstruction_Reject',
                choiceArgument: choiceArgs,
            },
            disclosedContracts,
        ]
    }

    async exerciseDelegateProxyTransferInstructioWithdraw(
        proxyCid: string,
        transferInstructionCid: string,
        registryUrl: URL,
        featuredAppRightCid: string,
        beneficiaries: Beneficiaries[]
    ): Promise<[ExerciseCommand, DisclosedContract[]]> {
        const [withdrawTransferInstructionContext, disclosedContracts] =
            await this.createWithdrawTransferInstruction(
                transferInstructionCid,
                registryUrl.href
            )

        const sumOfWeights: number = beneficiaries.reduce(
            (totalWeight, beneficiary) => totalWeight + beneficiary.weight,
            0
        )

        if (sumOfWeights > 1.0) {
            throw new Error('Sum of beneficiary weights is larger than 1.')
        }

        const choiceArgs = {
            cid: withdrawTransferInstructionContext.contractId,
            proxyArg: {
                featuredAppRightCid: featuredAppRightCid,
                beneficiaries,
                choiceArg: withdrawTransferInstructionContext.choiceArgument,
            },
        }

        return [
            {
                templateId: FEATURED_APP_DELEGATE_PROXY_INTERFACE_ID,
                contractId: proxyCid,
                choice: 'DelegateProxy_TransferInstruction_Withdraw',
                choiceArgument: choiceArgs,
            },
            disclosedContracts,
        ]
    }

    async createAcceptTransferInstruction(
        transferInstructionCid: string,
        registryUrl: string,
        prefetchedRegistryChoiceContext?: transferInstructionRegistryTypes['schemas']['ChoiceContext']
    ): Promise<[ExerciseCommand, DisclosedContract[]]> {
        if (prefetchedRegistryChoiceContext) {
            return this.createAcceptTransferInstructionFromContext(
                transferInstructionCid,
                {
                    choiceContextData:
                        prefetchedRegistryChoiceContext.choiceContextData,
                    disclosedContracts:
                        prefetchedRegistryChoiceContext.disclosedContracts,
                }
            )
        }
        const choiceContext =
            await this.fetchAcceptTransferInstructionChoiceContext(
                transferInstructionCid,
                registryUrl
            )
        return this.createAcceptTransferInstructionFromContext(
            transferInstructionCid,
            choiceContext
        )
    }

    async fetchRejectTransferInstructionChoiceContext(
        transferInstructionCid: string,
        registryUrl: string
    ): Promise<{
        choiceContextData: unknown
        disclosedContracts: DisclosedContract[]
    }> {
        const client = this.core.getTokenStandardClient(registryUrl)
        const choiceContext = await client.post(
            '/registry/transfer-instruction/v1/{transferInstructionId}/choice-contexts/reject',
            {
                excludeDebugFields: true,
            },
            {
                path: {
                    transferInstructionId: transferInstructionCid,
                },
            }
        )
        return {
            choiceContextData: choiceContext.choiceContextData,
            disclosedContracts: choiceContext.disclosedContracts,
        }
    }

    async createRejectTransferInstructionFromContext(
        transferInstructionCid: string,
        choiceContext: {
            choiceContextData: unknown
            disclosedContracts: DisclosedContract[]
        }
    ): Promise<[ExerciseCommand, DisclosedContract[]]> {
        try {
            const exercise: ExerciseCommand = {
                templateId: TRANSFER_INSTRUCTION_INTERFACE_ID,
                contractId: transferInstructionCid,
                choice: 'TransferInstruction_Reject',
                choiceArgument: {
                    extraArgs: {
                        context: choiceContext.choiceContextData,
                        meta: { values: {} },
                    },
                },
            }
            return [exercise, choiceContext.disclosedContracts]
        } catch (e) {
            this.logger.error(
                'Failed to create reject transfer instruction:',
                e
            )
            throw e
        }
    }

    async createRejectTransferInstruction(
        transferInstructionCid: string,
        registryUrl: string,
        prefetchedRegistryChoiceContext?: transferInstructionRegistryTypes['schemas']['ChoiceContext']
    ): Promise<[ExerciseCommand, DisclosedContract[]]> {
        if (prefetchedRegistryChoiceContext) {
            return this.createRejectTransferInstructionFromContext(
                transferInstructionCid,
                {
                    choiceContextData:
                        prefetchedRegistryChoiceContext.choiceContextData,
                    disclosedContracts:
                        prefetchedRegistryChoiceContext.disclosedContracts,
                }
            )
        }
        const choiceContext =
            await this.fetchRejectTransferInstructionChoiceContext(
                transferInstructionCid,
                registryUrl
            )
        return this.createRejectTransferInstructionFromContext(
            transferInstructionCid,
            choiceContext
        )
    }

    async fetchWithdrawTransferInstructionChoiceContext(
        transferInstructionCid: string,
        registryUrl: string
    ): Promise<{
        choiceContextData: unknown
        disclosedContracts: DisclosedContract[]
    }> {
        const client = this.core.getTokenStandardClient(registryUrl)

        const choiceContext = await client.post(
            '/registry/transfer-instruction/v1/{transferInstructionId}/choice-contexts/withdraw',
            {
                excludeDebugFields: true,
            },
            {
                path: {
                    transferInstructionId: transferInstructionCid,
                },
            }
        )
        return {
            choiceContextData: choiceContext.choiceContextData,
            disclosedContracts: choiceContext.disclosedContracts,
        }
    }

    async createWithdrawTransferInstructionFromContext(
        transferInstructionCid: string,
        choiceContext: {
            choiceContextData: unknown
            disclosedContracts: DisclosedContract[]
        }
    ): Promise<[ExerciseCommand, DisclosedContract[]]> {
        try {
            const exercise: ExerciseCommand = {
                templateId: TRANSFER_INSTRUCTION_INTERFACE_ID,
                contractId: transferInstructionCid,
                choice: 'TransferInstruction_Withdraw',
                choiceArgument: {
                    extraArgs: {
                        context: choiceContext.choiceContextData,
                        meta: { values: {} },
                    },
                },
            }
            return [exercise, choiceContext.disclosedContracts]
        } catch (e) {
            this.logger.error(
                'Failed to create withdraw transfer instruction:',
                e
            )
            throw e
        }
    }

    async createWithdrawTransferInstruction(
        transferInstructionCid: string,
        registryUrl: string,
        prefetchedRegistryChoiceContext?: transferInstructionRegistryTypes['schemas']['ChoiceContext']
    ): Promise<[ExerciseCommand, DisclosedContract[]]> {
        if (prefetchedRegistryChoiceContext) {
            return this.createWithdrawTransferInstructionFromContext(
                transferInstructionCid,
                {
                    choiceContextData:
                        prefetchedRegistryChoiceContext.choiceContextData,
                    disclosedContracts:
                        prefetchedRegistryChoiceContext.disclosedContracts,
                }
            )
        }
        const choiceContext =
            await this.fetchWithdrawTransferInstructionChoiceContext(
                transferInstructionCid,
                registryUrl
            )
        return this.createWithdrawTransferInstructionFromContext(
            transferInstructionCid,
            choiceContext
        )
    }

    async createTransferInstruction(
        transferInstructionCid: string,
        registryUrl: string,
        instructionChoice: 'Accept' | 'Reject' | 'Withdraw',
        prefetchedRegistryChoiceContext?: transferInstructionRegistryTypes['schemas']['ChoiceContext']
    ): Promise<[ExerciseCommand, DisclosedContract[]]> {
        switch (instructionChoice) {
            case 'Accept':
                return this.createAcceptTransferInstruction(
                    transferInstructionCid,
                    registryUrl,
                    prefetchedRegistryChoiceContext
                )
            case 'Reject':
                return this.createRejectTransferInstruction(
                    transferInstructionCid,
                    registryUrl,
                    prefetchedRegistryChoiceContext
                )
            case 'Withdraw':
                return this.createWithdrawTransferInstruction(
                    transferInstructionCid,
                    registryUrl,
                    prefetchedRegistryChoiceContext
                )
        }
    }
}

export class TokenStandardService {
    static readonly MEMO_KEY = 'splice.lfdecentralizedtrust.org/reason'

    readonly core: CoreService
    readonly allocation: AllocationService
    readonly transfer: TransferService

    constructor(
        private ledgerProvider: AbstractLedgerProvider,
        private logger: Logger,
        private accessTokenProvider: AccessTokenProvider,
        private readonly isMasterUser: boolean
    ) {
        this.core = new CoreService(
            ledgerProvider,
            logger,
            accessTokenProvider,
            isMasterUser
        )
        this.allocation = new AllocationService(this.core, this.logger)
        this.transfer = new TransferService(this.core, this.logger)
    }

    async getInstrumentById(registryUrl: string, instrumentId: string) {
        try {
            const params: Record<string, unknown> = {
                path: {
                    instrumentId,
                },
            }

            const client = this.core.getTokenStandardClient(registryUrl)

            return client.get(
                '/registry/metadata/v1/instruments/{instrumentId}',
                params
            )
        } catch (e) {
            this.logger.error(e)
            throw new Error(
                `Instrument id ${instrumentId} does not exist for this instrument admin.`,
                { cause: e }
            )
        }
    }

    async getInstrumentAdmin(registryUrl: string): Promise<string> {
        const client = this.core.getTokenStandardClient(registryUrl)

        const info = await client.get('/registry/metadata/v1/info')

        return info.adminId
    }

    async listInstruments(
        registryUrl: string,
        pageSize?: number,
        pageToken?: string
    ) {
        const client = this.core.getTokenStandardClient(registryUrl)
        return client.get('/registry/metadata/v1/instruments', {
            query: {
                ...(pageSize && { pageSize }),
                ...(pageToken && { pageToken }),
            },
        })
    }

    async instrumentsToAsset(registryUrl: string) {
        const instrumentsResponse = await this.listInstruments(registryUrl)
        const instrumentAdmin = await this.getInstrumentAdmin(registryUrl)
        return instrumentsResponse.instruments.map((instrument) => ({
            id: instrument.id,
            displayName: instrument.name,
            symbol: instrument.symbol,
            registryUrl,
            admin: instrumentAdmin,
        }))
    }

    async registriesToAssets(registryUrls: string[]) {
        const allInstruments: {
            id: string
            displayName: string
            symbol: string
            registryUrl: string
            admin: PartyId
        }[] = []
        for (const registryUrl of registryUrls) {
            const instruments = await this.instrumentsToAsset(registryUrl)
            allInstruments.push(...instruments)
        }
        return allInstruments
    }

    // <T> is shape of viewValue related to queried interface.
    // i.e. when querying by TransferInstruction interfaceId, <T> would be TransferInstructionView from daml codegen
    async listContractsByInterface<T = ViewValue>(
        interfaceId: string,
        partyId?: PartyId,
        limit?: number,
        offset?: number,
        continueUntilCompletion?: boolean
    ): Promise<PrettyContract<T>[]> {
        return this.core.listContractsByInterface<T>(
            interfaceId,
            partyId,
            limit,
            offset,
            continueUntilCompletion
        )
    }

    async listHoldingTransactions(
        partyId: PartyId,
        afterOffset?: number,
        beforeOffset?: number
    ): Promise<PrettyTransactions> {
        try {
            this.logger.debug('Set or query offset')
            const afterOffsetOrLatest =
                afterOffset ??
                (
                    await this.ledgerProvider.request<Ops.GetV2StateLatestPrunedOffsets>(
                        {
                            method: 'ledgerApi',
                            params: {
                                resource: '/v2/state/latest-pruned-offsets',
                                requestMethod: 'get',
                            },
                        }
                    )
                ).participantPrunedUpToInclusive!
            const beforeOffsetOrLatest =
                beforeOffset ??
                (
                    await this.ledgerProvider.request<Ops.GetV2StateLedgerEnd>({
                        method: 'ledgerApi',
                        params: {
                            resource: '/v2/state/ledger-end',
                            requestMethod: 'get',
                        },
                    })
                ).offset!

            this.logger.debug(afterOffsetOrLatest, 'Using offset')
            const updatesResponse: JsGetUpdatesResponse[] =
                await this.ledgerProvider.request<Ops.PostV2UpdatesFlats>({
                    method: 'ledgerApi',
                    params: {
                        resource: '/v2/updates/flats',
                        requestMethod: 'post',
                        query: {},
                        body: {
                            updateFormat: {
                                includeTransactions: {
                                    eventFormat: EventFilterBySetup({
                                        interfaceIds:
                                            TokenStandardTransactionInterfaces,
                                        isMasterUser: this.isMasterUser,
                                        partyId: partyId,
                                        includeWildcard: true,
                                    }),
                                    transactionShape:
                                        'TRANSACTION_SHAPE_LEDGER_EFFECTS',
                                },
                            },
                            beginExclusive: afterOffsetOrLatest,
                            endInclusive: beforeOffsetOrLatest,
                            verbose: false,
                        } as unknown as Ops.PostV2UpdatesFlats['ledgerApi']['params']['body'],
                    },
                })

            return this.core.toPrettyTransactions(
                updatesResponse,
                partyId
                // this.ledgerProvider
            )
        } catch (err) {
            this.logger.error('Failed to list holding transactions.', err)
            throw err
        }
    }

    async getTransactionById(
        updateId: string,
        partyId: PartyId
    ): Promise<Transaction> {
        const transactionFormat: TransactionFormat = {
            eventFormat: EventFilterBySetup({
                interfaceIds: TokenStandardTransactionInterfaces,
                isMasterUser: this.isMasterUser,
                partyId: partyId,
                includeWildcard: true,
            }),
            transactionShape: 'TRANSACTION_SHAPE_LEDGER_EFFECTS',
        }

        const getTransactionResponse =
            await this.ledgerProvider.request<Ops.PostV2UpdatesTransactionById>(
                {
                    method: 'ledgerApi',
                    params: {
                        resource: '/v2/updates/transaction-by-id',
                        requestMethod: 'post',
                        body: {
                            updateId,
                            transactionFormat,
                        } as Ops.PostV2UpdatesTransactionById['ledgerApi']['params']['body'],
                    },
                }
            )

        return this.core.toPrettyTransaction(getTransactionResponse, partyId)
    }

    async getTransferObjectsById(
        updateId: string,
        partyId: PartyId
    ): Promise<TransferObject[]> {
        const transactionFormat: TransactionFormat = {
            eventFormat: EventFilterBySetup({
                interfaceIds: TokenStandardTransactionInterfaces,
                isMasterUser: this.isMasterUser,
                partyId: partyId,
                includeWildcard: true,
            }),
            transactionShape: 'TRANSACTION_SHAPE_LEDGER_EFFECTS',
        }

        const getTransactionResponse =
            await this.ledgerProvider.request<Ops.PostV2UpdatesTransactionById>(
                {
                    method: 'ledgerApi',
                    params: {
                        resource: '/v2/updates/transaction-by-id',
                        requestMethod: 'post',
                        body: {
                            updateId,
                            transactionFormat,
                        } as Ops.PostV2UpdatesTransactionById['ledgerApi']['params']['body'],
                    },
                }
            )

        return this.core.toPrettyTransferObjects(
            getTransactionResponse,
            partyId
        )
    }

    async getInputHoldingsCids(
        sender: PartyId,
        inputUtxos?: string[],
        amount?: number
    ) {
        return this.core.getInputHoldingsCids(sender, inputUtxos, amount)
    }

    async createDelegateProxyTranfser(
        sender: PartyId,
        receiver: PartyId,
        amount: string,
        instrumentAdmin: PartyId, // TODO (#907): replace with registry call
        instrumentId: string,
        registryUrl: string,
        featuredAppRightCid: string,
        proxyCid: string,
        beneficiaries: Beneficiaries[],
        inputUtxos?: string[],
        memo?: string,
        expiryDate?: Date,
        meta?: Metadata
    ): Promise<[ExerciseCommand, DisclosedContract[]]> {
        const [transferCommand, disclosedContracts] =
            await this.transfer.createTransfer(
                sender,
                receiver,
                amount,
                instrumentAdmin,
                instrumentId,
                registryUrl,
                inputUtxos,
                memo,
                expiryDate,
                meta
            )

        const sumOfWeights: number = beneficiaries.reduce(
            (totalWeight, beneficiary) => totalWeight + beneficiary.weight,
            0
        )

        if (sumOfWeights > 1.0) {
            throw new Error('Sum of beneficiary weights is larger than 1.')
        }

        const choiceArgs = {
            cid: transferCommand.contractId,
            proxyArg: {
                featuredAppRightCid: featuredAppRightCid,
                beneficiaries,
                choiceArg: transferCommand.choiceArgument,
            },
        }

        const exercise: ExerciseCommand = {
            templateId: FEATURED_APP_DELEGATE_PROXY_INTERFACE_ID,
            contractId: proxyCid,
            choice: 'DelegateProxy_TransferFactory_Transfer',
            choiceArgument: choiceArgs,
        }

        return [exercise, disclosedContracts]
    }

    async exerciseDelegateProxyTransferInstructionAccept(
        exchangeParty: PartyId,
        proxyCid: string,
        transferInstructionCid: string,
        registryUrl: string,
        featuredAppRightCid: string
    ): Promise<[ExerciseCommand, DisclosedContract[]]> {
        const [acceptTransferInstructionContext, disclosedContracts] =
            await this.transfer.createAcceptTransferInstruction(
                transferInstructionCid,
                registryUrl
            )

        const choiceArgs = {
            cid: acceptTransferInstructionContext.contractId,
            proxyArg: {
                featuredAppRightCid: featuredAppRightCid,
                beneficiaries: [
                    {
                        beneficiary: exchangeParty,
                        weight: 1.0,
                    },
                ],
                choiceArg: acceptTransferInstructionContext.choiceArgument,
            },
        }

        return [
            {
                templateId:
                    '#splice-util-featured-app-proxies:Splice.Util.FeaturedApp.DelegateProxy:DelegateProxy',
                contractId: proxyCid,
                choice: 'DelegateProxy_TransferInstruction_Accept',
                choiceArgument: choiceArgs,
            },
            disclosedContracts,
        ]
    }

    static isHoldingLocked(
        holding: Holding | TxParseHolding,
        currentTime: Date = new Date()
    ): boolean {
        const lock = holding.lock
        if (!lock) return false

        const expiresAt = lock.expiresAt
        if (!expiresAt) return true

        const expiresAtDate = new Date(expiresAt)
        return currentTime < expiresAtDate
    }
}
