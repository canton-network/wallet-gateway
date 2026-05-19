// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Returns a two-letter display label for an instrument avatar.
 *
 * Multi-word names use the first letter of the first two words, so
 * "Canton Coin" becomes "CC". Single-word names use the first two letters,
 * so "Amulet" becomes "AM".
 */
export function getInstrumentInitials(name: string) {
    const words = name.trim().split(/\s+/).filter(Boolean)

    if (words.length >= 2) {
        return words
            .slice(0, 2)
            .map((word) => word[0])
            .join('')
            .toUpperCase()
    }

    return name.trim().slice(0, 2).toUpperCase()
}
