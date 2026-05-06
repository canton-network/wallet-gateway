// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import type { WalletKitTypes } from '@reown/walletkit'
import type { SessionTypes } from '@walletconnect/types'
import { initWalletKit, getWalletKit } from './client'
import {
    callDappApi,
    bootstrapSession,
    getPrimaryPartyId,
    prepareSignExecute,
    signMessageFlow,
} from './gateway'
import type {
    PendingProposal,
    PendingRequest,
    SessionInfo,
    QueuedProposal,
    QueuedRequest,
} from './types'

const CANTON_PREFIX = 'canton_'
const DEFAULT_CHAIN = 'canton:devnet'

const AUTO_DISPATCH = new Set([
    'canton_status',
    'canton_listAccounts',
    'canton_getPrimaryAccount',
    'canton_getActiveNetwork',
    'canton_ledgerApi',
])

export interface WalletHandler {
    init(projectId: string): Promise<void>
    pair(uri: string): Promise<void>
    getPendingProposals(): PendingProposal[]
    getPendingRequests(): PendingRequest[]
    getActiveSessions(): SessionInfo[]
    approveProposal(id: number, networkId: string): Promise<void>
    rejectProposal(id: number): Promise<void>
    approveRequest(id: number): Promise<unknown>
    rejectRequest(id: number): Promise<void>
    disconnectSession(topic: string): Promise<void>
}

export type WalletEventCallback = (event: WalletEvent) => void

export type WalletEvent =
    | { type: 'proposal'; proposal: PendingProposal }
    | { type: 'request'; request: PendingRequest }
    | { type: 'proposal_resolved'; id: number; action: string }
    | { type: 'request_resolved'; id: number; action: string; error?: string }
    | { type: 'session_deleted'; topic: string }
    | { type: 'sessions_changed' }

const pendingProposals = new Map<number, QueuedProposal>()
const pendingRequests = new Map<number, QueuedRequest>()

const listeners = new Set<WalletEventCallback>()

function emit(event: WalletEvent) {
    listeners.forEach((fn) => fn(event))
}

export function subscribe(cb: WalletEventCallback): () => void {
    listeners.add(cb)
    return () => listeners.delete(cb)
}

function partyToCaip10(chain: string, partyId: string): string {
    return `${chain}:${encodeURIComponent(partyId)}`
}

// ── Auto-dispatch: forward read-only methods to gateway ──

async function autoDispatch(method: string, params: unknown): Promise<unknown> {
    const controllerMethod = method.startsWith(CANTON_PREFIX)
        ? method.slice(CANTON_PREFIX.length)
        : method
    return callDappApi(controllerMethod, params)
}

// ── WalletKit event handlers ──

