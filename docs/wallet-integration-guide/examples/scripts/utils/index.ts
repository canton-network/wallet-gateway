import { JSContractEntry } from '@canton-network/core-ledger-client'
import {
    TokenProviderConfig,
    localNetStaticConfig,
} from '@canton-network/wallet-sdk'
import {
    TokenConfig,
    AmuletConfig,
    AssetConfig,
} from '@canton-network/wallet-sdk'

export {
    syncAlias,
    logAllContracts,
    resolvePreferredSynchronizerId,
} from './synchronizer.js'
export type { SynchronizerMap, ContractSpec } from './synchronizer.js'

export { vetDar } from './dar.js'
export { ScanProxyClient, createScanProxyClient } from './scan-proxy.js'
export type {
    ScanProxyContract,
    AmuletInfo,
    ScanProxyChoiceContext,
    AllocationFactoryResult,
} from './scan-proxy.js'

export function getActiveContractCid(entry: JSContractEntry) {
    if ('JsActiveContract' in entry) {
        return entry.JsActiveContract.createdEvent.contractId
    }
}

export const TOKEN_PROVIDER_CONFIG_DEFAULT: TokenProviderConfig = {
    method: 'self_signed',
    issuer: 'unsafe-auth',
    credentials: {
        clientId: localNetStaticConfig.LOCALNET_USER_ID,
        clientSecret: 'unsafe',
        audience: 'https://canton.network.global',
        scope: '',
    },
}
export const TOKEN_NAMESPACE_CONFIG: TokenConfig = {
    validatorUrl: localNetStaticConfig.LOCALNET_APP_VALIDATOR_URL,
    registries: [localNetStaticConfig.LOCALNET_REGISTRY_API_URL],
    auth: TOKEN_PROVIDER_CONFIG_DEFAULT,
}

export const AMULET_NAMESPACE_CONFIG: AmuletConfig = {
    validatorUrl: localNetStaticConfig.LOCALNET_APP_VALIDATOR_URL,
    scanApiUrl: localNetStaticConfig.LOCALNET_SCAN_API_URL,
    auth: TOKEN_PROVIDER_CONFIG_DEFAULT,
    registryUrl: localNetStaticConfig.LOCALNET_REGISTRY_API_URL,
}

export const ASSET_CONFIG: AssetConfig = {
    registries: [localNetStaticConfig.LOCALNET_REGISTRY_API_URL],
    auth: TOKEN_PROVIDER_CONFIG_DEFAULT,
}
