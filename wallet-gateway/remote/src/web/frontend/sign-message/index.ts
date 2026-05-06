// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import {
    BaseElement,
    handleErrorToast,
    toRelHref,
} from '@canton-network/core-wallet-ui-components'
import { createUserClient } from '../rpc-client'
import { stateManager } from '../state-manager'
import '../index'

@customElement('user-ui-sign-message')
export class UserUiSignMessage extends BaseElement {
    @state() accessor messageId = ''
    @state() accessor message = ''
    @state() accessor origin: string | null = null
    @state() accessor status = ''
    @state() accessor isApproving = false
    @state() accessor isDeleting = false
    @state() accessor disabled = false
    @state() accessor loadError: string | null = null
    @state() accessor isLoading = true

    private extractRpcErrorMessage(e: unknown): string | null {
        // HttpTransport throws { error: { code, message, data } } on non-2xx.
        // For JSON-RPC handlers, error.data often contains the JSON-RPC error response as a string.
        try {
            if (typeof e !== 'object' || e === null) return null
            if (!('error' in e)) return null
            const errObj = (e as { error?: unknown }).error
            if (typeof errObj !== 'object' || errObj === null) return null
            const data = (errObj as { data?: unknown }).data
            if (typeof data !== 'string') return null
            const parsed = JSON.parse(data) as unknown
            if (
                typeof parsed === 'object' &&
                parsed !== null &&
                'error' in parsed &&
                typeof (parsed as unknown as { error?: { message?: string } })
                    .error?.message === 'string'
            ) {
                return (parsed as unknown as { error?: { message?: string } })
                    .error?.message as string
            }
            return null
        } catch {
            return null
        }
    }

    private toastRpcError(e: unknown, fallbackMessage: string) {
        const extracted = this.extractRpcErrorMessage(e)
        if (extracted) {
            handleErrorToast(new Error(extracted), { message: extracted })
            return
        }
        handleErrorToast(e, { message: fallbackMessage })
    }

    static styles = [
        BaseElement.styles,
        css`
            :host {
                display: block;
                max-width: 900px;
                margin: 0 auto;
            }
            .card {
                border: 1px solid var(--wg-border-color, #e5e7eb);
                border-radius: 12px;
                padding: 16px;
                background: var(--wg-bg-color, #fff);
            }
            .message {
                white-space: pre-wrap;
                word-break: break-word;
                font-family:
                    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
                    'Liberation Mono', 'Courier New', monospace;
                font-size: 13px;
                line-height: 1.4;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 12px;
                margin-top: 8px;
            }
            .actions {
                margin-top: 16px;
                display: flex;
                gap: 12px;
            }
        `,
    ]

    connectedCallback(): void {
        super.connectedCallback()
        const url = new URL(window.location.href)
        this.messageId = url.searchParams.get('messageId') || ''
        void this.updateState()
    }

    private closeOrGoToActivities() {
        this.disabled = true
        const params = new URLSearchParams(window.location.search)
        const shouldClose = params.has('closeafteraction')
        setTimeout(() => {
            if (shouldClose && window.opener) {
                window.close()
            } else {
                window.location.href = toRelHref('/activities')
            }
        }, 500)
    }

    private async updateState() {
        this.isLoading = true
        this.loadError = null
        try {
            if (!this.messageId) {
                this.loadError = 'Message not found.'
                return
            }
            const userClient = await createUserClient(
                stateManager.accessToken.get()
            )
            const result = await userClient.request({
                method: 'getMessageToSign',
                params: { messageId: this.messageId },
            })
            this.message = result.message.message
            this.origin = result.message.origin ?? null
            this.status = result.message.status
        } catch (err) {
            console.error(err)
            // Most common case: messageId doesn't exist anymore / was deleted
            this.loadError = 'Message not found.'
        } finally {
            this.isLoading = false
        }
    }

    private async handleReject() {
        if (!confirm('Reject message signing request?')) return
        this.isDeleting = true
        try {
            const userClient = await createUserClient(
                stateManager.accessToken.get()
            )
            await userClient.request({
                method: 'deleteMessageToSign',
                params: { messageId: this.messageId },
            })
            this.closeOrGoToActivities()
        } catch (err) {
            console.error(err)
            this.toastRpcError(err, 'Error rejecting message')
        } finally {
            this.isDeleting = false
        }
    }

    private async handleApprove() {
        this.isApproving = true
        try {
            const userClient = await createUserClient(
                stateManager.accessToken.get()
            )
            await userClient.request({
                method: 'signMessage',
                params: { messageId: this.messageId },
            })
            this.closeOrGoToActivities()
        } catch (err) {
            console.error(err)
            this.toastRpcError(err, 'Error signing message')
        } finally {
            this.isApproving = false
        }
    }

    protected render() {
        if (this.isLoading) {
            return html`
                <div class="card">
                    <h1 class="h5 fw-semibold mb-2 text-body">Sign message</h1>
                    <p class="mb-0 text-body-secondary">Loading...</p>
                </div>
            `
        }

        if (this.loadError) {
            return html`
                <div class="card">
                    <h1 class="h5 fw-semibold mb-2 text-body">Sign message</h1>
                    <div class="alert alert-warning" role="alert">
                        ${this.loadError}
                    </div>
                    <a
                        class="btn btn-outline-secondary"
                        href=${toRelHref('/activities')}
                        >Back to activities</a
                    >
                </div>
            `
        }

        return html`
            <div class="card">
                <h1 class="h5 fw-semibold mb-2 text-body">Sign message</h1>
                ${this.origin
                    ? html`<p class="mb-2 text-body-secondary">
                          Requested by: <strong>${this.origin}</strong>
                      </p>`
                    : ''}

                <p class="mb-2 text-body-secondary">
                    Please confirm you want to sign this message with your
                    wallet.
                </p>
                <div class="message">${this.message}</div>

                <div class="actions">
                    <button
                        class="btn btn-outline-danger"
                        ?disabled=${this.disabled || this.isDeleting}
                        @click=${this.handleReject}
                    >
                        ${this.isDeleting ? 'Rejecting…' : 'Reject'}
                    </button>
                    <button
                        class="btn btn-primary"
                        ?disabled=${this.disabled || this.isApproving}
                        @click=${this.handleApprove}
                    >
                        ${this.isApproving ? 'Signing…' : 'Sign'}
                    </button>
                </div>
            </div>
        `
    }
}
