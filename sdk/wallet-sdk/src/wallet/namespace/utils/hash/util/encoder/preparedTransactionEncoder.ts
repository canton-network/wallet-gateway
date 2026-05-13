// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { PreparedTransaction } from '@canton-network/core-ledger-proto'
import { Encoder } from './encoder.js'
import { HashEncoder } from './types.js'
import { TransactionEncoder } from './transactionEncoder.js'
import { MetadataEncoder } from './metadataEncoder.js'
import { OfflineSDKContext } from '../../../../../sdk.js'
import {
    HASHING_SCHEME_VERSION,
    PREPARED_TRANSACTION_HASH_PURPOSE,
} from '../const.js'
import { Converter } from '../../converter.js'

export class PreparedTransactionEncoder
    extends Encoder
    implements HashEncoder<PreparedTransaction>
{
    private readonly encodeTransaction: TransactionEncoder
    private readonly encodeMetadata: MetadataEncoder
    constructor(protected readonly ctx: OfflineSDKContext) {
        super(ctx)
        this.encodeTransaction = new TransactionEncoder(ctx)
        this.encodeMetadata = new MetadataEncoder(ctx)
    }

    private async encode(value: PreparedTransaction) {
        if (!value.transaction || !value.metadata)
            this.ctx.error.throw({
                message: 'Daml transaction data is undefined',
                type: 'Unexpected',
            })

        return this.concatBytes(
            PREPARED_TRANSACTION_HASH_PURPOSE,
            HASHING_SCHEME_VERSION,
            await this.encodeTransaction.hash(value.transaction),
            await this.encodeMetadata.hash(value.metadata)
        )
    }

    private decodePreparedTransaction(preparedTransaction: string) {
        const binaryString = atob(preparedTransaction)
        const len = binaryString.length
        const bytes = new Uint8Array(len)
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i)
        }
        return PreparedTransaction.fromBinary(bytes)
    }

    public async hash(value: string | PreparedTransaction) {
        const preparedTransaction =
            typeof value === 'string'
                ? this.decodePreparedTransaction(value)
                : value

        return new Converter(
            await this.sha256(await this.encode(preparedTransaction))
        )
    }
}
