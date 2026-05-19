import { localNetStaticConfig } from '@canton-network/wallet-sdk'
import { TransferTestScriptParameters } from './types.js'

export default async (args: TransferTestScriptParameters) => {
    const { sdk, receiver, sender, senderKeys, logger } = args

    const [transferCommand, transferDisclosedContracts] =
        await sdk.token.transfer.create({
            sender: sender.partyId,
            recipient: receiver.partyId,
            instrumentId: 'Amulet',
            registryUrl: localNetStaticConfig.LOCALNET_REGISTRY_API_URL,
            amount: '2000',
        })

    logger.info('Transfer command created, ready for signing and execution')

    await sdk.ledger
        .prepare({
            partyId: sender.partyId,
            commands: transferCommand,
            disclosedContracts: transferDisclosedContracts,
        })
        .sign(senderKeys.privateKey)
        .execute({ partyId: sender.partyId })

    logger.info(
        { sender, receiver },
        'Submitted transfer command from Sender to Receiver'
    )

    const pendingTransfer = await sdk.token.transfer.pending(receiver.partyId)

    if (!pendingTransfer.length) throw Error('pendingTransfer is empty')

    const [withdrawCommand, withdrawDisclosedContracts] =
        await sdk.token.transfer.withdraw({
            transferInstructionCid: pendingTransfer[0].contractId,
            registryUrl: localNetStaticConfig.LOCALNET_REGISTRY_API_URL,
        })

    await sdk.ledger
        .prepare({
            partyId: sender.partyId,
            commands: withdrawCommand,
            disclosedContracts: withdrawDisclosedContracts,
        })
        .sign(senderKeys.privateKey)
        .execute({
            partyId: sender.partyId,
        })

    const pendingTransferAfterWithdraw = await sdk.token.transfer.pending(
        receiver.partyId
    )
    if (pendingTransferAfterWithdraw.length)
        throw Error('pendingTransferAfterWithdraw is not empty')

    logger.info('Successfully withdrawn the submitted transfer')
}
