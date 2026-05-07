// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { CSSResultGroup, html, LitElement } from 'lit'
import { BaseElement } from '../../internal/base-element'
import { WalletPickerEntry } from '@canton-network/core-types'
import { customElement } from 'lit/decorators.js'
import styles from './styles'
import './components/list'
import './components/connecting'
import './components/connected'
import './components/error'

export type {
    WalletPickerEntry,
    WalletPickerResult,
} from '@canton-network/core-types'

/**
 * <swk-wallet-picker> — a wallet selection component modelled after PartyLayer's
 * WalletModal. Designed for popup rendering (same pattern as <swk-discovery>).
 *
 * IMPORTANT: Because the popup serialises this class via .toString() and runs it
 * inside a blob URL, every helper the class uses must be either:
 *   (a) a method / property on the class itself, or
 *   (b) a string literal inlined where it is used.
 * Top-level module constants are NOT available at runtime in the popup.
 *
 * Communication:
 *   - Reads wallet entries from localStorage key `splice_wallet_picker_entries`
 *   - Posts a WalletPickerResult to window.opener via postMessage on selection
 *
 * States: list → connecting → connected | error
 */
@customElement('swk-wallet-picker')
export class WalletPicker extends LitElement {
    static styles: CSSResultGroup = [BaseElement.styles, styles]

    private readonly RECENT_KEY = 'splice_wallet_picker_recent'

    private entries: WalletPickerEntry[] = []
    private recentGateways: { name: string; rpcUrl: string }[] = []
    private state: 'list' | 'connecting' | 'connected' | 'error' = 'list'
    private selectedEntry: WalletPickerEntry | null = null
    private errorMessage = ''

    private wcUri: string | null = null
    private wcQrDataUrl: string | null = null

    private readonly onOpenerStatusMessage = (event: MessageEvent): void => {
        if (event.origin !== window.location.origin) return

        const data = event.data
        if (data?.messageType !== 'SPLICE_WALLET_PICKER_CONNECT_STATUS') return

        if (data.status === 'connected') {
            this.setConnected()
            return
        }

        if (data.status === 'error') {
            const message =
                typeof data.message === 'string' && data.message.length > 0
                    ? data.message
                    : 'Failed to connect wallet'
            this.setError(message)
        }
    }

    // constructor() {
    //     super()
    //     const ctor = this.constructor as typeof HTMLElement & {
    //         styles?: string
    //     }
    //     if (ctor.styles) {
    //         const style = document.createElement('style')
    //         style.textContent = ctor.styles
    //         this.shadowRoot!.appendChild(style)
    //     }
    // }

    // ── localStorage helpers (inlined so they survive .toString() serialisation) ──

    private loadRecentGateways(): { name: string; rpcUrl: string }[] {
        try {
            const raw = localStorage.getItem(this.RECENT_KEY)
            if (raw) return JSON.parse(raw)
        } catch {
            // ignore
        }
        return []
    }

    private removeRecentGateway(rpcUrl: string): void {
        this.recentGateways = this.loadRecentGateways().filter(
            (r) => r.rpcUrl !== rpcUrl
        )

        if (this.recentGateways.length === 0) {
            localStorage.removeItem(this.RECENT_KEY)
        } else {
            localStorage.setItem(
                this.RECENT_KEY,
                JSON.stringify(this.recentGateways)
            )
        }

        this.render()
    }

    private loadEntries(): void {
        const stored = localStorage.getItem('splice_wallet_picker_entries')
        if (!stored) return
        try {
            this.entries = JSON.parse(stored)
        } catch {
            this.entries = []
        }
    }

    private getAllEntries(): WalletPickerEntry[] {
        // Merge all entries into a single flat list:
        // 1. Registered entries (extensions + gateways from discovery)
        // 2. Recent gateways not already in the registered list
        const knownUrls = new Set(
            this.entries
                .filter((e) => e.type === 'remote' && e.url)
                .map((e) => e.url)
        )

        const recentEntries: WalletPickerEntry[] = this.recentGateways
            .filter((r) => !knownUrls.has(r.rpcUrl))
            .map((r) => ({
                providerId: 'remote:' + r.rpcUrl,
                name: r.name,
                type: 'remote' as const,
                url: r.rpcUrl,
                reuseGlobalWalletPopup: true,
            }))

        return [...this.entries, ...recentEntries]
    }

