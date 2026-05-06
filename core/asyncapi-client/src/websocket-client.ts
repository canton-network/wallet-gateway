// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { PartyId } from '@canton-network/core-types'
import {
    asyncApiByVersion,
    supportedAsyncApiVersions,
    TransactionFilterBySetup,
    type AsyncChannelsByVersion,
    type AsyncApiVersion,
    type AsyncCommonChannels,
    type LedgerCommonSchemas,
} from '@canton-network/core-ledger-client-types'
import pino, { Logger } from 'pino'
import { AccessTokenProvider } from '@canton-network/core-wallet-auth'

export const supportedVersions = supportedAsyncApiVersions

export type SupportedVersions = AsyncApiVersion

type ChannelsByVersion = AsyncChannelsByVersion

type ChannelsMap = {
    [V in SupportedVersions]: ChannelsByVersion[V]
}

export type CompletionStreamRequest =
    LedgerCommonSchemas['CompletionStreamRequest']

export type GetUpdatesRequest = LedgerCommonSchemas['GetUpdatesRequest']

export type JsGetUpdatesResponse = LedgerCommonSchemas['JsGetUpdatesResponse']

type UpdateSubscriptionOptions = {
    beginExclusive: number
    endInclusive?: number
    partyId?: PartyId
    verbose?: boolean
} & (
    | { interfaceIds: string[]; templateIds?: never }
    | { interfaceIds?: never; templateIds: string[] }
)

type CommandsCompletionsOptions = {
    beginExclusive: number
    userId: string
    parties: PartyId[]
}

export class WebSocketClient {
    private baseUrl: string
    private token: string = ''
    private protocol: string[] = []
    private readonly channelsByVersion: ChannelsMap
    private version: SupportedVersions = '3.4'
    private readonly logger: Logger
    private accessTokenProvider: AccessTokenProvider

    constructor({
        baseUrl,
        accessTokenProvider,
        version,
    }: {
        baseUrl: string
        accessTokenProvider: AccessTokenProvider
        version?: SupportedVersions
    }) {
        this.logger = pino({ name: 'WebSocketClient', level: 'info' })
        this.baseUrl = baseUrl
        this.accessTokenProvider = accessTokenProvider
        this.channelsByVersion = {
            ...supportedVersions.reduce((acc, currentVersion) => {
                acc[currentVersion] = asyncApiByVersion[currentVersion].CHANNELS
                return acc
            }, {} as ChannelsMap),
        }
        this.version = version ?? this.version
    }

    private get channels(): AsyncCommonChannels {
        return this.channelsByVersion[this.version] as AsyncCommonChannels
    }

    async init() {
        this.token = await this.accessTokenProvider.getAccessToken()
        this.protocol = [`jwt.token.${this.token}`, 'daml.ws.auth']

        this.logger.info(
            `initializing websocket client with ${this.protocol.length} protocols`
        )
    }

    generate(
        wsUrl: string,
        request: GetUpdatesRequest | CompletionStreamRequest
    ): AsyncIterableIterator<JsGetUpdatesResponse> {
        const messageQueue: JsGetUpdatesResponse[] = []
        let resolveNext: (() => void) | null = null
        let isClosed = false
        let streamError: Error | null = null

        const generator = async function* (this: WebSocketClient) {
            await this.init()

            this.logger.debug(request)

            const ws = new WebSocket(wsUrl, this.protocol)

            ws.onopen = () => {
                ws.send(JSON.stringify(request))
            }
            ws.onmessage = (event) => {
                messageQueue.push(JSON.parse(event.data as string))
                this.logger.debug(event.data, `Received event`)
                resolveNext?.()
            }
            ws.onerror = () => {
                streamError = new Error('WebSocket Handshake/Connection failed')
                this.logger.error(`Encountered ws.onError`)
                isClosed = true
                resolveNext?.()
            }
            ws.onclose = (event: CloseEvent) => {
                this.logger.debug(
                    `CLOSING WEBSOCKET CONNECTION code: ${event.code}, reason: ${event.reason}`
                )
                isClosed = true
                resolveNext?.()
            }

            try {
                while (true) {
                    if (messageQueue.length === 0) {
                        if (isClosed) break
                        await new Promise<void>((r) => (resolveNext = r))
                    }

                    if (streamError) throw streamError

                    while (messageQueue.length > 0) {
                        yield messageQueue.shift()!
                    }

                    if (isClosed && messageQueue.length === 0) break
                }
            } finally {
                if (ws.readyState === WebSocket.OPEN) ws.close()
                this.logger.info('Generator cleanup: WebSocket closed.')
            }
        }

        return generator.call(this)
    }

    streamUpdates(
        options: UpdateSubscriptionOptions
    ): AsyncIterableIterator<JsGetUpdatesResponse> {
        const wsUpdatesUrl = `${this.baseUrl}${this.channels.v2_updates}`

        const filter = options.templateIds
            ? TransactionFilterBySetup({
                  templateIds: options.templateIds,
                  partyId: options.partyId,
              })
            : TransactionFilterBySetup({
                  interfaceIds: options.interfaceIds!,
                  partyId: options.partyId,
              })

        const request = {
            beginExclusive: options.beginExclusive,
            verbose: options.verbose ?? true,
            filter,
            updateFormat: {},
            ...(options.endInclusive !== undefined
                ? { endInclusive: options.endInclusive }
                : {}),
        }

        return this.generate(wsUpdatesUrl, request)
    }

    streamCompletions(
        options: CommandsCompletionsOptions
    ): AsyncIterableIterator<JsGetUpdatesResponse> {
        const wsCompletionsUrl = `${this.baseUrl}${this.channels.v2_commands_completions}`

        const request = {
            beginExclusive: options.beginExclusive,
            userId: options.userId,
            parties: options.parties,
        }

        return this.generate(wsCompletionsUrl, request)
    }
}
