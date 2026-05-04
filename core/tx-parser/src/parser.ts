// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    ensureInterfaceViewIsPresent,
    getInterfaceView,
    getKnownInterfaceView,
    getMetaKeyValue,
    hasInterface,
    mergeMetas,
    removeParsedMetaKeys,
} from './utils.js'
import {
    BurnedMetaKey,
    matchInterfaceIds,
    ReasonMetaKey,
    SenderMetaKey,
    TxKindMetaKey,
} from './constants.js'
import {
    Holding,
    HoldingsChangeSummary,
    HoldingLock,
    HoldingsChange,
    Label,
    TokenStandardEvent,
    Transaction,
    TokenStandardChoice,
    TransferInstructionView,
    TransferInstructionCurrentTag,
    TransferObject,
} from './types.js'
import { InstrumentMap } from './instrumentmap.js'

import {
    EventFilterBySetup,
    type LedgerCommonSchemas,
} from '@canton-network/core-ledger-client-types'
import BigNumber from 'bignumber.js'
import { PartyId } from '@canton-network/core-types'
import {
    HOLDING_INTERFACE_ID,
    TRANSFER_INSTRUCTION_INTERFACE_ID,
} from '@canton-network/core-token-standard'

import {
    AbstractLedgerProvider,
    Ops,
} from '@canton-network/core-provider-ledger'

type ArchivedEvent = LedgerCommonSchemas['ArchivedEvent']
type CreatedEvent = LedgerCommonSchemas['CreatedEvent']
type ExercisedEvent = LedgerCommonSchemas['ExercisedEvent']
type Event = LedgerCommonSchemas['Event']
type JsTransaction = LedgerCommonSchemas['JsTransaction']
type JsGetEventsByContractIdResponse =
    LedgerCommonSchemas['JsGetEventsByContractIdResponse']

function currentStatusFromChoiceOrResult(
    choice?: string | undefined,
    resultTag?: string | undefined
): TransferInstructionCurrentTag {
    // If the result explicitly says Failed/Completed, prefer it.
    if (resultTag === 'TransferInstructionResult_Failed') return 'Failed'
    if (resultTag === 'TransferInstructionResult_Completed') return 'Completed'

    switch (choice) {
        case 'TransferInstruction_Reject':
            return 'Rejected'
        case 'TransferInstruction_Withdraw':
            return 'Withdrawn'
        case 'TransferInstruction_Accept':
        case 'TransferInstruction_Update':
            // When result tag wasn't Completed/Failed above, fall back to Pending
            return 'Pending'
        default:
            // When resultTag is Pending or unknown
            return 'Pending'
    }
}

// -For TransferInstruction Create use originalInstructionCid if present, otherwise this TransferInstruction's cid
// -For TransferInstruction Exercise:  use the exercised TransferInstruction cid, which equals the earlier Pending transferInstruction's cid.
// This lets us correlate Pending to Accept/Reject/Withdraw across updates.
function getCorrelationIdFromTransferInstruction(
    currentInstructionCid: string,
    originalInstructionCid?: string | null
): string {
    return originalInstructionCid ?? currentInstructionCid
}

// If the exercise produced a Pending TI, return its newly created transferInstructionCid
// Otherwise (Completed/Failed/Rejected/Withdrawn), there is no pending TransferInstruction to correlate
function getPendingTransferInstructionCid(
    exercisedEvent: ExercisedEvent
): string | undefined {
    const output = (
        exercisedEvent.exerciseResult as
            | { output?: { tag?: string; value?: any } }
            | undefined
    )?.output
    if (output?.tag !== 'TransferInstructionResult_Pending') return undefined

    const cid = output.value?.transferInstructionCid
    return cid ?? undefined
}

function isTransferObject(value: unknown): value is TransferObject {
    if (!value || typeof value !== 'object') return false
    const v = value as Record<string, unknown>
    const instrumentId = v.instrumentId as Record<string, unknown> | undefined
    const meta = v.meta as Record<string, unknown> | undefined
    return (
        typeof v.sender === 'string' &&
        typeof v.receiver === 'string' &&
        typeof v.amount === 'string' &&
        typeof v.requestedAt === 'string' &&
        typeof v.executeBefore === 'string' &&
        Array.isArray(v.inputHoldingCids) &&
        v.inputHoldingCids.every((cid) => typeof cid === 'string') &&
        !!instrumentId &&
        typeof instrumentId.admin === 'string' &&
        typeof instrumentId.id === 'string' &&
        !!meta &&
        typeof meta.values === 'object' &&
        meta.values !== null
    )
}

