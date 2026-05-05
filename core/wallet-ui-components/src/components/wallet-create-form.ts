// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { css, html } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { BaseElement } from '../internal/base-element.js'
import { chevronDownIcon } from '../icons/index.js'

export class WalletCreateEvent extends Event {
    constructor(
        public partyHint: string,
        public signingProviderId: string,
        public primary: boolean
    ) {
        super('wallet-create', { bubbles: true, composed: true })
    }
}

// TODO: should we rename this to party-create-form?
@customElement('wg-wallet-create-form')
export class WgWalletCreateForm extends BaseElement {
    @property({ type: Array }) signingProviders: string[] = []
    @property({ type: Array }) networkIds: string[] = []
    @property({ type: Boolean }) loading = false
    @property({ type: String }) submitLabel = 'Add'
    @property({ type: String }) loadingLabel = 'Adding...'
    @property({ type: String }) loadingMessage =
        'Creating party, please wait...'

    @query('#party-id-hint') accessor partyHintInput: HTMLInputElement | null =
        null
    @query('#signing-provider-id')
    accessor signingProviderSelect: HTMLSelectElement | null = null
    @query('#primary') accessor primaryCheckbox: HTMLInputElement | null = null

    static styles = [
        BaseElement.styles,
        css`
            :host {
                display: block;
            }

            .form-fields {
                gap: var(--wg-space-4);
            }

            .field-group {
                gap: var(--wg-space-2);
            }

            .field-label {
                font-size: var(--wg-font-size-sm);
                font-weight: var(--wg-font-weight-medium);
                color: var(--wg-text-secondary);
                line-height: var(--wg-line-height-tight);
            }

            .required {
                color: var(--wg-label-required-color);
            }

            .field-control {
                width: 100%;
                border: 1px solid var(--wg-input-border);
                border-radius: 4px;
                background: var(--wg-input-bg);
                color: var(--wg-input-text);
                padding: 12px 14px;
            }

            .field-control::placeholder {
                color: var(--wg-input-placeholder);
            }

            .field-control:focus {
                border-color: var(--wg-input-border-focus);
                box-shadow: 0 0 0 3px rgba(var(--wg-accent-rgb), 0.12);
            }

            .field-control:disabled {
                background: rgba(15, 23, 42, 0.04);
                color: var(--wg-text-secondary);
                opacity: 1;
            }

            .select-wrap {
                position: relative;
            }

            .select-wrap .field-control {
                padding-right: 40px;
                appearance: none;
                -webkit-appearance: none;
            }

            .select-chevron {
                position: absolute;
                top: 50%;
                right: 12px;
                transform: translateY(-50%);
                color: var(--wg-text-secondary);
                pointer-events: none;
                display: inline-flex;
            }

            .primary-row {
                display: flex;
                align-items: center;
                gap: var(--wg-space-2);
                margin-top: var(--wg-space-1);
                padding: 0;
                border: none;
                background: transparent;
            }

            .form-check-input {
                accent-color: var(--wg-primary);
                margin: 0;
                flex: 0 0 auto;
            }

            .primary-row .form-check-input {
                float: none;
                margin-left: 0;
            }

            .form-check-input:focus {
                box-shadow: 0 0 0 3px rgba(var(--wg-accent-rgb), 0.12);
            }

            .primary-label {
                color: var(--wg-text-secondary);
                font-size: var(--wg-font-size-sm);
                font-weight: var(--wg-font-weight-medium);
            }

            .submit-wrap {
                gap: var(--wg-space-3);
            }

            .submit-button {
                min-height: 44px;
            }

            .loading-message {
                margin: 0;
                color: var(--wg-text-secondary);
                font-size: var(--wg-font-size-sm);
                text-align: center;
            }
        `,
    ]

    private onSubmit(event: Event) {
        event.preventDefault()

        if (this.loading) {
            return
        }

        const partyHint = this.partyHintInput?.value || ''
        const signingProviderId = this.signingProviderSelect?.value || ''
        const primary = this.primaryCheckbox?.checked || false

        this.dispatchEvent(
            new WalletCreateEvent(partyHint, signingProviderId, primary)
        )
    }

    reset() {
        if (this.partyHintInput) {
            this.partyHintInput.value = ''
        }
        if (this.primaryCheckbox) {
            this.primaryCheckbox.checked = false
        }
    }

    protected render() {
        return html`
            <form
                class="d-flex flex-column h-100"
                aria-busy=${this.loading ? 'true' : 'false'}
                @submit=${this.onSubmit}
            >
                <div class="form-fields d-flex flex-column">
                    <div class="field-group d-flex flex-column">
                        <label
                            for="party-id-hint"
                            class="form-label field-label mb-0"
                        >
                            Party ID Hint <span class="required">*</span>
                        </label>
                        <input
                            ?disabled=${this.loading}
                            class="form-control field-control"
                            id="party-id-hint"
                            type="text"
                            placeholder="Enter the name of your wallet?"
                            required
                        />
                    </div>

                    <div class="field-group d-flex flex-column">
                        <label
                            for="signing-provider-id"
                            class="form-label field-label mb-0"
                        >
                            Signing Provider <span class="required">*</span>
                        </label>
                        <div class="select-wrap">
                            <select
                                ?disabled=${this.loading}
                                class="form-select field-control"
                                id="signing-provider-id"
                                required
                            >
                                <option disabled selected value="">
                                    Select signing provider
                                </option>
                                ${this.signingProviders.map(
                                    (providerId) =>
                                        html`<option value=${providerId}>
                                            ${providerId}
                                        </option>`
                                )}
                            </select>
                            <span class="select-chevron"
                                >${chevronDownIcon}</span
                            >
                        </div>
                    </div>

                    <div class="primary-row mb-0">
                        <input
                            id="primary"
                            type="checkbox"
                            class="form-check-input"
                            ?disabled=${this.loading}
                        />
                        <label
                            for="primary"
                            class="form-check-label primary-label"
                            >Set as primary wallet</label
                        >
                    </div>
                </div>

                <div class="submit-wrap mt-auto pt-3 d-flex flex-column">
                    <button
                        class="submit-button btn btn-primary rounded-pill w-100 d-inline-flex align-items-center justify-content-center gap-2"
                        ?disabled=${this.loading}
                        type="submit"
                    >
                        ${this.loading
                            ? html`<span
                                  class="spinner-border spinner-border-sm"
                                  aria-hidden="true"
                              ></span>`
                            : null}
                        ${this.loading ? this.loadingLabel : this.submitLabel}
                    </button>

                    ${this.loading
                        ? html`<p
                              class="loading-message"
                              role="status"
                              aria-live="polite"
                          >
                              ${this.loadingMessage}
                          </p>`
                        : null}
                </div>
            </form>
        `
    }
}
