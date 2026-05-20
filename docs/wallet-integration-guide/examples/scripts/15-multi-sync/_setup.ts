// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'
import type { Logger } from 'pino'
import {
    localNetStaticConfig,
    SDK,
    type SDKInterface,
    type SDKContext,
    type TokenNamespace,
} from '@canton-network/wallet-sdk'
import type { KeyPair } from '@canton-network/core-signing-lib'
import type { GenerateTransactionResponse } from '@canton-network/core-ledger-client'
import { ScanProxyClient } from '@canton-network/wallet-sdk'
import { AuthTokenProvider } from '@canton-network/core-wallet-auth'
import {
    TOKEN_NAMESPACE_CONFIG,
    TOKEN_PROVIDER_CONFIG_DEFAULT,
    vetDar,
} from '../utils/index.js'
import type { SynchronizerMap } from '../utils/index.js'
import {
    LOCALNET_BOB_LEDGER_URL,
    LOCALNET_TRADING_APP_LEDGER_URL,
    LOCALNET_TEST_TOKEN_REGISTRY_URL,
    PARTY_HINT_ALICE,
    PARTY_HINT_BOB,
    PARTY_HINT_TRADING_APP,
    PARTY_HINT_TOKEN_ADMIN,
} from './_config.js'

const DARS_PATH = '../../../../../.localnet/dars'
const TRADING_APP_DAR = 'splice-token-test-trading-app-1.0.0.dar'
const TEST_TOKEN_V1_DAR = 'splice-test-token-v1-1.0.0.dar'

export type PartyInfo = Omit<
    GenerateTransactionResponse,
    'topologyTransactions'
> & {
    topologyTransactions?: string[] | undefined
    keyPair: KeyPair
}

export interface MultiSyncSetup {
    p1Sdk: SDKInterface<'token'>
    p2Sdk: SDKInterface<'token'>
    p3Sdk: SDKInterface<'token'>
    p1SdkCtx: SDKContext
    p2SdkCtx: SDKContext
    p3SdkCtx: SDKContext
    tokenNamespaceP1: TokenNamespace
    tokenNamespaceP2: TokenNamespace
    alice: PartyInfo
    bob: PartyInfo
    tradingApp: PartyInfo
    tokenAdmin: PartyInfo
    globalSynchronizerId: string
    appSynchronizerId: string
    synchronizers: SynchronizerMap
    scanProxy: ScanProxyClient
    amuletAdmin: string
}

/**
 * Bootstraps a fresh multi-synchronizer environment:
 *   - Creates SDK instances for P1 (app-user), P2 (app-provider), P3 (sv)
 *   - Discovers global + app synchronizer IDs from P1
 *   - Allocates alice (P1), bob (P2), tradingApp + tokenAdmin (P3) on global synchronizer
 *   - Registers alice (P1) and bob (P2) on app-synchronizer
 *   - Registers tokenAdmin (P3) on app-synchronizer (secondary — needed so tokenAdmin
 *     is a valid informee for app-sync transactions; P3 is connected to both synchronizers)
 *   - Connects the scan proxy and returns the Amulet admin party ID
 */
