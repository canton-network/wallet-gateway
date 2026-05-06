// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, test, describe } from '@jest/globals'

import {
    isRpcError,
    SigningProvider,
    PartyMode,
} from '@canton-network/core-signing-lib'

import DfnsSigningDriver, { DfnsCredentials } from './index.js'

const TEST_USER_ID = 'test-user-id'

function createTestDriver() {
    const credentials: DfnsCredentials = {
        credId: 'test-cred-id',
        privateKey:
            '-----BEGIN EC PRIVATE KEY-----\ntest\n-----END EC PRIVATE KEY-----',
        authToken:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmdJZCI6Im9yLXRlc3Qtb3JnLWlkIn0.test',
    }

    return new DfnsSigningDriver({
        orgId: 'or-test-org-id',
        baseUrl: 'https://api.dfns.io',
        credentials,
    })
}

describe('DfnsSigningDriver', () => {
    test('has correct signing provider', () => {
        const driver = createTestDriver()
        expect(driver.signingProvider).toBe(SigningProvider.DFNS)
    })

    test('has external party mode', () => {
        const driver = createTestDriver()
        expect(driver.partyMode).toBe(PartyMode.EXTERNAL)
    })

    test('controller returns methods object', () => {
        const driver = createTestDriver()
        const controller = driver.controller(TEST_USER_ID)

        expect(controller.signTransaction).toBeDefined()
        expect(controller.getTransaction).toBeDefined()
        expect(controller.getTransactions).toBeDefined()
        expect(controller.getKeys).toBeDefined()
        expect(controller.createKey).toBeDefined()
        expect(controller.getConfiguration).toBeDefined()
        expect(controller.setConfiguration).toBeDefined()
        expect(controller.subscribeTransactions).toBeDefined()
    })

    test('createKey returns error when API call fails', async () => {
        const driver = createTestDriver()
        const controller = driver.controller(TEST_USER_ID)
        const result = await controller.createKey({ name: 'test-wallet' })

        expect(isRpcError(result)).toBe(true)
        if (isRpcError(result)) {
            expect(result.error).toBe('creation_error')
        }
    })

    test('getTransactions requires filters', async () => {
        const driver = createTestDriver()
        const controller = driver.controller(TEST_USER_ID)
        const result = await controller.getTransactions({})

        expect(isRpcError(result)).toBe(true)
        if (isRpcError(result)) {
            expect(result.error).toBe('bad_arguments')
        }
    })

    test('getConfiguration roundtrips for setConfiguration', async () => {
        const driver = createTestDriver()
        const controller = driver.controller(TEST_USER_ID)
        const config = await controller.getConfiguration()

        expect(config.orgId).toBe('or-test-org-id')
        expect(config.baseUrl).toBe('https://api.dfns.io')
        expect(config.credentials.credId).toBe('test-cred-id')
        expect(config.credentials.privateKey).toContain('BEGIN EC PRIVATE KEY')
        expect(config.credentials.authToken).toContain('eyJ')

        const result = await controller.setConfiguration(config)
        expect(isRpcError(result)).toBe(false)
    })

    test('setConfiguration validates orgId', async () => {
        const driver = createTestDriver()
        const controller = driver.controller(TEST_USER_ID)

        const invalidConfig = {
            orgId: '',
            baseUrl: 'https://api.dfns.io',
            credentials: {
                credId: 'c',
                privateKey: 'p',
                authToken: 'a',
            },
        }

        const result = await controller.setConfiguration(invalidConfig)
        expect(isRpcError(result)).toBe(true)
    })

    test('setConfiguration validates baseUrl', async () => {
        const driver = createTestDriver()
        const controller = driver.controller(TEST_USER_ID)

        const invalidConfig = {
            orgId: 'or-test-org-id',
            baseUrl: 'not-a-valid-url',
            credentials: {
                credId: 'c',
                privateKey: 'p',
                authToken: 'a',
            },
        }

        const result = await controller.setConfiguration(invalidConfig)
        expect(isRpcError(result)).toBe(true)
    })

    test('setConfiguration accepts valid config', async () => {
        const driver = createTestDriver()
        const controller = driver.controller(TEST_USER_ID)

        const validConfig = {
            orgId: 'or-new-org-id',
            baseUrl: 'https://api.dfns.ninja',
            credentials: {
                credId: 'new-cred',
                privateKey: 'new-key',
                authToken: 'new-token',
            },
        }

        const result = await controller.setConfiguration(validConfig)
        expect(isRpcError(result)).toBe(false)
        expect(result.orgId).toBe('or-new-org-id')
    })

    test('subscribeTransactions returns empty object', async () => {
        const driver = createTestDriver()
        const controller = driver.controller(TEST_USER_ID)
        const result = await controller.subscribeTransactions({
            txIds: ['test'],
        })

        expect(result).toEqual({})
    })
})
