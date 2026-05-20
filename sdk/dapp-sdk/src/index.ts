// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

// Import global Window augmentation for `window.canton`
import '@canton-network/core-provider-dapp'

// ── Asset exports (icons for wallet adapters) ──
export { CANTON_LOGO_PNG, WALLET_GATEWAY_ICON } from './assets'

// ── Client API (primary) ──
export { DappClient } from './client'
export type { DappClientOptions } from './client'

// ── Adapter types and concrete adapters ──
export * from './adapter/index'

// ── Core DiscoveryClient for advanced use ──
export { DiscoveryClient } from '@canton-network/core-wallet-discovery'
export type {
    DiscoveryClientConfig,
    ActiveSession,
} from '@canton-network/core-wallet-discovery'

// ── Error types ──
export * from './error'

// ── Commonly used RPC types ──
export * as dappAPI from '@canton-network/core-wallet-dapp-rpc-client'
export type {
    StatusEvent,
    ConnectResult,
    PrepareExecuteParams,
    PrepareExecuteAndWaitResult,
    SignMessageParams,
    SignMessageResult,
    LedgerApiParams,
    LedgerApiResult,
    ListAccountsResult,
    AccountsChangedEvent,
    TxChangedEvent,
    Wallet,
    Session,
    Network,
} from '@canton-network/core-wallet-dapp-rpc-client'
export type { ProviderAdapterConfig } from '@canton-network/core-types'

// ── Module-level convenience API (default singleton DappClient) ──
export {
    DappSDK,
    sdk as dappSDK,
    init,
    connect,
    disconnect,
    isConnected,
    status,
    listAccounts,
    prepareExecute,
    prepareExecuteAndWait,
    ledgerApi,
    open,
    getConnectedProvider,
    onStatusChanged,
    onAccountsChanged,
    onConnected,
    onTxChanged,
    removeOnStatusChanged,
    removeOnAccountsChanged,
    removeOnConnected,
    removeOnTxChanged,
} from './sdk'
