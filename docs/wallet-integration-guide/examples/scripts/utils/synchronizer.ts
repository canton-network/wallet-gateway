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

    type Row = {
        label: string
        template: string
        amount: string
        cid: string
        sync: string
    }
    const rows: Row[] = []
    const seenCids = new Set<string>()

    const isHolding = (template: string): boolean =>
        template === 'Token' || template === 'Amulet'

    for (let i = 0; i < specs.length; i++) {
        const { label } = specs[i]
        const contracts = results[i]
        if (contracts.length === 0) {
            rows.push({
                label,
                template: '(none)',
                amount: '-',
                cid: '-',
                sync: '-',
            })
            continue
        }
        for (const c of contracts) {
            // De-duplicate: a contract can appear in multiple participants' ACS
            // streams (e.g. Alice's Token where Bob is the admin/signatory).
            if (seenCids.has(c.contractId)) continue
            seenCids.add(c.contractId)

            const tplParts = (c.templateId ?? '').split(':')
            const template = tplParts[tplParts.length - 1] || c.templateId
            const amount = extractAmount(c.createArgument)
            // For Token/Amulet rows, replace the participant label with the
            // holding owner so the table reflects who actually owns the asset
            // (not just whose ACS the contract appears in via signatory rules).
            const rowLabel = isHolding(template)
                ? shortenParty(extractOwner(c.createArgument)) || label
                : label
            rows.push({
                label: rowLabel,
                template,
                amount,
                cid: `${c.contractId.substring(0, 16)}...`,
                sync: syncAlias(c.synchronizerId, synchronizers),
            })
        }
    }

    const HEADERS = [
        'Party / Owner',
        'Template',
        'Amount',
        'Contract ID',
        'Synchronizer',
    ] as const
    const KEYS = ['label', 'template', 'amount', 'cid', 'sync'] as const

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

/** Extract a human-readable amount from a contract's createArgument */
function extractAmount(createArgument: unknown): string {
    if (!createArgument || typeof createArgument !== 'object') return ''
    const arg = createArgument as Record<string, unknown>
    // Token: { holding: { amount } }
    if (arg.holding && typeof arg.holding === 'object') {
        const amount = (arg.holding as Record<string, unknown>).amount
        if (amount != null) return String(amount)
    }
    // Amulet: { amount: { initialAmount } }
    if (arg.amount && typeof arg.amount === 'object') {
        const initial = (arg.amount as Record<string, unknown>).initialAmount
        if (initial != null) return String(initial)
    }
    return ''
}

/** Extract the owner (or admin for rules contracts) from a createArgument */
function extractOwner(createArgument: unknown): string {
    if (!createArgument || typeof createArgument !== 'object') return ''
    const arg = createArgument as Record<string, unknown>
    // Token: { holding: { owner } }
    if (arg.holding && typeof arg.holding === 'object') {
        const owner = (arg.holding as Record<string, unknown>).owner
        if (typeof owner === 'string') return owner
    }
    // Amulet: { owner }
    if (typeof arg.owner === 'string') return arg.owner
    // TokenRules / TradingApp: { admin } / { venue }
    if (typeof arg.admin === 'string') return arg.admin
    if (typeof arg.venue === 'string') return arg.venue
    return ''
}

/** Shorten a party id "name::1220abcd..." → "name" for compact display */
function shortenParty(p: string): string {
    if (!p) return ''
    const idx = p.indexOf('::')
    return idx > 0 ? p.substring(0, idx) : p
}
