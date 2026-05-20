// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { SDKLogger } from '../logger/index.js'
import {
    EXTENDED_SDK_OPTION_KEYS,
    ExtendedSDKOptions,
    SDKContext,
} from '../sdk.js'

export abstract class SDKPlugin {
    protected readonly logger: ReturnType<SDKLogger['child']>

    constructor(
        public readonly name: string,
        protected readonly ctx: SDKContext
    ) {
        if (EXTENDED_SDK_OPTION_KEYS.includes(name as keyof ExtendedSDKOptions))
            throw Error(
                `Name ${name} is reserved and cannot be used to register the plugin. Reserved names: ${EXTENDED_SDK_OPTION_KEYS.join(', ')}.`
            )

        this.logger = ctx.logger.child({
            plugin: name,
        })
    }
}
