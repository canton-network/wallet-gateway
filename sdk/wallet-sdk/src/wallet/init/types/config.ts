// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { TokenProviderConfig } from '@canton-network/core-wallet-auth'

export type AmuletConfig = {
    validatorUrl: string | URL
    scanApiUrl: string | URL
    auth: TokenProviderConfig
    registryUrl: URL
}

export type TokenConfig = {
    auth: TokenProviderConfig
    registries: URL[] | string[]
}

export type TokenConfigExtended = {
    validatorUrl: string | URL
    auth: TokenProviderConfig
    registries: URL[] | string[]
}

export type AssetConfig = {
    auth: TokenProviderConfig
    registries: URL[]
}

export type EventsConfig = {
    websocketURL: string
    auth: TokenProviderConfig
}
