import pino from 'pino'
import { logAllContracts } from '../utils/index.js'
import { setupMultiSyncTrade } from './_setup.js'
import {
    TRADE_AMULET_AMOUNT,
    TRADE_TOKEN_AMOUNT,
    mintAmuletForAlice,
    createTokenRulesAndMintForBob,
    createAndInitiateOtcTrade,
    allocateAmuletForAlice,
    allocateTokenForBob,
    settleOtcTrade,
    selfTransferToken,
    aliceSelfTransferToApp,
    buildAllPartySpecs,
} from './_trade_ops.js'

// Multi-Synchronizer DvP: Alice pays 100 Amulet on global; Bob delivers 20 TestToken from app-sync.
// P1 = app-user (Alice), P2 = app-provider (Bob), P3 = sv (TradingApp).
// See index.md for the full flow description.

const logger = pino({ name: 'v1-15-multi-sync-trade', level: 'info' })

// ── Setup: create SDKs, discover synchronizers, vet DARs, allocate parties ───
// Step 1: Create SDKs for all 3 participants (P1, P2, P3) and discover global + app synchronizers
// Step 2: Vet DARs on all synchronizers (global + app) and all participants (P1, P2, P3)
// Step 3: Allocate parties for Alice (P1), Bob (P2), and TradingApp (P3)
// Step 4: Discover Token interface on app synchronizer for Bob's token (used in Steps 6b and 10)
const setup = await setupMultiSyncTrade(logger)
const { tokenP2, alice, bob, synchronizers, amuletAdmin } = setup

const allPartySpecs = buildAllPartySpecs(setup)

// ── Steps 5–6: Init holdings ────────────────────────────────────────────────
// Step 5:  Mint Amulet for Alice (global synchronizer)
// Steps 6a+6b: TokenRules + Token for Bob (app-synchronizer)
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
        instrumentId: { admin: bob.partyId, id: 'TestToken' },
        meta: { values: {} },
    },
}

// ── Steps 7a–7c + 8: Propose → Accept → Initiate settlement → Read OTCTrade ─
const otcTradeCid = await createAndInitiateOtcTrade(setup, transferLegs, logger)
logger.info('Contracts after trade initiation:')
await logAllContracts(logger, synchronizers, allPartySpecs)

// ── Steps 9–10: Allocate in parallel ────────────────────────────────────────
// Step 9:  Alice allocates Amulet for leg-0 (global synchronizer)
// Step 10: Bob allocates Token for leg-1 (global — Canton auto-reassigns from app-synchronizer)
const [legIdAlice, { legId: legIdBob, tokenRulesCid }] = await Promise.all([
    allocateAmuletForAlice(setup, logger),
    allocateTokenForBob(setup, logger),
])
logger.info('Contracts after allocations:')
await logAllContracts(logger, synchronizers, allPartySpecs)

// ── Step 11a: Locate Bob's TestToken allocation ────────────────────────────────────
const allocationsBob = await tokenP2.allocation.pending(bob.partyId)
const testTokenAllocation = allocationsBob.find(
    (a) => a.interfaceViewValue.allocation.transferLegId === legIdBob
)
if (!testTokenAllocation) throw new Error('TestToken allocation not found')
const testTokenAllocationCid = testTokenAllocation.contractId

// ── Step 11b: TradingApp settles the OTCTrade ─────────────────────────────────
await settleOtcTrade(
    setup,
    { otcTradeCid, legIdAlice, legIdBob, testTokenAllocationCid },
    logger
)
logger.info('Contracts after settlement:')
await logAllContracts(logger, synchronizers, allPartySpecs)

// ── Step 12: Bob self-transfers remaining TestToken on app-synchronizer ──────
// After settlement, Bob's senderChange Token (480) and TokenRules both live on
// global. Bob is signatory of both contracts and is hosted on P2, so when P2
// submits this self-transfer targeting app-synchronizer, Canton automatically
// reassigns BOTH contracts global → app — demonstrating a second auto-reassign
// (the inverse direction of step 10) with no manual reassignment.
await selfTransferToken(setup, { tokenRulesCid }, logger)
logger.info(
    'Contracts after Bob self-transfer (TokenRules + Bob Token on app):'
)
await logAllContracts(logger, synchronizers, allPartySpecs)

// ── Step 13: Alice self-transfers her TestToken back to app-synchronizer ─────
// TokenRules now lives on app-synchronizer (after step 12). Alice's Token is
// still on global. P1 hosts Alice (signatory of her Token), so Canton auto-
// reassigns Alice's Token global → app as part of this command. TokenRules is
// disclosed because P1 doesn't host Bob.
await aliceSelfTransferToApp(setup, logger)
logger.info('Final contract state:')
await logAllContracts(logger, synchronizers, allPartySpecs)
