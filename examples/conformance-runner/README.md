## CIP-103 Conformance Runner (dApp)

This is a small web dApp that:

- connects to a wallet using `@canton-network/dapp-sdk` discovery
- runs a subset of the CIP-103 conformance suite against the **currently connected** provider (no Playwright)
- lets you download an artifact JSON compatible with `tools/cip103-conformance/generate-report.mjs`

### Run

From repo root:

```bash
yarn install --mode=skip-build --no-immutable
yarn workspace @canton-network/example-conformance-runner run dev
```

Then open the page, connect a wallet, select a profile, and click **Run conformance**.

### Download artifact

Click **Download artifact JSON** to save a `result-connected-<profile>.json` file.

To include it in the HTML report site, copy it under `tools/cip103-conformance/` as `result-<wallet>.json` and run:

```bash
yarn workspace @canton-network/cip103-conformance report:html
```
