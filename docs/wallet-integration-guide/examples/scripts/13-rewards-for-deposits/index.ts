import pino from 'pino'
import { localNetStaticConfig, SDK } from '@canton-network/wallet-sdk'
import {
    TOKEN_NAMESPACE_CONFIG,
    TOKEN_PROVIDER_CONFIG_DEFAULT,
    AMULET_NAMESPACE_CONFIG,
} from '../utils/index.js'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs/promises'
import { RewardsForDepositsTestScriptParameters } from './types.js'
import _accept from './_accept.js'
import _withdraw from './_withdraw.js'
import _reject from './_reject.js'

const logger = pino({ name: 'v1-13-rewards-for-deposits', level: 'info' })

// This example script implements https://docs.digitalasset.com/integrate/devnet/exchange-integration/extensions.html#earning-app-rewards-for-deposits
// It requires the /dars/splice-util-featured-app-proxies-1.1.0.dar which is in files of localnet, but it's not uploaded to participant, so we need to do this in the script
// Adjust if to your .localnet location
const PATH_TO_LOCALNET = '../../../../../.localnet/'
const PATH_TO_DAR_IN_LOCALNET =
    '/dars/splice-util-featured-app-proxies-1.1.0.dar'
const SPLICE_UTIL_PROXY_PACKAGE_ID =
    '81dd5a9e5c02d0de03208522a895fb85eeb12fbea4aca7c4ad0ad106f3b0bfce'

const sdk = await SDK.create({
    auth: TOKEN_PROVIDER_CONFIG_DEFAULT,
    ledgerClientUrl: localNetStaticConfig.LOCALNET_APP_USER_LEDGER_URL,
    token: TOKEN_NAMESPACE_CONFIG,
    amulet: AMULET_NAMESPACE_CONFIG,
})

const aliceKeys = sdk.keys.generate()
const treasuryKeys = sdk.keys.generate()

const alice = await sdk.party.external
    .create(aliceKeys.publicKey, {
        partyHint: 'v1-13-alice',
    })
    .sign(aliceKeys.privateKey)
    .execute()

const treasury = await sdk.party.external
    .create(treasuryKeys.publicKey, {
        partyHint: 'v1-13-treasury',
    })
    .sign(treasuryKeys.privateKey)
    .execute()

const here = path.dirname(fileURLToPath(import.meta.url))

const spliceUtilFeaturedAppProxyDarPath = path.join(
    here,
    PATH_TO_LOCALNET,
    PATH_TO_DAR_IN_LOCALNET
)

const darBytes = await fs.readFile(spliceUtilFeaturedAppProxyDarPath)
await sdk.ledger.dar.upload(darBytes, SPLICE_UTIL_PROXY_PACKAGE_ID)

const transferPreApprovalProposal = await sdk.amulet.preapproval.command.create(
    {
        parties: {
            receiver: alice.partyId,
        },
    }
)

await sdk.ledger
    .prepare({
        partyId: alice.partyId,
        commands: transferPreApprovalProposal,
    })
    .sign(aliceKeys.privateKey)
    .execute({
        partyId: alice.partyId,
    })

const featuredAppRight = await sdk.amulet.featuredApp.grant()
logger.info(featuredAppRight, 'Featured app rights:')

if (!featuredAppRight) throw Error('featuredAppRightCid is undefined')

const startingAmount = 20_000_000

const [aliceTapCreateCommand, aliceTapCreateDisclosedContracts] =
    await sdk.amulet.tap(alice.partyId, startingAmount.toString())

await sdk.ledger
    .prepare({
        partyId: alice.partyId,
        commands: aliceTapCreateCommand,
        disclosedContracts: aliceTapCreateDisclosedContracts,
    })
    .sign(aliceKeys.privateKey)
    .execute({
        partyId: alice.partyId,
    })

const [treasuryTapCreateCommand, treasuryTapCreateDisclosedContracts] =
    await sdk.amulet.tap(treasury.partyId, startingAmount.toString())

await sdk.ledger
    .prepare({
        partyId: treasury.partyId,
        commands: treasuryTapCreateCommand,
        disclosedContracts: treasuryTapCreateDisclosedContracts,
    })
    .sign(treasuryKeys.privateKey)
    .execute({
        partyId: treasury.partyId,
    })

const setupIteration =
    async (): Promise<RewardsForDepositsTestScriptParameters> => {
        const createDelegateProxyCommandResult =
            await sdk.token.transfer.delegatedProxy.create(treasury.partyId)

        logger.info({ createDelegateProxyCommandResult })

        const amountToSend = 100

        const [transferCommand, transferDisclosedContracts] =
            await sdk.token.transfer.create({
                sender: alice.partyId,
                recipient: treasury.partyId,
                amount: amountToSend.toString(),
                instrumentId: 'Amulet',
                registryUrl: localNetStaticConfig.LOCALNET_REGISTRY_API_URL,
            })

        await sdk.ledger
            .prepare({
                partyId: alice.partyId,
                commands: transferCommand,
                disclosedContracts: transferDisclosedContracts,
            })
            .sign(aliceKeys.privateKey)
            .execute({
                partyId: alice.partyId,
            })

        const activeContractsForDelegateTreasuryProxy = sdk.ledger.acs.read({
            parties: [treasury.partyId],
            templateIds: [
                '#splice-util-featured-app-proxies:Splice.Util.FeaturedApp.DelegateProxy:DelegateProxy',
            ],
            filterByParty: true,
        })

        const proxyCid = await activeContractsForDelegateTreasuryProxy.then(
            (list) => list[0].contractId
        )

        const transferInstructionCid = (
            await sdk.token.transfer.pending(alice.partyId)
        )[0].contractId

        logger.info({ proxyCid, transferInstructionCid })

        return {
            sdk,
            logger,
            sender: alice,
            treasury,
            senderKeys: aliceKeys,
            treasuryKeys: treasuryKeys,
            commandArgs: {
                proxyCid,
                transferInstructionCid,
                featuredAppRight,
            },
            startingAmount,
            amountToSend,
        }
    }

await _withdraw({
    sdk,
    logger,
    sender: alice,
    treasury,
    senderKeys: aliceKeys,
    treasuryKeys: treasuryKeys,
    featuredAppRight,
    startingAmount,
})

for (const callback of [_reject, _accept]) {
    await callback(await setupIteration())
}
