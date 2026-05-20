// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 *
 * The unique identifier of the command associated with the transaction.
 *
 */
export type CommandId = string
type AlwaysTrue = any
/**
 *
 * Inner shape is defined by the Canton Ledger API CreateCommand schema; do not re-specify here.
 *
 */
export interface CreateCommandPayload {
    [key: string]: any
}
export interface CreateCommand {
    CreateCommand: CreateCommandPayload
}
/**
 *
 * Inner shape is defined by the Canton Ledger API ExerciseCommand schema; do not re-specify here.
 *
 */
export interface ExerciseCommandPayload {
    [key: string]: any
}
export interface ExerciseCommand {
    ExerciseCommand: ExerciseCommandPayload
}
/**
 *
 * Inner shape is defined by the Canton Ledger API CreateAndExerciseCommand schema; do not re-specify here.
 *
 */
export interface CreateAndExerciseCommandPayload {
    [key: string]: any
}
export interface CreateAndExerciseCommand {
    CreateAndExerciseCommand: CreateAndExerciseCommandPayload
}
/**
 *
 * Inner shape is defined by the Canton Ledger API ExerciseByKeyCommand schema; do not re-specify here.
 *
 */
export interface ExerciseByKeyCommandPayload {
    [key: string]: any
}
export interface ExerciseByKeyCommand {
    ExerciseByKeyCommand: ExerciseByKeyCommandPayload
}
/**
 *
 * A Daml command atom. Mirror of the Canton Ledger API Command union; inner shapes are intentionally opaque so the dApp layer never drifts from the Ledger API contract.
 *
 */
export type Command =
    | CreateCommand
    | ExerciseCommand
    | CreateAndExerciseCommand
    | ExerciseByKeyCommand
/**
 *
 * Non-empty array of Daml command atoms to submit atomically as a single transaction.
 *
 */
export type Commands = Command[]
/**
 *
 * The party that signed the transaction.
 *
 */
export type Party = string
/**
 *
 * Set of parties on whose behalf the command should be executed, if submitted. If not set, the primary wallet's party is used.
 *
 */
export type ActAs = Party[]
/**
 *
 * Set of parties that should be granted read access to the command, if submitted. If not set, no additional read parties are granted.
 *
 */
export type ReadAs = Party[]
/**
 *
 * The template identifier of the disclosed contract.
 *
 */
export type TemplateId = string
/**
 *
 * The unique identifier of the disclosed contract.
 *
 */
export type ContractId = string
/**
 *
 * The blob data of the created event for the disclosed contract.
 *
 */
export type CreatedEventBlob = string
/**
 *
 * If not set, a suitable synchronizer that this node is connected to will be chosen.
 *
 */
export type SynchronizerId = string
/**
 *
 * Structure representing a disclosed contract for transaction execution
 *
 */
export interface DisclosedContract {
    templateId?: TemplateId
    contractId?: ContractId
    createdEventBlob: CreatedEventBlob
    synchronizerId?: SynchronizerId
}
/**
 *
 * List of contract IDs to be disclosed with the command.
 *
 */
export type DisclosedContracts = DisclosedContract[]
export type PackageId = string
/**
 *
 * The package-id selection preference of the client for resolving package names and interface instances in command submission and interpretation
 *
 */
export type PackageIdSelectionPreference = PackageId[]
/**
 *
 * The message to sign.
 *
 */
export type Message = string
export type RequestMethod = 'get' | 'post' | 'patch' | 'put' | 'delete'
export type Resource = string
export interface Body {
    [key: string]: any
}
/**
 *
 * Query parameters as key-value pairs.
 *
 */
export interface Query {
    [key: string]: any
}
/**
 *
 * Path parameters as key-value pairs.
 *
 */
export interface Path {
    [key: string]: any
}
/**
 *
 * The unique identifier of the Provider.
 *
 */
export type ProviderId = string
/**
 *
 * The version of the Provider.
 *
 */
export type Version = string
/**
 *
 * The type of client that implements the Provider.
 *
 */
export type ProviderType = 'browser' | 'desktop' | 'mobile' | 'remote'
/**
 *
 * The URL of the Wallet Provider.
 *
 */
export type Url = string
/**
 *
 * A URL that points to a user interface.
 *
 */
export type UserUrl = string
/**
 *
 * Represents a Provider.
 *
 */
