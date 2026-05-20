import {
    FeaturedAppRight,
    localNetStaticConfig,
} from '@canton-network/wallet-sdk'
import { RewardsForDepositsTestScriptParameters } from './types.js'
import { partiesUtxos } from './utils.js'

export default async (
    args: Omit<
        RewardsForDepositsTestScriptParameters,
        'commandArgs' | 'amountToSend'
    > & {
        featuredAppRight: FeaturedAppRight
    }
) => {
    const {
        sdk,
        logger,
        sender,
        treasury,
        treasuryKeys,
        featuredAppRight,
        startingAmount,
    } = args

    const childLogger = logger.child({
        method: 'withdraw',
    })

    const createDelegateProxyCommandResult =
        await sdk.token.transfer.delegatedProxy.create(treasury.partyId)

    logger.info({ createDelegateProxyCommandResult })

    const [transferCommand, transferDisclosedContracts] =
        await sdk.token.transfer.create({
            sender: treasury.partyId,
            recipient: sender.partyId,
            amount: '100',
            instrumentId: 'Amulet',
            registryUrl: localNetStaticConfig.LOCALNET_REGISTRY_API_URL,
        })

    await sdk.ledger
        .prepare({
            partyId: treasury.partyId,
            commands: transferCommand,
            disclosedContracts: transferDisclosedContracts,
        })
        .sign(treasuryKeys.privateKey)
        .execute({
            partyId: treasury.partyId,
        })

    const activeContractsForDelegateTreasuryProxy =
        sdk.ledger.acsReader.readJsContracts({
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
        await sdk.token.transfer.pending(treasury.partyId)
    )[0].contractId

    const [
        withdrawTransferInstructionProxyCommand,
        withdrawTransferInstructionProxyDisclosedContracts,
    ] = await sdk.token.transfer.delegatedProxy.commands.withdraw({
        proxyCid,
        transferInstructionCid,
        featuredAppRight,
    })

    await sdk.ledger
        .prepare({
            partyId: treasury.partyId,
            commands: withdrawTransferInstructionProxyCommand,
            disclosedContracts:
                withdrawTransferInstructionProxyDisclosedContracts,
        })
        .sign(treasuryKeys.privateKey)
        .execute({
            partyId: treasury.partyId,
        })

    childLogger.info(
        'Successfully withdrawn transfer instruction through proxy'
    )

    const { senderUtxos, treasuryUtxos } = await partiesUtxos({
        token: sdk.token,
        sender,
        treasury,
    })

    childLogger.info({
        senderUtxos,
        treasuryUtxos,
    })

    // After withdraw, transfer instruction should be gone and UTXOs unchanged
    if (senderUtxos !== startingAmount || treasuryUtxos !== startingAmount)
        throw Error('Incorrect utxos values after withdraw')
}
