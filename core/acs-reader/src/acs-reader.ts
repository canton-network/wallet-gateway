// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import {
    AbstractLedgerProvider,
    Ops,
} from '@canton-network/core-provider-ledger'
import { type LedgerCommonSchemas } from '@canton-network/core-ledger-client-types'

import { PartyId } from '@canton-network/core-types'

type Types = LedgerCommonSchemas

type Completion = Types['Completion']['value']
export type JSContractEntry = Types['JsContractEntry']
export type JsCantonError = Types['JsCantonError']

const COMPLETIONS_LIMIT = '100'
const COMPLETIONS_STREAM_IDLE_TIMEOUT_MS = '1000'

export type AcsOptions = {
    offset: number
    templateIds?: string[]
    parties?: string[] //TODO: Figure out if this should use this.partyId by default and not allow cross party filtering
    filterByParty?: boolean
    interfaceIds?: string[]
    limit?: number
    continueUntilCompletion?: boolean
}

export class AcsReader {
    private readonly ledgerProvider: AbstractLedgerProvider

    constructor(ledgerProvider: AbstractLedgerProvider) {
        this.ledgerProvider = ledgerProvider
    }

    public async getActiveContracts(
        options: AcsOptions
    ): Promise<Array<Types['JsGetActiveContractsResponse']>> {
        const { limit, continueUntilCompletion } = options

        const filter = buildActiveContractFilter(options)

        if (continueUntilCompletion) {
            // Query-mode: if limit it set, perform a series of http queries (scan whole ledger)
            return await this.fetchActiveContractsUntilComplete(
                filter,
                limit ?? 200
            )
        }

        //TODO: add back caching later

        return await this.ledgerProvider.request<Ops.PostV2StateActiveContracts>(
            {
                method: 'ledgerApi',
                params: {
                    resource: '/v2/state/active-contracts',
                    requestMethod: 'post',
                    body: filter,
                    query: limit ? { limit: limit } : {},
                },
            }
        )
    }

