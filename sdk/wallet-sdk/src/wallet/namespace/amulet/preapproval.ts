// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { PartyId } from '@canton-network/core-types'
import { AmuletNamespaceConfig, LedgerTypes } from '../../sdk.js'
import { PreapprovalParties } from './types.js'
import { LedgerNamespace } from '../ledger/namespace.js'
import { fetchAmulet } from './namespace.js'
import { SDKLogger } from '../../logger/logger.js'

const EMPTY_COMMAND_RESULT = [null, []] as const

export class PreapprovalNamespace {
    /**
     * Commands for managing transfer preapprovals. The return result can be used as an argument to pass to signing and execution of a transaction.
     * Transfer preapprovals allow receivers to automatically accept incoming transfers.
     */
    public readonly command: {
        create: (args: {
            parties: PreapprovalParties
            // registryUrl?: URL
        }) => Promise<{
            CreateCommand: LedgerTypes['CreateCommand']
        }>
        cancel: (args: {
            parties: PreapprovalParties
        }) => Promise<
            | [
                  { ExerciseCommand: LedgerTypes['ExerciseCommand'] },
                  LedgerTypes['DisclosedContract'][],
              ]
            | typeof EMPTY_COMMAND_RESULT
        >
    }
    private readonly ledger: LedgerNamespace
    private readonly logger: SDKLogger

    constructor(private readonly ctx: AmuletNamespaceConfig) {
        this.logger = ctx.commonCtx.logger.child({
            namespace: 'AmuletNamespace',
        })
        this.ledger = new LedgerNamespace(ctx.commonCtx)
        this.command = {
            create: async (args) => {
                const { parties } = args

                const amulet = await fetchAmulet(this.ctx)

                const command: { CreateCommand: LedgerTypes['CreateCommand'] } =
                    {
                        CreateCommand: {
                            templateId:
                                '#splice-wallet:Splice.Wallet.TransferPreapproval:TransferPreapprovalProposal',
                            createArguments: {
                                provider:
                                    parties?.provider ??
                                    this.ctx.validatorParty,
                                receiver: parties.receiver,
                                expectedDso: amulet.admin,
                            },
                        },
                    }

                return command
            },
            cancel: async (args) => {
                const { parties } = args
                const preapprovalStatus = await this.fetchStatus(
                    parties.receiver
                )
                if (
                    !preapprovalStatus ||
                    !preapprovalStatus.contractId ||
                    !preapprovalStatus.templateId
                ) {
                    this.logger.warn(
                        'Cannot create cancel command since no preapprovals have been found'
                    )
                    return EMPTY_COMMAND_RESULT
                }

                const { contractId, templateId } = preapprovalStatus

                const [command, disclosedContracts] =
                    await this.ctx.amuletService.cancelTransferPreapproval(
                        contractId,
                        templateId,
                        parties.receiver
                    )

                return [{ ExerciseCommand: command }, disclosedContracts]
            },
        }
    }

    /**
     * Renews a transfer preapproval, extending its expiration date.
     *
     * Note: This method is not part of the `command` object because it handles
     * the complete transaction flow internally, including signing and execution
     * by the provider (validator) party. Unlike `command.create` and `command.cancel`
     * which return commands for the caller to sign and execute, this method
     * submits the transaction directly using the provider's authorization.
     *
     * @param args - The renewal arguments
     * @param args.parties - The parties involved in the preapproval
     * @param args.parties.receiver - The receiver party whose preapproval should be renewed
     * @param args.parties.provider - Optional provider party (defaults to validator party)
     * @param args.expiresAt - The new expiration date for the preapproval
     * @param args.inputUtxos - Optional list of specific holding contract IDs to use as inputs
     * @returns A promise that resolves to the ledger submission result
     */
    public async renew(args: {
        parties: PreapprovalParties
        expiresAt: Date
        inputUtxos?: string[]
        synchronizerId?: string
    }) {
        const { parties, inputUtxos, expiresAt } = args
        const preapprovalStatus = await this.fetchStatus(parties.receiver)
        const provider = parties?.provider ?? this.ctx.validatorParty
        const synchronizerId =
            args.synchronizerId ?? this.ctx.commonCtx.defaultSynchronizerId
        if (!synchronizerId)
            this.ctx.commonCtx.error.throw({
                type: 'Unexpected',
                message: 'Cannot obtain synchronizer id',
            })

        if (
            !preapprovalStatus ||
            !preapprovalStatus.contractId ||
            !preapprovalStatus.templateId
        ) {
            this.ctx.commonCtx.logger.warn(
                'Cannot create renew command since the preapproval status data is incomplete'
            )
            return EMPTY_COMMAND_RESULT
        }

        const { contractId, templateId } = preapprovalStatus

        const [command, disclosedContracts] =
            await this.ctx.amuletService.renewTransferPreapproval(
                contractId,
                templateId,
                provider,
                synchronizerId,
                expiresAt,
                inputUtxos
            )

        return await this.ledger.internal.submit({
            commands: [{ ExerciseCommand: command }],
            disclosedContracts,
            synchronizerId,
            actAs: [provider],
        })
    }

