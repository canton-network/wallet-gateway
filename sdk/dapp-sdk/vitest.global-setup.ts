// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import type { Server } from 'node:http'
import { startMockRemoteGateway } from './src/integration-test/mock-remote/http-server'

function closeServer(server: Server): Promise<void> {
    return new Promise((resolve, reject) => {
        server.closeAllConnections?.()
        server.close((err) => (err ? reject(err) : resolve()))
    })
}

export default async function globalSetup(): Promise<() => Promise<void>> {
    const port = Number(process.env.MOCK_REMOTE_GATEWAY_PORT ?? 13030)
    const { server } = await startMockRemoteGateway(port)
    process.env.MOCK_REMOTE_GATEWAY_PORT = String(port)

    return async () => {
        await closeServer(server)
    }
}
