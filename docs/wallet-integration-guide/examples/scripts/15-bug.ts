import { SDK, TokenProviderConfig } from '@canton-network/wallet-sdk'

import { v4 as uuidv4 } from 'uuid'

async function main() {
    const auth: TokenProviderConfig = {
        method: 'self_signed',
        issuer: 'unsafe-auth',
        credentials: {
            clientId: 'ledger-api-user',
            clientSecret: 'unsafe',
            audience: 'https://canton.network.global',
            scope: '',
        },
    }
    const validatorBaseUrl = 'http://127.0.0.1:2000'

    const sdk = await SDK.create({
        auth: auth,
        ledgerClientUrl: 'http://127.0.0.1:2975',
        token: {
            validatorUrl: `${validatorBaseUrl}/api/validator`,
            registries: [`${validatorBaseUrl}/api/validator/v0/scan-proxy`],
            auth: auth,
        },
        amulet: {
            validatorUrl: `${validatorBaseUrl}/api/validator`,
            scanApiUrl:
                'https://scan.sv-1.global.canton.network.sync.global/api/scan',
            auth: auth,
            registryUrl: new URL(
                `${validatorBaseUrl}/api/validator/v0/scan-proxy`
            ),
        },
        asset: {
            registries: [
                new URL(`${validatorBaseUrl}/api/validator/v0/scan-proxy`),
            ],
            auth: auth,
        },
    })

    const { publicKey, privateKey } = sdk.keys.generate()

    const partyHint = 'test'

    const allocatedParty = await sdk.party.external
        .create(publicKey, { partyHint })
        .sign(privateKey)
        .execute()

    console.log(`[newAddress] partyId is ${allocatedParty.partyId}`)

    const transferPreApprovalProposal =
        await sdk.amulet.preapproval.command.create({
            parties: {
                receiver: allocatedParty.partyId,
            },
        })

    const transferPreApprovalProposalInfo = JSON.stringify(
        transferPreApprovalProposal,
        null,
        2
    )
    console.log(
        `[newAddress] transferPreApprovalProposal is ${transferPreApprovalProposalInfo}`
    )

    const result_transferPre = await sdk.ledger
        .prepare({
            partyId: allocatedParty.partyId,
            commands: transferPreApprovalProposal,
            commandId: uuidv4(),
        })
        .sign(privateKey)
        .execute({ partyId: allocatedParty.partyId })

    const resultInfo = JSON.stringify(result_transferPre, null, 2)

    console.log(`result is ${resultInfo}`)
}
main().catch((err) => {
    console.error('Error initializing SDK:', err)
})
