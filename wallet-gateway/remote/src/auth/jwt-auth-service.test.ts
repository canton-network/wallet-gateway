// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { pino, Logger } from 'pino'
import { sink } from 'pino-test'
import { SignJWT } from 'jose'
import { AuthContext } from '@canton-network/core-wallet-auth'
import { Network } from '@canton-network/core-wallet-store'
import { StoreInternal } from '@canton-network/core-wallet-store-inmemory'
import { jwtAuthService } from './jwt-auth-service.js'

const mockJwtVerify = vi.hoisted(() => vi.fn())
const mockCreateRemoteJWKSet = vi.hoisted(() => vi.fn(() => 'jwks'))
const mockFetch = vi.hoisted(() => vi.fn())

vi.mock('jose', async (importOriginal) => {
    const actual = await importOriginal<typeof import('jose')>()
    return {
        ...actual,
        jwtVerify: mockJwtVerify,
        createRemoteJWKSet: mockCreateRemoteJWKSet,
    }
})

const authContext: AuthContext = {
    userId: 'test-user-id',
    accessToken: 'test-access-token',
}

const SELF_SIGNED_ISSUER = 'unsafe-auth'
const OAUTH_ISSUER = 'https://oauth.example.com'

async function bearerToken(claims: Record<string, unknown>): Promise<string> {
    const jwt = await new SignJWT(claims)
        .setProtectedHeader({ alg: 'HS256' })
        .sign(new TextEncoder().encode('test-secret'))
    return `Bearer ${jwt}`
}

const createNetwork = (
    id: string,
    identityProviderId: string,
    audience = 'test-audience'
): Network => ({
    id,
    name: `Network ${id}`,
    synchronizerId: `${id}-sync`,
    identityProviderId,
    description: `Test Network ${id}`,
    ledgerApi: { baseUrl: `http://${id}` },
    auth: {
        method: 'authorization_code' as const,
        clientId: 'cid',
        scope: 'openid',
        audience,
    },
})

