import { localNetStaticConfig } from '@canton-network/wallet-sdk'
import { TransferTestScriptParameters } from './types.js'

export default async (args: TransferTestScriptParameters) => {
    const { sdk, receiver, sender, senderKeys, receiverKeys, logger } = args

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

    const [rejectCommand, rejectDisclosedContracts] =
        await sdk.token.transfer.reject({
            transferInstructionCid: pendingTransfer[0].contractId,
            registryUrl: localNetStaticConfig.LOCALNET_REGISTRY_API_URL,
        })

    await sdk.ledger
        .prepare({
            partyId: receiver.partyId,
            commands: rejectCommand,
            disclosedContracts: rejectDisclosedContracts,
        })
        .sign(receiverKeys.privateKey)
        .execute({
            partyId: receiver.partyId,
        })

    const pendingTransferAfterReject = await sdk.token.transfer.pending(
        receiver.partyId
    )
    if (pendingTransferAfterReject.length)
        throw Error('pendingTransferAfterReject is not empty')

    logger.info('Successfully rejected the submitted transfer')
}
