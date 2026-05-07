// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { WalletPickerEntry } from '@canton-network/core-types'
import { html, LitElement, nothing } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('wallet-picker-card')
export class WalletPickerCard extends LitElement {
    @property({ type: Object })
    entry!: WalletPickerEntry

    @property({ type: Boolean })
    isRemovable: boolean = true

    private validate() {
        if (!this.entry) throw Error('Property `entry` must be passed')
    }

    connectedCallback(): void {
        this.validate()
    }

    renderIcon() {
        return this.entry.icon
            ? html` <img src=${this.entry.icon} alt=${this.entry.name} /> `
            : html`<svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
              >
                  ${this.entry.type === 'browser'
                      ? html`<rect
                                x="3"
                                y="11"
                                width="18"
                                height="11"
                                rx="2"
                                ry="2"
                            ></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />`
                      : html` <rect
                                x="2"
                                y="3"
                                width="20"
                                height="14"
                                rx="2"
                            ></rect>
                            <path d="M8 21h8"></path>
                            <path d="M12 17v4"></path>
                            <circle cx="12" cy="10" r="2" />`}
              </svg>`
    }

    renderRemoveButton() {
        if (!this.isRemovable || !this.entry.url) return nothing
        return html`
            <button
                class="wallet-remove-btn"
                type="button"
                aria-label="Remove custom wallet ${this.entry.name}"
                title="Remove custom wallet ${this.entry.name}"
                @click=${this.handleRemove}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                >
                    <path
                        d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"
                    />
                    <path
                        d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"
                    />
                </svg>
            </button>
        `
    }

    render() {
        return html`
            <div
                class="wallet-card"
                role="button"
                tabindex="0"
                aria-label="Connect to ${this.entry.name}"
                @click=${this.handleSelect}
            >
                <div class="wallet-icon">${this.renderIcon()}</div>
                <span class="wallet-name">${this.entry.name}</span>
                ${this.renderRemoveButton()}
            </div>
        `
    }

    private handleSelect() {
        this.dispatchEvent(
            new CustomEvent('select', {
                detail: this.entry,
            })
        )
        // TODO: trigger this.selectWallet(entry)
    }

    private handleRemove(event: Event) {
        event.stopPropagation()
        this.dispatchEvent(new CustomEvent('remove'))
        // TODO: trigger this.removeRecentGateway(entry.url!)
    }
}
