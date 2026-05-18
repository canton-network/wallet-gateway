// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { NextFunction, Request, Response } from 'express'
import { Logger } from 'pino'
import {
    JsonRpcError,
    rpcErrors,
    toHttpErrorCode,
} from '@canton-network/core-rpc-errors'
import {
    ErrorResponse,
    JsonRpcRequest,
    JsonRpcResponse,
} from '@canton-network/core-types'
import { jsonRpcResponse } from '@canton-network/core-rpc-transport'
import { isJsCantonError } from '@canton-network/core-ledger-client'

interface JsonRpcHttpOptions<T> {
    logger: Logger
    controller: T
}

/**
 * Handles JSON-RPC errors and maps them to HTTP responses.
 * @param error The error that occurred.
 * @param id The JSON-RPC request ID.
 * @param logger The logger instance.
 * @param method The name of the JSON-RPC method being called.
 * @returns A tuple containing the HTTP status code and the JSON-RPC response.
 */
export const handleRpcError = (
    error: unknown,
    id: string | number | null,
    logger: Logger,
    method?: string
): [number, JsonRpcResponse] => {
    const genericMessage = method
        ? `Something went wrong while calling ${method}`
        : 'Something went wrong'

    let response: ErrorResponse = {
        error: {
            ...rpcErrors.internal(),
            message: genericMessage,
            data: error,
        },
    }

    if (error instanceof JsonRpcError) {
        response.error = error
        const httpCode = toHttpErrorCode(error.code)
        return [httpCode, jsonRpcResponse(id, response)]
    }

    if (isJsCantonError(error)) {
        response.error = {
            code: rpcErrors.internal().code,
            message: error.cause,
            data: error,
        }
    }

    if (error instanceof Error) {
        response.error.message = error.message
    } else if (typeof error === 'string') {
        response.error.message = error
    } else if (ErrorResponse.safeParse(error).success) {
        response = error as ErrorResponse
    } else if (
        // Check for a Ledger API error format
        typeof error === 'object' &&
        error !== null &&
        'cause' in error &&
        'code' in error
    ) {
        response.error.message = error.cause as string
        response.error.data = error
    }

    const jsonResponse = jsonRpcResponse(id, response)
    logger.error(jsonResponse, 'RPC response')

    return [500, jsonResponse]
}

export const jsonRpcHandler =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <T extends Record<string, (...args: any[]) => any>>({
        controller,
        logger: _logger,
    }: JsonRpcHttpOptions<T>) => {
        const logger = _logger.child({ component: 'json-rpc-http' })

        type Params = Parameters<T[keyof T]>[0]
        type Returns = ReturnType<T[keyof T]>

        return (req: Request, res: Response, next: NextFunction) => {
            if (req.method !== 'POST') {
                return next()
            }

            const parsed = JsonRpcRequest.safeParse(req.body)

            if (!parsed.success) {
                logger.error(
                    {
                        request: req.body,
                        error: parsed.error,
                    },
                    'RPC request: Invalid request format'
                )

                const [status, response] = handleRpcError(
                    rpcErrors.invalidRequest({
                        message: 'Invalid JSON-RPC request format',
                    }),
                    null,
                    logger
                )

                return res.status(status).json(response)
            } else {
                const { method, params, id = null } = parsed.data

                logger.debug(
                    {
                        request: {
                            id: id,
                            method: method,
                            params: params,
                            authContext: req.authContext,
                        },
                    },
                    `RPC request: ${method}`
                )

                const methodFn = controller[method as keyof T] as (
                    params?: Params
                ) => Returns
                if (!methodFn) {
                    const [status, response] = handleRpcError(
                        rpcErrors.methodNotFound({
                            message: `Method ${method} not found`,
                        }),
                        null,
                        logger,
                        method
                    )

                    return res.status(status).json(response)
                }

                // TODO: validate params match the expected schema for the method
                methodFn(params as Params)
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .then((result: any) => {
                        const response = jsonRpcResponse(id, { result })
                        logger.debug(response, 'RPC response')
                        res.json(response)
                    })
                    .catch((error: unknown) => {
                        const [status, response] = handleRpcError(
                            error,
                            id,
                            logger,
                            method
                        )
                        logger.error(response, 'RPC response')
                        res.status(status).json(response)
                    })
            }
        }
    }