export class TransactionParser {
    private readonly ledgerProvider: AbstractLedgerProvider
    private readonly partyId: PartyId
    private readonly transaction: JsTransaction
    private readonly isMasterUser: boolean

    constructor(
        ledgerProvider: AbstractLedgerProvider,
        transaction: JsTransaction,

        partyId: PartyId,
        isMasterUser: boolean
    ) {
        this.ledgerProvider = ledgerProvider
        this.partyId = partyId
        this.transaction = transaction
        this.isMasterUser = isMasterUser
    }

    async parseTransaction(): Promise<Transaction> {
        const tx = this.transaction
        const events = await this.parseEvents([...(tx.events || [])].reverse())
        return {
            updateId: tx.updateId,
            offset: tx.offset,
            recordTime: tx.recordTime,
            synchronizerId: tx.synchronizerId,
            events,
        }
    }

    async parseTransferObjects(): Promise<TransferObject[]> {
        const eventsStack = [...(this.transaction.events || [])].reverse()
        const results = await this.fetchTransferObjectChoice(eventsStack)
        return results
    }

    private async fetchTransferObjectChoice(
        eventsStack: Event[]
    ): Promise<TransferObject[]> {
        const result: TransferObject[] = []
        while (eventsStack.length > 0) {
            const currentEvent = eventsStack.pop()!
            const { exercisedEvent } = getNodeIdAndEvent(currentEvent)
            if (
                exercisedEvent &&
                (exercisedEvent.choice === 'TransferFactory_Transfer' ||
                    exercisedEvent.choice === 'TransferRule_Transfer')
            ) {
                const { choiceArgument } = exercisedEvent
                if (
                    choiceArgument &&
                    typeof choiceArgument === 'object' &&
                    'transfer' in choiceArgument
                ) {
                    const transfer = (choiceArgument as Record<string, unknown>)
                        .transfer
                    if (isTransferObject(transfer)) {
                        result.push(transfer)
                    }
                }
            }
        }
        return result
    }

    private async parseEvents(
        eventsStack: Event[]
    ): Promise<TokenStandardEvent[]> {
        let callStack: Array<{
            parentChoiceName: string
            untilNodeId: number
        }> = []
        let continueAfterNodeId = -1
        const result: TokenStandardEvent[] = []
        while (eventsStack.length > 0) {
            const currentEvent = eventsStack.pop()!

            const { nodeId, createdEvent, archivedEvent, exercisedEvent } =
                getNodeIdAndEvent(currentEvent)
            callStack = callStack.filter((s) => s.untilNodeId <= nodeId)
            const parentChoice =
                (callStack[callStack.length - 1] &&
                    callStack[callStack.length - 1].parentChoiceName) ||
                'none (root node)'

            let parsed: EventParseResult | null
            if (nodeId <= continueAfterNodeId) {
                parsed = null
            } else if (createdEvent) {
                parsed = this.parseRawCreate(createdEvent, parentChoice)
            } else if (archivedEvent) {
                parsed = await this.parseRawArchive(archivedEvent, parentChoice)
            } else if (exercisedEvent) {
                parsed = await this.parseExercise(exercisedEvent)
            } else {
                throw new Error(
                    `Impossible event: ${JSON.stringify(currentEvent)}`
                )
            }
            if (parsed && isLeafEventNode(parsed)) {
                // Exclude events where nothing happened
                if (holdingChangesNonEmpty(parsed.event)) {
                    result.push({
                        ...parsed.event,
                        label: {
                            ...parsed.event.label,
                            meta: removeParsedMetaKeys(parsed.event.label.meta),
                        },
                    })
                }
                continueAfterNodeId = parsed.continueAfterNodeId
            } else if (parsed) {
                callStack.push({
                    parentChoiceName: parsed.parentChoiceName,
                    untilNodeId: parsed.lastDescendantNodeId,
                })
            }
        }
        return result
    }

    private parseRawCreate(
        create: CreatedEvent,
        parentChoice: string
    ): EventParseResult | null {
        return this.buildRawEvent(create, create.nodeId, (result) => {
            return {
                // TODO: this code currently only looks at the first instrument
                // to determine the type of the Event.
                type:
                    Number(
                        result.lockedHoldingsChangeSummaries[0]?.amountChange
                    ) > 0
                        ? 'Lock'
                        : 'Create',
                parentChoice,
                contractId: create.contractId,
                offset: create.offset,
                templateId: create.templateId,
                payload: result.payload,
                packageName: create.packageName,
                meta: undefined,
            }
        })
    }

