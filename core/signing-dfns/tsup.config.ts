// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from 'tsup'
import { base } from '../../tsup.base'

export default defineConfig({
    ...base,
    entry: ['src/index.ts'],
})
