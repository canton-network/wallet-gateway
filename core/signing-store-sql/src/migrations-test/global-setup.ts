// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import {
    PostgreSqlContainer,
    StartedPostgreSqlContainer,
} from '@testcontainers/postgresql'

let container: StartedPostgreSqlContainer | undefined

export const PG_ENV = {
    HOST: 'MIG_TEST_PG_HOST',
    PORT: 'MIG_TEST_PG_PORT',
    USER: 'MIG_TEST_PG_USER',
    PASSWORD: 'MIG_TEST_PG_PASSWORD',
    DATABASE: 'MIG_TEST_PG_DATABASE',
} as const

export default async function setup() {
    container = await new PostgreSqlContainer('postgres:16-alpine').start()

    process.env[PG_ENV.HOST] = container.getHost()
    process.env[PG_ENV.PORT] = String(container.getPort())
    process.env[PG_ENV.USER] = container.getUsername()
    process.env[PG_ENV.PASSWORD] = container.getPassword()
    process.env[PG_ENV.DATABASE] = container.getDatabase()

    return async () => {
        await container?.stop({ timeout: 10_000 })
        container = undefined
    }
}
