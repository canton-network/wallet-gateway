// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import SpliceWalletJSONRPCRemoteDAppAPI, {
    RpcTypes as DappAsyncRpcTypes,
    Session,
} from '@canton-network/core-wallet-dapp-remote-rpc-client'
import { AbstractProvider } from '@canton-network/core-splice-provider'
import { HttpTransport } from '@canton-network/core-rpc-transport'
import {
    isSpliceMessageEvent,
    RequestArgs,
    WalletEvent,
} from '@canton-network/core-types'

// Maintain a global SSE connection in-memory to avoid multiple connections
// per DappAsyncProvider instance.
type GatewaySSE = {
    url: string
    token: string
    eventSource: EventSource
    listeners: Set<(event: string, args: unknown[]) => void>
} | null

let connection: GatewaySSE = null

function parseSSEData(data: string): unknown[] {
    try {
        const parsed = JSON.parse(data)
        return Array.isArray(parsed) ? parsed : [parsed]
    } catch {
        return [data]
    }
}

export class DappAsyncProvider extends AbstractProvider<DappAsyncRpcTypes> {
    private sessionToken?: string
    private client: SpliceWalletJSONRPCRemoteDAppAPI
    private status?: Session | undefined
    private readonly sseForwarder = (event: string, args: unknown[]) => {
        this.emit(event, ...args)
    }

    private createClient(
        sessionToken?: string
    ): SpliceWalletJSONRPCRemoteDAppAPI {
        const transport = new HttpTransport(this.url, sessionToken)
        return new SpliceWalletJSONRPCRemoteDAppAPI(transport)
    }

    private openSSE(url: URL, token: string): void {
        const sseUrl = new URL('events', url.toString().replace(/\/?$/, '/'))
        sseUrl.searchParams.set('token', token)
        const sseUrlString = sseUrl.toString()

        // Reconnect if the URL or token has changed
        if (
            connection &&
            (token !== connection.token || sseUrlString !== connection.url)
        ) {
            connection.eventSource.close()
            connection = null
        }

        if (!connection) {
            const eventSource = new EventSource(sseUrlString)
            const dispatchToProviders =
                (eventName: string) => (event: MessageEvent) => {
                    const args = parseSSEData(event.data)
                    connection?.listeners.forEach((listener) => {
                        listener(eventName, args)
                    })
                }

            eventSource.onmessage = dispatchToProviders('message')

            eventSource.addEventListener(
                'accountsChanged',
                dispatchToProviders('accountsChanged')
            )
            eventSource.addEventListener(
                'statusChanged',
                dispatchToProviders('statusChanged')
            )
            eventSource.addEventListener(
                'connected',
                dispatchToProviders('connected')
            )
            eventSource.addEventListener(
                'txChanged',
                dispatchToProviders('txChanged')
            )

            eventSource.onerror = () => {
                if (connection?.url === sseUrlString) {
                    connection.eventSource.close()
                    connection = null
                }
            }

            connection = {
                eventSource,
                url: sseUrlString,
                token,
                listeners: new Set(),
            }
        }

        connection.listeners.add(this.sseForwarder)
    }

    constructor(
        private url: URL,
        sessionToken?: string
    ) {
        super()

        if (sessionToken) {
            this.sessionToken = sessionToken
            this.openSSE(url, sessionToken)
        }

        this.client = this.createClient(sessionToken)

        // Listen for the auth success event sent from the WK UI popup to the SDK running in the parent window.
        window.addEventListener('message', async (event) => {
            if (!isSpliceMessageEvent(event)) return

            if (
                event.data.type === WalletEvent.SPLICE_WALLET_IDP_AUTH_SUCCESS
            ) {
                this.sessionToken = event.data.token
                this.client = this.createClient(this.sessionToken)
                this.openSSE(this.url, event.data.token)

                // We requery the status explicitly here, as it's not guaranteed that the socket will be open & authenticated
                // before the `statusChanged` event is fired from the `addSession` RPC call. The dappApi.StatusResult and
                // dappApi.StatusEvent are mapped manually to avoid dependency.
                this.request({ method: 'status' })
                    .then((status) => {
                        //for some reason comparing the objects directly dosent work as intended
                        if (
                            // TODO this is not ideal as it's possible for same object to have different keys order after stringify
                            JSON.stringify(status.session) !==
                            JSON.stringify(this.status)
                        ) {
                            this.emit('statusChanged', status)
                            this.status = status.session
                        }
                    })
                    .catch((err) => {
                        console.error(
                            'Error requesting status after auth:',
                            err
                        )
                    })
            }
        })
    }

    public async request<M extends keyof DappAsyncRpcTypes>(
        args: RequestArgs<DappAsyncRpcTypes, M>
    ): Promise<DappAsyncRpcTypes[M]['result']> {
        return await this.client.request<M>(args)
    }
}
