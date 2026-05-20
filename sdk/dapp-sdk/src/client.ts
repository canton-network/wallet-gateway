// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import type {
    Provider,
    EventListener,
} from '@canton-network/core-splice-provider'
import { WalletEvent, type SpliceMessage } from '@canton-network/core-types'
import type {
    AccountsChangedEvent,
    ConnectResult,
    RpcTypes as DappRpcTypes,
    LedgerApiParams,
    LedgerApiResult,
    ListAccountsResult,
    MessageSignatureEvent,
    PrepareExecuteAndWaitResult,
    PrepareExecuteParams,
    ProviderType,
    SignMessageParams,
    SignMessageResult,
    StatusEvent,
    TxChangedEvent,
} from '@canton-network/core-wallet-dapp-rpc-client'
import { popup } from '@canton-network/core-wallet-ui-components'
import { clearAllLocalState } from './util'

export interface DappClientOptions {
    /** Provider type hint — affects `open()` routing. Defaults to `'remote'`. */
    providerType?: ProviderType | undefined
    /** Optional routing key for extension open messages. */
    target?: string | undefined
}

/**
 * DappClient is a thin convenience wrapper around a connected
 * `Provider<DappRpcTypes>`.
 *
 * It exposes typed RPC helpers, event subscription shortcuts,
 * and session-persistence listeners.
 *
 * How to obtain a provider is **not** this class's concern.
 * Use `DiscoveryClient` + the wallet picker, or construct any
 * `Provider<DappRpcTypes>` directly — then pass it here.
 */
export class DappClient {
    private provider: Provider<DappRpcTypes>
    private options: DappClientOptions

    constructor(
        provider: Provider<DappRpcTypes>,
        options: DappClientOptions = {}
    ) {
        this.provider = provider
        this.options = options
    }

    // ── Provider access ───────────────────────────────────

    getProvider(): Provider<DappRpcTypes> {
        return this.provider
    }

    // ── RPC convenience methods ────────────────────────────

    async connect(): Promise<ConnectResult> {
        return this.provider.request({ method: 'connect' })
    }

    async status(): Promise<StatusEvent> {
        return this.provider.request({ method: 'status' })
    }

    async listAccounts(): Promise<ListAccountsResult> {
        return this.provider.request({ method: 'listAccounts' })
    }

    async prepareExecute(params: PrepareExecuteParams): Promise<null> {
        return this.provider.request({ method: 'prepareExecute', params })
    }

    async prepareExecuteAndWait(
        params: PrepareExecuteParams
    ): Promise<PrepareExecuteAndWaitResult> {
        return this.provider.request({
            method: 'prepareExecuteAndWait',
            params,
        })
    }

    async signMessage(params: SignMessageParams): Promise<SignMessageResult> {
        return this.provider.request({ method: 'signMessage', params })
    }

    async ledgerApi(params: LedgerApiParams): Promise<LedgerApiResult> {
        return this.provider.request({ method: 'ledgerApi', params })
    }

    // ── Event convenience methods ──────────────────────────

    onStatusChanged(listener: EventListener<StatusEvent>): void {
        this.provider.on<StatusEvent>('statusChanged', listener)
    }

    onAccountsChanged(listener: EventListener<AccountsChangedEvent>): void {
        this.provider.on<AccountsChangedEvent>('accountsChanged', listener)
    }

    onConnected(listener: EventListener<StatusEvent>): void {
        this.provider.on<StatusEvent>('connected', listener)
    }

    onTxChanged(listener: EventListener<TxChangedEvent>): void {
        this.provider.on<TxChangedEvent>('txChanged', listener)
    }

    onMessageSignature(listener: EventListener<MessageSignatureEvent>): void {
        this.provider.on<MessageSignatureEvent>('messageSignature', listener)
    }

    removeOnStatusChanged(listener: EventListener<StatusEvent>): void {
        this.provider.removeListener<StatusEvent>('statusChanged', listener)
    }

    removeOnAccountsChanged(
        listener: EventListener<AccountsChangedEvent>
    ): void {
        this.provider.removeListener<AccountsChangedEvent>(
            'accountsChanged',
            listener
        )
    }

    removeOnConnected(listener: EventListener<StatusEvent>): void {
        this.provider.removeListener<StatusEvent>('connected', listener)
    }

    removeOnTxChanged(listener: EventListener<TxChangedEvent>): void {
        this.provider.removeListener<TxChangedEvent>('txChanged', listener)
    }

    removeOnMessageSignature(
        listener: EventListener<MessageSignatureEvent>
    ): void {
        this.provider.removeListener<MessageSignatureEvent>(
            'messageSignature',
            listener
        )
    }

    // ── Open wallet UI ─────────────────────────────────────

    async open(): Promise<void> {
        const statusResult = await this.status()
        const userUrl = statusResult.provider.userUrl
        if (!userUrl) throw new Error('User URL not found in status')

        if (this.options.providerType === 'browser') {
            window.postMessage(
                {
                    type: WalletEvent.SPLICE_WALLET_EXT_OPEN,
                    url: userUrl,
                    target: this.options.target,
                } as SpliceMessage,
                '*'
            )
        } else {
            popup.open(userUrl)
        }
    }

    // ── Disconnect ────────────────────────────────────────

    async disconnect(): Promise<void> {
        try {
            await this.provider.request({ method: 'disconnect' })
        } finally {
            clearAllLocalState({ closePopup: true })
        }
    }

    async isConnected(): Promise<ConnectResult> {
        return this.provider.request({ method: 'isConnected' })
    }
}
