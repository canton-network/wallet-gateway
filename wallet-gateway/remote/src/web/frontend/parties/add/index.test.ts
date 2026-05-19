// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fixture, waitUntil } from '@open-wc/testing-helpers'
import { html } from 'lit'
import { WalletCreateEvent } from '@canton-network/core-wallet-ui-components'
import {
    createMockUserClient,
    makeWallet,
    mockRequest,
} from '../test-helpers.js'

const { mockCreateUserClient, handleErrorToast, setLocationHref } = vi.hoisted(
    () => ({
        mockCreateUserClient: vi.fn(),
        handleErrorToast: vi.fn(),
        setLocationHref: vi.fn(),
    })
)

vi.mock('../../index.js', () => ({}))
vi.mock('../../navigation.js', () => ({ setLocationHref }))
vi.mock('../../rpc-client.js', () => ({
    createUserClient: mockCreateUserClient,
}))
vi.mock('../../state-manager.js', () => ({
    stateManager: {
        accessToken: { get: () => 'test-token' },
        networkId: { get: () => 'network1' },
    },
}))
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
import { UserUiAddParty } from './index.js'
import { WALLET_CREATION_STATUS_CODE } from '../index'

describe('UserUiAddParty', () => {
    beforeEach(() => {
        mockCreateUserClient.mockReset()
        mockRequest.mockReset()
        handleErrorToast.mockReset()
        setLocationHref.mockReset()
        mockCreateUserClient.mockResolvedValue(createMockUserClient())
        mockRequest.mockImplementation(async ({ method }) => {
            if (method === 'listSessions') {
                return {
                    sessions: [
                        {
                            id: 'sess-1',
                            network: { id: 'network1', name: 'Test' },
                        },
                    ],
                }
            }
            return undefined
        })
    })

    afterEach(() => {
        document.body.innerHTML = ''
        vi.clearAllMocks()
    })

    it('renders create party header and form', async () => {
        const el = await fixture<UserUiAddParty>(
            html`<user-ui-add-party></user-ui-add-party>`
        )

        await waitUntil(() => el.networkIds.length === 1)

        expect(el.shadowRoot?.querySelector('h1')?.textContent).toBe(
            'Create a new party'
        )
        expect(
            el.shadowRoot?.querySelector('wg-wallet-create-form')
        ).not.toBeNull()
        expect(el.networkIds).toEqual(['network1'])
    })

    it('navigates back to parties list when Back is clicked', async () => {
        const el = await fixture<UserUiAddParty>(
            html`<user-ui-add-party></user-ui-add-party>`
        )
        await waitUntil(() => el.networkIds.length === 1)

        const backBtn = el.shadowRoot?.querySelector(
            '.page-header button'
        ) as HTMLButtonElement
        backBtn.click()

        expect(setLocationHref).toHaveBeenCalledWith(
            expect.stringContaining('/parties')
        )
    })

    it('redirects to parties with allocated status after successful create', async () => {
        const el = await fixture<UserUiAddParty>(
            html`<user-ui-add-party></user-ui-add-party>`
        )
        await waitUntil(() => el.networkIds.length === 1)

        mockRequest.mockImplementation(async ({ method }) => {
            if (method === 'listSessions') {
                return {
                    sessions: [
                        { id: 's', network: { id: 'network1', name: 'n' } },
                    ],
                }
            }
            if (method === 'createWallet') {
                return { wallet: makeWallet({ status: 'allocated' }) }
            }
            return undefined
        })

        const form = el.shadowRoot?.querySelector('wg-wallet-create-form')
        form!.dispatchEvent(new WalletCreateEvent('my-party', 'internal', true))

        await waitUntil(() => setLocationHref.mock.calls.length > 0)

        expect(setLocationHref).toHaveBeenCalledWith(
            expect.stringContaining(
                `createPartyStatus=${WALLET_CREATION_STATUS_CODE.WALLET_ALLOCATED}`
            )
        )
        expect(setLocationHref).toHaveBeenCalledWith(
            expect.stringContaining('/parties/')
        )
    })

    it('redirects with initialized status when wallet is not yet allocated', async () => {
        const el = await fixture<UserUiAddParty>(
            html`<user-ui-add-party></user-ui-add-party>`
        )
        await waitUntil(() => el.networkIds.length === 1)

        mockRequest.mockImplementation(async ({ method }) => {
            if (method === 'createWallet') {
                return { wallet: makeWallet({ status: 'initialized' }) }
            }
            if (method === 'listSessions') {
                return {
                    sessions: [
                        { id: 's', network: { id: 'network1', name: 'n' } },
                    ],
                }
            }
            return undefined
        })

        const form = el.shadowRoot?.querySelector('wg-wallet-create-form')
        form!.dispatchEvent(
            new WalletCreateEvent('pending-party', 'internal', false)
        )

        await waitUntil(() => setLocationHref.mock.calls.length > 0)

        expect(setLocationHref).toHaveBeenCalledWith(
            expect.stringContaining(
                WALLET_CREATION_STATUS_CODE.WALLET_INITIALIZED
            )
        )
    })

    it('calls handleErrorToast and clears loading when createWallet fails', async () => {
        const el = await fixture<UserUiAddParty>(
            html`<user-ui-add-party></user-ui-add-party>`
        )
        await waitUntil(() => el.networkIds.length === 1)

        mockRequest.mockImplementation(async ({ method }) => {
            if (method === 'listSessions') {
                return {
                    sessions: [
                        { id: 's', network: { id: 'network1', name: 'n' } },
                    ],
                }
            }
            if (method === 'createWallet') {
                throw new Error('create failed')
            }
            return undefined
        })

        el.loading = true
        const form = el.shadowRoot?.querySelector('wg-wallet-create-form')
        form!.dispatchEvent(
            new WalletCreateEvent('fail-party', 'internal', false)
        )

        await waitUntil(() => handleErrorToast.mock.calls.length > 0)

        expect(handleErrorToast).toHaveBeenCalled()
        expect(el.loading).toBe(false)
    })
})
