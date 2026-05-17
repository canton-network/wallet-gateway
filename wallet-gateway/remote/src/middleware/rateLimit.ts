// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import type { Request } from 'express'

function hasBearerToken(req: Request): boolean {
    const authHeader = req.headers.authorization
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        return true
    }

    return typeof req.query.token === 'string' && req.query.token.length > 0
}

export function ipRateLimitKeyGenerator(req: Request): string {
    return `ip:${ipKeyGenerator(req.ip || req.socket.remoteAddress || 'unknown')}`
}

export function rateLimitKeyGenerator(req: Request): string {
    // Prefer authenticated identity to avoid shared proxy IP buckets.
    if (req.authContext?.userId) {
        return `user:${req.authContext.userId}`
    }

    return ipRateLimitKeyGenerator(req)
}

export function rateLimiter(requestRateLimit: number) {
    return rateLimit({
        windowMs: 1 * 60 * 1000, // 1 minute
        max: requestRateLimit, // limit each IP to requestRateLimit requests per windowMs
        keyGenerator: rateLimitKeyGenerator,
        standardHeaders: true,
        legacyHeaders: false,
    })
}

export function preAuthIpRateLimiter(requestRateLimit: number) {
    return rateLimit({
        windowMs: 1 * 60 * 1000,
        max: requestRateLimit,
        keyGenerator: ipRateLimitKeyGenerator,
        // Only protect unauthenticated traffic before JWT verification.
        skip: hasBearerToken,
        standardHeaders: true,
        legacyHeaders: false,
    })
}

export function authenticatedRateLimiter(requestRateLimit: number) {
    return rateLimit({
        windowMs: 1 * 60 * 1000,
        max: requestRateLimit,
        keyGenerator: rateLimitKeyGenerator,
        // Apply only after JWT middleware has attached an authenticated context.
        skip: (req) => !req.authContext?.userId,
        standardHeaders: true,
        legacyHeaders: false,
    })
}
