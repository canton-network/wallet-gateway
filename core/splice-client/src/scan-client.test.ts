// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { vi, describe, it, beforeEach, expect } from 'vitest'
import { ScanProxyClient } from './scan-proxy-client'
import {
    AuthTokenProvider,
    TokenProviderConfig,
} from '@canton-network/core-wallet-auth'
import createClient from 'openapi-fetch'
import {
    makeAmuletRulesResponse,
    makeOpenAndIssuingMiningRoundsResponse,
} from './unit-tests-consts.test'
/* eslint-disable @typescript-eslint/no-explicit-any */
vi.mock('openapi-fetch', () => ({
    default: vi.fn(),
}))

const mockCreateClient = vi.mocked(createClient)

describe('Scan proxy client', () => {
    let scanProxyClient: ScanProxyClient

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

        ScanProxyClient.invalidateAmuletRulesCache(ledgerApiUrl)
        ScanProxyClient.invalidateOpenMiningRoundsCache(ledgerApiUrl)
        mockGet = vi.fn()
        mockPost = vi.fn()

        mockCreateClient.mockReturnValue({
            GET: mockGet,
            POST: mockPost,
        } as any)
        scanProxyClient = new ScanProxyClient(
            ledgerApiUrl,
            console,
            mockAccessTokenProvider
        )
    })

    it('should correctly determine devnet if isDevNet is true in amuletRules', async () => {
        mockGet.mockResolvedValue(makeAmuletRulesResponse(true))
        const result = await scanProxyClient.isDevNet()

        expect(result).toBeTruthy()
    })

    it('should correctly determine devnet if isDevNet is false in amuletRules', async () => {
        mockGet.mockResolvedValue(makeAmuletRulesResponse(false))
        const result = await scanProxyClient.isDevNet()

        expect(result).toBeFalsy()
    })

    it('should correctly reject when the scanProxy return an error for isDevNet', async () => {
        mockGet.mockResolvedValue({
            data: undefined,
            error: { message: 'Unauthorized' },
        })

        await expect(scanProxyClient.isDevNet()).rejects.toEqual({
            message: 'Unauthorized',
        })
    })

    it('should throw an error if AmuletRules is malformed', async () => {
        mockGet.mockResolvedValue({
            data: { amulet_rules: { blah: '123' } },
            error: undefined,
        })

        await expect(scanProxyClient.isDevNet()).rejects.toThrow(
            'Malformed AmuletRules response'
        )
    })

    it('should used cached amulet rules on second call', async () => {
        mockGet.mockResolvedValue(makeAmuletRulesResponse(true))
        await scanProxyClient.isDevNet()
        await scanProxyClient.isDevNet()

        expect(mockGet).toHaveBeenCalledOnce()
    })

    it('should used get the amulet synchronizerId', async () => {
        mockGet.mockResolvedValue(makeAmuletRulesResponse(true))
        const synchronizerId = await scanProxyClient.getAmuletSynchronizerId()

        expect(synchronizerId).toEqual(
            'global-domain::1220c0e3494aacc431feb89cde65d265e904019a48e11ff16ad5d43dd15c1a33d3db'
        )
    })

    it('should used get new synchronizerId if there are future values', async () => {
        mockGet.mockResolvedValue(makeAmuletRulesResponse(true, true))
        const synchronizerId = await scanProxyClient.getAmuletSynchronizerId()

        expect(synchronizerId).toEqual('global-domain::newsynchronizer')
    })

    it('should get openMiningRounds', async () => {
        mockGet.mockResolvedValue(makeOpenAndIssuingMiningRoundsResponse())

        const response = await scanProxyClient.getActiveOpenMiningRound()
        console.log('opening mining rounds response: ' + response)
        expect(response).toBeNull()
    })
})
