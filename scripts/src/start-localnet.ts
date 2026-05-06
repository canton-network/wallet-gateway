// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { getRepoRoot, getNetworkArg, SUPPORTED_VERSIONS } from './lib/utils.js'

const args = process.argv.slice(2)
const command = args[0]

const rootDir = getRepoRoot()
const LOCALNET_DIR = path.join(rootDir, '.localnet/docker-compose/localnet')
const GENERATED_COMPOSE_OVERRIDE = path.join(
    rootDir,
    '.temp/start-localnet.override.yaml'
)

const CANTON_MAX_COMMANDS_IN_FLIGHT = 256
const CUSTOM_APP_SYNCHRONIZER_SC = path.join(
    rootDir,
    'canton/multi-sync/app-synchronizer.sc'
)

function ensureComposeOverride() {
    fs.mkdirSync(path.dirname(GENERATED_COMPOSE_OVERRIDE), { recursive: true })
    fs.writeFileSync(
        GENERATED_COMPOSE_OVERRIDE,
        [
            'services:',
            '  canton:',
            '    environment:',
            '      ADDITIONAL_CONFIG_MAX_COMMANDS_IN_FLIGHT: |-',
            `        canton.participants.app-provider.ledger-api.command-service.max-commands-in-flight = ${CANTON_MAX_COMMANDS_IN_FLIGHT}`,
            `        canton.participants.app-user.ledger-api.command-service.max-commands-in-flight = ${CANTON_MAX_COMMANDS_IN_FLIGHT}`,
            `        canton.participants.sv.ledger-api.command-service.max-commands-in-flight = ${CANTON_MAX_COMMANDS_IN_FLIGHT}`,
            '  multi-sync-startup:',
            '    volumes:',
            `      - ${CUSTOM_APP_SYNCHRONIZER_SC}:/app/app-synchronizer.sc`,
            '',
        ].join('\n'),
        'utf8'
    )
}

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
    '--profile',
    'multi-sync',
]

const network = getNetworkArg()
const spliceVersion = SUPPORTED_VERSIONS[network].splice.version

// Set IMAGE_TAG env variable to SPLICE_VERSION
const env = { ...process.env, IMAGE_TAG: spliceVersion }

ensureComposeOverride()

if (command === 'start') {
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
    console.error('Usage: start-localnet.ts <start|stop>')
    process.exit(1)
}
