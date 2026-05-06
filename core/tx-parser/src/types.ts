// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Metadata } from '@canton-network/core-token-standard'
import { type LedgerCommonSchemas } from '@canton-network/core-ledger-client-types'

export type ViewValue = LedgerCommonSchemas['JsInterfaceView']['viewValue'] // unknown | undefined
export type JsActiveContract = LedgerCommonSchemas['JsActiveContract']
export interface Transaction {
    updateId: string
    offset: number
    recordTime: string
    synchronizerId: string
    events: TokenStandardEvent[]
}

export interface TransferObject {
    amount: string
    executeBefore: string
    inputHoldingCids: string[]
    instrumentId: { admin: string; id: string }
    meta: Metadata
    receiver: string
    requestedAt: string
    sender: string
}

export interface TokenStandardEvent {
    label: Label
    lockedHoldingsChange: HoldingsChange
    /** lockedHoldingsChangeSummaries contains one summary per instrument. */
    lockedHoldingsChangeSummaries: HoldingsChangeSummary[]
    /** @deprecated lockedHoldingsChangeSummary is incorrect in a
     *  multi-instrument world.  It will be removed in a future release, please
     *  use unlockedHoldingsChangeSummaries instead. */
    lockedHoldingsChangeSummary: HoldingsChangeSummary
    unlockedHoldingsChange: HoldingsChange
    /** unlockedHoldingsChangeSummary contains one summary per instrument. */
    unlockedHoldingsChangeSummaries: HoldingsChangeSummary[]
    /** @deprecated unlockedHoldingsChangeSummary is incorrect in a
     *  multi-instrument world. It will be removed in a future release, please
     *  use unlockedHoldingsChangeSummaries instead. */
    unlockedHoldingsChangeSummary: HoldingsChangeSummary
    transferInstruction: TransferInstructionView | null
}

// Same definition as HoldingView in Daml
export interface Holding {
    contractId: string
    owner: string
    instrumentId: { admin: string; id: string }
    amount: string
    lock: HoldingLock | null
    meta: any
}

export interface HoldingLock {
    holders: string[]
    expiresAt?: string
    expiresAfter?: string
    context?: string
}

export interface HoldingsChange {
    creates: Holding[]
    archives: Holding[]
}

export interface HoldingsChangeSummary {
    instrumentId: { admin: string; id: string }
    numInputs: number
    inputAmount: string
    numOutputs: number
    outputAmount: string
    amountChange: string
}

/**
 * Same as TransferInstructionView in Daml when exercising a TransferInstruction choice,
 * otherwise just meta and transfer.
 */
// TODO investigate because it actually differs from TransferInstructionView from daml codegen
// where status is: { tag, value }
export interface TransferInstructionView {
    // currentInstructionCid: string // TODO (#505): add
    originalInstructionCid: string | null
    transfer?: any
    status: {
        before: any
        current: { tag: TransferInstructionCurrentTag; value: unknown } | null
    }
    meta: Metadata | null
    // Stable id to track one TransferInstruction lifecycle across updates, inspired by Java parser
    multiStepCorrelationId?: string
}

export type TransferInstructionCurrentTag =
    | 'Pending'
    | 'Completed'
    | 'Rejected'
    | 'Withdrawn'
    | 'Failed'

export type Label =
    | TransferOut
    | TransferIn
    | MergeSplit
    | Burn
    | Mint
    | Unlock
    | Lock
    | ExpireDust
    | UnknownAction
type UnknownAction = RawArchive | RawCreate
interface BaseLabel {
    type: string
    meta: any
}
interface KnownLabel extends BaseLabel {
    mintAmount: string
    burnAmount: string
    reason: string | null
    tokenStandardChoice: TokenStandardChoice | null
}
export interface TokenStandardChoice {
    name: string
    choiceArgument: any
    exerciseResult: any
}

export interface TransferOut extends KnownLabel {
    type: 'TransferOut'
    receiverAmounts: Array<{ receiver: string; amount: string }>
}

