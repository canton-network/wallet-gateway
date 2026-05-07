// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import * as path from 'path'
import { getRepoRoot, info } from './lib/utils.js'
import { installDPM } from './install-dpm.js'
import { generateDamlJsBindings } from './lib/daml-codegen.js'

const repoRoot = getRepoRoot()

const FEATURED_APP_PROXIES_CONFIG = {
    destDir: path.join(repoRoot, 'damljs/featured-app-proxies'),
    packageName: 'splice-util-featured-app-proxies',
    version: '1.0.0',
    dependencies: [
        path.join(
            repoRoot,
            '.splice/daml/dars/splice-api-token-holding-v1-1.0.0.dar'
        ),
        path.join(
            repoRoot,
            '.splice/daml/dars/splice-api-token-transfer-instruction-v1-1.0.0.dar'
        ),
        path.join(
            repoRoot,
            '.splice/daml/dars/splice-api-token-allocation-v1-1.0.0.dar'
        ),
    ],
}

// TODO: this is a work in progress and should not currently be used
async function main() {
    await installDPM()

    console.log(info('\n=== Generating Featured App Proxies bindings ===\n'))
    await generateDamlJsBindings(FEATURED_APP_PROXIES_CONFIG)

    console.log(
        info('\n=== All featured DAR bindings generated successfully ===\n')
    )
}

main()
