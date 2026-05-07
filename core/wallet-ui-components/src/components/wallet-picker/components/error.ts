// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('wallet-picker-error')
export class WalletPickerError extends LitElement {
    @property() message = ''

    render() {
        return html`
            <div class="view-container">
                <wallet-picker-header></wallet-picker-header>
                <div class="view-title">Connection Failed</div>
                <div class="status-view">
                    <div class="error-icon">
                        <svg
                            width="40"
                            height="40"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" x2="12" y1="8" y2="12" />
                            <line x1="12" x2="12.01" y1="16" y2="16" />
                        </svg>
                    </div>
                    <h3>Failed to connect</h3>
                    <p>${this.message || 'An unexpected error occurred'}</p>

                    <div class="btn-row">
                        <button
                            class="btn-primary"
                            type="button"
                            @click=${this.goBackToList}
                        >
                            Try Again
                        </button>

                        <button
                            class="btn-secondary"
                            type="button"
                            @click=${this.cancel}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `
    }

    private goBackToList() {
        this.dispatchEvent(new CustomEvent('retry'))
    }

    private cancel() {
        window.close()
    }
}
