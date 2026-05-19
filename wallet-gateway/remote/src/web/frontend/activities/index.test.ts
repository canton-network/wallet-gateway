// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fixture, waitUntil } from '@open-wc/testing-helpers'
import { html } from 'lit'
import {
    PageChangeEvent,
    TransactionCardReviewEvent,
} from '@canton-network/core-wallet-ui-components'
import {
    createMockUserClient,
    makeTransaction,
    mockRequest,
} from '../test-helpers.js'

const {
    mockCreateUserClient,
    handleErrorToast,
    setLocationHref,
    parsePreparedTransaction,
} = vi.hoisted(() => ({
    mockCreateUserClient: vi.fn(),
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
import { UserUiActivities } from './index.js'

function makeTransactions(count: number) {
    return Array.from({ length: count }, (_, i) =>
        makeTransaction({
            id: `tx-${i + 1}`,
            commandId: `cmd-${i + 1}`,
        })
    )
}

describe('UserUiActivities', () => {
    beforeEach(() => {
        mockCreateUserClient.mockReset()
        mockRequest.mockReset()
        handleErrorToast.mockReset()
        setLocationHref.mockReset()
        parsePreparedTransaction.mockClear()
        mockCreateUserClient.mockResolvedValue(createMockUserClient())
    })

    afterEach(() => {
        document.body.innerHTML = ''
    })

    it('renders activities header and transaction cards after loading', async () => {
        mockRequest.mockResolvedValue({
            transactions: makeTransactions(2),
        })

        const el = await fixture<UserUiActivities>(
            html`<user-ui-activities></user-ui-activities>`
        )

        await waitUntil(
            () => el.transactions.length === 2,
            'transactions loaded'
        )

        expect(el.shadowRoot?.querySelector('h1')?.textContent).toBe(
            'Activities'
        )
        expect(
            el.shadowRoot?.querySelectorAll('wg-transaction-card').length
        ).toBe(2)
        expect(el.loading).toBe(false)
    })

    it('shows empty state when there are no transactions', async () => {
        mockRequest.mockResolvedValue({ transactions: [] })

        const el = await fixture<UserUiActivities>(
            html`<user-ui-activities></user-ui-activities>`
        )

        await waitUntil(() => !el.loading)

        expect(el.shadowRoot?.textContent).toContain('No activities yet')
    })

    it('shows pagination when there are more than one page of activities', async () => {
        mockRequest.mockResolvedValue({
            transactions: makeTransactions(5),
        })

        const el = await fixture<UserUiActivities>(
            html`<user-ui-activities></user-ui-activities>`
        )

        await waitUntil(() => el.transactions.length === 5)

        expect(el.shadowRoot?.querySelector('wg-pagination')).not.toBeNull()
        expect(el.pagedTransactions.length).toBe(4)
    })

    it('updates current page when pagination emits page-change', async () => {
        mockRequest.mockResolvedValue({
            transactions: makeTransactions(5),
        })

        const el = await fixture<UserUiActivities>(
            html`<user-ui-activities></user-ui-activities>`
        )
        await waitUntil(() => el.transactions.length === 5)

        const pagination = el.shadowRoot?.querySelector('wg-pagination')
        pagination!.dispatchEvent(new PageChangeEvent(2))

        expect(el.currentPage).toBe(2)
        expect(el.pagedTransactions[0]?.id).toBe('tx-5')
    })

    it('navigates to approve page when a card emits transaction-review', async () => {
        mockRequest.mockResolvedValue({
            transactions: makeTransactions(1),
        })

        const el = await fixture<UserUiActivities>(
            html`<user-ui-activities></user-ui-activities>`
        )
        await waitUntil(() => el.transactions.length === 1)

        const card = el.shadowRoot?.querySelector('wg-transaction-card')
        card!.dispatchEvent(new TransactionCardReviewEvent('tx-1', 'cmd-1'))

        expect(setLocationHref).toHaveBeenCalledWith(
            expect.stringContaining('transactionId=tx-1')
        )
        expect(setLocationHref).toHaveBeenCalledWith(
            expect.stringContaining('/approve')
        )
    })

    it('calls handleErrorToast when listing transactions fails', async () => {
        mockRequest.mockRejectedValue(new Error('list failed'))

        const el = await fixture<UserUiActivities>(
            html`<user-ui-activities></user-ui-activities>`
        )

        await waitUntil(() => handleErrorToast.mock.calls.length > 0)

        expect(handleErrorToast).toHaveBeenCalled()
        expect(el.loading).toBe(false)
        expect(el.transactions).toEqual([])
    })
})
