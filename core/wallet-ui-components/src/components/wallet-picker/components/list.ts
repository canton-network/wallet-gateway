// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { WalletPickerEntry } from '@canton-network/core-types'
import { html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('wallet-picker-list')
export class WalletPickerList extends LitElement {
    @property({ type: Array })
    entries: WalletPickerEntry[] = []

    render() {
        return html`<div class="view-container">
            <wallet-picker-header></wallet-picker-header>
            <div class="view-title">Connect a Wallet</div>
            <div class="wallet-list">
                ${
                    this.entries.length
                        ? this.entries.map(
                              (entry) => html`
                                  <wallet-picker-card
                                      .entry=${entry}
                                  ></wallet-picker-card>
                              `
                          )
                        : html`
                              <div class="status-view">
                                  <h3 class="empty-state">
                                      No wallets available
                                  </h3>
                                  <p>
                                      Install a Canton wallet extension or enter
                                      a Wallet Gateway URL below.
                                  </p>
                              </div>
                          `
                }
            </div>
            <div class="custom-url-section">
                <div class="custom-url-label">
                    <span>CUSTOM WALLET</span>
                    <span class="info-wrap">
                        <button
                            class="info-icon"
                            type="button"
                            aria-label="Wallet API help"
                        >
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" x2="12" y1="16" y2="12" />
                                <line x1="12" x2="12.01" y1="8" y2="8" />
                            </svg>
                        </button>
                        <div class="info-tooltip" role="tooltip">
                            Wallet not listed above? Enter its Wallet API. The
                            wallet must support CIP-103.
                        </div>
                    </span>
                </div>
                <div class="custom-url-row">
                    <input class="custom-url-input" type="text" placeholder="Wallet API URL" @keydown=${this.handleInputKeydown} />
                    <button class=btn-add" @click=${this.handleConnect}>Connect</button>
                </div>
            </div>
        </div>`
    }

    private handleConnect() {
        // TODO: call doConnect()
    }

    private handleInputKeydown(event: Event) {
        if ((event as KeyboardEvent).key === 'Enter') this.handleConnect()
    }
}