    /**
     * Fetch TransferPreapproval from ScanProxy. This does NOT retry or wait.
     * If you want additional logic for create/renew/cancel events and retry use fetchStatus instead
     * @param receiverParty Receiver party id
     * @returns Resolves with the preapproval or null, if not found
     */
    public async fetchQuick(receiverParty: PartyId) {
        try {
            return await this.ctx.amuletService.getTransferPreApprovalByParty(
                receiverParty
            )
        } catch (e) {
            if (isNotFoundError(e)) {
                this.logger.info('Preapproval is no longer visible')
                return null
            }
        }
    }

    /**
     * Wait for Scan Proxy to show a receiver's TransferPreapproval, or for its CID to change after renewal,
     * or for it to disappear after cancel.
     *
     * Why: right after renew or cancel, the ledger is up to date, but Scan Proxy can lag. Poll until the
     * preapproval appears (create), its CID changes (renew), or it disappears (cancel).
     *
     * Usage:
     *  - After create: call without oldCid.
     *  - After renew: pass oldCid.
     *  - After cancel: set cancelled = true.
     *
     * @param receiverParty Receiver party id.
     * @param options Optional settings.
     * @param options.oldCid Resolve only when CID differs from this value (post-renew).
     * @param options.cancelled Set true to resolve when no preapproval is returned (post-cancel).
     * @param options.intervalMs Poll interval in milliseconds. Default is 15000.
     * @param options.timeoutMs Maximum wait time in milliseconds. Default is 300000.
     * @returns Resolves with the preapproval (for create/renew) or null (for cancelled).
     * @throws If the timeout elapses before the condition is met.
     */
    public async fetchStatus(
        receiverParty: PartyId,
        options?: {
            oldCid?: string
            cancelled?: boolean
            timeoutMs?: number
            intervalMs?: number
        }
    ) {
        const {
            oldCid,
            cancelled = false,
            timeoutMs = 5 * 60_000,
            intervalMs = 10_000,
        } = options ?? {}

        const deadline = Date.now() + timeoutMs

        while (Date.now() < deadline) {
            try {
                const rawPreapproval =
                    await this.ctx.amuletService.getTransferPreApprovalByParty(
                        receiverParty
                    )

                if (cancelled) {
                    this.logger.debug(
                        'Preapproval is still visible, polling again'
                    )
                } else {
                    const contractId = rawPreapproval.contract.contract_id
                    const templateId = rawPreapproval.contract.template_id
                    const { dso, expiresAt } = rawPreapproval.contract.payload
                    const result = {
                        expiresAt: new Date(expiresAt),
                        dso,
                        contractId,
                        templateId,
                    }

                    if (!oldCid) {
                        this.logger.info(
                            `New preapproval is visible with contractId: ${contractId}`
                        )
                        return result
                    }
                    if (contractId && contractId !== oldCid) {
                        this.logger.info(
                            `Rewewed preapproval is visible with new contractId: ${contractId}`
                        )
                        return result
                    }

                    this.logger.debug(
                        `Preapproval is visible but cId is unchanged, polling again.`
                    )
                }
            } catch (e) {
                if (cancelled && isNotFoundError(e)) {
                    this.logger.info('Preapproval is no longer visible')
                    return null
                }
                this.logger.debug(
                    'Fetch preapproval status failed, retrying agian. '
                )

                await new Promise((resolve) => setTimeout(resolve, intervalMs))
            }
        }

        const result = cancelled
            ? 'preapproval to disappear'
            : oldCid
              ? `preapproval cId to change from ${oldCid}`
              : 'preapproval to appear'

        this.ctx.commonCtx.error.throw({
            type: 'Unexpected',
            message: `Timed out after ${Math.floor(timeoutMs / 1000)} seconds, waiting for ${result}`,
        })
    }
}

// The scan proxy emits an unstructured error object, so this determines whether the preapproval is actually not found
// Whereas sometimes there can be other server errors
function isNotFoundError(e: unknown): boolean {
    return (
        typeof e === 'object' &&
        e !== null &&
        'error' in e &&
        typeof (e as { error: unknown }).error === 'string' &&
        (e as { error: string }).error.startsWith(
            'No TransferPreapproval found for party'
        )
    )
}
