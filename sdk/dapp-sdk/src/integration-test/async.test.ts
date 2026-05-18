// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type {
    RpcTypes as DappRpcTypes,
    SignMessageParams,
    StatusEvent,
    TxChangedEvent,
    TxChangedExecutedEvent,
    Wallet,
} from '@canton-network/core-wallet-dapp-rpc-client'
import type { Provider } from '@canton-network/core-splice-provider'
import type { DappAsyncProvider } from '@canton-network/core-provider-dapp'
import { WalletEvent } from '@canton-network/core-types'
import type { PrepareExecuteParams } from '../index'
import { DappSDK } from '../sdk'
import { RemoteAdapter } from '../adapter'
import { popup } from '@canton-network/core-wallet-ui-components'
import {
    APPROVE_URL,
    connectResultConnected,
    MOCK_DAPP_API_PATH,
    MOCK_SSE_PUSH_PATH,
    SIGN_MESSAGE_ID,
    statusConnected,
    USER_URL,
} from './mock-remote/json-rpc-handlers'
import * as storage from '../storage'
import { ErrorCode } from '../error'

// This test file doesn't validate browser extension wallets, so skip the
// wait for CANTON_ANNOUNCE_PROVIDER_EVENT discovery step to save 600ms per test
vi.mock('../announce-discovery', () => ({
    requestAnnouncedProviders: async () => [],
}))

const MOCK_AUTH_TOKEN = 'integration-test-token'
const MOCK_SESSION_ID = 'integration-test-session'

// Simulate postMessage that popup emits after login
function mockPopupOpen(): void {
    vi.spyOn(popup, 'open').mockImplementation((...args: unknown[]) => {
        const url = args[0] as string
        if (url.includes(USER_URL)) {
            queueMicrotask(() => {
                window.dispatchEvent(
                    new MessageEvent('message', {
                        origin: window.location.origin,
                        data: {
                            type: WalletEvent.SPLICE_WALLET_IDP_AUTH_SUCCESS,
                            token: MOCK_AUTH_TOKEN,
                            sessionId: MOCK_SESSION_ID,
                        },
                    })
                )
            })
        }
        // No actual popup window
        return undefined as unknown as Window
    })
}

type ListenerFn = (...args: unknown[]) => void

function listenerCount(
    provider: Provider<DappRpcTypes>,
    event: string
): number {
    return (
        (
            provider as unknown as {
                remoteProvider: DappAsyncProvider
            }
        ).remoteProvider.listeners[event]?.length ?? 0
    )
}

function hasListener(
    provider: Provider<DappRpcTypes>,
    event: string,
    fn: ListenerFn
): boolean {
    const list = (
        provider as unknown as {
            remoteProvider: DappAsyncProvider
        }
    ).remoteProvider.listeners[event]
    return list?.includes(fn) ?? false
}

const REMOTE_ORIGIN = 'http://127.0.0.1:13030'

const RPC_URL = REMOTE_ORIGIN + MOCK_DAPP_API_PATH
const PROVIDER_ID = 'remote:integration' as const
const RECENT_GATEWAYS_KEY = 'splice_wallet_picker_recent'

