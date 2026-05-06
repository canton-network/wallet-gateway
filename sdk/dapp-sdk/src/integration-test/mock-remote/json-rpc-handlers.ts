// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

// JSON-RPC payloads returned by the mock http wallet. The shapes here
// mirror what a real wallet-gateway sends so the dApp SDK

import type {
    StatusEvent,
    ConnectResult,
} from '@canton-network/core-wallet-dapp-remote-rpc-client'

// URL paths returned as userUrl to be opened in a popup, so user can complete action asynchronously
export const USER_URL = '/login'
export const APPROVE_URL = '/approve'

export const MOCK_DAPP_API_PATH = '/api/v0/dapp'

// Not a path that wallet would have, it's just to trigger emitting SSE from mock wallet, on demand within a test
export const MOCK_SSE_PUSH_PATH = `${MOCK_DAPP_API_PATH}/sse-test-push`

function jsonRpcResult(id: string | number | null, result: unknown) {
    return { jsonrpc: '2.0' as const, id, result }
}

const primaryWallet = {
    primary: true,
    partyId: 'AsyncParty::1',
    status: 'allocated' as const,
    hint: 'AsyncParty',
    publicKey: 'pk',
    namespace: 'ns',
    networkId: 'network',
    signingProviderId: 'sp',
    rights: [] as unknown[],
}

export function connectResultConnected(rpcBase: string): ConnectResult {
    return {
        isConnected: true,
        reason: 'OK',
        isNetworkConnected: true,
        networkReason: 'OK',
        userUrl: `${rpcBase}${USER_URL}`,
    }
}

export function statusConnected(rpcBase: string): StatusEvent {
    return {
        provider: {
            id: 'remote-kernel',
            version: '0',
            providerType: 'remote',
            url: `${rpcBase}${MOCK_DAPP_API_PATH}`,
            userUrl: `${rpcBase}${USER_URL}`,
        },
        connection: connectResultConnected(rpcBase),
        network: {
            networkId: 'network',
            ledgerApi: 'https://ledger.test',
            accessToken: 'integration-test-token',
        },
        session: {
            accessToken: 'integration-test-token',
            userId: 'operator',
        },
    }
}

export function handleMockJsonRpc(
    rpcBase: string,
    body: { id: string | number | null; method: string; params?: unknown }
): { status: number; json: unknown } {
    const { method, id, params } = body

    switch (method) {
        case 'connect':
            return {
                status: 200,
                json: jsonRpcResult(id, connectResultConnected(rpcBase)),
            }
        case 'status':
            return {
                status: 200,
                json: jsonRpcResult(id, statusConnected(rpcBase)),
            }
        case 'isConnected':
            return {
                status: 200,
                json: jsonRpcResult(id, connectResultConnected(rpcBase)),
            }
        case 'disconnect':
            return { status: 200, json: jsonRpcResult(id, null) }
        case 'listAccounts':
            return { status: 200, json: jsonRpcResult(id, [primaryWallet]) }
        case 'ledgerApi':
            return {
                status: 200,
                json: jsonRpcResult(id, {
                    mocked: true,
                    resource: (params as { resource?: string })?.resource,
                }),
            }
        case 'prepareExecute':
            return {
                status: 200,
                json: jsonRpcResult(id, {
                    userUrl: `${rpcBase}${APPROVE_URL}`,
                }),
            }
        case 'getPrimaryAccount':
            return { status: 200, json: jsonRpcResult(id, primaryWallet) }
        case 'getActiveNetwork':
            return {
                status: 200,
                json: jsonRpcResult(id, {
                    networkId: 'network',
                    ledgerApi: 'https://ledger.remote.test',
                    accessToken: 'integration-test-token',
                }),
            }
        case 'signMessage':
            return {
                status: 200,
                json: jsonRpcResult(id, {
                    signature: 'integration-test-signature',
                }),
            }
        default:
            return {
                status: 200,
                json: {
                    jsonrpc: '2.0',
                    id,
                    error: {
                        code: -32601,
                        message: `unhandled method: ${method}`,
                    },
                },
            }
    }
}