    private async parseRawArchive(
        archive: ArchivedEvent,
        parentChoice: string
    ): Promise<EventParseResult | null> {
        const events = await this.getEventsForArchive(archive)
        if (!events) {
            return null
        }

        return this.buildRawEvent(
            events.created.createdEvent,
            archive.nodeId,
            (result) => {
                return {
                    type: 'Archive',
                    parentChoice,
                    contractId: archive.contractId,
                    offset: archive.offset,
                    templateId: archive.templateId ?? '',
                    packageName: archive.packageName,
                    actingParties:
                        (archive as ExercisedEvent).actingParties || [],
                    payload: result.payload,
                    meta: undefined,
                } as Label
            }
        )
    }

    private buildRawEvent(
        originalCreate: CreatedEvent,
        nodeId: number,
        buildLabel: (result: {
            payload: any
            lockedHoldingsChangeSummaries: HoldingsChangeSummary[]
            unlockedHoldingsChangeSummaries: HoldingsChangeSummary[]
        }) => Label
    ): EventParseResult | null {
        const view = getKnownInterfaceView(originalCreate)
        let result: {
            payload: any
            lockedHoldingsChange: HoldingsChange
            lockedHoldingsChangeSummaries: HoldingsChangeSummary[]
            lockedHoldingsChangeSummary: HoldingsChangeSummary
            unlockedHoldingsChange: HoldingsChange
            unlockedHoldingsChangeSummaries: HoldingsChangeSummary[]
            unlockedHoldingsChangeSummary: HoldingsChangeSummary
            transferInstruction: TransferInstructionView | null
        } | null
        switch (view?.type) {
            case 'Holding': {
                const holdingView = view.viewValue
                if (this.partyId !== holdingView.owner) {
                    result = null
                } else {
                    const isLocked = !!holdingView.lock
                    const summary: HoldingsChangeSummary = {
                        instrumentId: holdingView.instrumentId,
                        amountChange: holdingView.amount,
                        numInputs: 0,
                        inputAmount: '0',
                        numOutputs: 1,
                        outputAmount: holdingView.amount,
                    }
                    const lockedHoldingsChangeSummaries = isLocked
                        ? [summary]
                        : []
                    const unlockedHoldingsChangeSummaries = isLocked
                        ? []
                        : [summary]
                    result = {
                        payload: holdingView,
                        unlockedHoldingsChange: {
                            creates: isLocked ? [] : [holdingView],
                            archives: [],
                        },
                        lockedHoldingsChange: {
                            creates: isLocked ? [holdingView] : [],
                            archives: [],
                        },
                        lockedHoldingsChangeSummaries,
                        lockedHoldingsChangeSummary:
                            lockedHoldingsChangeSummaries[0] ??
                            emptyHoldingsChangeSummary,
                        unlockedHoldingsChangeSummaries,
                        unlockedHoldingsChangeSummary:
                            unlockedHoldingsChangeSummaries[0] ??
                            emptyHoldingsChangeSummary,
                        transferInstruction: null,
                    }
                }
                break
            }
            case 'TransferInstruction': {
                const transferInstructionView = view.viewValue
                if (
                    ![
                        transferInstructionView.transfer.sender,
                        transferInstructionView.transfer.receiver,
                    ].some((stakeholder) => stakeholder === this.partyId)
                ) {
                    result = null
                } else {
                    const multiStepCorrelationId =
                        getCorrelationIdFromTransferInstruction(
                            originalCreate.contractId,
                            transferInstructionView.originalInstructionCid ??
                                null
                        )
                    result = {
                        payload: transferInstructionView,
                        transferInstruction: {
                            originalInstructionCid:
                                transferInstructionView.originalInstructionCid,
                            transfer: transferInstructionView.transfer,
                            meta: transferInstructionView.meta,
                            status: {
                                before: transferInstructionView.status, // raw DAML pending sub-state
                                current: { tag: 'Pending', value: {} }, // normalized
                            },
                            multiStepCorrelationId,
                        },
                        unlockedHoldingsChange: { creates: [], archives: [] },
                        lockedHoldingsChange: { creates: [], archives: [] },
                        unlockedHoldingsChangeSummaries: [],
                        unlockedHoldingsChangeSummary:
                            emptyHoldingsChangeSummary,
                        lockedHoldingsChangeSummaries: [],
                        lockedHoldingsChangeSummary: emptyHoldingsChangeSummary,
                    }
                }
                break
            }
            default:
                result = null
        }

        return (
            result && {
                continueAfterNodeId: nodeId,
                event: {
                    label: buildLabel(result),
                    unlockedHoldingsChange: result.unlockedHoldingsChange,
                    lockedHoldingsChange: result.lockedHoldingsChange,
                    lockedHoldingsChangeSummaries:
                        result.lockedHoldingsChangeSummaries,
                    lockedHoldingsChangeSummary:
                        result.lockedHoldingsChangeSummary,
                    unlockedHoldingsChangeSummaries:
                        result.unlockedHoldingsChangeSummaries,
                    unlockedHoldingsChangeSummary:
                        result.unlockedHoldingsChangeSummary,
                    transferInstruction: result.transferInstruction,
                },
            }
        )
    }

