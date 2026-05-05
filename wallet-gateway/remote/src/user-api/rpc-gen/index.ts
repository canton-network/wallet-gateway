// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { AddNetwork } from './typings.js'
import { RemoveNetwork } from './typings.js'
import { ListNetworks } from './typings.js'
import { AddIdp } from './typings.js'
import { RemoveIdp } from './typings.js'
import { ListIdps } from './typings.js'
import { CreateWallet } from './typings.js'
import { AllocatePartyForWallet } from './typings.js'
import { SetPrimaryWallet } from './typings.js'
import { RemoveWallet } from './typings.js'
import { ListWallets } from './typings.js'
import { SyncWallets } from './typings.js'
import { IsWalletSyncNeeded } from './typings.js'
import { Sign } from './typings.js'
import { SignMessage } from './typings.js'
import { GetMessageToSign } from './typings.js'
import { ListMessagesToSign } from './typings.js'
import { DeleteMessageToSign } from './typings.js'
import { Execute } from './typings.js'
import { AddSession } from './typings.js'
import { RemoveSession } from './typings.js'
import { ListSessions } from './typings.js'
import { GetTransaction } from './typings.js'
import { ListTransactions } from './typings.js'
import { DeleteTransaction } from './typings.js'
import { GetUser } from './typings.js'

export type Methods = {
    addNetwork: AddNetwork
    removeNetwork: RemoveNetwork
    listNetworks: ListNetworks
    addIdp: AddIdp
    removeIdp: RemoveIdp
    listIdps: ListIdps
    createWallet: CreateWallet
    allocatePartyForWallet: AllocatePartyForWallet
    setPrimaryWallet: SetPrimaryWallet
    removeWallet: RemoveWallet
    listWallets: ListWallets
    syncWallets: SyncWallets
    isWalletSyncNeeded: IsWalletSyncNeeded
    sign: Sign
    signMessage: SignMessage
    getMessageToSign: GetMessageToSign
    listMessagesToSign: ListMessagesToSign
    deleteMessageToSign: DeleteMessageToSign
    execute: Execute
    addSession: AddSession
    removeSession: RemoveSession
    listSessions: ListSessions
    getTransaction: GetTransaction
    listTransactions: ListTransactions
    deleteTransaction: DeleteTransaction
    getUser: GetUser
}

function buildController(methods: Methods) {
    return {
        addNetwork: methods.addNetwork,
        removeNetwork: methods.removeNetwork,
        listNetworks: methods.listNetworks,
        addIdp: methods.addIdp,
        removeIdp: methods.removeIdp,
        listIdps: methods.listIdps,
        createWallet: methods.createWallet,
        allocatePartyForWallet: methods.allocatePartyForWallet,
        setPrimaryWallet: methods.setPrimaryWallet,
        removeWallet: methods.removeWallet,
        listWallets: methods.listWallets,
        syncWallets: methods.syncWallets,
        isWalletSyncNeeded: methods.isWalletSyncNeeded,
        sign: methods.sign,
        signMessage: methods.signMessage,
        getMessageToSign: methods.getMessageToSign,
        listMessagesToSign: methods.listMessagesToSign,
        deleteMessageToSign: methods.deleteMessageToSign,
        execute: methods.execute,
        addSession: methods.addSession,
        removeSession: methods.removeSession,
        listSessions: methods.listSessions,
        getTransaction: methods.getTransaction,
        listTransactions: methods.listTransactions,
        deleteTransaction: methods.deleteTransaction,
        getUser: methods.getUser,
    }
}

export default buildController
