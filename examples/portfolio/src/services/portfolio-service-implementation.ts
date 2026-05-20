// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { v4 } from 'uuid'
import { PartyId } from '@canton-network/core-types'
import * as sdk from '@canton-network/dapp-sdk'
import {
    type Holding,
    type TransferInstructionView,
    type PrettyContract,
} from '@canton-network/core-tx-parser'
import {
    ALLOCATION_INSTRUCTION_INTERFACE_ID,
    ALLOCATION_INTERFACE_ID,
    ALLOCATION_REQUEST_INTERFACE_ID,
    HOLDING_INTERFACE_ID,
    TRANSFER_INSTRUCTION_INTERFACE_ID,
    type AllocationInstructionView,
    type AllocationRequestView,
    type AllocationSpecification,
    type AllocationView,
} from '@canton-network/core-token-standard'
import {
    resolveTokenStandardService,
    resolveTransactionHistoryService,
    resolveAmuletService,
} from './resolve'
import type {
    TransactionHistoryRequest,
    TransactionHistoryResponse,
} from './transaction-history-service'

// PortfolioService is a fat interface that tries to capture everything our
// portflio can do.  Separating the interface from the implementation will
// hopefully help us when we port the codebase to use web components instead
// of react.

export const listHoldings = async ({
    party,
}: {
    party: string
}): Promise<Holding[]> => {
    const tokenStandardService = await resolveTokenStandardService()

    // TODO: copy more from tokenStandardController
    const utxoContracts =
        await tokenStandardService.listContractsByInterface<Holding>(
            HOLDING_INTERFACE_ID,
            party
        )

    const uniqueContractIds = new Set<string>()
    const uniqueUtxos: Holding[] = []
    for (const utxo of utxoContracts) {
        if (!uniqueContractIds.has(utxo.contractId)) {
            uniqueContractIds.add(utxo.contractId)
            uniqueUtxos.push({
                ...utxo.interfaceViewValue,
                contractId: utxo.contractId,
            })
        }
    }

    return uniqueUtxos
}

export const createTransfer = async ({
    registryUrls,
    sender,
    receiver,
    instrumentId,
    amount,
    expiry,
    memo,
}: {
    registryUrls: ReadonlyMap<PartyId, string>
    sender: PartyId
    receiver: PartyId
    instrumentId: { admin: PartyId; id: string }
    amount: string
    expiry: Date
    memo?: string
}) => {
    const registryUrl = registryUrls.get(instrumentId.admin)
    if (!registryUrl)
        throw new Error(`no registry URL for admin ${instrumentId.admin}`)
    const tokenStandardService = await resolveTokenStandardService()

    const [transferCommand, disclosedContracts] =
        await tokenStandardService.transfer.createTransfer(
            sender,
            receiver,
            amount,
            instrumentId.admin,
            instrumentId.id,
            registryUrl,
            undefined, // inputUtxos
            memo,
            expiry, // expiryDate
            undefined, // Metadata
            undefined // prefetchedRegistryChoiceContext
        )

    const request = {
        commands: [{ ExerciseCommand: transferCommand }],
        commandId: v4(),
        actAs: [sender],
        disclosedContracts,
    }

    const provider = sdk.getConnectedProvider()
    // TODO: check success
    await provider?.request({
        method: 'prepareExecuteAndWait',
        params: request,
    })
}

export const exerciseTransfer = async ({
    registryUrls,
    party,
    contractId,
    instrumentId,
    instructionChoice,
}: {
    registryUrls: ReadonlyMap<PartyId, string>
    party: PartyId
    contractId: string
    instrumentId: { admin: string; id: string }
    instructionChoice: 'Accept' | 'Reject' | 'Withdraw'
}) => {
    // TODO: resolve this BEFORE calling this function so we can gray out the
    // button?
    const registryUrl = registryUrls.get(instrumentId.admin)
    if (!registryUrl)
        throw new Error(`no registry URL for admin ${instrumentId.admin}`)

    const tokenStandardService = await resolveTokenStandardService()
    const [acceptCommand, disclosedContracts] =
        await tokenStandardService.transfer.createTransferInstruction(
            contractId,
            registryUrl,
            instructionChoice
        )

    const request = {
        commands: [{ ExerciseCommand: acceptCommand }],
        commandId: v4(),
        actAs: [party],
        disclosedContracts,
    }

    const provider = sdk.getConnectedProvider()
    // TODO: check success
    await provider?.request({
        method: 'prepareExecuteAndWait',
        params: request,
    })
}

export const listPendingTransfers = async ({
    party,
}: {
    party: PartyId
}): Promise<PrettyContract<TransferInstructionView>[]> => {
    const tokenStandardService = await resolveTokenStandardService()
    return await tokenStandardService.listContractsByInterface<TransferInstructionView>(
        TRANSFER_INSTRUCTION_INTERFACE_ID,
        party
    )
}

