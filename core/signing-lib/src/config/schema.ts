// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod'

export enum SigningProvider {
    WALLET_KERNEL = 'wallet-kernel',
    PARTICIPANT = 'participant',
    FIREBLOCKS = 'fireblocks',
    BLOCKDAEMON = 'blockdaemon',
    DFNS = 'dfns',
}

// Generic signing driver configuration schema
export const signingDriverConfigSchema = z.object({
    provider: z.nativeEnum(SigningProvider),
    properties: z.record(z.string(), z.any()).optional(),
})

// Top-level Signing Configuration Schema - array of driver configs
export const signingConfigSchema = z.object({
    drivers: z.array(signingDriverConfigSchema).optional(),
})

// Type exports
export type SigningDriverAppConfig = z.infer<typeof signingDriverConfigSchema>
export type SigningConfig = z.infer<typeof signingConfigSchema>
