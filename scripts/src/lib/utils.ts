// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import zlib from 'zlib'
import { pipeline } from 'stream/promises'
import crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import * as process from 'process'
import { white, green, italic, red, yellow, bold } from 'yoctocolors'
import * as jsonc from 'jsonc-parser'
import * as tar from 'tar-fs'
import { exec } from 'child_process'
import { promisify } from 'util'
import { tmpdir } from 'os'

const ex = promisify(exec)

export const info = (message: string): string => italic(white(message))
export const warn = (message: string): string => bold(yellow(message))
export const error = (message: string): string => bold(red(message))
export const success = (message: string): string => green(message)
export const trimNewline = (message: string): string =>
    message.replace(/\n$/, '')

export const isCiEnvironment = (): boolean =>
    process.env.CI?.toLowerCase() === 'true'

export const repoRoot = getRepoRoot()
export const CANTON_PATH = path.join(repoRoot, '.canton')
export const SPLICE_PATH = path.join(repoRoot, '.splice')
export const SPLICE_SPEC_PATH = path.join(repoRoot, '.splice-spec')
export const CANTON_BIN = path.join(CANTON_PATH, 'bin/canton')
export const CANTON_CONF = path.join(repoRoot, 'canton/canton.conf')
export const CANTON_BOOTSTRAP = path.join(repoRoot, 'canton/bootstrap.sc')
export const API_SPECS_PATH = path.join(repoRoot, 'api-specs')

export type Network = 'mainnet' | 'devnet'
export type ArtifactKind = 'localnet' | 'splice' | 'spliceSpec'
export type ArchiveVersionAndHash = {
    version: string
    hash: string
}
export type ArchiveVersionAndHashes = {
    version: string
    hashes: Record<string, string>
}
export type EnvConfig = {
    canton: ArchiveVersionAndHash
    splice: ArchiveVersionAndHashes
}

export type SupportedVersions = Record<Network, EnvConfig>

export const VERSIONS_CONFIG_PATH = path.join(
    repoRoot,
    'scripts',
    'src',
    'lib',
    'version-config.json'
)

const versionConfigRaw = fs.readFileSync(VERSIONS_CONFIG_PATH, 'utf8')
const versionConfig = JSON.parse(versionConfigRaw) as {
    DAML_RELEASE_VERSION: string
    SUPPORTED_VERSIONS: SupportedVersions
}

export const DAML_RELEASE_VERSION = versionConfig.DAML_RELEASE_VERSION
export const SUPPORTED_VERSIONS: SupportedVersions =
    versionConfig.SUPPORTED_VERSIONS

export async function downloadToFile(
    url: string | URL,
    directory: string,
    hash?: string
) {
    const filename = path.basename(url.toString())
    const res = await fetch(url)
    if (!res.ok || !res.body) {
        throw new Error(`Failed to download: ${url}`)
    }
    await ensureDir(directory)
    await pipeline(
        res.body,
        fs.createWriteStream(path.join(directory, filename))
    )

    if (hash) {
        await verifyFileIntegrity(
            path.join(directory, filename),
            hash,
            'sha256'
        )
    }
}

export async function verifyFileIntegrity(
    filePath: string,
    expectedHash: string,
    algo = 'sha256'
): Promise<boolean> {
    if (!fs.existsSync(filePath)) {
        return false
    }
    const computedHash = await computeFileHash(filePath, algo)

    if (computedHash === expectedHash) {
        console.log(
            success(
                `${algo.toUpperCase()} checksum verification of ${filePath} successful.`
            )
        )
        return true
    }

    console.log(
        error(
            `File hashes did not match.\n\tExpected: ${expectedHash}\n\tReceived: ${computedHash}`
        )
    )
    return false
}

async function computeFileHash(
    filePath: string,
    algo = 'sha256'
): Promise<string> {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash(algo)
        const stream = fs.createReadStream(filePath)

        stream.on('data', (chunk) => hash.update(chunk))
        stream.on('end', () => {
            const computedHash = hash.digest('hex')
            resolve(computedHash)
        })
        stream.on('error', (err) => reject(err))
    })
}

