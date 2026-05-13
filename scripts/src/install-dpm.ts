// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { execSync } from 'child_process'
import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'
import {
    DAML_RELEASE_VERSION,
    repoRoot,
    info,
    success,
    error,
    warn,
} from './lib/utils.js'

function getDpmHomeDir(): string {
    const configuredDpmHome = process.env.DPM_HOME?.trim()
    if (configuredDpmHome) {
        return configuredDpmHome
    }

    return path.join(os.homedir(), '.dpm')
}

const DPM_STANDALONE_VERSION = '1.0.16'
const DPM_GITHUB_RELEASE_BASE = `https://github.com/digital-asset/dpm/releases/download/${DPM_STANDALONE_VERSION}`

function isCiMode(): boolean {
    return process.env.CI?.toLowerCase() === 'true'
}

function getStandaloneAssetName(osType: NodeJS.Platform, arch: string): string {
    const osName =
        osType === 'linux' ? 'linux' : osType === 'darwin' ? 'darwin' : null
    const archName =
        arch === 'x64' ? 'amd64' : arch === 'arm64' ? 'arm64' : null

    if (!osName || !archName) {
        throw new Error(
            `Unsupported OS/arch for CI DPM install: ${osType}/${arch}`
        )
    }

    return `dpm-${DPM_STANDALONE_VERSION}-${osName}-${archName}.tar.gz`
}

function installDpmForNormal(osType: NodeJS.Platform): void {
    console.log(
        info(
            `== Installing DPM (normal mode) version ${DAML_RELEASE_VERSION} for ${osType} ==`
        )
    )
    if (osType === 'linux' || osType === 'darwin') {
        console.log(info('Downloading and running DPM installation script...'))
        execSync(
            `curl -sSL https://get.digitalasset.com/install/install.sh | sh -s ${DAML_RELEASE_VERSION}`,
            { stdio: 'inherit' }
        )
        ensureDpmInPath()
        console.log(info(`Installing SDK version ${DAML_RELEASE_VERSION}...`))
        execSync(`dpm install ${DAML_RELEASE_VERSION}`, { stdio: 'inherit' })
        console.log(success('== DPM installation complete =='))
        console.log(
            warn(
                'Note: You may need to restart your terminal or run "source ~/.bashrc" (or ~/.zshrc) for PATH changes to take effect in new shells.'
            )
        )
    } else if (osType === 'win32') {
        console.log(
            info(
                'For Windows, please install DPM manually from https://docs.digitalasset.com/build/3.4/dpm/dpm.html'
            )
        )
        console.log(info('After installation, run: dpm install'))
        process.exit(1)
    } else {
        console.log(
            error(
                `Unsupported OS: ${osType}. Please install DPM manually from https://docs.digitalasset.com/build/3.4/dpm/dpm.html`
            )
        )
        process.exit(1)
    }
}

function installDpmForCi(osType: NodeJS.Platform): void {
    console.log(
        info(
            `== Installing DPM (CI mode) standalone v${DPM_STANDALONE_VERSION} for ${osType} ==`
        )
    )

    const arch = os.arch()
    const assetName = getStandaloneAssetName(osType, arch)
    const downloadUrl = `${DPM_GITHUB_RELEASE_BASE}/${assetName}`
    const dpmBinDir = path.join(getDpmHomeDir(), 'bin')
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dpm-ci-'))
    const tarball = path.join(tmpDir, assetName)

    console.log(info(`Downloading ${downloadUrl}...`))
    execSync(`curl -fsSL "${downloadUrl}" -o "${tarball}"`, {
        stdio: 'inherit',
    })

    fs.mkdirSync(dpmBinDir, { recursive: true })
    execSync(`tar -xzf "${tarball}" -C "${dpmBinDir}" --strip-components=1`, {
        stdio: 'inherit',
    })
    fs.chmodSync(path.join(dpmBinDir, 'dpm'), 0o755)

    ensureDpmInPath()
    console.log(
        success(`== DPM standalone v${DPM_STANDALONE_VERSION} installed ==`)
    )

    const tokenStandardDir = path.join(
        repoRoot,
        'damljs',
        'token-standard-models'
    )
    console.log(info(`Running 'dpm install package' in ${tokenStandardDir}...`))
    execSync('dpm install package', { cwd: tokenStandardDir, stdio: 'inherit' })
    console.log(success('== DPM components installed =='))
}