describe('jwtAuthService', () => {
    let mockLogger: Logger
    let store: StoreInternal

    beforeEach(async () => {
        mockLogger = pino(sink()) as Logger
        store = new StoreInternal(
            { idps: [], networks: [] },
            mockLogger,
            authContext
        )
        vi.stubGlobal('fetch', mockFetch)
        mockFetch.mockReset()
        mockJwtVerify.mockReset()
        mockCreateRemoteJWKSet.mockClear()
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    it('returns undefined when access token is missing', async () => {
        const service = jwtAuthService(store, mockLogger)
        await expect(service.verifyToken(undefined)).resolves.toBeUndefined()
    })

    it('returns undefined when authorization header is not Bearer', async () => {
        const service = jwtAuthService(store, mockLogger)
        await expect(service.verifyToken('Basic abc')).resolves.toBeUndefined()
    })

    it('returns undefined when JWT has no issuer', async () => {
        const service = jwtAuthService(store, mockLogger)
        const token = await bearerToken({ sub: 'user-1', scope: 'openid' })
        await expect(service.verifyToken(token)).resolves.toBeUndefined()
    })

    it('returns undefined when no identity provider matches issuer', async () => {
        await store.addIdp({
            id: 'idp-self',
            type: 'self_signed',
            issuer: SELF_SIGNED_ISSUER,
        })

        const service = jwtAuthService(store, mockLogger)
        const token = await bearerToken({
            iss: 'unknown-issuer',
            sub: 'user-1',
            scope: 'openid',
        })
        await expect(service.verifyToken(token)).resolves.toBeUndefined()
    })

    it('returns undefined when JWT has no scope or scp claim', async () => {
        await store.addIdp({
            id: 'idp-self',
            type: 'self_signed',
            issuer: SELF_SIGNED_ISSUER,
        })

        const service = jwtAuthService(store, mockLogger)
        const token = await bearerToken({
            iss: SELF_SIGNED_ISSUER,
            sub: 'user-1',
        })
        await expect(service.verifyToken(token)).resolves.toBeUndefined()
    })

    describe('self_signed identity provider', () => {
        beforeEach(async () => {
            await store.addIdp({
                id: 'idp-self',
                type: 'self_signed',
                issuer: SELF_SIGNED_ISSUER,
            })
        })

        it('returns auth context for a valid self-signed token', async () => {
            const service = jwtAuthService(store, mockLogger)
            const token = await bearerToken({
                iss: SELF_SIGNED_ISSUER,
                sub: 'user-1',
                scope: 'openid',
            })

            const result = await service.verifyToken(token)
            expect(result).toEqual({
                userId: 'user-1',
                accessToken: token.split(' ')[1],
            })
        })

        it('accepts scp claim instead of scope', async () => {
            const service = jwtAuthService(store, mockLogger)
            const token = await bearerToken({
                iss: SELF_SIGNED_ISSUER,
                sub: 'user-1',
                scp: 'openid',
            })

            const result = await service.verifyToken(token)
            expect(result?.userId).toBe('user-1')
        })

        it('includes email when present in token', async () => {
            const service = jwtAuthService(store, mockLogger)
            const token = await bearerToken({
                iss: SELF_SIGNED_ISSUER,
                sub: 'user-1',
                scope: 'openid',
                email: 'user@example.com',
            })

            const result = await service.verifyToken(token)
            expect(result).toEqual({
                userId: 'user-1',
                accessToken: token.split(' ')[1],
                email: 'user@example.com',
            })
        })

        it('returns undefined when JWT has no subject', async () => {
            const service = jwtAuthService(store, mockLogger)
            const token = await bearerToken({
                iss: SELF_SIGNED_ISSUER,
                scope: 'openid',
            })
            await expect(service.verifyToken(token)).resolves.toBeUndefined()
        })
    })

    describe('oauth identity provider', () => {
        const configUrl =
            'https://oauth.example.com/.well-known/openid-configuration'

        beforeEach(async () => {
            await store.addIdp({
                id: 'idp-oauth',
                type: 'oauth',
                issuer: OAUTH_ISSUER,
                configUrl,
            })
            mockFetch.mockResolvedValue({
                json: async () => ({
                    jwks_uri: 'https://oauth.example.com/jwks',
                }),
            } as Response)
        })

        it('returns auth context when JWT verifies and audience matches', async () => {
            await store.addNetwork(
                createNetwork('network-1', 'idp-oauth', 'ledger-audience')
            )

            mockJwtVerify.mockResolvedValue({
                payload: { sub: 'oauth-user', aud: 'ledger-audience' },
            })

            const service = jwtAuthService(store, mockLogger)
            const token = await bearerToken({
                iss: OAUTH_ISSUER,
                sub: 'oauth-user',
                scope: 'openid',
                email: 'oauth@example.com',
            })
            const rawJwt = token.split(' ')[1]

            const result = await service.verifyToken(token)

            expect(mockFetch).toHaveBeenCalledWith(configUrl)
            expect(mockCreateRemoteJWKSet).toHaveBeenCalledWith(
                new URL('https://oauth.example.com/jwks')
            )
            expect(mockJwtVerify).toHaveBeenCalledWith(rawJwt, 'jwks', {
                algorithms: ['RS256'],
            })
            expect(result).toEqual({
                userId: 'oauth-user',
                accessToken: rawJwt,
                email: 'oauth@example.com',
            })
        })

        it('returns undefined when no networks are configured for the IDP', async () => {
            mockJwtVerify.mockResolvedValue({
                payload: { sub: 'oauth-user', aud: 'ledger-audience' },
            })

            const service = jwtAuthService(store, mockLogger)
            const token = await bearerToken({
                iss: OAUTH_ISSUER,
                sub: 'oauth-user',
                scope: 'openid',
            })

            await expect(service.verifyToken(token)).resolves.toBeUndefined()
        })

        it('returns undefined when audience does not match configured networks', async () => {
            await store.addNetwork(
                createNetwork('network-1', 'idp-oauth', 'expected-audience')
            )
            mockJwtVerify.mockResolvedValue({
                payload: { sub: 'oauth-user', aud: 'other-audience' },
            })

            const service = jwtAuthService(store, mockLogger)
            const token = await bearerToken({
                iss: OAUTH_ISSUER,
                sub: 'oauth-user',
                scope: 'openid',
            })

            await expect(service.verifyToken(token)).resolves.toBeUndefined()
        })

        it('returns undefined when verified JWT has no audience', async () => {
            await store.addNetwork(
                createNetwork('network-1', 'idp-oauth', 'expected-audience')
            )
            mockJwtVerify.mockResolvedValue({
                payload: { sub: 'oauth-user' },
            })

            const service = jwtAuthService(store, mockLogger)
            const token = await bearerToken({
                iss: OAUTH_ISSUER,
                sub: 'oauth-user',
                scope: 'openid',
            })

            await expect(service.verifyToken(token)).resolves.toBeUndefined()
        })

        it('returns undefined when verified JWT has no subject', async () => {
            await store.addNetwork(
                createNetwork('network-1', 'idp-oauth', 'expected-audience')
            )
            mockJwtVerify.mockResolvedValue({
                payload: { aud: 'expected-audience' },
            })

            const service = jwtAuthService(store, mockLogger)
            const token = await bearerToken({
                iss: OAUTH_ISSUER,
                sub: 'oauth-user',
                scope: 'openid',
            })

            await expect(service.verifyToken(token)).resolves.toBeUndefined()
        })

        it('returns undefined when JWT verification fails', async () => {
            await store.addNetwork(
                createNetwork('network-1', 'idp-oauth', 'expected-audience')
            )
            mockJwtVerify.mockRejectedValue(new Error('invalid signature'))

            const service = jwtAuthService(store, mockLogger)
            const token = await bearerToken({
                iss: OAUTH_ISSUER,
                sub: 'oauth-user',
                scope: 'openid',
            })

            await expect(service.verifyToken(token)).resolves.toBeUndefined()
        })
    })
})
