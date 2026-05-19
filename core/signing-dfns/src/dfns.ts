// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { DfnsApiClient } from '@dfns/sdk'
import { AsymmetricKeySigner } from '@dfns/sdk-keysigner'
import { SigningStatus } from '@canton-network/core-signing-lib'
import { pino } from 'pino'

const logger = pino({ name: 'dfns-handler', level: 'debug' })

const DFNS_LIST_PAGE_SIZE = 50

/**
 * Credentials for a Dfns service account. Dfns uses two-layer auth: a
 * long-lived bearer token plus per-request signing with a private key.
 */
export interface DfnsCredentials {
    /** ID of the Dfns credential (key) registered against the service account. */
    credId: string
    /**
     * PEM-encoded private key paired with `credId`. Used to sign every
     * sensitive Dfns API request as a U2F-style second factor. Configured
     * once per deployment; not derived from `authToken`.
     */
    privateKey: string
    /**
     * Long-lived service account bearer JWT issued by the Dfns dashboard.
     * Does not auto-expire and is not regenerated from `privateKey`/`credId`.
     * Rotate by issuing a new token in the Dfns dashboard.
     */
    authToken: string
}

export interface DfnsKey {
    /** Dfns key id (e.g. `key-...`). */
    id: string
    /** Human-readable name configured on the Dfns key. */
    name: string
    /** ed25519 public key, base64-encoded (Canton format). */
    publicKey: string
}

export interface DfnsSignature {
    /** Dfns signature id (used as the txId returned to the gateway). */
    id: string
    /** Dfns key id the signature was produced with. */
    keyId: string
    status: SigningStatus
    /** ed25519 signature, base64-encoded (Canton SIGNATURE_FORMAT_CONCAT). */
    signature?: string
}

function stripHexPrefix(hex: string): string {
    return hex.startsWith('0x') ? hex.slice(2) : hex
}

function hexToBase64(hex: string): string {
    return Buffer.from(stripHexPrefix(hex), 'hex').toString('base64')
}

function base64ToHex(base64: string): string {
    return Buffer.from(base64, 'base64').toString('hex')
}

function isCantonKey(scheme: string, curve: string): boolean {
    return scheme === 'EdDSA' && curve === 'ed25519'
}

export class DfnsHandler {
    private client: DfnsApiClient
    private orgId: string
    private baseUrl: string
    // Tracks the key that produced each signature so getSignature can look it
    // up directly. `listKeys` (used by `iterateKeys`) is eventually-consistent
    // — a key created moments ago may not yet appear in the list, so iterating
    // would 404 even though the signature exists under the just-used key.
    private signatureKey = new Map<string, string>()

    constructor(orgId: string, baseUrl: string, credentials: DfnsCredentials) {
        this.orgId = orgId
        this.baseUrl = baseUrl
        this.client = this.createClient(credentials)
    }

    private createClient(credentials: DfnsCredentials): DfnsApiClient {
        const signer = new AsymmetricKeySigner({
            credId: credentials.credId,
            privateKey: credentials.privateKey,
        })

        return new DfnsApiClient({
            orgId: this.orgId,
            authToken: credentials.authToken,
            baseUrl: this.baseUrl,
            signer,
        })
    }

    /**
     * Create a raw ed25519 key in Dfns suitable for signing Canton topology
     * and ledger transactions. The key is not bound to a network — chain
     * activation happens on the gateway against its configured validator.
     */
    public async createKey(name: string): Promise<DfnsKey> {
        try {
            const key = await this.client.keys.createKey({
                body: {
                    scheme: 'EdDSA',
                    curve: 'ed25519',
                    name,
                },
            })
            return {
                id: key.id,
                name: key.name || key.id,
                publicKey: hexToBase64(key.publicKey),
            }
        } catch (error) {
            logger.error(error, 'Error creating Dfns key')
            throw error
        }
    }

    public async *iterateKeys(): AsyncGenerator<DfnsKey> {
        let paginationToken: string | undefined
        do {
            const response = await this.client.keys.listKeys({
                query: {
                    limit: DFNS_LIST_PAGE_SIZE,
                    ...(paginationToken ? { paginationToken } : {}),
                },
            })

            for (const key of response.items) {
                if (
                    key.status !== 'Active' ||
                    !isCantonKey(key.scheme, key.curve)
                ) {
                    continue
                }
                yield {
                    id: key.id,
                    name: key.name || key.id,
                    publicKey: hexToBase64(key.publicKey),
                }
            }

            paginationToken = response.nextPageToken
        } while (paginationToken)
    }

    public async listKeys(): Promise<DfnsKey[]> {
        const keys: DfnsKey[] = []
        try {
            for await (const key of this.iterateKeys()) {
                keys.push(key)
            }
        } catch (error) {
            logger.error(error, 'Error listing Dfns keys')
            throw error
        }
        return keys
    }

    public async getKey(keyId: string): Promise<DfnsKey | undefined> {
        try {
            const key = await this.client.keys.getKey({ keyId })
            if (
                key.status !== 'Active' ||
                !isCantonKey(key.scheme, key.curve)
            ) {
                return undefined
            }
            return {
                id: key.id,
                name: key.name || key.id,
                publicKey: hexToBase64(key.publicKey),
            }
        } catch (error) {
            logger.debug(error, `Key ${keyId} not found`)
            return undefined
        }
    }