/**
 * Ensure DPM is in PATH for the current process and future shells
 */
function ensureDpmInPath(): void {
    const homeDir = os.homedir()
    const dpmHomeDir = getDpmHomeDir()
    const dpmBinPath = path.join(dpmHomeDir, 'bin')

    // Check if dpm bin directory exists
    if (!fs.existsSync(dpmBinPath)) {
        return // DPM not installed yet
    }

    // Add to current process PATH if not already there
    const currentPath = process.env.PATH || ''
    if (!currentPath.includes(dpmBinPath)) {
        process.env.PATH = `${dpmBinPath}:${currentPath}`
        console.log(info(`Added ${dpmBinPath} to PATH for current session`))
    }

    if (process.env.CI === 'true') {
        return
    }

    // Update shell config files for future sessions
    const shellConfigFiles = [
        path.join(homeDir, '.bashrc'),
        path.join(homeDir, '.zshrc'),
        path.join(homeDir, '.profile'),
    ]

    const pathExport = `export PATH="${dpmBinPath}:$PATH"`

    for (const configFile of shellConfigFiles) {
        if (fs.existsSync(configFile)) {
            const content = fs.readFileSync(configFile, 'utf8')

            // Check if PATH export already exists
            if (
                !content.includes(dpmBinPath) &&
                !content.includes('.dpm/bin') &&
                !content.includes('$HOME/.dpm/bin')
            ) {
                // Append to config file
                fs.appendFileSync(
                    configFile,
                    `\n# Added by splice-wallet-kernel DPM installer\n${pathExport}\n`
                )
                console.log(
                    info(`Updated ${configFile} to include DPM in PATH`)
                )
            }
        }
    }
}

/**
 * Parse and compare DPM version with the desired version
 */
function compareDpmVersionWithDesired(desiredVersion: string): boolean {
    try {
        const dpmVersion = execSync('dpm version', { encoding: 'utf8' })

        function parseVersion(version: string) {
            const match = version.match(
                /^([0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9]+)?)(?:\.(\d+))?/
            )
            if (!match) throw new Error(`Invalid version format: ${version}`)
            return {
                prefix: match[1],
                snapshot: match[2] ? parseInt(match[2], 10) : undefined,
            }
        }

        const parsed = parseVersion(desiredVersion)

        // Check if the DPM version includes the major version of the requested
        return dpmVersion.includes(parsed.prefix)
    } catch (e) {
        console.log(error(`Error checking DPM version: ${e}`))
        // DPM not installed
        return false
    }
}

/**
 * Install DPM (Daml Package Manager)
 * DPM is the recommended way to manage Daml projects
 */
export async function installDPM() {
    const ciMode = isCiMode()

    // First, ensure DPM is in PATH if it's already installed
    ensureDpmInPath()

    if (compareDpmVersionWithDesired(DAML_RELEASE_VERSION)) {
        console.log(
            success(`DPM version ${DAML_RELEASE_VERSION} is already installed.`)
        )
        return
    }

    const osType = os.platform()

    try {
        if (ciMode) {
            installDpmForCi(osType)
        } else {
            installDpmForNormal(osType)
        }
    } catch (err) {
        console.error(error(`Failed to install DPM: ${err}`))
        console.log(
            info(
                'Please install DPM manually from https://docs.digitalasset.com/build/3.4/dpm/dpm.html'
            )
        )
        process.exit(1)
    }
}
