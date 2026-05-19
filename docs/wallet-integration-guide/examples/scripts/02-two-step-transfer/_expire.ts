import { localNetStaticConfig } from '@canton-network/wallet-sdk'
import { TransferTestScriptParameters } from './types.js'

export default async (args: TransferTestScriptParameters) => {
    const { sdk, sender, receiver, senderKeys, receiverKeys, logger } = args

    const expiryIntervalSeconds = 5

    const expirationDate = new Date()
    expirationDate.setSeconds(
        expirationDate.getSeconds() + expiryIntervalSeconds
    )

    const [transferCommand, transferDisclosedContracts] =
        await sdk.token.transfer.create({
            sender: sender.partyId,
            recipient: receiver.partyId,
            instrumentId: 'Amulet',
            registryUrl: localNetStaticConfig.LOCALNET_REGISTRY_API_URL,
            expirationDate,
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

    const receiverPendingTransfers = await sdk.token.transfer.pending(
        receiver.partyId
    )
    logger.info(
        receiverPendingTransfers,
        'Receiver pending transfer instructions'
    )

    const [acceptCommand, acceptDisclosedContracts] =
        await sdk.token.transfer.accept({
            transferInstructionCid: receiverPendingTransfers[0].contractId,
            registryUrl: localNetStaticConfig.LOCALNET_REGISTRY_API_URL,
        })

    let isErrorThrown = false
    const errorHandler = (error: { errorCategory: number }) => {
        if (error.errorCategory !== 9) throw Error('Incorrect error type')
        isErrorThrown = true
        return
    }

    setTimeout(
        async () => {
            await sdk.ledger
                .prepare({
                    partyId: receiver.partyId,
                    commands: acceptCommand,
                    disclosedContracts: acceptDisclosedContracts,
                })
                .sign(receiverKeys.privateKey)
                .execute({ partyId: receiver.partyId })
                .catch(errorHandler)

            if (!isErrorThrown)
                throw Error(
                    'No error detected - expiration constraint not working'
                )

            logger.info(
                { isErrorThrown },
                'Expiration constraint is working correctly'
            )
        },
        expiryIntervalSeconds * 1000 + 1
    )
}
