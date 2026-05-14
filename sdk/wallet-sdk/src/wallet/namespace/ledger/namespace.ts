// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { SDKContext } from '../../sdk.js'
import { v4 } from 'uuid'
import { PrepareOptions, ExecuteOptions } from './types.js'
import { PreparedTransaction } from '../transactions/prepared.js'
import { SignedTransaction } from '../transactions/signed.js'
import { Ops } from '@canton-network/core-provider-ledger'
import { DarNamespace } from './dar/client.js'
import { InternalLedgerNamespace } from './internal/index.js'
import { PreparedTransactionNamespace } from './hash/namespace.js'
import { ACSReader } from '@canton-network/core-acs-reader'

export class LedgerNamespace {
    public readonly dar: DarNamespace
    public readonly internal: InternalLedgerNamespace
    public readonly preparedTransaction: PreparedTransactionNamespace
    public readonly acs: ACSReader

    constructor(private readonly sdkContext: SDKContext) {
        this.dar = new DarNamespace(sdkContext)
        this.internal = new InternalLedgerNamespace(sdkContext)
        this.preparedTransaction = new PreparedTransactionNamespace(sdkContext)
        this.acs = new ACSReader(sdkContext.ledgerProvider)
    }

    public async ledgerEnd() {
        return (
            await this.sdkContext.ledgerProvider.request<Ops.GetV2StateLedgerEnd>(
                {
                    method: 'ledgerApi',
                    params: {
                        resource: '/v2/state/ledger-end',
                        requestMethod: 'get',
                    },
                }
            )
        ).offset!
    }
    /**
     * Performs the prepare step of the interactive submission flow.
     * @returns PreparedTransaction which includes the response from the ledger and an execute function that can be called with a SignedTransaction to perform the execute step of the interactive submission flow.
     */
    public prepare(options: PrepareOptions): PreparedTransaction {
        const preparePromise = async () => {
            const synchronizerId =
                options.synchronizerId || this.sdkContext.defaultSynchronizerId

            const {
                partyId,
                commands,
                commandId = v4(),
                disclosedContracts = [],
            } = options

            const commandArray = Array.isArray(commands) ? commands : [commands]

            return this.internal.prepare({
                commands: commandArray,
                commandId,
                actAs: [partyId],
                disclosedContracts,
                synchronizerId,
            })
        }

        return new PreparedTransaction(
            this.sdkContext,
            preparePromise(),
            (signed, opts) => this.execute(signed, opts)
        )
    }

    /**
     * Performs the execute step of the interactive submission flow.
     * @param signed The signed transaction to be executed, which includes the signature and the original prepare response from the ledger.
     * @param options The options for executing the transaction, including userId, partyId, and an optional submissionId.
     * @returns The submissionId of the executed transaction.
     */
    public async execute(
        signed: SignedTransaction,
        options: ExecuteOptions
    ): Promise<
        Ops.PostV2InteractiveSubmissionExecuteAndWait['ledgerApi']['result']
    > {
        const { submissionId, partyId } = options
        const signedResponse = await signed.response()
        if (signedResponse.preparedTransaction === undefined) {
            this.sdkContext.error.throw({
                message: 'preparedTransaction is undefined',
                type: 'SDKOperationUnsupported',
            })
        }

        const transaction: string = signedResponse.preparedTransaction
        const replaceableSubmissionId = submissionId ?? v4()

        const fingerprint = partyId.split('::')[1]

        const request = {
            userId: this.sdkContext.userId,
            preparedTransaction: transaction,
            hashingSchemeVersion:
                'HASHING_SCHEME_VERSION_V2' as Ops.PostV2InteractiveSubmissionExecuteAndWait['ledgerApi']['params']['body']['hashingSchemeVersion'],
            submissionId: replaceableSubmissionId,
            deduplicationPeriod: {
                Empty: {},
            },
            partySignatures: {
                signatures: [
                    {
                        party: partyId,
                        signatures: [
                            {
                                signature: await signed.signature(),
                                signedBy: fingerprint,
                                format: 'SIGNATURE_FORMAT_CONCAT',
                                signingAlgorithmSpec:
                                    'SIGNING_ALGORITHM_SPEC_ED25519',
                            },
                        ],
                    },
                ],
            },
        }

        this.sdkContext.logger.debug(
            { request },
            'Submitting transaction to ledger with request'
        )

        return this.sdkContext.ledgerProvider.request<Ops.PostV2InteractiveSubmissionExecuteAndWait>(
            {
                method: 'ledgerApi',
                params: {
                    resource: '/v2/interactive-submission/executeAndWait',
                    body: request,
                    requestMethod: 'post',
                },
            }
        )
    }

    /**
     * For offline signing workflows, construct a SignedTransaction from an externally produced signature.
     * @param response The prepare response from a previous prepare call
     * @param signature The externally produced signature
     * @returns A SignedTransaction that can be passed to execute()
     */
    public fromSignature(
        response: Ops.PostV2InteractiveSubmissionPrepare['ledgerApi']['result'],
        signature: string
    ): SignedTransaction {
        const signPromise = Promise.resolve({
            response,
            signature,
        })
        return new SignedTransaction(
            this.sdkContext,
            signPromise,
            (signed, opts) => this.execute(signed, opts)
        )
    }
}
