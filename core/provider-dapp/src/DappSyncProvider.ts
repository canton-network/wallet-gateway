// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import SpliceWalletJSONRPCDAppAPI, {
    RpcTypes as DappRpcTypes,
} from '@canton-network/core-wallet-dapp-rpc-client'
import { AbstractProvider } from '@canton-network/core-splice-provider'
import { RequestArgs } from '@canton-network/core-types'
import {
    RpcTransport,
    WindowTransport,
} from '@canton-network/core-rpc-transport'

export class DappSyncProvider extends AbstractProvider<DappRpcTypes> {
    private client: SpliceWalletJSONRPCDAppAPI
    private unsubscribeEvents?: () => void

    constructor(transport?: RpcTransport) {
        super()
        const resolvedTransport = transport ?? new WindowTransport(window)
        this.client = new SpliceWalletJSONRPCDAppAPI(resolvedTransport)

        // Fork-only: see docs/fork-only-dapp-sync-event-channel.md.
        // The DappAsyncProvider (HTTP/SSE flow) wires wallet push events into
        // `AbstractProvider.emit` via the EventSource listeners in its
        // constructor. The Sync flow (postMessage) had no equivalent until
        // `RpcTransport.onEvent` was added, so dApps using @canton-network/
        // dapp-sdk against a CIP-103 browser extension never received
        // `txChanged`/`accountsChanged`/`statusChanged`/`connected` events —
        // including the `txChanged: executed` event needed to render a
        // submitted transaction in the UI. Forward those events here so
        // `DappClient.onTxChanged(...)` listeners fire as documented.
        if (resolvedTransport.onEvent) {
            this.unsubscribeEvents = resolvedTransport.onEvent(
                (event, payload) => {
                    this.emit(event, payload)
                }
            )
        }
    }

    public async request<M extends keyof DappRpcTypes>(
        args: RequestArgs<DappRpcTypes, M>
    ): Promise<DappRpcTypes[M]['result']> {
        return await this.client.request<M>(args)
    }

    /**
     * Release the transport-level event subscription. Idempotent.
     * Fork-only.
     */
    teardown(): void {
        this.unsubscribeEvents?.()
        delete this.unsubscribeEvents
    }
}
