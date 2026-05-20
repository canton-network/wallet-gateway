// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { WebSocketClient } from '@canton-network/core-asyncapi-client'

import { SDKLogger } from '../../logger/logger.js'
import {
    UpdatesOptions,
    CompletionOptions,
    Event,
    InvalidSubscriptionOptionsError,
    EventsContext,
} from './types.js'

export class EventsNamespace {
    private websocketClient: WebSocketClient
    private readonly logger: SDKLogger
    constructor(private readonly eventsContext: EventsContext) {
        this.logger = eventsContext.commonCtx.logger.child({
            namespace: 'EventsClient',
        })

        this.websocketClient = new WebSocketClient({
            baseUrl: eventsContext.websocketURL.toString(),
            accessTokenProvider: eventsContext.auth,
        })
    }

    async *completions(
        options: CompletionOptions
    ): AsyncIterableIterator<Event> {
        this.logger.info('Subscribing to command completions...')

        const request = {
            beginExclusive: options.beginOffset ?? 0,
            userId: this.eventsContext.commonCtx.userId,
            parties: options.parties,
        }
        yield* this.websocketClient.streamCompletions(request)
    }

    /**
     *
     * @param options websocket configuration (partyId, templateId/interfaceId, verbose (default = true))
     * @returns AsyncIterableIterator of Updates
     * @throws InvalidSubscriptionOptionsError if the options is invalid
     * @throws WebSocketConnectionError if connection fails
     */
    async *updates(options: UpdatesOptions): AsyncIterableIterator<Event> {
        try {
            this.validateUpdatesOptions(options)
            const normalizedOptions = this.normalizeUpdatesOptions(options)
            this.logger.info(
                { options: normalizedOptions },
                'Starting WebSocket subscription with options'
            )
            yield* this.websocketClient.streamUpdates(normalizedOptions)
        } catch (error) {
            if (error instanceof InvalidSubscriptionOptionsError) {
                this.eventsContext.commonCtx.error.throw({
                    message: 'Failed to subscribe due to invalid options.',
                    type: 'Unexpected',
                })
            } else {
                this.eventsContext.commonCtx.error.throw({
                    message:
                        'Failed to subscribe due to WebSocket connection error.',
                    type: 'Unauthorized',
                })
            }
        } finally {
            this.logger.info('WebSocket subscription ended.')
        }
    }

    private validateUpdatesOptions(options: UpdatesOptions): void {
        if ('templateIds' in options) {
            const templateIds = Array.isArray(options.templateIds)
                ? options.templateIds
                : [options.templateIds]

            if (templateIds.length === 0) {
                throw new InvalidSubscriptionOptionsError(
                    'templateIds array cannot be empty.'
                )
            }

            const invalidIds = templateIds.filter(
                (id) => typeof id !== 'string'
            )
            if (invalidIds.length > 0) {
                throw new InvalidSubscriptionOptionsError(
                    `All templateIds must be strings. Invalid ids: ${invalidIds.join(
                        ', '
                    )}`
                )
            }
        } else if ('interfaceIds' in options) {
            const interfaceIds = Array.isArray(options.interfaceIds)
                ? options.interfaceIds
                : [options.interfaceIds]

            if (interfaceIds.length === 0) {
                throw new InvalidSubscriptionOptionsError(
                    'interfaceIds array cannot be empty.'
                )
            }

            const invalidIds = interfaceIds.filter(
                (id) => typeof id !== 'string'
            )
            if (invalidIds.length > 0) {
                throw new InvalidSubscriptionOptionsError(
                    `All interfaceIds must be strings. Invalid ids: ${invalidIds.join(
                        ', '
                    )}`
                )
            }
        }

        if (
            options.beginOffset !== undefined &&
            typeof options.beginOffset !== 'number'
        ) {
            throw new InvalidSubscriptionOptionsError(
                'beginOffset must be a number if provided.'
            )
        }
    }

    private normalizeUpdatesOptions(options: UpdatesOptions) {
        {
            if ('templateIds' in options && options.templateIds) {
                return {
                    beginExclusive: options.beginOffset ?? 0,
                    verbose: options.verbose ?? true,
                    partyId: options.partyId,
                    templateIds: Array.isArray(options.templateIds)
                        ? options.templateIds
                        : [options.templateIds],
                }
            } else {
                return {
                    beginExclusive: options.beginOffset ?? 0,
                    verbose: options.verbose ?? true,
                    partyId: options.partyId,
                    interfaceIds: Array.isArray(options.interfaceIds)
                        ? options.interfaceIds
                        : [options.interfaceIds],
                }
            }
        }
    }
}