export async function downloadAndUnpackTarball(
    url: string,
    tarfile: string,
    unpackDir: string,
    options?: { hash?: string; strip?: number; updateHash?: boolean }
) {
    let shouldDownload = true
    const currentHash = options?.hash
    const algo = 'sha256'

    ensureDir(path.dirname(tarfile))
    ensureDir(path.dirname(unpackDir))

    if (fs.existsSync(tarfile) && options?.hash) {
        // File exists, check hash
        const validFile = await verifyFileIntegrity(tarfile, options.hash, algo)
        shouldDownload = !validFile
    }

    if (shouldDownload) {
        console.log(info(`Downloading tarball from ${url} to ${tarfile}...`))
        const res = await fetch(url)
        if (!res.ok || !res.body) {
            throw new Error(`Failed to download: ${url}`)
        }
        await pipeline(res.body, fs.createWriteStream(tarfile))
        console.log(success('Download complete.'))
    }

    if (!options?.updateHash && currentHash) {
        const validFile = await verifyFileIntegrity(tarfile, currentHash, algo)

        const downloadedHash = crypto
            .createHash(algo)
            .update(fs.readFileSync(tarfile))
            .digest('hex')
        if (!validFile) {
            // Remove the bad file
            throw new Error(
                error(
                    `Checksum mismatch for downloaded tarball.\n\tExpected: ${currentHash}\n\tReceived: ${downloadedHash}`
                )
            )
        }
    }

    await ensureDir(unpackDir)
    await pipeline(
        fs.createReadStream(tarfile),
        zlib.createGunzip(),
        tar.extract(unpackDir, { strip: options?.strip ?? 1 })
    )
    console.log(success(`Unpacked tarball into ${unpackDir}`))
}
// Get the root of the current repository
// Assumption: the root of the repository is the closest
//     ancestor directory of the CWD that contains a .git directory
export function getRepoRoot(): string {
    const cwd = process.cwd()
    const segments = cwd.split('/')

    for (let i = segments.length; i > 0; i--) {
        const potentialRoot = segments.slice(0, i).join('/')
        if (fs.existsSync(path.join(potentialRoot, '.git'))) {
            return potentialRoot
        }
    }

    console.error(
        error(`${cwd} does not seem to be inside a valid git repository.`)
    )
    process.exit(1)
}

export function findJsonKeyPosition(
    jsonContent: string,
    key: string
): { line: number; column: number } {
    const keyPath = key.split('.')
    let found: { line: number; column: number } | null = null

    function search(node: jsonc.Node, pathIdx: number) {
        if (!node || found) return
        if (node.type === 'object') {
            for (const prop of node.children ?? []) {
                if (prop.type === 'property' && prop.children?.[0]?.value) {
                    const propName = prop.children[0].value as string
                    const isLast = pathIdx === keyPath.length - 1
                    const matches = isLast
                        ? propName.startsWith(keyPath[pathIdx])
                        : propName === keyPath[pathIdx]
                    // If matches, advance pathIdx
                    if (matches) {
                        if (isLast) {
                            const offset = prop.children[0].offset
                            const before = jsonContent.slice(0, offset)
                            const lines = before.split('\n')
                            found = {
                                line: lines.length,
                                column: lines[lines.length - 1].length + 1,
                            }
                            return
                        } else if (prop.children[1]) {
                            search(prop.children[1], pathIdx + 1)
                        }
                    }
                    // Always search deeper with the same pathIdx (skip intermediate keys)
                    if (prop.children[1]) {
                        search(prop.children[1], pathIdx)
                    }
                }
            }
        } else if (node.type === 'array') {
            const searchIdx = keyPath[pathIdx]
            if (Number.isNaN(Number(searchIdx))) {
                for (const child of node.children ?? []) {
                    search(child, pathIdx)
                }
            } else {
                const idx = Number(searchIdx)
                if (node.children && node.children[idx]) {
                    search(node.children[idx], pathIdx + 1)
                }
            }
        }
    }

    const root = jsonc.parseTree(jsonContent)
    if (root) search(root, 0)

    return found ?? { line: 1, column: 1 }
}

export function traverseDirectory(
    directory: string,
    callback: (filePath: string) => void
): void {
    const entries = fs.readdirSync(directory)
    for (const entry of entries) {
        const fullPath = path.join(directory, entry)
        if (fs.statSync(fullPath).isDirectory()) {
            traverseDirectory(fullPath, callback)
        } else {
            callback(fullPath)
        }
    }
}

// Recursively get all files with a given extension
export function getAllFilesWithExtension(
    dir: string,
    ext?: string,
    recursive = true
): string[] {
    let results: string[] = []
    const list = fs.readdirSync(dir)
    for (const file of list) {
        const filePath = path.join(dir, file)
        const stat = fs.statSync(filePath)
        if (stat && stat.isDirectory()) {
            if (recursive) {
                results = results.concat(
                    getAllFilesWithExtension(filePath, ext, true)
                )
            }
        } else if (ext === undefined || filePath.endsWith(ext)) {
            results.push(filePath)
        }
    }
    return results
}

// Ensure a directory exists
export async function ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
}

// Copy a file
export async function copyFileRecursive(src: string, dest: string) {
    fs.copyFileSync(src, dest)
}

export type markingLevel = 'info' | 'warn' | 'error'
export function markFile(
    relativePath: string,
    fileContent: string,
    key: string,
    warning: string,
    markingLevel: markingLevel
): void {
    const typePosition = findJsonKeyPosition(fileContent, key)
    const line = typePosition.line || 1
    const column = typePosition.column || 1
    if (markingLevel === 'error') {
        console.error(
            `::error file=${relativePath},line=${line},col=${column}::${warning}`
        )
    } else if (markingLevel === 'warn') {
        console.warn(
            `::warning file=${relativePath},line=${line},col=${column}::${warning}`
        )
    } else if (markingLevel === 'info') {
        console.info(
            `::info file=${relativePath},line=${line},col=${column}::${warning}`
        )
    }
}

