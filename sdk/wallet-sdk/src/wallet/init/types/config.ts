// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { TokenProviderConfig } from '@canton-network/core-wallet-auth'

export type AmuletConfig = {
    validatorUrl: URL
    scanApiUrl: URL
    auth: TokenProviderConfig
    registryUrl: URL
}

export type TokenConfig = {
    validatorUrl: URL
    auth: TokenProviderConfig
    registries: URL[]
}

export type AssetConfig = {
    auth: TokenProviderConfig
    registries: URL[]
}

export type EventsConfig = {
    websocketURL: URL
    auth: TokenProviderConfig
}
