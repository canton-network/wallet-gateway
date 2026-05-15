// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi } from 'vitest'
import pino, { Logger } from 'pino'
import { consecutive, once, sink } from 'pino-test'
import { NotificationService } from './NotificationService.js'

describe('NotificationService', () => {
    let mockLogger: Logger
    let logStream: ReturnType<typeof sink>

    beforeEach(() => {
        logStream = sink()
        mockLogger = pino({ level: 'debug' }, logStream) as Logger
    })

    it('creates a notifier for a new notifierId', () => {
        const service = new NotificationService(mockLogger)

        const notifier = service.getNotifier('user-1')

        expect(notifier).toBeDefined()
        expect(typeof notifier.on).toBe('function')
        expect(typeof notifier.emit).toBe('function')
        expect(typeof notifier.removeListener).toBe('function')
    })

    it('returns the same notifier instance for the same notifierId', () => {
        const service = new NotificationService(mockLogger)

        const notifier1 = service.getNotifier('user-1')
        const notifier2 = service.getNotifier('user-1')

        expect(notifier1).toBe(notifier2)
    })

    it('returns different notifier instances for different notifierIds', () => {
        const service = new NotificationService(mockLogger)

        const notifier1 = service.getNotifier('user-1')
        const notifier2 = service.getNotifier('user-2')

        expect(notifier1).not.toBe(notifier2)
    })

    it('calls listeners when an event is emitted', () => {
        const service = new NotificationService(mockLogger)
        const notifier = service.getNotifier('user-1')

        const listener = vi.fn()
        notifier.on('txChanged', listener)

        const result = notifier.emit('txChanged', { id: 123 })

        expect(result).toBe(true)
        expect(listener).toHaveBeenCalledTimes(1)
        expect(listener).toHaveBeenCalledWith({ id: 123 })
    })

    it('returns false when emitting an event with no listeners', async () => {
        const service = new NotificationService(mockLogger)
        const notifier = service.getNotifier('user-1')

        const result = notifier.emit('unknown-event')

        expect(result).toBe(false)
        await once(logStream, {
            level: 20,
            event: 'unknown-event',
            args: [],
            msg: 'Notifier emitted event: unknown-event for user-1',
        })
    })

    it('logs every emitted event', async () => {
        const service = new NotificationService(mockLogger)
        const notifier = service.getNotifier('user-1')

        notifier.emit('txChanged', { id: 123 })

        await once(logStream, {
            level: 20,
            event: 'txChanged',
            args: [{ id: 123 }],
            msg: 'Notifier emitted event: txChanged for user-1',
        })
    })

    it('removes listeners with removeListener', () => {
        const service = new NotificationService(mockLogger)
        const notifier = service.getNotifier('user-1')

        const listener = vi.fn()

        notifier.on('txChanged', listener)
        notifier.removeListener('txChanged', listener)

        const result = notifier.emit('txChanged', { id: 123 })

        expect(result).toBe(false)
        expect(listener).not.toHaveBeenCalled()
    })

    it('keeps listeners isolated between notifiers', () => {
        const service = new NotificationService(mockLogger)

        const notifier1 = service.getNotifier('user-1')
        const notifier2 = service.getNotifier('user-2')

        const listener1 = vi.fn()
        const listener2 = vi.fn()

        notifier1.on('txChanged', listener1)
        notifier2.on('txChanged', listener2)

        notifier1.emit('txChanged', { id: 1 })

        expect(listener1).toHaveBeenCalledWith({ id: 1 })
        expect(listener2).not.toHaveBeenCalled()
    })

    it('logs with the correct notifierId for each notifier', async () => {
        const service = new NotificationService(mockLogger)

        const notifier1 = service.getNotifier('user-1')
        const notifier2 = service.getNotifier('user-2')

        notifier1.emit('txChanged')
        notifier2.emit('statusChanged')

        await consecutive(logStream, [
            {
                level: 20,
                event: 'txChanged',
                args: [],
                msg: 'Notifier emitted event: txChanged for user-1',
            },
            {
                level: 20,
                event: 'statusChanged',
                args: [],
                msg: 'Notifier emitted event: statusChanged for user-2',
            },
        ])
    })
})
