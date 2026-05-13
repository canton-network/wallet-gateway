// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { execSync } from 'child_process'
import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'
import * as process from 'process'
import {
    DAML_RELEASE_VERSION,
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

function isCiMode(): boolean {
    return process.env.CI?.toLowerCase() === 'true'
}

function getDpmReleaseTag(version: string): string {
    return version.startsWith('v') ? version : `v${version}`
}

function getGitHubAssetSelector(
    osType: NodeJS.Platform,
    arch: string
): RegExp[] {
    if (osType === 'linux') {
        if (arch === 'arm64') {
            return [
                /dpm.*linux.*(arm64|aarch64).*(\.tar\.gz|\.tgz)?$/i,
                /dpm.*(arm64|aarch64).*linux.*(\.tar\.gz|\.tgz)?$/i,
                /dpm.*linux.*(arm64|aarch64)$/i,
            ]
        }
        return [
            /dpm.*linux.*(amd64|x86_64).*(\.tar\.gz|\.tgz)?$/i,
            /dpm.*(amd64|x86_64).*linux.*(\.tar\.gz|\.tgz)?$/i,
            /dpm.*linux.*(amd64|x86_64)$/i,
        ]
    }

    if (osType === 'darwin') {
        if (arch === 'arm64') {
            return [
                /dpm.*(darwin|macos).*arm64.*(\.tar\.gz|\.tgz)?$/i,
                /dpm.*arm64.*(darwin|macos).*(\.tar\.gz|\.tgz)?$/i,
                /dpm.*(darwin|macos).*arm64$/i,
            ]
        }
        return [
            /dpm.*(darwin|macos).*(amd64|x86_64).*(\.tar\.gz|\.tgz)?$/i,
            /dpm.*(amd64|x86_64).*(darwin|macos).*(\.tar\.gz|\.tgz)?$/i,
            /dpm.*(darwin|macos).*(amd64|x86_64)$/i,
        ]
    }

    return []
}

function installStandaloneDpmFromGitHubRelease(version: string): void {
    const osType = os.platform()
    const arch = os.arch()

    if (osType !== 'linux' && osType !== 'darwin') {
        throw new Error(
            `Unsupported OS for standalone DPM installation in CI: ${osType}`
        )
    }

    const selectors = getGitHubAssetSelector(osType, arch)
    if (!selectors.length) {
        throw new Error(
            `Unsupported architecture for standalone DPM installation in CI: ${arch}`
        )
    }

    const releaseTag = getDpmReleaseTag(version)
    const releaseUrl = `https://api.github.com/repos/digital-asset/dpm/releases/tags/${releaseTag}`
    const releaseJsonRaw = execSync(`curl -fsSL ${releaseUrl}`, {
        encoding: 'utf8',
    })
    const releaseJson = JSON.parse(releaseJsonRaw) as {
        assets?: Array<{ name?: string; browser_download_url?: string }>
    }

    const assets = releaseJson.assets ?? []
    let asset: { name?: string; browser_download_url?: string } | undefined
    for (const selector of selectors) {
        asset = assets.find((candidate) => {
            if (!candidate.name || !candidate.browser_download_url) {
                return false
            }
            if (
                candidate.name.includes('sha256') ||
                candidate.name.includes('sig')
            ) {
                return false
            }
            return selector.test(candidate.name)
        })
        if (asset) {
            break
        }
    }

    if (!asset?.name || !asset.browser_download_url) {
        const availableAssets = assets
            .map((candidate) => candidate.name)
            .filter(Boolean)
            .join(', ')
        throw new Error(
            `Could not find matching DPM release asset for ${osType}/${arch} in ${releaseTag}. Available assets: ${availableAssets}`
        )
    }

    const dpmHomeDir = getDpmHomeDir()
    const dpmBinDir = path.join(dpmHomeDir, 'bin')
    fs.mkdirSync(dpmBinDir, { recursive: true })

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dpm-ci-'))
    const downloadPath = path.join(tmpDir, asset.name)
    const extractedPath = path.join(tmpDir, 'extract')

    execSync(
        `curl -fsSL "${asset.browser_download_url}" -o "${downloadPath}"`,
        {
            stdio: 'inherit',
        }
    )

    if (asset.name.endsWith('.tar.gz') || asset.name.endsWith('.tgz')) {
        fs.mkdirSync(extractedPath, { recursive: true })
        execSync(`tar -xzf "${downloadPath}" -C "${extractedPath}"`, {
            stdio: 'inherit',
        })
        execSync(
            `install -m 0755 "$(find "${extractedPath}" -type f -name dpm | head -n1)" "${path.join(dpmBinDir, 'dpm')}"`,
            { stdio: 'inherit', shell: '/bin/bash' }
        )
    } else if (asset.name.endsWith('.zip')) {
        fs.mkdirSync(extractedPath, { recursive: true })
        execSync(`unzip -q "${downloadPath}" -d "${extractedPath}"`, {
            stdio: 'inherit',
        })
        execSync(
            `install -m 0755 "$(find "${extractedPath}" -type f -name dpm | head -n1)" "${path.join(dpmBinDir, 'dpm')}"`,
            { stdio: 'inherit', shell: '/bin/bash' }
        )
    } else {
        execSync(
            `install -m 0755 "${downloadPath}" "${path.join(dpmBinDir, 'dpm')}"`,
            {
                stdio: 'inherit',
            }
        )
    }

    console.log(
        success(
            `Installed standalone DPM binary from ${releaseTag} GitHub release.`
        )
    )
}

function installCiComponentsWithOptIn(version: string): void {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dpm-components-'))
    const damlYamlPath = path.join(tmpDir, 'daml.yaml')
    const damlYaml = `components:\n  - codegen:${version}\n`

    fs.writeFileSync(damlYamlPath, damlYaml, 'utf8')
    console.log(
        info(`Installing opt-in DPM components from ${damlYamlPath}...`)
    )
    execSync('dpm install package', {
        cwd: tmpDir,
        stdio: 'inherit',
    })
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

    if (ciMode) {
        console.log(
            info(
                `== Installing DPM (CI lightweight mode) version ${DAML_RELEASE_VERSION} ==`
            )
        )

        try {
            if (!compareDpmVersionWithDesired(DAML_RELEASE_VERSION)) {
                console.log(
                    info(
                        'Downloading and installing standalone DPM binary from GitHub releases...'
                    )
                )
                installStandaloneDpmFromGitHubRelease(DAML_RELEASE_VERSION)
                ensureDpmInPath()
            } else {
                console.log(
                    success(
                        `DPM version ${DAML_RELEASE_VERSION} is already installed. Reusing existing binary.`
                    )
                )
            }

            installCiComponentsWithOptIn(DAML_RELEASE_VERSION)
            console.log(
                success('== DPM CI lightweight installation complete ==')
            )
            return
        } catch (err) {
            console.error(
                error(`Failed CI lightweight DPM installation: ${err}`)
            )
            process.exit(1)
        }
    }

    if (compareDpmVersionWithDesired(DAML_RELEASE_VERSION)) {
        console.log(
            success(`DPM version ${DAML_RELEASE_VERSION} is already installed.`)
        )
        return
    }

    const osType = os.platform()

    console.log(
        info(
            `== Installing DPM (Daml Package Manager) version ${DAML_RELEASE_VERSION} for ${osType} ==`
        )
    )

    try {
        // Install DPM using the official installation script
        // The script automatically detects the OS and installs the appropriate version
        if (osType === 'linux' || osType === 'darwin') {
            console.log(
                info('Downloading and running DPM installation script...')
            )
            execSync(
                `curl -sSL https://get.digitalasset.com/install/install.sh | sh -s ${DAML_RELEASE_VERSION}`,
                { stdio: 'inherit' }
            )

            // After installation, ensure DPM is in PATH
            ensureDpmInPath()

            console.log(success('== DPM installation complete =='))
            if (!ciMode) {
                console.log(
                    warn(
                        'Note: You may need to restart your terminal or run "source ~/.bashrc" (or ~/.zshrc) for PATH changes to take effect in new shells.'
                    )
                )
            }
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
