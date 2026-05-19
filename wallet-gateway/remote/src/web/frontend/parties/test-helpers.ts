// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { vi } from 'vitest'
import type { Wallet } from '@canton-network/core-wallet-user-rpc-client'

export const mockRequest = vi.fn()

export function createMockUserClient() {
    return { request: mockRequest }
}

export function makeWallet(overrides: Partial<Wallet> = {}): Wallet {
    return {
        primary: false,
        partyId: 'alice::1220abc',
        status: 'initialized',
        hint: 'alice',
        publicKey: 'pk',
        namespace: '1220abc',
        networkId: 'network1',
        signingProviderId: 'internal',
        rights: [],
        ...overrides,
    }
}

export function mockListWalletsFlow(
    wallets: Wallet[],
    networkId = 'network1'
): void {
    mockRequest.mockImplementation(async ({ method, params }) => {
        if (method === 'listSessions') {
            return {
                sessions: [
                    {
                        id: 'sess-1',
                        network: { id: networkId, name: 'Test' },
                    },
                ],
            }
        }
        if (method === 'listWallets') {
            if (
                params?.filter?.networkIds &&
                !params.filter.networkIds.includes(networkId)
            ) {
                return []
            }
            return wallets
        }
        return undefined
    })
}
