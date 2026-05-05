// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type {
    RpcTypes as DappRpcTypes,
    LedgerApiParams,
    PrepareExecuteParams,
    SignMessageParams,
    StatusEvent,
    TxChangedEvent,
    Wallet,
} from '@canton-network/core-wallet-dapp-rpc-client'
import type {
    AbstractProvider,
    Provider,
} from '@canton-network/core-splice-provider'
import {
    isSpliceMessageEvent,
    WalletEvent,
    type SpliceMessage,
} from '@canton-network/core-types'
import { popup } from '@canton-network/core-wallet-ui-components'
import { DappSDK } from '../sdk'
import * as storage from '../storage'
import {
    extensionConnectResult,
    extensionPrepareExecuteAndWaitResult,
    extensionStatusEvent,
    MOCK_EXTENSION_NETWORK_ID,
    MOCK_EXTENSION_PROVIDER_ID,
    MOCK_EXTENSION_TARGET,
    startMockExtension,
} from './mock-extension/mock-extension'

type ListenerFn = (...args: unknown[]) => void

function listenerCount(
    provider: Provider<DappRpcTypes>,
    event: string
): number {
    return (
        (provider as unknown as AbstractProvider<DappRpcTypes>).listeners[event]
            ?.length ?? 0
    )
}

function hasListener(
    provider: Provider<DappRpcTypes>,
    event: string,
    fn: ListenerFn
): boolean {
    return (
        (provider as unknown as AbstractProvider<DappRpcTypes>).listeners[
            event
        ]?.includes(fn) ?? false
    )
}

type SpliceRequestMsg = Extract<
    SpliceMessage,
    { type: WalletEvent.SPLICE_WALLET_REQUEST }
>

const isSpliceRequest = (msg: SpliceMessage): msg is SpliceRequestMsg =>
    msg.type === WalletEvent.SPLICE_WALLET_REQUEST

const isSpliceExtReady = (
    msg: SpliceMessage
): msg is Extract<
    SpliceMessage,
    { type: WalletEvent.SPLICE_WALLET_EXT_READY }
> => msg.type === WalletEvent.SPLICE_WALLET_EXT_READY

// Listen to postMessage traffic so tests can assert what the SDK emits to
// the extension. Return callback for clearing listeners between tests.
function captureSpliceMessages(): {
    messages: SpliceMessage[]
    stop: () => void
} {
    const messages: SpliceMessage[] = []
    const listener = (event: MessageEvent): void => {
        if (!isSpliceMessageEvent(event)) return
        messages.push(event.data)
    }
    window.addEventListener('message', listener)
    return {
        messages,
        stop: () => window.removeEventListener('message', listener),
    }
}

// Utils for browsing recorded postMessages
function findRequestFor(
    messages: SpliceMessage[],
    method: string
): SpliceRequestMsg {
    const match = messages.find(
        (msg): msg is SpliceRequestMsg =>
            isSpliceRequest(msg) && msg.request.method === method
    )
    if (!match) {
        throw new Error(
            `expected SPLICE_WALLET_REQUEST for "${method}", saw: [${messages
                .filter(isSpliceRequest)
                .map((r) => r.request.method)
                .join(', ')}]`
        )
    }
    return match
}

function assertRequestShape(
    request: SpliceRequestMsg,
    method: string,
    params?: unknown
): void {
    expect(request.type).toBe(WalletEvent.SPLICE_WALLET_REQUEST)
    expect(request.target).toBe(MOCK_EXTENSION_TARGET)
    expect(request.request.jsonrpc).toBe('2.0')
    expect(typeof request.request.id).toBe('string')
    expect(request.request.id).toBeTruthy()
    expect(request.request.method).toBe(method)
    if (params !== undefined) {
        expect(request.request.params).toEqual(params)
    }
}