    private async parseExercise(
        exercise: ExercisedEvent
    ): Promise<EventParseResult | null> {
        let result: ParsedKnownExercisedEvent | null = null
        const tokenStandardChoice = {
            name: exercise.choice,
            choiceArgument: exercise.choiceArgument,
            exerciseResult: exercise.exerciseResult,
        }
        switch (exercise.choice) {
            case 'TransferRule_Transfer':
            case 'TransferFactory_Transfer':
                result = await this.buildTransfer(exercise, tokenStandardChoice)
                break
            case 'TransferInstruction_Accept':
            case 'TransferInstruction_Reject':
            case 'TransferInstruction_Withdraw':
            case 'TransferInstruction_Update':
                result = await this.buildFromTransferInstructionExercise(
                    exercise,
                    tokenStandardChoice
                )
                break
            case 'BurnMintFactory_BurnMint':
                result = await this.buildMergeSplit(
                    exercise,
                    tokenStandardChoice
                )
                break
            default: {
                const meta = mergeMetas(exercise)
                const txKind = getMetaKeyValue(TxKindMetaKey, meta)
                if (txKind) {
                    result = await this.parseViaTxKind(exercise, txKind)
                }
                break
            }
        }
        if (!result) {
            return {
                lastDescendantNodeId: exercise.lastDescendantNodeId,
                parentChoiceName: exercise.choice,
            }
        } else {
            // only this.partyId's holdings should be included in the response
            const lockedHoldingsChange: HoldingsChange = {
                creates: result.children.creates.filter(
                    (h) => !!h.lock && h.owner === this.partyId
                ),
                archives: result.children.archives.filter(
                    (h) => !!h.lock && h.owner === this.partyId
                ),
            }
            const unlockedHoldingsChange: HoldingsChange = {
                creates: result.children.creates.filter(
                    (h) => !h.lock && h.owner === this.partyId
                ),
                archives: result.children.archives.filter(
                    (h) => !h.lock && h.owner === this.partyId
                ),
            }
            const lockedHoldingsChangeSummaries = computeSummaries(
                lockedHoldingsChange,
                this.partyId
            )
            const unlockedHoldingsChangeSummaries = computeSummaries(
                unlockedHoldingsChange,
                this.partyId
            )
            return {
                event: {
                    label: result.label,
                    lockedHoldingsChange,
                    lockedHoldingsChangeSummaries,
                    lockedHoldingsChangeSummary:
                        lockedHoldingsChangeSummaries[0] ??
                        emptyHoldingsChangeSummary,
                    unlockedHoldingsChange,
                    unlockedHoldingsChangeSummaries,
                    unlockedHoldingsChangeSummary:
                        unlockedHoldingsChangeSummaries[0] ??
                        emptyHoldingsChangeSummary,
                    transferInstruction: result.transferInstruction,
                },
                continueAfterNodeId: exercise.lastDescendantNodeId,
            }
        }
    }

    private async parseViaTxKind(
        exercisedEvent: ExercisedEvent,
        txKind: string
    ): Promise<ParsedKnownExercisedEvent | null> {
        switch (txKind) {
            case 'transfer':
                return await this.buildTransfer(exercisedEvent, null)
            case 'merge-split':
            case 'burn':
            case 'mint':
                return await this.buildMergeSplit(exercisedEvent, null)
            case 'unlock':
                return await this.buildBasic(exercisedEvent, 'Unlock', null)
            case 'expire-dust':
                return await this.buildBasic(exercisedEvent, 'ExpireDust', null)
            default:
                throw new Error(
                    `Unknown tx-kind '${txKind}' in ${JSON.stringify(exercisedEvent)}`
                )
        }
    }

