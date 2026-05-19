// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from 'vitest'
import { ipRateLimitKeyGenerator, rateLimitKeyGenerator } from './rateLimit.js'
import type { Request } from 'express'

describe('ipRateLimitKeyGenerator', () => {
    test('uses request ip address', () => {
        const req = {
            ip: '198.51.100.42',
            socket: { remoteAddress: '10.0.0.1' },
        } as Request

        expect(ipRateLimitKeyGenerator(req)).toBe('ip:198.51.100.42')
    })

    test('leaves IPv4 request ip address unchanged', () => {
        const req = {
            ip: '198.51.100.42',
            socket: { remoteAddress: '10.0.0.1' },
        } as Request

        expect(ipRateLimitKeyGenerator(req)).toBe('ip:198.51.100.42')
    })

    test('normalizes IPv6 request ip address to a subnet key', () => {
        const req = {
            ip: '2001:db8:abcd:0012:1111:2222:3333:4444',
            socket: { remoteAddress: '10.0.0.1' },
        } as Request

        expect(ipRateLimitKeyGenerator(req)).toBe('ip:2001:db8:abcd::/56')
    })
})

describe('rateLimitKeyGenerator', () => {
    test('uses authenticated user id when available', () => {
        const req = {
            authContext: { userId: 'alice' },
            ip: '203.0.113.10',
            socket: { remoteAddress: '10.0.0.1' },
        } as Request

        expect(rateLimitKeyGenerator(req)).toBe('user:alice')
    })

    test('falls back to request ip when user is not authenticated', () => {
        const req = {
            ip: '198.51.100.42',
            socket: { remoteAddress: '10.0.0.1' },
        } as Request

        expect(rateLimitKeyGenerator(req)).toBe('ip:198.51.100.42')
    })
})
