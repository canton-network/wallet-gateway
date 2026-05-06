// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { PartyId } from '@canton-network/core-types'
import type { LedgerCommonSchemas } from './index.js'

type TransactionFilter = Types['TransactionFilter']
type EventFormat = Types['EventFormat']
type Types = LedgerCommonSchemas
type BaseFilterOptions = {
    includeWildcard?: boolean
    isMasterUser?: boolean
    partyId?: PartyId | undefined
}

type FilterIdentifiers =
    | {
          templateIds: string[] | string
          interfaceIds?: never
      }
    | {
          interfaceIds: string[] | string
          templateIds?: never
      }

type TransactionFilterOptions = BaseFilterOptions & FilterIdentifiers

type EventFilterOptions = TransactionFilterOptions & { verbose?: boolean }

export function TransactionFilterBySetup(
    options: TransactionFilterOptions
): TransactionFilter {
    const { templateIds, interfaceIds, ...baseOptions } = options
    return buildFilter<TransactionFilter>(
        normalizeToArray(templateIds || []),
        normalizeToArray(interfaceIds || []),
        baseOptions
    )
}

export function EventFilterBySetup(options: EventFilterOptions): EventFormat {
    const {
        templateIds,
        interfaceIds,
        verbose = false,
        ...baseOptions
    } = options
    return buildFilter<EventFormat>(
        normalizeToArray(templateIds || []),
        normalizeToArray(interfaceIds || []),
        baseOptions,
        { verbose }
    )
}

function normalizeToArray<T>(value: T | T[]): T[] {
    return Array.isArray(value) ? value : [value]
}

function createWildcardFilter() {
    return {
        identifierFilter: {
            WildcardFilter: {
                value: {
                    includeCreatedEventBlob: true,
                },
            },
        },
    }
}

function createIdentiferFilter(type: 'Template' | 'Interface', id: string) {
    if (type === 'Template') {
        return {
            identifierFilter: {
                TemplateFilter: {
                    value: {
                        templateId: id,
                        includeCreatedEventBlob: true,
                    },
                },
            },
        }
    } else {
        return {
            identifierFilter: {
                InterfaceFilter: {
                    value: {
                        interfaceId: id,
                        includeInterfaceView: true,
                        includeCreatedEventBlob: true,
                    },
                },
            },
        }
    }
}

function buildCumulativeFilters(
    templateIds: string[],
    interfaceIds: string[],
    includeWildcard: boolean
) {
    if (templateIds.length > 0) {
        return [
            ...templateIds.map((templateId) =>
                createIdentiferFilter('Template', templateId)
            ),
            ...(includeWildcard ? [createWildcardFilter()] : []),
        ]
    } else {
        return [
            ...interfaceIds.map((interfaceId) =>
                createIdentiferFilter('Interface', interfaceId)
            ),
            ...(includeWildcard ? [createWildcardFilter()] : []),
        ]
    }
}

function filtersByParty(
    party: PartyId,
    templateIds: string[],
    interfaceIds: string[],
    includeWildcard: boolean
): TransactionFilter['filtersByParty'] {
    return {
        [party]: {
            cumulative: buildCumulativeFilters(
                templateIds,
                interfaceIds,
                includeWildcard
            ),
        },
    }
}

function filtersForAnyParty(
    interfaceNames: string[],
    templateIds: string[],
    includeWildcard: boolean
): TransactionFilter['filtersForAnyParty'] {
    return {
        cumulative: buildCumulativeFilters(
            templateIds,
            interfaceNames,
            includeWildcard
        ),
    }
}

function buildFilter<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    T extends { filtersByParty?: any; filtersForAnyParty?: any },
>(
    templateIds: string[],
    interfaceIds: string[],
    options: BaseFilterOptions,
    additionalProps?: Partial<T>
): T {
    const { isMasterUser = false, partyId, includeWildcard = false } = options

    if (isMasterUser) {
        return {
            filtersByParty: {},
            filtersForAnyParty: filtersForAnyParty(
                templateIds,
                interfaceIds,
                includeWildcard
            ),
            ...additionalProps,
        } as T
    }

    if (!partyId) {
        throw new Error('Party must be provided for non-master users')
    }

    return {
        filtersByParty: filtersByParty(
            partyId,
            templateIds,
            interfaceIds,
            includeWildcard
        ),
        ...additionalProps,
    } as T
}
