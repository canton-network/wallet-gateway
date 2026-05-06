// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { vi, describe, it, beforeEach, expect } from 'vitest'
import {
    AuthTokenProvider,
    TokenProviderConfig,
} from '@canton-network/core-wallet-auth'
import createClient from 'openapi-fetch'
import { makeAmuletRulesResponse } from './unit-tests-consts.test'
import { ScanClient } from '../dist'
/* eslint-disable @typescript-eslint/no-explicit-any */
vi.mock('openapi-fetch', () => ({
    default: vi.fn(),
}))

const mockCreateClient = vi.mocked(createClient)

describe('Scan proxy client', () => {
    let scanClient: ScanClient

    const config: TokenProviderConfig = {
        method: 'self_signed',
        issuer: 'unsafe-auth',
        credentials: {
            clientId: 'ledger-api-user',
            clientSecret: 'unsafe',
            audience: 'https://canton.network.global',
            scope: '',
        },
    }
    const mockAccessTokenProvider = new AuthTokenProvider(config, console)

    let mockGet: ReturnType<typeof vi.fn>
    let mockPost: ReturnType<typeof vi.fn>
    beforeEach(() => {
        vi.resetAllMocks()
        const ledgerApiUrl = new URL('https://fakeBaseUrl')

        mockGet = vi.fn()
        mockPost = vi.fn()

        mockCreateClient.mockReturnValue({
            GET: mockGet,
            POST: mockPost,
        } as any)
        scanClient = new ScanClient(
            ledgerApiUrl,
            console,
            mockAccessTokenProvider
        )
    })

    it('should correctly get the amulet synchronizer id', async () => {
        mockGet.mockResolvedValue(makeAmuletRulesResponse(true))
        const result = await scanClient.getAmuletSynchronizerId()

        expect(result).toBe(
            'global-domain::1220c0e3494aacc431feb89cde65d265e904019a48e11ff16ad5d43dd15c1a33d3db'
        )
    })

    it('should correctly get the amulet synchronizer id iif there are future values', async () => {
        mockGet.mockResolvedValue(makeAmuletRulesResponse(true, true))
        const result = await scanClient.getAmuletSynchronizerId()

        expect(result).toBe('global-domain::newsynchronizer')
    })
})
