// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { pino } from 'pino'
import { test } from '@playwright/test'
import { OTCTrade } from '@canton-network/core-wallet-test-utils'
import {
    createWalletGateway,
    setupRegistry,
    tapAndCreateAllocation,
    switchWallet,
    gotoDashboard,
} from './utils'

// Extend default 30s because allocation test involves OTC trade setup, multiple taps, and allocations
test.setTimeout(120_000)

test('allocation via OTC trade', async ({ page: dappPage }) => {
    const rnd = Math.floor(Math.random() * 100000)
    const wg = createWalletGateway(dappPage)

    await setupRegistry(dappPage)
    await gotoDashboard(dappPage)
    await wg.connect({ network: 'LocalNet' })

    const venue = await wg.createWalletIfNotExists({
        partyHint: `venue-${rnd}`,
        signingProvider: 'participant',
    })
    const alice = await wg.createWalletIfNotExists({
        partyHint: `alice-${rnd}`,
        signingProvider: 'participant',
    })
    const bob = await wg.createWalletIfNotExists({
        partyHint: `bob-${rnd}`,
        signingProvider: 'participant',
    })
    const charlie = await wg.createWalletIfNotExists({
        partyHint: `charlie-${rnd}`,
        signingProvider: 'participant',
    })

    const logger = pino({ name: 'otc-trade', level: 'info' })
    const otcTrade = new OTCTrade({
        logger,
        venue,
        alice,
        bob,
        charlie,
    })
    const otcTradeDetails = await otcTrade.setup()

    await wg.setPrimaryWallet(alice)
    await tapAndCreateAllocation(dappPage, wg, '1000', 2)

    await switchWallet(dappPage, wg, bob)
    await tapAndCreateAllocation(dappPage, wg, '1000')

    await switchWallet(dappPage, wg, charlie)
    await tapAndCreateAllocation(dappPage, wg, '1000')

    await otcTrade.settle(otcTradeDetails)
})
