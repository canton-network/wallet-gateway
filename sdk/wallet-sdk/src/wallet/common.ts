// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { SDKErrorHandler } from './error/index.js'

/** Maps the two synchronizer roles used in multi-synchronizer setups. */
export type SynchronizerMap = {
    globalSynchronizerId: string
    appSynchronizerId: string
}

/**
 * Resolve the global synchronizer ID from the list returned by the ledger API.
 *
 * When a participant is connected to multiple synchronizers the ledger API may
 * return them in any order. This helper ensures the global synchronizer is
 * always selected — regardless of position — by looking for the entry whose
 * alias is `'global'`. If no such entry exists (e.g. single-synchronizer
 * setups) the first entry is returned as the default.
 *
 * Pass the returned ID as the explicit `synchronizerId` on `ledger.prepare()`
 * and `ledger.internal.prepare()` calls that must route to the global
 * synchronizer.
 *
 * @param synchronizers - Raw array from `GET /v2/state/connected-synchronizers`.
 * @returns The `synchronizerId` of the entry aliased `'global'`, or the first
 *          entry's `synchronizerId` when no global alias is present.
 * @throws {Error} When the array is empty.
 */
export function resolveGlobalSynchronizerId(
    synchronizers: Array<{ synchronizerAlias: string; synchronizerId: string }>
): string {
    const global =
        synchronizers.find((s) => s.synchronizerAlias === 'global') ??
        synchronizers[0]
    if (!global) throw new Error('No connected synchronizers found')
    return global.synchronizerId
}

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
