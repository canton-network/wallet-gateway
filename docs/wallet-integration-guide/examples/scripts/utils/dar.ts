// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

// TODO: replace this function with the usage of built-in upload() function after the latter one
// is fixed to support vetting of uploaded package on multiple synchronizers (currently it only vets on the default synchronizer, which is not sufficient for multi-synchronizer setups)
export async function vetDar(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ledgerProvider: any,
    darBytes: Uint8Array | Buffer,
    synchronizerId: string
): Promise<void> {
    await ledgerProvider.request({
        method: 'ledgerApi',
        params: {
            resource: '/v2/packages',
            requestMethod: 'post',
            query: { synchronizerId, vetAllPackages: true },
            body: darBytes,
            headers: { 'Content-Type': 'application/octet-stream' },
        },
    })
}
