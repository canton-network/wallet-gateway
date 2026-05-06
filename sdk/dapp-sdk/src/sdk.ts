// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * DappSDK ties together DiscoveryClient + DappClient and serves as the
 * primary SDK entrypoint for dApp developers.
 *
 * A default singleton instance is exported at the bottom of this file, and
 * module-level functions delegate to that singleton for backward compatibility
 * (e.g. `sdk.connect()`, `sdk.status()`).
 */

import {
    DiscoveryClient,
    type ProviderAdapter,
    type WalletPickerEntry,
    type WalletPickerFn,
} from '@canton-network/core-wallet-discovery'
import {
    notifyWalletPickerConnected,
    notifyWalletPickerError,
    pickWallet,
    waitForWalletPickerRetrySelection,
} from '@canton-network/core-wallet-ui-components'
import type {
    EventListener,
    Provider,
} from '@canton-network/core-splice-provider'
import type {
    StatusEvent,
    ConnectResult,
    PrepareExecuteParams,
    PrepareExecuteAndWaitResult,
    LedgerApiParams,
    LedgerApiResult,
    ListAccountsResult,
    AccountsChangedEvent,
    TxChangedEvent,
    RpcTypes as DappRpcTypes,
} from '@canton-network/core-wallet-dapp-rpc-client'
import { DappClient } from './client'
import { ExtensionAdapter } from './adapter/extension-adapter'
import { InjectedAdapter } from './adapter/injected-adapter'
import {
    RemoteAdapter,
    type RemoteAdapterConfig,
} from './adapter/remote-adapter'
import * as storage from './storage'
import { clearAllLocalState } from './util'
import defaultGatewayList from './gateways.json'
import { CANTON_LOGO_PNG } from './assets'
import { discoverInjectedProviders } from './injected-discovery'
import { requestAnnouncedProviders } from './announce-discovery'

export interface DappSDKConnectOptions<
    TDefaultAdapter extends ProviderAdapter = ProviderAdapter,
> {
    defaultAdapters?: TDefaultAdapter[]
    additionalAdapters?: ProviderAdapter[] | undefined
}

function normalizeConnectOptions(
    options: DappSDKConnectOptions
): DappSDKConnectOptions {
    return {
        defaultAdapters:
            options.defaultAdapters === undefined
                ? createDefaultAdapters(defaultGatewayList)
                : options.defaultAdapters,
        additionalAdapters: options.additionalAdapters,
    }
}

export class DappSDK {
    private readonly RECENT_GATEWAYS_KEY = 'splice_wallet_picker_recent'
    private readonly walletPicker: WalletPickerFn
    private discovery: DiscoveryClient | null = null
    private client: DappClient | null = null
    private initPromise: Promise<unknown> | null = null
    private dynamicAdapterIds = new Set<string>()
    private configuredAdapters: DappSDKConnectOptions | undefined

    constructor(options?: { walletPicker?: WalletPickerFn | undefined }) {
        this.walletPicker =
            options?.walletPicker ?? (pickWallet as WalletPickerFn)
    }

    private async registerAdapters(
        discovery: DiscoveryClient,
        adapters?: ProviderAdapter[] | undefined
    ): Promise<void> {
        if (!adapters?.length) return

        const existingIds = new Set(
            discovery.listAdapters().map((a) => a.providerId as string)
        )
        for (const adapter of adapters) {
            const id = adapter.providerId as string
            if (existingIds.has(id)) continue
            if (await adapter.detect()) {
                discovery.registerAdapter(adapter)
                existingIds.add(id)
            }
        }
    }

    private async registerInjectedNamespaceAdapters(
        discovery: DiscoveryClient
    ): Promise<void> {
        const existingIds = new Set(
            discovery.listAdapters().map((a) => a.providerId as string)
        )

        const injected = discoverInjectedProviders()
        for (const item of injected) {
            const id = `browser:${item.id}`
            if (existingIds.has(id)) continue

            const key = `${item.id} (injected)`
            const adapter = new InjectedAdapter({
                id: item.id,
                name: key,
                provider: item.provider,
                description: `Injected provider from window.${item.id}`,
            })
            discovery.registerAdapter(adapter)
            existingIds.add(id)
        }
    }

