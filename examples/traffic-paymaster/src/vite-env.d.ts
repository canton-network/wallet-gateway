/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_WALLET_GATEWAY_URL: string
    readonly VITE_PAYMASTER_PARTY: string
    readonly VITE_PACKAGE_ID: string
    readonly VITE_PURCHASE_TRAFFIC_CID: string
    readonly VITE_ELIGIBLE_RATE_CID: string
    readonly VITE_DEMO_HOLDING_CID: string
    readonly VITE_DEFAULT_TRAFFIC_ACCOUNT: string
    readonly VITE_CURRENCY_SYMBOL: string
    readonly VITE_UNITS_PER_LU: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