    /**
     * Resolve a key by base64 ed25519 public key. Iterates Dfns keys —
     * acceptable for first iteration since most deployments hold a single
     * Canton key per credential.
     */
    public async findKeyByPublicKey(
        publicKeyBase64: string
    ): Promise<DfnsKey | undefined> {
        for await (const key of this.iterateKeys()) {
            if (key.publicKey === publicKeyBase64) {
                return key
            }
        }
        return undefined
    }

    /**
     * Sign a Canton hash (raw or multihash-framed) by handing the bytes to
     * Dfns's `Message` kind, which signs the supplied hex with raw ed25519 —
     * the same shape Fireblocks's `RAW` operation produces.
     *
     * `kind: 'Hash'` would be the natural fit but its regex caps at 32 bytes,
     * forcing us to strip the multihash prefix; Canton then rejects the
     * resulting signature because it verifies over the full 34-byte
     * multihash, not the digest. Every Canton-tagged kind (Hash/Message/
     * Transaction + `blockchainKind: 'Canton'`) is server-rejected, so we
     * use plain `Message` (no `blockchainKind`) and pass the raw bytes.
     */
    public async signHash(
        keyId: string,
        hashBase64: string,
        externalId?: string
    ): Promise<DfnsSignature> {
        const messageHex = base64ToHex(hashBase64)
        const body = {
            kind: 'Message' as const,
            message: messageHex,
            ...(externalId ? { externalId } : {}),
        }
        return this.submitSignatureRequest(keyId, body)
    }

    private async submitSignatureRequest(
        keyId: string,
        body: Parameters<DfnsApiClient['keys']['generateSignature']>[0]['body']
    ): Promise<DfnsSignature> {
        try {
            const result = await this.client.keys.generateSignature({
                keyId,
                body,
            })
            const mapped = this.mapStatus(result.status)
            if (mapped === 'failed' || mapped === 'rejected') {
                logger.error(
                    { keyId, result },
                    `Dfns signing returned ${result.status}`
                )
            }
            this.signatureKey.set(result.id, keyId)
            return {
                id: result.id,
                keyId,
                status: mapped,
                signature: this.extractSignature(result.signature),
            }
        } catch (error) {
            logger.error(
                { keyId, err: error },
                'Error generating Dfns signature'
            )
            throw error
        }
    }

    public async getSignature(
        keyId: string,
        signatureId: string
    ): Promise<DfnsSignature | undefined> {
        try {
            const result = await this.client.keys.getSignature({
                keyId,
                signatureId,
            })
            return {
                id: result.id,
                keyId,
                status: this.mapStatus(result.status),
                signature: this.extractSignature(result.signature),
            }
        } catch (error) {
            logger.debug(error, `Signature ${signatureId} not found`)
            return undefined
        }
    }

    /**
     * Locate a signature by id. Prefers the cached key from the originating
     * sign call — `listKeys` is eventually-consistent, so iterating right
     * after creating a key would miss the signature. Falls back to iteration
     * when the cache misses (e.g. across a gateway restart).
     */
    public async findSignature(
        signatureId: string
    ): Promise<DfnsSignature | undefined> {
        const cachedKeyId = this.signatureKey.get(signatureId)
        if (cachedKeyId) {
            const sig = await this.getSignature(cachedKeyId, signatureId)
            if (sig) return sig
        }
        for await (const key of this.iterateKeys()) {
            if (key.id === cachedKeyId) continue
            const sig = await this.getSignature(key.id, signatureId)
            if (sig) return sig
        }
        return undefined
    }

    public async *listSignatures(keyId: string): AsyncGenerator<DfnsSignature> {
        let paginationToken: string | undefined
        do {
            const response = await this.client.keys.listSignatures({
                keyId,
                query: {
                    limit: DFNS_LIST_PAGE_SIZE,
                    ...(paginationToken ? { paginationToken } : {}),
                },
            })

            for (const sig of response.items) {
                yield {
                    id: sig.id,
                    keyId,
                    status: this.mapStatus(sig.status),
                    signature: this.extractSignature(sig.signature),
                }
            }

            paginationToken = response.nextPageToken
        } while (paginationToken)
    }

    private extractSignature(signature?: {
        encoded?: string
        r: string
        s: string
    }): string | undefined {
        if (!signature) return undefined
        // For ed25519, `encoded` is the 64-byte r||s concat in hex; fall back
        // to assembling it from r/s if `encoded` is not populated. Each field
        // may carry an 0x prefix that must be stripped before hex decoding.
        const hex = signature.encoded
            ? stripHexPrefix(signature.encoded)
            : `${stripHexPrefix(signature.r)}${stripHexPrefix(signature.s)}`
        return hexToBase64(hex)
    }

    private mapStatus(dfnsStatus: string): SigningStatus {
        switch (dfnsStatus) {
            case 'Signed':
            case 'Confirmed':
                return 'signed'
            case 'Pending':
            case 'Executing':
                return 'pending'
            case 'Rejected':
                return 'rejected'
            case 'Failed':
                return 'failed'
            default:
                logger.warn(`Unknown Dfns signature status: ${dfnsStatus}`)
                return 'pending'
        }
    }
}