// POST to the gateway's test-only sideband. The server fans the frame out
// to every connected SSE client, so tests can drive txChanged and other
// pushed events on demand.
async function pushMockSseEvent(event: string, data: unknown): Promise<void> {
    const res = await fetch(`${REMOTE_ORIGIN}${MOCK_SSE_PUSH_PATH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, data }),
    })
    if (!res.ok) throw new Error(`sse-push failed: ${res.status}`)
}

type RpcFetchCall = {
    url: string
    init: RequestInit
    headers: Record<string, string>
    body: {
        jsonrpc: string
        id: string | number | null
        method: string
        params?: unknown
    }
}

type FetchSpy = ReturnType<typeof spyOnFetch>

function spyOnFetch() {
    return vi.spyOn(globalThis, 'fetch')
}

// Utils for browsing recorded HTTP requests
function rpcCalls(spy: FetchSpy): RpcFetchCall[] {
    const output: RpcFetchCall[] = []
    for (const [input, init] of spy.mock.calls) {
        const url = new URL(input).href
        if (url !== RPC_URL) continue
        if (!init || init.method !== 'POST') continue
        if (typeof init.body !== 'string') continue

        output.push({
            url,
            init,
            headers: init.headers
                ? Object.fromEntries(new Headers(init.headers).entries())
                : {},
            body: JSON.parse(init.body),
        })
    }
    return output
}

function findRpcCallFor(calls: RpcFetchCall[], method: string): RpcFetchCall {
    const match = calls.find((c) => c.body.method === method)
    if (!match) {
        throw new Error(
            `expected JSON-RPC fetch for "${method}", saw: [${calls
                .map((c) => c.body.method)
                .join(', ')}]`
        )
    }
    return match
}

type AssertRpcCallShapeOptions = {
    params?: unknown
    authenticated?: boolean
}

function assertRpcCallShape(
    call: RpcFetchCall,
    method: string,
    options: AssertRpcCallShapeOptions = {}
): void {
    expect(call.url).toBe(RPC_URL)
    expect(call.init.method).toBe('POST')
    expect(call.headers['content-type']).toMatch(/application\/json/)
    expect(call.body.jsonrpc).toBe('2.0')
    expect(typeof call.body.id).toBe('string')
    expect(call.body.id).toBeTruthy()
    expect(call.body.method).toBe(method)
    if (options.params !== undefined) {
        expect(call.body.params).toEqual(options.params)
    }
    if (options.authenticated) {
        expect(call.headers.authorization).toBe(`Bearer ${MOCK_AUTH_TOKEN}`)
    }
}

// Build a DappSDK pointed at the mock gateway and run init() so the
// remote adapter is registered in the discovery client.
async function createIntegrationSdk(): Promise<{
    sdk: DappSDK
    remoteAdapter: RemoteAdapter
}> {
    const remote = new RemoteAdapter({
        name: 'integration remote gateway',
        rpcUrl: RPC_URL,
        providerId: PROVIDER_ID,
    })
    const sdk = new DappSDK({
        walletPicker: async (entries) => {
            const entry = entries.find((e) => e.providerId === PROVIDER_ID)
            if (!entry) {
                throw new Error(
                    `remote adapter missing; got ${entries.map((e) => e.providerId).join(',')}`
                )
            }
            return {
                providerId: entry.providerId,
                name: entry.name,
                type: entry.type,
            }
        },
    })
    await sdk.init({ defaultAdapters: [remote] })
    return { sdk, remoteAdapter: remote }
}

describe('dApp SDK - async', () => {
    beforeEach(() => {
        localStorage.clear()
        delete (window as Window & { canton?: unknown }).canton
        mockPopupOpen()
        vi.spyOn(popup, 'close').mockImplementation(() => undefined)
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('init', () => {
        it('reflects defaultAdapters and additionalAdapters from init() in the discovery client', async () => {
            const defaultAdapter = new RemoteAdapter({
                name: 'init-default',
                rpcUrl: 'http://default.test:9999',
                providerId: 'remote:init-default',
            })
            const additionalAdapter = new RemoteAdapter({
                name: 'init-additional',
                rpcUrl: 'http://additional.test:9999',
                providerId: 'remote:init-additional',
            })
            const sdk = new DappSDK()

            await sdk.init({
                defaultAdapters: [defaultAdapter],
                additionalAdapters: [additionalAdapter],
            })

            const ids = (
                sdk as unknown as {
                    discovery: {
                        listAdapters(): Array<{ providerId: string }>
                    }
                }
            ).discovery
                .listAdapters()
                .map((a) => a.providerId)
            expect(ids).toEqual([
                'remote:init-default',
                'remote:init-additional',
            ])
        })

        it('does not inject default adapters when init() is called with empty defaultAdapters and additionalAdapters', async () => {
            const sdk = new DappSDK()

            await sdk.init({
                defaultAdapters: [],
                additionalAdapters: [],
            })

            const ids = (
                sdk as unknown as {
                    discovery: {
                        listAdapters(): Array<{ providerId: string }>
                    }
                }
            ).discovery
                .listAdapters()
                .map((a) => a.providerId)
            expect(ids).toEqual([])
        })
    })

    describe('connect', () => {
        it('resolves with ConnectResult indicating an established session', async () => {
            const { sdk } = await createIntegrationSdk()

            const result = await sdk.connect()

            expect(result.isConnected).toBe(true)
            expect(result.isNetworkConnected).toBe(true)
            expect(result.userUrl).toBeDefined()

            await sdk.disconnect()
        })

        it('persists remote kernel discovery metadata (setKernelDiscovery)', async () => {
            const { sdk, remoteAdapter } = await createIntegrationSdk()

            await sdk.connect()

            const discovery = storage.getKernelDiscovery()
            expect(discovery?.walletType).toBe('remote')
            expect(discovery?.url).toBe(remoteAdapter.rpcUrl)

            await sdk.disconnect()
        })

        it('persists kernel session after connection', async () => {
            const { sdk } = await createIntegrationSdk()

            await sdk.connect()

            const session = storage.getKernelSession()
            expect(session?.session?.accessToken).toBe('integration-test-token')
            expect(session?.connection.isConnected).toBe(true)

            await sdk.disconnect()
        })

        it('appends the gateway to the recent wallet picker list', async () => {
            const { sdk } = await createIntegrationSdk()

            await sdk.connect()

            const raw = localStorage.getItem(RECENT_GATEWAYS_KEY)
            expect(raw).toBeTruthy()
            const recent = JSON.parse(raw!) as {
                name: string
                rpcUrl: string
            }[]
            expect(recent.length).toBeGreaterThan(0)
            expect(recent[0]?.rpcUrl).toBe(RPC_URL)

            await sdk.disconnect()
        })

        it('opens the wallet login URL via popup during the connect flow', async () => {
            const { sdk } = await createIntegrationSdk()

            await sdk.connect()

            expect(popup.open).toHaveBeenCalled()
            const firstUrl = vi.mocked(popup.open).mock.calls[0]?.[0]
            expect(firstUrl).toContain('/login')

            await sdk.disconnect()
        })

        it('sends http request and adds authorization header to subsequent requests', async () => {
            const { sdk } = await createIntegrationSdk()
            const fetchSpy = spyOnFetch()

            await sdk.connect()

            const calls = rpcCalls(fetchSpy)
            const connectCall = findRpcCallFor(calls, 'connect')
            assertRpcCallShape(connectCall, 'connect')
            expect(connectCall.headers.authorization).toBeUndefined()

            // After SPLICE_WALLET_IDP_AUTH_SUCCESS the provider requests
            // status with the session token attached
            const statusCall = findRpcCallFor(calls, 'status')
            assertRpcCallShape(statusCall, 'status', { authenticated: true })

            await sdk.disconnect()
        })
    })

    describe('disconnect', () => {
        it('delegates to provider.request', async () => {
            const { sdk } = await createIntegrationSdk()
            await sdk.connect()
            const provider = sdk.getConnectedProvider()!
            const requestSpy = vi.spyOn(provider, 'request')

            await sdk.disconnect()

            expect(requestSpy).toHaveBeenCalledWith({ method: 'disconnect' })
        })

        it('clears persisted kernel session and discovery from localStorage', async () => {
            const { sdk } = await createIntegrationSdk()
            await sdk.connect()
            expect(storage.getKernelSession()).toBeDefined()
            expect(storage.getKernelDiscovery()).toBeDefined()

            await sdk.disconnect()

            expect(storage.getKernelSession()).toBeUndefined()
            expect(storage.getKernelDiscovery()).toBeUndefined()
        })

        it('closes the wallet popup', async () => {
            const { sdk } = await createIntegrationSdk()
            await sdk.connect()
            vi.mocked(popup.close).mockClear()

            await sdk.disconnect()

            expect(popup.close).toHaveBeenCalled()
        })

        it('drops the active session so subsequent sdk calls throw', async () => {
            const { sdk } = await createIntegrationSdk()
            await sdk.connect()

            await sdk.disconnect()

            await expect(sdk.listAccounts()).rejects.toThrow(/Not connected/)
        })

        it('sends http request', async () => {
            const { sdk } = await createIntegrationSdk()
            await sdk.connect()
            const fetchSpy = spyOnFetch()

            await sdk.disconnect()

            const call = findRpcCallFor(rpcCalls(fetchSpy), 'disconnect')
            assertRpcCallShape(call, 'disconnect', { authenticated: true })
        })
    })

    describe('isConnected', () => {
        it("returns unauthenticated when not connected and therefore client doesn't exist", async () => {
            const { sdk } = await createIntegrationSdk()

            const result = await sdk.isConnected()

            expect(result).toEqual({
                isConnected: false,
                isNetworkConnected: false,
                reason: 'Unauthenticated',
                networkReason: 'Unauthenticated',
            })
        })

        it('delegates to provider.request when connected', async () => {
            const { sdk } = await createIntegrationSdk()
            await sdk.connect()
            const provider = sdk.getConnectedProvider()!
            const requestSpy = vi.spyOn(provider, 'request')

            const result = await sdk.isConnected()

            expect(requestSpy).toHaveBeenCalledWith({ method: 'isConnected' })
            expect(result.isConnected).toBe(true)

            await sdk.disconnect()
        })

        it('sends http request', async () => {
            const { sdk } = await createIntegrationSdk()
            await sdk.connect()
            const fetchSpy = spyOnFetch()

            await sdk.isConnected()

            const call = findRpcCallFor(rpcCalls(fetchSpy), 'isConnected')
            assertRpcCallShape(call, 'isConnected', { authenticated: true })

            await sdk.disconnect()
        })
    })

    describe('listAccounts', () => {
        it('delegates to provider.request', async () => {
            const { sdk } = await createIntegrationSdk()
            await sdk.connect()
            const provider = sdk.getConnectedProvider()!
            const requestSpy = vi.spyOn(provider, 'request')

            await sdk.listAccounts()

            expect(requestSpy).toHaveBeenCalledWith({ method: 'listAccounts' })

            await sdk.disconnect()
        })

        it('sends http request', async () => {
            const { sdk } = await createIntegrationSdk()
            await sdk.connect()
            const fetchSpy = spyOnFetch()

            await sdk.listAccounts()

            const call = findRpcCallFor(rpcCalls(fetchSpy), 'listAccounts')
            assertRpcCallShape(call, 'listAccounts', { authenticated: true })

            await sdk.disconnect()
        })
    })

    describe('getActiveNetwork', () => {
        // TODO make it sdk.getActiveNetwork() once it's added to SDK
        it.skip('delegates to provider.request', async () => {
            const { sdk } = await createIntegrationSdk()
            await sdk.connect()
            const provider = sdk.getConnectedProvider()!
            const requestSpy = vi.spyOn(provider, 'request')

            await provider.request({ method: 'getActiveNetwork' })

            expect(requestSpy).toHaveBeenCalledWith({
                method: 'getActiveNetwork',
            })

            await sdk.disconnect()
        })

        it('sends http request', async () => {
            const { sdk } = await createIntegrationSdk()
            await sdk.connect()
            const provider = sdk.getConnectedProvider()!
            const fetchSpy = spyOnFetch()

            await provider.request({ method: 'getActiveNetwork' })

            const call = findRpcCallFor(rpcCalls(fetchSpy), 'getActiveNetwork')
            assertRpcCallShape(call, 'getActiveNetwork', {
                authenticated: true,
            })

            await sdk.disconnect()
        })
    })

    describe('getPrimaryAccount', () => {
        // TODO make it sdk.getPrimaryAccount() once it's added to SDK
        it.skip('delegates to provider.request', async () => {
            const { sdk } = await createIntegrationSdk()
            await sdk.connect()
            const provider = sdk.getConnectedProvider()!
            const requestSpy = vi.spyOn(provider, 'request')

            await provider.request({ method: 'getPrimaryAccount' })

            expect(requestSpy).toHaveBeenCalledWith({
                method: 'getPrimaryAccount',
            })

            await sdk.disconnect()
        })

        it('sends http request', async () => {
            const { sdk } = await createIntegrationSdk()
            await sdk.connect()
            const provider = sdk.getConnectedProvider()!
            const fetchSpy = spyOnFetch()

            await provider.request({ method: 'getPrimaryAccount' })

            const call = findRpcCallFor(rpcCalls(fetchSpy), 'getPrimaryAccount')
            assertRpcCallShape(call, 'getPrimaryAccount', {
                authenticated: true,
            })

            await sdk.disconnect()
        })
    })

    describe('signMessage', () => {
        const params: SignMessageParams = {
            message: 'integration-sign-payload',
        }

        async function waitForMessageSignatureListener(
            provider: Provider<DappRpcTypes>,
            baseline: number
        ): Promise<void> {
            const deadline = Date.now() + 10_000
            while (Date.now() < deadline) {
                if (listenerCount(provider, 'messageSignature') > baseline) {
                    return
                }
                await new Promise((r) => setTimeout(r, 5))
            }
            throw new Error(
                'timeout waiting for signMessage messageSignature listener'
            )
        }

        it('sends http request with params and waits for messageSignature event', async () => {
            const { sdk } = await createIntegrationSdk()
            await sdk.connect()
            const provider = sdk.getConnectedProvider()!
            const fetchSpy = spyOnFetch()

            const baseline = listenerCount(provider, 'messageSignature')

            const waitPromise = sdk.signMessage(params)
            await waitForMessageSignatureListener(provider, baseline)

            const calls = rpcCalls(fetchSpy)
            const call = findRpcCallFor(calls, 'signMessage')
            assertRpcCallShape(call, 'signMessage', {
                params,
                authenticated: true,
            })

            await pushMockSseEvent('messageSignature', {
                messageId: SIGN_MESSAGE_ID,
                signature: 'signature123',
            })
            await waitPromise

            await expect(waitPromise).resolves.toEqual({
                signature: 'signature123',
            })
            await sdk.disconnect()
        })
    })

    describe('prepareExecute', () => {
        const prepareParams: PrepareExecuteParams = {
            commandId: 'prepare-execute-cmd',
            commands: { templateId: 'Template', choice: 'Choice' },
        }

        it('calls provider.request with method prepareExecute and the same params', async () => {
            const { sdk } = await createIntegrationSdk()
            await sdk.connect()
            const provider = sdk.getConnectedProvider()!
            const requestSpy = vi.spyOn(provider, 'request')

            await sdk.prepareExecute(prepareParams)

            expect(requestSpy).toHaveBeenCalledWith({
                method: 'prepareExecute',
                params: prepareParams,
            })

            await sdk.disconnect()
        })

        it('opens popup with userUrl returned from prepareExecute', async () => {
            const { sdk } = await createIntegrationSdk()
            await sdk.connect()
            vi.mocked(popup.open).mockClear()

            await sdk.prepareExecute(prepareParams)

            const expectedUserUrl = `${REMOTE_ORIGIN}${APPROVE_URL}`
            expect(popup.open).toHaveBeenCalledTimes(1)
            expect(popup.open).toHaveBeenCalledWith(expectedUserUrl)

            await sdk.disconnect()
        })

        it('sends http request with params', async () => {
            const { sdk } = await createIntegrationSdk()
            await sdk.connect()
            const fetchSpy = spyOnFetch()

            await sdk.prepareExecute(prepareParams)

            const call = findRpcCallFor(rpcCalls(fetchSpy), 'prepareExecute')
            assertRpcCallShape(call, 'prepareExecute', {
                params: prepareParams,
                authenticated: true,
            })

            await sdk.disconnect()
        })
    })

    describe('prepareExecuteAndWait', () => {
        const commandId = 'prepare-execute-and-wait-cmd'
        const prepareParams: PrepareExecuteParams = {
            commandId,
            commands: { templateId: 'Template', choice: 'Choice' },
        }

        // The async controller subscribes to txChanged inside
        // prepareExecuteAndWait. We push the SSE only once that
        // listener is in place, otherwise the executed event arrives
        // before anything is listening and the wait promise never settles
        async function waitForTxWaitListener(
            provider: Provider<DappRpcTypes>,
            baseline: number
        ): Promise<void> {
            const deadline = Date.now() + 10_000
            while (Date.now() < deadline) {
                if (listenerCount(provider, 'txChanged') > baseline) {
                    return
                }
                await new Promise((r) => setTimeout(r, 5))
            }
            throw new Error(
                'timeout waiting for prepareExecuteAndWait txChanged listener'
            )
        }

        function executedFor(cmd: string): TxChangedExecutedEvent {
            return {
                status: 'executed',
                commandId: cmd,
                payload: { updateId: 'u', completionOffset: 0 },
            }
        }

        it('calls provider with prepareExecuteAndWait, opens approval URL, resolves when matching executed arrives', async () => {
            const { sdk } = await createIntegrationSdk()
            await sdk.connect()
            vi.mocked(popup.open).mockClear()

            const provider = sdk.getConnectedProvider()!
            const requestSpy = vi.spyOn(provider, 'request')
            const baseline = listenerCount(provider, 'txChanged')

            const waitPromise = sdk.prepareExecuteAndWait(prepareParams)
            await waitForTxWaitListener(provider, baseline)

            expect(requestSpy).toHaveBeenCalledWith({
                method: 'prepareExecuteAndWait',
                params: prepareParams,
            })
            expect(popup.open).toHaveBeenCalledWith(
                `${REMOTE_ORIGIN}${APPROVE_URL}`
            )

            // Unrelated commandId is ignored, only the matching one resolves.
            await pushMockSseEvent('txChanged', executedFor('other-cmd'))
            await pushMockSseEvent('txChanged', executedFor(commandId))

            const executed = executedFor(commandId)
            await expect(waitPromise).resolves.toEqual({ tx: executed })

            await sdk.disconnect()
        })

        it('sends http request for `prepareExecute` forwarding params with commandId', async () => {
            const { sdk } = await createIntegrationSdk()
            await sdk.connect()
            const provider = sdk.getConnectedProvider()!
            const fetchSpy = spyOnFetch()

            const baseline = listenerCount(provider, 'txChanged')
            const waitPromise = sdk.prepareExecuteAndWait(prepareParams)
            await waitForTxWaitListener(provider, baseline)

            const calls = rpcCalls(fetchSpy)
            const call = findRpcCallFor(calls, 'prepareExecute')
            assertRpcCallShape(call, 'prepareExecute', {
                params: prepareParams,
                authenticated: true,
            })
            expect(
                calls.some((c) => c.body.method === 'prepareExecuteAndWait')
            ).toBe(false)

            await pushMockSseEvent('txChanged', executedFor(commandId))
            await waitPromise

            await sdk.disconnect()
        })

        it('uses a non-empty commandId when none is passed (so the wait can match the flow)', async () => {
            const { sdk } = await createIntegrationSdk()
            await sdk.connect()
            const provider = sdk.getConnectedProvider()!
            // Outer provider.request({ prepareExecuteAndWait }) sees only
            // the user params. The controller injects a generated commandId
            // on the inner prepareExecute call, so to inspect it we spy on
            // the underlying remoteProvider rather than the public provider
            const innerRequest = vi.spyOn(
                (
                    provider as unknown as {
                        remoteProvider: DappAsyncProvider
                    }
                ).remoteProvider,
                'request'
            )

            const params = { commands: { templateId: 'T', choice: 'C' } }
            const baseline = listenerCount(provider, 'txChanged')
            const waitPromise = sdk.prepareExecuteAndWait(params)
            await waitForTxWaitListener(provider, baseline)

            const lastPrepare = innerRequest.mock.calls.find(
                ([arg]) =>
                    (arg as { method?: string }).method === 'prepareExecute'
            )
            const generatedCommandId = (
                lastPrepare?.[0] as
                    | { params?: { commandId?: string } }
                    | undefined
            )?.params?.commandId

            expect(typeof generatedCommandId).toBe('string')
            // just for TS
            if (typeof generatedCommandId !== 'string')
                throw new Error('expected prepareExecute params.commandId')

            expect(generatedCommandId.length).toBeGreaterThan(0)

            await pushMockSseEvent('txChanged', executedFor(generatedCommandId))
            await waitPromise

            await sdk.disconnect()
        })

        it('rejects with TransactionFailed when txChanged is failed for that command', async () => {
            const { sdk } = await createIntegrationSdk()
            await sdk.connect()
            const provider = sdk.getConnectedProvider()!

            const baseline = listenerCount(provider, 'txChanged')
            const waitPromise = sdk.prepareExecuteAndWait(prepareParams)
            // Attach the rejection assertion synchronously so the rejection
            // from `waitPromise` isn't reported as unhandled while we set up
            // the SSE push below.
            const assertion = expect(waitPromise).rejects.toMatchObject({
                error: ErrorCode.TransactionFailed,
            })

            await waitForTxWaitListener(provider, baseline)
            await pushMockSseEvent('txChanged', {
                status: 'failed',
                commandId,
            })
            await assertion

            await sdk.disconnect()
        })
    })

    // Execute same set of tests for all event listener methods
    describe('event subscriptions', () => {
        const sampleWallet: Wallet = {
            primary: true,
            partyId: 'Party::integration',
            status: 'allocated',
            hint: 'Party',
            publicKey: 'pk',
            namespace: 'ns',
            networkId: 'network',
            signingProviderId: 'sp',
        }

        const txPending: TxChangedEvent = {
            status: 'pending',
            commandId: 'integration-command-id',
        }

        type EventListenerCase = {
            title: string
            eventKey:
                | 'statusChanged'
                | 'accountsChanged'
                | 'connected'
                | 'txChanged'
            subscribe: (sdk: DappSDK, h: ListenerFn) => Promise<void>
            unsubscribe: (sdk: DappSDK, h: ListenerFn) => Promise<void>
            buildEmitArg: () => unknown
        }

        const eventListenerCases: readonly EventListenerCase[] = [
            {
                title: 'onStatusChanged / removeOnStatusChanged',
                eventKey: 'statusChanged',
                subscribe: (sdk, h) =>
                    sdk.onStatusChanged(h as (e: StatusEvent) => void),
                unsubscribe: (sdk, h) =>
                    sdk.removeOnStatusChanged(h as (e: StatusEvent) => void),
                buildEmitArg: () => statusConnected(REMOTE_ORIGIN),
            },
            {
                title: 'onAccountsChanged / removeOnAccountsChanged',
                eventKey: 'accountsChanged',
                subscribe: (sdk, h) =>
                    sdk.onAccountsChanged(h as (batch: Wallet[]) => void),
                unsubscribe: (sdk, h) =>
                    sdk.removeOnAccountsChanged(h as (batch: Wallet[]) => void),
                buildEmitArg: () => [sampleWallet],
            },
            {
                title: 'onConnected / removeOnConnected',
                eventKey: 'connected',
                subscribe: (sdk, h) =>
                    sdk.onConnected(h as (e: StatusEvent) => void),
                unsubscribe: (sdk, h) =>
                    sdk.removeOnConnected(h as (e: StatusEvent) => void),
                buildEmitArg: () => connectResultConnected(REMOTE_ORIGIN),
            },
            {
                title: 'onTxChanged / removeOnTxChanged',
                eventKey: 'txChanged',
                subscribe: (sdk, h) =>
                    sdk.onTxChanged(h as (e: TxChangedEvent) => void),
                unsubscribe: (sdk, h) =>
                    sdk.removeOnTxChanged(h as (e: TxChangedEvent) => void),
                buildEmitArg: () => txPending,
            },
        ]

        it.each(eventListenerCases)(
            '$title: delegates to provider.on($eventKey, listener) and records the handler',
            async ({ eventKey, subscribe }) => {
                const { sdk } = await createIntegrationSdk()
                await sdk.connect()
                const provider = sdk.getConnectedProvider()!
                const onSpy = vi.spyOn(provider, 'on')

                const handler = vi.fn()
                await subscribe(sdk, handler)

                expect(onSpy).toHaveBeenCalledWith(eventKey, handler)
                expect(hasListener(provider, eventKey, handler)).toBe(true)
                expect(listenerCount(provider, eventKey)).toBeGreaterThan(0)

                await sdk.disconnect()
            }
        )

        it.each(eventListenerCases)(
            '$title: runs the callback when the event is emitted on the provider',
            async ({ eventKey, subscribe, buildEmitArg }) => {
                const { sdk } = await createIntegrationSdk()
                await sdk.connect()
                const provider = sdk.getConnectedProvider()!

                const received: unknown[] = []
                const handler = (arg: unknown) => received.push(arg)
                await subscribe(sdk, handler as ListenerFn)

                const payload = buildEmitArg()
                provider.emit(eventKey, payload)

                expect(received).toHaveLength(1)
                expect(received[0]).toEqual(payload)

                await sdk.disconnect()
            }
        )

        it.each(eventListenerCases)(
            '$title: unsubscribe drops the listener so emit does not invoke it',
            async ({ eventKey, subscribe, unsubscribe, buildEmitArg }) => {
                const { sdk } = await createIntegrationSdk()
                await sdk.connect()
                const provider = sdk.getConnectedProvider()!
                const removeSpy = vi.spyOn(provider, 'removeListener')

                const handler = vi.fn()
                await subscribe(sdk, handler)
                await unsubscribe(sdk, handler)

                expect(removeSpy).toHaveBeenCalledWith(eventKey, handler)
                expect(hasListener(provider, eventKey, handler)).toBe(false)

                provider.emit(eventKey, buildEmitArg())
                expect(handler).not.toHaveBeenCalled()

                await sdk.disconnect()
            }
        )
    })
})
