# Migration tests for wallet-store-sql

Runs migrations and tests their effects against all supported SQL dialects

`/migration-test/data/`
vitest test files that must reflect `/migrations/` filenames with `.test.ts` extension

`/migration-test/seeds/`
utils for inserting rows satisfying table schema that reflects that state of migrations being applied up to the migration with related filename

`/migration-test/helpers.ts`
utils for validating schema

`/migration-test/coverage.test.ts`
test that validates that every migration has a test. if not - fail the tests. intention is to assure that added migrations are validated against all supported SQL dialects

`/migration-test/global-setup.ts`
spins up postgres with testcontainers

`/migrations.lock.json`
contains hashes of all migration files. intention is to prevent accidental modifications of existing migrations.

`yarn migrations:check-lock` recomputes hashes from migration files and compares them against lock file

`yarn migrations:update-lock` recomputes hashes and updates lock file. use it after adding a new migration, or in case of intentionally editing old migration (i.e. when adding a comment), altering logic in old migrations should be avoided
