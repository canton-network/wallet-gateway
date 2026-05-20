// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { TokenProviderConfig } from '@canton-network/core-wallet-auth'
import { AllowedLogAdapters } from '../../logger/types.js'
import { KeysNamespace } from '../../namespace/keys/index.js'
import { LedgerNamespace } from '../../namespace/ledger/index.js'
import { PartyNamespace } from '../../namespace/party/index.js'
import { UserNamespace } from '../../namespace/user/index.js'
import { SDKUtilsNamespace } from '../../namespace/utils/index.js'
import { AmuletNamespace } from '../../namespace/amulet/namespace.js'
import { AssetNamespace, SDKContext, TokenNamespace } from '../../sdk.js'
import { EventsNamespace } from '../../namespace/events/namespace.js'
import {
    AmuletConfig,
    AssetConfig,
    EventsConfig,
    TokenConfig,
} from './config.js'
import { Provider } from '@canton-network/core-splice-provider'
import { LedgerTypes } from '@canton-network/core-ledger-client-types'
import { SDKPlugin } from '../plugin.js'

// SDK OPTIONS

/**
 * Options for configuring the Wallet SDK instance.
 *
 * @property logAdapter Optional. Specifies which logging adapter to use for SDK logs.
 *   Allows integration with different logging backends (e.g., 'console', 'pino', or a custom adapter - see {@link CustomLogAdapter}).
 *   If not provided, a default adapter (pino) is used. This enables customization of log output and integration
 *   with application-wide logging strategies.
 */
export type BasicSDKOptions<L extends LedgerTypes> = Readonly<
    {
        websocketUrl?: string | URL // default to same host as ledgerClientUrl with ws protocol
        logAdapter?: AllowedLogAdapters
    } & (
        | { auth: TokenProviderConfig; ledgerClientUrl: string | URL }
        | { ledgerProvider: Provider<L> }
    )
>

export const EXTENDED_SDK_OPTION_KEYS = [
    'amulet',
    'token',
    'asset',
    'events',
] as const

type EnforceKeys<
    K extends PropertyKey,
    T extends { [P in K | keyof T]: P extends K ? unknown : never },
> = T

export type ExtendedSDKOptions = EnforceKeys<
    (typeof EXTENDED_SDK_OPTION_KEYS)[number],
    Readonly<{
        amulet: AmuletConfig
        token: TokenConfig
        asset: AssetConfig
        events: EventsConfig
    }>
>

export type SDKOptions<ExtendedItems extends keyof ExtendedSDKOptions = never> =
    BasicSDKOptions<LedgerTypes> & Pick<ExtendedSDKOptions, ExtendedItems>

// Helper type to extract which extended options are present in an options object
export type GetExtendedKeys<T> = {
    [K in keyof ExtendedSDKOptions]: K extends keyof T
        ? undefined extends T[K]
            ? never
            : K
        : never
}[keyof ExtendedSDKOptions]

// SDK INTERFACE

export type BasicSDKInterface<
    CurrentlyExtended extends keyof ExtendedSDKOptions = never,
> = Readonly<{
    keys: KeysNamespace
    ledger: LedgerNamespace
    party: PartyNamespace
    user: UserNamespace
    utils: SDKUtilsNamespace
    extend: <ExtendedItems extends keyof ExtendedSDKOptions>(
        config: Pick<ExtendedSDKOptions, ExtendedItems>
    ) => Promise<SDKInterface<ExtendedItems | CurrentlyExtended>>
    registerPlugins: <
        P extends Record<string, new (ctx: SDKContext) => SDKPlugin>,
    >(
        plugins: P
    ) => BasicSDKInterface<CurrentlyExtended> & RegisteredPlugins<P>
}>

export type ExtendedFullSDKInterface = Readonly<{
    amulet: AmuletNamespace
    token: TokenNamespace
    asset: AssetNamespace
    events: EventsNamespace
}>

export type NullableExtendedFullSDKInterface = {
    [K in keyof ExtendedFullSDKInterface]: ExtendedFullSDKInterface[K] | null
}

export type ExtendedSDKInterface<
    ExtendedItems extends keyof ExtendedSDKOptions,
> = {
    [K in keyof Pick<
        ExtendedSDKOptions,
        ExtendedItems
    >]: ExtendedFullSDKInterface[K]
} & {
    extend: <NewExtendedItems extends keyof ExtendedSDKOptions>(
        config: Pick<ExtendedSDKOptions, NewExtendedItems>
    ) => Promise<SDKInterface<NewExtendedItems | ExtendedItems>>
}

export type SDKInterface<
    ExtendedItems extends keyof ExtendedFullSDKInterface = never,
> = BasicSDKInterface<ExtendedItems> & ExtendedSDKInterface<ExtendedItems>

export type OfflineSDKInterface = Readonly<{
    keys: KeysNamespace
    utils: SDKUtilsNamespace
}>

// PLUGINS

export type RegisteredPlugins<
    P extends Record<string, new (ctx: SDKContext) => SDKPlugin> = Record<
        string,
        new (ctx: SDKContext) => SDKPlugin
    >,
> = {
    [K in keyof P]: InstanceType<P[K]>
}
