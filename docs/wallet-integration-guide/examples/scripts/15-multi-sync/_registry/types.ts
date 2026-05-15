// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Shared Token Standard types for the TestToken registry server.
 *
 * Derived from the four API specs in api-specs/splice/0.6.1/.  Each handler
 * interface corresponds to one spec; common primitives are deduplicated here.
 */

// ── Shared primitives ──────────────────────────────────────────────────────

export interface DisclosedContract {
    templateId: string
    contractId: string
    createdEventBlob: string
    synchronizerId: string
    debugPackageName?: string
    debugPayload?: Record<string, never>
    debugCreatedAt?: string
}

export interface ChoiceContext {
    choiceContextData: Record<string, unknown>
    disclosedContracts: DisclosedContract[]
}

/** Used by getTransferFactory and getAllocationFactory. */
export interface GetFactoryRequest {
    choiceArguments: Record<string, never>
    excludeDebugFields?: boolean
}

/** Used by transfer-instruction and allocation choice-context endpoints. */
export interface GetChoiceContextRequest {
    meta?: Record<string, string>
    excludeDebugFields?: boolean
}

// ── token-metadata-v1 ──────────────────────────────────────────────────────

export type SupportedApis = Record<string, number>

export interface GetRegistryInfoResponse {
    adminId: string
    supportedApis: SupportedApis
}

export interface Instrument {
    id: string
    name: string
    symbol: string
    totalSupply?: string
    totalSupplyAsOf?: string
    decimals: number
    supportedApis: SupportedApis
}

export interface ListInstrumentsResponse {
    instruments: Instrument[]
    nextPageToken?: string
}

export interface MetadataHandlers {
    getRegistryInfo():
        | GetRegistryInfoResponse
        | Promise<GetRegistryInfoResponse>
    listInstruments(query?: {
        pageSize?: number
        pageToken?: string
    }): ListInstrumentsResponse | Promise<ListInstrumentsResponse>
    getInstrument(path: {
        instrumentId: string
    }): Instrument | null | Promise<Instrument | null>
}

// ── transfer-instruction-v1 ────────────────────────────────────────────────

export interface TransferFactoryWithChoiceContext {
    factoryId: string
    transferKind: 'self' | 'direct' | 'offer'
    choiceContext: ChoiceContext
}

export interface TransferHandlers {
    getTransferFactory(
        body: GetFactoryRequest
    ):
        | TransferFactoryWithChoiceContext
        | null
        | Promise<TransferFactoryWithChoiceContext | null>
    getTransferInstructionAcceptContext(
        path: { transferInstructionId: string },
        body: GetChoiceContextRequest
    ): ChoiceContext | Promise<ChoiceContext>
    getTransferInstructionRejectContext(
        path: { transferInstructionId: string },
        body: GetChoiceContextRequest
    ): ChoiceContext | Promise<ChoiceContext>
    getTransferInstructionWithdrawContext(
        path: { transferInstructionId: string },
        body: GetChoiceContextRequest
    ): ChoiceContext | Promise<ChoiceContext>
}

// ── allocation-instruction-v1 ──────────────────────────────────────────────

export interface FactoryWithChoiceContext {
    factoryId: string
    choiceContext: ChoiceContext
}

export interface AllocationInstructionHandlers {
    getAllocationFactory(
        body: GetFactoryRequest
    ):
        | FactoryWithChoiceContext
        | null
        | Promise<FactoryWithChoiceContext | null>
}

// ── admin ──────────────────────────────────────────────────────────────────

/**
 * Callback provided by the caller so the registry can submit signed
 * commands on behalf of tokenAdmin without holding the private key itself.
 */
export type SubmitAsTokenAdmin = (opts: {
    commands: unknown
    synchronizerId: string
}) => Promise<unknown>

export interface AdminHandlers {
    setupTokenRules(): Promise<void>
    mintToken(body: { amount: string }): Promise<void>
}

// ── allocation-v1 ──────────────────────────────────────────────────────────

export interface AllocationHandlers {
    getAllocationTransferContext(
        path: { allocationId: string },
        body: GetChoiceContextRequest
    ): ChoiceContext | Promise<ChoiceContext>
    getAllocationWithdrawContext(
        path: { allocationId: string },
        body: GetChoiceContextRequest
    ): ChoiceContext | Promise<ChoiceContext>
    getAllocationCancelContext(
        path: { allocationId: string },
        body: GetChoiceContextRequest
    ): ChoiceContext | Promise<ChoiceContext>
}