function setupListeners() {
    const wk = getWalletKit()
    if (!wk) return

    wk.on(
        'session_proposal',
        async (proposal: WalletKitTypes.SessionProposal) => {
            const peer = proposal.params.proposer.metadata
            const cantonNs =
                proposal.params.requiredNamespaces?.canton ??
                proposal.params.optionalNamespaces?.canton

            if (!cantonNs) {
                console.warn('[WalletKit] No canton namespace, rejecting')
                await wk.rejectSession({
                    id: proposal.id,
                    reason: {
                        code: 5100,
                        message: 'Canton namespace not found',
                    },
                })
                return
            }

            const meta: PendingProposal = {
                id: proposal.id,
                peerName: peer.name,
                peerUrl: peer.url,
                peerDescription: peer.description,
                methods: cantonNs.methods ?? [],
                events: cantonNs.events ?? [],
                chains: cantonNs.chains ?? [DEFAULT_CHAIN],
                receivedAt: new Date().toISOString(),
            }

            console.log('[WalletKit] Session proposal from', peer.name)

            // Queue for user approval — the promise is resolved by approveProposal/rejectProposal
            new Promise<{ networkId: string }>((resolve, reject) => {
                pendingProposals.set(proposal.id, {
                    raw: proposal,
                    meta,
                    resolve,
                    reject,
                })
            }).then(
                async ({ networkId }) => {
                    try {
                        // Bootstrap a session on the gateway
                        await bootstrapSession(networkId)

                        // Get the wallet's partyId for the CAIP-10 account
                        let partyId: string | null = null
                        try {
                            partyId = await getPrimaryPartyId()
                        } catch {
                            // no wallet yet — use pending placeholder
                        }

                        const chains = meta.chains
                        const session = await wk.approveSession({
                            id: proposal.id,
                            namespaces: {
                                canton: {
                                    chains,
                                    accounts: chains.map((c) =>
                                        partyId
                                            ? partyToCaip10(c, partyId)
                                            : `${c}:pending`
                                    ),
                                    methods: meta.methods,
                                    events: meta.events,
                                },
                            },
                        })

                        console.log(
                            '[WalletKit] Session approved, topic:',
                            session.topic
                        )
                        emit({
                            type: 'proposal_resolved',
                            id: proposal.id,
                            action: 'approved',
                        })
                        emit({ type: 'sessions_changed' })
                    } catch (err) {
                        console.error('[WalletKit] Approve failed', err)
                        await wk
                            .rejectSession({
                                id: proposal.id,
                                reason: {
                                    code: 5000,
                                    message:
                                        err instanceof Error
                                            ? err.message
                                            : String(err),
                                },
                            })
                            .catch(() => {})
                        emit({
                            type: 'proposal_resolved',
                            id: proposal.id,
                            action: 'rejected',
                        })
                    } finally {
                        pendingProposals.delete(proposal.id)
                    }
                },
                async (err) => {
                    // User rejected
                    console.log('[WalletKit] Proposal rejected by user')
                    await wk
                        .rejectSession({
                            id: proposal.id,
                            reason: {
                                code: 5000,
                                message:
                                    err instanceof Error
                                        ? err.message
                                        : 'User rejected',
                            },
                        })
                        .catch(() => {})
                    emit({
                        type: 'proposal_resolved',
                        id: proposal.id,
                        action: 'rejected',
                    })
                    pendingProposals.delete(proposal.id)
                }
            )

            emit({ type: 'proposal', proposal: meta })
        }
    )

    wk.on('session_request', async (event: WalletKitTypes.SessionRequest) => {
        const { id, topic } = event
        const { method, params } = event.params.request

        const sessions = wk.getActiveSessions()
        const peerName = sessions[topic]?.peer?.metadata?.name ?? 'Unknown dApp'

        console.debug('[WalletKit] session_request', method, 'from', peerName)

        // Auto-dispatch read-only methods immediately
        if (AUTO_DISPATCH.has(method)) {
            try {
                const result = await autoDispatch(method, params)
                const payload = JSON.stringify(result)
                // WalletConnect relay has a ~100KB message limit
                if (payload.length > 90_000) {
                    console.warn(
                        `[WalletKit] Response too large for WalletConnect relay (${(payload.length / 1024).toFixed(0)}KB), method: ${method}`
                    )
                    await wk.respondSessionRequest({
                        topic,
                        response: {
                            id,
                            jsonrpc: '2.0',
                            error: {
                                code: 5002,
                                message: `Response too large for WalletConnect relay (${(payload.length / 1024).toFixed(0)}KB). Use getActiveNetwork() to get the ledger URL and call the API directly.`,
                            },
                        },
                    })
                    return
                }
                await wk.respondSessionRequest({
                    topic,
                    response: { id, jsonrpc: '2.0', result },
                })
            } catch (error: unknown) {
                const message =
                    error instanceof Error ? error.message : String(error)
                await wk.respondSessionRequest({
                    topic,
                    response: {
                        id,
                        jsonrpc: '2.0',
                        error: { code: 5001, message },
                    },
                })
            }
            return
        }

        // Queue for user approval
        const meta: PendingRequest = {
            id,
            topic,
            method,
            params,
            peerName,
            receivedAt: new Date().toISOString(),
        }

        new Promise<unknown>((resolve, reject) => {
            pendingRequests.set(id, {
                raw: event,
                meta,
                resolve,
                reject,
            })
        }).then(
            async (result) => {
                try {
                    await wk.respondSessionRequest({
                        topic,
                        response: { id, jsonrpc: '2.0', result },
                    })
                } catch (err) {
                    console.warn(
                        '[WalletKit] Failed to respond (session may be gone)',
                        err
                    )
                }
                emit({
                    type: 'request_resolved',
                    id,
                    action: 'approved',
                })
            },
            async (error) => {
                const message =
                    error instanceof Error ? error.message : String(error)
                try {
                    await wk.respondSessionRequest({
                        topic,
                        response: {
                            id,
                            jsonrpc: '2.0',
                            error: { code: 5001, message },
                        },
                    })
                } catch {
                    // session may be gone
                }
                emit({
                    type: 'request_resolved',
                    id,
                    action: 'rejected',
                    error: message,
                })
            }
        )

        emit({ type: 'request', request: meta })
    })

    wk.on('session_delete', (event: { id: number; topic: string }) => {
        console.log('[WalletKit] Session deleted', event.topic)
        emit({ type: 'session_deleted', topic: event.topic })
        emit({ type: 'sessions_changed' })
    })
}

