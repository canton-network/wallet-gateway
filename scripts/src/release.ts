// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

// Generate a release for all packages. Performs a version bump and opens a PR against `main`

import { spawn } from 'child_process'
import { program } from '@commander-js/extra-typings'
import { confirm } from '@inquirer/prompts'
import { select } from 'inquirer-select-pro'

// This helper passes through the underlying command's input/output to console
async function cmd(command: string): Promise<void> {
    const [bin, ...args] = command.split(' ')
    const child = spawn(bin, args, { stdio: 'inherit', shell: true })

    await new Promise<void>((resolve, reject) => {
        child.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Command failed: ${command}`))
                process.exit(code)
            } else {
                resolve()
            }
        })
    })
}

async function cmdCapture(command: string): Promise<string> {
    const [bin, ...args] = command.split(' ')
    const child = spawn(bin, args, { shell: true })

    let stdout = ''
    let stderr = ''

    child.stdout?.on('data', (data) => {
        stdout += data.toString()
    })

    child.stderr?.on('data', (data) => {
        stderr += data.toString()
    })

    return new Promise<string>((resolve, reject) => {
        child.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Command failed: ${command}\n${stderr}`))
            } else {
                resolve(stdout + stderr)
            }
        })
    })
}

async function checkGhAuth(): Promise<void> {
    try {
        await cmdCapture('gh --version')
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        console.error('Error: gh CLI is not installed.')
        console.error(
            'Please install gh CLI: https://cli.github.com/manual/installation'
        )
        process.exit(1)
    }

    let authOutput: string
    try {
        authOutput = await cmdCapture('gh auth status')
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        console.error('Error: gh CLI is not authenticated.')
        console.error('Please run: gh auth login')
        process.exit(1)
    }

    if (!authOutput.includes('write:packages')) {
        console.error('Error: gh CLI token does not have write:packages scope.')
        console.error('Please run:')
        console.error('gh auth refresh -h github.com -s repo,write:packages')
        process.exit(1)
    }

    console.log('gh CLI is authenticated with required scopes')
}

async function getBaseBranch(): Promise<string> {
    const branch = await cmdCapture(`git rev-parse --abbrev-ref HEAD`).then(
        (res) => res.trim()
    )

    const validBranch = /^(main|backport\/.+)$/.test(branch)
    if (validBranch) {
        return branch
    } else {
        throw new Error(
            `Release script must run off 'main' or a backport branch. Current branch: '${branch}'`
        )
    }
}

const options = [
    'wallet-sdk',
    'dapp-sdk',
    'wallet-gateway',
    'example-portfolio',
]

program
    .option('--dry-run', 'Perform a dry run (default: true)')
    .option('--no-dry-run', 'Perform a real release')
    .option('--core', 'Include core packages in release (default: true)')
    .option('--no-core', 'Exclude core packages from release')
    .action(async ({ dryRun = true, core = true }) => {
        console.log('Checking gh CLI authentication...')
        await checkGhAuth()

        const baseBranch = await getBaseBranch()
        console.log(
            `Checking out ${baseBranch} branch and pulling latest changes...`
        )
        await cmd(`git checkout ${baseBranch}`)
        await cmd('git pull')

        console.log('Fetching latest tags...')
        await cmd('git fetch --tags --force')

        const groups = await select({
            canToggleAll: true,
            message: 'Select groups to release',
            options: options.map((opt) => ({ name: opt, value: opt })),
        }).catch(() => process.exit(0))

        if (groups.length === 0) {
            console.log('No release groups selected; quitting.')
            process.exit(0)
        }

        if (core && !groups.includes('core')) {
            groups.push('core')
        }

        const timestamp = Math.floor(Date.now() / 1000)
        const releaseBranch = `release/${timestamp}`

        if (!dryRun) {
            console.log(`Creating release branch: ${releaseBranch}`)
            await cmd(`git checkout -b ${releaseBranch}`)

            console.log('Pushing branch to remote...')
            await cmd(`git push --set-upstream origin ${releaseBranch}`)
        }

        await runRelease(dryRun, groups)

        if (!dryRun) {
            console.log('Getting current commit hash...')
            const oldHash = (await cmdCapture('git rev-parse HEAD')).trim()
            console.log(`Old hash: ${oldHash}`)

            console.log('Creating PR and enabling auto-merge...')
            await cmd(
                `gh pr create --base ${baseBranch} --head ${releaseBranch} --title "chore(release): ${groups.join(', ')}" --body "Automated release PR for ${groups.join(', ')}"`
            )
            await cmd(`gh pr merge ${releaseBranch} --auto --squash`)
            console.log('PR created with auto-merge enabled')

            console.log('Waiting for PR to be merged...')
            let merged = false
            while (!merged) {
                await new Promise((resolve) => setTimeout(resolve, 5000)) // Wait 5 seconds
                try {
                    const prStatus = await cmdCapture(
                        `gh pr view ${releaseBranch} --json state,mergeCommit`
                    )
                    const status = JSON.parse(prStatus)
                    if (status.state === 'MERGED') {
                        merged = true
                        console.log('PR has been merged!')
                    } else {
                        console.log(`PR status: ${status.state}, waiting...`)
                    }
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (error) {
                    console.log('Checking PR status...')
                }
            }

            console.log(
                `Checking out ${baseBranch} and pulling latest changes...`
            )
            await cmd(`git checkout ${baseBranch}`)
            await cmd('git pull')

            const newHash = (await cmdCapture('git rev-parse HEAD')).trim()
            console.log(`New hash: ${newHash}`)

            if (oldHash !== newHash) {
                console.log('Running retag to update tag references...')
                await cmd(`yarn script:retag ${oldHash} ${newHash}`)
                console.log('Tags updated successfully')
            } else {
                console.log('Hashes are identical, no retagging needed')
            }
        }

        process.exit(0)
    })
    .parseAsync(process.argv)

async function runRelease(dryRun: boolean, groups: string[]): Promise<void> {
    let releaseCmd = `yarn nx release --skip-publish`

    if (dryRun === false) {
        const proceedDryRun = await confirm({
            message:
                'Dry run is off, and this will result in real GitHub tags & releases being made. Proceed?',
            default: false,
        })

        if (!proceedDryRun) {
            console.log('Aborting')
            process.exit(0)
        }
    } else {
        releaseCmd += ' --dry-run'
    }

    releaseCmd += ` --groups='${groups.join(',')}'`

    if (!dryRun) {
        const proceedRelease = await confirm({
            message: `About to run:\n\n${releaseCmd}\n\nProceed?`,
            default: false,
        })

        if (!proceedRelease) {
            console.log('Aborting')
            process.exit(0)
        }
    }

    const ghToken = (await cmdCapture('gh auth token')).trim()
    await cmd(`GITHUB_TOKEN=${ghToken} ${releaseCmd}`)

    await cmd(releaseCmd)
}
