// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import SignClient from '@walletconnect/sign-client'
import type { SessionTypes } from '@walletconnect/types'
import type {
    Provider,
    EventListener,
} from '@canton-network/core-splice-provider'
import type { RequestArgs } from '@canton-network/core-types'
import type {
    RpcTypes as DappRpcTypes,
    Provider as ProviderInfo,
} from '@canton-network/core-wallet-dapp-rpc-client'
import type {
    ProviderAdapter,
    WalletInfo,
} from '@canton-network/core-wallet-discovery'
import type {
    ProviderId,
    ProviderType,
    StatusEvent,
} from '@canton-network/core-wallet-dapp-rpc-client'
import { WALLETCONNECT_ICON } from '../assets'
import { composeSIWXMessage } from '../util'
import { v4 as uuidv4 } from 'uuid'

const CANTON_WC_METHODS = [
    'canton_prepareSignExecute',
    'canton_listAccounts',
    'canton_getPrimaryAccount',
    'canton_getActiveNetwork',
    'canton_status',
    'canton_ledgerApi',
    'canton_signMessage',
]

const CANTON_WC_EVENTS = ['accountsChanged', 'statusChanged']

const PROVIDER_INFO: ProviderInfo = {
    id: 'walletconnect',
    providerType: 'mobile',
}

/**
 * The timestamp is a UTC string representing the time in ISO 8601 format.
 */
export type Timestamp = string

/**
 * This interface represents the SIWX message metadata.
 * Here must contain the main data related to the app.
 */
export interface Metadata {
    requestId?: string
    domain: string
    uri: string
    version: string
    nonce?: string
    notBefore?: Timestamp
    statement?: string
    resources?: string[]
}

/**
 * This interface represents the SIWX message identifier.
 * Here must contain the request id and the timestamps.
 */
export interface Identifier {
    requestId?: string
    issuedAt?: Timestamp
    expirationTime?: Timestamp
}

export interface SIWXMessageParams extends Metadata, Identifier {}

export interface RequestSIWXParams extends SIWXMessageParams {
    account: string
}

export interface SignInWithCantonResult {
    requestId: string | undefined
    nonce: string
    account: string
    chainId: string
    message: string
    publicKey: string
    signature: string
    error?: SignInWithCantonError
}

export interface SignInWithCantonError {
    message: string
    code: number
}

export interface WalletConnectAdapterConfig {
    projectId: string
    chainId?: string
    metadata?: {
        name: string
        description: string
        url: string
        icons: string[]
    }
    /** Whether to trigger a canton_signMessage request after the session is established. */
    signInWithCanton?: SIWXMessageParams
    /** Called with the pairing URI so the dApp can display or forward it. */
    onUri?: (uri: string) => void
    onSignInWithCanton?: (result: SignInWithCantonResult) => void
}

/**
 * Single-class WalletConnect adapter that implements both ProviderAdapter
 * (for discovery/wallet-picker) and Provider<DappRpcTypes> (for RPC calls).
 *
 * Calls signClient.request() directly with `canton_` prefixed methods.
 * Events arriving via session_event are buffered until a listener attaches.
 */
