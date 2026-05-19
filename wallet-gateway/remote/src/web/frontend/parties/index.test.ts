// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fixture, waitUntil } from '@open-wc/testing-helpers'
import { html } from 'lit'
import {
    WalletAllocateEvent,
    WalletSetPrimaryEvent,
} from '@canton-network/core-wallet-ui-components'
import {
    createMockUserClient,
    makeWallet,
    mockListWalletsFlow,
    mockRequest,
} from './test-helpers.js'

const { mockCreateUserClient, showToast, handleErrorToast, setLocationHref } =
    vi.hoisted(() => ({
        mockCreateUserClient: vi.fn(),
        showToast: vi.fn(),
        handleErrorToast: vi.fn(),
        setLocationHref: vi.fn(),
    }))

vi.mock('../index.js', () => ({}))
vi.mock('../navigation.js', () => ({ setLocationHref }))
vi.mock('../rpc-client.js', () => ({
    createUserClient: mockCreateUserClient,
}))
vi.mock('../state-manager.js', () => ({
    stateManager: {
        accessToken: { get: () => 'test-token' },
        networkId: { get: () => 'network1' },
    },
}))
vi.mock('../utils.js', () => ({ showToast }))
vi.mock('@canton-network/core-wallet-ui-components', async (importOriginal) => {
    const actual =
        await importOriginal<
            typeof import('@canton-network/core-wallet-ui-components')
        >()
    return {
        ...actual,
        handleErrorToast,
    }
})

import './index.js'
import { UserUiParties, WALLET_CREATION_STATUS_CODE } from './index.js'

describe('UserUiParties', () => {
    beforeEach(() => {
        mockCreateUserClient.mockReset()
        mockRequest.mockReset()
        showToast.mockReset()
        handleErrorToast.mockReset()
        setLocationHref.mockReset()
        mockCreateUserClient.mockResolvedValue(createMockUserClient())
        mockListWalletsFlow([
            makeWallet({
                partyId: 'init::ns',
                status: 'initialized',
            }),
            makeWallet({
                partyId: 'alloc::ns',
                status: 'allocated',
                primary: true,
            }),
        ])
    })

    afterEach(() => {
        document.body.innerHTML = ''
        vi.clearAllMocks()
    })

    it('renders parties header and wallet cards after loading wallets', async () => {
        const el = await fixture<UserUiParties>(
            html`<user-ui-parties></user-ui-parties>`
        )

        await waitUntil(
            () => el.wallets !== undefined && el.wallets.length === 2,
            'wallets loaded'
        )

        expect(el.shadowRoot?.querySelector('h1')?.textContent).toBe('Parties')
        expect(el.shadowRoot?.querySelectorAll('wg-wallet-card').length).toBe(2)
    })

    it('navigates to add party page when New is clicked', async () => {
        const el = await fixture<UserUiParties>(
            html`<user-ui-parties></user-ui-parties>`
        )
        await waitUntil(() => el.client !== null)

        const newBtn = el.shadowRoot?.querySelector(
            '.btn-add'
        ) as HTMLButtonElement
        newBtn.click()

        expect(setLocationHref).toHaveBeenCalledWith(
            expect.stringContaining('/parties/add/')
        )
    })

    it('shows success toast and clears createPartyStatus from URL when allocated', async () => {
        history.replaceState({}, '', '?createPartyStatus=1')
        const replaceState = vi.spyOn(history, 'replaceState')

        await fixture<UserUiParties>(html`<user-ui-parties></user-ui-parties>`)

        expect(showToast).toHaveBeenCalledWith(
            'Party created',
            'Your new party has been created successfully.',
            'success'
        )
        expect(replaceState).toHaveBeenCalled()
        replaceState.mockRestore()
    })

    it('shows info toast for WALLET_INITIALIZED status param', async () => {
        history.replaceState(
            {},
            '',
            `?createPartyStatus=${WALLET_CREATION_STATUS_CODE.WALLET_INITIALIZED}`
        )

        await fixture<UserUiParties>(html`<user-ui-parties></user-ui-parties>`)

        expect(showToast).toHaveBeenCalledWith(
            'Party creation pending',
            expect.stringContaining('Allocate'),
            'info'
        )
    })

    it('calls setPrimaryWallet when wallet-set-primary is dispatched', async () => {
        const el = await fixture<UserUiParties>(
            html`<user-ui-parties></user-ui-parties>`
        )
        await waitUntil(() => el.wallets !== undefined)

        mockRequest.mockImplementation(async ({ method }) => {
            if (method === 'listSessions') {
                return { sessions: [{ id: 's', network: { id: 'network1' } }] }
            }
            if (method === 'listWallets') {
                return el.wallets
            }
            if (method === 'setPrimaryWallet') {
                return undefined
            }
            return undefined
        })

        const wallet = makeWallet({ partyId: 'bob::ns', status: 'allocated' })
        const cards = el.shadowRoot?.querySelectorAll('wg-wallet-card')
        cards![1]!.dispatchEvent(new WalletSetPrimaryEvent(wallet))

        await waitUntil(() =>
            mockRequest.mock.calls.some(
                (c) => c[0]?.method === 'setPrimaryWallet'
            )
        )

        expect(mockRequest).toHaveBeenCalledWith({
            method: 'setPrimaryWallet',
            params: { partyId: 'bob::ns' },
        })
    })

    it('shows success toast when allocatePartyForWallet returns allocated', async () => {
        const el = await fixture<UserUiParties>(
            html`<user-ui-parties></user-ui-parties>`
        )
        await waitUntil(() => el.client !== null)

        mockRequest.mockImplementation(async ({ method }) => {
            if (method === 'listSessions') {
                return { sessions: [{ id: 's', network: { id: 'network1' } }] }
            }
            if (method === 'listWallets') {
                return []
            }
            if (method === 'allocatePartyForWallet') {
                return {
                    wallet: makeWallet({ status: 'allocated' }),
                }
            }
            return undefined
        })

        const wallet = makeWallet({ status: 'initialized' })
        const card = el.shadowRoot?.querySelector('wg-wallet-card')
        card!.dispatchEvent(new WalletAllocateEvent(wallet))

        await waitUntil(() => showToast.mock.calls.length > 0)

        expect(showToast).toHaveBeenCalledWith(
            'Party allocated',
            'Party has been successfully allocated.',
            'success'
        )
        expect(el.loading).toBe(false)
    })

    it('calls handleErrorToast when allocatePartyForWallet fails', async () => {
        const el = await fixture<UserUiParties>(
            html`<user-ui-parties></user-ui-parties>`
        )
        await waitUntil(() => el.client !== null)

        mockRequest.mockImplementation(async ({ method }) => {
            if (method === 'listSessions') {
                return { sessions: [{ id: 's', network: { id: 'network1' } }] }
            }
            if (method === 'listWallets') {
                return []
            }
            if (method === 'allocatePartyForWallet') {
                throw new Error('allocate failed')
            }
            return undefined
        })

        const card = el.shadowRoot?.querySelector('wg-wallet-card')
        card!.dispatchEvent(new WalletAllocateEvent(makeWallet()))

        await waitUntil(() => handleErrorToast.mock.calls.length > 0)

        expect(handleErrorToast).toHaveBeenCalled()
        expect(el.loading).toBe(false)
    })
})
