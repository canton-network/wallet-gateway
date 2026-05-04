// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

export * as v3_4 from './generated-clients/openapi-3.4.12.js'
export * as v3_5 from './generated-clients/openapi-3.5.1.js'
export * as v3_4_async from './generated-clients/asyncapi-3.4.12.js'
export * as v3_5_async from './generated-clients/asyncapi-3.5.1.js'
import * as V3_4_provider from './generated-clients/openapi-3.4.12-provider-types.js'
import * as V3_5_provider from './generated-clients/openapi-3.5.1-provider-types.js'
import * as openapi_v3_4 from './generated-clients/openapi-3.4.12.js'
import * as openapi_v3_5 from './generated-clients/openapi-3.5.1.js'
import * as asyncapi_v3_4 from './generated-clients/asyncapi-3.4.12.js'
import * as asyncapi_v3_5 from './generated-clients/asyncapi-3.5.1.js'
export * from './utils.js'

export const supportedLedgerApiVersions = ['3.4', '3.5'] as const
export type LedgerApiVersion = (typeof supportedLedgerApiVersions)[number]

export const supportedAsyncApiVersions = ['3.4', '3.5'] as const
export type AsyncApiVersion = (typeof supportedAsyncApiVersions)[number]

export const ledgerApiByVersion = {
    '3.4': openapi_v3_4,
    '3.5': openapi_v3_5,
} as const

export const asyncApiByVersion = {
    '3.4': asyncapi_v3_4,
    '3.5': asyncapi_v3_5,
} as const

export type LedgerSchemasByVersion = {
    '3.4': openapi_v3_4.components['schemas']
    '3.5': openapi_v3_5.components['schemas']
}

export type LedgerPathsByVersion = {
    '3.4': openapi_v3_4.paths
    '3.5': openapi_v3_5.paths
}

export type LedgerCommonSchemas = LedgerSchemasByVersion['3.4'] &
    LedgerSchemasByVersion['3.5']

export type LedgerCommonPaths = LedgerPathsByVersion['3.4'] &
    LedgerPathsByVersion['3.5']

export type AsyncChannelsByVersion = {
    '3.4': typeof asyncapi_v3_4.CHANNELS
    '3.5': typeof asyncapi_v3_5.CHANNELS
}

export type AsyncCommonChannels = AsyncChannelsByVersion['3.4'] &
    AsyncChannelsByVersion['3.5']

export type LedgerTypes = V3_4_provider.LedgerTypes | V3_5_provider.LedgerTypes
export * as Provider from './generated-clients/openapi-3.5.1-provider-types.js'
export { V3_4_provider as V3_4Provider, V3_5_provider as V3_5Provider }
