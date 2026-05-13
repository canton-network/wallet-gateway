// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { HashNamespace } from './hash/service.js'
import { PingService } from './ping/index.js'

import { OfflineSDKContext } from '../../sdk.js'

export class SDKUtilsNamespace {
    public readonly ping: PingService
    public readonly hash: HashNamespace
    constructor(ctx: OfflineSDKContext) {
        this.ping = new PingService()
        this.hash = new HashNamespace(ctx)
    }
}
