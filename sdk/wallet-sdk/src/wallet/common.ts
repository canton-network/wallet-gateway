// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

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
