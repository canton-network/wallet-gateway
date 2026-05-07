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
// Step 10: Bob allocates Token for leg-1 via the custom Token_Allocate choice
//          on app-synchronizer (TokenRules + Bob's input Token stay on app).
//          Then the resulting TokenAllocation is solo-reassigned app → global
//          (Bob is sole signatory) so OTCTrade_Settle can consume it.
const [legIdAlice, { legId: legIdBob, tokenAllocationContract }] =
    await Promise.all([
        allocateAmuletForAlice(setup, logger),
        allocateTokenForBob(setup, logger),
    ])
logger.info('Contracts after allocations:')
await logAllContracts(logger, synchronizers, allPartySpecs)

// ── Step 11a: Locate Bob's TestToken allocation ────────────────────────────────────
// (TokenAllocation is on global after step 10's reassignment; ACS read on P2.)
const allocationsBob = await tokenP2.allocation.pending(bob.partyId)
const testTokenAllocation = allocationsBob.find(
    (a) => a.interfaceViewValue.allocation.transferLegId === legIdBob
)
if (!testTokenAllocation) throw new Error('TestToken allocation not found')

// ── Step 11b: TradingApp settles the OTCTrade ─────────────────────────────────
await settleOtcTrade(
    setup,
    {
        otcTradeCid,
        legIdAlice,
        legIdBob,
        testTokenAllocationContract: tokenAllocationContract,
    },
    logger
)
logger.info('Contracts after settlement:')
await logAllContracts(logger, synchronizers, allPartySpecs)

// ── Step 12: (no-op) Bob's TestToken never moved ─────────────────────────────
// Step 10 ran on app-synchronizer, so TokenRules and Bob's senderChange Token
// both stayed on app the entire time. Nothing to bring back.
// await selfTransferToken(setup, { tokenRulesCid }, logger)

// ── Step 13: Alice self-transfers her TestToken to app-synchronizer ─────────
// Alice's Token (received from settlement) is on global. The Token_SelfTransfer
// choice operates only on Token, so no TokenRules contract is involved.
// P1 hosts Alice (signatory of her Token), so Canton auto-reassigns Alice's
// Token global → app as part of this command.
await aliceSelfTransferToApp(setup, logger)
logger.info('Final contract state:')
await logAllContracts(logger, synchronizers, allPartySpecs)