// Build a DappSDK pointed at the mock gateway and run init() so the
// extension adapter is registered in the discovery client.
async function createIntegrationSdk(): Promise<DappSDK> {
    const sdk = new DappSDK({
        walletPicker: async (entries) => {
            const entry = entries.find(
                (e) => e.providerId === MOCK_EXTENSION_PROVIDER_ID
            )
            if (!entry) {
                throw new Error(
                    `extension adapter missing, got ${entries
                        .map((e) => e.providerId)
                        .join(',')}`
                )
            }
            return {
                providerId: entry.providerId,
                name: entry.name,
                type: entry.type,
            }
        },
    })
    await sdk.init({ defaultAdapters: [] })
    return sdk
}

describe('dApp SDK - sync', () => {
    let stopMockExtension: (() => void) | undefined

    beforeEach(() => {
        localStorage.clear()
        delete (window as Window & { canton?: unknown }).canton
        stopMockExtension = startMockExtension()
    })

    afterEach(() => {
        stopMockExtension?.()
        vi.restoreAllMocks()
    })

    describe('init', () => {
        it('registers the announced extension adapter on the discovery client', async () => {
            const sdk = new DappSDK()

            await sdk.init({ defaultAdapters: [] })

            const ids = (
                sdk as unknown as {
                    discovery: {
                        listAdapters(): Array<{ providerId: string }>
                    }
                }
            ).discovery
                .listAdapters()
                .map((a) => a.providerId)
            expect(ids).toContain(MOCK_EXTENSION_PROVIDER_ID)
        })

        it('restores the connected session on a fresh SDK from localStorage when the matching adapter is registered', async () => {
            // First SDK runs the full picker flow, which writes the
            // active providerId to localStorage.
            const sdk1 = await createIntegrationSdk()
            await sdk1.connect()
            expect(sdk1.getConnectedProvider()).not.toBeNull()
            expect(storage.getKernelDiscovery()?.providerId).toBe(
                MOCK_EXTENSION_PROVIDER_ID
            )

            // Second SDK simulates a page reload. init() alone should
            // re-register the extension and restore the session without
            // opening the picker.
            const sdk2 = new DappSDK()
            await sdk2.init({ defaultAdapters: [] })

            expect(sdk2.getConnectedProvider()).not.toBeNull()

            await sdk2.disconnect()
        })

        it('does not restore the session when no adapter matching the providerId persisted in localStorage', async () => {
            const sdk1 = await createIntegrationSdk()
            await sdk1.connect()
            expect(sdk1.getConnectedProvider()).not.toBeNull()

            // Drop the mock extension before the second init runs.
            // The persisted providerId now points at an adapter that
            // announce discovery cannot find, so restore won't succeed.
            stopMockExtension?.()
            stopMockExtension = undefined

            const sdk2 = await createIntegrationSdk()

            expect(sdk2.getConnectedProvider()).toBeNull()
            const ids = (
                sdk2 as unknown as {
                    discovery: {
                        listAdapters(): Array<{ providerId: string }>
                    }
                }
            ).discovery
                .listAdapters()
                .map((a) => a.providerId)
            expect(ids).not.toContain(MOCK_EXTENSION_PROVIDER_ID)
        })
    })

    describe('connect', () => {
        it('auto registers the extension via CANTON_ANNOUNCE_PROVIDER_EVENT and resolves with ConnectResult', async () => {
            const sdk = await createIntegrationSdk()

            const result = await sdk.connect()

            expect(result.isConnected).toBe(true)
            expect(result.isNetworkConnected).toBe(true)

            await sdk.disconnect()
        })

        it('persists discovery metadata', async () => {
            const sdk = await createIntegrationSdk()

            await sdk.connect()

            const discovery = storage.getKernelDiscovery()
            expect(discovery?.walletType).toBe('extension')
            expect(discovery?.providerId).toBe(MOCK_EXTENSION_PROVIDER_ID)

            await sdk.disconnect()
        })

        it('emits events SPLICE_WALLET_EXT_READY and SPLICE_WALLET_REQUEST with method `connect`', async () => {
            const { messages, stop } = captureSpliceMessages()
            const sdk = await createIntegrationSdk()

            try {
                await sdk.connect()
            } finally {
                stop()
            }

            const ready = messages.find(
                (m) => isSpliceExtReady(m) && m.target === MOCK_EXTENSION_TARGET
            )
            const req = findRequestFor(messages, 'connect')

            expect(ready).toBeDefined()
            assertRequestShape(req, 'connect')

            await sdk.disconnect()
        })
    })

    describe('disconnect', () => {
        it('delegates to provider.request', async () => {
            const sdk = await createIntegrationSdk()
            await sdk.connect()
            const provider = sdk.getConnectedProvider()!
            const requestSpy = vi.spyOn(provider, 'request')

            await sdk.disconnect()

            expect(requestSpy).toHaveBeenCalledWith({ method: 'disconnect' })
        })

        it('emits a SPLICE_WALLET_REQUEST with method `disconnect`', async () => {
            const sdk = await createIntegrationSdk()
            await sdk.connect()

            const { messages, stop } = captureSpliceMessages()
            try {
                await sdk.disconnect()
            } finally {
                stop()
            }

            const req = findRequestFor(messages, 'disconnect')
            assertRequestShape(req, 'disconnect')
        })

        it('clears persisted kernel discovery from localStorage', async () => {
            const sdk = await createIntegrationSdk()
            await sdk.connect()
            expect(storage.getKernelDiscovery()).toBeDefined()

            await sdk.disconnect()

            expect(storage.getKernelDiscovery()).toBeUndefined()
        })

        it('drops the active session so subsequent sdk calls throw', async () => {
            const sdk = await createIntegrationSdk()
            await sdk.connect()

            await sdk.disconnect()

            await expect(sdk.listAccounts()).rejects.toThrow(/Not connected/)
        })
    })

    describe('event subscriptions', () => {
        const sampleWallet: Wallet = {
            primary: true,
            partyId: 'Party::sync-integration',
            status: 'allocated',
            hint: 'h',
            publicKey: 'pk',
            namespace: 'ns',
            networkId: MOCK_EXTENSION_NETWORK_ID,
            signingProviderId: 'sp',
        }

        const txPending: TxChangedEvent = {
            status: 'pending',
            commandId: 'sync-integration-command-id',
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
                buildEmitArg: () => extensionStatusEvent(),
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
                buildEmitArg: () => extensionConnectResult(),
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
                const sdk = await createIntegrationSdk()
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
                const sdk = await createIntegrationSdk()
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
                const sdk = await createIntegrationSdk()
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

    describe('status', () => {
        it('delegates to provider.request', async () => {
            const sdk = await createIntegrationSdk()
            await sdk.connect()
            const provider = sdk.getConnectedProvider()!
            const requestSpy = vi.spyOn(provider, 'request')

            await sdk.status()

            expect(requestSpy).toHaveBeenCalledWith({ method: 'status' })

            await sdk.disconnect()
        })

        it('emits a SPLICE_WALLET_REQUEST with method `status`', async () => {
            const sdk = await createIntegrationSdk()
            await sdk.connect()

            const { messages, stop } = captureSpliceMessages()
            try {
                await sdk.status()
            } finally {
                stop()
            }

            const req = findRequestFor(messages, 'status')
            assertRequestShape(req, 'status')

            await sdk.disconnect()
        })
    })

    describe('listAccounts', () => {
        it('delegates to provider.request', async () => {
            const sdk = await createIntegrationSdk()
            await sdk.connect()
            const provider = sdk.getConnectedProvider()!
            const requestSpy = vi.spyOn(provider, 'request')

            await sdk.listAccounts()

            expect(requestSpy).toHaveBeenCalledWith({ method: 'listAccounts' })

            await sdk.disconnect()
        })

        it('emits a SPLICE_WALLET_REQUEST with method `listAccounts`', async () => {
            const sdk = await createIntegrationSdk()
            await sdk.connect()

            const { messages, stop } = captureSpliceMessages()
            try {
                await sdk.listAccounts()
            } finally {
                stop()
            }

            const req = findRequestFor(messages, 'listAccounts')
            assertRequestShape(req, 'listAccounts')

            await sdk.disconnect()
        })
    })

    describe('ledgerApi', () => {
        const params: LedgerApiParams = {
            requestMethod: 'get',
            resource: '/parties',
        }

        it('delegates to provider.request', async () => {
            const sdk = await createIntegrationSdk()
            await sdk.connect()
            const provider = sdk.getConnectedProvider()!
            const requestSpy = vi.spyOn(provider, 'request')

            await sdk.ledgerApi(params)

            expect(requestSpy).toHaveBeenCalledWith({
                method: 'ledgerApi',
                params,
            })

            await sdk.disconnect()
        })

        it('emits a SPLICE_WALLET_REQUEST with method `ledgerApi` and params', async () => {
            const sdk = await createIntegrationSdk()
            await sdk.connect()

            const { messages, stop } = captureSpliceMessages()
            try {
                await sdk.ledgerApi(params)
            } finally {
                stop()
            }

            const req = findRequestFor(messages, 'ledgerApi')
            assertRequestShape(req, 'ledgerApi', params)

            await sdk.disconnect()
        })
    })

    describe('getActiveNetwork', () => {
        // TODO make it sdk.getActiveNetwork() once it's added to SDK
        it.skip('delegates to provider.request', async () => {
            const sdk = await createIntegrationSdk()
            await sdk.connect()
            const provider = sdk.getConnectedProvider()!
            const requestSpy = vi.spyOn(provider, 'request')

            await provider.request({ method: 'getActiveNetwork' })

            expect(requestSpy).toHaveBeenCalledWith({
                method: 'getActiveNetwork',
            })

            await sdk.disconnect()
        })
    })

    describe('getPrimaryAccount', () => {
        // TODO make it sdk.getPrimaryAccount() once it's added to SDK
        it('delegates to provider.request', async () => {
            const sdk = await createIntegrationSdk()
            await sdk.connect()
            const provider = sdk.getConnectedProvider()!
            const requestSpy = vi.spyOn(provider, 'request')

            await provider.request({ method: 'getPrimaryAccount' })

            expect(requestSpy).toHaveBeenCalledWith({
                method: 'getPrimaryAccount',
            })

            await sdk.disconnect()
        })

        it('emits a SPLICE_WALLET_REQUEST with method `getPrimaryAccount`', async () => {
            const sdk = await createIntegrationSdk()
            await sdk.connect()
            const provider = sdk.getConnectedProvider()!

            const { messages, stop } = captureSpliceMessages()
            try {
                await provider.request({ method: 'getPrimaryAccount' })
            } finally {
                stop()
            }

            const req = findRequestFor(messages, 'getPrimaryAccount')
            assertRequestShape(req, 'getPrimaryAccount')

            await sdk.disconnect()
        })
    })

    describe('signMessage', () => {
        const params: SignMessageParams = { message: 'sync-sign-payload' }

        // TODO make it sdk.signMessage(params) once it's added to SDK
        it.skip('delegates to provider.request', async () => {
            const sdk = await createIntegrationSdk()
            await sdk.connect()
            const provider = sdk.getConnectedProvider()!
            const requestSpy = vi.spyOn(provider, 'request')

            await provider.request({ method: 'signMessage', params })

            expect(requestSpy).toHaveBeenCalledWith({
                method: 'signMessage',
                params,
            })

            await sdk.disconnect()
        })

        it('emits a SPLICE_WALLET_REQUEST with method `signMessage` and params', async () => {
            const sdk = await createIntegrationSdk()
            await sdk.connect()
            const provider = sdk.getConnectedProvider()!

            const { messages, stop } = captureSpliceMessages()
            try {
                await provider.request({ method: 'signMessage', params })
            } finally {
                stop()
            }

            const req = findRequestFor(messages, 'signMessage')
            assertRequestShape(req, 'signMessage', params)

            await sdk.disconnect()
        })
    })

    describe('prepareExecute', () => {
        const prepareParams: PrepareExecuteParams = {
            commandId: 'sync-prepare-execute-cmd',
            commands: { templateId: 'Template', choice: 'Choice' },
        }

        it('sdk.prepareExecute delegates to provider.request', async () => {
            const sdk = await createIntegrationSdk()
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

        it('does not open a popup', async () => {
            const sdk = await createIntegrationSdk()
            await sdk.connect()
            const openSpy = vi
                .spyOn(popup, 'open')
                .mockImplementation(() => undefined as unknown as Window)

            await sdk.prepareExecute(prepareParams)

            expect(openSpy).not.toHaveBeenCalled()

            await sdk.disconnect()
        })

        it('emits a SPLICE_WALLET_REQUEST with method `prepareExecute` and params', async () => {
            const sdk = await createIntegrationSdk()
            await sdk.connect()

            const { messages, stop } = captureSpliceMessages()
            try {
                await sdk.prepareExecute(prepareParams)
            } finally {
                stop()
            }

            const req = findRequestFor(messages, 'prepareExecute')
            assertRequestShape(req, 'prepareExecute', prepareParams)

            await sdk.disconnect()
        })
    })

    // Unlike the async flow where prepareExecuteAndWait has waiting logic in sdk-controller by listening to `txChanged`
    // and wallet receives only `prepareExecute` request, with sync api method `prepareExecuteAndWait` is passed to the wallet
    // and making promise pending is handled in WindowTransport between request and response post messages.
    // Wallet using sync API emits response after transaction is executed
    describe('prepareExecuteAndWait', () => {
        const commandId = 'sync-prepare-execute-and-wait-cmd'
        const prepareParams: PrepareExecuteParams = {
            commandId,
            commands: { templateId: 'Template', choice: 'Choice' },
        }

        it('delegates to provider.request forwarding method and params verbatim', async () => {
            const sdk = await createIntegrationSdk()
            await sdk.connect()
            const provider = sdk.getConnectedProvider()!
            const requestSpy = vi.spyOn(provider, 'request')

            await sdk.prepareExecuteAndWait(prepareParams)

            expect(requestSpy).toHaveBeenCalledWith({
                method: 'prepareExecuteAndWait',
                params: prepareParams,
            })

            await sdk.disconnect()
        })

        it('emits a SPLICE_WALLET_REQUEST postMessage with method `prepareExecuteAndWait` and params', async () => {
            const sdk = await createIntegrationSdk()
            await sdk.connect()

            const { messages, stop } = captureSpliceMessages()
            try {
                await sdk.prepareExecuteAndWait(prepareParams)
            } finally {
                stop()
            }

            const req = findRequestFor(messages, 'prepareExecuteAndWait')
            assertRequestShape(req, 'prepareExecuteAndWait', prepareParams)

            await sdk.disconnect()
        })

        it('returns a pending promise that only resolves once the extension posts the matching response', async () => {
            const sdk = await createIntegrationSdk()
            await sdk.connect()

            // Mock extension delays its response by 1s, so we can observe
            // the pending state before the wallet posts SPLICE_WALLET_RESPONSE.
            const promise = sdk.prepareExecuteAndWait(prepareParams)
            let promiseState: 'pending' | 'fulfilled' | 'rejected' = 'pending'
            promise.then(
                () => {
                    promiseState = 'fulfilled'
                },
                () => {
                    promiseState = 'rejected'
                }
            )

            await new Promise((r) => setTimeout(r, 100))
            expect(promiseState).toBe('pending')

            await expect(promise).resolves.toEqual(
                extensionPrepareExecuteAndWaitResult(commandId)
            )
            expect(promiseState).toBe('fulfilled')

            await sdk.disconnect()
        })
    })
})
