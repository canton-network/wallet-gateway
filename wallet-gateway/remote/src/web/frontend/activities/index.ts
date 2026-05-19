// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'

import {
    BaseElement,
    PageChangeEvent,
    TransactionCardReviewEvent,
    handleErrorToast,
    toRelHref,
} from '@canton-network/core-wallet-ui-components'
import {
    ParsedTransactionInfo,
    parsePreparedTransaction,
} from '@canton-network/core-tx-visualizer'

import { createUserClient } from '../rpc-client'
import { setLocationHref } from '../navigation.js'

import '../index'
import { stateManager } from '../state-manager'
import { Transaction } from '@canton-network/core-wallet-user-rpc-client'

@customElement('user-ui-activities')
export class UserUiActivities extends BaseElement {
    @state()
    accessor transactions: Transaction[] = []

    @state()
    accessor parsedTransactions: Map<string, ParsedTransactionInfo | null> =
        new Map()

    @state()
    accessor loading = false

    @state()
    accessor currentPage = 1

    private readonly pageSize = 4

    static styles = [
        BaseElement.styles,
        css`
            :host {
                display: block;
                max-width: 900px;
                margin: 0 auto;
            }

            .activity-list {
                display: flex;
                flex-direction: column;
                gap: var(--wg-space-4);
            }

            .page-header {
                margin-bottom: var(--wg-space-4);
            }

            .pagination-wrap {
                margin-top: var(--wg-space-8);
                display: flex;
                justify-content: center;
            }
        `,
    ]

    private get pagedTransactions() {
        const start = (this.currentPage - 1) * this.pageSize
        return this.transactions.slice(start, start + this.pageSize)
    }

    protected render() {
        return html`
            <div class="page-header">
                <h1 class="h4 fw-semibold mb-0 text-body">Activities</h1>
            </div>

            ${this.loading && !this.transactions.length
                ? html`<p class="mb-0 text-body-secondary">
                      Loading activities...
                  </p>`
                : this.transactions.length
                  ? html`
                        <div class="activity-list">
                            ${this.pagedTransactions.map(
                                (tx) => html`
                                    <wg-transaction-card
                                        .transactionId=${tx.id}
                                        .commandId=${tx.commandId}
                                        .externalTxId=${tx.externalTxId ?? null}
                                        .status=${tx.status}
                                        .parsed=${this.parsedTransactions.get(
                                            tx.id
                                        ) || null}
                                        .createdAt=${tx.createdAt ?? null}
                                        .signedAt=${tx.signedAt ?? null}
                                        .origin=${tx.origin ?? null}
                                        .loading=${this.loading}
                                        @transaction-review=${this._onReview}
                                    ></wg-transaction-card>
                                `
                            )}
                        </div>

                        ${this.transactions.length > this.pageSize
                            ? html`
                                  <div class="pagination-wrap">
                                      <wg-pagination
                                          .total=${this.transactions.length}
                                          .pageSize=${this.pageSize}
                                          .page=${this.currentPage}
                                          @page-change=${this._onPageChange}
                                      ></wg-pagination>
                                  </div>
                              `
                            : ''}
                    `
                  : html`<p class="mb-0 text-body-secondary">
                        No activities yet.
                    </p>`}
        `
    }

    connectedCallback(): void {
        super.connectedCallback()
        this.updateTransactions()
    }

    private _onReview(e: TransactionCardReviewEvent) {
        const approveHref = toRelHref('/approve')
        setLocationHref(`${approveHref}?transactionId=${e.transactionId}`)
    }

    private _onPageChange(e: PageChangeEvent) {
        this.currentPage = e.page
    }

    private async updateTransactions() {
        this.loading = true
        try {
            const userClient = await createUserClient(
                stateManager.accessToken.get()
            )
            const result = await userClient.request({
                method: 'listTransactions',
            })
            this.transactions = result.transactions || []
            this.parsedTransactions = new Map(
                this.transactions.map((tx) => {
                    try {
                        return [
                            tx.id,
                            parsePreparedTransaction(tx.preparedTransaction),
                        ] as const
                    } catch (error) {
                        console.error('Error parsing transaction:', error)
                        return [tx.id, null] as const
                    }
                })
            )

            const maxPage = Math.max(
                1,
                Math.ceil(this.transactions.length / this.pageSize)
            )
            if (this.currentPage > maxPage) {
                this.currentPage = maxPage
            }
        } catch (error) {
            handleErrorToast(error)
        } finally {
            this.loading = false
        }
    }
}
