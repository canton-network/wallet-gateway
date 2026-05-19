import { GenerateTransactionResponse } from '@canton-network/core-ledger-client'
import { KeyPair } from '@canton-network/core-signing-lib'
import { SDKInterface } from '@canton-network/wallet-sdk'
import pino from 'pino'

export type TransferTestScriptParameters = {
    sdk: SDKInterface<'amulet' | 'token'>
    sender: GenerateTransactionResponse
    receiver: GenerateTransactionResponse
    senderKeys: KeyPair
    receiverKeys: KeyPair
    logger: pino.Logger
}
