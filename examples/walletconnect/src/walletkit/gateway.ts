// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { getAccessToken } from './auth'

const DAPP_PATH = '/api/v0/dapp'
const USER_PATH = '/api/v0/user'

let requestId = 0

async function jsonRpc<T>(
    path: string,
    method: string,
    params: unknown
): Promise<T> {
    const token = await getAccessToken()
    const res = await fetch(path, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: ++requestId,
            method,
            params: params ?? {},
        }),
    })

    const body = await res.json()
    if (body.error) {
        throw new Error(body.error.message || JSON.stringify(body.error))
    }
    return body.result as T
}

// ── dApp API ──

export function callDappApi<T = unknown>(
    method: string,
    params?: unknown
): Promise<T> {
    return jsonRpc<T>(DAPP_PATH, method, params)
}

// ── User API ──

export function callUserApi<T = unknown>(
    method: string,
    params?: unknown
): Promise<T> {
    return jsonRpc<T>(USER_PATH, method, params)
}

// ── Unauthenticated calls (allowed without session) ──

export interface NetworkInfo {
    id: string
    name: string
    description: string
}

export async function listNetworks(): Promise<NetworkInfo[]> {
    const result = await callUserApi<{ networks: NetworkInfo[] }>(
        'listNetworks',
        {}
    )
    return result.networks
}

export async function bootstrapSession(
    networkId: string
): Promise<{ id: string }> {
    return callUserApi<{ id: string }>('addSession', { networkId })
}

// ── Wallet helpers ──

export async function listWallets(): Promise<
    Array<{
        partyId: string
        publicKey: string
        namespace: string
        networkId: string
        signingProviderId: string
        status: string
        primary: boolean
    }>
> {
    return callUserApi('listWallets', {})
}

export async function setPrimaryWallet(partyId: string): Promise<void> {
    await callUserApi('setPrimaryWallet', { partyId })
}

export async function getPrimaryPartyId(): Promise<string> {
    const wallets = await listWallets()
    const primary = wallets.find((w) => w.primary)
    if (!primary) throw new Error('No primary wallet configured on gateway')
    return primary.partyId
}

// ── Full prepare → sign → execute flow ──

export interface PrepareSignExecuteResult {
    status: 'executed'
    commandId: string
    payload: {
        updateId: string
        completionOffset: number
    }
}

export async function prepareSignExecute(
    params: Record<string, unknown>
): Promise<PrepareSignExecuteResult> {
    // 1. Prepare the transaction via dapp API
    const prepResult = await callDappApi<{ userUrl: string }>(
        'prepareExecute',
        params
    )

    // Extract commandId from the userUrl query string
    const url = new URL(prepResult.userUrl, window.location.origin)
    const commandId = url.searchParams.get('commandId')
    if (!commandId) throw new Error('No commandId in prepareExecute response')

    // 2. Get partyId for signing
    const partyId = await getPrimaryPartyId()

    // 3. Sign the transaction via user API
    const signResult = await callUserApi<{
        status: string
        signature?: string
        signedBy?: string
    }>('sign', { commandId, partyId })

    if (signResult.status !== 'signed') {
        throw new Error(`Sign returned status: ${signResult.status}`)
    }

    // 4. Execute the signed transaction via user API
    const execResult = await callUserApi<{
        updateId?: string
        completionOffset?: number
    }>('execute', {
        commandId,
        partyId,
        signature: signResult.signature,
        signedBy: signResult.signedBy,
    })

    return {
        status: 'executed',
        commandId,
        payload: {
            updateId: execResult.updateId ?? '',
            completionOffset: execResult.completionOffset ?? 0,
        },
    }
}

export interface SignMessageFlowResult {
    signature: string
    publicKey?: string
}

export async function signMessageFlow(
    message: string
): Promise<SignMessageFlowResult> {
    const response = await callDappApi<{ userUrl: string }>('signMessage', {
        message,
    })

    const url = new URL(response.userUrl, window.location.origin)
    const messageId = url.searchParams.get('messageId')
    if (!messageId) {
        throw new Error('No messageId in signMessage response')
    }

    // Use a popup so the user can approve in the wallet web UI.
    // We rely on the gateway to postMessage the result to the opener.
    const popup = window.open(response.userUrl, 'splice_wallet_sign_message')
    if (!popup) {
        throw new Error('Failed to open wallet popup')
    }

    return await new Promise<SignMessageFlowResult>((resolve, reject) => {
        const timeout = window.setTimeout(
            () => {
                window.removeEventListener('message', listener)
                reject(new Error('Timed out waiting for message signature'))
            },
            5 * 60 * 1000
        )

        const listener = (event: MessageEvent) => {
            if (event.data?.type !== 'SPLICE_WALLET_SIGN_MESSAGE_RESULT') {
                return
            }
            if (event.data?.messageId !== messageId) {
                return
            }

            window.clearTimeout(timeout)
            window.removeEventListener('message', listener)

            if (event.data.status !== 'signed') {
                reject(new Error(`Message signing ${event.data.status}`))
                return
            }

            const signature = event.data.signature
            if (!signature) {
                reject(new Error('Missing signature in message signing result'))
                return
            }

            resolve({ signature, publicKey: event.data.publicKey })
        }

        window.addEventListener('message', listener)
    })
}
