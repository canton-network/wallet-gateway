// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { AuthTokenProvider } from '@canton-network/core-wallet-auth'
import { parseAssets, ParsedURL } from '../namespace/utils/url.js'
import { KeysNamespace } from '../namespace/keys/index.js'
import { LedgerNamespace } from '../namespace/ledger/index.js'
import { PartyNamespace } from '../namespace/party/index.js'
import { UserNamespace } from '../namespace/user/index.js'
import { TokenNamespace } from '../namespace/token/index.js'
import { AssetNamespace } from '../namespace/asset/index.js'
import { OfflineSDKContext, SDKContext } from '../sdk.js'
import { SDKUtilsNamespace } from '../namespace/utils/index.js'
import {
    AmuletConfig,
    AssetConfig,
    BasicSDKInterface,
    EventsConfig,
    ExtendedFullSDKInterface,
    ExtendedSDKOptions,
    OfflineSDKInterface,
    RegisteredPlugins,
    SDKInterface,
    TokenConfig,
} from './types/index.js'
import {
    ScanClient,
    ScanProxyClient,
    ValidatorInternalClient,
} from '@canton-network/core-splice-client'
import { AmuletService } from '@canton-network/core-amulet-service'
import { TokenStandardService } from '@canton-network/core-token-standard-service'
import { SDKLogger } from '../logger/logger.js'
import { AmuletNamespace } from '../namespace/amulet/namespace.js'
import { EventsNamespace } from '../namespace/events/index.js'
import { SDKPlugin } from './plugin.js'

const createNamespace: {
    [K in keyof ExtendedSDKOptions]: (
        ctx: SDKContext,
        config: ExtendedSDKOptions[K]
    ) => Promise<ExtendedFullSDKInterface[K]>
} = {
    amulet: async (ctx: SDKContext, config: AmuletConfig) => {
        const auth = new AuthTokenProvider(config.auth, ctx.logger)
        const scanProxyClient = new ScanProxyClient(
            new ParsedURL(ctx, config.validatorUrl),
            ctx.logger,
            auth
        )
        const scanClient = new ScanClient(
            new ParsedURL(ctx, config.scanApiUrl),
            ctx.logger,
            auth
        )
        const validatorParty = await getValidatorParty(
            new ParsedURL(ctx, config.validatorUrl),
            ctx.logger,
            auth
        )

        const tokenStandardService = new TokenStandardService(
            ctx.ledgerProvider,
            ctx.logger,
            auth,
            false
        )

        const amuletService = new AmuletService(
            tokenStandardService,
            scanProxyClient,
            scanClient
        )

        return new AmuletNamespace({
            commonCtx: ctx,
            registry: new ParsedURL(ctx, config.registryUrl),
            amuletService,
            tokenStandardService,
            validatorParty,
        })
    },
    token: async (ctx: SDKContext, config: TokenConfig) => {
        const auth = new AuthTokenProvider(config.auth, ctx.logger)
        const tokenStandardService = new TokenStandardService(
            ctx.ledgerProvider,
            ctx.logger,
            auth,
            false
        )
        const validatorParty = await getValidatorParty(
            new ParsedURL(ctx, config.validatorUrl),
            ctx.logger,
            auth
        )

        return new TokenNamespace({
            tokenStandardService,
            registryUrls: config.registries.map(
                (input) => new ParsedURL(ctx, input)
            ),
            validatorParty,
            commonCtx: ctx,
        })
    },
    asset: async (ctx: SDKContext, config: AssetConfig) => {
        const auth = new AuthTokenProvider(config.auth, ctx.logger)
        const tokenStandardService = new TokenStandardService(
            ctx.ledgerProvider,
            ctx.logger,
            auth,
            false
        )

        return new AssetNamespace({
            tokenStandardService,
            registries: config.registries.map(
                (input) => new ParsedURL(ctx, input)
            ),
            error: ctx.error,
            list: parseAssets(
                ctx,
                await tokenStandardService.registriesToAssets(
                    config.registries.map((registry) => registry.toString())
                )
            ),
        })
    },
    events: async (ctx: SDKContext, config: EventsConfig) => {
        const auth = new AuthTokenProvider(config.auth, ctx.logger)
        return new EventsNamespace({
            commonCtx: ctx,
            auth,
            websocketURL: new ParsedURL(ctx, config.websocketURL),
        })
    },
}