    private async buildTransfer(
        exercisedEvent: ExercisedEvent,
        tokenStandardChoice: TokenStandardChoice | null,
        transferInstructions?: TransferInstructionView
    ): Promise<ParsedKnownExercisedEvent | null> {
        const meta = mergeMetas(
            exercisedEvent,
            transferInstructions?.transfer?.meta
        )
        const reason = getMetaKeyValue(ReasonMetaKey, meta)
        const choiceArgumentTransfer = (
            exercisedEvent.choiceArgument as {
                transfer?: any
            }
        ).transfer

        const sender: string =
            transferInstructions?.transfer?.sender ||
            getMetaKeyValue(SenderMetaKey, meta) ||
            choiceArgumentTransfer.sender
        if (!sender) {
            console.error(
                `Malformed transfer didn't contain sender. Will instead attempt to parse the children.
        Transfer: ${JSON.stringify(exercisedEvent)}`
            )
            return null
        }

        const resultTag =
            (
                exercisedEvent.exerciseResult as
                    | { output?: { tag?: string } }
                    | undefined
            )?.output?.tag || undefined
        const pendingCid = getPendingTransferInstructionCid(exercisedEvent)
        const currentTag = currentStatusFromChoiceOrResult(
            exercisedEvent.choice,
            resultTag
        )

        const children = await this.getChildren(exercisedEvent)
        const receiverAmounts = new Map<string, BigNumber>()
        children.creates
            .filter((h) => h.owner !== sender)
            .forEach((holding) =>
                receiverAmounts.set(
                    holding.owner,
                    (receiverAmounts.get(holding.owner) || BigNumber('0')).plus(
                        BigNumber(holding.amount)
                    )
                )
            )
        const amountChanges = computeAmountChanges(children, meta, this.partyId)

        let label: Label
        if (receiverAmounts.size === 0) {
            label = {
                ...amountChanges,
                type: 'MergeSplit',
                tokenStandardChoice,
                reason,
                meta,
            }
        } else if (sender === this.partyId) {
            label = {
                ...amountChanges,
                type: 'TransferOut',
                receiverAmounts: [...receiverAmounts].map(([k, v]) => {
                    return { receiver: k, amount: v.toString() }
                }),
                tokenStandardChoice,
                reason,
                meta,
            }
        } else {
            label = {
                type: 'TransferIn',
                // for Transfers, the burn/mint is always 0 for the receiving party (i.e., 0 for TransferIn)
                burnAmount: '0',
                mintAmount: '0',
                sender,
                tokenStandardChoice,
                reason,
                meta,
            }
        }

        if (transferInstructions) {
            transferInstructions.status.current = transferInstructions.status
                .current || { tag: currentTag, value: {} }
            return {
                label,
                children,
                transferInstruction: transferInstructions,
            }
        }

        const transferInstruction: TransferInstructionView = {
            originalInstructionCid: null,
            ...(choiceArgumentTransfer !== undefined && {
                transfer: choiceArgumentTransfer,
            }),
            status: {
                before: null,
                current: { tag: currentTag, value: {} },
            },
            meta: null,
            ...(pendingCid ? { multiStepCorrelationId: pendingCid } : {}),
        }

        return {
            label,
            children,
            transferInstruction,
        }
    }

    private async buildMergeSplit(
        exercisedEvent: ExercisedEvent,
        tokenStandardChoice: TokenStandardChoice | null
    ): Promise<ParsedKnownExercisedEvent> {
        let type: 'MergeSplit' | 'Mint' | 'Burn'
        const meta = mergeMetas(exercisedEvent)
        switch (getMetaKeyValue(TxKindMetaKey, meta)) {
            case 'burn':
                type = 'Burn'
                break
            case 'mint':
                type = 'Mint'
                break
            default:
                type = 'MergeSplit'
        }
        const reason = getMetaKeyValue(ReasonMetaKey, meta)
        const children = await this.getChildren(exercisedEvent)
        const amountChanges = computeAmountChanges(children, meta, this.partyId)

        const label: Label = {
            ...amountChanges,
            type,
            tokenStandardChoice,
            reason,
            meta,
        }

        return {
            label,
            children,
            transferInstruction: null,
        }
    }

