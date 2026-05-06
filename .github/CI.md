# CI Test Run Matrix

This document summarizes when each test job in `.github/workflows/build.yml` runs.

## Pull Request Trigger

The CI workflow runs on pull request events:

- `opened`
- `reopened`
- `synchronize`
- `edited`

## Test Run Matrix

| Job                   | Type                                | Runs on PR event (`opened/reopened/synchronize/edited`) | Extra condition                                                    | What it runs                                                                                                                                                                                                                                                       |
| --------------------- | ----------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `test-static`         | Static checks                       | Always                                                  | None                                                               | commitlint title, package checks, typecheck, OpenRPC title check, prettier, eslint                                                                                                                                                                                 |
| `test-unit`           | Unit/integration (Nx target `test`) | Always                                                  | `needs: build`                                                     | `yarn nx affected -t test --base=origin/${{ github.base_ref }} --head=HEAD --parallel`                                                                                                                                                                             |
| `test-migrations`     | SQL migration tests                 | Always                                                  | `needs: build`                                                     | `yarn nx affected -t test:migrations --base=origin/${{ github.base_ref }} --head=HEAD --parallel=1`; only runs in projects that define a `test:migrations` script (currently `@canton-network/core-wallet-store-sql` and `@canton-network/core-signing-store-sql`) |
| `e2e-affected`        | Affected package check              | Always                                                  | None                                                               | computes suite-specific outputs: `affected_ping`, `affected_portfolio`, `affected_wallet_sdk` plus matched project lists                                                                                                                                           |
| `ping-e2e`            | E2E worker (ping app)               | Conditional                                             | `needs: [build, e2e-affected]` and `affected_ping == 'true'`       | starts Canton+services and runs Playwright for `@canton-network/example-ping`                                                                                                                                                                                      |
| `test-ping-e2e`       | Aggregator/reporting                | Always                                                  | `needs: [e2e-affected, ping-e2e]`, `if: always()`                  | passes when intentionally skipped; fails if `ping-e2e` was required but did not succeed                                                                                                                                                                            |
| `test-portfolio-e2e`  | E2E (portfolio app)                 | Conditional                                             | `needs: [build, e2e-affected]` and `affected_portfolio == 'true'`  | starts Canton+services and runs Playwright for `@canton-network/example-portfolio`                                                                                                                                                                                 |
| `sdk-e2e`             | Wallet SDK E2E (slow)               | Conditional                                             | `needs: [build, e2e-affected]` and `affected_wallet_sdk == 'true'` | snippet + example script tests on matrix `devnet` + `mainnet`                                                                                                                                                                                                      |
| `test-wallet-sdk-e2e` | Aggregator/reporting                | Always                                                  | `needs: [e2e-affected, sdk-e2e]`, `if: always()`                   | passes when intentionally skipped; fails if sdk-e2e was required but did not succeed                                                                                                                                                                               |
| `test-wallet-sdk-pkg` | SDK package validation              | Always                                                  | `needs: build`                                                     | `yarn script:validate:package`                                                                                                                                                                                                                                     |

Required checks should avoid conditional worker jobs as the branch protection checks directly. The workflow uses aggregator wrappers (`test-ping-e2e` and `test-wallet-sdk-e2e`) that always run and validate whether the corresponding conditional worker job had to run and succeeded.

## Conditional E2E Trigger Rules

### `ping-e2e` runs when either condition is true:

- `@canton-network/example-ping` is affected.
- `@canton-network/wallet-gateway-remote` is affected.
- `scripts/src/lib/version-config.json` changes.

### `test-portfolio-e2e` runs when either condition is true:

- `@canton-network/example-portfolio` is affected.
- `@canton-network/wallet-gateway-remote` is affected.
- `scripts/src/lib/version-config.json` changes.

### `sdk-e2e` runs when either condition is true:

- Nx marks `@canton-network/wallet-sdk` as affected (including dependency-impact via project graph).
- `docs-wallet-integration-guide-examples` is affected.
- `scripts/src/lib/version-config.json` changes.