    private async registerAnnouncedAdapters(
        discovery: DiscoveryClient
    ): Promise<void> {
        const existingIds = new Set(
            discovery.listAdapters().map((a) => a.providerId as string)
        )

        const announced = await requestAnnouncedProviders()
        for (const item of announced) {
            const id = `browser:ext:${item.id}`
            if (existingIds.has(id)) continue

            const adapter = new ExtensionAdapter({
                providerId: id as never,
                name: item.name,
                icon: item.icon,
                description: 'Connect via a browser extension wallet',
                target: item.target ?? item.id,
            })
            if (await adapter.detect()) {
                discovery.registerAdapter(adapter)
                existingIds.add(id)
            }
        }
    }

    private async ensureDiscovery(
        config?: DappSDKConnectOptions
    ): Promise<DiscoveryClient> {
        const initAdapters = this.getInitAdapters(config)

        if (!this.discovery) {
            const detectedAdapters =
                await this.collectDetectedAdapters(initAdapters)
            this.discovery = await DiscoveryClient.create({
                walletPicker: this.walletPicker,
                adapters: detectedAdapters,
            })
        } else {
            await this.registerAdapters(this.discovery, initAdapters)
        }

        // These can appear after initial create() (injected providers, extensions).
        await this.registerInjectedNamespaceAdapters(this.discovery)
        await this.registerAnnouncedAdapters(this.discovery)

        await this.discovery.restorePersistedSessionIfNeeded()

        if (!this.client) {
            const session = this.discovery.getActiveSession()
            if (session) {
                const providerType = session.adapter.getInfo().type
                const target =
                    session.adapter instanceof ExtensionAdapter
                        ? session.adapter.target
                        : undefined
                this.client = new DappClient(session.provider, {
                    providerType,
                    target,
                })
            }
        }

        return this.discovery
    }

    private getInitAdapters(config?: DappSDKConnectOptions): ProviderAdapter[] {
        if (config) {
            const normalized = normalizeConnectOptions(config)
            return [
                ...(normalized.defaultAdapters ?? []),
                ...(normalized.additionalAdapters ?? []),
            ]
        }

        const kernelDiscovery = storage.getKernelDiscovery()
        if (kernelDiscovery?.walletType === 'remote' && kernelDiscovery.url) {
            return [
                new RemoteAdapter({
                    name: kernelDiscovery.url,
                    rpcUrl: kernelDiscovery.url,
                }),
            ]
        }

        // No config + nothing to restore => default gateways.
        return createDefaultAdapters(defaultGatewayList)
    }

    private async collectDetectedAdapters(
        adapters: ProviderAdapter[]
    ): Promise<ProviderAdapter[]> {
        const detected: ProviderAdapter[] = []
        for (const adapter of adapters) {
            if (await adapter.detect()) {
                detected.push(adapter)
            }
        }
        return detected
    }

    private saveRecentGateway(name: string, rpcUrl: string): void {
        try {
            const raw = localStorage.getItem(this.RECENT_GATEWAYS_KEY)
            const recent: { name: string; rpcUrl: string }[] = raw
                ? JSON.parse(raw)
                : []
            const filtered = recent.filter((r) => r.rpcUrl !== rpcUrl)
            filtered.unshift({ name, rpcUrl })
            localStorage.setItem(
                this.RECENT_GATEWAYS_KEY,
                JSON.stringify(filtered.slice(0, 5))
            )
        } catch {
            // best-effort
        }
    }

    private getHttpStatusCode(error: unknown): number | undefined {
        const asNumber = (value: unknown): number | undefined =>
            typeof value === 'number' ? value : undefined

        if (typeof error !== 'object' || error === null) return undefined

        const obj = error as Record<string, unknown>
        const response = obj.response as Record<string, unknown> | undefined
        const cause = obj.cause as Record<string, unknown> | undefined

        return (
            asNumber(obj.status) ??
            asNumber(obj.statusCode) ??
            asNumber(response?.status) ??
            asNumber(cause?.status) ??
            asNumber(cause?.statusCode)
        )
    }

