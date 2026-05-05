// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { type Logger } from 'pino'
import { PartyId } from '@canton-network/core-types'
import { type Types } from '@canton-network/core-ledger-client'

import {
    TransactionParser,
    TokenStandardTransactionInterfaces,
} from '@canton-network/core-tx-parser'
import { type Transaction } from '@canton-network/core-tx-parser'
import { LedgerProvider, type Ops } from '@canton-network/core-provider-ledger'

type FiltersByParty = Types['Map_Filters']

type Update = Ops.PostV2UpdatesFlats['ledgerApi']['result'][number]
type JsTransaction = Types['JsTransaction']

const updateOffset = (update: Update): number => {
    const kind = update.update
    if (!kind) throw new Error('Ledger update kind is missing')
    if ('OffsetCheckpoint' in kind) return kind.OffsetCheckpoint.value.offset
    if ('Reassignment' in kind) return kind.Reassignment.value.offset
    if ('TopologyTransaction' in kind)
        return kind.TopologyTransaction.value.offset
    if ('Transaction' in kind) return kind.Transaction.value.offset
    throw new Error('Ledger update is missing an offset')
}

/** Helper function to paginate over all updates in a range.
 *
 *  Currently this function may "throw away" some updates after endInclusive,
 *  we could improve performance and avoid repeated calls by returning and
 *  saving these. */
const paginateUpdates = async function* ({
    logger,
    provider,
    beginExclusive,
    endInclusive,
    filtersByParty,
}: {
    logger: Logger
    provider: LedgerProvider
    beginExclusive: number
    endInclusive: number
    filtersByParty: FiltersByParty
}): AsyncGenerator<Update[], void, void> {
    const limit = 32 // just to test
    let more = true
    while (more) {
        const updates = await provider.request<Ops.PostV2UpdatesFlats>({
            method: 'ledgerApi',
            params: {
                resource: '/v2/updates/flats',
                requestMethod: 'post',
                body: {
                    beginExclusive,
                    verbose: false, // deprecated in 3.4
                    updateFormat: {
                        includeTransactions: {
                            transactionShape:
                                'TRANSACTION_SHAPE_LEDGER_EFFECTS',
                            eventFormat: {
                                verbose: false,
                                filtersByParty,
                            },
                        },
                    },
                },
                query: {
                    limit,
                },
            },
        })

        if (updates.length == 0) {
            more = false
        } else {
            // Filter out updates after endInclusive.  If we received any at
            // or after endInclusive, we immediately know that we won't have
            // more pages.
            const relevantUpdates: Update[] = []
            let latestOffset: number | undefined = undefined
            for (const update of updates) {
                const offset = updateOffset(update)
                if (latestOffset !== null || offset >= latestOffset) {
                    latestOffset = offset
                }
                if (offset >= endInclusive) {
                    more = false
                }
                if (offset < endInclusive) {
                    relevantUpdates.push(update)
                }
            }

            if (latestOffset === undefined) {
                logger.error('no events with an offset, skipping')
            } else if (latestOffset >= beginExclusive) {
                beginExclusive = latestOffset
            }

            yield relevantUpdates
        }
    }
}

export type TransactionHistoryRequest =
    | null // Fetch first page
    | { beginExclusive: number } // Fetch newer transactions
    | { endInclusive: number } // Fetch older transactions

export type TransactionHistoryResponse = {
    transactions: Transaction[]
    beginExclusive: number
    beginIsLedgerStart: boolean
    endInclusive: number
}

export class TransactionHistoryService {
    private logger: Logger
    private provider: LedgerProvider
    private party: string

    /** We probably want to move this to a SQLite based format instead. */
    private transactions: Transaction[]

    /** Events that we have retrieved from the ledger but not processed yet
     *   (e.g. an exercise on a contract that we don't know about). */
    private unprocessed: JsTransaction[]

    /** The oldest and most recent offset we know about.  If both are set, you
     *   can assume we have gathered all updates in this range. */
    private beginExclusive: number | undefined
    private endInclusive: number | undefined

    /** The ledger start.  This can be used to determine if we have all
     *  available data.  This value will never decrease, only increase. */
    private ledgerStartExclusive: number | undefined

    constructor({
        logger,
        provider,
        party,
    }: {
        logger: Logger
        provider: LedgerProvider
        party: PartyId
    }) {
        this.logger = logger
        this.provider = provider
        this.party = party
        this.transactions = []
        this.unprocessed = []
    }

