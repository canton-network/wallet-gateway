// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { vi, describe, it, beforeEach, expect } from 'vitest'
import {
    AuthTokenProvider,
    TokenProviderConfig,
} from '@canton-network/core-wallet-auth'
import createClient from 'openapi-fetch'
import { ValidatorInternalClient } from './validator-internal-client.js'
/* eslint-disable @typescript-eslint/no-explicit-any */
vi.mock('openapi-fetch', () => ({
    default: vi.fn(),
}))

const mockCreateClient = vi.mocked(createClient)

describe('Internal validator client', () => {
    let client: ValidatorInternalClient

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
        client = new ValidatorInternalClient(
            ledgerApiUrl,
            console,
            mockAccessTokenProvider
        )
    })

    it('should correctly get the validator user', async () => {
        mockGet.mockResolvedValue({
            data: { party_id: 'party123' },
            error: undefined,
        })
        const result = await client.get('/v0/validator-user')

        expect(result).toEqual({ party_id: 'party123' })
    })

    it('should throw an error if unauthorized', async () => {
        mockGet.mockResolvedValue({
            data: undefined,
            error: { message: 'Unauthorized' },
        })

        await expect(client.get('/v0/validator-user')).rejects.rejects.toThrow(
            'Unauthorized'
        )
    })

    it('should correctly call a post request', async () => {
        mockPost.mockResolvedValue({
            data: { userId: 'user123' },
            error: undefined,
        })

        const result = await client.post('/v0/admin/users', {
            name: 'test',
        })

        expect(result).toEqual({ userId: 'user123' })
    })
})
