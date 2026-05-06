// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { OTCTrade } from '@canton-network/core-wallet-test-utils'
import { pino } from 'pino'
import { input, confirm } from '@inquirer/prompts'

const logger = pino({ name: 'otc-trade', level: 'info' })

const venue = await input({ message: 'Party ID for Venue' })
const alice = await input({ message: 'Party ID for Alice' })
const bob = await input({ message: 'Party ID for Bob' })
const charlie = await input({ message: 'Party ID for Charlie' })

const tradeHelper = new OTCTrade({
    logger,
    venue,
    alice,
    bob,
    charlie,
})

const tradeDetails = await tradeHelper.setup()

await confirm({
    message: 'Please confirm once all parties have made their allocations',
})

await tradeHelper.settle(tradeDetails)
