import pino from 'pino'
import { localNetStaticConfig, SDK } from '@canton-network/wallet-sdk'
import path from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import {
    TOKEN_NAMESPACE_CONFIG,
    TOKEN_PROVIDER_CONFIG_DEFAULT,
    AMULET_NAMESPACE_CONFIG,
} from './utils/index.js'

const logger = pino({ name: 'v1-08-merge-delegation', level: 'info' })

const PATH_TO_LOCALNET = '../../../../.localnet'
const PATH_TO_DAR_IN_LOCALNET =
    '/dars/splice-util-token-standard-wallet-1.0.0.dar'
const SPLICE_UTIL_TOKEN_STANDARD_WALLET_PACKAGE_ID =
    '1da198cb7968fa478cfa12aba9fdf128a63a8af6ab284ea6be238cf92a3733ac'

const here = path.dirname(fileURLToPath(import.meta.url))

const spliceUtilTokenStandardWalletDarPath = path.join(
    here,
    PATH_TO_LOCALNET,
    PATH_TO_DAR_IN_LOCALNET
)
if (!existsSync(spliceUtilTokenStandardWalletDarPath)) {
    throw Error(`DAR NOT FOUND AT ${spliceUtilTokenStandardWalletDarPath}.`)
}

const sdk = await SDK.create({
    auth: TOKEN_PROVIDER_CONFIG_DEFAULT,
    ledgerClientUrl: localNetStaticConfig.LOCALNET_APP_USER_LEDGER_URL,
    token: TOKEN_NAMESPACE_CONFIG,
    amulet: AMULET_NAMESPACE_CONFIG,
})

const darBytes = await readFile(spliceUtilTokenStandardWalletDarPath)
await sdk.ledger.dar.upload(
    darBytes,
    SPLICE_UTIL_TOKEN_STANDARD_WALLET_PACKAGE_ID
)

logger.info(`DAR ${PATH_TO_DAR_IN_LOCALNET} successfully uploaded`)

const aliceKeys = sdk.keys.generate()

const alice = await sdk.party.external
    .create(aliceKeys.publicKey, {
        partyHint: 'v1-08-alice',
    })
    .sign(aliceKeys.privateKey)
    .execute()

const tapPromises = Array.from({ length: 15 }).map(async () => {
    const [amuletTapCommand, amuletTapDisclosedContracts] =
        await sdk.amulet.tap(alice.partyId, '20')

    return sdk.ledger
        .prepare({
            partyId: alice.partyId,
            commands: amuletTapCommand,
            disclosedContracts: amuletTapDisclosedContracts,
        })
        .sign(aliceKeys.privateKey)
        .execute({ partyId: alice.partyId })
})
await Promise.all(tapPromises)

logger.info('All taps successfully parsed')

const batchMergingUtility = await sdk.token.utxos.delegatedMerge.setup()

logger.info({ batchMergingUtility })

const mergeDelegationProposalCommand =
    sdk.token.utxos.delegatedMerge.command.propose({
        owner: alice.partyId,
    })

const mergeDelegationProposalResult = await sdk.ledger
    .prepare({
        partyId: alice.partyId,
        commands: mergeDelegationProposalCommand,
    })
    .sign(aliceKeys.privateKey)
    .execute({
        partyId: alice.partyId,
    })

logger.info(
    mergeDelegationProposalResult,
    'Successfully executed mergeDelegationProposalCommand'
)

const approveMergeDelegationProposalResult =
    await sdk.token.utxos.delegatedMerge.approve({
        owner: alice.partyId,
    })

logger.info(
    approveMergeDelegationProposalResult,
    'Successfully executed approveDelegationProposalCommand'
)

const mergeDelegationResult = await sdk.token.utxos.delegatedMerge.execute({
    party: alice.partyId,
})

logger.info(
    mergeDelegationResult,
    'Successfully executed useMergeDelegationsCommand'
)

const utxosAlice = await sdk.token.utxos.list({
    partyId: alice.partyId,
})

const result = {
    length: utxosAlice.length,
    amount: utxosAlice.reduce(
        (acc, utxo) => acc + +utxo.interfaceViewValue.amount,
        0
    ),
}

logger.info({ result }, 'Result from the script')

if (result.length !== 1 || result.amount !== 300)
    throw Error('Either length != 1 or amount != 300')
