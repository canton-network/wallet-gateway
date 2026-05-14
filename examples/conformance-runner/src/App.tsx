import { useEffect, useState } from 'react'
import * as sdk from '@canton-network/dapp-sdk'
import {
    createConnectedProviderTransport,
    type ConnectedProvider,
} from './conformance/transport'
import {
    runConformanceAgainstConnectedProvider,
    type Artifact,
    type CapturedRequest,
    type Profile,
} from './conformance/runner'
import { readRequiredMethodsBundled } from '@canton-network/cip103-conformance/browser'

function downloadJson(filename: string, data: unknown) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}

async function bestEffortProviderMeta(): Promise<{
    name: string
    version: string
    appUrl?: string
}> {
    try {
        const status: sdk.dappAPI.StatusEvent = await sdk.status()
        const name = status.provider?.id ?? 'Connected wallet'
        const version = status.provider?.version ?? 'unknown'
        return { name, version }
    } catch {
        return { name: 'Connected wallet', version: 'unknown' }
    }
}

export default function App() {
    const [connectResult, setConnectResult] =
        useState<sdk.dappAPI.ConnectResult>()
    const connected = connectResult?.isConnected ?? false

    const [profile, setProfile] = useState<Profile>('sync')
    const [running, setRunning] = useState(false)
    const [artifact, setArtifact] = useState<Artifact>()
    const [error, setError] = useState<string>()
    const [progress, setProgress] = useState<{
        message: string
        phase?: string | undefined
        current?: number | undefined
        total?: number | undefined
        lastId?: string | undefined
        lastStatus?: string | undefined
    }>()
    const [observedResponses, setObservedResponses] = useState<
        Record<string, unknown>
    >({})
    const [observedRequests, setObservedRequests] = useState<
        Record<string, CapturedRequest | null>
    >({})

    const canRun = connected && !running

    useEffect(() => {
        sdk.status()
            .then((status: sdk.dappAPI.StatusEvent) =>
                setConnectResult(status.connection)
            )
            .catch(() => setConnectResult(undefined))
    }, [])

    async function connect() {
        setError(undefined)
        setArtifact(undefined)
        const result = await sdk.connect({
            defaultAdapters: [],
        })
        setConnectResult(result)
    }

    async function disconnect() {
        setError(undefined)
        await sdk.disconnect()
        setConnectResult(undefined)
    }

    async function run() {
        setRunning(true)
        setError(undefined)
        setArtifact(undefined)
        setProgress({ message: 'Starting…' })
        setObservedResponses({})
        setObservedRequests({})

        try {
            const connectedProvider: ConnectedProvider | null =
                sdk.getConnectedProvider()
            if (!connectedProvider) {
                throw new Error(
                    'No connected provider instance available. Connect a wallet first.'
                )
            }

            setProgress({ message: 'Loading required methods…' })
            const requiredMethods = await readRequiredMethodsBundled(profile)
            const meta = await bestEffortProviderMeta()
            const transport = createConnectedProviderTransport(
                connectedProvider,
                {
                    timeoutMs: 15000,
                }
            )
            const next = await runConformanceAgainstConnectedProvider({
                profile,
                transport,
                requiredMethods,
                providerMeta: {
                    name: meta.name,
                    version: meta.version,
                    appUrl: window.location.href,
                },
                onProgress: (e) => {
                    setProgress({
                        phase: e.phase,
                        message: e.message,
                        current: e.current,
                        total: e.total,
                        lastId: e.lastResult?.id,
                        lastStatus: e.lastResult?.status,
                    })
                    if (e.lastResult?.id) {
                        const id = e.lastResult.id
                        setObservedResponses((prev) => ({
                            ...prev,
                            [id]:
                                e.lastResponse === undefined
                                    ? null
                                    : e.lastResponse,
                        }))
                        setObservedRequests((prev) => ({
                            ...prev,
                            [id]:
                                e.lastRequest === undefined
                                    ? null
                                    : e.lastRequest,
                        }))
                    }
                },
            })
            setArtifact(next)
            setProgress({ message: 'Done.' })
        } catch (e) {
            setError(e instanceof Error ? (e.stack ?? e.message) : String(e))
            setProgress(undefined)
        } finally {
            setRunning(false)
        }
    }

    return (
        <div className="page">
            <header className="header">
                <div>
                    <div className="title">CIP-103 Conformance Runner</div>
                    <div className="subtitle">
                        Runs conformance checks against the currently connected
                        wallet provider.
                    </div>
                </div>
                <div className="headerActions">
                    {connected ? (
                        <button disabled={running} onClick={disconnect}>
                            Disconnect
                        </button>
                    ) : (
                        <button disabled={running} onClick={connect}>
                            Connect wallet
                        </button>
                    )}
                    <button
                        disabled={!connected}
                        onClick={() => sdk.open()}
                        title="Open the wallet UI if supported"
                    >
                        Open wallet
                    </button>
                </div>
            </header>

            <section className="card">
                <div className="row">
                    <div className="pill">
                        <span className="pillLabel">Status</span>
                        <span className={connected ? 'ok' : 'muted'}>
                            {connected ? 'Connected' : 'Not connected'}
                        </span>
                    </div>

                    <div className="pill">
                        <span className="pillLabel">Profile</span>
                        <select
                            value={profile}
                            disabled={running}
                            onChange={(e) =>
                                setProfile(e.target.value as Profile)
                            }
                        >
                            <option value="sync">sync</option>
                            <option value="async">async</option>
                        </select>
                    </div>
                </div>

                <div className="row">
                    <button disabled={!canRun} onClick={run}>
                        {running ? 'Running…' : 'Run conformance'}
                    </button>
                    <button
                        disabled={!artifact}
                        onClick={() => {
                            if (!artifact) return
                            const safeProfile = artifact.profile
                            downloadJson(
                                `result-connected-${safeProfile}.json`,
                                artifact
                            )
                        }}
                    >
                        Download artifact JSON
                    </button>
                </div>

                {running && progress && (
                    <div className="progressBox">
                        <div className="progressTitle">Progress</div>
                        <div className="mono">{progress.message}</div>
                        {(progress.current !== undefined ||
                            progress.total !== undefined ||
                            progress.lastId) && (
                            <div className="mono muted">
                                {progress.phase ? `[${progress.phase}] ` : ''}
                                {progress.current !== undefined &&
                                progress.total !== undefined
                                    ? `${progress.current}/${progress.total} `
                                    : ''}
                                {progress.lastId ? `${progress.lastId} ` : ''}
                                {progress.lastStatus
                                    ? `(${progress.lastStatus})`
                                    : ''}
                            </div>
                        )}
                    </div>
                )}

                {error && (
                    <div className="errorBox">
                        <div className="errorTitle">Error</div>
                        <div className="mono">{error}</div>
                    </div>
                )}
            </section>

            {artifact && (
                <section className="card">
                    <div className="sectionTitle">Summary</div>
                    <div className="row">
                        <div className="pill">
                            <span className="pillLabel">Overall</span>
                            <span
                                className={
                                    artifact.summary.status === 'pass'
                                        ? 'ok'
                                        : 'bad'
                                }
                            >
                                {artifact.summary.status.toUpperCase()}
                            </span>
                        </div>
                        <div className="pill">
                            <span className="pillLabel">Passed</span>
                            <span className="ok">
                                {artifact.summary.passed}
                            </span>
                        </div>
                        <div className="pill">
                            <span className="pillLabel">Failed</span>
                            <span className="bad">
                                {artifact.summary.failed}
                            </span>
                        </div>
                        <div className="pill">
                            <span className="pillLabel">Skipped</span>
                            <span className="muted">
                                {artifact.summary.skipped}
                            </span>
                        </div>
                        <div className="pill">
                            <span className="pillLabel">Total</span>
                            <span>{artifact.summary.total}</span>
                        </div>
                    </div>

                    <details className="details" open>
                        <summary>Results ({artifact.results.length})</summary>
                        <div className="results">
                            {artifact.results.map((r) => (
                                <div key={r.id} className="resultRow">
                                    <div className="resultLeft">
                                        <div className="mono">{r.id}</div>
                                        <div className="resultTitle">
                                            {r.title}
                                        </div>
                                    </div>
                                    <div className="resultRight">
                                        <span
                                            className={
                                                r.status === 'pass'
                                                    ? 'tag ok'
                                                    : r.status === 'fail'
                                                      ? 'tag bad'
                                                      : 'tag muted'
                                            }
                                        >
                                            {r.status}
                                        </span>
                                        <span className="mono muted">
                                            {r.elapsedMs}ms
                                        </span>
                                    </div>
                                    {r.details && (
                                        <div className="resultDetails mono">
                                            {r.details}
                                        </div>
                                    )}
                                    <details className="observed">
                                        <summary>Request</summary>
                                        <pre className="observedPre mono">
                                            {JSON.stringify(
                                                observedRequests[r.id] ?? null,
                                                null,
                                                2
                                            )}
                                        </pre>
                                    </details>
                                    <details className="observed">
                                        <summary>Observed response</summary>
                                        <pre className="observedPre mono">
                                            {JSON.stringify(
                                                observedResponses[r.id] ?? null,
                                                null,
                                                2
                                            )}
                                        </pre>
                                    </details>
                                </div>
                            ))}
                        </div>
                    </details>
                </section>
            )}
        </div>
    )
}
