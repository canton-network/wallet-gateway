// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import {
    BaseElement,
    handleErrorToast,
    toRelHref,
} from '@canton-network/core-wallet-ui-components'
import {
    ParsedTransactionInfo,
    parsePreparedTransaction,
} from '@canton-network/core-tx-visualizer'
import { createUserClient } from '../rpc-client'
import { setLocationHref } from '../navigation.js'
import { stateManager } from '../state-manager'
import '../index'
import { ACTIVITIES_PAGE_REDIRECT } from '../constants'
import { showToast } from '../utils'
import { SignResult } from '@canton-network/core-wallet-user-rpc-client'
import { PartyLevelRight } from '@canton-network/core-wallet-store'

@customElement('user-ui-approve')
export class ApproveUi extends BaseElement {
    @state() accessor isApproving = false
    @state() accessor isDeleting = false
    @state() accessor disabled = false
    @state() accessor transactionId = ''
    @state() accessor commandId = ''
    @state() accessor partyId = ''
    @state() accessor txHash = ''
    @state() accessor tx = ''
    @state() accessor txParsed: ParsedTransactionInfo | null = null
    @state() accessor status = ''
    @state() accessor createdAt: string | null = null
    @state() accessor signedAt: string | null = null
    @state() accessor origin: string | null = null
    @state() accessor canSubmit = true
    @state() accessor walletCapabilityMessage: string | null = null

    connectedCallback(): void {
        super.connectedCallback()
        const url = new URL(window.location.href)
        this.transactionId = url.searchParams.get('transactionId') || ''
        void this.updateState()
    }

    private closeOrGoToList() {
        // Disable action buttons while leaving the page
        this.disabled = true
        const params = new URLSearchParams(window.location.search)
        // if approve view was triggered via dApp, close it after action
        // otherwise go back to activity list
        const shouldClose = params.has('closeafteraction')
        setTimeout(() => {
            if (shouldClose && window.opener) {
                window.close()
            } else {
                setLocationHref(toRelHref(ACTIVITIES_PAGE_REDIRECT))
            }
        }, 2000)
    }

    private async updateState() {
        const userClient = await createUserClient(
            stateManager.accessToken.get()
        )

        const result = await userClient.request({
            method: 'getTransaction',
            params: { transactionId: this.transactionId },
        })
        this.transactionId = result.id
        this.commandId = result.commandId
        this.txHash = result.preparedTransactionHash
        this.tx = result.preparedTransaction
        this.status = result.status
        this.createdAt = result.createdAt || null
        this.signedAt = result.signedAt || null
        this.origin = result.origin || null

        try {
            this.txParsed = parsePreparedTransaction(this.tx)
        } catch (error) {
            console.error('Error parsing prepared transaction:', error)
            this.txParsed = null
        }

        const wallets = await userClient.request({
            method: 'listWallets',
            params: {},
        })
        const primaryWallet = wallets.find((w) => w.primary === true)
        this.partyId = primaryWallet?.partyId || ''
        const rights = primaryWallet?.rights
        const submitCapable = !!(
            rights?.includes(PartyLevelRight.CanActAs) ||
            rights?.includes(PartyLevelRight.CanExecuteAs)
        )
        this.canSubmit = submitCapable
        this.walletCapabilityMessage = submitCapable
            ? null
            : 'The selected wallet is read-only for submission (no CanActAs/CanExecuteAs right).'
    }

    private async handleReject() {
        if (!confirm(`Reject pending activity "${this.commandId}"?`)) {
            return
        }

        this.isDeleting = true

        try {
            const userClient = await createUserClient(
                stateManager.accessToken.get()
            )
            await userClient.request({
                method: 'deleteTransaction',
                params: { transactionId: this.transactionId },
            })

            showToast('', 'Activity rejected successfully', 'success')
            this.closeOrGoToList()
        } catch (err) {
            console.error(err)
            handleErrorToast(err, { message: 'Error rejecting activity' })
        } finally {
            this.isDeleting = false
        }
    }

    private async handleApprove() {
        if (!this.canSubmit) {
            showToast(
                'Read-only wallet',
                'This wallet can read but cannot submit transactions. Switch to a wallet with CanActAs or CanExecuteAs.',
                'error'
            )
            return
        }
        this.isApproving = true

        try {
            const userClient = await createUserClient(
                stateManager.accessToken.get()
            )
            const result: SignResult = await userClient.request({
                method: 'sign',
                params: {
                    transactionId: this.transactionId,
                    partyId: this.partyId,
                },
            })

            if (result.status === 'pending') {
                showToast(
                    'Activity pending',
                    'Complete signing in your external provider, then click Approve to finish.',
                    'info'
                )
                await this.updateState()
                return
            }

            if (result.status === 'signed') {
                await userClient.request({
                    method: 'execute',
                    params: {
                        signature: result.signature,
                        signedBy: result.signedBy,
                        transactionId: this.transactionId,
                        partyId: this.partyId,
                    },
                })

                showToast('', 'Activity executed successfully', 'success')
                this.closeOrGoToList()
                return
            }

            const message =
                result.status === 'rejected'
                    ? 'Activity was rejected'
                    : 'Activity failed'
            showToast('', message, 'error')
            await this.updateState()
        } catch (err) {
            console.error(err)
            handleErrorToast(err, { message: 'Error executing activity' })
        } finally {
            this.isApproving = false
        }
    }

    protected render() {
        return html`
            ${this.walletCapabilityMessage
                ? html`<div class="alert alert-warning" role="alert">
                      ${this.walletCapabilityMessage}
                  </div>`
                : ''}
            <wg-transaction-detail
                .commandId=${this.commandId}
                .status=${this.status}
                .txHash=${this.txHash}
                .tx=${this.tx}
                .parsed=${this.txParsed}
                .createdAt=${this.createdAt}
                .signedAt=${this.signedAt}
                .origin=${this.origin}
                .backHref=${toRelHref(ACTIVITIES_PAGE_REDIRECT)}
                .isApproving=${this.isApproving}
                .isDeleting=${this.isDeleting}
                .disabled=${this.disabled}
                @transaction-approve=${this.handleApprove}
                @transaction-delete=${this.handleReject}
            ></wg-transaction-detail>
        `
    }
}