export class InitializedSDK implements BasicSDKInterface {
    public readonly keys = new KeysNamespace()
    public readonly ledger: LedgerNamespace
    public readonly party: PartyNamespace
    public readonly user: UserNamespace
    public readonly utils: SDKUtilsNamespace

    constructor(protected ctx: SDKContext) {
        this.ledger = new LedgerNamespace(ctx)
        this.party = new PartyNamespace(ctx)
        this.user = new UserNamespace(ctx)
        this.utils = new SDKUtilsNamespace({
            logger: ctx.logger,
            error: ctx.error,
        })
    }

    public async extend<ExtendedItems extends keyof ExtendedSDKOptions>(
        config: Pick<ExtendedSDKOptions, ExtendedItems>
    ) {
        return await ExtendedInitializedSDK.create(this.ctx, config)
    }

    public registerPlugins<
        P extends Record<string, new (ctx: SDKContext) => SDKPlugin>,
    >(plugins: P): InitializedSDK & RegisteredPlugins<P> {
        const newSDK = new InitializedSDK(this.ctx)

        for (const name in plugins) {
            const plugin = new plugins[name](this.ctx)
            Object.defineProperty(newSDK, plugin.name, {
                value: plugin,
                writable: false,
                enumerable: true,
                configurable: false,
            })
        }

        return newSDK as InitializedSDK & RegisteredPlugins<P>
    }
}

export class OfflineInitializedSDK implements OfflineSDKInterface {
    public readonly utils: SDKUtilsNamespace
    public readonly keys = new KeysNamespace()
    constructor(protected ctx: OfflineSDKContext) {
        this.utils = new SDKUtilsNamespace(ctx)
    }
}

export class ExtendedInitializedSDK<
    ExtendedItems extends keyof ExtendedSDKOptions,
> extends InitializedSDK {
    // Declare the dynamically assigned properties
    // These are set via Object.assign in the constructor
    declare readonly amulet: ExtendedItems extends 'amulet'
        ? AmuletNamespace
        : never
    declare readonly token: ExtendedItems extends 'token'
        ? TokenNamespace
        : never
    declare readonly asset: ExtendedItems extends 'asset'
        ? AssetNamespace
        : never
    declare readonly events: ExtendedItems extends 'events'
        ? EventsNamespace
        : never

    private constructor(
        protected ctx: SDKContext,
        private extendedInterface: Pick<
            ExtendedFullSDKInterface,
            ExtendedItems
        >,
        private config: Pick<ExtendedSDKOptions, ExtendedItems>
    ) {
        super(ctx)
        Object.assign(this, extendedInterface)
    }

    static async create<ExtendedItems extends keyof ExtendedSDKOptions>(
        ctx: SDKContext,
        config: Pick<ExtendedSDKOptions, ExtendedItems>
    ): Promise<SDKInterface<ExtendedItems>> {
        const configuredItems = {} as Pick<
            ExtendedFullSDKInterface,
            ExtendedItems
        >

        for (const item in config) {
            configuredItems[item] = await createNamespace[item](
                ctx,
                config[item]
            )
        }

        const instance = new ExtendedInitializedSDK<ExtendedItems>(
            ctx,
            configuredItems,
            config
        )
        // Type assertion needed: TypeScript can't verify that Object.assign
        // properly adds all extended properties to match SDKInterface
        return instance as SDKInterface<ExtendedItems>
    }

    public override async extend<NewItems extends keyof ExtendedSDKOptions>(
        config: Pick<ExtendedSDKOptions, NewItems>
    ) {
        const mergedConfig = {
            ...this.config,
            ...config,
        } as Pick<ExtendedSDKOptions, ExtendedItems | NewItems>

        return await super.extend(mergedConfig)
    }
}

async function getValidatorParty(
    validatorUrl: URL,
    logger: SDKLogger,
    auth: AuthTokenProvider
) {
    const validator = new ValidatorInternalClient(validatorUrl, logger, auth)
    return (await validator.get('/v0/validator-user')).party_id
}