    private formatConnectionErrorMessage(error: unknown): string {
        const fallbackMessage = 'Failed to connect wallet'
        const baseMessage =
            error instanceof Error && error.message.trim().length > 0
                ? error.message
                : fallbackMessage

        const statusCode = this.getHttpStatusCode(error)
        if (!statusCode) return baseMessage

        const lowerMessage = baseMessage.toLowerCase()
        if (
            lowerMessage.includes(`http ${statusCode}`) ||
            lowerMessage.includes(`status ${statusCode}`)
        ) {
            return baseMessage
        }

        return `${baseMessage} (HTTP ${statusCode})`
    }

    private requireClient(): DappClient {
        if (!this.client)
            throw new Error('Not connected — call connect() first')
        return this.client
    }

    /**
     * Returns the raw connected provider instance (if any).
     *
     * This is useful for advanced integrations that need to call methods that
     * are not wrapped by the higher-level SDK helpers.
     */
    getConnectedProvider(): Provider<DappRpcTypes> | null {
        const session = this.discovery?.getActiveSession()
        if (!session) return null
        return session.provider
    }

    /**
     * Cold-start the SDK: create (or update) the discovery client, register adapters,
     * and attempt to restore a persisted wallet session without opening the picker.
     *
     * Call early on app mount with your adapter configuration. For the exported
     * {@link sdk} singleton, the **first** `init()` call (with or without options)
     * determines how {@link ensureDiscovery} builds the initial adapter list; pass
     * `options` on that first call when you need custom gateways or extra adapters.
     *
     * Adapter selection when discovery is first created (see {@link getInitAdapters}):
     * - If `options` is passed on this call, use those adapters (default gateways apply when
     *   `defaultAdapters` is omitted).
     * - Else if {@link configuredAdapters} was set by an earlier `init(options)`, use it.
     * - Else use the last remote gateway URL from app-local hints (if any), otherwise
     *   fall back to default gateways (`gateways.json`).
     *
     * Session restore itself is always performed by {@link DiscoveryClient} via
     * `restorePersistedSessionIfNeeded()`; the SDK only ensures a compatible adapter set
     * is registered first.
     *
     * Safe to call from multiple places: concurrent callers share the same in-flight
     * promise; discovery creation itself still happens at most once per SDK instance.
     */
    async init(options?: DappSDKConnectOptions): Promise<void> {
        // Register adapters and store them in the SDK instance.
        if (options) {
            this.configuredAdapters = normalizeConnectOptions(options)
        }

        // Create discovery and attempt restore.
        // If init() is called again *with options*, make sure those adapters
        // are registered even if discovery was already created by an earlier call
        // (e.g. status() on cold start). Serialize behind the existing initPromise
        // to avoid concurrent discovery mutations.
        this.initPromise = this.initPromise
            ? this.initPromise.then(() =>
                  this.ensureDiscovery(this.configuredAdapters)
              )
            : this.ensureDiscovery(this.configuredAdapters)
        await this.initPromise
    }

