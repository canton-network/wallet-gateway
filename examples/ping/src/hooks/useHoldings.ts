// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { useContext, useEffect, useState } from 'react'
import * as sdk from '@canton-network/dapp-sdk'
import { ErrorContext } from '../ErrorContext'
import * as walletSDK from '@canton-network/wallet-sdk'

export function useHoldings(
    connectResult?: sdk.dappAPI.ConnectResult,
    validatorUrl?: string,
    registryUrl?: string
) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [holdings, setHoldings] = useState<any[]>()
    const { setErrorMsg } = useContext(ErrorContext)

    useEffect(() => {
        if (connectResult?.isConnected && validatorUrl && registryUrl) {
            const ledgerProvider = window.canton

            if (!ledgerProvider) {
                return
            }

            const listHoldings = async () => {
                try {
                    const status = await sdk.dappSDK.status()
                    const accounts = await sdk.dappSDK.listAccounts()
                    const wallet = await walletSDK.SDK.create({
                        ledgerProvider,
                        token: {
                            validatorUrl,
                            auth: {
                                method: 'static',
                                token: status.session?.accessToken ?? '',
                            },
                            registries: [new URL(registryUrl)],
                        },
                    })
                    const primaryAcc = accounts.find((p) => p.primary === true)!

                    return await wallet.token.utxos.list({
                        partyId: primaryAcc.partyId,
                    })
                } catch (err) {
                    setErrorMsg('Failed to fetch holdings')
                    console.error(err)
                }
            }

            listHoldings().then((h) => h && setHoldings(h))
        }
    }, [connectResult, validatorUrl, registryUrl, setErrorMsg])

    return holdings
}
