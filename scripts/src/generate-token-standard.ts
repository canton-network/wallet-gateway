// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import * as path from 'path'
import { getRepoRoot } from './lib/utils.js'
import { installDPM } from './install-dpm.js'
import { generateDamlJsBindings } from './lib/daml-codegen.js'

const repoRoot = getRepoRoot()

const TOKEN_STANDARD_CONFIG = {
    destDir: path.join(repoRoot, 'damljs/token-standard-models'),
    packageName: 'token-standard-models',
    version: '1.0.0',
}

async function main() {
    await installDPM()
    await generateDamlJsBindings(TOKEN_STANDARD_CONFIG)
}

main()
