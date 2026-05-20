// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { SDKContext } from '../../../sdk.js'
import { Ops } from '@canton-network/core-provider-ledger'

export class DarNamespace {
    constructor(private readonly sdkContext: SDKContext) {}

    // TODO (#1712): add checking of vetting state also for vetting on provided sync
    async upload(
        darBytes: Uint8Array | Buffer,
        packageId: string,
        synchronizerId?: string,
        vetAllPackages?: boolean
    ) {
        const isUploaded = await this.check(packageId)

        if (isUploaded) {
            this.sdkContext.logger.info(
                { packageId },
                'DAR already uploaded, skipping upload'
            )
            return
        }

        await this.sdkContext.ledgerProvider.request<Ops.PostV2Packages>({
            method: 'ledgerApi',
            params: {
                resource: '/v2/packages',
                requestMethod: 'post',
                query: {
                    ...(synchronizerId !== undefined && { synchronizerId }),
                    vetAllPackages: vetAllPackages ?? true,
                },
                body: darBytes as never,
                headers: { 'Content-Type': 'application/octet-stream' },
            },
        })
    }

    async check(packageId: string): Promise<boolean> {
        const result =
            await this.sdkContext.ledgerProvider.request<Ops.GetV2Packages>({
                method: 'ledgerApi',
                params: {
                    resource: '/v2/packages',
                    requestMethod: 'get',
                },
            })

        return (
            Array.isArray(result.packageIds) &&
            result.packageIds.includes(packageId)
        )
    }
}
