// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ['src/index.ts', 'src/browser.ts', 'src/cli.ts'],
    format: ['esm', 'cjs'],
    dts: false,
    sourcemap: true,
    clean: true,
    target: 'es2022',
    outDir: 'dist',
})