    async connect(): Promise<ConnectResult>
    /** @deprecated Pass options to `init()` instead. */
    async connect(options: DappSDKConnectOptions): Promise<ConnectResult>
    async connect(options?: DappSDKConnectOptions): Promise<ConnectResult> {
        // Prefer init({ ... }) once at startup. Passing options here remains supported
        // for older call sites; it is equivalent to init(options) then connect().
        if (options) {
            await this.init(options)
        } else {
            await this.init()
        }

        const discovery = this.discovery!
        await this.registerInjectedNamespaceAdapters(discovery)
        await this.registerAnnouncedAdapters(discovery)

        clearAllLocalState()

        // Build entries from registered (non-dynamic) adapters
        const entries: WalletPickerEntry[] = discovery
            .listAdapters()
            .filter((a) => !this.dynamicAdapterIds.has(a.providerId as string))
            .map((a) => {
                const info = a.getInfo()
                return {
                    providerId: info.providerId as string,
                    name: info.name,
                    type: info.type,
                    description: info.description,
                    icon: info.icon,
                    url: info.url,
                    reuseGlobalWalletPopup: info.reuseGlobalWalletPopup,
                }
            })

        const initialSelection = await this.walletPicker(entries)
        const connectionAttempts = new EventTarget()

        return new Promise<ConnectResult>((resolve, reject) => {
            const cleanup = () => {
                connectionAttempts.removeEventListener('attempt', onAttempt)
            }

            const onAttempt = async (event: Event): Promise<void> => {
                const picked = (event as CustomEvent<WalletPickerEntry>).detail
                let targetId = picked.providerId

                // Register a dynamic adapter for custom gateway URLs
                if (picked.type === 'remote' && picked.url) {
                    const existing = discovery
                        .listAdapters()
                        .find((a) => a.providerId === targetId)
                    if (!existing) {
                        const adapter = new RemoteAdapter({
                            name: picked.name,
                            rpcUrl: picked.url,
                        })
                        discovery.registerAdapter(adapter)
                        this.dynamicAdapterIds.add(adapter.providerId as string)
                        targetId = adapter.providerId
                    }
                }

                try {
                    // creates provider based on the adapter
                    // provider stores (and reads from storage) the session token and the access token
                    await discovery.connect(targetId)

                    const session = discovery.getActiveSession()
                    if (!session) {
                        throw new Error(
                            'Connection succeeded but no active session'
                        )
                    }

                    const info = session.adapter.getInfo()

                    this.client = new DappClient(session.provider, {
                        providerType: info.type,
                        target:
                            session.adapter instanceof ExtensionAdapter
                                ? session.adapter.target
                                : undefined,
                    })
                    const s = await this.client.status()

                    if (s.connection.isConnected) {
                        if (info.type === 'remote' && info.url) {
                            storage.setKernelDiscovery({
                                walletType: 'remote',
                                url: info.url,
                            })
                            this.saveRecentGateway(info.name, info.url)
                        } else if (info.type === 'browser') {
                            storage.setKernelDiscovery({
                                walletType: 'extension',
                                providerId: info.providerId as string,
                            })
                        }
                    }

                    notifyWalletPickerConnected(info.reuseGlobalWalletPopup)
                    cleanup()
                    resolve(s.connection)
                } catch (error) {
                    const message = this.formatConnectionErrorMessage(error)
                    notifyWalletPickerError(message)

                    this.client = null

                    try {
                        const retrySelection =
                            await waitForWalletPickerRetrySelection()
                        connectionAttempts.dispatchEvent(
                            new CustomEvent<WalletPickerEntry>('attempt', {
                                detail: retrySelection,
                            })
                        )
                    } catch (retryError) {
                        cleanup()
                        reject(retryError)
                    }
                }
            }

            connectionAttempts.addEventListener('attempt', onAttempt)
            connectionAttempts.dispatchEvent(
                new CustomEvent<WalletPickerEntry>('attempt', {
                    detail: initialSelection,
                })
            )
        })
    }

    async disconnect(): Promise<null> {
        // This may result in double call to dapp-api with method `disconnect` and double event `statusChanged`
        if (this.client) {
            await this.client.disconnect()
            this.client = null
        }
        if (this.discovery) {
            try {
                await this.discovery.disconnect()
            } catch {
                // already cleaned up via DappClient.disconnect()
            }
        }
        return null
    }

    async isConnected(): Promise<ConnectResult> {
        if (this.client) {
            return this.client.isConnected()
        }
        return {
            isConnected: false,
            isNetworkConnected: false,
            reason: 'Unauthenticated',
            networkReason: 'Unauthenticated',
        }
    }

    async status(): Promise<StatusEvent> {
        // Same cold-start as connect: restore session (if any) so requireClient() works.
        await this.init()
        return this.requireClient().status()
    }

    async listAccounts(): Promise<ListAccountsResult> {
        return this.requireClient().listAccounts()
    }

    async prepareExecute(params: PrepareExecuteParams): Promise<null> {
        return this.requireClient().prepareExecute(params)
    }

    async prepareExecuteAndWait(
        params: PrepareExecuteParams
    ): Promise<PrepareExecuteAndWaitResult> {
        return this.requireClient().prepareExecuteAndWait(params)
    }

    async ledgerApi(params: LedgerApiParams): Promise<LedgerApiResult> {
        return this.requireClient().ledgerApi(params)
    }

    async open(): Promise<void> {
        return this.requireClient().open()
    }

    async onStatusChanged(listener: EventListener<StatusEvent>): Promise<void> {
        this.requireClient().onStatusChanged(listener)
    }

    async onAccountsChanged(
        listener: EventListener<AccountsChangedEvent>
    ): Promise<void> {
        this.requireClient().onAccountsChanged(listener)
    }