export async function setupMultiSyncTrade(
    logger: Logger
): Promise<MultiSyncSetup> {
    const testTokenTokenConfig = {
        ...TOKEN_NAMESPACE_CONFIG,
        registries: [
            ...(TOKEN_NAMESPACE_CONFIG.registries as URL[]),
            LOCALNET_TEST_TOKEN_REGISTRY_URL,
        ],
    }
    const [p1Sdk, p2Sdk, p3Sdk] = await Promise.all([
        SDK.create({
            auth: TOKEN_PROVIDER_CONFIG_DEFAULT,
            ledgerClientUrl: localNetStaticConfig.LOCALNET_APP_USER_LEDGER_URL,
            token: testTokenTokenConfig,
        }),
        SDK.create({
            auth: TOKEN_PROVIDER_CONFIG_DEFAULT,
            ledgerClientUrl: LOCALNET_BOB_LEDGER_URL,
            token: testTokenTokenConfig,
        }),
        SDK.create({
            auth: TOKEN_PROVIDER_CONFIG_DEFAULT,
            ledgerClientUrl: LOCALNET_TRADING_APP_LEDGER_URL,
            token: testTokenTokenConfig,
        }),
    ])

    const p1SdkCtx = (p1Sdk.ledger as unknown as { sdkContext: SDKContext })
        .sdkContext
    const p2SdkCtx = (p2Sdk.ledger as unknown as { sdkContext: SDKContext })
        .sdkContext
    const p3SdkCtx = (p3Sdk.ledger as unknown as { sdkContext: SDKContext })
        .sdkContext

    // Discover synchronizer IDs from P1 (they are topology-wide, not per-participant)
    const connectedSyncResponse =
        await p1Sdk.ledger.state.connectedSynchronizers({})
    const allSynchronizers = connectedSyncResponse.connectedSynchronizers ?? []
    if (allSynchronizers.length < 2)
        throw new Error(
            `Expected at least 2 connected synchronizers (global + app), found ${allSynchronizers.length}`
        )

    const globalSynchronizerId = allSynchronizers.find(
        (s) => s.synchronizerAlias === 'global'
    )?.synchronizerId
    const appSynchronizerId = allSynchronizers.find(
        (s) => s.synchronizerAlias === 'app-synchronizer'
    )?.synchronizerId

    if (!globalSynchronizerId) throw new Error('Global synchronizer not found')
    if (!appSynchronizerId)
        throw new Error(
            'App synchronizer not found — start localnet with --multi-sync to enable it.'
        )

    logger.info(
        `Connected synchronizers: ${allSynchronizers.map((s) => s.synchronizerAlias).join(', ')}`
    )
    logger.info(
        `Synchronizer IDs — global: ${globalSynchronizerId}, app: ${appSynchronizerId}`
    )

    const synchronizers: SynchronizerMap = {
        globalSynchronizerId,
        appSynchronizerId,
    }

    const here = path.dirname(fileURLToPath(import.meta.url))
    const darsDir = path.join(here, DARS_PATH)
    for (const [darPath, darName] of [
        [path.join(darsDir, TRADING_APP_DAR), TRADING_APP_DAR],
        [path.join(darsDir, TEST_TOKEN_V1_DAR), TEST_TOKEN_V1_DAR],
    ] as [string, string][]) {
        try {
            await fs.stat(darPath)
        } catch {
            throw new Error(
                `Required DAR not found: ${darPath}\n` +
                    `  "${darName}" must be present in .localnet/dars/.`
            )
        }
    }

    const [tradingAppDar, testTokenV1Dar] = await Promise.all([
        fs.readFile(path.join(darsDir, TRADING_APP_DAR)),
        fs.readFile(path.join(darsDir, TEST_TOKEN_V1_DAR)),
    ])

    await Promise.all(
        [p1SdkCtx, p2SdkCtx, p3SdkCtx].flatMap((ctx) =>
            [globalSynchronizerId, appSynchronizerId].flatMap((sid) =>
                [tradingAppDar, testTokenV1Dar].map((dar) =>
                    vetDar(ctx.ledgerProvider, dar, sid)
                )
            )
        )
    )
    logger.info('DARs vetted: P1+P2+P3 on both synchronizers')

    // Allocate parties on global synchronizer: alice on P1, bob on P2, tradingApp + tokenAdmin on P3.
    // tokenAdmin is primary on P3/global; a secondary registration on P3/app-sync follows below,
    // because participant connectivity ≠ party registration — tokenAdmin must be explicitly
    // registered on app-sync to be a valid informee for transactions targeting that synchronizer.
    const aliceKey = p1Sdk.keys.generate()
    const bobKey = p1Sdk.keys.generate()
    const tradingAppKey = p1Sdk.keys.generate()
    const tokenAdminKey = p3Sdk.keys.generate()

    const [
        allocatedAlice,
        allocatedBob,
        allocatedTradingApp,
        allocatedTokenAdmin,
    ] = await Promise.all([
        p1Sdk.party.external
            .create(aliceKey.publicKey, {
                partyHint: PARTY_HINT_ALICE,
                synchronizerId: globalSynchronizerId,
            })
            .sign(aliceKey.privateKey)
            .execute(),
        p2Sdk.party.external
            .create(bobKey.publicKey, {
                partyHint: PARTY_HINT_BOB,
                synchronizerId: globalSynchronizerId,
            })
            .sign(bobKey.privateKey)
            .execute(),
        p3Sdk.party.external
            .create(tradingAppKey.publicKey, {
                partyHint: PARTY_HINT_TRADING_APP,
                synchronizerId: globalSynchronizerId,
            })
            .sign(tradingAppKey.privateKey)
            .execute(),
        p3Sdk.party.external
            .create(tokenAdminKey.publicKey, {
                partyHint: PARTY_HINT_TOKEN_ADMIN,
                synchronizerId: globalSynchronizerId,
            })
            .sign(tokenAdminKey.privateKey)
            .execute(),
    ])

    const alice: PartyInfo = { ...allocatedAlice, keyPair: aliceKey }
    const bob: PartyInfo = { ...allocatedBob, keyPair: bobKey }
    const tradingApp: PartyInfo = {
        ...allocatedTradingApp,
        keyPair: tradingAppKey,
    }
    const tokenAdmin: PartyInfo = {
        ...allocatedTokenAdmin,
        keyPair: tokenAdminKey,
    }

    logger.info(
        `Parties allocated — alice: ${alice.partyId} (P1), bob: ${bob.partyId} (P2), tradingApp: ${tradingApp.partyId} (P3), tokenAdmin: ${tokenAdmin.partyId} (P3)`
    )

    // Register alice (P1) and bob (P2) on app-synchronizer, and tokenAdmin on P3/app-sync.
    // Participant connectivity ≠ party registration: even though P3 (sv) is connected to
    // app-synchronizer, tokenAdmin must be explicitly registered there for it to be a valid
    // informee in transactions targeting app-sync (TokenRules creation, mint, transfer).
    //
    // alice + bob can be registered in parallel (different participants).
    // tokenAdmin's P3 registrations must be sequential: the primary on global runs first
    // (in the Promise.all above), then the secondary on app-sync here — Canton rejects
    // concurrent allocations of the same party on the same participant.
    await Promise.all([
        p1Sdk.party.external
            .create(alice.keyPair.publicKey, {
                partyHint: alice.partyId.split('::')[0],
                synchronizerId: appSynchronizerId,
            })
            .sign(alice.keyPair.privateKey)
            .execute({ grantUserRights: false }),
        p2Sdk.party.external
            .create(bob.keyPair.publicKey, {
                partyHint: bob.partyId.split('::')[0],
                synchronizerId: appSynchronizerId,
            })
            .sign(bob.keyPair.privateKey)
            .execute({ grantUserRights: false }),
        // tokenAdmin secondary on P3 for app-sync.
        // grantUserRights: false — actAs rights already granted by the P3 primary on global.
        // Required so tokenAdmin is a valid informee for app-sync transactions, and so P3
        // qualifies as a reassigning participant (hosts tokenAdmin on both syncs) for the
        // Bob Token reassignment (app-sync → global) before the DvP allocation.
        p3Sdk.party.external
            .create(tokenAdmin.keyPair.publicKey, {
                partyHint: tokenAdmin.partyId.split('::')[0],
                synchronizerId: appSynchronizerId,
            })
            .sign(tokenAdmin.keyPair.privateKey)
            .execute({ grantUserRights: false }),
    ])
    logger.info('Alice, Bob, and TokenAdmin registered on app-synchronizer')

    const auth = new AuthTokenProvider(TOKEN_PROVIDER_CONFIG_DEFAULT, logger)
    const scanProxy = new ScanProxyClient(
        localNetStaticConfig.LOCALNET_APP_VALIDATOR_URL,
        logger,
        auth
    )
    const amuletRules = await scanProxy.getAmuletRules()
    const amuletAdmin = (amuletRules.payload as Record<string, unknown>)[
        'dso'
    ] as string
    logger.info(`Amulet asset discovered — admin: ${amuletAdmin}`)

    return {
        p1Sdk,
        p2Sdk,
        p3Sdk,
        p1SdkCtx,
        p2SdkCtx,
        p3SdkCtx,
        tokenNamespaceP1: p1Sdk.token,
        tokenNamespaceP2: p2Sdk.token,
        alice,
        bob,
        tradingApp,
        tokenAdmin,
        globalSynchronizerId,
        appSynchronizerId,
        synchronizers,
        scanProxy,
        amuletAdmin,
    }
}