export interface Provider {
    id: ProviderId
    version?: Version
    providerType?: ProviderType
    url?: Url
    userUrl?: UserUrl
}
/**
 *
 * Whether or not the user is authenticated with the Wallet.
 *
 */
export type IsConnectedValue = boolean
/**
 *
 * Reason for the wallet state, e.g., 'no signing provider matched'.
 *
 */
export type Reason = string
/**
 *
 * Whether or not a connection to a network is established.
 *
 */
export type IsNetworkConnected = boolean
/**
 *
 * If not connected to a network, the reason why.
 *
 */
export type NetworkReason = string
export interface ConnectResult {
    isConnected: IsConnectedValue
    reason?: Reason
    isNetworkConnected: IsNetworkConnected
    networkReason?: NetworkReason
    userUrl?: UserUrl
}
/**
 *
 * The network ID the wallet corresponds to.
 *
 */
export type NetworkId = string
/**
 *
 * The base URL of the ledger API.
 *
 */
export type LedgerApiUrl = string
/**
 *
 * JWT authentication token.
 *
 */
export type AccessToken = string
/**
 *
 * Network information, if connected to a network.
 *
 */
export interface Network {
    networkId: NetworkId
    ledgerApi?: LedgerApiUrl
    accessToken?: AccessToken
}
/**
 *
 * The user identifier.
 *
 */
export type UserId = string
/**
 *
 * Session information, if authenticated.
 *
 */
export interface Session {
    accessToken: AccessToken
    userId: UserId
}
/**
 *
 * The unique identifier of the message associated with the message to be signed.
 *
 */
export type MessageId = string
/**
 *
 * Set as primary wallet for dApp usage.
 *
 */
export type Primary = boolean
/**
 *
 * The party ID corresponding to the wallet.
 *
 */
export type PartyId = string
/**
 *
 * The status of the wallet.
 *
 */
export type WalletStatus = 'initialized' | 'allocated' | 'removed'
/**
 *
 * The party hint and name of the wallet.
 *
 */
export type Hint = string
/**
 *
 * The public key of the party.
 *
 */
export type PublicKey = string
/**
 *
 * The namespace of the party.
 *
 */
export type Namespace = string
/**
 *
 * The signing provider ID the wallet corresponds to.
 *
 */
export type SigningProviderId = string
/**
 *
 * Unique identifier of the signed transaction given by the Signing Provider. This may not be the same as the internal txId given by the Wallet Gateway.
 *
 */
export type ExternalTxId = string
/**
 *
 * The topology transactions
 *
 */
export type TopologyTransactions = string
/**
 *
 * Whether the wallet is disabled. Wallets are disabled when no signing provider matches the party's namespace during sync. Disabled wallets use participant as the default signing provider.
 *
 */
export type Disabled = boolean
/**
 *
 * Structure representing a wallet
 *
 */
export interface Wallet {
    primary: Primary
    partyId: PartyId
    status: WalletStatus
    hint: Hint
    publicKey: PublicKey
    namespace: Namespace
    networkId: NetworkId
    signingProviderId: SigningProviderId
    externalTxId?: ExternalTxId
    topologyTransactions?: TopologyTransactions
    disabled?: Disabled
    reason?: Reason
    rights: Rights
}
export type PartyLevelRight = any
/**
 *
 * The rights of the wallet.
 *
 */
export type Rights = PartyLevelRight[]
/**
 *
 * The status of the message signature.
 *
 */
export type StatusPending = 'pending'
/**
 *
 * Event emitted when a transaction is pending.
 *
 */
export interface TxChangedPendingEvent {
    status: StatusPending
    commandId: CommandId
}
/**
 *
 * The status of the message signature.
 *
 */
export type StatusSigned = 'signed'
/**
 *
 * The signature of the message.
 *
 */
export type Signature = string
/**
 *
 * The identifier of the provider that signed the transaction.
 *
 */
export type SignedBy = string
/**
 *
 * Payload for the TxChangedSignedEvent.
 *
 */
export interface TxChangedSignedPayload {
    signature: Signature
    signedBy: SignedBy
    party: Party
}
/**
 *
 * Event emitted when a transaction has been signed.
 *
 */
export interface TxChangedSignedEvent {
    status: StatusSigned
    commandId: CommandId
    payload: TxChangedSignedPayload
}
/**
 *
 * The status of the transaction.
 *
 */
