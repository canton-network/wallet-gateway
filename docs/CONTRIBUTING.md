# Contribution Guidelines

## Setup

> Note: This guide is for developers who want to contribute to Wallet Gateway. It is worth reading the entire doc first before starting setup.

### Prerequisites

- Node.js 24+ (see `.nvmrc` for exact version)
- Yarn 4 (via Corepack)
- Java (for Canton) - [sdkman](https://sdkman.io/install) is recommended for version management

### Environment

1. Install [nvm](https://github.com/nvm-sh/nvm):
    ```bash
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
    ```
2. Restart your terminal
3. Run `nvm install` to install the Node.js version from `.nvmrc`
4. Run `corepack enable` to enable Yarn
5. Run `yarn install` to install dependencies
6. Run `yarn postinstall` to set up auto sign-off hooks

In order for Husky to have access to Yarn (as part of our pre-commit), you might need to add an init file for certain IDEs.

Create the file `~/.config/husky/init.sh` with the following content:

```bash
# ~/.config/husky/init.sh
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm
```

### Git "Signed-off-by" Commit

As a requirement under the Hyperledger Foundation, all commits must be signed off. This can be done by adding the `-s` flag every time you commit.

In this repo, we use Husky to automatically configure a git hook to do this for you.

It is also recommended (but not required) to add a GPG key: https://docs.github.com/en/authentication/managing-commit-signature-verification/adding-a-gpg-key-to-your-github-account

### Conventional Commits

We use [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/#summary) to track version changes for packages and create informative changelogs. Our linter automatically checks that the commit scope matches an `nx` project name. Some common commit types are:

- `feat` -- results in a minor version bump for the scoped package (`feat(pkg): ...`)
- `fix` -- results in a patch version bump for the scoped package (`fix(pkg): ...`)
- `build`, `chore`, `ci`, `docs`, `perf`, `refactor`, `revert`, `style`, `test`

Major version bumps are triggered by adding an exclamation after the scope (`feat(pkg)!: breaking change`) or by including a `BREAKING CHANGE: ...` trailer at the end of the commit message.

## Running

### Building

Build all packages:

```bash
yarn build:all
```

This uses `nx` to build all workspaces in parallel. After the initial build, you can selectively build each package by navigating into the corresponding directory and running `yarn build`.

Other useful commands:

```bash
yarn clean:all     # Clean all build artifacts and reset nx cache
yarn test:all      # Run tests across all packages
yarn full:rebuild  # Clean, regenerate, and rebuild everything
yarn full:up       # Start localnet and all dev servers
yarn full:down     # Stop everything and rebuild
```

### API Generation

Run `yarn generate:<api>` from the root to regenerate RPC clients/servers. For example:

```bash
yarn generate:dapp  # Regenerate dApp API client
yarn generate:all   # Regenerate all API specs
```

### Live Reloading

To support fast iteration loops, most workspaces have `dev` scripts that watch their source directories for changes and rebuild. Start all dev servers with:

```bash
yarn start:all
```

This uses `pm2` to run each dev server in parallel. See the `pm2` [cheatsheet](https://pm2.keymetrics.io/docs/usage/quick-start/#cheatsheet) for more commands (preface them with `yarn pm2` when invoking).

```bash
yarn pm2 list   # Show running processes
yarn pm2 logs   # View logs
yarn stop:all   # Stop all services
```

> Note: Codegenned artifacts are not automatically watched. Use `yarn generate:all` if updating the API specs.

After running `yarn start:all`, you'll have services exposed on the following ports:

| Service             | URL            |
| ------------------- | -------------- |
| Example Ping dApp   | localhost:8080 |
| Example Portfolio   | localhost:8081 |
| HTTP Wallet Gateway | localhost:3030 |

### Localnet

To run a local Splice network (includes Canton + Splice services):

```bash
yarn script:fetch:localnet     # Download localnet artifacts
yarn start:localnet            # Start the local network
yarn stop:localnet             # Stop the local network
```

### Canton (Standalone)

If you need to run Canton without the full Splice network (localnet already includes Canton):

1. Ensure you have Java installed - [sdkman](https://sdkman.io/install) is recommended for version management
2. Run `yarn script:fetch:canton` to download Canton to `.canton/`
3. Run `yarn start:canton` to start a participant & synchronizer

```bash
yarn start:canton              # Start Canton (mainnet config)
yarn start:canton:tls          # Start Canton with TLS enabled
yarn start:canton:console      # Start Canton with interactive console
```

### Network Selection

Many scripts support a `--network` flag to target different environments:

```bash
yarn script:fetch:canton --network=devnet   # Fetch devnet Canton version
yarn script:fetch:canton --network=mainnet  # Fetch mainnet Canton version (default)
```
