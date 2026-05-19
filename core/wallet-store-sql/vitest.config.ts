// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { defineConfig, defineProject } from 'vitest/config'

export default defineConfig({
    test: {
        coverage: {
            include: ['src/**/*.ts'],
            exclude: ['src/migrations-test/**'],
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            thresholds: {
                lines: 0,
                functions: 0,
                branches: 0,
                statements: 0,
            },
        },
        projects: [
            defineProject({
                test: {
                    name: 'node',
                    environment: 'node',
                    include: ['src/**/*.test.ts'],
                    exclude: ['src/migrations-test/**'],
                },
            }),
            defineProject({
                test: {
                    name: 'migrations',
                    environment: 'node',
                    include: ['src/migrations-test/**/*.test.ts'],
                    globalSetup: ['src/migrations-test/global-setup.ts'],
                    testTimeout: 120_000,
                    hookTimeout: 120_000,
                },
            }),
        ],
    },
})
