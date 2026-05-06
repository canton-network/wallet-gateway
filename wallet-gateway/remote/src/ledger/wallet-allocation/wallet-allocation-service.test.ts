// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import {
    vi,
    describe,
    it,
    expect,
    beforeEach,
    afterEach,
    type Mock,
} from 'vitest'
import { pino } from 'pino'
import { sink } from 'pino-test'
import type { Logger } from 'pino'
import { WalletAllocationService } from './wallet-allocation-service.js'
import type { PartyAllocationService } from '../party-allocation-service.js'
import type { Store, Wallet } from '@canton-network/core-wallet-store'
import { SigningProvider } from '@canton-network/core-signing-lib'
import type { SigningDriverInterface } from '@canton-network/core-signing-lib'
import type { AllocatedParty } from '../party-allocation-service.js'
import { WALLET_DISABLED_REASON } from '@canton-network/core-types'

const createWallet = (
    partyId: string,
    overrides: Partial<Wallet> = {}
): Wallet => ({
    primary: false,
    partyId,
    status: 'allocated',
    hint: partyId.split('::')[0],
    signingProviderId: 'internal',
    publicKey: 'test-public-key',
    namespace: 'namespace',
    networkId: 'network1',
    disabled: false,
    rights: [],
    ...overrides,
})

const createAllocatedParty = (
    partyId: string,
    hint: string,
    namespace: string
): AllocatedParty => ({
    partyId,
    hint,
    namespace,
})

function createFireblocksDriver(options: {
    signTransactionResult?: { status: string; txId: string }
    getTransactionResult?: {
        txId: string
        status: string
        signature?: string
    }
}): SigningDriverInterface {
    const getKeysResult = {
        keys: [{ id: 'key-1', name: 'Canton Party', publicKey: 'fb-pk' }],
    }
    const signTransactionResult = options.signTransactionResult ?? {
        status: 'pending',
        txId: 'tx-1',
    }
    const getTransactionResult =
        options.getTransactionResult ?? signTransactionResult
    return {
        controller: vi.fn().mockReturnValue({
            getKeys: vi
                .fn<
                    () => Promise<{
                        keys: Array<{
                            id: string
                            name: string
                            publicKey: string
                        }>
                    }>
                >()
                .mockResolvedValue(getKeysResult),
            signTransaction: vi
                .fn<() => Promise<{ status: string; txId: string }>>()
                .mockResolvedValue(signTransactionResult),
            getTransaction: vi
                .fn<
                    () => Promise<{
                        txId: string
                        status: string
                        signature?: string
                    }>
                >()
                .mockResolvedValue(getTransactionResult),
        }),
    } as unknown as SigningDriverInterface
}

function createBlockdaemonDriver(options: {
    signTransactionResult?: { status: string; txId: string }
    getTransactionResult?: {
        txId: string
        status: string
        signature?: string
    }
}): SigningDriverInterface {
    const signTransactionResult = options.signTransactionResult ?? {
        status: 'pending',
        txId: 'tx-1',
    }
    const getTransactionResult =
        options.getTransactionResult ?? signTransactionResult
    return {
        controller: vi.fn().mockReturnValue({
            createKey: vi
                .fn<() => Promise<{ publicKey: string }>>()
                .mockResolvedValue({
                    publicKey: 'bd-pk',
                }),
            signTransaction: vi
                .fn<() => Promise<{ status: string; txId: string }>>()
                .mockResolvedValue(signTransactionResult),
            getTransaction: vi
                .fn<
                    () => Promise<{
                        txId: string
                        status: string
                        signature?: string
                    }>
                >()
                .mockResolvedValue(getTransactionResult),
        }),
    } as unknown as SigningDriverInterface
}

