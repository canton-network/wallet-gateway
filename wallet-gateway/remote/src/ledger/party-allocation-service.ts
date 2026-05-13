// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import {
    GenerateTransactionResponse,
    LedgerClient,
} from '@canton-network/core-ledger-client'
import { createHash } from 'node:crypto'
import { AccessTokenProvider } from '@canton-network/core-wallet-auth'
import { Logger } from 'pino'

export type AllocatedParty = {
    partyId: string
    hint: string
    namespace: string
}

type SigningCbFn = (hash: string) => Promise<string>

/**
 * This service provides an abstraction for Canton party allocation that seamlessly handles both internal and external parties.
 */
export class PartyAllocationService {
    private logger: Logger
    private ledgerClient: LedgerClient
    private synchronizerId: string | undefined

    constructor({
        synchronizerId,
        accessTokenProvider,
        httpLedgerUrl,
        logger,
    }: {
        synchronizerId?: string
        accessTokenProvider: AccessTokenProvider
        httpLedgerUrl: string
        logger: Logger
    }) {
        this.logger = logger
        this.synchronizerId = synchronizerId
        this.ledgerClient = new LedgerClient({
            baseUrl: new URL(httpLedgerUrl),
            logger: this.logger,
            accessTokenProvider,
        })
    }

    /**
     * Allocates an internal participant party for a user.
     * @param userId The ID of the user.
     * @param hint A hint for the party ID.
     */
    async allocateParty(userId: string, hint: string): Promise<AllocatedParty>

    /**
     * Allocates an externally signed party for a user.
     * @param userId The ID of the user.
     * @param hint A hint for the party ID.
     * @param publicKey The public key of the user.
     * @param signingCallback A callback function that asynchronously signs the onboarding request hash.
     */
    async allocateParty(
        userId: string,
        hint: string,
        publicKey: string,
        signingCallback: SigningCbFn
    ): Promise<AllocatedParty>

    async allocateParty(
        userId: string,
        hint: string,
        publicKey?: string,
        signingCallback?: SigningCbFn
    ): Promise<AllocatedParty> {
        if (publicKey !== undefined && signingCallback !== undefined) {
            return this.allocateExternalParty(
                userId,
                hint,
                publicKey,
                signingCallback
            )
        } else {
            return this.allocateInternalParty(userId, hint)
        }
    }

    /**
     * Create fingerprint
     * @param publicKey The public key of the user.
     */
    createFingerprintFromKey(publicKey: string): string

    createFingerprintFromKey(publicKey: string): string {
        // Hash purpose codes can be looked up in the Canton codebase:
        //  https://github.com/DACH-NY/canton/blob/62e9ccd3f1743d2c9422d863cfc2ca800405c71b/community/base/src/main/scala/com/digitalasset/canton/crypto/HashPurpose.scala#L52
        const hashPurpose = 12 // For `PublicKeyFingerprint`
        const keyBytes = Buffer.from(publicKey, 'base64')
        const hashInput = Buffer.alloc(4 + keyBytes.length)
        hashInput.writeUInt32BE(hashPurpose, 0)
        Buffer.from(keyBytes).copy(hashInput, 4)
        const hash = createHash('sha256').update(hashInput).digest()
        const multiprefix = Buffer.from([0x12, 0x20])
        return Buffer.concat([multiprefix, hash]).toString('hex')
    }

    /**
     * Normalizes a public key to base64 format.
     * Converts hex format (Fireblocks) to base64, or returns base64 as-is.
     * @param publicKey Public key in hex or base64 format
     * @returns Public key in base64 format, or null if conversion fails
     */
    normalizePublicKeyToBase64(publicKey: string): string | null {
        try {
            // Try hex first (Fireblocks format), fallback to base64 (internal format)
            try {
                const hexKey = Buffer.from(publicKey, 'hex')
                // If it's valid hex and produces 32 bytes, convert to base64
                if (hexKey.length === 32) {
                    return hexKey.toString('base64')
                } else {
                    // Invalid hex length, treat as base64
                    return publicKey
                }
            } catch {
                // Not valid hex, treat as base64
                return publicKey
            }
        } catch {
            // If any conversion fails, return null
            return null
        }
    }

