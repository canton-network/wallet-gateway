// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { AllKnownMetaKeys, matchInterfaceIds } from './constants.js'

import { Holding, TransferInstructionView } from './types.js'
import {
    HOLDING_INTERFACE_ID,
    TRANSFER_INSTRUCTION_INTERFACE_ID,
} from '@canton-network/core-token-standard'

import { type LedgerCommonSchemas } from '@canton-network/core-ledger-client-types'

type ArchivedEvent = LedgerCommonSchemas['ArchivedEvent']
type CreatedEvent = LedgerCommonSchemas['CreatedEvent']
type ExercisedEvent = LedgerCommonSchemas['ExercisedEvent']
type JsInterfaceView = LedgerCommonSchemas['JsInterfaceView']

export function hasInterface(
    interfaceId: string,
    event: ExercisedEvent | ArchivedEvent
): boolean {
    return (event.implementedInterfaces || []).some((id) =>
        matchInterfaceIds(id, interfaceId)
    )
}

export function getInterfaceView(
    createdEvent: CreatedEvent
): JsInterfaceView | null {
    const interfaceViews = createdEvent.interfaceViews || null
    return (interfaceViews && interfaceViews[0]) || null
}

export type KnownInterfaceView =
    | { type: 'Holding'; viewValue: Holding }
    | { type: 'TransferInstruction'; viewValue: TransferInstructionView }

export function getKnownInterfaceView(
    createdEvent: CreatedEvent
): KnownInterfaceView | null {
    const interfaceView = getInterfaceView(createdEvent)
    if (!interfaceView || !interfaceView.interfaceId) {
        return null
    } else if (
        matchInterfaceIds(HOLDING_INTERFACE_ID, interfaceView.interfaceId)
    ) {
        return {
            type: 'Holding',
            viewValue: interfaceView.viewValue as Holding,
        }
    } else if (
        matchInterfaceIds(
            TRANSFER_INSTRUCTION_INTERFACE_ID,
            interfaceView.interfaceId
        )
    ) {
        return {
            type: 'TransferInstruction',
            viewValue: interfaceView.viewValue as TransferInstructionView,
        }
    } else {
        return null
    }
}

// TODO (#563): handle allocations in such a way that any callers have to handle them too
/**
 * Use this when `createdEvent` is guaranteed to have an interface view because the ledger api filters
 * include it, and thus is guaranteed to be returned by the API.
 */
export function ensureInterfaceViewIsPresent(
    createdEvent: CreatedEvent,
    interfaceId: string
): JsInterfaceView {
    const interfaceView = getInterfaceView(createdEvent)
    if (!interfaceView) {
        throw new Error(
            `Expected to have interface views, but didn't: ${JSON.stringify(
                createdEvent
            )}`
        )
    }
    if (
        !interfaceView.interfaceId ||
        !matchInterfaceIds(interfaceId, interfaceView.interfaceId)
    ) {
        throw new Error(
            `Not a ${interfaceId} but a ${
                interfaceView.interfaceId
            }: ${JSON.stringify(createdEvent)}`
        )
    }
    return interfaceView
}

type Meta = { values: { [key: string]: string } } | undefined

export function mergeMetas(event: ExercisedEvent, extra?: Meta): Meta {
    // Add a type assertion to help TypeScript understand the shape of choiceArgument
    const choiceArgument = event.choiceArgument as
        | {
              transfer?: { meta?: Meta }
              extraArgs?: { meta?: Meta }
              meta?: Meta
          }
        | undefined

    const lastWriteWins = [
        choiceArgument?.transfer?.meta,
        choiceArgument?.extraArgs?.meta,
        choiceArgument?.meta,
        extra,
        (event.exerciseResult as { meta?: Meta } | undefined)?.meta,
    ]
    const result: { [key: string]: string } = {}
    lastWriteWins.forEach((meta) => {
        const values: { [key: string]: string } = meta?.values || {}
        Object.entries(values).forEach(([k, v]) => {
            result[k] = v
        })
    })
    if (Object.keys(result).length === 0) {
        return undefined
    }
    // order of keys doesn't matter, but we return it consistent for test purposes (and it's nicer)
    else {
        return { values: result }
    }
}

export function getMetaKeyValue(key: string, meta: Meta): string | null {
    return (meta?.values || {})[key] || null
}

/**
 * From the view of making it easy to build the display for the wallet,
 * we remove all metadata fields that were fully parsed, and whose content is reflected in the TypeScript structure.
 * Otherwise, the display code has to do so, overloading the user with superfluous metadata entries.
 */
export function removeParsedMetaKeys(meta: Meta): Meta {
    return {
        values: Object.fromEntries(
            Object.entries(meta?.values || {}).filter(
                ([k]) => !AllKnownMetaKeys.includes(k)
            )
        ),
    }
}
