import pino from 'pino'
import { logAllContracts } from '../utils/index.js'
import { setupMultiSyncTrade } from './_setup.js'
import { startRegistry } from './_registry/index.js'
import { LOCALNET_TRADING_APP_LEDGER_URL } from './_config.js'
import {
    TRADE_AMULET_AMOUNT,
    TRADE_TOKEN_AMOUNT,
    mintAmuletForAlice,
    createTokenRulesAndMintForBob,
    createAndInitiateOtcTrade,
    allocateAmuletForAlice,
    allocateTokenForBob,
    settleOtcTrade,
    aliceSelfTransferToApp,
    bobSelfTransferToApp,
    buildContractReadSpec,
} from './_trade_ops.js'

// Multi-Synchronizer DvP: Alice pays 100 Amulet on global; Bob delivers 20 TestToken from app-sync.
// P1 = app-user (Alice), P2 = app-provider (Bob), P3 = sv (TradingApp).
// See README.md for the full flow description.

const logger = pino({ name: 'v1-15-multi-sync-trade', level: 'info' })

// ── Setup: create SDKs, discover synchronizers, vet DARs, allocate parties ───
// Step 1: Create SDKs for all 3 participants (P1, P2, P3) and discover global + app synchronizers
// Step 2: Vet DARs on all synchronizers (global + app) and all participants (P1, P2, P3)
// Step 3: Allocate parties for Alice (P1), Bob (P2), TradingApp (P3), and TokenAdmin (P3)
const setup = await setupMultiSyncTrade(logger)
const {
    tokenNamespaceP2,
    alice,
    bob,
    tokenAdmin,
    synchronizers,
    amuletAdmin,
    globalSynchronizerId,
    appSynchronizerId,
} = setup

// Start the Token Standard registry server now that tokenAdmin party ID is known.
// The server must be up before wallet-SDK calls for allocation and transfer factory.
const REGISTRY_PORT = parseInt(process.env['REGISTRY_PORT'] ?? '5975', 10)
const registry = await startRegistry({
    tokenAdminPartyId: tokenAdmin.partyId,
    port: REGISTRY_PORT,
    ledgerUrl: LOCALNET_TRADING_APP_LEDGER_URL,
    globalSynchronizerId,
    appSynchronizerId,
    logger,
    submitAsTokenAdmin: ({ commands, synchronizerId }) =>
        setup.p3Sdk.ledger
            .prepare({
                partyId: tokenAdmin.partyId,
                commands,
                disclosedContracts: [],
                synchronizerId,
            })
            .sign(tokenAdmin.keyPair.privateKey)
            .execute({ partyId: tokenAdmin.partyId }),
})

const allPartySpecs = buildContractReadSpec(setup)

// ── Steps 4–5: Init holdings ────────────────────────────────────────────────
// Step 4:  Mint Amulet for Alice (global synchronizer)
// Steps 5a–5e: TokenAdmin creates TokenRules on global + app, self-mints Token,
//             offers to Bob via TransferFactory_Transfer; Bob accepts via
//             TransferInstruction_Accept — all single-party submissions
await Promise.all([
    mintAmuletForAlice(setup, logger),
    createTokenRulesAndMintForBob(setup, logger),
])

logger.info('Contracts after setup:')
await logAllContracts(logger, synchronizers, allPartySpecs)

// ── OTC trade terms ───────────────────────────────────────────────────────────
const transferLegs = {
    'leg-0': {
        sender: alice.partyId,
        receiver: bob.partyId,
        amount: TRADE_AMULET_AMOUNT,
        instrumentId: { admin: amuletAdmin, id: 'Amulet' },
        meta: { values: {} },
    },
    'leg-1': {
        sender: bob.partyId,
        receiver: alice.partyId,
        amount: TRADE_TOKEN_AMOUNT,
        instrumentId: { admin: tokenAdmin.partyId, id: 'TestToken' },
        meta: { values: {} },
    },
}

// ── Steps 6a–6c + 7: Propose → Accept → Initiate settlement → Read OTCTrade ─
const otcTradeCid = await createAndInitiateOtcTrade(setup, transferLegs, logger)
logger.info('Contracts after trade initiation:')
await logAllContracts(logger, synchronizers, allPartySpecs)

// ── Steps 8–9: Allocate in parallel ────────────────────────────────────────
// Step 8:  Alice allocates Amulet for leg-0 (global synchronizer)
// Step 9: Bob allocates TestToken for leg-1 (global synchronizer)
const [legIdAlice, { legId: legIdBob }] = await Promise.all([
    allocateAmuletForAlice(setup, logger),
    allocateTokenForBob(setup, logger),
])
logger.info('Contracts after allocations:')
await logAllContracts(logger, synchronizers, allPartySpecs)

// ── Step 10a: Locate Bob's TestToken allocation ────────────────────────────────────
const allocationsBob = await tokenNamespaceP2.allocation.pending(bob.partyId)
const testTokenAllocation = allocationsBob.find(
    (a) => a.interfaceViewValue.allocation.transferLegId === legIdBob
)
if (!testTokenAllocation) throw new Error('TestToken allocation not found')
const testTokenAllocationCid = testTokenAllocation.contractId

// ── Step 10b: TradingApp settles the OTCTrade ─────────────────────────────────
await settleOtcTrade(
    setup,
    { otcTradeCid, legIdAlice, legIdBob, testTokenAllocationCid },
    logger
)
logger.info('Contracts after settlement:')
await logAllContracts(logger, synchronizers, allPartySpecs)

// ── Step 11: Self-transfer TestTokens back to app-synchronizer ─────────────────
await Promise.all([
    aliceSelfTransferToApp(setup, logger),
    bobSelfTransferToApp(setup, logger),
])
logger.info('Final contract state:')
await logAllContracts(logger, synchronizers, allPartySpecs)

await registry.stop()
logger.info('Token Standard registry server stopped')