// ── Public handler ──

export const walletHandler: WalletHandler = {
    async init(projectId: string) {
        await initWalletKit(projectId)
        setupListeners()

        const wk = getWalletKit()!
        const count = Object.keys(wk.getActiveSessions()).length
        if (count > 0) {
            console.log(`[WalletKit] Resumed ${count} active sessions`)
        }
    },

    async pair(uri: string) {
        const wk = getWalletKit()
        if (!wk) throw new Error('WalletKit not initialized')
        await wk.pair({ uri })
        console.log('[WalletKit] Pairing initiated')
    },

    getPendingProposals() {
        return Array.from(pendingProposals.values()).map((e) => e.meta)
    },

    getPendingRequests() {
        return Array.from(pendingRequests.values()).map((e) => e.meta)
    },

    getActiveSessions(): SessionInfo[] {
        const wk = getWalletKit()
        if (!wk) return []
        const raw = wk.getActiveSessions()
        return Object.entries(raw).map(
            ([topic, s]: [string, SessionTypes.Struct]) => ({
                topic,
                peerName: s.peer?.metadata?.name ?? 'Unknown',
                peerUrl: s.peer?.metadata?.url ?? '',
                expiry: s.expiry,
            })
        )
    },

    async approveProposal(id: number, networkId: string) {
        const entry = pendingProposals.get(id)
        if (!entry) throw new Error(`Proposal ${id} not found`)
        entry.resolve({ networkId })
    },

    async rejectProposal(id: number) {
        const entry = pendingProposals.get(id)
        if (!entry) throw new Error(`Proposal ${id} not found`)
        entry.reject(new Error('User rejected'))
    },

    async approveRequest(id: number) {
        const entry = pendingRequests.get(id)
        if (!entry) throw new Error(`Request ${id} not found`)

        const { method, params } = entry.meta

        try {
            let result: unknown

            if (method === 'canton_prepareSignExecute') {
                result = await prepareSignExecute(
                    params as Record<string, unknown>
                )
            } else if (method === 'canton_signMessage') {
                const message = (params as { message?: unknown })?.message
                if (typeof message !== 'string') {
                    throw new Error(
                        'Invalid canton_signMessage params: expected { message: string }'
                    )
                }
                result = await signMessageFlow(message)
            } else {
                const controllerMethod = method.startsWith(CANTON_PREFIX)
                    ? method.slice(CANTON_PREFIX.length)
                    : method
                result = await callDappApi(controllerMethod, params)
            }

            entry.resolve(result)
            pendingRequests.delete(id)
            return result
        } catch (error) {
            entry.reject(
                error instanceof Error ? error : new Error(String(error))
            )
            pendingRequests.delete(id)
            throw error
        }
    },

    async rejectRequest(id: number) {
        const entry = pendingRequests.get(id)
        if (!entry) throw new Error(`Request ${id} not found`)
        entry.reject(new Error('User rejected'))
        pendingRequests.delete(id)
    },

    async disconnectSession(topic: string) {
        const wk = getWalletKit()
        if (!wk) return
        await wk.disconnectSession({
            topic,
            reason: { code: 6000, message: 'Wallet disconnected' },
        })
        emit({ type: 'session_deleted', topic })
        emit({ type: 'sessions_changed' })
    },
}
