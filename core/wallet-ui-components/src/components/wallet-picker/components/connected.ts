// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('wallet-picker-connected')
export class WalletPickerConnected extends LitElement {
    @property({ type: String })
    entryName: string = ''

    render() {
        return html`
            <div class="view-container">
                <wallet-picker-header></wallet-picker-header>
                <div class="view-title">Connected</div>

                <div class="status-view">
                    <div class="success-icon">
                        <svg
                            width="40"
                            height="40"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2.5"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        >
                            <path d="M20 6 9 17l-5-5" />
                        </svg>
                    </div>
                    <h3>Connected to ${this.entryName || 'wallet'}</h3>
                </div>
            </div>
        `
    }
}
