import { PrivateKey } from '@canton-network/core-signing-lib'
import { PartyId } from '@canton-network/core-types'
import { SDKInterface } from '@canton-network/wallet-sdk'
import Decimal from 'decimal.js'
import { Logger } from 'pino'

export async function batchTap(
    totalTaps: number,
    batchSize: number,
    sdk: SDKInterface<'amulet'>,
    partyId: PartyId,
    privateKey: PrivateKey,
    logger: Logger
) {
    const tapIndices = Array.from({ length: totalTaps })
    const randomAmount = () => Math.random() * 100 + 1000
    let totalTapped = new Decimal(0)

    for (let i = 0; i < tapIndices.length; i += batchSize) {
        const batch = tapIndices.slice(i, i + batchSize)
        const batchNumber = Math.floor(i / batchSize)
        const batchEnd = Math.min(i + batchSize, totalTaps)
        logger.info(
            `Running tap batch  ${batchNumber}:${i + 1}-${batchEnd} of ${totalTaps}`
        )
        const amounts = batch.map(() => new Decimal(randomAmount()).toFixed(10))

        await Promise.all(
            amounts.map(async (amount) => {
                const [amuletTapCommand, amuletTapDisclosedContracts] =
                    await sdk.amulet.tap(partyId, amount.toString())

                return sdk.ledger
                    .prepare({
                        partyId: partyId,
                        commands: amuletTapCommand,
                        disclosedContracts: amuletTapDisclosedContracts,
                    })
                    .sign(privateKey)
                    .execute({ partyId: partyId })
            })
        )

        totalTapped = amounts.reduce(
            (acc, amount) => acc.plus(amount),
            totalTapped
        )

        logger.info(`Tap batch ${batchNumber} complete`)
    }
    return totalTapped
}