export interface TransferIn extends KnownLabel {
    type: 'TransferIn'
    sender: string
}

export interface MergeSplit extends KnownLabel {
    type: 'MergeSplit'
}

// Same as MergeSplit, but is more precise (tx-kind=burn)
export interface Burn extends KnownLabel {
    type: 'Burn'
}

// Same as MergeSplit, but is more precise (tx-kind=mint)
export interface Mint extends KnownLabel {
    type: 'Mint'
}

export interface Unlock extends KnownLabel {
    type: 'Unlock'
}

export interface Lock extends KnownLabel {
    type: 'Lock'
}

export interface ExpireDust extends KnownLabel {
    type: 'ExpireDust'
}

export interface RawArchive extends BaseLabel {
    type: 'Archive'
    parentChoice: string
    contractId: string
    offset: number
    templateId: string
    packageName: string
    actingParties: string[]
    payload: any
    meta: any
}
export interface RawCreate extends BaseLabel {
    type: 'Create' | 'Lock'
    parentChoice: string
    contractId: string
    offset: number
    templateId: string
    payload: any
    packageName: string
    meta: any
}

export const renderTransaction = (t: Transaction): any => {
    return { ...t, events: t.events.map(renderTransactionEvent) }
}

const renderTransactionEvent = (e: TokenStandardEvent): any => {
    const lockedHoldingsChangeSummaries = e.lockedHoldingsChangeSummaries
        .map(renderHoldingsChangeSummary)
        .filter((s) => s !== null)

    const unlockedHoldingsChangeSummaries = e.unlockedHoldingsChangeSummaries
        .map(renderHoldingsChangeSummary)
        .filter((s) => s !== null)

    const lockedHoldingsChange = renderHoldingsChange(e.lockedHoldingsChange)
    const unlockedHoldingsChange = renderHoldingsChange(
        e.unlockedHoldingsChange
    )
    return {
        ...e,
        lockedHoldingsChange,
        unlockedHoldingsChange,
        lockedHoldingsChangeSummaries,
        // Deprecated
        lockedHoldingsChangeSummary: renderHoldingsChangeSummary(
            e.lockedHoldingsChangeSummary
        ),
        unlockedHoldingsChangeSummaries,
        // Deprecated
        unlockedHoldingsChangeSummary: renderHoldingsChangeSummary(
            e.unlockedHoldingsChangeSummary
        ),
    }
}

const renderHoldingsChangeSummary = (
    s: HoldingsChangeSummary
): Partial<HoldingsChangeSummary> | null => {
    if (
        s.numInputs === 0 &&
        s.numOutputs === 0 &&
        s.inputAmount === '0' &&
        s.outputAmount === '0' &&
        s.amountChange === '0'
    ) {
        return null
    }
    return {
        ...((s.instrumentId.admin !== '' || s.instrumentId.id !== '') && {
            instrumentId: s.instrumentId,
        }),
        ...(s.numInputs !== 0 && { numInputs: s.numInputs }),
        ...(s.inputAmount !== '0' && { inputAmount: s.inputAmount }),
        ...(s.numOutputs !== 0 && { numOutputs: s.numOutputs }),
        ...(s.outputAmount !== '0' && { outputAmount: s.outputAmount }),
        ...(s.amountChange !== '0' && { amountChange: s.amountChange }),
    }
}

const renderHoldingsChange = (
    c: HoldingsChange
): Partial<HoldingsChange> | null => {
    if (c.creates.length === 0 && c.archives.length === 0) {
        return null
    }
    return {
        ...(c.creates.length !== 0 && { creates: c.creates }),
        ...(c.archives.length !== 0 && { archives: c.archives }),
    }
}

export interface PrettyTransactions {
    transactions: Transaction[]
    nextOffset: number
}

export interface PrettyContract<T = ViewValue> {
    contractId: string
    interfaceViewValue: T
    activeContract: JsActiveContract
    fetchedAtOffset?: number | undefined
}
