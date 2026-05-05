// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 *
 * Network ID
 *
 */
export type NetworkId = string
/**
 *
 * Name of network
 *
 */
export type Name = string
/**
 *
 * Description of network
 *
 */
export type Description = string
/**
 *
 * Synchronizer ID
 *
 */
export type SynchronizerId = string
/**
 *
 * Identity Provider ID
 *
 */
export type IdentityProviderId = string
export type Method = string
export type Scope = string
export type ClientId = string
export type ClientSecret = string
/**
 *
 * Issuer of identity provider
 *
 */
export type Issuer = string
export type Audience = string
/**
 *
 * Represents the type of auth for a specified network
 *
 */
export interface Auth {
    method: Method
    scope: Scope
    clientId: ClientId
    clientSecret?: ClientSecret
    issuer?: Issuer
    audience: Audience
}
/**
 *
 * Ledger api url
 *
 */
export type LedgerApi = string
/**
 *
 * Structure representing the Networks
 *
 */
export interface Network {
    id: NetworkId
    name: Name
    description: Description
    synchronizerId?: SynchronizerId
    identityProviderId: IdentityProviderId
    auth: Auth
    adminAuth?: Auth
    ledgerApi: LedgerApi
}
/**
 *
 * Ledger api url
 *
 */
export type NetworkName = string
/**
 *
 * ID of the identity provider
 *
 */
export type Id = string
/**
 *
 * Type of identity provider (oauth / self_signed)
 *
 */
export type Type = any
/**
 *
 * The configuration URL for the identity provider.
 *
 */
export type ConfigUrl = string
/**
 *
 * Structure representing the Identity Providers
 *
 */
export interface Idp {
    id: Id
    type: Type
    issuer: Issuer
    configUrl?: ConfigUrl
}
/**
 *
 * Set as primary wallet for dApp usage.
 *
 */
export type Primary = boolean
/**
 *
 * The party hint and name of the wallet.
 *
 */
export type PartyHint = string
/**
 *
 * The signing provider ID the wallet corresponds to.
 *
 */
export type SigningProviderId = string
export type PartyId = string
/**
 *
 * Filter wallets by network IDs.
 *
 */
export type NetworkIds = NetworkId[]
/**
 *
 * Filter wallets by signing provider IDs.
 *
 */
export type SigningProviderIds = SigningProviderId[]
/**
 *
 * Filter for the wallets to be returned.
 *
 */
export interface WalletFilter {
    networkIds?: NetworkIds
    signingProviderIds?: SigningProviderIds
}
/**
 *
 * The internal transaction identifier.
 *
 */
export type TransactionId = string
/**
 *
 * The internal message identifier.
 *
 */
export type MessageId = string
/**
 *
 * Arbitrary UTF-8 message to sign.
 *
 */
export type Message = string
/**
 *
 * Base64-encoded Ed25519 signature over the message.
 *
 */
export type Signature = string
export type SignedBy = string
export type Networks = Network[]
export type Idps = Idp[]
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
 * Base64-encoded Ed25519 public key of the wallet that produced the signature.
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
 * External transaction ID from signing provider.
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
 * The reason for the current status.
 *
 */
export type Reason = string
export type PartyLevelRight = any
/**
 *
 * The rights of the user for the network.
 *
 */
export type Rights = UserLevelRight[]
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
type AlwaysTrue = any
/**
 *
 * Non-disabled wallets added in this syncWallets call.
 *
 */
export type SyncWalletsResultAdded = Wallet[]
/**
 *
 * Existing wallets that either got downgraded to status initialized or their rights changed in this syncWallets call.
 *
 */
export type SyncWalletsResultUpdated = Wallet[]
/**
 *
 * Either wallets added in this iteration that are disabled, or existing wallet that were updated to be disabled in this syncWallets call.
 *
 */
export type SyncWalletsResultDisabled = Wallet[]
/**
 *
 * Whether wallet sync is needed. Returns true if there are disabled wallets or parties on the ledger that aren't in the store.
 *
 */
