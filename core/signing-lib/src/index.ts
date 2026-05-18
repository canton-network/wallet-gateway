// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { AuthContext } from '@canton-network/core-wallet-auth'
import { Methods } from './rpc-gen/index.js'
import { Error as RpcError } from './rpc-gen/typings.js'
import nacl from 'tweetnacl'
import naclUtil from 'tweetnacl-util'
import { SigningProvider } from './config/schema.js'

// Re-export SigningProvider from config schema
export { SigningProvider }

export { default as buildController, Methods } from './rpc-gen/index.js'
export * from './rpc-gen/typings.js'
export * from './SigningDriverStore.js'
export * from './config/schema.js'

export const CC_COIN_TYPE = 6767

export function isRpcError<T>(value: T | RpcError): value is RpcError {
    return (value as RpcError).error_description !== undefined
}

export enum PartyMode {
    INTERNAL = 'internal',
    EXTERNAL = 'external',
}

export type PublicKey = string
export type PrivateKey = string

export interface KeyPair {
    publicKey: PublicKey
    privateKey: PrivateKey
}

export interface SigningDriverInterface {
    partyMode: PartyMode
    signingProvider: SigningProvider
    controller: (userId: AuthContext['userId'] | undefined) => Methods
}

export const verifySignedTxHash = (
    txHash: string,
    publicKey: string,
    signature: string
): boolean => {
    return nacl.sign.detached.verify(
        naclUtil.decodeBase64(txHash),
        naclUtil.decodeBase64(signature),
        naclUtil.decodeBase64(publicKey)
    )
}

export const signTransactionHash = (
    txHash: string,
    privateKey: string
): string => {
    const decodedKey = naclUtil.decodeBase64(privateKey)

    return naclUtil.encodeBase64(
        nacl.sign.detached(naclUtil.decodeBase64(txHash), decodedKey)
    )
}

export const signMessage = (message: string, privateKey: string): string => {
    const msgBytes = new TextEncoder().encode(message)
    const decodedKey = naclUtil.decodeBase64(privateKey)
    return naclUtil.encodeBase64(nacl.sign.detached(msgBytes, decodedKey))
}

export const getPublicKeyFromPrivate = (privateKeyBase64: string): string => {
    const secretKey = naclUtil.decodeBase64(privateKeyBase64)
    const keyPair = nacl.sign.keyPair.fromSecretKey(secretKey)
    return naclUtil.encodeBase64(keyPair.publicKey)
}

export const createKeyPair = (): KeyPair => {
    const key = nacl.sign.keyPair()
    const publicKey = naclUtil.encodeBase64(key.publicKey)
    const privateKey = naclUtil.encodeBase64(key.secretKey)

    return { publicKey, privateKey }
}