describe('WalletAllocationService', () => {
    let mockLogger: Logger
    let mockStore: {
        getWallets: ReturnType<typeof vi.fn>
        removeWallet: ReturnType<typeof vi.fn>
        addWallet: ReturnType<typeof vi.fn>
        updateWallet: ReturnType<typeof vi.fn>
        getCurrentNetwork: ReturnType<typeof vi.fn>
    }
    let mockPartyAllocator: {
        allocateParty: ReturnType<typeof vi.fn>
        allocatePartyWithExistingWallet: ReturnType<typeof vi.fn>
        createFingerprintFromKey: ReturnType<typeof vi.fn>
        generateTopologyTransactions: ReturnType<typeof vi.fn>
    }
    let mockController: {
        createKey: ReturnType<typeof vi.fn>
        signTransaction: ReturnType<typeof vi.fn>
    }
    let mockWalletKernelDriver: SigningDriverInterface
    let service: WalletAllocationService

    const createService = (
        drivers: Partial<Record<SigningProvider, SigningDriverInterface>>
    ) =>
        new WalletAllocationService(
            mockStore as unknown as Store,
            mockLogger,
            mockPartyAllocator as unknown as PartyAllocationService,
            drivers
        )

    beforeEach(async () => {
        mockLogger = pino(sink()) as Logger
        mockStore = {
            getWallets: vi.fn(),
            removeWallet: vi.fn(),
            addWallet: vi.fn(),
            updateWallet: vi.fn(),
            getCurrentNetwork: vi
                .fn<() => Promise<{ id: string }>>()
                .mockResolvedValue({ id: 'network1' }),
        }

        mockPartyAllocator = {
            allocateParty: vi.fn(),
            allocatePartyWithExistingWallet: vi.fn(),
            createFingerprintFromKey: vi.fn().mockReturnValue('fingerprint'),
            generateTopologyTransactions: vi
                .fn<
                    () => Promise<{
                        topologyTransactions: string[]
                        multiHash: string
                    }>
                >()
                .mockResolvedValue({
                    topologyTransactions: ['tx1'],
                    multiHash: 'hash',
                }),
        }

        mockController = {
            createKey: vi
                .fn<
                    () => Promise<{
                        id: string
                        name: string
                        publicKey: string
                    }>
                >()
                .mockResolvedValue({
                    id: 'key-id',
                    name: 'test-key',
                    publicKey: 'new-public-key',
                }),
            signTransaction: vi
                .fn<
                    () => Promise<{
                        txId: string
                        status: string
                        signature: string
                    }>
                >()
                .mockResolvedValue({
                    txId: 'tx-id',
                    status: 'signed',
                    signature: 'sig',
                }),
        }

        mockWalletKernelDriver = {
            controller: vi.fn(() => mockController),
        } as unknown as SigningDriverInterface

        service = createService({
            [SigningProvider.WALLET_KERNEL]: mockWalletKernelDriver,
        })
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('Participant', () => {
        it('createWallet allocates new party and adds wallet', async () => {
            const expectedParty = createAllocatedParty(
                'alice::participant1',
                'alice',
                'participant1'
            )
            mockPartyAllocator.allocateParty.mockResolvedValue(expectedParty)

            const result = await service.createWallet(
                'user-1',
                undefined,
                'alice',
                false,
                SigningProvider.PARTICIPANT
            )

            expect(mockPartyAllocator.allocateParty).toHaveBeenCalledWith(
                'user-1',
                'alice'
            )
            expect(mockStore.addWallet).toHaveBeenCalledWith(
                expect.objectContaining({
                    partyId: 'alice::participant1',
                    status: 'allocated',
                    networkId: 'network1',
                })
            )
            expect(result.partyId).toBe('alice::participant1')
            expect(result.status).toBe('allocated')
        })

        it('allocateParty allocates party and updates store', async () => {
            const expectedParty = createAllocatedParty(
                'alice::participant1',
                'alice',
                'participant1'
            )
            mockPartyAllocator.allocateParty.mockResolvedValue(expectedParty)
            const existingWallet = createWallet('alice::namespace', {
                hint: 'alice',
                namespace: 'namespace',
                signingProviderId: SigningProvider.PARTICIPANT,
            })

            await service.allocateParty(
                'user-1',
                undefined,
                existingWallet,
                SigningProvider.PARTICIPANT
            )

            expect(mockPartyAllocator.allocateParty).toHaveBeenCalledWith(
                'user-1',
                'alice'
            )
            expect(mockStore.updateWallet).toHaveBeenCalledWith({
                partyId: 'alice::participant1',
                networkId: 'network1',
                status: 'allocated',
            })
        })
    })

    describe('Wallet Gateway', () => {
        it('createWallet initializes new wallet and adds to store', async () => {
            const expectedParty = createAllocatedParty(
                'bob::fingerprint',
                'bob',
                'fingerprint'
            )
            mockPartyAllocator.createFingerprintFromKey.mockReturnValue(
                'fingerprint'
            )
            mockPartyAllocator.allocateParty.mockResolvedValue(expectedParty)

            const result = await service.createWallet(
                'user-1',
                undefined,
                'bob',
                false,
                SigningProvider.WALLET_KERNEL
            )

            expect(mockStore.addWallet).toHaveBeenCalledWith(
                expect.objectContaining({
                    partyId: 'bob::fingerprint',
                    status: 'allocated',
                    publicKey: 'new-public-key',
                })
            )
            expect(result.partyId).toBe('bob::fingerprint')
            expect(result.publicKey).toBe('new-public-key')
            expect(
                (
                    mockWalletKernelDriver as unknown as {
                        controller: Mock
                    }
                ).controller
            ).toHaveBeenCalledWith('user-1')
            expect(mockController.createKey).toHaveBeenCalledWith({
                name: 'bob',
            })
        })

        it('allocateParty allocates with existing public key and updates store', async () => {
            const expectedParty = createAllocatedParty(
                'bob::fingerprint',
                'bob',
                'fingerprint'
            )
            mockPartyAllocator.allocateParty.mockImplementation(
                async (_userId, _hint, _publicKey?, signingCallback?) => {
                    if (signingCallback) {
                        await signingCallback('test-hash')
                    }
                    return expectedParty
                }
            )
            const existingWallet = createWallet('bob::namespace', {
                hint: 'bob',
                publicKey: 'existing-public-key',
                signingProviderId: SigningProvider.WALLET_KERNEL,
            })

            await service.allocateParty(
                'user-1',
                undefined,
                existingWallet,
                SigningProvider.WALLET_KERNEL
            )

            expect(mockController.signTransaction).toHaveBeenCalledWith(
                expect.objectContaining({
                    txHash: 'test-hash',
                    keyIdentifier: { publicKey: 'existing-public-key' },
                })
            )
            expect(mockStore.updateWallet).toHaveBeenCalledWith({
                partyId: 'bob::fingerprint',
                networkId: 'network1',
                status: 'allocated',
            })
        })

        it('throws when Wallet Gateway signing driver not available', async () => {
            const serviceWithoutDriver = createService({})

            await expect(
                serviceWithoutDriver.createWallet(
                    'user-1',
                    undefined,
                    'bob',
                    false,
                    SigningProvider.WALLET_KERNEL
                )
            ).rejects.toThrow('Wallet Gateway signing driver not available')
        })
    })

    describe('Fireblocks', () => {
        it('throws when Fireblocks signing driver not available', async () => {
            const serviceWithoutFireblocks = createService({})

            await expect(
                serviceWithoutFireblocks.createWallet(
                    'user-1',
                    undefined,
                    'alice',
                    false,
                    SigningProvider.FIREBLOCKS
                )
            ).rejects.toThrow('Fireblocks signing driver not available')
        })

        it('createWallet returns allocated when signTransaction returns signed', async () => {
            const serviceWithFireblocks = createService({
                [SigningProvider.FIREBLOCKS]: createFireblocksDriver({
                    signTransactionResult: { status: 'signed', txId: 'tx-1' },
                    getTransactionResult: {
                        txId: 'tx-1',
                        status: 'signed',
                        signature: 'deadbeef',
                    },
                }),
            })
            mockPartyAllocator.allocatePartyWithExistingWallet.mockResolvedValue(
                'alice::namespace'
            )

            const result = await serviceWithFireblocks.createWallet(
                'user-1',
                undefined,
                'alice',
                false,
                SigningProvider.FIREBLOCKS
            )

            expect(result.status).toBe('allocated')
            expect(result.partyId).toBe('alice::namespace')
            expect(
                mockPartyAllocator.allocatePartyWithExistingWallet
            ).toHaveBeenCalled()
            expect(mockStore.addWallet).toHaveBeenCalled()
        })

        it('createWallet returns initialized when signTransaction returns pending', async () => {
            const serviceWithFireblocks = createService({
                [SigningProvider.FIREBLOCKS]: createFireblocksDriver({
                    signTransactionResult: { status: 'pending', txId: 'tx-1' },
                    getTransactionResult: {
                        txId: 'tx-1',
                        status: 'pending',
                    },
                }),
            })

            const result = await serviceWithFireblocks.createWallet(
                'user-1',
                undefined,
                'alice',
                false,
                SigningProvider.FIREBLOCKS
            )

            expect(result.status).toBe('initialized')
            expect(
                mockPartyAllocator.allocatePartyWithExistingWallet
            ).not.toHaveBeenCalled()
            expect(mockStore.addWallet).toHaveBeenCalled()
        })

        it.each([
            ['failed', WALLET_DISABLED_REASON.TOPOLOGY_TRANSACTION_FAILED],
            ['rejected', WALLET_DISABLED_REASON.TOPOLOGY_TRANSACTION_REJECTED],
        ] as const)(
            'createWallet returns status removed with reason when signTransaction returns %s',
            async (status, expectedReason) => {
                const serviceWithFireblocks = createService({
                    [SigningProvider.FIREBLOCKS]: createFireblocksDriver({
                        signTransactionResult: { status, txId: 'tx-1' },
                        getTransactionResult: {
                            txId: 'tx-1',
                            status,
                        },
                    }),
                })

                const result = await serviceWithFireblocks.createWallet(
                    'user-1',
                    undefined,
                    'alice',
                    false,
                    SigningProvider.FIREBLOCKS
                )

                expect(result.status).toBe('removed')
                expect(result.reason).toBe(expectedReason)
                expect(
                    mockPartyAllocator.allocatePartyWithExistingWallet
                ).not.toHaveBeenCalled()
                expect(mockStore.addWallet).toHaveBeenCalled()
            }
        )
    })

    describe('Blockdaemon', () => {
        it('throws when Blockdaemon signing driver not available', async () => {
            const serviceWithoutBlockdaemon = createService({})

            await expect(
                serviceWithoutBlockdaemon.createWallet(
                    'user-1',
                    'user-1@example.com',
                    'alice',
                    false,
                    SigningProvider.BLOCKDAEMON
                )
            ).rejects.toThrow('Blockdaemon signing driver not available')
        })

        it('createWallet returns initialized when signTransaction returns pending', async () => {
            const serviceWithBlockdaemon = createService({
                [SigningProvider.BLOCKDAEMON]: createBlockdaemonDriver({
                    signTransactionResult: { status: 'pending', txId: 'tx-1' },
                }),
            })

            const result = await serviceWithBlockdaemon.createWallet(
                'user-1',
                'user-1@example.com',
                'alice',
                false,
                SigningProvider.BLOCKDAEMON
            )

            expect(result.status).toBe('initialized')
            expect(result.reason).toBe(
                WALLET_DISABLED_REASON.TOPOLOGY_TRANSACTION_PENDING
            )
            expect(result.externalTxId).toBe('tx-1')
            expect(result.partyId).toBe('alice::fingerprint')
            expect(
                mockPartyAllocator.allocatePartyWithExistingWallet
            ).not.toHaveBeenCalled()
            expect(mockStore.addWallet).toHaveBeenCalled()
        })

        it('createWallet returns allocated when signTransaction returns signed', async () => {
            const serviceWithBlockdaemon = createService({
                [SigningProvider.BLOCKDAEMON]: createBlockdaemonDriver({
                    signTransactionResult: { status: 'signed', txId: 'tx-1' },
                    getTransactionResult: {
                        txId: 'tx-1',
                        status: 'signed',
                        signature: 'sig-base64',
                    },
                }),
            })
            mockPartyAllocator.allocatePartyWithExistingWallet.mockResolvedValue(
                'alice::namespace'
            )

            const result = await serviceWithBlockdaemon.createWallet(
                'user-1',
                'user-1@example.com',
                'alice',
                false,
                SigningProvider.BLOCKDAEMON
            )

            expect(result.status).toBe('allocated')
            expect(result.partyId).toBe('alice::namespace')
            expect(
                mockPartyAllocator.allocatePartyWithExistingWallet
            ).toHaveBeenCalled()
            expect(mockStore.addWallet).toHaveBeenCalled()
        })
    })
})
