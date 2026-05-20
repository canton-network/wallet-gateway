import * as sdk from '@canton-network/dapp-sdk'
import { useHoldings } from '../hooks/useHoldings'
import { useAccounts } from '../hooks/useAccounts'
import { useState } from 'react'

export default function Holdings(props: {
    connectResult?: sdk.dappAPI.ConnectResult
}) {
    const [urls, setUrls] = useState<{ validator?: URL; registry?: URL }>({})

    const [inputValidator, setInputValidator] = useState('')
    const [inputRegistry, setInputRegistry] = useState('')

    const holdings = useHoldings(
        props.connectResult,
        urls.validator,
        urls.registry
    )
    const accounts = useAccounts(props.connectResult)

    const connected = props.connectResult?.isConnected ?? false

    if (!connected) return <div />

    if (!urls.validator || !urls.registry) {
        return (
            <div>
                <h2>Add new registry</h2>
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        setUrls({
                            validator: new URL(inputValidator),
                            registry: new URL(inputRegistry),
                        })
                    }}
                >
                    <label>Validator URL:</label>
                    <input
                        value={inputValidator}
                        onChange={(e) => setInputValidator(e.target.value)}
                    />
                    <br />
                    <label>Registry URL:</label>
                    <input
                        value={inputRegistry}
                        onChange={(e) => setInputRegistry(e.target.value)}
                    />
                    <br />
                    <button type="submit">Add registry</button>
                </form>
            </div>
        )
    }

    return (
        <div>
            <p>
                Utxos for for primary party:{' '}
                {accounts?.find((p) => p.primary)?.partyId}
            </p>
            <div className="terminal-display">
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {holdings?.map((h) => (
                        <li key={h.contractId} style={{ color: '#0ff' }}>
                            {h.contractId} {h.activeContract && ' (active)'}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}
