// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { SDKContext } from '@/wallet/sdk'
import { TokenStandardService } from '@canton-network/core-token-standard-service'

export type URLInput = URL | string

export class ParsedURL {
    constructor(
        private readonly ctx: SDKContext,
        private readonly value: URLInput
    ) {}

    toURL() {
        try {
            return typeof this.value === 'string'
                ? new URL(this.value)
                : this.value
        } catch (e) {
            this.ctx.error.throw({
                message: `Invalid URL provided ${this.value}.`,
                type: 'BadRequest',
                originalError: e,
            })
        }
    }

    toString() {
        if (this.value instanceof URL) return this.value.href
        return this.value
    }
}

export function parseAssets(
    ctx: SDKContext,
    assets: Awaited<ReturnType<TokenStandardService['registriesToAssets']>>
) {
    return assets.map((asset) => ({
        ...asset,
        registryUrl: new ParsedURL(ctx, asset.registryUrl),
    }))
}
