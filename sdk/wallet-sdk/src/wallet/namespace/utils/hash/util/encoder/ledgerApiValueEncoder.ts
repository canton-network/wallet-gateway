// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { Encoder } from './encoder.js'
import { PrimitiveEncoder } from './primitiveEncoder.js'
import { OfflineSDKContext } from '../../../../../sdk.js'
import { Identifier, Value } from '@canton-network/core-ledger-proto'
import { CollectionEncoder } from './collectionEncoder.js'
import { ArgValueOneOfKind } from './types.js'

type ArgValueOf<T extends NonNullable<Value['sum']['oneofKind']>> =
    ArgValueOneOfKind<Value['sum'], T>

export class LedgerApiValueEncoder extends Encoder {
    private readonly encodePrimitive: PrimitiveEncoder
    private readonly encodeCollection: CollectionEncoder
    constructor(protected ctx: OfflineSDKContext) {
        super(ctx)
        this.encodePrimitive = new PrimitiveEncoder(ctx)
        this.encodeCollection = new CollectionEncoder(ctx)
    }

    private readonly unit = (): Uint8Array => {
        return new Uint8Array([0x00])
    }

    private readonly bool = (value: ArgValueOf<'bool'>): Uint8Array => {
        return this.concatBytes(0x01, this.encodePrimitive.bool(value))
    }

    private readonly int64 = (value: ArgValueOf<'int64'>): Uint8Array => {
        const encodedValue = BigInt(value)
        return this.concatBytes(0x02, this.encodePrimitive.int64(encodedValue))
    }

    private readonly numeric = (value: ArgValueOf<'numeric'>): Uint8Array => {
        return this.concatBytes(0x03, this.encodePrimitive.string(value))
    }

    private readonly timestamp = (
        value: ArgValueOf<'timestamp'>
    ): Uint8Array => {
        const encodedValue = BigInt(value)
        return this.concatBytes(0x04, this.encodePrimitive.int64(encodedValue))
    }

    private readonly date = (value: ArgValueOf<'date'>): Uint8Array => {
        return this.concatBytes(0x05, this.encodePrimitive.int32(value))
    }

    private readonly party = (value: ArgValueOf<'party'>): Uint8Array => {
        return this.concatBytes(0x06, this.encodePrimitive.string(value))
    }

    private readonly text = (value: ArgValueOf<'text'>): Uint8Array => {
        return this.concatBytes(0x07, this.encodePrimitive.string(value))
    }

    /**
     * @param value - It should be of type {@link HexString}
     */
    public readonly contractId = (
        value: ArgValueOf<'contractId'>
    ): Uint8Array => {
        return this.concatBytes(0x08, this.encodePrimitive.hexString(value))
    }

    private readonly optional = (value: ArgValueOf<'optional'>): Uint8Array => {
        return this.concatBytes(
            0x09,
            this.encodeCollection.optionalSync(value?.value, this.value)
        )
    }

    private readonly list = (value: ArgValueOf<'list'>): Uint8Array => {
        return this.concatBytes(
            0x0a,
            this.encodeCollection.repeatedSync(value.elements, this.value)
        )
    }

    private readonly textMapEntry = (
        value: ArgValueOf<'textMap'>['entries'][number]
    ): Uint8Array => {
        return this.concatBytes(
            this.encodePrimitive.string(value.key),
            this.value(value.value)
        )
    }

    private readonly textMap = (value: ArgValueOf<'textMap'>): Uint8Array => {
        return this.concatBytes(
            0x0b,
            this.encodeCollection.repeatedSync(value.entries, this.textMapEntry)
        )
    }

    private readonly recordField = (
        value: ArgValueOf<'record'>['fields'][number]
    ): Uint8Array => {
        return this.concatBytes(
            this.encodeCollection.optionalSync(
                value.label,
                this.encodePrimitive.string
            ),
            this.value(value.value)
        )
    }

    private readonly record = (value: ArgValueOf<'record'>): Uint8Array => {
        return this.concatBytes(
            0x0c,
            this.encodeCollection.optionalSync(value.recordId, this.identifier),
            this.encodeCollection.repeatedSync(value.fields, this.recordField)
        )
    }

    private readonly variant = (value: ArgValueOf<'variant'>): Uint8Array => {
        return this.concatBytes(
            0x0d,
            this.encodeCollection.optionalSync(
                value.variantId,
                this.identifier
            ),
            this.encodePrimitive.string(value.constructor),
            this.value(value.value)
        )
    }

    private readonly enum = (value: ArgValueOf<'enum'>): Uint8Array => {
        return this.concatBytes(
            0x0e,
            this.encodeCollection.optionalSync(value.enumId, this.identifier),
            this.encodePrimitive.string(value.constructor)
        )
    }

    private readonly genMapEntry = (
        value: ArgValueOf<'genMap'>['entries'][number]
    ): Uint8Array => {
        return this.concatBytes(this.value(value.key), this.value(value.value))
    }

    private readonly genMap = (value: ArgValueOf<'genMap'>): Uint8Array => {
        return this.concatBytes(
            0x0f,
            this.encodeCollection.repeatedSync(value.entries, this.genMapEntry)
        )
    }

    public readonly identifier = (value: Identifier): Uint8Array => {
        const encodedPackageId = this.encodePrimitive.string(value.packageId)
        const encodedModuleName = this.encodeCollection.repeatedSync(
            value.moduleName.split('.'),
            this.encodePrimitive.string
        )
        const encodedEntityName = this.encodeCollection.repeatedSync(
            value.entityName.split('.'),
            this.encodePrimitive.string
        )
        return this.concatBytes(
            encodedPackageId,
            encodedModuleName,
            encodedEntityName
        )
    }

    public readonly value = (value: Value | undefined): Uint8Array => {
        if (!value || value.sum.oneofKind === undefined) return this.emptyByte

        const { oneofKind, ...rest } = value.sum

        if (!(oneofKind in rest))
            this.ctx.error.throw({
                message: 'Wrong data structure input',
                type: 'CantonError',
            })

        const argValue = rest[oneofKind as keyof typeof rest]
        const method = this[oneofKind]

        return method(argValue)
    }
}
