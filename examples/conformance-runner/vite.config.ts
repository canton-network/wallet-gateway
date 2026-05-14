// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 8082,
        proxy: {
            // Avoid CORS when connecting to the local Wallet Gateway during dev.
            // The dApp calls same-origin `/api/v0/dapp`, Vite forwards to the gateway.
            '/api': {
                target: 'http://localhost:3030',
                changeOrigin: true,
            },
        },
    },
})
