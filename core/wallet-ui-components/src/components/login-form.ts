// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { css, html, PropertyValues } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import './back-link.js'
import { BaseElement } from '../internal/base-element.js'
import { Network, Idp } from '@canton-network/core-wallet-user-rpc-client'
import { chevronDownIcon } from '../icons'
import cantonLogo from '../../images/logos/canton-logo.png'

/** Emitted when the user clicks the Connect button */
export class LoginConnectEvent extends Event {
    constructor(
        public selectedNetwork: Network,
        public selectedIdp: Idp,
        public clientId: string
    ) {
        super('login-connect', { bubbles: true, composed: true })
    }
}

/** Emitted when the user clicks the Back link */
export class LoginBackEvent extends Event {
    constructor() {
        super('login-back', {
            bubbles: true,
            composed: true,
            cancelable: true,
        })
    }
}

@customElement('wg-login-form')
export class WgLoginForm extends BaseElement {
    /** Available networks to show in the dropdown */
    @property({ type: Array }) networks: Network[] = []

    /** Available identity providers */
    @property({ type: Array }) idps: Idp[] = []

    @property({ type: Boolean }) connecting = false
    @property({ type: String }) backHref = '/'

    @state() accessor selectedNetwork: Network | null = null
    @state() accessor selectedIdp: Idp | null = null
    @state() accessor message: string | null = null
    @state() accessor messageType: 'error' | 'info' | null = null

    static styles = [
        BaseElement.styles,
        css`
            :host {
                display: block;
                min-height: 100dvh;
            }

            .screen {
                min-height: 100dvh;
                display: flex;
                flex-direction: column;
            }

            .top-bar {
                height: 44px;
                display: flex;
                align-items: center;
                padding: 0 14px;
                border-bottom: 1px solid #d1d5db;
            }

            .top-logo {
                width: 24px;
                height: 24px;
                object-fit: contain;
                display: block;
            }

            .content {
                flex: 1;
                padding: 14px 16px 0;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .title-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                margin-bottom: 20px;
            }

            .select-wrap {
                position: relative;
            }

            .network-select,
            .client-id-input {
                width: 100%;
                border: 1px solid #d4d4d8;
                border-radius: 4px;
                background: var(--wg-input-bg);
                padding: 12px 40px 12px 14px;
                font: inherit;
                line-height: var(--bs-body-line-height);
                outline: none;
                appearance: none;
            }

            .network-select:focus,
            .client-id-input:focus {
                border-color: var(--wg-input-border-focus);
                box-shadow: 0 0 0 3px rgba(var(--wg-accent-rgb), 0.12);
            }

            .select-chevron {
                position: absolute;
                right: 12px;
                top: 50%;
                transform: translateY(-50%);
                color: #222;
                pointer-events: none;
                display: inline-flex;
            }

            .footer {
                margin-top: auto;
                padding: 16px;
            }

            .connect-btn {
                padding: 12px 18px;
            }
        `,
    ]

    protected updated(changedProperties: PropertyValues<this>) {
        super.updated(changedProperties)

        if (changedProperties.has('networks') && !this.selectedNetwork) {
            const index = this.networks.findIndex(
                (network) => network.auth.method !== 'client_credentials'
            )

            if (index >= 0) {
                this.selectedNetwork = this.networks[index]
                this.selectedIdp =
                    this.idps.find(
                        (idp) =>
                            idp.id === this.selectedNetwork?.identityProviderId
                    ) ?? null
            }
        }
    }

    private get selectedNetworkIndex() {
        if (!this.selectedNetwork) {
            return ''
        }

        const index = this.networks.findIndex(
            (network) => network.id === this.selectedNetwork?.id
        )

        return index >= 0 ? String(index) : ''
    }

    private handleChange(e: Event) {
        const raw = (e.target as HTMLSelectElement).value
        const index = Number.parseInt(raw, 10)

        if (Number.isNaN(index)) {
            this.selectedNetwork = null
            this.selectedIdp = null
            this.message = null
            return
        }

        this.selectedNetwork = this.networks[index] ?? null
        this.selectedIdp =
            this.idps.find(
                (idp) => idp.id === this.selectedNetwork?.identityProviderId
            ) ?? null
        this.message = null
    }

    private handleConnect() {
        this.message = null

        if (!this.selectedNetwork) {
            this.messageType = 'error'
            this.message = 'Please select a network before connecting.'
            return
        }

        const idp = this.idps.find(
            (candidate) =>
                candidate.id === this.selectedNetwork?.identityProviderId
        )

        if (!idp) {
            this.messageType = 'error'
            this.message = 'Identity provider misconfigured for this network.'
            return
        }

        const clientId =
            (
                this.renderRoot.querySelector(
                    '#client-id'
                ) as HTMLInputElement | null
            )?.value || this.selectedNetwork.auth.clientId

        this.dispatchEvent(
            new LoginConnectEvent(this.selectedNetwork, idp, clientId)
        )
    }

    /** Set a status message on the form (e.g. "Redirecting...") */
    setMessage(message: string, type: 'error' | 'info') {
        this.message = message
        this.messageType = type
    }

    /** Clear the status message */
    clearMessage() {
        this.message = null
        this.messageType = null
    }

    protected render() {
        return html`
            <main class="screen">
                <div class="top-bar">
                    <img class="top-logo" src=${cantonLogo} alt="Canton logo" />
                </div>

                <div class="content">
                    <div class="title-row">
                        <h3 class="h3 mb-0 fw-bold">Wallet Gateway</h3>
                    </div>

                    <label
                        class="form-label fw-semibold text-body mt-3 mb-2"
                        for="network-select"
                    >
                        Select a network
                    </label>

                    <div class="select-wrap">
                        <select
                            id="network-select"
                            class="network-select form-select"
                            .value=${this.selectedNetworkIndex}
                            @change=${this.handleChange}
                            ?disabled=${this.connecting}
                        >
                            <option value="">Select network</option>
                            ${this.networks.map(
                                (net, index) =>
                                    html`<option
                                        value=${index}
                                        ?disabled=${net.auth.method ===
                                        'client_credentials'}
                                    >
                                        ${net.name}
                                    </option>`
                            )}
                        </select>
                        <span class="select-chevron">${chevronDownIcon}</span>
                    </div>

                    ${this.selectedIdp?.type === 'self_signed'
                        ? html`
                              <label
                                  class="form-label fw-semibold text-body mt-3 mb-2"
                                  for="client-id"
                                  >Client ID</label
                              >
                              <input
                                  id="client-id"
                                  class="client-id-input form-control"
                                  type="text"
                                  .value=${this.selectedNetwork?.auth
                                      .clientId || ''}
                                  ?disabled=${this.connecting}
                              />
                          `
                        : null}
                    ${this.message
                        ? html`<div
                              class="alert ${this.messageType === 'error'
                                  ? 'alert-danger'
                                  : 'alert-info'} py-2 px-3 small mt-2 mb-0"
                              role="alert"
                          >
                              ${this.message}
                          </div>`
                        : html`<p
                              class="form-text text-body-secondary mt-2 mb-0"
                          >
                              ${this.selectedNetwork
                                  ? `Selected: ${this.selectedNetwork.name}`
                                  : 'Choose a network to continue.'}
                          </p>`}
                </div>

                <div class="footer">
                    <button
                        class="connect-btn btn btn-primary w-100 rounded-pill"
                        @click=${this.handleConnect}
                        ?disabled=${this.connecting || !this.selectedNetwork}
                    >
                        ${this.connecting ? 'Connecting…' : 'Connect'}
                    </button>
                </div>
            </main>
        `
    }
}
