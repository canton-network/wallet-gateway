// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fixture, waitUntil } from '@open-wc/testing-helpers'
import { html } from 'lit'
import { PartyLevelRight } from '@canton-network/core-wallet-store'
import {
    TransactionApproveEvent,
    TransactionDeleteEvent,
} from '@canton-network/core-wallet-ui-components'
import {
    createMockUserClient,
    makeTransaction,
    makeWallet,
    mockRequest,
} from '../test-helpers.js'

const {
    mockCreateUserClient,
    showToast,
    handleErrorToast,
    setLocationHref,
    parsePreparedTransaction,
} = vi.hoisted(() => ({
    mockCreateUserClient: vi.fn(),
    showToast: vi.fn(),
    handleErrorToast: vi.fn(),
    setLocationHref: vi.fn(),
    parsePreparedTransaction: vi.fn(() => ({ summary: 'parsed' })),
}))

vi.mock('../index.js', () => ({}))
vi.mock('../navigation.js', () => ({ setLocationHref }))
vi.mock('../rpc-client.js', () => ({
    createUserClient: mockCreateUserClient,
}))
vi.mock('../state-manager.js', () => ({
    stateManager: {
        accessToken: { get: () => 'test-token' },
    },
}))
vi.mock('../utils.js', () => ({ showToast }))
vi.mock('@canton-network/core-tx-visualizer', () => ({
    parsePreparedTransaction,
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
import { ApproveUi } from './index.js'

async function flushMicrotasks(rounds = 20): Promise<void> {
    for (let i = 0; i < rounds; i++) {
        await Promise.resolve()
    }
}

function mockApproveState(
    transaction = makeTransaction(),
    wallet = makeWallet({
        primary: true,
        partyId: 'party::ns',
        rights: [PartyLevelRight.CanActAs],
    })
) {
    mockRequest.mockImplementation(async ({ method }) => {
        if (method === 'getTransaction') {
            return transaction
        }
        if (method === 'listWallets') {
            return [wallet]
        }
        if (method === 'sign') {
            return {
                status: 'signed',
                signature: 'sig',
                signedBy: 'key',
                partyId: wallet.partyId,
            }
        }
        if (method === 'execute') {
            return {}
        }
        if (method === 'deleteTransaction') {
            return undefined
        }
        return undefined
    })
}

describe('UserUiApprove', () => {
    beforeEach(() => {
        mockCreateUserClient.mockReset()
        mockRequest.mockReset()
        showToast.mockReset()
        handleErrorToast.mockReset()
        setLocationHref.mockReset()
        parsePreparedTransaction.mockClear()
        mockCreateUserClient.mockResolvedValue(createMockUserClient())
        vi.stubGlobal(
            'confirm',
            vi.fn(() => true)
        )
        history.replaceState({}, '', '?transactionId=tx-1')
    })

    afterEach(() => {
        document.body.innerHTML = ''
        vi.unstubAllGlobals()
        vi.useRealTimers()
    })

    it('loads transaction details from the URL and renders the detail view', async () => {
        mockApproveState()

        const el = await fixture<ApproveUi>(
            html`<user-ui-approve></user-ui-approve>`
        )

        await waitUntil(() => el.commandId === 'cmd-1', 'transaction loaded')

        expect(el.transactionId).toBe('tx-1')
        expect(el.txHash).toBe('hash-abc')
        expect(parsePreparedTransaction).toHaveBeenCalledWith(
            'prepared-tx-blob'
        )
        expect(
            el.shadowRoot?.querySelector('wg-transaction-detail')
        ).not.toBeNull()
    })

    it('shows read-only warning when primary wallet cannot submit', async () => {
        mockApproveState(
            makeTransaction(),
            makeWallet({
                primary: true,
                rights: [PartyLevelRight.CanReadAs],
            })
        )

        const el = await fixture<ApproveUi>(
            html`<user-ui-approve></user-ui-approve>`
        )

        await waitUntil(() => el.canSubmit === false)

        expect(el.walletCapabilityMessage).toContain('read-only')
        expect(el.shadowRoot?.querySelector('.alert-warning')).not.toBeNull()
    })

    it('executes signed transaction and navigates to activities', async () => {
        mockApproveState()

        const el = await fixture<ApproveUi>(
            html`<user-ui-approve></user-ui-approve>`
        )
        await waitUntil(() => el.commandId === 'cmd-1')

        vi.useFakeTimers()
        el.shadowRoot
            ?.querySelector('wg-transaction-detail')
            ?.dispatchEvent(new TransactionApproveEvent('cmd-1'))

        await flushMicrotasks()
        await vi.advanceTimersByTimeAsync(2000)

        expect(mockRequest).toHaveBeenCalledWith(
            expect.objectContaining({ method: 'execute' })
        )
        expect(showToast).toHaveBeenCalledWith(
            '',
            'Activity executed successfully',
            'success'
        )
        expect(setLocationHref).toHaveBeenCalledWith(
            expect.stringContaining('/activities')
        )
    })

    it('shows info toast when sign returns pending', async () => {
        mockApproveState()
        mockRequest.mockImplementation(async ({ method }) => {
            if (method === 'getTransaction') {
                return makeTransaction()
            }
            if (method === 'listWallets') {
                return [
                    makeWallet({
                        primary: true,
                        rights: [PartyLevelRight.CanActAs],
                    }),
                ]
            }
            if (method === 'sign') {
                return {
                    status: 'pending',
                    partyId: 'alice::1220abc',
                    externalTxId: 'ext-1',
                }
            }
            return undefined
        })

        const el = await fixture<ApproveUi>(
            html`<user-ui-approve></user-ui-approve>`
        )
        await waitUntil(() => el.commandId === 'cmd-1')

        el.shadowRoot
            ?.querySelector('wg-transaction-detail')
            ?.dispatchEvent(new TransactionApproveEvent('cmd-1'))

        await waitUntil(() => showToast.mock.calls.some((c) => c[2] === 'info'))

        expect(showToast).toHaveBeenCalledWith(
            'Activity pending',
            expect.stringContaining('external provider'),
            'info'
        )
        expect(setLocationHref).not.toHaveBeenCalled()
    })

    it('does not sign when wallet is read-only', async () => {
        mockApproveState(
            makeTransaction(),
            makeWallet({
                primary: true,
                rights: [PartyLevelRight.CanReadAs],
            })
        )

        const el = await fixture<ApproveUi>(
            html`<user-ui-approve></user-ui-approve>`
        )
        await waitUntil(() => el.canSubmit === false)

        el.shadowRoot
            ?.querySelector('wg-transaction-detail')
            ?.dispatchEvent(new TransactionApproveEvent('cmd-1'))

        await waitUntil(() => showToast.mock.calls.length > 0)

        expect(mockRequest).not.toHaveBeenCalledWith(
            expect.objectContaining({ method: 'sign' })
        )
        expect(showToast).toHaveBeenCalledWith(
            'Read-only wallet',
            expect.any(String),
            'error'
        )
    })

    it('deletes transaction when reject is confirmed', async () => {
        mockApproveState()

        const el = await fixture<ApproveUi>(
            html`<user-ui-approve></user-ui-approve>`
        )
        await waitUntil(() => el.commandId === 'cmd-1')

        vi.useFakeTimers()
        el.shadowRoot
            ?.querySelector('wg-transaction-detail')
            ?.dispatchEvent(new TransactionDeleteEvent('cmd-1'))

        await flushMicrotasks()
        await vi.advanceTimersByTimeAsync(2000)

        expect(mockRequest).toHaveBeenCalledWith(
            expect.objectContaining({ method: 'deleteTransaction' })
        )
        expect(showToast).toHaveBeenCalledWith(
            '',
            'Activity rejected successfully',
            'success'
        )
        expect(setLocationHref).toHaveBeenCalledWith(
            expect.stringContaining('/activities')
        )
    })

    it('does not delete when reject confirmation is cancelled', async () => {
        vi.stubGlobal(
            'confirm',
            vi.fn(() => false)
        )
        mockApproveState()

        const el = await fixture<ApproveUi>(
            html`<user-ui-approve></user-ui-approve>`
        )
        await waitUntil(() => el.commandId === 'cmd-1')

        el.shadowRoot
            ?.querySelector('wg-transaction-detail')
            ?.dispatchEvent(new TransactionDeleteEvent('cmd-1'))

        await new Promise((r) => setTimeout(r, 50))

        expect(mockRequest).not.toHaveBeenCalledWith(
            expect.objectContaining({ method: 'deleteTransaction' })
        )
    })
})
