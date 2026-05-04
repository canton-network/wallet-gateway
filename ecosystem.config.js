// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

const sharedEnvDevelopment = {
    NODE_ENV: 'development',
    DEBUG: 'true',
}

export const apps = [
    {
        name: 'remote',
        script: 'yarn workspace @canton-network/wallet-gateway-remote dev',
        env_development: sharedEnvDevelopment,
    },
    {
        name: 'mock-oauth2-server',
        script: 'yarn workspace @canton-network/mock-oauth2 dev',
        env_development: sharedEnvDevelopment,
    },
    {
        name: 'extension',
        script: 'yarn workspace @canton-network/wallet-gateway-extension dev',
        env_development: sharedEnvDevelopment,
    },
    {
        name: 'example-ping',
        script: 'yarn workspace @canton-network/example-ping dev',
        env_development: sharedEnvDevelopment,
    },
    {
        name: 'example-porfolio',
        script: 'yarn workspace @canton-network/example-portfolio dev',
        env_development: sharedEnvDevelopment,
    },
    {
        name: 'splice-wallet-sdk',
        script: 'yarn workspace @canton-network/wallet-sdk dev',
        env_development: sharedEnvDevelopment,
    },
    {
        name: 'splice-dapp-sdk',
        script: 'yarn workspace @canton-network/dapp-sdk dev',
        env_development: sharedEnvDevelopment,
    },
    {
        name: 'core-ledger-client',
        script: 'yarn workspace @canton-network/core-ledger-client dev',
        env_development: sharedEnvDevelopment,
    },
    {
        name: 'core-splice-provider',
        script: 'yarn workspace @canton-network/core-splice-provider dev',
        env_development: sharedEnvDevelopment,
    },
    {
        name: 'core-wallet-auth',
        script: 'yarn workspace @canton-network/core-wallet-auth dev',
        env_development: sharedEnvDevelopment,
    },
    {
        name: 'core-wallet-ui-components',
        script: 'yarn workspace @canton-network/core-wallet-ui-components build:watch',
        env_development: sharedEnvDevelopment,
    },
    {
        name: 'core-wallet-store',
        script: 'yarn workspace @canton-network/core-wallet-store dev',
        env_development: sharedEnvDevelopment,
    },
    {
        name: 'core-wallet-user-rpc-client',
        script: 'yarn workspace @canton-network/core-wallet-user-rpc-client dev',
        env_development: sharedEnvDevelopment,
    },
    {
        name: 'core-wallet-dapp-rpc-client',
        script: 'yarn workspace @canton-network/core-wallet-dapp-rpc-client dev',
        env_development: sharedEnvDevelopment,
    },
    {
        name: 'core-types',
        script: 'yarn workspace @canton-network/core-types dev',
        env_development: sharedEnvDevelopment,
    },
    {
        name: 'core-rpc-transport',
        script: 'yarn workspace @canton-network/core-rpc-transport dev',
        env_development: sharedEnvDevelopment,
    },
    {
        name: 'core-wallet-test-utils',
        script: 'yarn workspace @canton-network/core-wallet-test-utils dev',
        env_development: sharedEnvDevelopment,
    },
    {
        name: 'core-tx-parser',
        script: 'yarn workspace @canton-network/core-tx-parser dev',
        env_development: sharedEnvDevelopment,
    },
    {
        name: 'core-token-standard-service',
        script: 'yarn workspace @canton-network/core-token-standard-service dev',
        env_development: sharedEnvDevelopment,
    },
    {
        name: 'core-ledger-client-types',
        script: 'yarn workspace @canton-network/core-ledger-client-types dev',
        env_development: sharedEnvDevelopment,
    },
    {
        name: 'core-amulet-service',
        script: 'yarn workspace @canton-network/core-amulet-service dev',
        env_development: sharedEnvDevelopment,
    },
    {
        name: 'core-asyncapi-client',
        script: 'yarn workspace @canton-network/core-asyncapi-client dev',
        env_development: sharedEnvDevelopment,
    },
]
