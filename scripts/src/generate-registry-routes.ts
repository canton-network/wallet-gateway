// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Generates typed route files for the TestToken registry server from the four
 * Token Standard OpenAPI specs located in api-specs/splice/0.6.1/.
 *
 * For each spec it produces a `routes.ts` in the corresponding feature-slice directory:
 *   features/metadata/routes.ts              ← token-metadata-v1.yaml
 *   features/transfer/routes.ts              ← transfer-instruction-v1.yaml
 *   features/allocation-instruction/routes.ts← allocation-instruction-v1.yaml
 *   features/allocation/routes.ts            ← allocation-v1.yaml
 *
 * Each generated file contains:
 *   • TypeScript types derived from components.schemas
 *   • A typed handler interface (one method per OpenAPI operation)
 *   • A registerXxxRoutes(route, respond, handlers) function
 *
 * The implementation (handler logic) lives in the manually maintained handlers.ts
 * files beside each generated routes.ts.
 */

import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '../..')
const specsDir = path.join(repoRoot, 'api-specs/splice/0.6.1')
const featuresDir = path.join(
    repoRoot,
    'docs/wallet-integration-guide/examples/scripts/15-multi-sync/_registry/features'
)

// ── Raw OpenAPI types (only the subset we need) ───────────────────────────────

interface JsonSchema {
    type?: string
    format?: string
    properties?: Record<string, JsonSchema>
    required?: string[]
    items?: JsonSchema
    additionalProperties?: JsonSchema | boolean
    $ref?: string
    default?: unknown
    enum?: string[]
    description?: string
}

interface Parameter {
    name: string
    in: 'path' | 'query' | 'header' | 'cookie'
    required?: boolean
    schema: JsonSchema
    description?: string
}

interface PathItem {
    operationId: string
    description?: string
    parameters?: Parameter[]
    requestBody?: {
        required?: boolean
        content: { 'application/json'?: { schema: JsonSchema } }
    }
    responses: Record<
        string,
        | { content?: { 'application/json'?: { schema: JsonSchema } } }
        | undefined
    >
}

type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch'

interface OpenApiSpec {
    paths: Record<string, Partial<Record<HttpMethod, PathItem>>>
    components: {
        schemas: Record<string, JsonSchema>
    }
}

// ── Generator configuration ───────────────────────────────────────────────────

interface SpecConfig {
    specFile: string
    outDir: string
    handlerName: string
    registerFn: string
    /** operationIds whose handler may return null, triggering a 404. */
    nullableOps: string[]
}

const SPEC_CONFIGS: SpecConfig[] = [
    {
        specFile: 'token-metadata-v1.yaml',
        outDir: path.join(featuresDir, 'metadata'),
        handlerName: 'MetadataHandlers',
        registerFn: 'registerMetadataRoutes',
        nullableOps: ['getInstrument'],
    },
    {
        specFile: 'transfer-instruction-v1.yaml',
        outDir: path.join(featuresDir, 'transfer'),
        handlerName: 'TransferHandlers',
        registerFn: 'registerTransferRoutes',
        nullableOps: ['getTransferFactory'],
    },
    {
        specFile: 'allocation-instruction-v1.yaml',
        outDir: path.join(featuresDir, 'allocation-instruction'),
        handlerName: 'AllocationInstructionHandlers',
        registerFn: 'registerAllocationInstructionRoutes',
        nullableOps: ['getAllocationFactory'],
    },
    {
        specFile: 'allocation-v1.yaml',
        outDir: path.join(featuresDir, 'allocation'),
        handlerName: 'AllocationHandlers',
        registerFn: 'registerAllocationRoutes',
        nullableOps: [],
    },
]

// ── Schema → TypeScript conversion ────────────────────────────────────────────

function refName(ref: string): string {
    return ref.split('/').pop()!
}

/** Convert an inline JSON Schema to a TypeScript type expression. */
function schemaToTs(schema: JsonSchema): string {
    if (schema.$ref) return refName(schema.$ref)

    if (schema.enum) {
        return schema.enum.map((v) => `'${v}'`).join(' | ')
    }

    if (schema.type === 'object') {
        if (schema.additionalProperties) {
            if (typeof schema.additionalProperties === 'boolean')
                return 'Record<string, unknown>'
            return `Record<string, ${schemaToTs(schema.additionalProperties)}>`
        }
        if (!schema.properties || Object.keys(schema.properties).length === 0) {
            return 'Record<string, never>'
        }
        const props = Object.entries(schema.properties).map(([k, v]) => {
            const isReq = schema.required?.includes(k) ?? false
            return `${k}${isReq ? '' : '?'}: ${schemaToTs(v)}`
        })
        return `{ ${props.join('; ')} }`
    }

    if (schema.type === 'array') {
        return schema.items ? `${schemaToTs(schema.items)}[]` : 'unknown[]'
    }

    if (schema.type === 'string') return 'string'
    if (schema.type === 'integer' || schema.type === 'number') return 'number'
    if (schema.type === 'boolean') return 'boolean'
    return 'unknown'
}

