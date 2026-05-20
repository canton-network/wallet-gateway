// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import {
    AbstractLedgerProvider,
    Ops,
} from '@canton-network/core-provider-ledger'
import { ACSCacheCollection } from './cache/collection'
import { AcsOptions, AcsService, ResolvedAcsOptions } from './service'
import { ACSCacheOptions } from './cache/cache'
import { LedgerCommonSchemas } from '@canton-network/core-ledger-client-types'

type Reader = {
    read: (
        options: AcsOptions
    ) => Promise<Array<LedgerCommonSchemas['JsGetActiveContractsResponse']>>
    readJsContracts: (options: AcsOptions) => Promise<
        Array<
            LedgerCommonSchemas['JsActiveContract']['createdEvent'] & {
                synchronizerId: LedgerCommonSchemas['JsActiveContract']['synchronizerId']
            }
        >
    >
}

export class ACSReader implements Reader {
    private cacheCollection: ACSCacheCollection
    private service: AcsService

    constructor(
        private readonly ledger: AbstractLedgerProvider,
        private readonly cacheOptions?: ACSCacheOptions
    ) {
        this.cacheCollection = new ACSCacheCollection(ledger, cacheOptions)
        this.service = new AcsService(ledger)
    }

    /**
     * Provides direct access to the ACS without using the cache.
     */
    public raw: Reader = {
        read: async (options: AcsOptions) => {
            const resolvedOptions = await this.resolveAcsOptions(options)
            return await this.service.getActiveContracts(resolvedOptions)
        },
        readJsContracts: async (options: AcsOptions) => {
            return this.readJsContractsWith(await this.raw.read(options))
        },
    }

    /**
     * Reads active contracts from the cache.
     */
    public async read(options: AcsOptions) {
        const resolvedOptions = await this.resolveAcsOptions(options)
        return await this.cacheCollection.readFromCache(resolvedOptions)
    }

    /**
     * Convenience method that returns active contracts as JS contract objects.
     */
    public async readJsContracts(options: AcsOptions) {
        return this.readJsContractsWith(await this.read(options))
    }

    private readJsContractsWith(output: Awaited<ReturnType<Reader['read']>>) {
        return output
            .filter(
                (acs) =>
                    acs.contractEntry != null &&
                    'JsActiveContract' in acs.contractEntry
            )
            .map((acs) => {
                const jsActiveContract = (
                    acs.contractEntry as {
                        JsActiveContract: LedgerCommonSchemas['JsActiveContract']
                    }
                ).JsActiveContract

                return {
                    ...jsActiveContract.createdEvent,
                    synchronizerId: jsActiveContract.synchronizerId,
                }
            })
    }

    private async resolveAcsOptions(
        options: AcsOptions
    ): Promise<ResolvedAcsOptions> {
        const offset =
            options.offset ??
            (
                await this.ledger.request<Ops.GetV2StateLedgerEnd>({
                    method: 'ledgerApi',
                    params: {
                        resource: '/v2/state/ledger-end',
                        requestMethod: 'get',
                    },
                })
            ).offset!

        return { ...options, offset }
    }
}
