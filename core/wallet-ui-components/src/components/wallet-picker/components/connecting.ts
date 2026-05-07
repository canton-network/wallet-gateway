// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { WalletPickerEntry } from '@canton-network/core-types'
import { css, CSSResultGroup, html, LitElement } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'

@customElement('wallet-picker-connecting')
export class WalletPickerConnecting extends LitElement {
    static styles: CSSResultGroup = css`
        code {
            display: block;
            word-break: break-all;
            font-size: 11px;
            background: var(--wg-theme-background-color, #111);
            padding: 12px;
            border-radius: 6px;
            margin: 8px 0;
            max-height: 120px;
            overflow: auto;
            user-select: all;
            cursor: pointer;
        }

        img {
            display: block;
            margin: 0 auto 12px;
            width: 200px;
            height: 200px;
            border-radius: 8px;
        }

        button {
            padding: 8px 16px;
            border-radius: 4px;
            border: none;
            background: #646cff;
            color: white;
            cursor: pointer;
            font-size: 14px;
            margin-top: 4px;
        }
    `

    @property()
    wcUri = ''

    @property()
    wcQrDataUrl = ''

    @property({ type: Object })
    entry: WalletPickerEntry | null = null

    @state()
    copyButtonClicked = false

    render() {
        return html`
            <div class="view-container">
                <wallet-picker-header></wallet-picker-header>
                <div class="view-title">Connecting...</div>
                <div class="status-view">
                    ${this.wcUri
                        ? html`
                              ${this.wcQrDataUrl &&
                              html`
                                  <img
                                      src="${this.wcQrDataUrl}"
                                      alt="QR Code"
                                  />
                              `}
                              <h3>
                                  ${this.wcQrDataUrl
                                      ? 'Or paste this URI in your wallet'
                                      : 'Paste this URI in your wallet'}
                              </h3>
                              <code>${this.wcUri}</code>
                              <button @click=${this.handleCopy}>
                                  ${this.copyButtonClicked
                                      ? 'Copied!'
                                      : 'Copy URI'}
                              </button>
                          `
                        : html`
                              <div class="spinner"></div>
                              <h3>
                                  Connecting to ${this.entry?.name || ''}...
                              </h3>
                              <p>
                                  ${this.entry?.type === 'remote'
                                      ? 'Approve the connection in the wallet popup'
                                      : 'Approve the connection in your extension'}
                              </p>
                          `}
                </div>
            </div>
        `
    }

    private handleCopy() {
        navigator.clipboard.writeText(this.wcUri)
        this.copyButtonClicked = true
        setTimeout(() => {
            this.copyButtonClicked = false
        }, 2000)
    }
}
