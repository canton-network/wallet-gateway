// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import {
    BaseElement,
    WalletCreateEvent,
    chevronLeftIcon,
    handleErrorToast,
    toRelHref,
    toRelPath,
} from '@canton-network/core-wallet-ui-components'
import { SigningProvider } from '@canton-network/core-signing-lib'
import { createUserClient } from '../../rpc-client'
import { stateManager } from '../../state-manager'
import '../../index'
import { WALLET_CREATION_STATUS_CODE } from '../index'
import { WalletStatus } from '@canton-network/core-wallet-user-rpc-client'

@customElement('user-ui-add-party')
export class UserUiAddParty extends BaseElement {
    @state() accessor signingProviders: string[] =
        Object.values(SigningProvider)
    @state() accessor networkIds: string[] = []
    @state() accessor loading = false

    static styles = [
        BaseElement.styles,
        css`
            :host {
                display: block;
            }

            .page-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: var(--wg-space-4);
                gap: var(--wg-space-3);
            }

            .form-wrap {
                width: 100%;
            }
        `,
    ]

    override connectedCallback(): void {
        super.connectedCallback()
        this.loadContext()
    }

    private async loadContext() {
        const userClient = await createUserClient(
            stateManager.accessToken.get()
        )
        const sessions = await userClient
            .request({ method: 'listSessions' })
            .catch(() => ({ sessions: [] }))
        const currentSession = sessions?.sessions?.[0]
        const networkId =
            currentSession?.network?.id || stateManager.networkId.get()
        this.networkIds = networkId ? [networkId] : []
    }

    private navigateBack() {
        window.location.href = toRelHref('/parties')
    }

    private async onCreateParty(event: WalletCreateEvent) {
        this.loading = true

        try {
            const userClient = await createUserClient(
                stateManager.accessToken.get()
            )
            const result = await userClient.request({
                method: 'createWallet',
                params: {
                    primary: event.primary,
                    partyHint: event.partyHint,
                    signingProviderId: event.signingProviderId,
                },
            })

            const statusMap: Record<WalletStatus, WALLET_CREATION_STATUS_CODE> =
                {
                    allocated: WALLET_CREATION_STATUS_CODE.WALLET_ALLOCATED,
                    initialized: WALLET_CREATION_STATUS_CODE.WALLET_INITIALIZED,
                    removed: WALLET_CREATION_STATUS_CODE.WALLET_REMOVED,
                }

            const createPartyStatus = statusMap[result.wallet.status]

            window.location.href = `${toRelPath('/parties/')}?createPartyStatus=${createPartyStatus}`
        } catch (error) {
            this.loading = false
            handleErrorToast(error)
        }
    }

    protected render() {
        return html`
            <div class="page-header">
                <h1 class="h4 fw-semibold mb-0">Create a new party</h1>
                <button
                    class="btn btn-link btn-sm text-body text-decoration-none p-0 d-inline-flex align-items-center gap-1"
                    type="button"
                    @click=${this.navigateBack}
                >
                    ${chevronLeftIcon}
                    <span>Back</span>
                </button>
            </div>

            <div class="form-wrap">
                <wg-wallet-create-form
                    .signingProviders=${this.signingProviders}
                    .networkIds=${this.networkIds}
                    .submitLabel=${'Create party'}
                    .loadingLabel=${'Creating party...'}
                    .loadingMessage=${'Creating party, please wait...'}
                    ?loading=${this.loading}
                    @wallet-create=${this.onCreateParty}
                ></wg-wallet-create-form>
            </div>
        `
    }
}