    async onConnected(listener: EventListener<StatusEvent>): Promise<void> {
        this.requireClient().onConnected(listener)
    }

    async onTxChanged(listener: EventListener<TxChangedEvent>): Promise<void> {
        this.requireClient().onTxChanged(listener)
    }

    async removeOnStatusChanged(
        listener: EventListener<StatusEvent>
    ): Promise<void> {
        if (!this.client) return
        this.client.removeOnStatusChanged(listener)
    }

    async removeOnAccountsChanged(
        listener: EventListener<AccountsChangedEvent>
    ): Promise<void> {
        if (!this.client) return
        this.client.removeOnAccountsChanged(listener)
    }

    async removeOnConnected(
        listener: EventListener<StatusEvent>
    ): Promise<void> {
        if (!this.client) return
        this.client.removeOnConnected(listener)
    }

    async removeOnTxChanged(
        listener: EventListener<TxChangedEvent>
    ): Promise<void> {
        if (!this.client) return
        this.client.removeOnTxChanged(listener)
    }
}

export const sdk = new DappSDK()

/**
 * Opens the wallet picker and connects. Prefer {@link init} with adapters at startup;
 * `options` here is a legacy convenience that forwards to {@link DappSDK.init}.
 */
export function connect(): Promise<ConnectResult>
/** @deprecated Pass options to `init()` instead. */
export function connect(options: DappSDKConnectOptions): Promise<ConnectResult>
export function connect(
    options?: DappSDKConnectOptions
): Promise<ConnectResult> {
    // TODO we probably shouldn't add logic in the convenience exported methods
    //  that would not execute if called through sdk.connect
    if (options) {
        return sdk.init(options).then(() => sdk.connect())
    }
    return sdk.connect()
}

export const init = (options?: DappSDKConnectOptions): Promise<void> =>
    sdk.init(options)

export const disconnect = (): Promise<null> => sdk.disconnect()

export const isConnected = (): Promise<ConnectResult> => sdk.isConnected()

export const status = (): Promise<StatusEvent> => sdk.status()

export const listAccounts = (): Promise<ListAccountsResult> =>
    sdk.listAccounts()

export const prepareExecute = (params: PrepareExecuteParams): Promise<null> =>
    sdk.prepareExecute(params)

export const prepareExecuteAndWait = (
    params: PrepareExecuteParams
): Promise<PrepareExecuteAndWaitResult> => sdk.prepareExecuteAndWait(params)

export const ledgerApi = (params: LedgerApiParams): Promise<LedgerApiResult> =>
    sdk.ledgerApi(params)

export const open = (): Promise<void> => sdk.open()

export const getConnectedProvider = (): ReturnType<
    DappSDK['getConnectedProvider']
> => sdk.getConnectedProvider()

export const onStatusChanged = (
    listener: EventListener<StatusEvent>
): Promise<void> => sdk.onStatusChanged(listener)

export const onAccountsChanged = (
    listener: EventListener<AccountsChangedEvent>
): Promise<void> => sdk.onAccountsChanged(listener)

export const onConnected = (
    listener: EventListener<StatusEvent>
): Promise<void> => sdk.onConnected(listener)

export const onTxChanged = (
    listener: EventListener<TxChangedEvent>
): Promise<void> => sdk.onTxChanged(listener)

export const removeOnStatusChanged = (
    listener: EventListener<StatusEvent>
): Promise<void> => sdk.removeOnStatusChanged(listener)

export const removeOnAccountsChanged = (
    listener: EventListener<AccountsChangedEvent>
): Promise<void> => sdk.removeOnAccountsChanged(listener)

export const removeOnConnected = (
    listener: EventListener<StatusEvent>
): Promise<void> => sdk.removeOnConnected(listener)

export const removeOnTxChanged = (
    listener: EventListener<TxChangedEvent>
): Promise<void> => sdk.removeOnTxChanged(listener)

function createDefaultAdapters(
    defaultGatewayConfigs: RemoteAdapterConfig[]
): ProviderAdapter[] {
    return defaultGatewayConfigs.map(
        (config) =>
            new RemoteAdapter({
                ...config,
                icon: config.icon ?? CANTON_LOGO_PNG,
            } satisfies RemoteAdapterConfig)
    )
}
