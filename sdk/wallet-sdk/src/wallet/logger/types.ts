// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { PartyId } from '@canton-network/core-types'
import CustomLogAdapter from './adapter/custom.js'
import { SDKLogger } from './logger.js' // eslint-disable-line @typescript-eslint/no-unused-vars -- for JSDoc only

/**
 * Contextual metadata for log entries.
 *
 * @property namespace Optional string used to categorize or scope log messages.
 *   When provided, it is included in the log output to indicate the logical module or feature
 *   from which the log originates. For example, in ConsoleLogAdapter and PinoLogAdapter,
 *   the namespace is prepended to the log message, helping to distinguish logs from different
 *   parts of the application and making log filtering and analysis easier.
 *   It is recommended to use {@link SDKLogger['child']} to set the namespace for each logger instance.
 * @property timestamp Optional timestamp for the log entry. This is provided by default by the logger implementation.
 * @property response Optional response data to include in the log.
 * @property traceId Optional trace identifier for correlating logs across systems.
 * @property partyId Optional party identifier for domain-specific context.
 * @property [data: string] Any additional custom metadata fields.
 */
export type LogContext = Partial<{
    namespace: string
    timestamp: string
    response: unknown
    traceId: string
    partyId: PartyId
    [data: string]: unknown
}>

/**
 * The only allowed log level methods for logging.
 *
 * Only these levels are supported by the logger and adapters.
 */
const LOG_LEVELS_TUPLE = [
    'debug',
    'error',
    'info',
    'warn',
    'trace',
] as const satisfies readonly (keyof Console)[]

export type LogLevel = (typeof LOG_LEVELS_TUPLE)[number]
export const logLevels = new Set(LOG_LEVELS_TUPLE)

export type LoggerMethods = {
    [K in LogLevel]: {
        (message: string): void
        (ctx: LogContext, message?: string): void
    }
}

export interface LogAdapter {
    log(type: LogLevel, ctx: LogContext, message?: string): void
}

export type DefaultLogAdapters = 'console' | 'pino'
export type AllowedLogAdapters = DefaultLogAdapters | CustomLogAdapter
