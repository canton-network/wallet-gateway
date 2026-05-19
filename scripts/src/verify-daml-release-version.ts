// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'
import * as process from 'process'
import {
    DAML_RELEASE_VERSION,
    error,
    getAllFilesWithExtension,
    info,
    repoRoot,
    success,
    warn,
} from './lib/utils.js'

const DAMLJS_PATH = path.join(repoRoot, 'damljs')

type DamlYaml = {
    'sdk-version'?: string
}

function main() {
    console.log(
        info(
            `Checking daml.yaml sdk-version values against DAML_RELEASE_VERSION=${DAML_RELEASE_VERSION}`
        )
    )

    const damlYamlFiles = getAllFilesWithExtension(DAMLJS_PATH, '.yaml').filter(
        (filePath) => path.basename(filePath) === 'daml.yaml'
    )

    if (damlYamlFiles.length === 0) {
        console.warn(warn(`No daml.yaml files found under ${DAMLJS_PATH}.`))
        return
    }

    let mismatchCount = 0

    for (const filePath of damlYamlFiles) {
        const relativePath = path.relative(repoRoot, filePath)

        try {
            const contents = fs.readFileSync(filePath, 'utf8')
            const parsed = yaml.load(contents) as DamlYaml | null
            const sdkVersion = parsed?.['sdk-version']

            if (sdkVersion === undefined) {
                console.log(
                    info(
                        `${relativePath}: sdk-version key is missing; skipping check for this file`
                    )
                )
                continue
            }

            if (`${sdkVersion}` !== DAML_RELEASE_VERSION) {
                console.error(
                    error(
                        `${relativePath}: sdk-version=${sdkVersion} does not match DAML_RELEASE_VERSION=${DAML_RELEASE_VERSION}`
                    )
                )
                mismatchCount++
                continue
            }

            console.log(
                success(
                    `${relativePath}: sdk-version=${sdkVersion} matches DAML_RELEASE_VERSION`
                )
            )
        } catch (e) {
            console.error(
                error(
                    `${relativePath}: failed to parse daml.yaml (${e instanceof Error ? e.message : String(e)})`
                )
            )
            mismatchCount++
        }
    }

    if (mismatchCount > 0) {
        console.log(
            error(
                `${mismatchCount} daml.yaml file(s) have sdk-version values that do not match DAML_RELEASE_VERSION=${DAML_RELEASE_VERSION}`
            )
        )
        process.exit(1)
    }

    console.log(
        success('All daml.yaml files are aligned with DAML_RELEASE_VERSION.')
    )
}

main()