export type WalletSyncNeeded = boolean
export type TxStatusSigned = 'signed'
export interface SignResultSigned {
    status: TxStatusSigned
    signature: Signature
    signedBy: SignedBy
    partyId: PartyId
    externalTxId?: ExternalTxId
}
export type TxStatusPending = 'pending'
export interface SignResultPending {
    status: TxStatusPending
    partyId: PartyId
    externalTxId: ExternalTxId
}
export type TxStatusRejected = 'rejected'
export interface SignResultRejected {
    status: TxStatusRejected
    partyId: PartyId
    externalTxId: ExternalTxId
}
export type TxStatusFailed = 'failed'
export interface SignResultFailed {
    status: TxStatusFailed
    partyId: PartyId
    externalTxId: ExternalTxId
}
/**
 *
 * The access token for the session.
 *
 */
export type AccessToken = string
/**
 *
 * The status of the transaction.
 *
 */
export type Status = string
export type UserLevelRight = any
/**
 *
 * Structure representing the connected network session
 *
 */
export interface Session {
    id: Id
    network: Network
    idp: Idp
    accessToken: AccessToken
    status: Status
    reason?: Reason
    rights: Rights
}
export type Sessions = Session[]
/**
 *
 * The unique identifier of the command associated with the transaction.
 *
 */
export type CommandId = string
/**
 *
 * The timestamp when the transaction was created.
 *
 */
export type CreatedAt = string
/**
 *
 * The timestamp when the transaction was signed.
 *
 */
export type SignedAt = string
/**
 *
 * The transaction data corresponding to the command ID.
 *
 */
export type PreparedTransaction = string
/**
 *
 * The hash of the prepared transaction.
 *
 */
export type PreparedTransactionHash = string
/**
 *
 * Optional payload associated with the transaction.
 *
 */
export type Payload = string
/**
 *
 * The origin (dApp URL) that initiated this transaction request.
 *
 */
export type Origin = string
export interface Transaction {
    id: TransactionId
    commandId: CommandId
    status: Status
    createdAt?: CreatedAt
    signedAt?: SignedAt
    preparedTransaction: PreparedTransaction
    preparedTransactionHash: PreparedTransactionHash
    payload?: Payload
    origin?: Origin
    externalTxId?: ExternalTxId
}
export type Transactions = Transaction[]
/**
 *
 * The unique identifier of the current user.
 *
 */
export type UserIdentifier = string
/**
 *
 * Whether the current user is an admin.
 *
 */
export type IsAdminFlag = boolean
export interface AddNetworkParams {
    network: Network
}
export interface RemoveNetworkParams {
    networkName: NetworkName
}
export interface AddIdpParams {
    idp: Idp
}
export interface RemoveIdpParams {
    identityProviderId: IdentityProviderId
}
export interface CreateWalletParams {
    primary?: Primary
    partyHint: PartyHint
    signingProviderId: SigningProviderId
}
export interface AllocatePartyForWalletParams {
    partyId: PartyId
}
export interface SetPrimaryWalletParams {
    partyId: PartyId
}
export interface RemoveWalletParams {
    partyId: PartyId
}
export interface ListWalletsParams {
    filter?: WalletFilter
}
export interface SignParams {
    transactionId: TransactionId
    partyId: PartyId
}
export interface SignMessageParams {
    messageId: MessageId
}

export interface GetMessageToSignParams {
    messageId: MessageId
}

export interface DeleteMessageToSignParams {
    messageId: MessageId
}
export interface ExecuteParams {
    signature: Signature
    partyId: PartyId
    transactionId: TransactionId
    signedBy: SignedBy
}
export interface AddSessionParams {
    networkId: NetworkId
}
export interface GetTransactionParams {
    transactionId: TransactionId
}
export interface DeleteTransactionParams {
    transactionId: TransactionId
}
/**
 *
 * Represents a null value, used in responses where no data is returned.
 *
 */
export type Null = null
export interface ListNetworksResult {
    networks: Networks
}
export interface ListIdpsResult {
    idps: Idps
}
export interface CreateWalletResult {
    wallet: Wallet
}
export interface AllocatePartyForWalletResult {
    wallet: Wallet
}
export interface RemovePartyResult {
    [key: string]: any
}
/**
 *
 * An array of wallets that match the filter criteria.
 *
 */