/**
 * Maps over the keys and values of an object, allowing transformation of both.
 *
 * @param obj object to map over
 * @param mapFn mapping function, which can return either a new value directly (no key change), or a [newKey, newValue] tuple
 * @returns a new object with the mapped keys and values
 */
export function mapObject<V>(
    obj: Record<string, V>,
    mapFn: (k: string, v: V) => V | [string, V]
): Record<string, V> {
    return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => {
            const mapped = mapFn(k, v)
            return Array.isArray(mapped) ? mapped : [k, mapped]
        })
    )
}

/**
 * Elides a string by replacing the middle portion with an ellipsis.
 *
 * @param s string to elide
 * @param len the length of the elided middle portion (default: 8)
 * @returns the elided string
 */
export function elideMiddle(s: string, len = 8) {
    const elider = '...'
    const totalLen = s.length

    if (totalLen <= len) return s
    if (len <= elider.length) return s

    const halfway = Math.floor(totalLen / 2)

    return (
        s.slice(0, halfway - Math.floor(len / 2)) +
        elider +
        s.slice(halfway + Math.floor(len / 2))
    )
}

interface NxGraph {
    nodes: Record<string, { data: { tags: string[] } }>
    dependencies: Record<string, { target: string }[]>
}

async function readNxGraphFromFile(
    projectName: string,
    filePath: string
): Promise<NxGraph> {
    await ex(`yarn nx graph --focus=${projectName} --file=${filePath}`, {
        cwd: repoRoot,
    })
    const raw = fs.readFileSync(filePath, 'utf8')
    const graph: NxGraph = JSON.parse(raw).graph

    return graph
}

/**
 * Use Nx to get all dependencies of a project in the repo.
 */
export async function getAllNxDependencies(
    projectName: string
): Promise<string[]> {
    const projects: string[] = await ex(`yarn nx show projects --json`, {
        cwd: repoRoot,
    }).then(({ stdout }) => JSON.parse(stdout))

    if (!projects.includes(projectName)) {
        throw new Error(`Project ${projectName} does not exist.`)
    }

    const file = `${tmpdir()}/nx-graph-${projectName.replace(/\//g, '_')}.json`
    console.log(info(`Writing Nx graph to ${file}...`))

    const { nodes, dependencies } = await readNxGraphFromFile(projectName, file)

    // Nx shows both child dependencies and parent (reverse) dependencies for the focused package.
    // Filter out reverse dependencies.
    const childDependencies: string[] = Object.entries(dependencies).reduce<
        string[]
    >((prev, current) => {
        const [key, value] = current
        if (value.every((dep) => dep.target !== projectName)) {
            prev.push(key)
        }
        return prev
    }, [])

    // Nx shows dependencies (example: @daml.js) that are not published to npm
    // Filter to only public packages (those tagged with "npm:public").
    const publicDependencies: string[] = childDependencies.filter((dep) => {
        return nodes[dep].data.tags.includes('npm:public')
    })

    return publicDependencies
}

export function getArgValue(name: string): string | undefined {
    const prefix = `--${name}=`
    const arg = process.argv.slice(2).find((a) => a.startsWith(prefix))
    return arg?.slice(prefix.length)
}

export function hasFlag(name: string): boolean {
    return process.argv.slice(2).includes(`--${name}`)
}

export function getNetworkArg(): Network {
    const arg = getArgValue('network')
    if (!arg) return 'devnet'
    if (arg === 'mainnet' || arg === 'devnet') return arg as Network
    throw new Error(
        `Invalid --network value: "${arg}". Use "mainnet" or "devnet".`
    )
}

export function setSpliceHash(
    network: Network,
    kind: ArtifactKind,
    newHash: string
) {
    const raw = fs.readFileSync(VERSIONS_CONFIG_PATH, 'utf8')
    const config = JSON.parse(raw)
    config.SUPPORTED_VERSIONS[network].splice.hashes[kind] = newHash
    fs.writeFileSync(
        VERSIONS_CONFIG_PATH,
        JSON.stringify(config, null, 4) + '\n',
        'utf8'
    )
}

export function setCantonHash(network: Network, newHash: string) {
    const raw = fs.readFileSync(VERSIONS_CONFIG_PATH, 'utf8')
    const config = JSON.parse(raw)
    config.SUPPORTED_VERSIONS[network].canton.hash = newHash
    fs.writeFileSync(
        VERSIONS_CONFIG_PATH,
        JSON.stringify(config, null, 4) + '\n',
        'utf8'
    )
}
