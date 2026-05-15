// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { TokenStandardService } from '@canton-network/core-token-standard-service'
import { SDKErrorHandler } from './error/index.js'

export function toURL(input: string | URL, error: SDKErrorHandler): URL {
    let parsedUrl: URL
    try {
        parsedUrl = typeof input === 'string' ? new URL(input) : input
    } catch (e) {
        error.throw({
            message: `Invalid URL provided ${input}.`,
            type: 'BadRequest',
            originalError: e,
        })
    }

    return parsedUrl
}

export function parseAssets(
    assets: Awaited<ReturnType<TokenStandardService['registriesToAssets']>>,
    error: SDKErrorHandler
) {
    return assets.map((asset) => ({
        ...asset,
        registryUrl: toURL(asset.registryUrl, error),
    }))
}
