// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { AllocationNamespace } from './allocation/index.js'
import { UtxoNamespace } from './utxos/index.js'
import { TransferNamespace } from './transfer/index.js'
import { TokenStandardService } from '@canton-network/core-token-standard-service'
import { PartyId } from '@canton-network/core-types'
import { PrettyTransactions } from '@canton-network/core-tx-parser'
import { SDKContext } from '../../sdk.js'
import { ParsedURL } from '../utils/url.js'

export type TokenNamespaceConfig = {
    tokenStandardService: TokenStandardService
    registryUrls: ParsedURL[]
    validatorParty: PartyId
    commonCtx: SDKContext
}

export class TokenNamespace {
    public readonly allocation: AllocationNamespace
    public readonly transfer: TransferNamespace
    public readonly utxos: UtxoNamespace
    constructor(private readonly tokenContext: TokenNamespaceConfig) {
        this.allocation = new AllocationNamespace(tokenContext)
        this.transfer = new TransferNamespace(tokenContext)
        this.utxos = new UtxoNamespace(tokenContext, this.transfer)
    }

    /**
     * Lists all holdings for a specified party
     * @returns A promise that resolves to an array of holdings
     */
    async holdings(params: {
        partyId: PartyId
        afterOffset?: number
        beforeOffset?: number
    }): Promise<PrettyTransactions> {
        return await this.tokenContext.tokenStandardService.listHoldingTransactions(
            params.partyId,
            params.afterOffset,
            params.beforeOffset
        )
    }

    /** Gets transaction info parsed in a way relevant to token standard transfer flows
     * @param updateId id of queried transaction
     * @param partyId for transaction
     * @returns A promise that resolves to a transaction
     */
    async transactionsById(params: { updateId: string; partyId: PartyId }) {
        return await this.tokenContext.tokenStandardService.getTransactionById(
            params.updateId,
            params.partyId
        )
    }
}
