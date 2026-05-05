// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import {
    supportedLedgerApiVersions,
    type LedgerApiVersion,
    type LedgerCommonPaths,
    type LedgerCommonSchemas,
} from '@canton-network/core-ledger-client-types'
import createClient, { Client, FetchOptions } from 'openapi-fetch'
import { Logger } from 'pino'
import { PartyId } from '@canton-network/core-types'
import {
    asJsCantonError,
    defaultRetryableOptions,
    retryable,
    retryableOptions,
} from './ledger-api-utils.js'
import { ACSHelper, AcsHelperOptions } from './acs/acs-helper.js'
import { SharedACSCache } from './acs/acs-shared-cache.js'
import { AccessTokenProvider } from '@canton-network/core-wallet-auth'

export const supportedVersions = supportedLedgerApiVersions

export type SupportedVersions = LedgerApiVersion

type paths = LedgerCommonPaths

type SchemaByVersion<Name extends keyof LedgerCommonSchemas> =
    LedgerCommonSchemas[Name]

type ClientsByVersion = {
    [V in SupportedVersions]: Client<paths>
}

export type UserSchema = SchemaByVersion<'User'>

export type Types = LedgerCommonSchemas

// A conditional type that filters the set of OpenAPI path names to those that actually have a defined POST operation.
// Any path without a POST is excluded via the `never` branch of the conditional
export type PatchEndpoint = {
    [Pathname in keyof paths]: paths[Pathname] extends {
        patch: unknown
    }
        ? Pathname
        : never
}[keyof paths]

// Given a pathname (string) that has a POST, this helper type extracts the request body type from the OpenAPI definition.
export type PatchRequest<Path extends PatchEndpoint> = paths[Path] extends {
    patch: { requestBody: { content: { 'application/json': infer Req } } }
}
    ? Req
    : never

// Given a pathname (string) that has a POST, this helper type extracts the 200 response type from the OpenAPI definition.
export type PatchResponse<Path extends PatchEndpoint> = paths[Path] extends {
    patch: {
        responses: { 200: { content: { 'application/json': infer Res } } }
    }
}
    ? Res
    : never

// A conditional type that filters the set of OpenAPI path names to those that actually have a defined POST operation.
// Any path without a POST is excluded via the `never` branch of the conditional
export type PostEndpoint = {
    [Pathname in keyof paths]: paths[Pathname] extends {
        post: unknown
    }
        ? Pathname
        : never
}[keyof paths]

// Given a pathname (string) that has a POST, this helper type extracts the request body type from the OpenAPI definition.
export type PostRequest<Path extends PostEndpoint> = paths[Path] extends {
    post: { requestBody: { content: { 'application/json': infer Req } } }
}
    ? Req
    : never

// Given a pathname (string) that has a POST, this helper type extracts the 200 response type from the OpenAPI definition.
export type PostResponse<Path extends PostEndpoint> = paths[Path] extends {
    post: { responses: { 200: { content: { 'application/json': infer Res } } } }
}
    ? Res
    : never

// Similar as above, for GETs
export type GetEndpoint = {
    [Pathname in keyof paths]: paths[Pathname] extends {
        get: unknown
    }
        ? Pathname
        : never
}[keyof paths]

// Similar as above, for GETs
export type GetResponse<Path extends GetEndpoint> = paths[Path] extends {
    get: { responses: { 200: { content: { 'application/json': infer Res } } } }
}
    ? Res
    : never

export type GenerateTransactionResponse =
    SchemaByVersion<'GenerateExternalPartyTopologyResponse'>

export type AllocateExternalPartyResponse =
    SchemaByVersion<'AllocateExternalPartyResponse'>
export type OnboardingTransactions = NonNullable<
    SchemaByVersion<'AllocateExternalPartyRequest'>['onboardingTransactions']
>

export type MultiHashSignatures = NonNullable<
    SchemaByVersion<'AllocateExternalPartyRequest'>['multiHashSignatures']
>
export type PrepareSubmissionResponse =
    SchemaByVersion<'JsPrepareSubmissionResponse'>

