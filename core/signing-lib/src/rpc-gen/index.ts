// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { SignTransaction } from './typings.js'
import { SignMessage } from './typings.js'
import { GetTransaction } from './typings.js'
import { GetTransactions } from './typings.js'
import { GetKeys } from './typings.js'
import { CreateKey } from './typings.js'
import { GetConfiguration } from './typings.js'
import { SetConfiguration } from './typings.js'
import { SubscribeTransactions } from './typings.js'

export type Methods = {
    signTransaction: SignTransaction
    signMessage: SignMessage
    getTransaction: GetTransaction
    getTransactions: GetTransactions
    getKeys: GetKeys
    createKey: CreateKey
    getConfiguration: GetConfiguration
    setConfiguration: SetConfiguration
    subscribeTransactions: SubscribeTransactions
}

function buildController(methods: Methods) {
    return {
        signTransaction: methods.signTransaction,
        signMessage: methods.signMessage,
        getTransaction: methods.getTransaction,
        getTransactions: methods.getTransactions,
        getKeys: methods.getKeys,
        createKey: methods.createKey,
        getConfiguration: methods.getConfiguration,
        setConfiguration: methods.setConfiguration,
        subscribeTransactions: methods.subscribeTransactions,
    }
}

export default buildController
