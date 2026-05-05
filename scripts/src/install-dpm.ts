// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { execSync } from 'child_process'
import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'
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
    // First, ensure DPM is in PATH if it's already installed
    ensureDpmInPath()

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
            if (process.env.CI !== 'true') {
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
