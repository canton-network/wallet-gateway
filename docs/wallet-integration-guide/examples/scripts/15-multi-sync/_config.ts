// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Multi-synchronizer localnet participant configuration.
 *
 * Port layout (PARTICIPANT_JSON_API_PORT_SUFFIX = 975):
 *   2975 — app-user     (P1): global + app-synchronizer
 *   3975 — app-provider (P2): global + app-synchronizer
 *   4975 — sv           (P3): global + app-synchronizer
 *
 */

// bob-participant JSON API (3 + PARTICIPANT_JSON_API_PORT_SUFFIX 975)
export const LOCALNET_BOB_LEDGER_URL = new URL('http://localhost:3975')

// trading-app-participant JSON API (4 + PARTICIPANT_JSON_API_PORT_SUFFIX 975)
export const LOCALNET_TRADING_APP_LEDGER_URL = new URL('http://localhost:4975')

// Party hint labels used when allocating parties
export const PARTY_HINT_ALICE = 'Alice'
export const PARTY_HINT_BOB = 'Bob'
export const PARTY_HINT_TRADING_APP = 'TradingApp'