export type StatusExecuted = 'executed'
/**
 *
 * The update ID corresponding to the transaction.
 *
 */
export type UpdateId = string
export type CompletionOffset = number
/**
 *
 * Payload for the TxChangedExecutedEvent.
 *
 */
export interface TxChangedExecutedPayload {
    updateId: UpdateId
    completionOffset: CompletionOffset
}
/**
 *
 * Event emitted when a transaction is executed against the participant.
 *
 */
export interface TxChangedExecutedEvent {
    status: StatusExecuted
    commandId: CommandId
    payload: TxChangedExecutedPayload
}
/**
 *
 * The status of the message signature.
 *
 */
export type StatusFailed = 'failed'
/**
 *
 * Event emitted when a transaction has failed.
 *
 */
export interface TxChangedFailedEvent {
    status: StatusFailed
    commandId: CommandId
}
/**
 *
 * Event emitted when a message signature is requested.
 *
 */
export interface MessageSignaturePendingEvent {
    status: StatusPending
    messageId: MessageId
}
/**
 *
 * Event emitted when a message signature is completed.
 *
 */
export interface MessageSignatureSignedEvent {
    status: StatusSigned
    messageId: MessageId
    signature: Signature
}
/**
 *
 * Event emitted when a message signature has failed.
 *
 */
export interface MessageSignatureFailedEvent {
    status: StatusFailed
    messageId: MessageId
}
/**
 *
 * Structure representing the request for prepare and execute calls
 *
 */
export interface PrepareExecuteParams {
    commandId?: CommandId
    commands: Commands
    actAs?: ActAs
    readAs?: ReadAs
    disclosedContracts?: DisclosedContracts
    synchronizerId?: SynchronizerId
    packageIdSelectionPreference?: PackageIdSelectionPreference
}
/**
 *
 * Request to sign a message.
 *
 */
export interface SignMessageParams {
    message: Message
}
/**
 *
 * Ledger API request structure
 *
 */
export interface LedgerApiParams {
    requestMethod: RequestMethod
    resource: Resource
    body?: Body
    query?: Query
    path?: Path
}
export interface StatusEvent {
    provider: Provider
    connection: ConnectResult
    network?: Network
    session?: Session
}
/**
 *
 * Represents a null value, used in responses where no data is returned.
 *
 */
export type Null = null
export interface PrepareExecuteResult {
    userUrl: UserUrl
}
export interface SignMessageResult {
    messageId: MessageId
    userUrl: UserUrl
}
/**
 *
 * Ledger Api response
 *
 */
export interface LedgerApiResult {
    [key: string]: any
}
/**
 *
 * Event emitted when the user's accounts change.
 *
 */
export type AccountsChangedEvent = Wallet[]
/**
 *
 * An array of accounts that the user has authorized the dapp to access..
 *
 */
export type ListAccountsResult = Wallet[]
/**
 *
 * Event emitted when a transaction changes.
 *
 */
export type TxChangedEvent =
    | TxChangedPendingEvent
    | TxChangedSignedEvent
    | TxChangedExecutedEvent
    | TxChangedFailedEvent
/**
 *
 * Event emitted when a message signature is requested or completed.
 *
 */
export type MessageSignatureEvent =
    | MessageSignaturePendingEvent
    | MessageSignatureSignedEvent
    | MessageSignatureFailedEvent
/**
 *
 * Generated! Represents an alias to any of the provided schemas
 *
 */

export type Status = () => Promise<StatusEvent>
export type Connect = () => Promise<ConnectResult>
export type Disconnect = () => Promise<Null>
export type IsConnected = () => Promise<ConnectResult>
export type GetActiveNetwork = () => Promise<Network>
export type PrepareExecute = (
    params: PrepareExecuteParams
) => Promise<PrepareExecuteResult>
export type SignMessage = (
    params: SignMessageParams
) => Promise<SignMessageResult>
export type LedgerApi = (params: LedgerApiParams) => Promise<LedgerApiResult>
export type Connected = () => Promise<StatusEvent>
export type OnStatusChanged = () => Promise<StatusEvent>
export type AccountsChanged = () => Promise<AccountsChangedEvent>
export type GetPrimaryAccount = () => Promise<Wallet>
export type ListAccounts = () => Promise<ListAccountsResult>
export type TxChanged = () => Promise<TxChangedEvent>
export type MessageSignature = () => Promise<MessageSignatureEvent>
