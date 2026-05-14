# CIP-103 Conformance CLI

Self-serve conformance checks for wallet providers against CIP-103 sync/async profiles.
The CLI is built with `commander` and provides strict option validation.

## Installation

Install the CLI globally (or run it with your preferred package runner):

```bash
npm install -g @canton-network/cip103-conformance
```

The package bundles the required OpenRPC specs internally, so users do not need a local `api-specs` folder.

## Commands

### `run`

Runs the conformance suite against a provider and writes a result artifact JSON.

```bash
conformance-cli run --profile sync|async --provider-config <file> [--out <file>] [--signing-key <pem>] [--key-id <id>]
```

- required:
    - `--profile`: `sync` or `async`
    - `--provider-config`: path to provider config JSON
- optional:
    - `--out`: artifact output path (default: `dist/conformance/result.json`)
    - `--signing-key`: Ed25519 private key PEM to sign artifact
    - `--key-id`: key identifier embedded in `artifact.signature.keyId` (requires `--signing-key`)

Example:

```bash
conformance-cli run --profile async --provider-config provider.config.remote.example.json --out dist/conformance/remote-result.json
```

### `validate-artifact`

Validates artifact schema, and optionally validates signature.

```bash
conformance-cli validate-artifact --artifact <file> [--public-key <pem>] [--require-signature]
```

- required:
    - `--artifact`: path to generated result artifact
- optional:
    - `--public-key`: Ed25519 public key PEM for signature verification
    - `--require-signature`: fail if artifact is unsigned

Examples:

```bash
conformance-cli validate-artifact --artifact dist/conformance/remote-result.json
conformance-cli validate-artifact --artifact dist/conformance/remote-result.json --public-key ./keys/provider.pub.pem --require-signature
```

### `export-badge`

Generates badge JSON (`pass`/`fail`) from an artifact.

```bash
conformance-cli export-badge --artifact <file> [--out <file>]
```

- required:
    - `--artifact`: path to generated result artifact
- optional:
    - `--out`: badge output path (default: `dist/conformance/badge.json`)

Example:

```bash
conformance-cli export-badge --artifact dist/conformance/remote-result.json --out dist/conformance/remote-badge.json
```

## Example Provider Config

```json
{
    "name": "Example Wallet Provider",
    "version": "1.2.3",
    "transport": "http",
    "endpoint": "http://localhost:8081/json-rpc",
    "timeoutMs": 10000
}
```

## Example Provider Config (Server-Side Wallet)

Use this for remote wallet gateways or any server-hosted JSON-RPC provider.
In many setups, an Authorization header is required.

```json
{
    "name": "Example Server-Side Wallet",
    "version": "1.2.3",
    "transport": "http",
    "endpoint": "https://wallet.example.com/api/v0/dapp",
    "timeoutMs": 15000,
    "headers": {
        "authorization": "Bearer <access-token>"
    }
}
```

See `provider.config.remote.example.json` for a copy-ready template.

## Example Provider Config (Browser Extension Wallet)

Use injected mode to call the extension provider directly in a browser context.
The runner opens `appUrl` and resolves the provider in one of two ways:

- **Namespaced injection (recommended when available)**: set `providerId` (e.g. `"canton.console"`) to resolve `window.canton.console`.
- **Targeted postMessage (recommended for multiple installed extensions)**: set `extensionTarget` to route JSON-RPC requests deterministically to a specific extension.
- **Legacy**: set `injectedNamespace` (defaults to `"window.canton"`).

Resolution precedence: `providerId` > `injectedNamespace`.

```json
{
    "name": "Example Browser Extension Wallet",
    "version": "1.0.0",
    "transport": "injected",
    "appUrl": "http://localhost:8080",
    "providerId": "canton.<walletKey>",
    "extensionPath": "/absolute/path/to/unpacked-extension",
    "headless": false,
    "timeoutMs": 10000
}
```

### Example (Injected, targeted extension selection)

Use this when multiple extensions might otherwise compete for `window.postMessage` requests.
Set `extensionTarget` to the extension identifier used by the wallet (for Splice Wallet Gateway extension this is the browser runtime id).

```json
{
    "name": "Example Browser Extension Wallet (Targeted)",
    "version": "1.0.0",
    "transport": "injected",
    "appUrl": "http://localhost:8080",
    "extensionTarget": "<extension-id>",
    "extensionPath": "/absolute/path/to/unpacked-extension",
    "headless": false,
    "timeoutMs": 10000
}
```

### Example (Injected, legacy namespace)

```json
{
    "name": "Example Browser Extension Wallet (Legacy)",
    "version": "1.0.0",
    "transport": "injected",
    "appUrl": "http://localhost:8080",
    "injectedNamespace": "window.canton",
    "extensionPath": "/absolute/path/to/unpacked-extension",
    "headless": false,
    "timeoutMs": 10000
}
```

If your setup still uses an HTTP bridge for extensions, set `transport: "http"` and provide `endpoint`.

See `provider.config.browser-extension.example.json` for a copy-ready template.

## Profile Mapping

- `sync` -> bundled `openrpc-dapp-api.json`
- `async` -> bundled `openrpc-dapp-remote-api.json`

## Result format

This section refers to the **generated conformance artifact JSON** written by `conformance-cli run` (the file at `--out`, defaulting to `dist/conformance/result.json`).

Inside that JSON, each test produces an entry in the `results` array with a stable identifier at `results[].id`:

```json
{
    "results": [
        {
            "id": "CIP103-RPC-001",
            "status": "pass",
            "title": "…",
            "category": "protocol"
        }
    ]
}
```

Use these IDs to:

- link to a specific failing check in CI logs
- build allow/deny lists in downstream tooling
- aggregate results across many runs/providers

### Protocol

- **`CIP103-RPC-001`**: Unknown method returns JSON-RPC “method not found” (`-32601`).
- **`CIP103-RPC-002`**: Invalid JSON-RPC request returns an error response (may be `skip` for injected transport which doesn't expose raw envelopes).

### Schema

- **`CIP103-SCHEMA-<methodName>`**: Existence probe for each required OpenRPC method in the selected profile.
  Example: `CIP103-SCHEMA-listAccounts`. The check **fails** if the wallet returns JSON-RPC **`-32601` (method not found)** or **`-32004` (method not supported)**; other errors still count as “implemented” (the method is routed) but may reflect auth, params, or runtime state.

### Behavior

- **`CIP103-BEH-001`**: Sync profile smoke test that the provider exposes the `connect` lifecycle method.
- **`CIP103-BEH-101`**: Async profile smoke test that the provider exposes the `connect` lifecycle method.

## Conformance runner dApp (connected provider)

For browser/manual testing you can run the conformance suite directly against the **currently connected** wallet provider (no Playwright, no `extensionPath`) using the example dApp:

- `examples/conformance-runner`

This dApp produces an artifact JSON with the **same top-level shape** as the CLI output, so you can drop the downloaded file next to your other artifacts and reuse `generate-report.mjs` to build the HTML report site.