// Any options the client accepts besides body/params
type ExtraPostOpts = Omit<FetchOptions<paths>, 'body' | 'params'>

export class LedgerClient {
    // privately manage the active connected version and associated client codegen
    private readonly clients: ClientsByVersion
    private clientVersion: SupportedVersions = '3.5'
    private initialized: boolean = false
    private accessTokenProvider: AccessTokenProvider
    private acsHelper: ACSHelper
    private readonly logger: Logger
    private synchronizerId: string | undefined
    baseUrl: URL

    constructor({
        baseUrl,
        logger,
        accessTokenProvider,
        version,
        acsHelperOptions,
    }: {
        baseUrl: URL
        logger: Logger
        accessTokenProvider: AccessTokenProvider
        version?: SupportedVersions
        acsHelperOptions?: AcsHelperOptions
    }) {
        this.logger = logger.child({ component: 'LedgerClient' })
        this.accessTokenProvider = accessTokenProvider

        const authenticatedFetch = async (
            url: RequestInfo,
            options: RequestInit = {}
        ) => {
            const token = await this.accessTokenProvider.getAccessToken()
            return fetch(url, {
                ...options,
                headers: {
                    ...(options.headers || {}),
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
            })
        }

        this.clients = {
            ...supportedVersions.reduce((acc, version) => {
                acc[version] = createClient<paths>({
                    baseUrl: baseUrl.href,
                    fetch: authenticatedFetch,
                })
                return acc
            }, {} as ClientsByVersion),
        }

        this.clientVersion = version ?? this.clientVersion
        this.baseUrl = baseUrl
        this.acsHelper = new ACSHelper(
            this,
            logger,
            acsHelperOptions,
            SharedACSCache
        )
    }

    private get currentClient(): Client<paths> {
        return this.clients[this.clientVersion] as unknown as Client<paths>
    }

    public async init() {
        if (!this.initialized) {
            this.logger.debug({
                message: `Initializing LedgerClient with version ${this.clientVersion} for url ${this.baseUrl.href}`,
            })

            //TODO: parse error response and escalate
            const versionFromClient =
                await this.currentClient.GET('/v2/version')

            this.logger.debug(versionFromClient, 'getV2Version response')

            this.clientVersion = this.parseSupportedVersions(
                versionFromClient.data?.version
            )
            this.initialized = true
        }
    }

    public getCurrentClientVersion(): SupportedVersions {
        return this.clientVersion
    }

    parseSupportedVersions(version: string | undefined): SupportedVersions {
        if (!version) {
            throw new Error('Client version missing from response')
        }

        const match = supportedVersions.find((v) => version.startsWith(v))
        if (!match) {
            throw new Error(`Unsupported version - found ${version}`)
        }

        return match
    }

    /**
     * Check if a party exists
     *
     * @param partyId The ID of the party to look for
     * @returns A promise to resolves to a boolean.
     */
    public async checkIfPartyExists(partyId: PartyId): Promise<boolean> {
        try {
            const party = await this.get('/v2/parties/{party}', {
                path: { party: partyId },
            })
            return (
                party.partyDetails !== undefined &&
                party.partyDetails[0].party === partyId
            )
        } catch {
            return false
        }
    }

    /**
     * grant "Master User" rights to a user.
     *
     * this require running with an admin token.
     *
     * @param userId The ID of the user to grant rights to.
     * @param canReadAsAnyParty define if the user can read as any party.
     * @param canExecuteAsAnyParty define if the user can execute as any party.
     */
    public async grantMasterUserRights(
        userId: string,
        canReadAsAnyParty: boolean,
        canExecuteAsAnyParty: boolean
    ) {
        const rights = []
        if (canReadAsAnyParty) {
            rights.push({
                kind: {
                    CanReadAsAnyParty: { value: {} as Record<string, never> },
                },
            })
        }
        if (canExecuteAsAnyParty) {
            rights.push({
                kind: {
                    CanExecuteAsAnyParty: {
                        value: {} as Record<string, never>,
                    },
                },
            })
        }

        const result = await this.post(
            '/v2/users/{user-id}/rights',
            {
                identityProviderId: '',
                userId,
                rights,
            },
            {
                path: {
                    'user-id': userId,
                },
            }
        )

        if (!result.newlyGrantedRights) {
            throw new Error('Failed to grant user rights')
        }
    }

    /**
     * Create a new user.
     *
     * @param userId The ID of the user to create.
     * @param primaryParty The primary party of the user.
     */
    public async createUser(
        userId: string,
        primaryParty: PartyId
    ): Promise<UserSchema> {
        try {
            const existing = await this.get('/v2/users/{user-id}', {
                path: { 'user-id': userId },
            })

            if (existing && existing.user) {
                return existing.user!
            }
        } catch {
            //TODO: proper error handling based on daml code
            // we continue if code is:
            // code: 'USER_NOT_FOUND',
            // cause: 'getting user failed for unknown user "master-user"',
        }

        return (
            await this.post('/v2/users', {
                user: {
                    identityProviderId: '',
                    id: userId,
                    isDeactivated: false,
                    primaryParty: primaryParty,
                },
                rights: [
                    {
                        kind: {
                            ParticipantAdmin: {
                                value: {} as Record<string, never>,
                            },
                        },
                    },
                ],
            })
        ).user!
    }

    /**
     * Grants a user the right to act as a party, while ensuring the party exists.
     *
     * @param userId The ID of the user to grant rights to.
     * @param partyId The ID of the party to grant rights for.
     * @param maxTries Optional max number of retries with default 30. May be increased if expecting heavy load.
     * @param retryIntervalMs Optional interval between retries to verify that party exists with default 2000ms. May be increased if expecting heavy load.
     * @returns A promise that resolves when the rights have been granted.
     */
    public async waitForPartyAndGrantUserRights(
        userId: string,
        partyId: PartyId,
        maxTries: number = 30,
        retryIntervalMs: number = 2000
    ) {
        await this.init()
        // Wait for party to appear on participant
        let partyFound = false
        let tries = 0

        while (!partyFound && tries < maxTries) {
            partyFound = await this.checkIfPartyExists(partyId)

            await new Promise((resolve) => setTimeout(resolve, retryIntervalMs))
            tries++
        }

        if (tries >= maxTries) {
            throw new Error(
                `timed out waiting for new party to appear after ${maxTries} tries`
            )
        }

        const result = await this.grantRights(userId, {
            actAs: [partyId],
        })

        if (!result.newlyGrantedRights) {
            throw new Error('Failed to grant user rights')
        }

        return
    }

    public async grantRights(
        userId: string,
        userRightsOptions: {
            canReadAsAnyParty?: boolean
            canExecuteAsAnyParty?: boolean
            readAs?: PartyId[]
            actAs?: PartyId[]
        }
    ) {
        await this.init()
        const rights = []

        for (const partyId of userRightsOptions.readAs ?? []) {
            rights.push({
                kind: {
                    CanReadAs: {
                        value: {
                            party: partyId,
                        },
                    },
                },
            })
        }

        for (const partyId of userRightsOptions.actAs ?? []) {
            rights.push({
                kind: {
                    CanActAs: {
                        value: {
                            party: partyId,
                        },
                    },
                },
            })
        }

        if (userRightsOptions.canReadAsAnyParty) {
            rights.push({
                kind: {
                    CanReadAsAnyParty: { value: {} as Record<string, never> },
                },
            })
        }
        if (userRightsOptions.canExecuteAsAnyParty) {
            rights.push({
                kind: {
                    CanExecuteAsAnyParty: {
                        value: {} as Record<string, never>,
                    },
                },
            })
        }

        const result = await this.post(
            '/v2/users/{user-id}/rights',
            {
                identityProviderId: '',
                userId,
                rights,
            },
            {
                path: {
                    'user-id': userId,
                },
            }
        )

        if (!result.newlyGrantedRights) {
            throw new Error('Failed to grant user rights')
        }

        return result
    }

    public async allocateExternalParty(
        synchronizerId: string,
        onboardingTransactions: OnboardingTransactions,
        multiHashSignatures: MultiHashSignatures
    ): Promise<AllocateExternalPartyResponse> {
        await this.init()
        const resp = await this.currentClient.POST(
            '/v2/parties/external/allocate',
            {
                body: {
                    synchronizer: synchronizerId,
                    identityProviderId: '',
                    onboardingTransactions,
                    multiHashSignatures,
                },
            }
        )

        return this.valueOrError(resp)
    }

    public async generateTopology(
        synchronizerId: string,
        publicKey: string,
        partyHint: string,
        localParticipantObservationOnly: boolean = false,
        confirmationThreshold: number = 1,
        otherConfirmingParticipantUids: string[] = [],
        observingParticipantUids: string[] = []
    ): Promise<GenerateTransactionResponse> {
        await this.init()

        const body = {
            synchronizer: synchronizerId,
            partyHint,
            publicKey: {
                format: 'CRYPTO_KEY_FORMAT_RAW',
                keyData: publicKey,
                keySpec: 'SIGNING_KEY_SPEC_EC_CURVE25519',
            },
            localParticipantObservationOnly,
            confirmationThreshold,
            otherConfirmingParticipantUids,
            observingParticipantUids,
        }

        this.logger.debug(body, 'generateTopology request body')

        const resp = await this.currentClient.POST(
            '/v2/parties/external/generate-topology',
            { body }
        )

        return this.valueOrError(resp)
    }

    /*
    if limit is provided, this function performs a one-time query. Automatically splits into multiple `/v2/updates` calls with `continueUntilCompletion` on.
    if limit is omitted, results may be served from the ACS cache
    current cache design doesn't support limiting queries because updates/deltas for the acs at offset x will be incorrect
    TODO: expose query mode vs subscribe mode to call queryActiveContracts vs subscribeActiveContracts
    */
    async activeContracts(options: {
        offset: number
        templateIds?: string[]
        parties?: string[] //TODO: Figure out if this should use this.partyId by default and not allow cross party filtering
        filterByParty?: boolean
        interfaceIds?: string[]
        limit?: number
        continueUntilCompletion?: boolean
    }): Promise<Array<Types['JsGetActiveContractsResponse']>> {
        const {
            offset,
            templateIds,
            parties,
            interfaceIds,
            limit,
            continueUntilCompletion,
        } = options

        if (continueUntilCompletion) {
            const filter = this.buildActiveContractFilter(options)
            // Query-mode: if limit it set, perform a series of http queries (scan whole ledger)
            return await this.fetchActiveContractsUntilComplete(
                filter,
                limit ?? 200
            )
        }

        const hasLimit = typeof limit === 'number'

        // Query-mode: if limit it set, perform one off http query

        if (hasLimit) {
            const filter = this.buildActiveContractFilter(options)
            //...perform one off http query
            return await this.postWithRetry(
                '/v2/state/active-contracts',
                filter,
                defaultRetryableOptions,
                { query: { limit: limit.toString() } }
            )
        }

        this.logger.debug(options, 'options for active contracts')

        const hasParties = Array.isArray(parties) && parties.length > 0

        //subscribe mode: no limit set and fits the cache requirements, back this by the acs subscription
        if (templateIds?.length && hasParties) {
            return this.acsHelper.activeContractsForTemplates(
                offset,
                parties!,
                templateIds!
            )
        }

        if (interfaceIds?.length && hasParties) {
            return this.acsHelper.activeContractsForInterfaces(
                offset,
                parties!,
                interfaceIds!
            )
        }

        //fallback to generic query without template/interface filter (doesn't use cache)
        const filter = this.buildActiveContractFilter(options)
        this.logger.debug('falling back to post request')

        return await this.postWithRetry(
            '/v2/state/active-contracts',
            filter,
            defaultRetryableOptions
        )
    }

    /**
     * Fetches active contracts by splitting requests into multiple `/v2/updates` calls.
     * Should only be used when the number of contracts exceeds http-list-max-elements-limit (200 by default).
     * For limits at or below http-list-max-elements-limit, use a single `/v2/state/active-contracts` call instead.
     * @param activeContractsArgs The request parameters for active contracts query
     * @returns A promise that resolves to an array of active contract responses
     * @private
     */
    private async fetchActiveContractsUntilComplete(
        activeContractsArgs: PostRequest<'/v2/state/active-contracts'>,
        limit: number
    ): Promise<Array<Types['JsGetActiveContractsResponse']>> {
        const ledgerEnd = await this.getWithRetry('/v2/state/ledger-end')

        const bodyRequest: PostRequest<'/v2/updates'> = {
            beginExclusive: 0,
            endInclusive: ledgerEnd.offset!,
            verbose: false,
            updateFormat: {},
        }
        if (!activeContractsArgs.filter)
            bodyRequest.filter = activeContractsArgs.filter!

        let currentOffset = 0

        const allContractsData = new Map()
        const exercisedContracts = new Set()
        while (currentOffset < ledgerEnd.offset!) {
            bodyRequest.beginExclusive = currentOffset
            const results = (
                await this.postWithRetry(
                    '/v2/updates',
                    bodyRequest,
                    defaultRetryableOptions,
                    {
                        query: { limit: limit.toString() },
                    }
                )
            )
                .filter(({ update }) => update && 'Transaction' in update)
                .map(({ update }) => {
                    if (update && 'Transaction' in update) {
                        return update.Transaction.value
                    }
                    throw new Error('Expected Transaction update')
                })
                .map((data) => {
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
                                activeContractsArgs.filter?.filtersByParty ?? {}
                            ).includes(
                                (event.createArgument as { owner?: string })
                                    ?.owner ?? ''
                            )
                        )

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

    private buildActiveContractFilter(options: {
        offset: number
        templateIds?: string[]
        parties?: string[] //TODO: Figure out if this should use this.partyId by default and not allow cross party filtering
        filterByParty?: boolean
        interfaceIds?: string[]
        limit?: number
    }) {
        const filter: PostRequest<'/v2/state/active-contracts'> = {
            eventFormat: {
                filtersByParty: {},
                verbose: false,
            },
            activeAtOffset: options?.offset,
        }

        // Helper to build TemplateFilter array
        const buildTemplateFilter = (templateIds?: string[]) => {
            if (!templateIds) return []
            return [
                {
                    identifierFilter: {
                        TemplateFilter: {
                            value: {
                                templateId: templateIds[0],
                                includeCreatedEventBlob: true, //TODO: figure out if this should be configurable
                            },
                        },
                    },
                },
            ]
        }

        const buildInterfaceFilter = (interfaceIds?: string[]) => {
            if (!interfaceIds) return []
            return [
                {
                    identifierFilter: {
                        InterfaceFilter: {
                            value: {
                                interfaceId: interfaceIds[0],
                                includeCreatedEventBlob: true, //TODO: figure out if this should be configurable
                                includeInterfaceView: true,
                            },
                        },
                    },
                },
            ]
        }

        this.logger.info(options, 'active contract query options')
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
                filter.filter!.filtersByParty![party] = {
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
                cumulative: buildInterfaceFilter(options.templateIds),
            }
        }

        return filter
    }

    // Retrieve an (arbitrary) synchronizer id from the validator.
    // This synchronizer id is cached for the remainder of this object's life.
    public async getSynchronizerId(): Promise<string> {
        if (this.synchronizerId) return this.synchronizerId
        const response = await this.getWithRetry(
            '/v2/state/connected-synchronizers'
        )
        if (!response.connectedSynchronizers?.[0]) {
            throw new Error('No connected synchronizers found')
        }
        const synchronizerId = response.connectedSynchronizers[0].synchronizerId
        if (response.connectedSynchronizers.length > 1) {
            this.logger.warn(
                `Found ${response.connectedSynchronizers.length} synchronizers, defaulting to ${synchronizerId}`
            )
        }
        this.synchronizerId = synchronizerId
        return synchronizerId
    }

    public async postWithRetry<Path extends PostEndpoint>(
        path: Path,
        body: PostRequest<Path>,
        retryOptions: retryableOptions = defaultRetryableOptions,
        params?: {
            path?: Record<string, string>
            query?: Record<string, string>
        },
        additionalOptions?: ExtraPostOpts
    ): Promise<PostResponse<Path>> {
        return await retryable(
            () => this.post(path, body, params, additionalOptions),
            retryOptions,
            this.logger
        ).catch((e) => {
            this.logger.warn(
                `Error in postWithRetry for path ${path} with body retry options ${JSON.stringify(retryOptions)}`
            )
            this.logger.debug(JSON.stringify(body))
            throw asJsCantonError(e)
        })
    }

    public async getWithRetry<Path extends GetEndpoint>(
        path: Path,
        retryOptions: retryableOptions = defaultRetryableOptions,
        params?: {
            path?: Record<string, string>
            query?: Record<string, string>
        }
    ): Promise<GetResponse<Path>> {
        return await retryable(
            () => this.get(path, params),
            retryOptions,
            this.logger
        ).catch((e) => {
            this.logger.warn(
                `Error in getWithRetry for path ${path} with retry options ${JSON.stringify(retryOptions)}`
            )

            throw asJsCantonError(e)
        })
    }

    public async patchWithRetry<Path extends PatchEndpoint>(
        path: Path,
        body: PatchRequest<Path>,
        retryOptions: retryableOptions = defaultRetryableOptions,
        params?: {
            path?: Record<string, string>
            query?: Record<string, string>
        },
        additionalOptions?: ExtraPostOpts
    ): Promise<PatchResponse<Path>> {
        return await retryable(
            () => this.patch(path, body, params, additionalOptions),
            retryOptions,
            this.logger
        ).catch((e) => {
            this.logger.warn(
                `Error in patchWithRetry for path ${path} with body retry options ${JSON.stringify(retryOptions)}`
            )
            throw asJsCantonError(e)
        })
    }

    public getCacheStats() {
        return this.acsHelper.getCacheStats()
    }

    public async patch<Path extends PatchEndpoint>(
        path: Path,
        body: PatchRequest<Path>,
        params?: {
            path?: Record<string, string>
            query?: Record<string, string | number | boolean>
        },
        // needed when posting to /packages, so content type and jsonification of bytes can be overriden
        additionalOptions?: ExtraPostOpts
    ): Promise<PatchResponse<Path>> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- (cant align this with openapi-fetch generics :shrug:)
        const options = { body, params, ...additionalOptions } as any

        const resp = await this.currentClient.PATCH(path, options)
        return this.valueOrError(resp)
    }

    public async post<Path extends PostEndpoint>(
        path: Path,
        body: PostRequest<Path>,
        params?: {
            path?: Record<string, string>
            query?: Record<string, string | number | boolean>
        },
        // needed when posting to /packages, so content type and jsonification of bytes can be overriden
        additionalOptions?: ExtraPostOpts
    ): Promise<PostResponse<Path>> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- (cant align this with openapi-fetch generics :shrug:)
        const options = { body, params, ...additionalOptions } as any

        const resp = await this.currentClient.POST(path, options)
        return this.valueOrError(resp)
    }

    public async get<Path extends GetEndpoint>(
        path: Path,
        params?: {
            path?: Record<string, string>
            query?: Record<string, string>
        }
    ): Promise<GetResponse<Path>> {
        await this.init()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- (cant align this with openapi-fetch generics :shrug:)
        const options = { params } as any
        const resp = await this.currentClient.GET(path, options)
        return this.valueOrError(resp)
    }

    private async valueOrError<T>(response: {
        data?: T
        error?: unknown
    }): Promise<T> {
        if (response.data === undefined) {
            return Promise.reject(response.error)
        } else {
            return Promise.resolve(response.data)
        }
    }
}
