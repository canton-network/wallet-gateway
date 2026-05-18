// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { pino } from 'pino'
import { sink } from 'pino-test'
import { rpcErrors, toHttpErrorCode } from '@canton-network/core-rpc-errors'
import { handleRpcError, jsonRpcHandler } from './jsonRpcHandler.js'

describe.skip('jsonRpcHandler', () => {
    const logger = pino({ level: 'silent' }, sink())

    type TestController = {
        resolve: (params?: unknown) => Promise<string>
        reject: (params?: unknown) => Promise<never>
        rpcError: (params?: unknown) => Promise<never>
    }

    const resolve = vi.fn(async () => 'response')
    const reject = vi.fn(async () => {
        throw new Error('error')
    })
    const rpcError = vi.fn(async () => {
        throw rpcErrors.invalidParams({ message: 'bad params' })
    })

    beforeEach(() => {
        resolve.mockClear()
        reject.mockClear()
        rpcError.mockClear()
    })

    function makeHandler() {
        return jsonRpcHandler<TestController>({
            controller: { resolve, reject, rpcError },
            logger,
        })
    }

    function makeRes() {
        const res = {
            status: vi.fn(),
            json: vi.fn(),
        }

        // Express response methods are chainable, like `res.status(500).json(body)`
        // Make the mocked status() return this fake res object so .json() can be called after it.
        res.status.mockReturnValue(res)

        return res as unknown as Response & {
            status: ReturnType<typeof vi.fn>
            json: ReturnType<typeof vi.fn>
        }
    }

    it('delegates to next() if method is not POST', () => {
        const handler = makeHandler()
        const next = vi.fn()
        const res = makeRes()
        const req = {
            method: 'GET',
            body: {},
        } as unknown as Request

        handler(req, res, next)

        expect(next).toHaveBeenCalledOnce()
        expect(res.status).not.toHaveBeenCalled()
    })

    it('responds with invalid request when body is not valid JSON-RPC 2.0', async () => {
        const handler = makeHandler()
        const next = vi.fn()
        const res = makeRes()
        const req = {
            method: 'POST',
            body: { jsonrpc: '1.0', method: 'resolve', id: 1 },
        } as unknown as Request

        handler(req, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalled()
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                jsonrpc: '2.0',
                id: null,
                error: expect.objectContaining({
                    code: expect.any(Number),
                }),
            })
        )
    })

    it('returns method not found when controller has no such method', async () => {
        const handler = makeHandler()
        const next = vi.fn()
        const res = makeRes()
        const req = {
            method: 'POST',
            body: {
                jsonrpc: '2.0',
                id: 42,
                method: 'missing',
                params: [],
            },
        } as unknown as Request

        handler(req, res, next)

        expect(res.status).toHaveBeenCalled()
        const payload = res.json.mock.calls[0][0]
        expect(payload.id).toBeNull()
        expect(payload.error.message).toContain('missing')
    })

    it('returns JSON-RPC success when the method resolves', async () => {
        const handler = makeHandler()
        const next = vi.fn()
        const res = makeRes()
        const req = {
            method: 'POST',
            body: {
                jsonrpc: '2.0',
                id: 7,
                method: 'ping',
                params: { x: 1 },
            },
            authContext: { userId: 'u', accessToken: 't' },
        } as unknown as Request

        handler(req, res, next)

        expect(resolve).toHaveBeenCalledWith({ x: 1 })
        expect(res.json).toHaveBeenCalledWith({
            jsonrpc: '2.0',
            id: 7,
            result: 'response',
        })
    })

    it('maps thrown Error to JSON-RPC error with HTTP 500', async () => {
        const handler = makeHandler()
        const next = vi.fn()
        const res = makeRes()
        const req = {
            method: 'POST',
            body: {
                jsonrpc: '2.0',
                id: 'rid',
                method: 'wrong_method',
                params: [],
            },
        } as unknown as Request

        handler(req, res, next)

        expect(res.status).toHaveBeenCalledWith(500)
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                jsonrpc: '2.0',
                id: 'id',
                error: expect.objectContaining({
                    message: 'bad params',
                }),
            })
        )
    })

    it('maps JsonRpcError to the corresponding HTTP status', async () => {
        const handler = makeHandler()
        const next = vi.fn()
        const res = makeRes()
        const req = {
            method: 'POST',
            body: {
                jsonrpc: '2.0',
                id: 0,
                method: 'rpcBoom',
                params: [],
            },
        } as unknown as Request

        handler(req, res, next)

        expect(res.status).not.toHaveBeenCalledWith(500)
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                jsonrpc: '2.0',
                id: 0,
                error: expect.objectContaining({
                    message: 'bad params',
                }),
            })
        )
    })
})
describe('handleRpcError', () => {
    const logger = pino({ level: 'silent' }, sink())
    const errorLog = vi.spyOn(logger, 'error')

    it('maps JsonRpcError to HTTP status from toHttpErrorCode and does not log RPC response as error', () => {
        const err = rpcErrors.invalidParams({ message: 'bad' })
        const [status, body] = handleRpcError(err, 99, logger, 'whateverMethod')

        expect(status).toBe(toHttpErrorCode(err.code))
        expect(status).toBe(400)
        expect(body).toEqual({
            jsonrpc: '2.0',
            id: 99,
            error: err,
        })
        expect(errorLog).not.toHaveBeenCalled()
    })

    it('uses generic method-specific message for non-JsonRpcError then replaces with Error.message', () => {
        const [status, body] = handleRpcError(
            new Error('some error'),
            'id',
            logger,
            'submit'
        )

        expect(status).toBe(500)
        expect(body).toEqual({
            jsonrpc: '2.0',
            id: 'id',
            error: expect.objectContaining({
                code: rpcErrors.internal().code,
                message: 'some error',
                data: expect.any(Error),
            }),
        })
        expect(errorLog).toHaveBeenCalledOnce()
    })

    it('uses generic message when method name is omitted', () => {
        const [status, body] = handleRpcError(new Error('x'), null, logger)

        expect(status).toBe(500)
        expect(body.error).toMatchObject({
            message: 'x',
        })
    })

    it('maps string errors to the error message', () => {
        const [status, body] = handleRpcError('plain', 0, logger)

        expect(status).toBe(500)
        expect(body.error).toMatchObject({
            message: 'plain',
        })
    })

    it('accepts a full ErrorResponse object when safeParse succeeds', () => {
        const custom = {
            error: {
                code: -32000,
                message: 'from client',
                data: { hint: 1 },
            },
        }
        const [status, body] = handleRpcError(custom, 3, logger)

        expect(status).toBe(500)
        expect(body).toEqual({
            jsonrpc: '2.0',
            id: 3,
            error: custom.error,
        })
    })

    it('maps JsCantonError objects to internal code with cause as message', () => {
        const ledgerErr = {
            code: 'CODE',
            cause: 'something went wrong',
        }
        const [status, body] = handleRpcError(ledgerErr, null, logger)

        expect(status).toBe(500)
        expect(body.error).toMatchObject({
            code: rpcErrors.internal().code,
            message: 'something went wrong',
            data: ledgerErr,
        })
    })

    it('falls back to generic internal error for unknown payloads', () => {
        const [status, body] = handleRpcError(
            { foo: 'bar' },
            2,
            logger,
            'wrongMethod'
        )

        expect(status).toBe(500)
        expect(body.error).toMatchObject({
            code: rpcErrors.internal().code,
            message: 'Something went wrong while calling wrongMethod',
            data: { foo: 'bar' },
        })
    })
})
