// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import {
    AbstractLedgerProvider,
    Ops,
} from '@canton-network/core-provider-ledger'

/**
 * Vet a DAR package on a specific synchronizer.
 *
 * Unlike {@link DarNamespace.upload}, this function always POSTs the DAR to
 * the ledger API regardless of whether the package bytes have already been
 * uploaded on another synchronizer. The server deduplicates the binary
 * payload, but a POST is required for each synchronizer that should have the
 * package vetted. Use this when the same package must be available on multiple
 * synchronizers (e.g. global + app-synchronizer in a multi-synchronizer setup).
 *
 * Typical usage pattern:
 *   1. Upload the DAR on the primary synchronizer with `sdk.ledger.dar.upload`.
 *   2. Call `vetPackage` for each additional synchronizer that needs vetting.
 *
 * @param ledgerProvider - The ledger provider for the target participant node.
 *   Obtain via `(sdk.ledger as any).sdkContext.ledgerProvider`.
 * @param darBytes - Raw DAR file bytes.
 * @param synchronizerId - The synchronizer on which the package should be vetted.
 * @param vetAllPackages - When true (default) all packages inside the DAR are
 *   vetted, not only the main dalf. Matches the behaviour of `dar.upload`.
 */
export async function vetPackage(
    ledgerProvider: AbstractLedgerProvider,
    darBytes: Uint8Array | Buffer,
    synchronizerId: string,
    vetAllPackages = true
): Promise<void> {
    await ledgerProvider.request<Ops.PostV2Packages>({
        method: 'ledgerApi',
        params: {
            resource: '/v2/packages',
            requestMethod: 'post',
            query: { synchronizerId, vetAllPackages },
            body: darBytes as never,
            headers: { 'Content-Type': 'application/octet-stream' },
        },
    })
}
