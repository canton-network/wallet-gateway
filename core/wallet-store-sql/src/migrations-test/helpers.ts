// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe } from 'vitest'
import { Kysely, sql } from 'kysely'
import pg from 'pg'

import { connection } from '../store-sql.js'
import { migrator } from '../migrator.js'
import { DB } from '../schema.js'
import { PG_ENV } from './global-setup.js'
import { isPostgres } from '../utils'

export type Dialect = 'sqlite' | 'postgres'

export interface DialectContext {
    dialect: Dialect
    getDb: () => Kysely<DB>
}

export const SUPPORTED_DIALECTS: Dialect[] = ['sqlite', 'postgres']

const pgConnection = () => ({
    host: requireEnv(PG_ENV.HOST),
    port: Number(requireEnv(PG_ENV.PORT)),
    user: requireEnv(PG_ENV.USER),
    password: requireEnv(PG_ENV.PASSWORD),
    database: requireEnv(PG_ENV.DATABASE),
})

function requireEnv(key: string): string {
    const v = process.env[key]
    if (!v) {
        throw new Error(`Postgres test container env var ${key} not set`)
    }
    return v
}

const adminPool = (): pg.Pool => new pg.Pool(pgConnection())

async function createPgDatabase(name: string): Promise<void> {
    const pool = adminPool()
    try {
        await pool.query(`CREATE DATABASE "${name}"`)
    } finally {
        await pool.end()
    }
}

async function dropPgDatabase(name: string): Promise<void> {
    const pool = adminPool()
    try {
        await pool.query(
            `SELECT pg_terminate_backend(pid)
             FROM pg_stat_activity
             WHERE datname = $1 AND pid <> pg_backend_pid()`,
            [name]
        )
        await pool.query(`DROP DATABASE IF EXISTS "${name}"`)
    } finally {
        await pool.end()
    }
}

export interface FreshDb {
    db: Kysely<DB>
    dispose: () => Promise<void>
}

export async function freshDb(dialect: Dialect): Promise<FreshDb> {
    if (dialect === 'sqlite') {
        const db = connection({ connection: { type: 'memory' } })
        return {
            db,
            dispose: async () => {
                await db.destroy()
            },
        }
    }

    const dbName = `mig_${randomUUID().replace(/-/g, '')}`
    await createPgDatabase(dbName)
    const conn = pgConnection()
    const db = connection({
        connection: {
            type: 'postgres',
            host: conn.host,
            port: conn.port,
            user: conn.user,
            password: conn.password,
            database: dbName,
        },
    })
    return {
        db,
        dispose: async () => {
            await db.destroy()
            await dropPgDatabase(dbName)
        },
    }
}

let cachedNames: string[] | undefined

export async function getAllMigrationNames(): Promise<string[]> {
    if (cachedNames) return cachedNames
    const db = connection({ connection: { type: 'memory' } })
    try {
        const m = migrator(db)
        cachedNames = (await m.pending()).map((x) => x.name)
        return cachedNames
    } finally {
        await db.destroy()
    }
}

// Get migration name by 1-based index
export async function migrationName(migrationNumber: number): Promise<string> {
    const names = await getAllMigrationNames()
    const idx = migrationNumber - 1
    if (idx < 0 || idx >= names.length) {
        throw new Error(`Migration index ${migrationNumber} out of bounds`)
    }
    return names[idx]
}

export async function migrateUpTo(
    db: Kysely<DB>,
    name?: string
): Promise<void> {
    const m = migrator(db)
    if (name === undefined) {
        await m.up()
    } else {
        await m.up({ to: name })
    }
}

export async function migrateUpToBefore(
    db: Kysely<DB>,
    target1Based: number
): Promise<void> {
    if (target1Based <= 1) return
    await migrateUpTo(db, await migrationName(target1Based - 1))
}

export async function migrateUpThrough(
    db: Kysely<DB>,
    target1Based: number
): Promise<void> {
    await migrateUpTo(db, await migrationName(target1Based))
}

export async function migrateDownTo(
    db: Kysely<DB>,
    name: string | 0
): Promise<void> {
    const m = migrator(db)
    if (name === 0) {
        await m.down({ to: 0 })
    } else {
        await m.down({ to: name })
    }
}

