// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { PartyId } from '@canton-network/core-types'
import { LedgerClient } from '../ledger-client'
import { WSSupport } from './ws-support.js'
import { defaultRetryableOptions } from '../ledger-api-utils.js'
import {
    CreatedEvent,
    JsGetActiveContractsResponse,
    EventFormat,
    Filters,
    GetActiveContractsRequest,
    JsGetUpdatesResponse,
    GetUpdatesRequest,
    Event,
} from './types.js'

interface ACSUpdateConfig {
    maxEventsBeforePrune: number
    safeOffsetDeltaForPrune: number
    maxUpdatesToFetch: number
    wsTimeoutBeforeFirstElement: number
}

interface ACUpdateEvent {
    offset: number
    created: CreatedEvent | null
    archivedContractId: string | null
    workflowId: string | null
    synchronizerId: string | null
}

export const ACS_UPDATE_CONFIG: ACSUpdateConfig = {
    // How many events do we accumulate before we prune (compact) the ACS history - set to 0 to enable to compact all events, which is more efficient as long as application always ask for increasing (or equal) offsets
    maxEventsBeforePrune: 150,
    // When we compact the ACS history, we keep all events within this offset delta of the last seen update offset - set 0 to allow to compact everything
    safeOffsetDeltaForPrune: 200,
    // How many updates do we fetch at once when fetching updates - if there are more updates, we will fetch again until we have caught up (returned data is always complete to the requested endInclusive offset - even if that means multiple fetches)
    maxUpdatesToFetch: 100,
    // Timeout for receiving the first element from the WebSocket stream when reading the ACS - if this timeout is reached before the first element is returned, we fall back to HTTP
    // lower values will make the UI more responsive in case of problems, but may lead to unnecessary fallbacks
    wsTimeoutBeforeFirstElement: 10000,
}
// Config attached to window for easier debugging / live configuration via browser console
/* eslint-disable */
if (typeof window !== 'undefined') {
    ;(window as any)['ACS_UPDATE_CONFIG'] = ACS_UPDATE_CONFIG
}

export interface ACSKey {
    party?: PartyId | undefined
    templateId?: string | undefined // either templateId or interfaceId must be set - TODO: fix this
    interfaceId?: string | undefined
}

interface ACSSet {
    // offset at which initialAcs is valid
    acsOffset: number
    // the initial ACS at acsOffset
    initialAcs: Array<JsGetActiveContractsResponse>
    // last seen update offset
    lastUpdateOffset: number
    // all updates since acsOffset - will be used to calculate ACS at any offset >= acsOffset
    // may be compacted (see ACSUpdateConfig.maxEventsBeforePrune and ACSUpdateConfig.safeOffsetDeltaForPrune)
    updates: Array<ACUpdateEvent>
}

export class ACSContainer {
    private acsSet: ACSSet | null = null
    private settings: { includeCreatedEventBlob: boolean }

    constructor(
        orginalContainer: ACSContainer | null = null,
        settings = { includeCreatedEventBlob: true }
    ) {
        this.acsSet = orginalContainer ? orginalContainer.acsSet : null
        this.settings = settings
    }

    async update(
        offset: number,
        key: ACSKey,
        api: LedgerClient,
        wsSupport?: WSSupport
    ): Promise<JsGetActiveContractsResponse[]> {
        if (this.acsSet === null) {
            const acs = await this.readACS(offset, key, api, wsSupport)
            this.acsSet = acs
            return ACSContainer.calculateAt(acs, offset)
        }
        if (this.acsSet.acsOffset > offset) {
            this.acsSet = null // reset and reinitialize
            return this.update(offset, key, api)
        }
        if (
            this.acsSet.updates.length >= ACS_UPDATE_CONFIG.maxEventsBeforePrune
        ) {
            this.acsSet = await ACSContainer.compact(this.acsSet)
        }
        const updates = await ACSContainer.updateContracts(
            this.acsSet.lastUpdateOffset,
            offset,
            this.createEventFormat(key),
            api
        )

        const [newEvents, newOffset] = ACSContainer.extractEvents(
            this.acsSet.lastUpdateOffset,
            updates
        )

        if (newOffset > this.acsSet.lastUpdateOffset) {
            this.acsSet = {
                ...this.acsSet,
                lastUpdateOffset: newOffset,
                updates: this.acsSet.updates.concat(newEvents),
            }
        }
        // in practise length should never be > maxUpdatesToFetch only equal (server should never return more than limit in query). This is just a safeguard.
        if (updates.length >= ACS_UPDATE_CONFIG.maxUpdatesToFetch) {
            // recall this to get more updates
            return this.update(offset, key, api)
        }
        this.acsSet = {
            ...this.acsSet,
            lastUpdateOffset: offset, // we have caught up
        }

        return ACSContainer.calculateAt(this.acsSet, offset)
    }

