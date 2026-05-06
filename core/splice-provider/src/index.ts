// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { RequestArgs, UnknownRpcTypes } from '@canton-network/core-types'

export type EventListener<T> = (...args: T[]) => void

/**
 * The Provider interface is generic over a type `T` that defines a mapping between supported methods
 * and their corresponding request and response types. The request method takes an argument of type RequestArgs<T, M>,
 * where `M` is a key of `T` representing the method being called.
 *
 * The type of the params body for a method `M` is derived from T[M]['params']
 * The type of the result of calling a method `M` is derived from T[M]['result']
 */
export interface Provider<T extends UnknownRpcTypes> {
    request<M extends keyof T>(args: RequestArgs<T, M>): Promise<T[M]['result']>

    on<E>(event: string, listener: EventListener<E>): Provider<T>
    emit<E>(event: string, ...args: E[]): boolean
    removeListener<E>(
        event: string,
        listenerToRemove: EventListener<E>
    ): Provider<T>
}

/**
 * An abstract base class for Providers that implements the event handling logic. It maintains a mapping of event names to arrays of listeners and provides methods to register, emit, and remove listeners. The request method is left abstract for subclasses to implement according to their specific RPC transport mechanism.
 */
export abstract class AbstractProvider<
    T extends UnknownRpcTypes,
> implements Provider<T> {
    listeners: { [event: string]: EventListener<unknown>[] }

    constructor() {
        this.listeners = {} // Event listeners
    }

    abstract request<M extends keyof T>(
        args: RequestArgs<T, M>
    ): Promise<T[M]['result']>

    // Event handling
    public on<E>(event: string, listener: EventListener<E>): Provider<T> {
        if (!this.listeners[event]) {
            this.listeners[event] = []
        }
        const listeners = this.listeners[event] as EventListener<E>[]
        listeners.push(listener)

        return this
    }

    public emit<E>(event: string, ...args: E[]): boolean {
        if (this.listeners[event]) {
            this.listeners[event].forEach((listener) => listener(...args))
            return true
        }
        return false
    }

    public removeListener<E>(
        event: string,
        listenerToRemove: EventListener<E>
    ): Provider<T> {
        if (!this.listeners[event]) return this

        this.listeners[event] = this.listeners[event].filter(
            (listener) => listener !== listenerToRemove
        )

        return this
    }
}