export type ListWalletsResult = Wallet[]
/**
 *
 * Added, updated  and disabled wallets as a result of the sync.
 *
 */
export interface SyncWalletsResult {
    added: SyncWalletsResultAdded
    updated: SyncWalletsResultUpdated
    disabled: SyncWalletsResultDisabled
}
export interface IsWalletSyncNeededResult {
    walletSyncNeeded: WalletSyncNeeded
}
export type SignResult =
    | SignResultSigned
    | SignResultPending
    | SignResultRejected
    | SignResultFailed
export interface SignMessageResult {
    signature: Signature
    publicKey: PublicKey
}

export interface MessageToSign {
    id: MessageId
    status: Status
    partyId: PartyId
    publicKey: PublicKey
    message: Message
    createdAt?: CreatedAt
    signedAt?: SignedAt
    origin?: Origin
    signature?: Signature
}

export interface GetMessageToSignResult {
    message: MessageToSign
}

export interface ListMessagesToSignResult {
    messages: MessageToSign[]
}
export interface ExecuteResult {
    [key: string]: any
}
/**
 *
 * Structure representing the connected network session
 *
 */
export interface AddSessionResult {
    id: Id
    network: Network
    idp: Idp
    accessToken: AccessToken
    status: Status
    reason?: Reason
    rights: Rights
}
export interface ListSessionsResult {
    sessions: Sessions
}
export interface GetTransactionResult {
    id: TransactionId
    commandId: CommandId
    status: Status
    createdAt?: CreatedAt
    signedAt?: SignedAt
    preparedTransaction: PreparedTransaction
    preparedTransactionHash: PreparedTransactionHash
    payload?: Payload
    origin?: Origin
    externalTxId?: ExternalTxId
}
export interface ListTransactionsResult {
    transactions: Transactions
}
export interface GetUserResult {
    userId: UserIdentifier
    isAdmin: IsAdminFlag
}
/**
 *
 * Generated! Represents an alias to any of the provided schemas
 *
 */

export type AddNetwork = (params: AddNetworkParams) => Promise<Null>
export type RemoveNetwork = (params: RemoveNetworkParams) => Promise<Null>
export type ListNetworks = () => Promise<ListNetworksResult>
export type AddIdp = (params: AddIdpParams) => Promise<Null>
export type RemoveIdp = (params: RemoveIdpParams) => Promise<Null>
export type ListIdps = () => Promise<ListIdpsResult>
export type CreateWallet = (
    params: CreateWalletParams
) => Promise<CreateWalletResult>
export type AllocatePartyForWallet = (
    params: AllocatePartyForWalletParams
) => Promise<AllocatePartyForWalletResult>
export type SetPrimaryWallet = (params: SetPrimaryWalletParams) => Promise<Null>
export type RemoveWallet = (
    params: RemoveWalletParams
) => Promise<RemovePartyResult>
export type ListWallets = (
    params: ListWalletsParams
) => Promise<ListWalletsResult>
export type SyncWallets = () => Promise<SyncWalletsResult>
export type IsWalletSyncNeeded = () => Promise<IsWalletSyncNeededResult>
export type Sign = (params: SignParams) => Promise<SignResult>
export type SignMessage = (
    params: SignMessageParams
) => Promise<SignMessageResult>
export type GetMessageToSign = (
    params: GetMessageToSignParams
) => Promise<GetMessageToSignResult>
export type ListMessagesToSign = () => Promise<ListMessagesToSignResult>
export type DeleteMessageToSign = (
    params: DeleteMessageToSignParams
) => Promise<Null>
export type Execute = (params: ExecuteParams) => Promise<ExecuteResult>
export type AddSession = (params: AddSessionParams) => Promise<AddSessionResult>
export type RemoveSession = () => Promise<Null>
export type ListSessions = () => Promise<ListSessionsResult>
export type GetTransaction = (
    params: GetTransactionParams
) => Promise<GetTransactionResult>
export type ListTransactions = () => Promise<ListTransactionsResult>
export type DeleteTransaction = (
    params: DeleteTransactionParams
) => Promise<Null>
export type GetUser = () => Promise<GetUserResult>
