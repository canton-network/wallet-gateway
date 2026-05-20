// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { Splice } from '@daml.js/token-standard-models-1.0.0'
import { PartyId } from '@canton-network/core-types'

export * from './interface-ids.const.js'

export const TransferInstructionV1 = Splice.Api.Token.TransferInstructionV1
export const AllocationInstructionV1 = Splice.Api.Token.AllocationInstructionV1
export const AllocationRequestV1 = Splice.Api.Token.AllocationRequestV1
export const AllocationV1 = Splice.Api.Token.AllocationV1
export const HoldingV1 = Splice.Api.Token.HoldingV1
export const MetadataV1 = Splice.Api.Token.MetadataV1

export type {
    Holding,
    HoldingView,
    Lock,
    InstrumentId,
    HoldingInterface,
} from '@daml.js/token-standard-models-1.0.0/lib/Splice/Api/Token/HoldingV1/module.js'

export type {
    Transfer,
    TransferInstruction,
    TransferInstructionView,
    TransferInstruction_Accept,
    TransferInstruction_Reject,
    TransferInstruction_Withdraw,
    TransferInstruction_Update,
    TransferFactory,
    TransferFactoryView,
    TransferFactory_PublicFetch,
    TransferFactory_Transfer,
    TransferInstructionResult,
    TransferInstructionResult_Output,
    TransferInstructionStatus,
    TransferFactoryInterface,
    TransferInstructionInterface,
} from '@daml.js/token-standard-models-1.0.0/lib/Splice/Api/Token/TransferInstructionV1/module.js'

export type {
    AllocationFactory_Allocate,
    AllocationFactoryView,
    AllocationFactory_PublicFetch,
    AllocationInstruction_Update,
    AllocationInstruction_Withdraw,
    AllocationInstructionView,
    AllocationInstructionResult,
    AllocationInstructionResult_Output,
    AllocationFactory,
    AllocationFactoryInterface,
    AllocationInstruction,
    AllocationInstructionInterface,
} from '@daml.js/token-standard-models-1.0.0/lib/Splice/Api/Token/AllocationInstructionV1/module.js'

export type {
    AllocationRequest,
    AllocationRequestView,
    AllocationRequest_Reject,
    AllocationRequest_Withdraw,
    AllocationRequestInterface,
} from '@daml.js/token-standard-models-1.0.0/lib/Splice/Api/Token/AllocationRequestV1/module.js'

export type {
    AllocationSpecification,
    TransferLeg,
    SettlementInfo,
    Reference,
    AllocationView,
    Allocation,
    AllocationInterface,
    Allocation_Withdraw,
    Allocation_Cancel,
    Allocation_ExecuteTransfer,
    Allocation_WithdrawResult,
    Allocation_CancelResult,
    Allocation_ExecuteTransferResult,
} from '@daml.js/token-standard-models-1.0.0/lib/Splice/Api/Token/AllocationV1/module.js'

export type {
    ExtraArgs,
    Metadata,
    ChoiceExecutionMetadata,
    AnyContract,
    AnyContractInterface,
    AnyContractView,
    ChoiceContext,
    AnyValue,
} from '@daml.js/token-standard-models-1.0.0/lib/Splice/Api/Token/MetadataV1/module.js'

export type Beneficiaries = {
    beneficiary: PartyId
    weight: number
}