    private async fetchRange({
        beginExclusive,
        endInclusive,
    }: {
        beginExclusive: number
        endInclusive: number
    }): Promise<number> {
        // TODO: check the invariant that this range is adjacent to the
        // current range (this.beginExclusive, this.endInclusive).
        let fetchedUpdates = 0
        for await (const updates of paginateUpdates({
            logger: this.logger,
            provider: this.provider,
            beginExclusive,
            endInclusive,
            filtersByParty: {
                [this.party]: {
                    cumulative: [
                        ...TokenStandardTransactionInterfaces.map(
                            (interfaceName) => ({
                                identifierFilter: {
                                    InterfaceFilter: {
                                        value: {
                                            interfaceId: interfaceName,
                                            includeInterfaceView: true,
                                            includeCreatedEventBlob: true,
                                        },
                                    },
                                },
                            })
                        ),
                    ],
                },
            },
        })) {
            fetchedUpdates += updates.length

            const unapplied = [...this.unprocessed]

            for (const update of updates) {
                if (update.update && 'Transaction' in update.update) {
                    unapplied.push(update.update.Transaction.value)
                }
            }

            unapplied.sort((e1, e2) => e1.offset - e2.offset)

            const newUnprocessed: JsTransaction[] = []
            for (const jsTransaction of unapplied) {
                const provider = window.canton as unknown as LedgerProvider
                const parser = new TransactionParser(
                    provider,
                    jsTransaction,
                    this.party,
                    false // isMasterUser
                )
                try {
                    const transaction = await parser.parseTransaction()
                    this.transactions.push(transaction)
                } catch (error) {
                    // TODO: we should probably only add the transaction to
                    // unprocessed if we get the error
                    // CONTRACT_EVENTS_NOT_FOUND, in other cases retrying
                    // probably won't help.
                    this.logger.info({ error }, 'parsing transaction failed')
                    newUnprocessed.push(jsTransaction)
                }
            }

            this.unprocessed = newUnprocessed
            if (this.unprocessed.length > 0) {
                this.logger.debug(
                    { unprocessed: this.unprocessed },
                    'unprocessed events'
                )
            }
        }

        // Update the known range.
        if (
            this.beginExclusive === undefined ||
            beginExclusive < this.beginExclusive
        ) {
            this.beginExclusive = beginExclusive
        }
        if (
            this.endInclusive === undefined ||
            endInclusive > this.endInclusive
        ) {
            this.endInclusive = endInclusive
        }

        this.logger.debug(
            {
                beginExclusive: this.beginExclusive,
                endInclusive: this.endInclusive,
            },
            'TransactionHistoryService state'
        )

        return fetchedUpdates
    }

    async query(
        request: TransactionHistoryRequest
    ): Promise<TransactionHistoryResponse> {
        this.logger.debug({ request }, 'query')

        if (request === null) {
            await this.fetchOlder()
        } else if ('endInclusive' in request) {
            await this.fetchOlder()
        } else if ('beginExclusive' in request) {
            await this.fetchMoreRecent()
        }

        if (this.beginExclusive === undefined) {
            throw new Error(
                'TransactionHistoryService: beginExclusive is undefined after fetching'
            )
        }
        if (this.endInclusive === undefined) {
            throw new Error(
                'TransactionHistoryService: endInclusive is undefined after fetching'
            )
        }

        const transactions = [...this.transactions]
        transactions.sort((a, b) => b.offset - a.offset)
        if (request === null) {
            return {
                transactions,
                endInclusive: this.endInclusive,
                beginExclusive: this.beginExclusive,
                beginIsLedgerStart:
                    this.ledgerStartExclusive !== undefined &&
                    this.beginExclusive <= this.ledgerStartExclusive,
            }
        } else if ('endInclusive' in request) {
            return {
                transactions: transactions.filter(
                    (tx) => tx.offset <= request.endInclusive
                ),
                endInclusive: request.endInclusive,
                beginExclusive: this.beginExclusive,
                beginIsLedgerStart:
                    this.ledgerStartExclusive !== undefined &&
                    this.beginExclusive <= this.ledgerStartExclusive,
            }
        } else {
            return {
                transactions: transactions.filter(
                    (tx) => tx.offset > request.beginExclusive
                ),
                endInclusive: this.endInclusive,
                beginExclusive: request.beginExclusive,
                beginIsLedgerStart:
                    this.ledgerStartExclusive !== undefined &&
                    request.beginExclusive <= this.ledgerStartExclusive,
            }
        }
    }

    private async getLedgerEnd(): Promise<
        Ops.GetV2StateLedgerEnd['ledgerApi']['result']
    > {
        return await this.provider.request<Ops.GetV2StateLedgerEnd>({
            method: 'ledgerApi',
            params: {
                resource: '/v2/state/ledger-end',
                requestMethod: 'get',
            },
        })
    }

    // TODO: instead of fetching more recent history, can we rely on transaction
    // events?  Or can we insert them here as they are purged from the ACS?
    private async fetchMoreRecent(): Promise<void> {
        if (this.endInclusive === undefined) {
            // This means we never fetched any transactions.  We want to start
            // with fetching a batch of older ones.
            return this.fetchOlder()
        } else {
            // If we do have an endInclusive, fetch everything in between
            // that and the most recent offset (ledger end).
            const ledgerEnd = await this.getLedgerEnd()

            await this.fetchRange({
                beginExclusive: this.endInclusive,
                endInclusive: ledgerEnd.offset!,
            })
        }
    }

    // TODO: return bool to determine we are finished?
    private async fetchOlder(): Promise<void> {
        // Figure out the end of the range.
        let endInclusive = this.beginExclusive
        if (endInclusive === undefined) {
            const ledgerEnd = await this.getLedgerEnd()
            endInclusive = ledgerEnd.offset!
        }

        // Figure out the start of the ledger; we can't cache this but we could
        // cache the fact that we reached the start of it (since it would only
        // move forwards).
        this.ledgerStartExclusive = (
            await this.provider.request<Ops.GetV2StateLatestPrunedOffsets>({
                method: 'ledgerApi',
                params: {
                    resource: '/v2/state/latest-pruned-offsets',
                    requestMethod: 'get',
                },
            })
        ).participantPrunedUpToInclusive!

        // Fetch an increasingly larger offset delta.
        // The actual fetching is handled by fetchRange which will paginate
        // into smaller batches.
        let delta = 256
        let beginExclusive = Math.max(
            this.ledgerStartExclusive,
            endInclusive - delta
        )
        let numUpdates = await this.fetchRange({ beginExclusive, endInclusive })
        while (numUpdates === 0 && beginExclusive > this.ledgerStartExclusive) {
            delta *= 2
            beginExclusive = Math.max(
                this.ledgerStartExclusive,
                endInclusive - delta
            )
            numUpdates = await this.fetchRange({ beginExclusive, endInclusive })
        }
    }
}
