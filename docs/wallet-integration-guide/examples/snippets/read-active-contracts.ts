import { SDK, localNetStaticConfig } from '@canton-network/wallet-sdk'

export default async function () {
    const sdk = await SDK.create({
        auth: global.TOKEN_PROVIDER_CONFIG_DEFAULT,
        ledgerClientUrl: localNetStaticConfig.LOCALNET_APP_USER_LEDGER_URL,
    })
    const myParty = global.EXISTING_PARTY_1
    //we use holdings as an example here
    const myTemplateId = '#splice-amulet:Splice.Amulet:Amulet'

    await sdk.ledger.acsReader.read({
        parties: [myParty],
        templateIds: [myTemplateId], //this is optional for if you want to filter by template id
        filterByParty: true,
    })
}
