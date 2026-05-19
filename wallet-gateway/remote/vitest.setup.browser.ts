// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Browser test setup: stub gateway config fetch used by rpc-client when not mocked.
 */
const originalFetch = globalThis.fetch.bind(globalThis)

globalThis.fetch = async (input, init) => {
    const url =
        typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.href
              : input.url

    if (url.includes('/.well-known/wallet-gateway-config')) {
        return new Response(
            JSON.stringify({
                userPath: `${window.location.origin}/api/v0/user`,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
    }

    return originalFetch(input, init)
}