    /**
     * Generate topology transactions
     * @param hint A hint for the party ID.
     * @param publicKey The public key of the user.
     */
    async generateTopologyTransactions(
        hint: string,
        publicKey: string
    ): Promise<GenerateTransactionResponse>

    async generateTopologyTransactions(
        hint: string,
        publicKey: string
    ): Promise<GenerateTransactionResponse> {
        const synchronizerId = this.synchronizerId
        if (!synchronizerId)
            throw new Error(
                'synchronizerId is not configured — set it in the network settings'
            )
        return this.ledgerClient.generateTopology(
            synchronizerId,
            publicKey,
            hint
        )
    }

    /**
     * Allocate party with wallet
     * @param namespace The namespace of wallet.
     * @param transactions There are topology transactions.
     * @param signature A transaction signature from signingProviderId
     * @param userId The ID of the user.
     */
    async allocatePartyWithExistingWallet(
        namespace: string,
        transactions: string[],
        signature: string,
        userId: string
    ): Promise<string>

    async allocatePartyWithExistingWallet(
        namespace: string,
        transactions: string[],
        signature: string,
        userId: string
    ): Promise<string> {
        const synchronizerId = this.synchronizerId
        if (!synchronizerId)
            throw new Error(
                'synchronizerId is not configured — set it in the network settings'
            )
        const res = await this.ledgerClient.allocateExternalParty(
            synchronizerId,
            transactions.map((transaction) => ({
                transaction,
            })),
            [
                {
                    format: 'SIGNATURE_FORMAT_CONCAT',
                    signature: signature,
                    signedBy: namespace,
                    signingAlgorithmSpec: 'SIGNING_ALGORITHM_SPEC_ED25519',
                },
            ]
        )

        await this.ledgerClient.waitForPartyAndGrantUserRights(
            userId,
            res.partyId
        )
        return res.partyId
    }

    private async allocateInternalParty(
        userId: string,
        hint: string
    ): Promise<AllocatedParty> {
        const { participantId } = await this.ledgerClient.getWithRetry(
            '/v2/parties/participant-id'
        )
        // Extract the namespace part from participantId
        // Format is hint::namespace
        const [, namespace] = participantId.split('::')
        if (!namespace) {
            throw new Error(
                `Invalid participantId format: expected "hint::namespace", got "${participantId}"`
            )
        }

        const res = await this.ledgerClient.postWithRetry('/v2/parties', {
            partyIdHint: hint,
            identityProviderId: '',
            ...(this.synchronizerId !== undefined && {
                synchronizerId: this.synchronizerId,
            }),
            userId,
        })

        if (!res.partyDetails?.party) {
            throw new Error('Failed to allocate party')
        }
        await this.ledgerClient.waitForPartyAndGrantUserRights(
            userId,
            res.partyDetails.party
        )

        return { hint, namespace, partyId: res.partyDetails.party }
    }

    private async allocateExternalParty(
        userId: string,
        hint: string,
        publicKey: string,
        signingCallback: SigningCbFn
    ): Promise<AllocatedParty> {
        const synchronizerId = this.synchronizerId
        if (!synchronizerId)
            throw new Error(
                'synchronizerId is not configured — set it in the network settings'
            )
        const namespace = this.createFingerprintFromKey(publicKey)

        const transactions = await this.generateTopologyTransactions(
            hint,
            publicKey
        )

        const signature = await signingCallback(transactions.multiHash)

        const res = await this.ledgerClient.allocateExternalParty(
            synchronizerId,
            transactions.topologyTransactions!.map((transaction) => ({
                transaction,
            })),
            [
                {
                    format: 'SIGNATURE_FORMAT_CONCAT',
                    signature: signature,
                    signedBy: namespace,
                    signingAlgorithmSpec: 'SIGNING_ALGORITHM_SPEC_ED25519',
                },
            ]
        )

        await this.ledgerClient.waitForPartyAndGrantUserRights(
            userId,
            res.partyId
        )
        return { hint, partyId: res.partyId, namespace }
    }
}