    private async fetchActiveContractsUntilComplete(
        args: Ops.PostV2StateActiveContracts['ledgerApi']['params']['body'],
        limit: number
    ): Promise<Array<Types['JsGetActiveContractsResponse']>> {
        const ledgerEnd =
            await this.ledgerProvider.request<Ops.GetV2StateLedgerEnd>({
                method: 'ledgerApi',
                params: {
                    resource: '/v2/state/ledger-end',
                    requestMethod: 'get',
                },
            })

        const bodyRequest: Partial<
            Ops.PostV2Updates['ledgerApi']['params']['body']
        > = {
            beginExclusive: 0,
            verbose: false,
        }
        if (ledgerEnd.offset !== undefined) {
            bodyRequest.endInclusive = ledgerEnd.offset
        }

        if (args.filter) bodyRequest.filter = args.filter

        const finalLedgerEnd = ledgerEnd.offset ?? 0
        let currentOffset = 0

        const allContractsData = new Map()
        const exercisedContracts = new Set()

        while (currentOffset < finalLedgerEnd) {
            bodyRequest.beginExclusive = currentOffset
            const results = (
                await this.ledgerProvider.request<Ops.PostV2Updates>({
                    method: 'ledgerApi',
                    params: {
                        resource: '/v2/updates',
                        requestMethod: 'post',
                        body: bodyRequest as Ops.PostV2Updates['ledgerApi']['params']['body'],
                        query: { limit: limit },
                    },
                })
            )
                .filter(({ update }) => !!update && 'Transaction' in update)
                .map(({ update }) => {
                    if (update && 'Transaction' in update) {
                        return update.Transaction.value
                    }
                    throw new Error('Expected Transaction update')
                })
                .map((data) => {
                    const archivedEvents = data.events
                        ?.filter((event) => !!event && 'ArchivedEvent' in event)
                        .map(
                            (event) =>
                                (
                                    event as {
                                        ArchivedEvent: Types['ArchivedEvent']
                                    }
                                ).ArchivedEvent
                        )
                        .filter((event) => !!event)
                    const exercisedEvents = data.events
                        ?.filter(
                            (event) => !!event && 'ExercisedEvent' in event
                        )
                        .map(
                            (event) =>
                                (
                                    event as {
                                        ExercisedEvent: Types['ExercisedEvent']
                                    }
                                ).ExercisedEvent
                        )
                        .filter((event) => !!event)
                        .filter((event) => !!event.consuming)
                    const createdEvents = data.events
                        ?.filter((event) => !!event && 'CreatedEvent' in event)
                        .map(
                            (event) =>
                                (
                                    event as {
                                        CreatedEvent: Types['CreatedEvent']
                                    }
                                ).CreatedEvent
                        )
                        .filter((event) => !!event)
                        // TODO: remove the filter once /v2/updates is fixed
                        .filter((event) =>
                            Object.keys(
                                args.filter?.filtersByParty ?? {}
                            ).includes(
                                (event.createArgument as { owner?: string })
                                    ?.owner ?? ''
                            )
                        )

                    archivedEvents?.forEach((event) => {
                        if (event.contractId)
                            exercisedContracts.add(event.contractId)
                    })

                    exercisedEvents?.forEach((event) => {
                        if (event.contractId)
                            exercisedContracts.add(event.contractId)
                    })

                    createdEvents?.forEach((event) => {
                        if (!event.contractId) return
                        allContractsData.set(event.contractId, {
                            workflowId: data.workflowId,
                            contractEntry: {
                                JsActiveContract: {
                                    synchronizerId: data.synchronizerId,
                                    createdEvent: event,
                                    reassignmentCounter: data.offset,
                                },
                            },
                        })
                    })

                    currentOffset = Math.max(currentOffset, data.offset)
                    return true
                })

            if (!results.length) currentOffset++
        }

        // filter through all contracts to retrieve only active ones
        exercisedContracts.forEach((cid) => {
            allContractsData.delete(cid)
        })

        return Array.from(allContractsData.values())
    }
}

export function buildActiveContractFilter(options: {
    offset: number
    templateIds?: string[]
    parties?: string[] //TODO: Figure out if this should use this.partyId by default and not allow cross party filtering
    filterByParty?: boolean
    interfaceIds?: string[]
    limit?: number
}) {
    const filter: Partial<
        Ops.PostV2StateActiveContracts['ledgerApi']['params']['body']
    > = {
        filter: {
            filtersByParty: {},
        },
        verbose: false,
        activeAtOffset: options?.offset,
    }

    // Helper to build TemplateFilter array
    const buildTemplateFilter = (templateIds?: string[]) => {
        if (!templateIds) return []

        return templateIds.map((templateId) => ({
            identifierFilter: {
                TemplateFilter: {
                    value: {
                        templateId,
                        includeCreatedEventBlob: true, //TODO: figure out if this should be configurable
                    },
                },
            },
        }))
    }

    const buildInterfaceFilter = (interfaceIds?: string[]) => {
        if (!interfaceIds) return []

        return interfaceIds.map((interfaceId) => ({
            identifierFilter: {
                InterfaceFilter: {
                    value: {
                        interfaceId,
                        includeCreatedEventBlob: true, //TODO: figure out if this should be configurable
                        includeInterfaceView: true,
                    },
                },
            },
        }))
    }

    if (
        options?.filterByParty &&
        options.parties &&
        options.parties.length > 0
    ) {
        // Filter by party: set filtersByParty for each party
        const cumulativeFilter =
            options?.templateIds && !options?.interfaceIds
                ? buildTemplateFilter(options.templateIds)
                : options?.interfaceIds && !options?.templateIds
                  ? buildInterfaceFilter(options.interfaceIds)
                  : []

        for (const party of options.parties) {
            const filtersByParty = filter.filter?.filtersByParty
            if (!filtersByParty) {
                throw new Error(
                    'filtersByParty is missing from active contract filter'
                )
            }
            filtersByParty[party] = {
                cumulative: cumulativeFilter,
            }
        }
    } else if (options?.templateIds) {
        // Only template filter, no party
        filter.filter!.filtersForAnyParty = {
            cumulative: buildTemplateFilter(options.templateIds),
        }
    } else if (options?.interfaceIds) {
        filter.filter!.filtersForAnyParty = {
            cumulative: buildInterfaceFilter(options.interfaceIds),
        }
    }

    return filter as Ops.PostV2StateActiveContracts['ledgerApi']['params']['body']
}