export async function migrateDownThrough(
    db: Kysely<DB>,
    target1Based: number
): Promise<void> {
    if (target1Based <= 1) {
        await migrateDownTo(db, 0)
        return
    }
    await migrateDownTo(db, await migrationName(target1Based))
}

export function forEachDialect(
    title: string,
    body: (ctx: DialectContext) => void
): void {
    describe.each(SUPPORTED_DIALECTS)(`${title} [%s]`, (dialect) => {
        let current: FreshDb | undefined

        beforeEach(async () => {
            current = await freshDb(dialect)
        })

        afterEach(async () => {
            try {
                await current?.dispose()
            } finally {
                current = undefined
            }
        })

        body({
            dialect,
            getDb: () => {
                if (!current) {
                    throw new Error('getDb() called outside of a test scope')
                }
                return current.db
            },
        })
    })
}

export interface ColumnInfo {
    name: string
    nullable: boolean
}

export async function listColumns(
    db: Kysely<DB>,
    table: string
): Promise<ColumnInfo[]> {
    if (await isPostgres(db)) {
        const res = await sql<{ columnName: string; isNullable: string }>`
            SELECT column_name, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = ${table}
            ORDER BY ordinal_position
        `.execute(db)
        return res.rows.map((r) => ({
            name: r.columnName.toLowerCase(),
            nullable: r.isNullable.toUpperCase() === 'YES',
        }))
    }
    const res = await sql<{ name: string; notnull: number }>`
        SELECT name, "notnull" FROM pragma_table_info(${table})
    `.execute(db)
    return res.rows.map((r) => ({
        name: r.name.toLowerCase(),
        nullable: r.notnull === 0,
    }))
}

export async function columnNames(
    db: Kysely<DB>,
    table: string
): Promise<string[]> {
    return (await listColumns(db, table)).map((c) => c.name).sort()
}

export async function hasColumn(
    db: Kysely<DB>,
    table: string,
    column: string
): Promise<boolean> {
    const cols = await columnNames(db, table)
    return cols.includes(column.toLowerCase())
}

export async function tableExists(
    db: Kysely<DB>,
    table: string
): Promise<boolean> {
    if (await isPostgres(db)) {
        const res = await sql<{ exists: boolean }>`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = ${table}
            ) AS exists
        `.execute(db)
        return res.rows[0]?.exists ?? false
    }
    const res = await sql<{ name: string }>`
        SELECT name FROM sqlite_master
        WHERE type = 'table' AND name = ${table}
    `.execute(db)
    return res.rows.length > 0
}

export async function primaryKeyColumns(
    db: Kysely<DB>,
    table: string
): Promise<string[]> {
    if (await isPostgres(db)) {
        const res = await sql<{ columnName: string; position: number }>`
            SELECT a.attname AS column_name,
                   array_position(c.conkey, a.attnum) AS position
            FROM pg_constraint c
            JOIN pg_class t ON t.oid = c.conrelid
            JOIN pg_namespace n ON n.oid = t.relnamespace
            JOIN pg_attribute a
              ON a.attrelid = c.conrelid
             AND a.attnum = ANY (c.conkey)
            WHERE c.contype = 'p'
              AND n.nspname = 'public'
              AND t.relname = ${table}
            ORDER BY position
        `.execute(db)
        return res.rows.map((r) => r.columnName.toLowerCase())
    }
    const res = await sql<{ name: string; pk: number }>`
        SELECT name, pk FROM pragma_table_info(${table})
        WHERE pk > 0
        ORDER BY pk
    `.execute(db)
    return res.rows.map((r) => r.name.toLowerCase())
}

export async function indexExists(
    db: Kysely<DB>,
    table: string,
    indexName: string
): Promise<boolean> {
    const name = indexName.toLowerCase()
    const tbl = table.toLowerCase()
    if (await isPostgres(db)) {
        const res = await sql<{ exists: boolean }>`
            SELECT EXISTS (
                SELECT 1 FROM pg_indexes
                WHERE schemaname = 'public'
                  AND lower(tablename) = ${tbl}
                  AND lower(indexname) = ${name}
            ) AS exists
        `.execute(db)
        return res.rows[0]?.exists ?? false
    }
    const res = await sql<{ name: string }>`
        SELECT name FROM sqlite_master
        WHERE type = 'index'
          AND lower(tbl_name) = ${tbl}
          AND lower(name) = ${name}
    `.execute(db)
    return res.rows.length > 0
}