export const listAllocationRequests = async ({
    party,
}: {
    party: PartyId
}): Promise<PrettyContract<AllocationRequestView>[]> => {
    const tokenStandardService = await resolveTokenStandardService()
    const contracts =
        await tokenStandardService.listContractsByInterface<AllocationRequestView>(
            ALLOCATION_REQUEST_INTERFACE_ID,
            party
        )
    return contracts
}

export const createAllocation = async ({
    registryUrls,
    party,
    allocationSpecification,
}: {
    registryUrls: ReadonlyMap<PartyId, string>
    party: PartyId
    allocationSpecification: AllocationSpecification
}): Promise<void> => {
    const { instrumentId } = allocationSpecification.transferLeg
    const registryUrl = registryUrls.get(instrumentId.admin)
    if (!registryUrl)
        throw new Error(`no registry URL for admin ${instrumentId.admin}`)
    const tokenStandardService = await resolveTokenStandardService()

    const [command, disclosedContracts] =
        await tokenStandardService.allocation.createAllocationInstruction(
            allocationSpecification,
            instrumentId.admin,
            registryUrl,
            undefined, // inputUtxos
            undefined // requestedAt
        )

    const request = {
        commands: [{ ExerciseCommand: command }],
        commandId: v4(),
        actAs: [party],
        disclosedContracts,
    }

    const provider = sdk.getConnectedProvider()
    // TODO: check success
    await provider?.request({
        method: 'prepareExecuteAndWait',
        params: request,
    })
}

export const listAllocations = async ({
    party,
}: {
    party: PartyId
}): Promise<PrettyContract<AllocationView>[]> => {
    const tokenStandardService = await resolveTokenStandardService()
    const contracts =
        await tokenStandardService.listContractsByInterface<AllocationView>(
            ALLOCATION_INTERFACE_ID,
            party
        )
    return contracts
}

export const withdrawAllocation = async ({
    registryUrls,
    party,
    contractId,
    instrumentId,
}: {
    registryUrls: ReadonlyMap<PartyId, string>
    party: PartyId
    contractId: string
    instrumentId: { admin: string; id: string }
}) => {
    // TODO: resolve this BEFORE calling this function so we can gray out the
    // button?
    const registryUrl = registryUrls.get(instrumentId.admin)
    if (!registryUrl)
        throw new Error(`no registry URL for admin ${instrumentId.admin}`)

    const tokenStandardService = await resolveTokenStandardService()
    const [acceptCommand, disclosedContracts] =
        await tokenStandardService.allocation.createWithdrawAllocation(
            contractId,
            registryUrl
        )

    const request = {
        commands: [{ ExerciseCommand: acceptCommand }],
        commandId: v4(),
        actAs: [party],
        disclosedContracts,
    }

    const provider = sdk.getConnectedProvider()
    // TODO: check success
    await provider?.request({
        method: 'prepareExecuteAndWait',
        params: request,
    })
}

export const listAllocationInstructions = async ({
    party,
}: {
    party: PartyId
}): Promise<PrettyContract<AllocationInstructionView>[]> => {
    const tokenStandardService = await resolveTokenStandardService()
    const contracts =
        await tokenStandardService.listContractsByInterface<AllocationInstructionView>(
            ALLOCATION_INSTRUCTION_INTERFACE_ID,
            party
        )
    return contracts
}

export const getTransactionHistory = async ({
    party,
    request,
}: {
    party: PartyId
    request: TransactionHistoryRequest
}): Promise<TransactionHistoryResponse> => {
    const transactionHistoryService = await resolveTransactionHistoryService({
        party,
    })
    return transactionHistoryService.query(request)
}

export const tap = async ({
    registryUrls,
    party,
    sessionToken,
    instrumentId,
    amount,
}: {
    registryUrls: ReadonlyMap<PartyId, string>
    party: string
    sessionToken: string
    instrumentId: { admin: string; id: string }
    amount: number
}) => {
    // TODO: resolve this BEFORE calling this function so we can gray out the
    // button?
    const registryUrl = registryUrls.get(instrumentId.admin)
    if (!registryUrl)
        throw new Error(`no registry URL for admin ${instrumentId.admin}`)

    const amuletService = await resolveAmuletService({
        sessionToken,
    })
    const [tapCommand, disclosedContracts] = await amuletService.createTap(
        party,
        `${amount}`,
        instrumentId.admin,
        instrumentId.id,
        registryUrl
    )

    const request = {
        commands: [{ ExerciseCommand: tapCommand }],
        commandId: v4(),
        actAs: [party],
        disclosedContracts,
    }

    const provider = sdk.getConnectedProvider()
    // TODO: check success
    await provider?.request({
        method: 'prepareExecuteAndWait',
        params: request,
    })
}

export const isDevNet = async ({
    sessionToken,
}: {
    sessionToken: string
}): Promise<boolean> => {
    const amuletService = await resolveAmuletService({ sessionToken })
    return await amuletService.isDevNet()
}