    private isRemovableEntry(entry: WalletPickerEntry): boolean {
        if (entry.type !== 'remote' || !entry.url) {
            return false
        }

        const isRegisteredEntry = this.entries.some(
            (knownEntry) =>
                knownEntry.type === 'remote' && knownEntry.url === entry.url
        )
        const isManualEntry = this.recentGateways.some(
            (recentEntry) => recentEntry.rpcUrl === entry.url
        )

        return isManualEntry && !isRegisteredEntry
    }

    // ── Actions ─────────────────────────────────────────────

    private selectWallet(entry: WalletPickerEntry): void {
        this.selectedEntry = entry
        this.state = 'connecting'
        this.render()

        if (window.opener) {
            window.opener.postMessage(
                {
                    messageType: 'SPLICE_WALLET_PICKER_RESULT',
                    providerId: entry.providerId,
                    name: entry.name,
                    walletType: entry.type,
                    url: entry.url,
                    reuseGlobalWalletPopup: entry.reuseGlobalWalletPopup,
                },
                '*'
            )
        }
    }

    private connectCustomUrl(rpcUrl: string): void {
        const trimmed = rpcUrl.trim()
        if (!trimmed) return

        this.selectWallet({
            providerId: 'remote:' + trimmed,
            name: trimmed,
            type: 'remote',
            url: trimmed,
            reuseGlobalWalletPopup: true,
        })
    }

    public setConnected(): void {
        this.state = 'connected'
        this.render()
        setTimeout(() => {
            if (window.opener) window.close()
        }, 1200)
    }

    public setError(message: string): void {
        this.errorMessage = message
        this.state = 'error'
        this.render()
    }

    private goBackToList(): void {
        this.selectedEntry = null
        this.errorMessage = ''
        this.state = 'list'
        this.render()
    }

    private handleWalletConnectURIChange(event: MessageEvent) {
        if (
            event.data?.type === 'wc-uri' &&
            typeof event.data.uri === 'string'
        ) {
            this.wcUri = event.data.uri
            this.wcQrDataUrl = event.data.qrDataUrl ?? null
            if (this.state === 'connecting') this.render()
        }
    }

    render() {
        const allEntries = this.getAllEntries()

        console.log(allEntries, this.state)

        switch (this.state) {
            case 'connecting':
                return html`<wallet-picker-connecting
                    .entry=${this.selectedEntry}
                    .wcUri=${this.wcUri || ''}
                    .wcQrDataUrl=${this.wcQrDataUrl || ''}
                ></wallet-picker-connecting>`
            case 'connected':
                return html`<wallet-picker-connected
                    .entryName=${this.selectedEntry?.name || ''}
                ></wallet-picker-connected>`
            case 'error':
                return html`<wallet-picker-error
                    .message=${this.errorMessage}
                ></wallet-picker-error>`
            default:
                return html`<wallet-picker-list
                    .entries=${allEntries}
                ></wallet-picker-list>`
        }
    }

    connectedCallback(): void {
        super.connectedCallback()
        this.loadEntries()
        this.recentGateways = this.loadRecentGateways()
        window.addEventListener('message', this.onOpenerStatusMessage)

        window.addEventListener('errorRetry', this.goBackToList)

        // Listen for WalletConnect URI from the adapter via postMessage
        window.addEventListener('message', this.handleWalletConnectURIChange)
    }

    disconnectedCallback(): void {
        super.disconnectedCallback()
        window.removeEventListener('message', this.onOpenerStatusMessage)

        window.removeEventListener('errorRetry', this.goBackToList)

        window.removeEventListener('message', this.handleWalletConnectURIChange)
    }
}