/** Generate a named TypeScript type or interface for a top-level schema. */
function generateNamedType(name: string, schema: JsonSchema): string {
    if (schema.$ref) return `export type ${name} = ${refName(schema.$ref)}`

    if (schema.enum) {
        return `export type ${name} = ${schema.enum.map((v) => `'${v}'`).join(' | ')}`
    }

    if (
        schema.type === 'object' &&
        !schema.additionalProperties &&
        schema.properties &&
        Object.keys(schema.properties).length > 0
    ) {
        const props = Object.entries(schema.properties).map(([k, v]) => {
            const isReq = schema.required?.includes(k) ?? false
            return `    ${k}${isReq ? '' : '?'}: ${schemaToTs(v)}`
        })
        return `export interface ${name} {\n${props.join('\n')}\n}`
    }

    return `export type ${name} = ${schemaToTs(schema)}`
}

function generateSchemaTypes(schemas: Record<string, JsonSchema>): string {
    return Object.entries(schemas)
        .map(([name, schema]) => generateNamedType(name, schema))
        .join('\n\n')
}

// ── Operation extraction ──────────────────────────────────────────────────────

interface OperationInfo {
    operationId: string
    method: string
    oasPath: string
    routerPath: string
    pathParams: Parameter[]
    queryParams: Parameter[]
    bodySchema: JsonSchema | null
    responseSchema: JsonSchema | null
}

function extractOperations(spec: OpenApiSpec): OperationInfo[] {
    const ops: OperationInfo[] = []
    for (const [oasPath, pathItem] of Object.entries(spec.paths)) {
        for (const method of [
            'get',
            'post',
            'put',
            'delete',
            'patch',
        ] as HttpMethod[]) {
            const op = pathItem[method]
            if (!op) continue
            const routerPath = oasPath.replace(/\{([^}]+)\}/g, ':$1')
            const pathParams = (op.parameters ?? []).filter(
                (p) => p.in === 'path'
            )
            const queryParams = (op.parameters ?? []).filter(
                (p) => p.in === 'query'
            )
            const bodySchema =
                op.requestBody?.content['application/json']?.schema ?? null
            const response200 = op.responses['200']
            const responseSchema =
                response200?.content?.['application/json']?.schema ?? null
            ops.push({
                operationId: op.operationId,
                method: method.toUpperCase(),
                oasPath,
                routerPath,
                pathParams,
                queryParams,
                bodySchema,
                responseSchema,
            })
        }
    }
    return ops
}

// ── Handler interface generation ──────────────────────────────────────────────

function operationToHandlerMethod(
    op: OperationInfo,
    nullable: boolean
): string {
    const args: string[] = []

    if (op.pathParams.length > 0) {
        const fields = op.pathParams
            .map((p) => `${p.name}: ${schemaToTs(p.schema)}`)
            .join('; ')
        args.push(`path: { ${fields} }`)
    }

    if (op.queryParams.length > 0) {
        const fields = op.queryParams
            .map((p) => `${p.name}?: ${schemaToTs(p.schema)}`)
            .join('; ')
        args.push(`query?: { ${fields} }`)
    }

    if (op.bodySchema) {
        args.push(`body: ${schemaToTs(op.bodySchema)}`)
    }

    const retBase = op.responseSchema ? schemaToTs(op.responseSchema) : 'void'
    const ret = nullable ? `${retBase} | null` : retBase
    return `    ${op.operationId}(${args.join(', ')}): ${ret} | Promise<${ret}>`
}

function generateHandlerInterface(
    name: string,
    ops: OperationInfo[],
    nullableOps: string[]
): string {
    const methods = ops.map((op) =>
        operationToHandlerMethod(op, nullableOps.includes(op.operationId))
    )
    return `export interface ${name} {\n${methods.join('\n')}\n}`
}

// ── Route registration generation ─────────────────────────────────────────────

