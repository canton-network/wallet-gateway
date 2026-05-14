// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Browser-safe exports for web-based conformance runners.
 *
 * This entrypoint must not import Node-only modules (fs, path, playwright, etc.).
 */

export { readRequiredMethodsBundled } from './required-methods'
export type { Profile } from './schemas'
