// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import {
    buildController,
    CreateKeyResult,
    GetConfigurationResult,
    GetKeysResult,
    GetTransactionResult,
    GetTransactionsResult,
    PartyMode,
    SetConfigurationResult,
    SigningDriverInterface,
    SigningProvider,
    SignMessageResult,
    SignTransactionParams,
    SignTransactionResult,
    SubscribeTransactionsResult,
} from '@canton-network/core-signing-lib'
import { AuthContext } from '@canton-network/core-wallet-auth'
import { randomUUID } from 'node:crypto'

export class ParticipantSigningDriver implements SigningDriverInterface {
    public partyMode = PartyMode.INTERNAL
    public signingProvider = SigningProvider.PARTICIPANT

    public controller = (
        _userId: AuthContext['userId'] | undefined // eslint-disable-line @typescript-eslint/no-unused-vars
    ) =>
        buildController({
            signTransaction: async (
                params: SignTransactionParams
            ): Promise<SignTransactionResult> => {
                return Promise.resolve({
                    txId: params.internalTxId || randomUUID(),
                    status: 'signed',
                })
            },
            signMessage: async (): Promise<SignMessageResult> => {
                return Promise.resolve({
                    error: 'not_allowed',
                    error_description:
                        'Signing messages is not supported with Participant.',
                })
            },
            getTransaction: function (): Promise<GetTransactionResult> {
                throw new Error('Function not implemented.')
            },
            getTransactions: function (): Promise<GetTransactionsResult> {
                throw new Error('Function not implemented.')
            },
            getKeys: function (): Promise<GetKeysResult> {
                throw new Error('Function not implemented.')
            },
            createKey: function (): Promise<CreateKeyResult> {
                throw new Error('Function not implemented.')
            },
            getConfiguration: function (): Promise<GetConfigurationResult> {
                throw new Error('Function not implemented.')
            },
            setConfiguration: function (): Promise<SetConfigurationResult> {
                throw new Error('Function not implemented.')
            },
            subscribeTransactions:
                function (): Promise<SubscribeTransactionsResult> {
                    throw new Error('Function not implemented.')
                },
        })
}
