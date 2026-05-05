// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, Page } from '@playwright/test'
import { WalletGateway } from '@canton-network/core-wallet-test-utils'

const BASE_URL = 'http://localhost:8081'

export const createWalletGateway = (dappPage: Page): WalletGateway =>
    new WalletGateway({
        dappPage,
        openButton: (page) =>
            page.getByRole('button', {
                name: 'Gateway',
            }),
        connectButton: (page) =>
            page.getByRole('button', {
                name: 'Connect',
            }),
    })

export const setupRegistry = async (page: Page): Promise<void> => {
    await page.goto(`${BASE_URL}/settings`)
    await page.getByLabel('Party ID').fill(' ')
    await page.getByLabel('Registry URL').fill('http://scan.localhost:4000')
    await page.getByRole('button', { name: 'Add' }).click()
    // Wait for registry to be added (table row appears with DSO party ID)
    await expect(page.getByRole('cell', { name: /^DSO::/ })).toBeVisible()
}

const navigateToDashboard = async (page: Page): Promise<void> => {
    await page.getByRole('link', { name: 'Splice Portfolio' }).click()
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({
        timeout: 10000,
    })
}

/**
 * TAP via the settings page
 * Navigates to /settings, selects the AMT instrument, fills the amount,
 * submits, then returns to the dashboard.
 */
export const tap = async (
    page: Page,
    wg: WalletGateway,
    amount: string
): Promise<void> => {
    await page.goto(`${BASE_URL}/settings`)

    // Wait for the DevNet Tap section to be visible
    await expect(page.getByText('DevNet Tap')).toBeVisible({ timeout: 10000 })

    const tapForm = page.locator('form').filter({
        has: page.getByRole('button', { name: 'TAP' }),
    })

    // Select the AMT instrument (wait for instruments to load from registry)
    await tapForm.getByLabel('Instrument').click()
    await expect(page.getByRole('option', { name: /AMT/ })).toBeVisible({
        timeout: 10000,
    })
    await page.getByRole('option', { name: /AMT/ }).click()

    await tapForm.getByLabel('Amount').clear()
    await tapForm.getByLabel('Amount').fill(amount)

    // Wait for TAP button to be enabled before clicking
    await expect(tapForm.getByRole('button', { name: 'TAP' })).toBeEnabled({
        timeout: 5000,
    })

    await wg.approveTransaction(() =>
        tapForm.getByRole('button', { name: 'TAP' }).click()
    )

    await navigateToDashboard(page)
}

export const openTransferDialog = async (page: Page): Promise<void> => {
    await page
        .locator('button')
        .filter({ has: page.locator('[data-testid="MoreVertIcon"]') })
        .click()
    await page.getByRole('menuitem', { name: 'Make Transfer' }).click()
    await expect(
        page.locator('h2').filter({ hasText: 'Make Transfer' })
    ).toBeVisible()
}

export const gotoDashboard = async (page: Page): Promise<void> => {
    await page.goto(`${BASE_URL}/`)
    await expect(page).toHaveTitle(/dApp Portfolio/)
}

/**
 * Fill and submit the Make Transfer dialog.
 * Assumes the dialog is already open.
 */
export const fillAndSubmitTransfer = async (
    page: Page,
    wg: WalletGateway,
    opts: { amount: string; recipient: string; message: string }
): Promise<void> => {
    await page.getByLabel('Instrument').click()
    await page.getByRole('option', { name: /AMT/ }).click()
    await page.getByLabel('Amount').fill(opts.amount)
    await page.getByLabel('Recipient').fill(opts.recipient)
    await page.getByLabel('Message (optional)').fill(opts.message)

    await wg.approveTransaction(() =>
        page.getByRole('button', { name: 'Transfer', exact: true }).click()
    )
}

/**
 * Switch primary wallet via the Gateway panel.
 */
export const switchWallet = async (
    page: Page,
    wg: WalletGateway,
    partyId: string
): Promise<void> => {
    const openButton = page.getByRole('button', { name: 'Gateway' })
    await expect(openButton).toBeVisible()

    if (!(await wg.isPopupOpen())) {
        await wg.openPopup()
    }

    await wg.setPrimaryWallet(partyId)
}

/**
 * Tap funds and create an allocation via the Action Required dialog.
 */
export const tapAndCreateAllocation = async (
    page: Page,
    wg: WalletGateway,
    amount: string,
    allocationsToCreate = 1
): Promise<void> => {
    await tap(page, wg, amount)

    // Wait for allocation request to appear in Action Required
    await expect(page.getByText('Action Required')).toBeVisible({
        timeout: 10000,
    })
    await expect(
        page.getByText('Allocation', { exact: true }).first()
    ).toBeVisible()

    // Open allocation dialog
    await page.getByText('Allocation', { exact: true }).first().click()

    const createAllocationButtons = page.getByRole('button', {
        name: 'Create Allocation',
    })
    await expect(createAllocationButtons).toHaveCount(allocationsToCreate)

    for (let i = 0; i < allocationsToCreate; i++) {
        await wg.approveTransaction(() =>
            createAllocationButtons.first().click()
        )
        await expect(createAllocationButtons).toHaveCount(
            allocationsToCreate - i - 1,
            { timeout: 10000 }
        )
    }

    await page.getByRole('button', { name: 'Close' }).click()
}