    private async buildFromTransferInstructionExercise(
        exercisedEvent: ExercisedEvent,
        tokenStandardChoice: TokenStandardChoice
    ): Promise<ParsedKnownExercisedEvent | null> {
        const instructionCid = exercisedEvent.contractId
        const transferInstructionEvents =
            await this.getEventsForArchive(exercisedEvent)
        if (!transferInstructionEvents) {
            // This will happen when the party observes the archive but is not a stakeholder.
            // For example, for Amulet, a validator will see a TransferInstruction_Reject/Withdraw
            // but will not see the create of a TransferInstruction.
            return null
        }
        const transferInstructionView = ensureInterfaceViewIsPresent(
            transferInstructionEvents.created.createdEvent,
            TRANSFER_INSTRUCTION_INTERFACE_ID
        ).viewValue as TransferInstructionView

        const multiStepCorrelationId = getCorrelationIdFromTransferInstruction(
            instructionCid,
            transferInstructionView.originalInstructionCid ?? null
        )

        const resultTag =
            (
                exercisedEvent.exerciseResult as
                    | { output?: { tag?: string } }
                    | undefined
            )?.output?.tag || undefined

        const currentTag = currentStatusFromChoiceOrResult(
            exercisedEvent.choice,
            resultTag
        )

        const transferInstruction: TransferInstructionView = {
            originalInstructionCid:
                transferInstructionView.originalInstructionCid,
            multiStepCorrelationId,
            transfer: transferInstructionView.transfer,
            meta: transferInstructionView.meta,
            status: {
                before: transferInstructionView.status,
                current: { tag: currentTag, value: {} },
            },
        }

        const exerciseResultOutputTag = resultTag
        const result =
            await (async (): Promise<ParsedKnownExercisedEvent | null> => {
                switch (exerciseResultOutputTag) {
                    case 'TransferInstructionResult_Failed':
                    case 'TransferInstructionResult_Pending':
                        return this.buildMergeSplit(
                            exercisedEvent,
                            tokenStandardChoice
                        )
                    case 'TransferInstructionResult_Completed':
                        return this.buildTransfer(
                            exercisedEvent,
                            tokenStandardChoice,
                            transferInstruction
                        )
                    default:
                        throw new Error(
                            `Unknown TransferInstructionResult: ${exerciseResultOutputTag}`
                        )
                }
            })()

        return (
            result && {
                ...result,
                transferInstruction,
            }
        )
    }

    private async buildBasic(
        exercisedEvent: ExercisedEvent,
        type: 'Unlock' | 'ExpireDust',
        tokenStandardChoice: TokenStandardChoice | null
    ): Promise<ParsedKnownExercisedEvent> {
        const children = await this.getChildren(exercisedEvent)
        const meta = mergeMetas(exercisedEvent)
        const amountChanges = computeAmountChanges(children, meta, this.partyId)
        const reason = getMetaKeyValue(ReasonMetaKey, meta)
        return {
            label: {
                ...amountChanges,
                type,
                tokenStandardChoice,
                reason,
                meta,
            },
            children,
            transferInstruction: null,
        }
    }

    private async getChildren(
        exercisedEvent: ExercisedEvent
    ): Promise<HoldingsChange> {
        const mutatingResult: HoldingsChange = { creates: [], archives: [] }
        const childrenEventsSlice = (this.transaction.events || [])
            .map(getNodeIdAndEvent)
            .filter(
                ({ nodeId }) =>
                    nodeId > exercisedEvent.nodeId &&
                    nodeId <= exercisedEvent.lastDescendantNodeId
            )

        if (
            exercisedEvent.consuming &&
            hasInterface(HOLDING_INTERFACE_ID, exercisedEvent)
        ) {
            const selfEvent = await this.getEventsForArchive(exercisedEvent)
            if (selfEvent) {
                const holdingView = ensureInterfaceViewIsPresent(
                    selfEvent.created.createdEvent,
                    HOLDING_INTERFACE_ID
                ).viewValue as Holding
                mutatingResult.archives.push({
                    amount: holdingView.amount,
                    instrumentId: holdingView.instrumentId,
                    contractId: exercisedEvent.contractId,
                    owner: holdingView.owner,
                    meta: holdingView.meta,
                    lock: holdingView.lock,
                })
            }
        }

        for (const {
            createdEvent,
            archivedEvent,
            exercisedEvent,
        } of childrenEventsSlice) {
            if (createdEvent) {
                const interfaceView = getInterfaceView(createdEvent)
                if (
                    interfaceView &&
                    interfaceView.interfaceId &&
                    matchInterfaceIds(
                        HOLDING_INTERFACE_ID,
                        interfaceView.interfaceId
                    )
                ) {
                    const holdingView = interfaceView.viewValue as Holding
                    mutatingResult.creates.push({
                        amount: holdingView.amount,
                        instrumentId: holdingView.instrumentId,
                        contractId: createdEvent.contractId,
                        owner: holdingView.owner,
                        meta: holdingView.meta,
                        lock: holdingView.lock,
                    })
                }
            } else if (
                (archivedEvent &&
                    hasInterface(HOLDING_INTERFACE_ID, archivedEvent)) ||
                (exercisedEvent &&
                    exercisedEvent.consuming &&
                    hasInterface(HOLDING_INTERFACE_ID, exercisedEvent))
            ) {
                const contractEvents = await this.getEventsForArchive(
                    archivedEvent || exercisedEvent!
                )
                if (contractEvents) {
                    const holdingView = ensureInterfaceViewIsPresent(
                        contractEvents.created?.createdEvent,
                        HOLDING_INTERFACE_ID
                    ).viewValue as Holding
                    mutatingResult.archives.push({
                        amount: holdingView.amount,
                        instrumentId: holdingView.instrumentId,
                        contractId:
                            archivedEvent?.contractId ||
                            exercisedEvent!.contractId,
                        owner: holdingView.owner,
                        meta: holdingView.meta,
                        lock: holdingView.lock,
                    })
                }
            }
        }

        return {
            // remove transient contracts
            creates: mutatingResult.creates.filter(
                (create) =>
                    !mutatingResult.archives.some(
                        (archive) => create.contractId === archive.contractId
                    )
            ),
            archives: mutatingResult.archives.filter(
                (archive) =>
                    !mutatingResult.creates.some(
                        (create) => create.contractId === archive.contractId
                    )
            ),
        }
    }

