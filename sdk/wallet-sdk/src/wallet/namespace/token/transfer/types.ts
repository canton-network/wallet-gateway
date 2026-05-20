// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { PartyId } from '@canton-network/core-types'
import { Metadata } from '@canton-network/core-token-standard'

export type TransferParams = {
    sender: PartyId
    recipient: PartyId
    amount: string
    instrumentId: string
    registryUrl: URL
    inputUtxos?: string[]
    expirationDate?: Date
    meta?: Metadata
    memo?: string
}

export type TransferAllocationChoiceParams = {
    transferInstructionCid: string
    registryUrl: URL
}
