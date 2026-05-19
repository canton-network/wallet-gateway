// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { OfflineSDKContext } from '../../../../../sdk.js'

export abstract class Encoder {
    constructor(protected readonly ctx: OfflineSDKContext) {}

    protected get emptyByte() {
        return new Uint8Array([0])
    }

    protected get existingByte() {
        return new Uint8Array([1])
    }

    protected sha256(message: string | Uint8Array) {
        const msg =
            typeof message === 'string'
                ? new TextEncoder().encode(message)
                : message

        return crypto.subtle
            .digest('SHA-256', new Uint8Array(msg))
            .then((hash) => new Uint8Array(hash))
    }

    protected concatBytes(...args: (number | Uint8Array)[]): Uint8Array {
        const normalizedArgs: Uint8Array[] = args.map((arg) => {
            if (typeof arg === 'number') {
                return new Uint8Array([arg])
            } else {
                return arg
            }
        })

        let totalLength = 0
        normalizedArgs.forEach((arg) => {
            totalLength += arg.length
        })

        const mergedArray = new Uint8Array(totalLength)
        let offset = 0

        normalizedArgs.forEach((arg) => {
            mergedArray.set(arg, offset)
            offset += arg.length
        })

        return mergedArray
    }
}
