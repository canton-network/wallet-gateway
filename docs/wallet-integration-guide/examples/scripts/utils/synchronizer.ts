import type { SDKInterface } from '@canton-network/wallet-sdk'
import type { Logger } from 'pino'

/**
 * Pick the preferred synchronizer ID from the list returned by the ledger API.
 *
 * When a participant is connected to multiple synchronizers the ledger API may
 * return them in any order. This helper ensures the global synchronizer is
 * always selected — regardless of position — by looking for the entry whose
 * alias is `'global'`. If no such entry exists (e.g. single-synchronizer
 * setups) the first entry is returned as the default.
 *
 * Pass the returned ID as the explicit `synchronizerId` on `ledger.prepare()`
 * and `ledger.internal.prepare()` calls that must route to the global
 * synchronizer.
 *
 * @param synchronizers - Raw array from `GET /v2/state/connected-synchronizers`.
 * @returns The `synchronizerId` of the entry aliased `'global'`, or the first
 *          entry's `synchronizerId` when no global alias is present.
 * @throws {Error} When the array is empty.
 */
export function resolvePreferredSynchronizerId(
    synchronizers: Array<{ synchronizerAlias: string; synchronizerId: string }>
): string {
    const preferred =
        synchronizers.find((s) => s.synchronizerAlias === 'global') ??
        synchronizers[0]
    if (!preferred) throw new Error('No connected synchronizers found')
    return preferred.synchronizerId
}

export type SynchronizerMap = {
    globalSynchronizerId: string
    appSynchronizerId: string
}

/** Resolve a synchronizer ID to a logical role alias */
export function syncAlias(
    syncId: string,
    synchronizers: SynchronizerMap
): string {
    if (syncId === synchronizers.globalSynchronizerId) return 'global'
    if (syncId === synchronizers.appSynchronizerId) return 'app-synchronizer'
    throw new Error(`Unknown synchronizer ID ${syncId}`)
}

export type ContractSpec = {
    label: string
    sdk: SDKInterface
    templateIds: string[]
    parties: string[]
}

/**
 * Query contracts for all given specs in parallel, then log the results as a
 * formatted ASCII table. Queries run concurrently; rows are printed in
 * declaration order.
 */
export async function logAllContracts(
    logger: Logger,
    synchronizers: SynchronizerMap,
    specs: ContractSpec[]
): Promise<void> {
    const results = await Promise.all(
        specs.map(({ sdk, templateIds, parties }) =>
            sdk.ledger.acs.read({ templateIds, parties, filterByParty: true })
        )
    )

    type Row = { label: string; template: string; cid: string; sync: string }
    const rows: Row[] = []

    for (let i = 0; i < specs.length; i++) {
        const { label } = specs[i]
        const contracts = results[i]
        if (contracts.length === 0) {
            rows.push({ label, template: '(none)', cid: '-', sync: '-' })
            continue
        }
        for (const c of contracts) {
            const tplParts = (c.templateId ?? '').split(':')
            const template = tplParts[tplParts.length - 1] || c.templateId
            rows.push({
                label,
                template,
                cid: `${c.contractId.substring(0, 16)}...`,
                sync: syncAlias(c.synchronizerId, synchronizers),
            })
        }
    }

    const HEADERS = [
        'Party / Label',
        'Template',
        'Contract ID',
        'Synchronizer',
    ] as const
    const KEYS = ['label', 'template', 'cid', 'sync'] as const

    const colWidths = HEADERS.map((h, i) =>
        Math.max(h.length, ...rows.map((r) => r[KEYS[i]].length))
    )

    const pad = (s: string, w: number) => s.padEnd(w)
    const sep = '+' + colWidths.map((w) => '-'.repeat(w + 2)).join('+') + '+'
    const headerRow =
        '|' + HEADERS.map((h, i) => ` ${pad(h, colWidths[i])} `).join('|') + '|'

    logger.info(sep)
    logger.info(headerRow)
    logger.info(sep)
    for (const r of rows) {
        const line =
            '|' +
            KEYS.map((k, i) => ` ${pad(r[k], colWidths[i])} `).join('|') +
            '|'
        logger.info(line)
    }
    logger.info(sep)
}
