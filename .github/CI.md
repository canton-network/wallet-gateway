# CI Test Run Matrix

This document summarizes when each test job in `.github/workflows/build.yml` runs.

## Pull Request Trigger

The CI workflow runs on pull request events:

- `opened`
- `reopened`
- `synchronize`
- `edited`

## Test Run Matrix

| Job                       | Type                                | Runs on PR event (`opened/reopened/synchronize/edited`) | Extra condition                                                                            | What it runs                                                                           |
| ------------------------- | ----------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `test-static`             | Static checks                       | Always                                                  | `needs: build`                                                                             | commitlint title, package checks, typecheck, OpenRPC title check, prettier, eslint     |
| `test-unit`               | Unit/integration (Nx target `test`) | Always                                                  | `needs: build`                                                                             | `yarn nx affected -t test --base=origin/${{ github.base_ref }} --head=HEAD --parallel` |
| `build-docs`              | Documentation build                 | Always                                                  | `needs: build`                                                                             | Sphinx docs build for wallet integration guide                                         |
| `ping-e2e`                | E2E worker (ping app)               | Always                                                  | `needs: build`                                                                             | starts Canton+services and runs Playwright for `@canton-network/example-ping`          |
| `test-ping-e2e`           | Aggregator/reporting                | Always                                                  | `needs: ping-e2e`, `if: always()`                                                          | fails if `ping-e2e` did not succeed                                                    |
| `portfolio-e2e`           | E2E worker (portfolio app)          | Always                                                  | `needs: build`                                                                             | starts Canton+services and runs Playwright for `@canton-network/example-portfolio`     |
| `test-portfolio-e2e`      | Aggregator/reporting                | Always                                                  | `needs: portfolio-e2e`, `if: always()`                                                     | fails if `portfolio-e2e` did not succeed                                               |
| `wallet-sdk-snippets-e2e` | Wallet SDK snippets E2E             | Always                                                  | `needs: build`                                                                             | snippet tests on matrix `devnet` + `mainnet`                                           |
| `wallet-sdk-scripts-e2e`  | Wallet SDK scripts E2E              | Always                                                  | `needs: build`                                                                             | example scripts tests on matrix `devnet` + `mainnet`                                   |
| `wallet-sdk-pkg`          | SDK package validation              | Always                                                  | `needs: build`                                                                             | `yarn script:validate:package`                                                         |
| `test-wallet-sdk-e2e`     | Aggregator/reporting                | Always                                                  | `needs: [wallet-sdk-snippets-e2e, wallet-sdk-scripts-e2e, wallet-sdk-pkg]`, `if: always()` | fails if any required wallet-sdk e2e/package job did not succeed                       |

The workflow uses aggregator wrappers (`test-ping-e2e`, `test-portfolio-e2e`, and `test-wallet-sdk-e2e`) that always run and validate the success of the corresponding worker jobs.
