// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { UserId } from '@canton-network/core-wallet-auth'
import { Store, UpdateWallet, Wallet } from '@canton-network/core-wallet-store'
import {
    Error as SigningError,
    SigningDriverInterface,
    SigningProvider,
} from '@canton-network/core-signing-lib'
import { Logger } from 'pino'
import { PartyAllocationService } from '../../party-allocation-service.js'
import { PartyHint, Primary } from '../../../user-api/rpc-gen/typings.js'
import type { WalletAllocator } from '../wallet-allocation-service.js'
import { WALLET_DISABLED_REASON } from '@canton-network/core-types'

function handleSigningError<T extends object>(result: SigningError | T): T {
    if ('error' in result) {
        throw new Error(
            `Error from signing driver: ${result.error_description}`
        )
    }
    return result
}

/**
 * Dfns sign-only allocator. The gateway runs the topology flow against its
 * configured validator; Dfns is asked only to sign the topology hash, mirroring
 * the bring-your-own-validator pattern used for other external providers.
 */
export class DfnsWalletAllocator implements WalletAllocator {
    constructor(
        private store: Store,
        private logger: Logger,
        private partyAllocator: PartyAllocationService,
        private signingDriver: SigningDriverInterface
    ) {}

    async createWallet(
        userId: UserId,
        _email: string | undefined,
        partyHint: PartyHint,
        primary: Primary = false
    ): Promise<Wallet> {
        const driver = this.signingDriver.controller(userId)

        const key = await driver
            .createKey({ name: partyHint })
            .then(handleSigningError)

        const namespace = this.partyAllocator.createFingerprintFromKey(
            key.publicKey
        )
        const transactions =
            await this.partyAllocator.generateTopologyTransactions(
                partyHint,
                key.publicKey
            )
        const topologyTransactions = transactions.topologyTransactions ?? []

        const internalTxId = crypto
            .randomUUID()
            .replace(/-/g, '')
            .substring(0, 16)
        const txPayload = JSON.stringify(topologyTransactions)

        const { status, txId } = await driver
            .signTransaction({
                tx: Buffer.from(txPayload).toString('base64'),
                txHash: transactions.multiHash,
                keyIdentifier: { id: key.id, publicKey: key.publicKey },
                internalTxId,
            })
            .then(handleSigningError)

        const network = await this.store.getCurrentNetwork()
        const walletBase: Omit<Wallet, 'status'> = {
            partyId: `${partyHint}::${namespace}`,
            hint: partyHint,
            namespace,
            signingProviderId: SigningProvider.DFNS,
            networkId: network.id,
            primary,
            publicKey: key.publicKey,
            externalTxId: txId,
            topologyTransactions: topologyTransactions.join(', '),
            rights: [],
        }

        const wallet = await this.finalizeWallet(
            walletBase,
            userId,
            status,
            txId,
            topologyTransactions,
            namespace,
            driver
        )

        await this.store.addWallet(wallet)
        return wallet
    }

    async allocateParty(
        userId: UserId,
        _email: string | undefined,
        existingWallet: Wallet
    ): Promise<void> {
        if (
            !existingWallet.externalTxId ||
            !existingWallet.topologyTransactions
        ) {
            throw new Error(
                'Existing wallet is missing field externalTxId or topologyTransactions'
            )
        }
        const driver = this.signingDriver.controller(userId)

        const { signature, status, metadata } = await driver
            .getTransaction({ txId: existingWallet.externalTxId })
            .then(handleSigningError)

        let walletUpdate: UpdateWallet = {
            partyId: existingWallet.partyId,
            networkId: existingWallet.networkId,
        }
        if (status === 'signed') {
            if (!signature) {
                throw new Error(
                    'Transaction signed but no signature found in result'
                )
            }
            const partyId =
                await this.partyAllocator.allocatePartyWithExistingWallet(
                    existingWallet.namespace,
                    existingWallet.topologyTransactions.split(', '),
                    signature,
                    userId
                )
            walletUpdate = {
                ...walletUpdate,
                partyId,
                status: 'allocated',
                reason: '',
            }
        } else if (status === 'pending') {
            walletUpdate = {
                ...walletUpdate,
                status: 'initialized',
                reason: WALLET_DISABLED_REASON.TOPOLOGY_TRANSACTION_PENDING,
            }
        } else {
            this.logger.warn(
                `Topology transaction for wallet ${existingWallet.partyId} was ${status} with ${JSON.stringify(metadata)}`
            )
            const reason =
                status === 'rejected'
                    ? WALLET_DISABLED_REASON.TOPOLOGY_TRANSACTION_REJECTED
                    : WALLET_DISABLED_REASON.TOPOLOGY_TRANSACTION_FAILED
            walletUpdate = {
                ...walletUpdate,
                status: 'removed',
                disabled: true,
                reason,
            }
        }

        return this.store.updateWallet(walletUpdate)
    }

    private async finalizeWallet(
        walletBase: Omit<Wallet, 'status'>,
        userId: UserId,
        status: string,
        txId: string,
        topologyTransactions: string[],
        namespace: string,
        driver: ReturnType<SigningDriverInterface['controller']>
    ): Promise<Wallet> {
        if (status === 'signed') {
            const { signature } = await driver
                .getTransaction({ txId })
                .then(handleSigningError)
            if (!signature) {
                throw new Error(
                    'Transaction signed but no signature found in result'
                )
            }
            const partyId =
                await this.partyAllocator.allocatePartyWithExistingWallet(
                    namespace,
                    topologyTransactions,
                    signature,
                    userId
                )
            return { ...walletBase, partyId, status: 'allocated' }
        }

        if (status === 'pending') {
            return {
                ...walletBase,
                status: 'initialized',
                reason: WALLET_DISABLED_REASON.TOPOLOGY_TRANSACTION_PENDING,
            }
        }

        const reason =
            status === 'rejected'
                ? WALLET_DISABLED_REASON.TOPOLOGY_TRANSACTION_REJECTED
                : WALLET_DISABLED_REASON.TOPOLOGY_TRANSACTION_FAILED
        return {
            ...walletBase,
            status: 'removed',
            disabled: true,
            reason,
        }
    }
}