export class WalletConnectAdapter
    implements ProviderAdapter, Provider<DappRpcTypes>
{
    readonly providerId: ProviderId = 'walletconnect'
    readonly name = 'WalletConnect'
    readonly type: ProviderType = 'mobile'
    readonly icon: string | undefined = WALLETCONNECT_ICON

    private readonly projectId: string
    private readonly chainId: string
    private readonly metadata:
        | WalletConnectAdapterConfig['metadata']
        | undefined
    private readonly onUri: ((uri: string) => void) | undefined
    private readonly onSignInWithCanton:
        | ((result: SignInWithCantonResult) => void)
        | undefined
    private readonly signInWithCanton: WalletConnectAdapterConfig['signInWithCanton']

    private signClient: SignClient | null = null
    private session: SessionTypes.Struct | null = null
    private initPromise: Promise<SignClient> | null = null

    // Event handling with buffering for events that arrive before listeners
    private listeners: { [event: string]: EventListener<unknown>[] } = {}
    private eventBuffer = new Map<string, unknown[][]>()

    static create(config: WalletConnectAdapterConfig): WalletConnectAdapter {
        return new WalletConnectAdapter(config)
    }

    constructor(config: WalletConnectAdapterConfig) {
        this.projectId = config.projectId
        this.signInWithCanton = config.signInWithCanton
        this.chainId = config.chainId ?? 'canton:devnet'
        this.metadata = config.metadata
        this.onUri = config.onUri
        this.onSignInWithCanton = config.onSignInWithCanton
    }

    // ── ProviderAdapter ─────────────────────────────────────────────

    getInfo(): WalletInfo {
        return {
            providerId: this.providerId,
            name: this.name,
            type: this.type,
            icon: this.icon,
            description: 'Connect via WalletConnect',
            reuseGlobalWalletPopup: true,
        }
    }

    async detect(): Promise<boolean> {
        return true
    }

    provider(): Provider<DappRpcTypes> {
        return this
    }

    teardown(): void {
        // Intentionally keep state alive — the SignClient must persist
        // for reconnect. The session is cleaned up by walletConnectDisconnect().
    }

    async restore(): Promise<Provider<DappRpcTypes> | null> {
        const client = await this.initSignClient()
        const cantonSession = client.session
            .getAll()
            .find((s) => s.namespaces?.canton !== undefined)

        if (cantonSession) {
            this.session = cantonSession
            this.setupSessionEvents()
            return this
        }
        return null
    }

    // ── Provider<DappRpcTypes> ──────────────────────────────────────

    async request<M extends keyof DappRpcTypes>(
        args: RequestArgs<DappRpcTypes, M>
    ): Promise<DappRpcTypes[M]['result']> {
        if (args.method === 'connect') {
            if (!this.session) {
                await this.establishSession()
            }

            const status = this.emitConnected()
            return status.connection as DappRpcTypes[M]['result']
        }

        if (args.method === 'disconnect') {
            // Emit before clearing state so listeners receive it
            this.emitDisconnected('User disconnected')
            if (this.signClient && this.session) {
                try {
                    await this.signClient.disconnect({
                        topic: this.session.topic,
                        reason: { code: 6000, message: 'User disconnected' },
                    })
                } catch {
                    // session may already be gone on the relay
                }
            }
            this.session = null
            return null as DappRpcTypes[M]['result']
        }

        // Return disconnected status locally when session isn't ready
        if (args.method === 'status' && !this.session) {
            return {
                provider: PROVIDER_INFO,
                connection: {
                    isConnected: false,
                    isNetworkConnected: false,
                },
            } as DappRpcTypes[M]['result']
        }

        if (!this.session) {
            throw new Error('WalletConnect session not established')
        }

        // Both prepareExecute and prepareExecuteAndWait map to
        // canton_prepareSignExecute — the wallet does the full
        // prepare-sign-execute cycle and responds when complete.
        if (
            args.method === 'prepareExecute' ||
            args.method === 'prepareExecuteAndWait'
        ) {
            const result = await this.walletConnectRequest(
                'prepareSignExecute',
                args.params
            )
            // Emit locally so useTransactions / onTxChanged picks it up
            this.emit('txChanged', result)
            return { tx: result } as DappRpcTypes[M]['result']
        }

        // Everything else is a direct pass-through
        const params = 'params' in args ? args.params : undefined
        return this.walletConnectRequest(
            args.method as string,
            params
        ) as Promise<DappRpcTypes[M]['result']>
    }

    on<E>(event: string, listener: EventListener<E>): this {
        if (!this.listeners[event]) {
            this.listeners[event] = []
        }
        ;(this.listeners[event] as EventListener<E>[]).push(listener)

        // Replay buffered events so the listener doesn't miss anything
        const buffered = this.eventBuffer.get(event)
        if (buffered) {
            for (const args of buffered) {
                listener(...(args as E[]))
            }
            this.eventBuffer.delete(event)
        }
        return this
    }

    emit<E>(event: string, ...args: E[]): boolean {
        if (this.listeners[event]?.length > 0) {
            this.listeners[event].forEach((listener) => listener(...args))
            return true
        }
        // Buffer events that arrive before a listener is registered
        if (!this.eventBuffer.has(event)) {
            this.eventBuffer.set(event, [])
        }
        this.eventBuffer.get(event)!.push(args as unknown[])
        return false
    }

    removeListener<E>(event: string, listenerToRemove: EventListener<E>): this {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(
                (l) => l !== listenerToRemove
            )
        }
        return this
    }

    // ── Private: WC request ─────────────────────────────────────────

    /** Send a request through signClient, prefixing the method with `canton_`. */
    private async walletConnectRequest<T>(
        method: string,
        params?: unknown
    ): Promise<T> {
        if (!this.signClient || !this.session) {
            throw new Error('WalletConnect session not established')
        }
        try {
            return (await this.signClient.request({
                topic: this.session.topic,
                chainId: this.chainId,
                request: {
                    method: `canton_${method}`,
                    params: params ?? {},
                },
            })) as T
        } catch (err: unknown) {
            const errObj = typeof err === 'object' && err !== null ? err : {}
            const message =
                err instanceof Error
                    ? err.message
                    : 'message' in errObj &&
                        typeof (errObj as { message: unknown }).message ===
                            'string'
                      ? (errObj as { message: string }).message
                      : String(err)
            const code =
                'code' in errObj ? (errObj as { code: number }).code : -32603
            throw new Error(`RPC error: ${code} - ${message}`, { cause: err })
        }
    }

    // ── Private: session lifecycle ──────────────────────────────────

    private emitConnected(): StatusEvent {
        const connectStatus: StatusEvent = {
            provider: PROVIDER_INFO,
            connection: {
                isConnected: true,
                isNetworkConnected: true,
            },
        }
        this.emit<StatusEvent>('statusChanged', connectStatus)
        return connectStatus
    }

    private emitDisconnected(reason?: string) {
        this.emit<StatusEvent>('statusChanged', {
            provider: {
                id: 'walletconnect',
                providerType: 'mobile',
            },
            connection: {
                isConnected: false,
                isNetworkConnected: false,
                ...(reason ? { reason: reason } : {}),
            },
        })
    }

    private async initSignClient(): Promise<SignClient> {
        if (this.signClient) return this.signClient
        if (this.initPromise) return this.initPromise

        this.initPromise = SignClient.init({
            projectId: this.projectId,
            metadata: this.metadata ?? {
                name: 'Canton dApp',
                description: 'Canton Network dApp using WalletConnect',
                url:
                    typeof window !== 'undefined'
                        ? window.location.origin
                        : 'https://canton.network',
                icons: [],
            },
        })

        this.signClient = await this.initPromise

        this.signClient.on('session_delete', () => {
            // Emit BEFORE clearing state so listeners receive the event
            this.emitDisconnected('Session deleted by wallet')
            this.session = null
        })

        return this.signClient
    }

    /** Wire up session_event forwarding for the current session. */
    private setupSessionEvents(): void {
        if (!this.signClient) return
        this.signClient.on('session_event', (event) => {
            const { name, data } = event.params.event
            this.emit(name, data)
        })
    }

    private async establishSession(): Promise<void> {
        const client = await this.initSignClient()

        const { uri, approval } = await client.connect({
            requiredNamespaces: {
                canton: {
                    chains: [this.chainId],
                    methods: CANTON_WC_METHODS,
                    events: CANTON_WC_EVENTS,
                },
            },
        })

        if (uri) {
            this.onUri?.(uri)
            await this.showUriInPopup(uri)
        }

        this.session = await approval()
        this.setupSessionEvents()
        if (this.signInWithCanton) {
            const nonce = this.signInWithCanton.nonce || uuidv4()

            try {
                const account = this.session?.namespaces?.canton?.accounts?.[0]
                const address = decodeURIComponent(account?.split(':')[2])
                const chainId = account?.split(':')[1] ?? this.chainId
                const message = composeSIWXMessage({
                    ...this.signInWithCanton,
                    accountAddress: address,
                    chainId: chainId,
                })

                const result = await this.walletConnectRequest<{
                    signature: string
                    publicKey: string
                }>('signMessage', {
                    message: message,
                })
                this.onSignInWithCanton?.({
                    requestId: this.signInWithCanton.requestId,
                    nonce,
                    account: account,
                    chainId: chainId,
                    message: message,
                    signature: result.signature,
                    publicKey: result.publicKey,
                })
            } catch (error) {
                const err = error as Error
                this.onSignInWithCanton?.({
                    requestId: this.signInWithCanton.requestId,
                    nonce,
                    account: '',
                    chainId: '',
                    message: '',
                    publicKey: '',
                    signature: '',
                    error: {
                        message: err.message,
                        code: -32603,
                    },
                })
            }
        }
    }

    private async showUriInPopup(uri: string): Promise<void> {
        try {
            const popupWin = window.open('', 'wallet-popup')
            if (!popupWin || popupWin.closed) return

            let qrDataUrl: string | undefined
            try {
                const QRCode = await import('qrcode')
                qrDataUrl = await QRCode.toDataURL(uri, {
                    width: 200,
                    margin: 2,
                    color: { dark: '#000000', light: '#ffffff' },
                })
            } catch {
                // qrcode package not installed — skip QR generation
            }

            popupWin.postMessage({ type: 'wc-uri', uri, qrDataUrl }, '*')
        } catch {
            // Best-effort — onUri callback is the fallback.
        }
    }
}
