// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { PreparedTransaction } from '@canton-network/core-ledger-proto'
import { OfflineSDKContext } from '../../../sdk.js'
import { PreparedTransactionEncoder } from './util/encoder/preparedTransactionEncoder.js'
import {
    computeMultiHashForTopology,
    computeSha256CantonHash,
} from '@canton-network/core-tx-visualizer'

export class HashNamespace {
    private readonly encodePreparedTransaction: PreparedTransactionEncoder
    constructor(private readonly ctx: OfflineSDKContext) {
        this.encodePreparedTransaction = new PreparedTransactionEncoder(ctx)
    }

    public async preparedTransacation(value: PreparedTransaction | string) {
        return await this.encodePreparedTransaction.hash(value)
    }

    /**
     *
     * @param preparedTransactions list of prepared topology transactions
     * @returns a multihash combining all of the topology txs
     */
    public async topologyTransaction(
        preparedTransactions: Uint8Array<ArrayBufferLike>[] | string[]
    ) {
        let normalized: Uint8Array<ArrayBufferLike>[]
        if (typeof preparedTransactions[0] === 'string') {
            normalized = (preparedTransactions as string[]).map((tx) =>
                Buffer.from(tx, 'base64')
            )
        } else {
            normalized = preparedTransactions as Uint8Array<ArrayBufferLike>[]
        }

        // Prepending the hash purpose for TopologyTransactionSignature and MultiTopologyTransaction
        // https://github.com/hyperledger-labs/splice/blob/53738545af6d0714bddff54c3309ecf2fe6d1881/canton/community/base/src/main/scala/com/digitalasset/canton/crypto/HashPurpose.scala#L47
        const rawHashes = await Promise.all(
            normalized.map((tx) => computeSha256CantonHash(11, tx))
        )
        const combinedHashes = await computeMultiHashForTopology(rawHashes)

        const computedHash = await computeSha256CantonHash(55, combinedHashes)

        return Buffer.from(computedHash).toString('base64')
    }
}