/**
 * Polls the completions endpoint until
 * the completion with the given (userId, commandId, submissionId) is returned.
 * Then returns the updateId, synchronizerId and recordTime of that completion.
 */
export async function awaitCompletion(
    ledgerProvider: AbstractLedgerProvider,
    ledgerEnd: number,
    partyId: PartyId,
    userId: string,
    commandIdOrSubmissionId: string
): Promise<Completion> {
    const responses =
        await ledgerProvider.request<Ops.PostV2CommandsCompletions>({
            method: 'ledgerApi',
            params: {
                resource: '/v2/commands/completions',
                requestMethod: 'post',
                body: {
                    userId,
                    parties: [partyId],
                    beginExclusive: ledgerEnd,
                },
                query: {
                    limit: Number(COMPLETIONS_LIMIT),
                    stream_idle_timeout_ms: Number(
                        COMPLETIONS_STREAM_IDLE_TIMEOUT_MS
                    ),
                },
            },
        })

    const completions = responses.filter(
        (r) => !!r.completionResponse && 'Completion' in r.completionResponse
    )

    const wantedCompletion = responses.find((r) => {
        if (r.completionResponse && 'Completion' in r.completionResponse) {
            const completion = r.completionResponse.Completion.value
            return (
                completion.userId === userId &&
                (completion.commandId === commandIdOrSubmissionId ||
                    completion.submissionId === commandIdOrSubmissionId)
            )
        }
        return false
    })

    if (
        wantedCompletion &&
        wantedCompletion.completionResponse &&
        'Completion' in wantedCompletion.completionResponse
    ) {
        const completion = wantedCompletion.completionResponse.Completion.value
        const status = completion.status
        if (status && status.code !== 0) {
            // status.code is 0 for success
            throw new Error(
                `Command failed with status code ${status.code} and message: ${status.message}`
            )
        }
        return completion
    } else {
        const lastCompletion = completions[completions.length - 1]
        const newLedgerEnd =
            lastCompletion &&
            lastCompletion.completionResponse &&
            'Completion' in lastCompletion.completionResponse
                ? lastCompletion.completionResponse.Completion.value.offset
                : undefined

        return awaitCompletion(
            ledgerProvider,
            newLedgerEnd || ledgerEnd, // !newLedgerEnd implies response was empty
            partyId,
            userId,
            commandIdOrSubmissionId
        )
    }
}

export async function promiseWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    errorMessage: string
): Promise<T> {
    let timeoutPid: NodeJS.Timeout | null = null
    const timeoutPromise: Promise<T> = new Promise((_resolve, reject) => {
        timeoutPid = setTimeout(() => reject(errorMessage), timeoutMs)
    })

    try {
        return await Promise.race([promise, timeoutPromise])
    } finally {
        if (timeoutPid) {
            clearTimeout(timeoutPid)
        }
    }
}

export type retryableOptions = {
    retries: number
    delayMs: number
    cantonErrorKeys: string[]
}
export const defaultRetryableOptions: retryableOptions = {
    retries: 5,
    delayMs: 3000,
    cantonErrorKeys: [
        'SEQUENCER_REQUEST_FAILED',
        'SEQUENCER_BACKPRESSURE',
        'SUBMISSION_ALREADY_IN_FLIGHT',
        'LOCAL_VERDICT_TIMEOUT',
        'NOT_SEQUENCED_TIMEOUT',
        'NO_VIEW_WITH_VALID_RECIPIENTS',
    ],
}
