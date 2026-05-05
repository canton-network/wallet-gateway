// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

const sharedEnvDevelopment = {
    NODE_ENV: 'development',
    DEBUG: 'true',
}

export const apps = [
    {
        name: 'remote',
        script: 'yarn workspace @canton-network/wallet-gateway-remote start',
        env_development: sharedEnvDevelopment,
    },
    {
        name: 'mock-oauth2-server',
        script: 'yarn workspace @canton-network/mock-oauth2 start',
        env_development: sharedEnvDevelopment,
    },
    {
        name: 'example-ping',
        script: 'yarn workspace @canton-network/example-ping dev',
        env_development: sharedEnvDevelopment,
    },
    {
        name: 'example-portfolio',
        script: 'yarn workspace @canton-network/example-portfolio dev',
        env_development: sharedEnvDevelopment,
    },
]
