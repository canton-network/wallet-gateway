// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

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
import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'
import {
    TOKEN_NAMESPACE_CONFIG,
    TOKEN_PROVIDER_CONFIG_DEFAULT,
    resolvePreferredSynchronizerId,
    createScanProxyClient,
    vetDar,
} from '../utils/index.js'
import type { SynchronizerMap } from '../utils/index.js'
import {
    LOCALNET_BOB_LEDGER_URL,
    LOCALNET_TRADING_APP_LEDGER_URL,
} from './_config.js'

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
    tokenP1: TokenNamespace
    tokenP2: TokenNamespace
    alice: PartyInfo
    bob: PartyInfo
    tradingApp: PartyInfo
    globalSynchronizerId: string
    appSynchronizerId: string
    synchronizers: SynchronizerMap
    scanProxy: Awaited<ReturnType<typeof createScanProxyClient>>
    amuletAdmin: string
}

/**
 * Bootstraps a fresh multi-synchronizer environment:
 *   - Creates SDK instances for P1 (app-user), P2 (app-provider), P3 (sv)
 *   - Discovers global + app synchronizer IDs from P1
 *   - Allocates alice (P1), bob (P2), tradingApp (P3) on global synchronizer
 *   - Registers alice and bob on app-synchronizer; tradingApp is global-only
 *   - Connects the scan proxy and returns the Amulet admin party ID
 */
export async function setupMultiSyncTrade(
    logger: Logger
): Promise<MultiSyncSetup> {
    // Create three SDK instances — one per participant node
    const [p1Sdk, p2Sdk, p3Sdk] = await Promise.all([
        SDK.create({
            auth: TOKEN_PROVIDER_CONFIG_DEFAULT,
            ledgerClientUrl: localNetStaticConfig.LOCALNET_APP_USER_LEDGER_URL,
            token: TOKEN_NAMESPACE_CONFIG,
        }),
        SDK.create({
            auth: TOKEN_PROVIDER_CONFIG_DEFAULT,
            ledgerClientUrl: LOCALNET_BOB_LEDGER_URL,
            token: TOKEN_NAMESPACE_CONFIG,
        }),
        SDK.create({
            auth: TOKEN_PROVIDER_CONFIG_DEFAULT,
            ledgerClientUrl: LOCALNET_TRADING_APP_LEDGER_URL,
            token: TOKEN_NAMESPACE_CONFIG,
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

    const globalSynchronizerId =
        resolvePreferredSynchronizerId(allSynchronizers)
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

    // The standard splice-test-token-v1 and trading-app DARs are pre-installed
    // and pre-vetted on the localnet (splice ≥ 0.6.1). We additionally upload
    // and vet our custom `splice-test-token-self-transfer-v1` DAR which adds a
    // `Token_SelfTransfer` choice on `Token` so post-settlement self-transfers
    // do not require the `TokenRules` factory contract — letting `TokenRules`
    // stay on the app-synchronizer permanently.
    const here = path.dirname(fileURLToPath(import.meta.url))
    const SELF_TRANSFER_DAR = path.join(
        here,
        'daml',
        'splice-test-token-self-transfer-v1',
        'splice-test-token-self-transfer-v1-1.0.1.dar'
    )
    const selfTransferDar = await fs.readFile(SELF_TRANSFER_DAR)
    await Promise.all([
        ...[p1SdkCtx, p2SdkCtx].flatMap((ctx) =>
            [globalSynchronizerId, appSynchronizerId].map((sid) =>
                vetDar(ctx.ledgerProvider, selfTransferDar, sid)
            )
        ),
        vetDar(p3SdkCtx.ledgerProvider, selfTransferDar, globalSynchronizerId),
    ])
    logger.info(
        'Custom self-transfer DAR vetted: P1+P2 on both synchronizers, P3 on global only'
    )

    // Allocate parties: alice on P1, bob on P2, tradingApp on P3 (all on global synchronizer)
    const aliceKey = p1Sdk.keys.generate()
    const bobKey = p1Sdk.keys.generate()
    const tradingAppKey = p1Sdk.keys.generate()

    const [allocatedAlice, allocatedBob, allocatedTradingApp] =
        await Promise.all([
            p1Sdk.party.external
                .create(aliceKey.publicKey, {
                    partyHint: 'v1-15-alice',
                    synchronizerId: globalSynchronizerId,
                })
                .sign(aliceKey.privateKey)
                .execute(),
            p2Sdk.party.external
                .create(bobKey.publicKey, {
                    partyHint: 'v1-15-bob',
                    synchronizerId: globalSynchronizerId,
                })
                .sign(bobKey.privateKey)
                .execute(),
            p3Sdk.party.external
                .create(tradingAppKey.publicKey, {
                    partyHint: 'v1-15-trading-app',
                    synchronizerId: globalSynchronizerId,
                })
                .sign(tradingAppKey.privateKey)
                .execute(),
        ])

    const alice: PartyInfo = { ...allocatedAlice, keyPair: aliceKey }
    const bob: PartyInfo = { ...allocatedBob, keyPair: bobKey }
    const tradingApp: PartyInfo = {
        ...allocatedTradingApp,
        keyPair: tradingAppKey,
    }

    logger.info(
        `Parties allocated — alice: ${alice.partyId} (P1), bob: ${bob.partyId} (P2), tradingApp: ${tradingApp.partyId} (P3)`
    )

    // Register Alice and Bob on app-synchronizer so they can transact there.
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
    ])
    logger.info('Alice and Bob registered on app-synchronizer')

    // Connect scan proxy and discover Amulet admin
    const scanProxy = await createScanProxyClient(
        localNetStaticConfig.LOCALNET_REGISTRY_API_URL,
        TOKEN_PROVIDER_CONFIG_DEFAULT,
        logger
    )
    const { amuletAdmin } = await scanProxy.fetchAmuletInfo()
    logger.info(`Amulet asset discovered — admin: ${amuletAdmin}`)

    return {
        p1Sdk,
        p2Sdk,
        p3Sdk,
        p1SdkCtx,
        p2SdkCtx,
        p3SdkCtx,
        tokenP1: p1Sdk.token,
        tokenP2: p2Sdk.token,
        alice,
        bob,
        tradingApp,
        globalSynchronizerId,
        appSynchronizerId,
        synchronizers,
        scanProxy,
        amuletAdmin,
    }
}
