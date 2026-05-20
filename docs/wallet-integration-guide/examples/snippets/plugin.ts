import { SDK, SDKContext, SDKPlugin } from '@canton-network/wallet-sdk'

export default async function () {
    const sdk = (
        await SDK.create({
            auth: {
                method: 'self_signed',
                issuer: 'unsafe-auth',
                credentials: {
                    clientId: 'ledger-api-user',
                    clientSecret: 'unsafe',
                    audience: 'https://canton.network.global',
                    scope: '',
                },
            },
            ledgerClientUrl: 'http://localhost:2975',
        })
    ).registerPlugins({
        myPlugin: class extends SDKPlugin {
            // wallet-sdk plugin should always accept SDKContext
            constructor(protected readonly ctx: SDKContext) {
                super('myPlugin', ctx)
            }

            myMethod() {
                // do some logic
                return
            }
        },
    })

    sdk.myPlugin.myMethod()
}
