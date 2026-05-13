// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { OfflineSDKContext } from '../../../../../sdk.js'
import { Encoder } from './encoder.js'
import { PrimitiveEncoder } from './primitiveEncoder.js'

const isUint8Array = (value: unknown): value is Uint8Array => {
    return value instanceof Uint8Array
}

export class CollectionEncoder extends Encoder {
    private readonly encodePrimitive: PrimitiveEncoder
    constructor(protected readonly ctx: OfflineSDKContext) {
        super(ctx)
        this.encodePrimitive = new PrimitiveEncoder(ctx)
    }

    private async identity(value: unknown) {
        if (!isUint8Array(value))
            this.ctx.error.throw({
                message:
                    'Cannot encode a value through identity which is not an Uint8Array',
                type: 'SDKOperationUnsupported',
            })

        return Promise.resolve(value)
    }

    private identitySync(value: unknown) {
        if (!isUint8Array(value))
            this.ctx.error.throw({
                message:
                    'Cannot encode a value through identity which is not an Uint8Array',
                type: 'SDKOperationUnsupported',
            })

        return value
    }

    public async repeated<T>(
        values: T[],
        encodeFn?: (value: T) => Promise<Uint8Array>
    ): Promise<Uint8Array> {
        const length = this.encodePrimitive.int32(values.length)
        const encode = encodeFn || this.identity
        const encodedValues = await Promise.all(values.map(encode))
        return this.concatBytes(length, ...encodedValues)
    }

    public repeatedSync<T>(
        values: T[],
        encodeFn?: (value: T) => Uint8Array
    ): Uint8Array {
        const length = this.encodePrimitive.int32(values.length)
        const encode = encodeFn || this.identitySync
        const encodedValues = values.map(encode)
        return this.concatBytes(length, ...encodedValues)
    }

    public async optional<T>(
        value: T | undefined | null,
        encodeFn?: (arg: T) => Promise<Uint8Array>
    ): Promise<Uint8Array> {
        if (value === undefined || value === null) {
            return this.emptyByte
        } else {
            const encode = encodeFn || this.identity
            return this.concatBytes(this.existingByte, await encode(value))
        }
    }

    public optionalSync<T>(
        value: T | undefined | null,
        encodeFn?: (arg: T) => Uint8Array
    ): Uint8Array {
        if (value === undefined || value === null) {
            return this.emptyByte
        } else {
            const encode = encodeFn || this.identitySync
            return this.concatBytes(this.existingByte, encode(value))
        }
    }
}
