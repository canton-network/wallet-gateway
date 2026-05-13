// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import {
    getRepoRoot,
    getNetworkArg,
    hasFlag,
    SUPPORTED_VERSIONS,
} from './lib/utils.js'

const args = process.argv.slice(2)
const command = args[0]
const multiSync = hasFlag('multi-sync')

const rootDir = getRepoRoot()
const LOCALNET_DIR = path.join(rootDir, '.localnet/docker-compose/localnet')
const GENERATED_COMPOSE_OVERRIDE = path.join(
    rootDir,
    '.temp/start-localnet.override.yaml'
)

const CANTON_MAX_COMMANDS_IN_FLIGHT = 256
const LOCALNET_DARS_DIR = path.join(rootDir, '.localnet/dars')
// TODO (#1721): make multi-sync the default and remove the flag once multi-sync is fully supported and tested in the main scripts e2e tests, but for now we want to keep it as an option to avoid accidentally running multi-sync e2e tests without updating the main scripts e2e tests to cover multi-sync as well
function ensureComposeOverride() {
    fs.mkdirSync(path.dirname(GENERATED_COMPOSE_OVERRIDE), { recursive: true })
    const lines = [
        'services:',
        '  canton:',
        '    environment:',
        '      ADDITIONAL_CONFIG_MAX_COMMANDS_IN_FLIGHT: |-',
        `        canton.participants.app-provider.ledger-api.command-service.max-commands-in-flight = ${CANTON_MAX_COMMANDS_IN_FLIGHT}`,
        `        canton.participants.app-user.ledger-api.command-service.max-commands-in-flight = ${CANTON_MAX_COMMANDS_IN_FLIGHT}`,
        `        canton.participants.sv.ledger-api.command-service.max-commands-in-flight = ${CANTON_MAX_COMMANDS_IN_FLIGHT}`,
    ]
    if (multiSync) {
        lines.push(
            '  multi-sync-startup:',
            '    volumes:',
            `      - ${LOCALNET_DARS_DIR}:/app/dars:ro`
        )
    }
    lines.push('')
    fs.writeFileSync(GENERATED_COMPOSE_OVERRIDE, lines.join('\n'), 'utf8')
}

// TODO (#1721): make multi-sync the default and remove the flag once multi-sync is fully supported and tested in the main scripts e2e tests, but for now we want to keep it as an option to avoid accidentally running multi-sync e2e tests without updating the main scripts e2e tests to cover multi-sync as well
const composeBase = [
    'docker',
    'compose',
    '--env-file',
    `${LOCALNET_DIR}/compose.env`,
    '--env-file',
    `${LOCALNET_DIR}/env/common.env`,
    '-f',
    `${LOCALNET_DIR}/compose.yaml`,
    '-f',
    `${LOCALNET_DIR}/resource-constraints.yaml`,
    '-f',
    GENERATED_COMPOSE_OVERRIDE,
    '--profile',
    'sv',
    '--profile',
    'app-provider',
    '--profile',
    'app-user',
    ...(multiSync ? ['--profile', 'multi-sync'] : []),
]

const network = getNetworkArg()
const spliceVersion = SUPPORTED_VERSIONS[network].splice.version

// Set IMAGE_TAG env variable to SPLICE_VERSION
const env = { ...process.env, IMAGE_TAG: spliceVersion }

ensureComposeOverride()

if (command === 'pull') {
    execFileSync(composeBase[0], [...composeBase.slice(1), 'pull'], {
        stdio: 'inherit',
        env,
    })
} else if (command === 'start') {
    execFileSync(composeBase[0], [...composeBase.slice(1), 'up', '-d'], {
        stdio: 'inherit',
        env,
    })
} else if (command === 'stop') {
    execFileSync(composeBase[0], [...composeBase.slice(1), 'down', '-v'], {
        stdio: 'inherit',
        env,
    })
} else {
    console.error('Usage: start-localnet.ts <start|stop|pull>')
    process.exit(1)
}