    private async getEventsForArchive(
        archivedEvent: ArchivedEvent | ExercisedEvent
    ): Promise<null | Required<JsGetEventsByContractIdResponse>> {
        if (!(archivedEvent.witnessParties || []).includes(this.partyId)) {
            return null
        }

        const basePayload: Ops.PostV2EventsEventsByContractId['ledgerApi']['params']['body'] =
            {
                contractId: archivedEvent.contractId,
                eventFormat: EventFilterBySetup({
                    interfaceIds: [
                        HOLDING_INTERFACE_ID,
                        TRANSFER_INSTRUCTION_INTERFACE_ID,
                    ],
                    isMasterUser: this.isMasterUser,
                    partyId: this.partyId,
                    verbose: true,
                }) as Ops.PostV2EventsEventsByContractId['ledgerApi']['params']['body']['eventFormat'],
            }

        const events = await this.ledgerProvider
            .request<Ops.PostV2EventsEventsByContractId>({
                method: 'ledgerApi',
                params: {
                    resource: '/v2/events/events-by-contract-id',
                    requestMethod: 'post',
                    body: basePayload,
                },
            })
            .catch((err) => {
                // This will happen for holdings with consuming choices
                // where the party the script is running on is an actor on the choice
                // but not a stakeholder.
                if (err.code === 'CONTRACT_EVENTS_NOT_FOUND') {
                    return null
                } else {
                    throw err
                }
            })

        if (!events) {
            return null
        }

        const created = events.created
        const archived = events.archived
        if (!created || !archived) {
            throw new Error(
                `Archival of ${
                    archivedEvent.contractId
                } does not have a corresponding create/archive event: ${JSON.stringify(
                    events
                )}`
            )
        }
        return { created, archived }
    }
}

type EventParseResult = ParseChildren | ParsedEvent
function isLeafEventNode(result: EventParseResult): result is ParsedEvent {
    return !!(result as ParsedEvent).event
}
interface ParsedEvent {
    event: TokenStandardEvent
    continueAfterNodeId: number
}
interface ParseChildren {
    parentChoiceName: string
    lastDescendantNodeId: number
}

interface ParsedKnownExercisedEvent {
    label: Label
    children: HoldingsChange
    transferInstruction: TransferInstructionView | null
}

// a naive implementation like event.X?.nodeId || event.Y?.nodeId || event.Z?.nodeId fails when nodeId=0
interface NodeIdAndEvent {
    nodeId: number
    exercisedEvent?: ExercisedEvent
    archivedEvent?: ArchivedEvent | ExercisedEvent
    createdEvent?: CreatedEvent
}
function getNodeIdAndEvent(event: Event): NodeIdAndEvent {
    if ('ExercisedEvent' in event) {
        // ledger API's TRANSACTION_SHAPE_LEDGER_EFFECTS does not include ArchivedEvent, instead has the choice as Archive
        if (event.ExercisedEvent.choice === 'Archive') {
            return {
                nodeId: event.ExercisedEvent.nodeId,
                archivedEvent: event.ExercisedEvent,
            }
        } else {
            return {
                nodeId: event.ExercisedEvent.nodeId,
                exercisedEvent: event.ExercisedEvent,
            }
        }
    } else if ('CreatedEvent' in event) {
        return {
            nodeId: event.CreatedEvent.nodeId,
            createdEvent: event.CreatedEvent,
        }
    } else if ('ArchivedEvent' in event) {
        return {
            nodeId: event.ArchivedEvent.nodeId,
            archivedEvent: event.ArchivedEvent,
        }
    } else {
        throw new Error(`Impossible event type: ${event}`)
    }
}

