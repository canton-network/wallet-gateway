// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { SDKContext } from '../../sdk.js'
import { TokenStandardService } from '@canton-network/core-token-standard-service'

export type URLInput = URL | string

export class ParsedURL extends URL {
    constructor(
        private readonly ctx: SDKContext,
        private readonly input: URLInput
    ) {
        try {
            super(input)
        } catch (e) {
            ctx.error.throw({
                message: `Invalid URL provided ${input}.`,
                type: 'BadRequest',
                originalError: e,
            })
        }
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
