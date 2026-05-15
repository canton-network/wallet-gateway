// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { v4 as uuidv4 } from 'uuid'
import {
    RequestPayload,
    ResponsePayload,
    JsonRpcRequest,
    SpliceMessage,
    WalletEvent,
    isSpliceMessageEvent,
    SuccessResponse,
    ErrorResponse,
    JsonRpcResponse,
} from '@canton-network/core-types'

export const jsonRpcRequest = (
    id: string | number | null,
    payload: RequestPayload
): JsonRpcRequest => {
    return {
        jsonrpc: '2.0',
        id, // id should be set based on the request context
        ...payload,
    }
}

export const jsonRpcResponse = (
    id: string | number | null,
    payload: ResponsePayload
): JsonRpcResponse => {
    return {
        jsonrpc: '2.0',
        id, // id should be set based on the request context
        ...payload,
    }
}

/**
 * Handler invoked when the transport receives a wallet push event.
 * `event` is the CIP-103 event name (e.g. 'txChanged'); `payload` is the
 * event payload as described in the OpenRPC schema for that event.
 *
 * Fork-only: see docs/fork-only-dapp-sync-event-channel.md.
 */
export type TransportEventHandler = (event: string, payload: unknown) => void

export interface RpcTransport {
    submit: (payload: RequestPayload) => Promise<ResponsePayload>
    /**
     * Optional push-event subscription. Transports that surface wallet events
     * out-of-band (e.g. WindowTransport's SPLICE_WALLET_EVENT frames; HTTP/SSE
     * transports' EventSource stream) implement this; callers should treat the
     * absence of `onEvent` as "no push channel — poll the event methods".
     *
     * Returns an unsubscribe function. Fork-only.
     */
    onEvent?: (handler: TransportEventHandler) => () => void
}

export type WindowTransportOptions = {
    /**
     * Optional routing key for browser-extension messaging. When set, extensions
     * should ignore messages that do not match their own identifier.
     */
    target?: string | undefined
}

export class WindowTransport implements RpcTransport {
    // Lazily-installed listener that fans SPLICE_WALLET_EVENT frames out to
    // every onEvent subscriber. We attach at most one window listener per
    // transport instance to avoid leaking N listeners across N subscribers.
    private eventListeners: Set<TransportEventHandler> = new Set()
    private eventDispatcherInstalled = false

    constructor(
        private win: Window,
        private options: WindowTransportOptions = {}
    ) {}

    submit = async (payload: RequestPayload) => {
        const message: SpliceMessage = {
            request: jsonRpcRequest(uuidv4(), payload),
            type: WalletEvent.SPLICE_WALLET_REQUEST,
            target: this.options.target,
        }

        this.win.postMessage(message, '*')

        return new Promise<SuccessResponse>((resolve, reject) => {
            const listener = (event: MessageEvent) => {
                if (
                    !isSpliceMessageEvent(event) ||
                    event.data.type !== WalletEvent.SPLICE_WALLET_RESPONSE ||
                    event.data.response.id !== message.request.id
                ) {
                    return
                }

                window.removeEventListener('message', listener)
                if ('error' in event.data.response) {
                    reject(event.data.response.error)
                } else {
                    resolve(event.data.response)
                }
            }

            window.addEventListener('message', listener)
        })
    }

    submitResponse = (id: string | number | null, payload: ResponsePayload) => {
        const message: SpliceMessage = {
            response: jsonRpcResponse(id, payload),
            type: WalletEvent.SPLICE_WALLET_RESPONSE,
        }
        this.win.postMessage(message, '*')
    }

    /**
     * Subscribe to wallet push events delivered as `SPLICE_WALLET_EVENT`
     * postMessage frames. Returns an unsubscribe function.
     *
     * Fork-only: see docs/fork-only-dapp-sync-event-channel.md.
     */
    onEvent = (handler: TransportEventHandler): (() => void) => {
        this.eventListeners.add(handler)
        this.installEventDispatcher()
        return () => {
            this.eventListeners.delete(handler)
        }
    }

    private installEventDispatcher() {
        if (this.eventDispatcherInstalled) return
        this.eventDispatcherInstalled = true

        // Single shared listener. Each onEvent subscription just adds to the
        // Set; we never add/remove the underlying DOM listener after this.
        const dispatch = (event: MessageEvent) => {
            if (!isSpliceMessageEvent(event)) return
            const data = event.data
            if (data.type !== WalletEvent.SPLICE_WALLET_EVENT) return
            if (this.options.target && data.target !== this.options.target) {
                return
            }
            for (const handler of this.eventListeners) {
                handler(data.event, data.payload)
            }
        }

        window.addEventListener('message', dispatch)
    }
}

export class HttpTransport implements RpcTransport {
    constructor(
        private url: URL,
        private accessToken?: string
    ) {}

    protected async handleErrorResponse(response: Response): Promise<never> {
        const body = await response.text()

        // if the response uses the RPC error format, throw it as is
        try {
            if (ErrorResponse.safeParse(JSON.parse(body)).success) {
                throw JSON.parse(body)
            }
        } catch {
            // ignore JSON parse errors
        }

        throw {
            error: {
                code: response.status,
                message: response.statusText,
                data: body,
            },
        }
    }

    async submit(payload: RequestPayload): Promise<ResponsePayload> {
        const request: JsonRpcRequest = {
            jsonrpc: '2.0',
            method: payload.method,
            params: payload.params,
            id: uuidv4(),
        }

        const header = this.accessToken
            ? { Authorization: `Bearer ${this.accessToken}` }
            : undefined

        const response = await fetch(this.url.href, {
            method: 'POST',
            headers: {
                ...header,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        })

        if (!response.ok) {
            return this.handleErrorResponse(response)
        }

        const json = await response.json()
        const parsed = ResponsePayload.parse(json)

        if ('error' in parsed) {
            throw parsed
        }

        return parsed
    }
}
