// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { UserId } from '@canton-network/core-wallet-auth'
import { Store, Wallet } from '@canton-network/core-wallet-store'
import {
    SigningDriverInterface,
    SigningProvider,
} from '@canton-network/core-signing-lib'
import { Logger } from 'pino'
import { PartyAllocationService } from '../party-allocation-service.js'
import { PartyHint, Primary } from '../../user-api/rpc-gen/typings.js'
import { ParticipantWalletAllocator } from './signing-providers/participant-wallet-allocator.js'
import { KernelWalletAllocator } from './signing-providers/kernel-wallet-allocator.js'
import { FireblocksWalletAllocator } from './signing-providers/fireblocks-wallet-allocator.js'
import { BlockdaemonWalletAllocator } from './signing-providers/blockdaemon-wallet-allocator.js'
import { DfnsWalletAllocator } from './signing-providers/dfns-wallet-allocator.js'

export interface WalletAllocator {
    createWallet(
        userId: UserId,
        email: string | undefined,
        partyHint: PartyHint,
        primary: Primary
    ): Promise<Wallet>
    allocateParty(
        userId: UserId,
        email: string | undefined,
        existingWallet: Wallet
    ): Promise<void>
}

export class WalletAllocationService {
    private readonly participantAllocator: ParticipantWalletAllocator
    private readonly kernelAllocator?: KernelWalletAllocator
    private readonly fireblocksAllocator?: FireblocksWalletAllocator
    private readonly blockdaemonAllocator?: BlockdaemonWalletAllocator
    private readonly dfnsAllocator?: DfnsWalletAllocator

    constructor(
        store: Store,
        logger: Logger,
        partyAllocator: PartyAllocationService,
        signingDrivers: Partial<
            Record<SigningProvider, SigningDriverInterface>
        > = {}
    ) {
        this.participantAllocator = new ParticipantWalletAllocator(
            store,
            logger,
            partyAllocator
        )

        const kernelDriver = signingDrivers[SigningProvider.WALLET_KERNEL]
        if (kernelDriver) {
            this.kernelAllocator = new KernelWalletAllocator(
                store,
                logger,
                partyAllocator,
                kernelDriver
            )
        }

        const fireblocksDriver = signingDrivers[SigningProvider.FIREBLOCKS]
        if (fireblocksDriver) {
            this.fireblocksAllocator = new FireblocksWalletAllocator(
                store,
                logger,
                partyAllocator,
                fireblocksDriver
            )
        }

        const blockdaemonDriver = signingDrivers[SigningProvider.BLOCKDAEMON]
        if (blockdaemonDriver) {
            this.blockdaemonAllocator = new BlockdaemonWalletAllocator(
                store,
                logger,
                partyAllocator,
                blockdaemonDriver
            )
        }

        const dfnsDriver = signingDrivers[SigningProvider.DFNS]
        if (dfnsDriver) {
            this.dfnsAllocator = new DfnsWalletAllocator(
                store,
                logger,
                partyAllocator,
                dfnsDriver
            )
        }
    }

    public async createWallet(
        userId: UserId,
        email: string | undefined,
        partyHint: PartyHint,
        primary: Primary,
        signingProviderId: SigningProvider
    ): Promise<Wallet> {
        switch (signingProviderId) {
            case SigningProvider.PARTICIPANT:
                return this.participantAllocator.createWallet(
                    userId,
                    email,
                    partyHint,
                    primary
                )
            case SigningProvider.WALLET_KERNEL:
                if (!this.kernelAllocator) {
                    throw new Error(
                        'Wallet Kernel signing driver not available'
                    )
                }
                return this.kernelAllocator.createWallet(
                    userId,
                    email,
                    partyHint,
                    primary
                )
            case SigningProvider.FIREBLOCKS:
                if (!this.fireblocksAllocator) {
                    throw new Error('Fireblocks signing driver not available')
                }
                return this.fireblocksAllocator.createWallet(
                    userId,
                    email,
                    partyHint,
                    primary
                )
            case SigningProvider.BLOCKDAEMON:
                if (!this.blockdaemonAllocator) {
                    throw new Error('Blockdaemon signing driver not available')
                }
                if (!email) {
                    throw new Error(
                        'Email is required for Blockdaemon wallet allocation'
                    )
                }
                return this.blockdaemonAllocator.createWallet(
                    userId,
                    email,
                    partyHint,
                    primary
                )
            case SigningProvider.DFNS:
                if (!this.dfnsAllocator) {
                    throw new Error('Dfns signing driver not available')
                }
                return this.dfnsAllocator.createWallet(
                    userId,
                    email,
                    partyHint,
                    primary
                )
            default:
                throw new Error(
                    `Unsupported signing provider: ${signingProviderId}`
                )
        }
    }

    public async allocateParty(
        userId: UserId,
        email: string | undefined,
        existingWallet: Wallet,
        signingProviderId: SigningProvider
    ): Promise<void> {
        switch (signingProviderId) {
            case SigningProvider.PARTICIPANT:
                return this.participantAllocator.allocateParty(
                    userId,
                    email,
                    existingWallet
                )
            case SigningProvider.WALLET_KERNEL:
                if (!this.kernelAllocator) {
                    throw new Error(
                        'Wallet Kernel signing driver not available'
                    )
                }
                return this.kernelAllocator.allocateParty(
                    userId,
                    email,
                    existingWallet
                )
            case SigningProvider.FIREBLOCKS:
                if (!this.fireblocksAllocator) {
                    throw new Error('Fireblocks signing driver not available')
                }
                return this.fireblocksAllocator.allocateParty(
                    userId,
                    email,
                    existingWallet
                )
            case SigningProvider.BLOCKDAEMON:
                if (!this.blockdaemonAllocator) {
                    throw new Error('Blockdaemon signing driver not available')
                }
                if (!email) {
                    throw new Error(
                        'Email is required for Blockdaemon wallet allocation'
                    )
                }
                return this.blockdaemonAllocator.allocateParty(
                    userId,
                    email,
                    existingWallet
                )
            case SigningProvider.DFNS:
                if (!this.dfnsAllocator) {
                    throw new Error('Dfns signing driver not available')
                }
                return this.dfnsAllocator.allocateParty(
                    userId,
                    email,
                    existingWallet
                )
            default:
                throw new Error(
                    `Unsupported signing provider: ${signingProviderId}`
                )
        }
    }
}
