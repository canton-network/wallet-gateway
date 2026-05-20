// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { TokenStandardService } from '@canton-network/core-token-standard-service'
import { PartyId } from '@canton-network/core-types'
import { SDKErrorHandler } from '../../error/index.js'

export type AssetBody = {
    id: string
    displayName: string
    symbol: string
    registryUrl: URL
    admin: PartyId
}

export type AssetContext = {
    tokenStandardService: TokenStandardService
    registries: URL[]
    error: SDKErrorHandler
    list: AssetBody[]
}

export class AssetNamespace {
    constructor(private readonly ctx: AssetContext) {}

    public get list() {
        return this.ctx.list
    }

    public async find(id: string, registryUrl?: URL): Promise<AssetBody> {
        return await findAsset(this.list, id, this.ctx.error, registryUrl)
    }
}

export function findAsset(
    assets: AssetBody[],
    id: string,
    error: SDKErrorHandler,
    registryUrl?: URL
): AssetBody {
    const asset = registryUrl
        ? assets.filter((asset) => asset.id === id && asset.registryUrl)
        : assets.filter((asset) => asset.id === id)

    if (asset.length === 0) {
        error.throw({
            message: `Asset with id ${id} not found`,
            type: 'NotFound',
        })
    }

    if (asset.length > 1) {
        error.throw({
            message: 'Multiple assets found, please provide a registryUrl',
            type: 'Forbidden',
        })
    }
    return asset[0]
}