    private static calculateAt(
        acs: ACSSet,
        offset: number
    ): Promise<Array<JsGetActiveContractsResponse>> {
        if (acs.acsOffset > offset) {
            return Promise.reject(
                Error(
                    // This should never happen as we check this before calling calculateAt
                    `Cannot calculate ACS at offset ${offset} when initial ACS is at ${acs.acsOffset}`
                )
            )
        }
        const addedContracts: Array<JsGetActiveContractsResponse> = []
        const removedContractIds: Set<string> = new Set()

        acs.updates.forEach((update) => {
            if (update.offset <= offset) {
                if (update.created) {
                    const createdEv: CreatedEvent = update.created

                    const activeContract: JsGetActiveContractsResponse = {
                        workflowId: update.workflowId ?? '',
                        contractEntry: {
                            JsActiveContract: {
                                createdEvent: createdEv,
                                synchronizerId: update.synchronizerId ?? '',
                                reassignmentCounter: 0,
                            },
                        },
                    }
                    addedContracts.push(activeContract)
                } else if (update.archivedContractId) {
                    removedContractIds.add(update.archivedContractId)
                }
            }
        })
        const createdContracts = acs.initialAcs.concat(addedContracts)

        const result = createdContracts.filter(({ contractEntry }) => {
            if (!contractEntry) {
                return false
            }
            const id =
                'JsActiveContract' in contractEntry
                    ? (contractEntry.JsActiveContract?.createdEvent
                          ?.contractId ?? '')
                    : ''

            return !removedContractIds.has(id)
        })

        return Promise.resolve(result)
    }

    private static extractEvents(
        fromOffset: number,
        updates: Array<JsGetUpdatesResponse>
    ): [Array<ACUpdateEvent>, number] {
        const newEvents: Array<ACUpdateEvent> = []
        let newOffset = fromOffset
        updates.forEach((update: JsGetUpdatesResponse) => {
            if (!update || !update.update) {
                return
            }
            if ('Transaction' in update.update) {
                const transaction = update.update.Transaction
                const trOffset = transaction?.value?.offset
                if (trOffset && trOffset > newOffset) {
                    const events: Array<Event> =
                        transaction?.value?.events ?? []
                    events.forEach((event: Event) => {
                        if (!event) {
                            return
                        }
                        if ('CreatedEvent' in event) {
                            const acUpdate: ACUpdateEvent = {
                                created: event.CreatedEvent,
                                archivedContractId: null,
                                offset: trOffset,
                                workflowId:
                                    transaction?.value?.workflowId ?? null,
                                synchronizerId:
                                    transaction?.value?.synchronizerId ?? null,
                            }
                            newEvents.push(acUpdate)
                            newOffset = trOffset
                        } else if ('ArchivedEvent' in event) {
                            const archivedEvent = event.ArchivedEvent
                            const acUpdate: ACUpdateEvent = {
                                created: null,
                                archivedContractId:
                                    archivedEvent?.contractId ?? null,
                                offset: trOffset,
                                workflowId:
                                    transaction?.value?.workflowId ?? null,
                                synchronizerId:
                                    transaction?.value?.synchronizerId ?? null,
                            }
                            newEvents.push(acUpdate)
                            newOffset = trOffset
                        }
                    })
                }
            } else if ('OffsetCheckpoint' in update.update) {
                const checkpoint = update.update.OffsetCheckpoint
                const offset = checkpoint?.value?.offset
                if (offset) {
                    newOffset = offset
                }
            } else {
                console.log(
                    `ACS Update got unknown update type: ${JSON.stringify(update.update)}`
                )
            }
        })
        return [newEvents, newOffset]
    }

    private static async updateContracts(
        startOffset: number,
        endOffset: number,
        eventFormat: EventFormat,
        api: LedgerClient
    ): Promise<Array<JsGetUpdatesResponse>> {
        const request = {
            beginExclusive: startOffset,
            endInclusive: endOffset,
            updateFormat: {
                includeTransactions: {
                    eventFormat,
                    transactionShape: 'TRANSACTION_SHAPE_ACS_DELTA',
                },
            },
            verbose: false,
        } satisfies GetUpdatesRequest

        const params: Record<string, unknown> = {
            query: {
                limit: ACS_UPDATE_CONFIG.maxUpdatesToFetch,
                stream_idle_timeout_ms: 1000,
            },
        }
        return api.postWithRetry(
            '/v2/updates/flats',
            request,
            defaultRetryableOptions,
            params
        )
    }

