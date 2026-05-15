// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from 'vitest'
import { pino } from 'pino'
import { sink } from 'pino-test'
import { rpcErrors, toHttpErrorCode } from '@canton-network/core-rpc-errors'
import { handleRpcError } from './jsonRpcHandler.js'

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
