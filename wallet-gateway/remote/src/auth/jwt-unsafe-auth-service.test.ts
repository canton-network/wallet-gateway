// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect, beforeEach } from 'vitest'
import { pino, Logger } from 'pino'
import { sink } from 'pino-test'
import { SignJWT } from 'jose'
import { AuthContext } from '@canton-network/core-wallet-auth'
import { StoreInternal } from '@canton-network/core-wallet-store-inmemory'
import { jwtAuthService as jwtUnsafeAuthService } from './jwt-unsafe-auth-service.js'

const authContext: AuthContext = {
    userId: 'test-user-id',
    accessToken: 'test-access-token',
}

const SELF_SIGNED_ISSUER = 'unsafe-auth'

async function bearerToken(claims: Record<string, unknown>): Promise<string> {
    const jwt = await new SignJWT(claims)
        .setProtectedHeader({ alg: 'HS256' })
        .sign(new TextEncoder().encode('test-secret'))
    return `Bearer ${jwt}`
}

describe('jwtAuthService (unsafe)', () => {
    let mockLogger: Logger
    let store: StoreInternal

    beforeEach(async () => {
        mockLogger = pino(sink()) as Logger
        store = new StoreInternal(
            { idps: [], networks: [] },
            mockLogger,
            authContext
        )
        await store.addIdp({
            id: 'idp-self',
            type: 'self_signed',
            issuer: SELF_SIGNED_ISSUER,
        })
    })

    it('returns undefined when access token is missing', async () => {
        const service = jwtUnsafeAuthService(store, mockLogger)
        await expect(service.verifyToken(undefined)).resolves.toBeUndefined()
    })

    it('returns undefined when authorization header is not Bearer', async () => {
        const service = jwtUnsafeAuthService(store, mockLogger)
        await expect(
            service.verifyToken('NotBearer abc')
        ).resolves.toBeUndefined()
    })

    it('returns undefined when JWT has no issuer', async () => {
        const service = jwtUnsafeAuthService(store, mockLogger)
        const token = await bearerToken({
            sub: 'user-1',
            scope: 'openid',
        })
        await expect(service.verifyToken(token)).resolves.toBeUndefined()
    })

    it('returns undefined when JWT has no subject', async () => {
        const service = jwtUnsafeAuthService(store, mockLogger)
        const token = await bearerToken({
            iss: SELF_SIGNED_ISSUER,
            scope: 'openid',
        })
        await expect(service.verifyToken(token)).resolves.toBeUndefined()
    })

    it('returns undefined when JWT has no scope claim', async () => {
        const service = jwtUnsafeAuthService(store, mockLogger)
        const token = await bearerToken({
            iss: SELF_SIGNED_ISSUER,
            sub: 'user-1',
        })
        await expect(service.verifyToken(token)).resolves.toBeUndefined()
    })

    it('returns undefined when no identity provider matches issuer', async () => {
        const service = jwtUnsafeAuthService(store, mockLogger)
        const token = await bearerToken({
            iss: 'unknown-issuer',
            sub: 'user-1',
            scope: 'openid',
        })
        await expect(service.verifyToken(token)).resolves.toBeUndefined()
    })

    it('returns undefined for oauth identity providers', async () => {
        await store.addIdp({
            id: 'idp-oauth',
            type: 'oauth',
            issuer: 'https://oauth.example.com',
            configUrl:
                'https://oauth.example.com/.well-known/openid-configuration',
        })

        const service = jwtUnsafeAuthService(store, mockLogger)
        const token = await bearerToken({
            iss: 'https://oauth.example.com',
            sub: 'user-1',
            scope: 'openid',
        })
        await expect(service.verifyToken(token)).resolves.toBeUndefined()
    })

    it('returns auth context for a valid self-signed token', async () => {
        const service = jwtUnsafeAuthService(store, mockLogger)
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

    it('includes email when present in token', async () => {
        const service = jwtUnsafeAuthService(store, mockLogger)
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

    it('returns undefined for malformed JWT', async () => {
        const service = jwtUnsafeAuthService(store, mockLogger)
        await expect(
            service.verifyToken('Bearer not-a-jwt')
        ).resolves.toBeUndefined()
    })
})