    private static async compact(acs: ACSSet): Promise<ACSSet> {
        const newAcsOffset = Math.max(
            acs.acsOffset,
            acs.lastUpdateOffset - ACS_UPDATE_CONFIG.safeOffsetDeltaForPrune
        )
        if (newAcsOffset > acs.acsOffset) {
            const responses = await ACSContainer.calculateAt(acs, newAcsOffset)
            return {
                acsOffset: newAcsOffset,
                initialAcs: responses,
                lastUpdateOffset: acs.lastUpdateOffset,
                updates: acs.updates.filter(
                    (update) => update.offset > newAcsOffset
                ),
            }
        }
        return acs
    }

    private async readACS(
        offset: number,
        key: ACSKey,
        api: LedgerClient,
        wsSupport?: WSSupport
    ): Promise<ACSSet> {
        if (wsSupport && wsSupport.enabled()) {
            return this.readACSUsingWs(offset, key, wsSupport).catch(() => {
                console.log('Falling back to HTTP for ACS read')
                return this.readHttpACS(offset, key, api)
            })
        }
        return this.readHttpACS(offset, key, api)
    }

    private async readHttpACS(
        offset: number,
        key: ACSKey,
        api: LedgerClient
    ): Promise<ACSSet> {
        const format = this.createEventFormat(key)
        const acs = await api.postWithRetry(
            '/v2/state/active-contracts',
            {
                activeAtOffset: offset,
                verbose: false,
                eventFormat: format,
            } satisfies GetActiveContractsRequest,
            defaultRetryableOptions
        )
        return {
            acsOffset: offset,
            initialAcs: acs,
            lastUpdateOffset: offset,
            updates: [],
        }
    }

    private readACSUsingWs(
        offset: number,
        key: ACSKey,
        wsSupport: WSSupport
    ): Promise<ACSSet> {
        const wsACSURL = `${wsSupport.baseUrl}/v2/state/active-contracts`
        const format = this.createEventFormat(key)
        const request = {
            activeAtOffset: offset,
            verbose: false,
            eventFormat: format,
        } satisfies GetActiveContractsRequest
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(wsACSURL, wsSupport.extractProtocols())
            const results: JsGetActiveContractsResponse[] = []
            let finished = false
            let error: Error | null = null
            setTimeout(() => {
                if (!finished && !error && results.length === 0) {
                    error = Error(
                        `No data received from WebSocket ${wsACSURL} within ${ACS_UPDATE_CONFIG.wsTimeoutBeforeFirstElement}ms`
                    )
                    wsSupport.reportError(error)
                    reject(error)
                    ws.close()
                }
            }, ACS_UPDATE_CONFIG.wsTimeoutBeforeFirstElement)
            ws.onopen = () => {
                ws.send(JSON.stringify(request))
            }

            ws.onmessage = (event: MessageEvent<string>) => {
                try {
                    const data = JSON.parse(
                        event.data
                    ) as JsGetActiveContractsResponse
                    results.push(data)
                } catch (err) {
                    console.error('Invalid JSON:', err)
                }
            }

            ws.onerror = () => {
                error = new Error('WebSocket error')
                wsSupport.reportError(error)
                reject(error)
            }

            ws.onclose = () => {
                finished = true
                if (!error) {
                    wsSupport.reportSuccess()
                    resolve({
                        acsOffset: offset,
                        initialAcs: results,
                        lastUpdateOffset: offset,
                        updates: [],
                    })
                }
            }
        })
    }

    private createInterfaceFilter(interfaceId: string): Filters {
        return {
            cumulative: [
                {
                    identifierFilter: {
                        InterfaceFilter: {
                            value: {
                                interfaceId,
                                includeInterfaceView: true,
                                includeCreatedEventBlob:
                                    this.settings.includeCreatedEventBlob,
                            },
                        },
                    },
                },
            ],
        }
    }

    private createTemplateFilter(templateId: string): Filters {
        return {
            cumulative: [
                {
                    identifierFilter: {
                        TemplateFilter: {
                            value: {
                                templateId,
                                includeCreatedEventBlob:
                                    this.settings.includeCreatedEventBlob,
                            },
                        },
                    },
                },
            ],
        }
    }

    private createEventFormat(key: ACSKey): EventFormat {
        const cumulativeFilter = key.templateId
            ? this.createTemplateFilter(key.templateId)
            : this.createInterfaceFilter(key.interfaceId ?? '')

        if (key.party) {
            if (!key.interfaceId && !key.templateId) {
                return {
                    filtersByParty: {
                        [key.party]: {},
                    },
                    verbose: false,
                } as EventFormat
            }

            return {
                filtersByParty: {
                    [key.party]: cumulativeFilter,
                },
                verbose: false,
            } as EventFormat
        }

        return {
            filtersForAnyParty: cumulativeFilter,
            verbose: false,
        } as EventFormat
    }
}