function generateRouteBody(op: OperationInfo, nullable: boolean): string {
    const callArgs: string[] = []

    if (op.pathParams.length > 0) {
        const fields = op.pathParams
            .map((p) => `${p.name}: params['${p.name}']!`)
            .join(', ')
        callArgs.push(`{ ${fields} }`)
    }

    if (op.queryParams.length > 0) {
        // Query param extraction — callers may parse req.url for actual values if needed.
        callArgs.push('{}')
    }

    if (op.bodySchema) {
        callArgs.push(`body as ${schemaToTs(op.bodySchema)}`)
    }

    const call = `handlers.${op.operationId}(${callArgs.join(', ')})`

    if (nullable) {
        const errDetail =
            op.pathParams.length > 0
                ? `${op.pathParams.map((p) => `${p.name}=\${params['${p.name}']}`).join(', ')} not found`
                : 'not found'
        return [
            `        const result = await ${call}`,
            `        if (result === null) {`,
            `            respond(res, 404, { error: \`${op.operationId}: ${errDetail}\` })`,
            `        } else {`,
            `            respond(res, 200, result)`,
            `        }`,
        ].join('\n')
    }

    return `        respond(res, 200, await ${call})`
}

function generateRegisterFunction(
    fnName: string,
    handlerName: string,
    ops: OperationInfo[],
    nullableOps: string[]
): string {
    const body = ops
        .map((op) => {
            const hasBody = !!op.bodySchema
            const hasPathParams = op.pathParams.length > 0
            const reqName = '_req'
            const bodyName = hasBody ? 'body' : '_body'
            const paramsName = hasPathParams ? 'params' : '_params'
            return [
                `    // ${op.method} ${op.oasPath} → ${op.operationId}`,
                `    route('${op.method}', '${op.routerPath}', async (${reqName}, res, ${bodyName}, ${paramsName}) => {`,
                generateRouteBody(op, nullableOps.includes(op.operationId)),
                `    })`,
            ].join('\n')
        })
        .join('\n\n')

    return [
        `export function ${fnName}(`,
        `    route: (method: string, pattern: string, handler: RouteHandler) => void,`,
        `    respond: (res: ServerResponse, status: number, body: unknown) => void,`,
        `    handlers: ${handlerName}`,
        `): void {`,
        body,
        `}`,
    ].join('\n')
}

// ── File assembly ─────────────────────────────────────────────────────────────

const FILE_HEADER = `\
// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0
//
// DO NOT EDIT — generated by scripts/src/generate-registry-routes.ts`

function generateRoutesFile(
    spec: OpenApiSpec,
    specFile: string,
    cfg: SpecConfig
): string {
    const ops = extractOperations(spec)
    const schemaSection = generateSchemaTypes(spec.components.schemas)
    const handlerSection = generateHandlerInterface(
        cfg.handlerName,
        ops,
        cfg.nullableOps
    )
    const registerSection = generateRegisterFunction(
        cfg.registerFn,
        cfg.handlerName,
        ops,
        cfg.nullableOps
    )

    return [
        FILE_HEADER,
        `// Source: api-specs/splice/0.6.1/${specFile}`,
        '',
        `import type { ServerResponse } from 'node:http'`,
        `import type { RouteHandler } from '../../http/router.js'`,
        '',
        '// ── Schema types (generated from components.schemas) ─────────────────────────',
        schemaSection,
        '',
        '// ── Handler interface ────────────────────────────────────────────────────────',
        handlerSection,
        '',
        '// ── Route registration ───────────────────────────────────────────────────────',
        registerSection,
        '',
    ].join('\n')
}

// ── Entry point ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
    let generated = 0
    for (const cfg of SPEC_CONFIGS) {
        const specPath = path.join(specsDir, cfg.specFile)
        if (!fs.existsSync(specPath)) {
            console.warn(`  SKIP  ${cfg.specFile} (not found at ${specPath})`)
            continue
        }
        const spec = yaml.load(fs.readFileSync(specPath, 'utf8')) as OpenApiSpec

        const output = generateRoutesFile(spec, cfg.specFile, cfg)
        const outFile = path.join(cfg.outDir, 'routes.ts')

        fs.mkdirSync(cfg.outDir, { recursive: true })
        fs.writeFileSync(outFile, output, 'utf8')
        console.log(`  OK    ${path.relative(repoRoot, outFile)}`)
        generated++
    }
    console.log(`\nGenerated ${generated} file(s).`)
}

main().catch((err: unknown) => {
    console.error(err)
    process.exit(1)
})