/** sumHoldingsChange sums all the changes over a number of holdings.
 *  Note that this function currently assumes all holdings use the same
 *  instrument. */
function sumHoldingsChange(
    change: HoldingsChange,
    filter: (owner: string, lock: HoldingLock | null) => boolean
): BigNumber {
    return sumHoldings(
        change.creates.filter((create) => filter(create.owner, create.lock))
    ).minus(
        sumHoldings(
            change.archives.filter((archive) =>
                filter(archive.owner, archive.lock)
            )
        )
    )
}

function sumHoldings(holdings: Holding[]): BigNumber {
    if (holdings.length > 0) {
        // Sanity check.
        const instrumentId = holdings[0].instrumentId
        for (const holding of holdings) {
            if (
                holding.instrumentId.admin !== instrumentId.admin ||
                holding.instrumentId.id !== instrumentId.id
            ) {
                throw new Error(
                    `Attempted to call sumHoldings on heterogeneous instruments: ${JSON.stringify(instrumentId)} != ${JSON.stringify(holding.instrumentId)}`
                )
            }
        }
    }
    return BigNumber.sum(
        ...holdings.map((h) => h.amount).concat(['0']) // avoid NaN
    )
}

function computeAmountChanges(
    children: HoldingsChange,
    meta: any,
    partyId: string
) {
    const burnAmount = BigNumber(getMetaKeyValue(BurnedMetaKey, meta) || '0')
    const partyHoldingAmountChange = sumHoldingsChange(
        children,
        (owner) => owner === partyId
    )
    const otherPartiesHoldingAmountChange = sumHoldingsChange(
        children,
        (owner) => owner !== partyId
    )
    const mintAmount = partyHoldingAmountChange
        .plus(burnAmount)
        .plus(otherPartiesHoldingAmountChange)
    return {
        burnAmount: burnAmount.toString(),
        mintAmount: mintAmount.toString(),
    }
}

function computeSummary(
    instrumentId: { admin: string; id: string },
    changes: HoldingsChange,
    partyId: string
): HoldingsChangeSummary {
    const amountChange = sumHoldingsChange(
        changes,
        (owner) => owner === partyId
    )
    const outputAmount = sumHoldings(changes.creates)
    const inputAmount = sumHoldings(changes.archives)
    return {
        instrumentId,
        amountChange: amountChange.toString(),
        numOutputs: changes.creates.length,
        outputAmount: outputAmount.toString(),
        numInputs: changes.archives.length,
        inputAmount: inputAmount.toString(),
    }
}

function holdingsChangeByInstrument(
    changes: HoldingsChange
): InstrumentMap<HoldingsChange> {
    const map = new InstrumentMap<{ creates: Holding[]; archives: Holding[] }>()
    for (const create of changes.creates) {
        if (map.has(create.instrumentId)) {
            map.get(create.instrumentId)!.creates.push(create)
        } else {
            map.set(create.instrumentId, { creates: [create], archives: [] })
        }
    }
    for (const archive of changes.archives) {
        if (map.has(archive.instrumentId)) {
            map.get(archive.instrumentId)!.archives.push(archive)
        } else {
            map.set(archive.instrumentId, { creates: [], archives: [archive] })
        }
    }
    return map
}

function computeSummaries(
    changes: HoldingsChange,
    partyId: string
): HoldingsChangeSummary[] {
    const byInstrument = holdingsChangeByInstrument(changes)
    return [...byInstrument.entries()].map(([instrumentId, change]) =>
        computeSummary(instrumentId, change, partyId)
    )
}

function holdingChangesNonEmpty(event: TokenStandardEvent): boolean {
    return (
        event.unlockedHoldingsChange.creates.length > 0 ||
        event.unlockedHoldingsChange.archives.length > 0 ||
        event.lockedHoldingsChange.creates.length > 0 ||
        event.lockedHoldingsChange.archives.length > 0
    )
}

const emptyHoldingsChangeSummary: HoldingsChangeSummary = {
    // This is obviously incorrect, but the field was introduced at the same
    // time at which we introduced the more correct per-instrument summaries,
    // so we know that old code couldn't use this (broken) field, and new code
    // should use the correct summaries.
    instrumentId: { admin: '', id: '' },
    numInputs: 0,
    numOutputs: 0,
    inputAmount: '0',
    outputAmount: '0',
    amountChange: '0',
}
