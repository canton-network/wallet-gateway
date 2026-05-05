export interface JsCantonError {
    code: string
    cause: string
    correlationId?: string
    traceId?: string
    context: Map_String
    resources?: Tuple2_String_String[]
    errorCategory: number
    grpcCodeValue?: number
    retryInfo?: string
    definiteAnswer?: boolean
}
export type Map_String = Record<string, string>
export type Tuple2_String_String = any
export interface CompletionStreamRequest {
    /** Only completions of commands submitted with the same user_id will be visible in the stream.
   Must be a valid UserIdString (as described in ``value.proto``).
   
   Required unless authentication is used with a user token.
   In that case, the token's user-id will be used for the request's user_id.
   
   Optional **/
    userId?: string
    /** Non-empty list of parties whose data should be included.
   The stream shows only completions of commands for which at least one of the ``act_as`` parties is in the given set of parties.
   Must be a valid PartyIdString (as described in ``value.proto``).
   
   Required: must be non-empty **/
    parties: string[]
    /** This optional field indicates the minimum offset for completions. This can be used to resume an earlier completion stream.
   If not set the ledger uses the ledger begin offset instead.
   If specified, it must be a valid absolute offset (positive integer) or zero (ledger begin offset).
   If the ledger has been pruned, this parameter must be specified and greater than the pruning offset.
   
   Optional **/
    beginExclusive?: number
}
export type Either_JsCantonError_CompletionStreamResponse =
    | CompletionStreamResponse
    | JsCantonError
export type Map_K_V = Record<string, string>
export interface CompletionStreamResponse {
    completionResponse?: CompletionResponse
}
export type CompletionResponse = Completion | Empty1 | OffsetCheckpoint
export interface Completion {
    value: Completion1
}
export interface Completion1 {
    /** The ID of the succeeded or failed command.
   Must be a valid LedgerString (as described in ``value.proto``).
   
   Required **/
    commandId: string
    /** Identifies the exact type of the error.
   It uses the same format of conveying error details as it is used for the RPC responses of the APIs.
   
   Optional **/
    status?: JsStatus
    /** The update_id of the transaction or reassignment that resulted from the command with command_id.
   
   Only set for successfully executed commands.
   Must be a valid LedgerString (as described in ``value.proto``).
   Optional **/
    updateId?: string
    /** The user-id that was used for the submission, as described in ``commands.proto``.
   Must be a valid UserIdString (as described in ``value.proto``).
   
   Required **/
    userId: string
    /** The set of parties on whose behalf the commands were executed.
   Contains the ``act_as`` parties from ``commands.proto``
   filtered to the requesting parties in CompletionStreamRequest.
   The order of the parties need not be the same as in the submission.
   Each element must be a valid PartyIdString (as described in ``value.proto``).
   
   Required: must be non-empty **/
    actAs: string[]
    /** The submission ID this completion refers to, as described in ``commands.proto``.
   Must be a valid LedgerString (as described in ``value.proto``).
   
   Optional **/
    submissionId?: string
    deduplicationPeriod?: DeduplicationPeriod
    /** The Ledger API trace context
   
   The trace context transported in this message corresponds to the trace context supplied
   by the client application in a HTTP2 header of the original command submission.
   We typically use a header to transfer this type of information. Here we use message
   body, because it is used in gRPC streams which do not support per message headers.
   This field will be populated with the trace context contained in the original submission.
   If that was not provided, a unique ledger-api-server generated trace context will be used
   instead.
   
   Optional **/
    traceContext?: TraceContext
    /** May be used in a subsequent CompletionStreamRequest to resume the consumption of this stream at a later time.
   Must be a valid absolute offset (positive integer).
   
   Required **/
    offset: number
    /** The synchronizer along with its record time.
   The synchronizer id provided, in case of
   
   - successful/failed transactions: identifies the synchronizer of the transaction
   - for successful/failed unassign commands: identifies the source synchronizer
   - for successful/failed assign commands: identifies the target synchronizer
   
   Required **/
    synchronizerTime: SynchronizerTime
    /** The traffic cost paid by this participant node for the confirmation request
   for the submitted command.
   
   Commands whose execution is rejected before their corresponding
   confirmation request is ordered by the synchronizer will report a paid
   traffic cost of zero.
   If a confirmation request is ordered for a command, but the request fails
   (e.g., due to contention with a concurrent contract archival), the traffic
   cost is paid and reported on the failed completion for the request.
   
   If you want to correlate the traffic cost of a successful completion
   with the transaction that resulted from the command, you can use the
   ``offset`` field to retrieve the transaction using
   ``UpdateService.GetUpdateByOffset`` on the same participant node; or alternatively use the ``update_id``
   field to retrieve the transaction using ``UpdateService.GetUpdateById`` on any participant node
   that sees the transaction.
   
   Note: for completions processed before the participant started serving
   traffic cost on the Ledger API, this field will be set to zero.
   Additionally, the total cost incurred by the submitting node for the submission of the transaction may be greater
   than the reported cost, for example if retries were issued due to failed submissions to the synchronizer.
   The cost reported here is the one paid for ordering the confirmation request.
   
   Optional **/
    paidTrafficCost?: number
}
export interface JsStatus {
    code: number
    message: string
    details?: ProtoAny[]
}
export interface ProtoAny {
    typeUrl: string
    value: string
    unknownFields: UnknownFieldSet
    valueDecoded?: string
}
export interface UnknownFieldSet {
    fields: Map_Int_Field
}
export type Map_Int_Field = Record<string, Field>
export interface Field {
    varint?: number[]
    fixed64?: number[]
    fixed32?: number[]
    lengthDelimited?: string[]
}
export type DeduplicationPeriod =
    | DeduplicationDuration
    | DeduplicationOffset
    | Empty
export interface DeduplicationDuration {
    value: Duration
}
export interface Duration {
    seconds: number
    nanos: number
    /** This field is automatically added as part of protobuf to json mapping **/
    unknownFields?: UnknownFieldSet
}
export interface DeduplicationOffset {
    value: number
}
export type Empty = Record<string, any>
export interface TraceContext {
    /** https://www.w3.org/TR/trace-context/
   Optional **/
    traceparent?: string
    /** Optional **/
    tracestate?: string
}
export interface SynchronizerTime {
    /** The id of the synchronizer.
   
   Required **/
    synchronizerId: string
    /** All commands with a maximum record time below this value MUST be considered lost if their completion has not arrived before this checkpoint.
   
   Required **/
    recordTime: string
}
export type Empty1 = Record<string, any>
export interface OffsetCheckpoint {
    value: OffsetCheckpoint1
}
export interface OffsetCheckpoint1 {
    /** The participant's offset, the details of the offset field are described in ``community/ledger-api/README.md``.
   Must be a valid absolute offset (positive integer).
   
   Required **/
    offset: number
    /** The times associated with each synchronizer at this offset.
   
   Optional: can be empty **/
    synchronizerTimes?: SynchronizerTime[]
}
export interface GetActiveContractsRequest {
    /** Provided for backwards compatibility, it will be removed in the Canton version 3.5.0.
   Templates to include in the served snapshot, per party.
   Optional, if specified event_format must be unset, if not specified event_format must be set. **/
    filter?: TransactionFilter
    /** Provided for backwards compatibility, it will be removed in the Canton version 3.5.0.
   If enabled, values served over the API will contain more information than strictly necessary to interpret the data.
   In particular, setting the verbose flag to true triggers the ledger to include labels for record fields.
   Optional, if specified event_format must be unset. **/
    verbose?: boolean
    /** The offset at which the snapshot of the active contracts will be computed.
   Must be no greater than the current ledger end offset.
   Must be greater than or equal to the last pruning offset.
   Must be a valid absolute offset (positive integer) or ledger begin offset (zero).
   If zero, the empty set will be returned.
   
   Required **/
    activeAtOffset: number
    /** Format of the contract_entries in the result. In case of CreatedEvent the presentation will be of
   TRANSACTION_SHAPE_ACS_DELTA.
   
   Required **/
    eventFormat: EventFormat
}
export interface TransactionFilter {
    /** Each key must be a valid PartyIdString (as described in ``value.proto``).
   The interpretation of the filter depends on the transaction-shape being filtered:
   
   1. For **transaction trees** (used in GetUpdateTreesResponse for backwards compatibility) all party keys used as
      wildcard filters, and all subtrees whose root has one of the listed parties as an informee are returned.
      If there are ``CumulativeFilter``s, those will control returned ``CreatedEvent`` fields where applicable, but will
      not be used for template/interface filtering.
   2. For **ledger-effects** create and exercise events are returned, for which the witnesses include at least one of
      the listed parties and match the per-party filter.
   3. For **transaction and active-contract-set streams** create and archive events are returned for all contracts whose
      stakeholders include at least one of the listed parties and match the per-party filter. **/
    filtersByParty?: Map_Filters
    /** Wildcard filters that apply to all the parties existing on the participant. The interpretation of the filters is the same
   with the per-party filter as described above. **/
    filtersForAnyParty?: Filters
}
export type Map_Filters = Record<string, Filters>
export interface Filters {
    /** Every filter in the cumulative list expands the scope of the resulting stream. Each interface,
   template or wildcard filter means additional events that will match the query.
   The impact of include_interface_view and include_created_event_blob fields in the filters will
   also be accumulated.
   A template or an interface SHOULD NOT appear twice in the accumulative field.
   A wildcard filter SHOULD NOT be defined more than once in the accumulative field.
   If no ``CumulativeFilter`` defined, the default of a single ``WildcardFilter`` with
   include_created_event_blob unset is used.
   
   Optional: can be empty **/
    cumulative?: CumulativeFilter[]
}
export interface CumulativeFilter {
    identifierFilter?: IdentifierFilter
}
export type IdentifierFilter =
    | Empty2
    | InterfaceFilter
    | TemplateFilter
    | WildcardFilter
export type Empty2 = Record<string, any>
export interface InterfaceFilter {
    value: InterfaceFilter1
}
export interface InterfaceFilter1 {
    /** The interface that a matching contract must implement.
   The ``interface_id`` needs to be valid: corresponding interface should be defined in
   one of the available packages at the time of the query.
   Both package-name and package-id reference formats for the identifier are supported.
   Note: The package-id reference identifier format is deprecated. We plan to end support for this format in version 3.4.
   
   Required **/
    interfaceId: string
    /** Whether to include the interface view on the contract in the returned ``CreatedEvent``.
   Use this to access contract data in a uniform manner in your API client.
   
   Optional **/
    includeInterfaceView?: boolean
    /** Whether to include a ``created_event_blob`` in the returned ``CreatedEvent``.
   Use this to access the contract create event payload in your API client
   for submitting it as a disclosed contract with future commands.
   
   Optional **/
    includeCreatedEventBlob?: boolean
}
export interface TemplateFilter {
    value: TemplateFilter1
}
export interface TemplateFilter1 {
    /** A template for which the payload should be included in the response.
   The ``template_id`` needs to be valid: corresponding template should be defined in
   one of the available packages at the time of the query.
   Both package-name and package-id reference formats for the identifier are supported.
   Note: The package-id reference identifier format is deprecated. We plan to end support for this format in version 3.4.
   
   Required **/
    templateId: string
    /** Whether to include a ``created_event_blob`` in the returned ``CreatedEvent``.
   Use this to access the contract event payload in your API client
   for submitting it as a disclosed contract with future commands.
   
   Optional **/
    includeCreatedEventBlob?: boolean
}
export interface WildcardFilter {
    value: WildcardFilter1
}
export interface WildcardFilter1 {
    /** Whether to include a ``created_event_blob`` in the returned ``CreatedEvent``.
   Use this to access the contract create event payload in your API client
   for submitting it as a disclosed contract with future commands.
   
   Optional **/
    includeCreatedEventBlob?: boolean
}
export interface EventFormat {
    /** Each key must be a valid PartyIdString (as described in ``value.proto``).
   The interpretation of the filter depends on the transaction-shape being filtered:
   
   1. For **ledger-effects** create and exercise events are returned, for which the witnesses include at least one of
      the listed parties and match the per-party filter.
   2. For **transaction and active-contract-set streams** create and archive events are returned for all contracts whose
      stakeholders include at least one of the listed parties and match the per-party filter.
   
   Optional: can be empty **/
    filtersByParty?: Map_Filters
    /** Wildcard filters that apply to all the parties existing on the participant. The interpretation of the filters is the same
   with the per-party filter as described above.
   
   Optional **/
    filtersForAnyParty?: Filters
    /** If enabled, values served over the API will contain more information than strictly necessary to interpret the data.
   In particular, setting the verbose flag to true triggers the ledger to include labels for record fields.
   
   Optional **/
    verbose?: boolean
}
export type Either_JsCantonError_JsGetActiveContractsResponse =
    | JsCantonError
    | JsGetActiveContractsResponse
export interface JsGetActiveContractsResponse {
    /** The workflow ID used in command submission which corresponds to the contract_entry. Only set if
   the ``workflow_id`` for the command was set.
   Must be a valid LedgerString (as described in ``value.proto``).
   
   Optional **/
    workflowId?: string
    contractEntry?: JsContractEntry
}
export type JsContractEntry =
    | JsActiveContract
    | JsEmpty
    | JsIncompleteAssigned
    | JsIncompleteUnassigned
export interface JsActiveContract {
    /** The event as it appeared in the context of its last update (i.e. daml transaction or
   reassignment). In particular, the last offset, node_id pair is preserved.
   The last update is the most recent update created or assigned this contract on synchronizer_id synchronizer.
   The offset of the CreatedEvent might point to an already pruned update, therefore it cannot necessarily be used
   for lookups.
   
   Required **/
    createdEvent: CreatedEvent
    /** A valid synchronizer id
   
   Required **/
    synchronizerId: string
    /** Each corresponding assigned and unassigned event has the same reassignment_counter. This strictly increases
   with each unassign command for the same contract. Creation of the contract corresponds to reassignment_counter
   equals zero.
   This field will be the reassignment_counter of the latest observable activation event on this synchronizer, which is
   before the active_at_offset.
   
   Required **/
    reassignmentCounter: number
}
export interface CreatedEvent {
    /** The offset of origin, which has contextual meaning, please see description at messages that include a CreatedEvent.
   Offsets are managed by the participant nodes.
   Transactions can thus NOT be assumed to have the same offsets on different participant nodes.
   It is a valid absolute offset (positive integer)
   
   Required **/
    offset: number
    /** The position of this event in the originating transaction or reassignment.
   The origin has contextual meaning, please see description at messages that include a CreatedEvent.
   Node IDs are not necessarily equal across participants,
   as these may see different projections/parts of transactions.
   Must be valid node ID (non-negative integer)
   
   Required **/
    nodeId: number
    /** The ID of the created contract.
   Must be a valid LedgerString (as described in ``value.proto``).
   
   Required **/
    contractId: string
    /** The template of the created contract.
   The identifier uses the package-id reference format.
   
   Required **/
    templateId: string
    /** The key of the created contract.
   This will be set if and only if ``template_id`` defines a contract key.
   
   Optional **/
    contractKey?: undefined
    /** The arguments that have been used to create the contract.
   
   Required **/
    createArgument: undefined
    /** Opaque representation of contract create event payload intended for forwarding
   to an API server as a contract disclosed as part of a command
   submission.
   
   Optional: can be empty **/
    createdEventBlob?: string
    /** Interface views specified in the transaction filter.
   Includes an ``InterfaceView`` for each interface for which there is a ``InterfaceFilter`` with
   
   - its party in the ``witness_parties`` of this event,
   - and which is implemented by the template of this event,
   - and which has ``include_interface_view`` set.
   
   Optional: can be empty **/
    interfaceViews?: JsInterfaceView[]
    /** The parties that are notified of this event. When a ``CreatedEvent``
   is returned as part of a transaction tree or ledger-effects transaction, this will include all
   the parties specified in the ``TransactionFilter`` that are witnesses  of the event
   (the stakeholders of the contract and all informees of all the ancestors
   of this create action that this participant knows about).
   If served as part of a ACS delta transaction those will
   be limited to all parties specified in the ``TransactionFilter`` that
   are stakeholders of the contract (i.e. either signatories or observers).
   If the ``CreatedEvent`` is returned as part of an AssignedEvent,
   ActiveContract or IncompleteUnassigned (so the event is related to
   an assignment or unassignment): this will include all parties of the
   ``TransactionFilter`` that are stakeholders of the contract.
   
   The behavior of reading create events visible to parties not hosted
   on the participant node serving the Ledger API is undefined. Concretely,
   there is neither a guarantee that the participant node will serve all their
   create events on the ACS stream, nor is there a guarantee that matching archive
   events are delivered for such create events.
   
   For most clients this is not a problem, as they only read events for parties
   that are hosted on the participant node. If you need to read events
   for parties that may not be hosted at all times on the participant node,
   subscribe to the ``TopologyEvent``s for that party by setting a corresponding
   ``UpdateFormat``.  Using these events, query the ACS as-of an offset where the
   party is hosted on the participant node, and ignore create events at offsets
   where the party is not hosted on the participant node.
   
   Required: must be non-empty **/
    witnessParties: string[]
    /** The signatories for this contract as specified by the template.
   
   Required: must be non-empty **/
    signatories: string[]
    /** The observers for this contract as specified explicitly by the template or implicitly as choice controllers.
   This field never contains parties that are signatories.
   
   Optional: can be empty **/
    observers?: string[]
    /** Ledger effective time of the transaction that created the contract.
   
   Required **/
    createdAt: string
    /** The package name of the created contract.
   
   Required **/
    packageName: string
    /** A package-id present in the participant package store that typechecks the contract's argument.
   This may differ from the package-id of the template used to create the contract.
   For contracts created before Canton 3.4, this field matches the contract's creation package-id.
   
   NOTE: Experimental, server internal concept, not for client consumption. Subject to change without notice.
   
   Required **/
    representativePackageId: string
    /** Whether this event would be part of respective ACS_DELTA shaped stream,
   and should therefore considered when tracking contract activeness on the client-side.
   
   Required **/
    acsDelta: boolean
}
export interface JsInterfaceView {
    /** The interface implemented by the matched event.
   The identifier uses the package-id reference format.
   
   Required **/
    interfaceId: string
    /** Whether the view was successfully computed, and if not,
   the reason for the error. The error is reported using the same rules
   for error codes and messages as the errors returned for API requests.
   
   Required **/
    viewStatus: JsStatus
    /** The value of the interface's view method on this event.
   Set if it was requested in the ``InterfaceFilter`` and it could be
   successfully computed.
   
   Optional **/
    viewValue?: undefined
}
export type JsEmpty = Record<string, any>
export interface JsIncompleteAssigned {
    /** Required **/
    assignedEvent: JsAssignedEvent
}
export interface JsAssignedEvent {
    /** The ID of the source synchronizer.
   Must be a valid synchronizer id.
   
   Required **/
    source: string
    /** The ID of the target synchronizer.
   Must be a valid synchronizer id.
   
   Required **/
    target: string
    /** The ID from the unassigned event.
   For correlation capabilities.
   Must be a valid LedgerString (as described in ``value.proto``).
   
   Required **/
    reassignmentId: string
    /** Party on whose behalf the assign command was executed.
   Empty if the assignment happened offline via the repair service.
   Must be a valid PartyIdString (as described in ``value.proto``).
   
   Optional **/
    submitter?: string
    /** Each corresponding assigned and unassigned event has the same reassignment_counter. This strictly increases
   with each unassign command for the same contract. Creation of the contract corresponds to reassignment_counter
   equals zero.
   
   Required **/
    reassignmentCounter: number
    /** The offset of this event refers to the offset of the assignment,
   while the node_id is the index of within the batch.
   
   Required **/
    createdEvent: CreatedEvent
}
export interface JsIncompleteUnassigned {
    /** The event as it appeared in the context of its last activation update (i.e. daml transaction or
   reassignment). In particular, the last activation offset, node_id pair is preserved.
   The last activation update is the most recent update created or assigned this contract on synchronizer_id synchronizer before
   the unassigned_event.
   The offset of the CreatedEvent might point to an already pruned update, therefore it cannot necessarily be used
   for lookups.
   
   Required **/
    createdEvent: CreatedEvent
    /** Required **/
    unassignedEvent: UnassignedEvent
}
export interface UnassignedEvent {
    /** The ID of the unassignment. This needs to be used as an input for a assign ReassignmentCommand.
   Must be a valid LedgerString (as described in ``value.proto``).
   
   Required **/
    reassignmentId: string
    /** The ID of the reassigned contract.
   Must be a valid LedgerString (as described in ``value.proto``).
   
   Required **/
    contractId: string
    /** The template of the reassigned contract.
   The identifier uses the package-id reference format.
   
   Required **/
    templateId: string
    /** The ID of the source synchronizer
   Must be a valid synchronizer id
   
   Required **/
    source: string
    /** The ID of the target synchronizer
   Must be a valid synchronizer id
   
   Required **/
    target: string
    /** Party on whose behalf the unassign command was executed.
   Empty if the unassignment happened offline via the repair service.
   Must be a valid PartyIdString (as described in ``value.proto``).
   
   Optional **/
    submitter?: string
    /** Each corresponding assigned and unassigned event has the same reassignment_counter. This strictly increases
   with each unassign command for the same contract. Creation of the contract corresponds to reassignment_counter
   equals zero.
   
   Required **/
    reassignmentCounter: number
    /** Assignment exclusivity
   Before this time (measured on the target synchronizer), only the submitter of the unassignment can initiate the assignment
   Defined for reassigning participants.
   
   Optional **/
    assignmentExclusivity?: string
    /** The parties that are notified of this event.
   
   Required: must be non-empty **/
    witnessParties: string[]
    /** The package name of the contract.
   
   Required **/
    packageName: string
    /** The offset of origin.
   Offsets are managed by the participant nodes.
   Reassignments can thus NOT be assumed to have the same offsets on different participant nodes.
   Must be a valid absolute offset (positive integer)
   
   Required **/
    offset: number
    /** The position of this event in the originating reassignment.
   Node IDs are not necessarily equal across participants,
   as these may see different projections/parts of reassignments.
   Must be valid node ID (non-negative integer)
   
   Required **/
    nodeId: number
}
export interface GetUpdatesRequest {
    /** Beginning of the requested ledger section (non-negative integer).
   The response will only contain transactions whose offset is strictly greater than this.
   If not populated or set to zero, the stream will start from the beginning of the ledger.
   If positive, the streaming will start after this absolute offset.
   If the ledger has been pruned, this parameter must be specified and be greater than the pruning offset.
   
   Optional **/
    beginExclusive?: number
    /** End of the requested ledger section.
   The response will only contain transactions whose offset is less than or equal to this.
   If empty, the stream will not terminate.
   If specified, the stream will terminate after this absolute offset (positive integer) is reached.
   
   Optional **/
    endInclusive?: number
    /** Provided for backwards compatibility, it will be removed in the Canton version 3.5.0.
   Requesting parties with template filters.
   Template filters must be empty for GetUpdateTrees requests.
   Optional for backwards compatibility, if defined update_format must be unset **/
    filter?: TransactionFilter
    /** Provided for backwards compatibility, it will be removed in the Canton version 3.5.0.
   If enabled, values served over the API will contain more information than strictly necessary to interpret the data.
   In particular, setting the verbose flag to true triggers the ledger to include labels, record and variant type ids
   for record fields.
   Optional for backwards compatibility, if defined update_format must be unset **/
    verbose?: boolean
    /** The update format for this request
   
   Required **/
    updateFormat: UpdateFormat
}
export interface UpdateFormat {
    /** Include Daml transactions in streams.
   If unset, no transactions are emitted in the stream.
   
   Optional **/
    includeTransactions?: TransactionFormat
    /** Include (un)assignments in the stream.
   The events in the result take the shape TRANSACTION_SHAPE_ACS_DELTA.
   If unset, no (un)assignments are emitted in the stream.
   
   Optional **/
    includeReassignments?: EventFormat
    /** Include topology events in streams.
   If unset no topology events are emitted in the stream.
   
   Optional **/
    includeTopologyEvents?: TopologyFormat
}
export interface TransactionFormat {
    /** Required **/
    eventFormat: EventFormat
    /** What transaction shape to use for interpreting the filters of the event format.
   
   Required **/
    transactionShape:
        | 'TRANSACTION_SHAPE_UNSPECIFIED'
        | 'TRANSACTION_SHAPE_ACS_DELTA'
        | 'TRANSACTION_SHAPE_LEDGER_EFFECTS'
}
export interface TopologyFormat {
    /** Include participant authorization topology events in streams.
   If unset, no participant authorization topology events are emitted in the stream.
   
   Optional **/
    includeParticipantAuthorizationEvents?: ParticipantAuthorizationTopologyFormat
}
export interface ParticipantAuthorizationTopologyFormat {
    /** List of parties for which the topology transactions should be sent.
   Empty means: for all parties.
   
   Optional: can be empty **/
    parties?: string[]
}
export type Either_JsCantonError_JsGetUpdatesResponse =
    | JsCantonError
    | JsGetUpdatesResponse
export interface JsGetUpdatesResponse {
    update?: Update
}
export type Update =
    | OffsetCheckpoint2
    | Reassignment
    | TopologyTransaction
    | Transaction
export interface OffsetCheckpoint2 {
    value: OffsetCheckpoint1
}
export interface Reassignment {
    value: JsReassignment
}
export interface JsReassignment {
    /** Assigned by the server. Useful for correlating logs.
   Must be a valid LedgerString (as described in ``value.proto``).
   
   Required **/
    updateId: string
    /** The ID of the command which resulted in this reassignment. Missing for everyone except the submitting party on the submitting participant.
   Must be a valid LedgerString (as described in ``value.proto``).
   
   Optional **/
    commandId?: string
    /** The workflow ID used in reassignment command submission. Only set if the ``workflow_id`` for the command was set.
   Must be a valid LedgerString (as described in ``value.proto``).
   
   Optional **/
    workflowId?: string
    /** The participant's offset. The details of this field are described in ``community/ledger-api/README.md``.
   Must be a valid absolute offset (positive integer).
   
   Required **/
    offset: number
    /** The collection of reassignment events.
   
   Required: must be non-empty **/
    events: JsReassignmentEvent[]
    /** Ledger API trace context
   
   The trace context transported in this message corresponds to the trace context supplied
   by the client application in a HTTP2 header of the original command submission.
   We typically use a header to transfer this type of information. Here we use message
   body, because it is used in gRPC streams which do not support per message headers.
   This field will be populated with the trace context contained in the original submission.
   If that was not provided, a unique ledger-api-server generated trace context will be used
   instead.
   
   Optional **/
    traceContext?: TraceContext
    /** The time at which the reassignment was recorded. The record time refers to the source/target
   synchronizer for an unassign/assign event respectively.
   
   Required **/
    recordTime: string
    /** A valid synchronizer id.
   Identifies the synchronizer that synchronized this Reassignment.
   
   Required **/
    synchronizerId: string
    /** The traffic cost that this participant node paid for the corresponding (un)assignment request.
   
   Not set for transactions that were
   - initiated by another participant
   - initiated offline via the repair service
   - processed before the participant started serving traffic cost on the Ledger API
   - returned as part of a query filtering for a non submitting party
   
   Optional: can be empty **/
    paidTrafficCost?: number
}
export type JsReassignmentEvent = JsAssignmentEvent | JsUnassignedEvent
export interface JsAssignmentEvent {
    source: string
    target: string
    reassignmentId: string
    submitter: string
    reassignmentCounter: number
    createdEvent: CreatedEvent
}
export interface JsUnassignedEvent {
    value: UnassignedEvent
}
export interface TopologyTransaction {
    value: JsTopologyTransaction
}
export interface JsTopologyTransaction {
    /** Assigned by the server. Useful for correlating logs.
   Must be a valid LedgerString (as described in ``value.proto``).
   
   Required **/
    updateId: string
    /** The absolute offset. The details of this field are described in ``community/ledger-api/README.md``.
   It is a valid absolute offset (positive integer).
   
   Required **/
    offset: number
    /** A valid synchronizer id.
   Identifies the synchronizer that synchronized the topology transaction.
   
   Required **/
    synchronizerId: string
    /** The time at which the changes in the topology transaction become effective. There is a small delay between a
   topology transaction being sequenced and the changes it contains becoming effective. Topology transactions appear
   in order relative to a synchronizer based on their effective time rather than their sequencing time.
   
   Required **/
    recordTime: string
    /** A non-empty list of topology events.
   
   Required: must be non-empty **/
    events: TopologyEvent[]
    /** Ledger API trace context
   
   The trace context transported in this message corresponds to the trace context supplied
   by the client application in a HTTP2 header of the original command submission.
   We typically use a header to transfer this type of information. Here we use message
   body, because it is used in gRPC streams which do not support per message headers.
   This field will be populated with the trace context contained in the original submission.
   If that was not provided, a unique ledger-api-server generated trace context will be used
   instead.
   
   Optional **/
    traceContext?: TraceContext
}
export interface TopologyEvent {
    event?: TopologyEventEvent
}
export type TopologyEventEvent =
    | Empty3
    | ParticipantAuthorizationAdded
    | ParticipantAuthorizationChanged
    | ParticipantAuthorizationRevoked
export type Empty3 = Record<string, any>
export interface ParticipantAuthorizationAdded {
    value: ParticipantAuthorizationAdded1
}
export interface ParticipantAuthorizationAdded1 {
    /** Required **/
    partyId: string
    /** Required **/
    participantId: string
    /** Required **/
    participantPermission:
        | 'PARTICIPANT_PERMISSION_UNSPECIFIED'
        | 'PARTICIPANT_PERMISSION_SUBMISSION'
        | 'PARTICIPANT_PERMISSION_CONFIRMATION'
        | 'PARTICIPANT_PERMISSION_OBSERVATION'
}
export interface ParticipantAuthorizationChanged {
    value: ParticipantAuthorizationChanged1
}
export interface ParticipantAuthorizationChanged1 {
    /** Required **/
    partyId: string
    /** Required **/
    participantId: string
    /** Required **/
    participantPermission:
        | 'PARTICIPANT_PERMISSION_UNSPECIFIED'
        | 'PARTICIPANT_PERMISSION_SUBMISSION'
        | 'PARTICIPANT_PERMISSION_CONFIRMATION'
        | 'PARTICIPANT_PERMISSION_OBSERVATION'
}
export interface ParticipantAuthorizationRevoked {
    value: ParticipantAuthorizationRevoked1
}
export interface ParticipantAuthorizationRevoked1 {
    /** Required **/
    partyId: string
    /** Required **/
    participantId: string
}
export interface Transaction {
    value: JsTransaction
}
export interface JsTransaction {
    /** Assigned by the server. Useful for correlating logs.
   Must be a valid LedgerString (as described in ``value.proto``).
   
   Required **/
    updateId: string
    /** The ID of the command which resulted in this transaction. Missing for everyone except the submitting party.
   Must be a valid LedgerString (as described in ``value.proto``).
   
   Optional **/
    commandId?: string
    /** The workflow ID used in command submission.
   Must be a valid LedgerString (as described in ``value.proto``).
   
   Optional **/
    workflowId?: string
    /** Ledger effective time.
   
   Required **/
    effectiveAt: string
    /** The collection of events.
   Contains:
   
   - ``CreatedEvent`` or ``ArchivedEvent`` in case of ACS_DELTA transaction shape
   - ``CreatedEvent`` or ``ExercisedEvent`` in case of LEDGER_EFFECTS transaction shape
   
   Required: must be non-empty **/
    events: Event[]
    /** The absolute offset. The details of this field are described in ``community/ledger-api/README.md``.
   It is a valid absolute offset (positive integer).
   
   Required **/
    offset: number
    /** A valid synchronizer id.
   Identifies the synchronizer that synchronized the transaction.
   
   Required **/
    synchronizerId: string
    /** Ledger API trace context
   
   The trace context transported in this message corresponds to the trace context supplied
   by the client application in a HTTP2 header of the original command submission.
   We typically use a header to transfer this type of information. Here we use message
   body, because it is used in gRPC streams which do not support per message headers.
   This field will be populated with the trace context contained in the original submission.
   If that was not provided, a unique ledger-api-server generated trace context will be used
   instead.
   
   Optional **/
    traceContext?: TraceContext
    /** The time at which the transaction was recorded. The record time refers to the synchronizer
   which synchronized the transaction.
   
   Required **/
    recordTime: string
    /** For transaction externally signed, contains the external transaction hash
   signed by the external party. Can be used to correlate an external submission with a committed transaction.
   
   Optional: can be empty **/
    externalTransactionHash?: string
    /** The traffic cost that this participant node paid for the confirmation
   request for this transaction.
   
   Not set for transactions that were
   - initiated by another participant
   - initiated offline via the repair service
   - processed before the participant started serving traffic cost on the Ledger API
   - returned as part of a query filtering for a non submitting party
   
   Optional: can be empty **/
    paidTrafficCost?: number
}
export type Event = ArchivedEvent | CreatedEvent | ExercisedEvent
export interface ArchivedEvent {
    /** The offset of origin.
   Offsets are managed by the participant nodes.
   Transactions can thus NOT be assumed to have the same offsets on different participant nodes.
   It is a valid absolute offset (positive integer)
   
   Required **/
    offset: number
    /** The position of this event in the originating transaction or reassignment.
   Node IDs are not necessarily equal across participants,
   as these may see different projections/parts of transactions.
   Must be valid node ID (non-negative integer)
   
   Required **/
    nodeId: number
    /** The ID of the archived contract.
   Must be a valid LedgerString (as described in ``value.proto``).
   Required **/
    contractId: string
    /** Identifies the template that defines the choice that archived the contract.
   This template's package-id may differ from the target contract's package-id
   if the target contract has been upgraded or downgraded.
   
   The identifier uses the package-id reference format.
   
   Required **/
    templateId: string
    /** The parties that are notified of this event. For an ``ArchivedEvent``,
   these are the intersection of the stakeholders of the contract in
   question and the parties specified in the ``TransactionFilter``. The
   stakeholders are the union of the signatories and the observers of
   the contract.
   Each one of its elements must be a valid PartyIdString (as described
   in ``value.proto``).
   
   Required: must be non-empty **/
    witnessParties: string[]
    /** The package name of the contract.
   
   Required **/
    packageName: string
    /** The interfaces implemented by the target template that have been
   matched from the interface filter query.
   Populated only in case interface filters with include_interface_view set.
   
   If defined, the identifier uses the package-id reference format.
   
   Optional: can be empty **/
    implementedInterfaces?: string[]
}
export interface ExercisedEvent {
    /** The offset of origin.
   Offsets are managed by the participant nodes.
   Transactions can thus NOT be assumed to have the same offsets on different participant nodes.
   It is a valid absolute offset (positive integer)
   
   Required **/
    offset: number
    /** The position of this event in the originating transaction or reassignment.
   Node IDs are not necessarily equal across participants,
   as these may see different projections/parts of transactions.
   Must be valid node ID (non-negative integer)
   
   Required **/
    nodeId: number
    /** The ID of the target contract.
   Must be a valid LedgerString (as described in ``value.proto``).
   Required **/
    contractId: string
    /** Identifies the template that defines the executed choice.
   This template's package-id may differ from the target contract's package-id
   if the target contract has been upgraded or downgraded.
   
   The identifier uses the package-id reference format.
   
   Required **/
    templateId: string
    /** The interface where the choice is defined, if inherited.
   If defined, the identifier uses the package-id reference format.
   
   Optional **/
    interfaceId?: string
    /** The choice that was exercised on the target contract.
   Must be a valid NameString (as described in ``value.proto``).
   
   Required **/
    choice: string
    /** The argument of the exercised choice.
   
   Required **/
    choiceArgument: undefined
    /** The parties that exercised the choice.
   Each element must be a valid PartyIdString (as described in ``value.proto``).
   
   Required: must be non-empty **/
    actingParties: string[]
    /** If true, the target contract may no longer be exercised.
   
   Required **/
    consuming: boolean
    /** The parties that are notified of this event. The witnesses of an exercise
   node will depend on whether the exercise was consuming or not.
   If consuming, the witnesses are the union of the stakeholders,
   the actors and all informees of all the ancestors of this event this
   participant knows about.
   If not consuming, the witnesses are the union of the signatories,
   the actors and all informees of all the ancestors of this event this
   participant knows about.
   In both cases the witnesses are limited to the querying parties, or not
   limited in case anyParty filters are used.
   Note that the actors might not necessarily be observers
   and thus stakeholders. This is the case when the controllers of a
   choice are specified using "flexible controllers", using the
   ``choice ... controller`` syntax, and said controllers are not
   explicitly marked as observers.
   Each element must be a valid PartyIdString (as described in ``value.proto``).
   
   Required: must be non-empty **/
    witnessParties: string[]
    /** Specifies the upper boundary of the node ids of the events in the same transaction that appeared as a result of
   this ``ExercisedEvent``. This allows unambiguous identification of all the members of the subtree rooted at this
   node. A full subtree can be constructed when all descendant nodes are present in the stream. If nodes are heavily
   filtered, it is only possible to determine if a node is in a consequent subtree or not.
   
   Required **/
    lastDescendantNodeId: number
    /** The result of exercising the choice.
   
   Optional **/
    exerciseResult?: undefined
    /** The package name of the contract.
   
   Required **/
    packageName: string
    /** If the event is consuming, the interfaces implemented by the target template that have been
   matched from the interface filter query.
   Populated only in case interface filters with include_interface_view set.
   
   The identifier uses the package-id reference format.
   
   Optional: can be empty **/
    implementedInterfaces?: string[]
    /** Whether this event would be part of respective ACS_DELTA shaped stream,
   and should therefore considered when tracking contract activeness on the client-side.
   
   Required **/
    acsDelta: boolean
}
export type Either_JsCantonError_JsGetUpdateTreesResponse =
    | JsCantonError
    | JsGetUpdateTreesResponse
export interface JsGetUpdateTreesResponse {
    update?: Update1
}
export type Update1 = OffsetCheckpoint3 | Reassignment1 | TransactionTree
export interface OffsetCheckpoint3 {
    value: OffsetCheckpoint1
}
export interface Reassignment1 {
    value: JsReassignment
}
export interface TransactionTree {
    value: JsTransactionTree
}
export interface JsTransactionTree {
    /** Assigned by the server. Useful for correlating logs.
   Must be a valid LedgerString (as described in ``value.proto``).
   Required **/
    updateId: string
    /** The ID of the command which resulted in this transaction. Missing for everyone except the submitting party.
   Must be a valid LedgerString (as described in ``value.proto``).
   Optional **/
    commandId?: string
    /** The workflow ID used in command submission. Only set if the ``workflow_id`` for the command was set.
   Must be a valid LedgerString (as described in ``value.proto``).
   Optional **/
    workflowId?: string
    /** Ledger effective time.
   Required **/
    effectiveAt: string
    /** The absolute offset. The details of this field are described in ``community/ledger-api/README.md``.
   Required, it is a valid absolute offset (positive integer). **/
    offset: number
    /** Changes to the ledger that were caused by this transaction. Nodes of the transaction tree.
   Each key must be a valid node ID (non-negative integer).
   Required **/
    eventsById: Map_Int_TreeEvent
    /** A valid synchronizer id.
   Identifies the synchronizer that synchronized the transaction.
   Required **/
    synchronizerId: string
    /** Optional; ledger API trace context
   
   The trace context transported in this message corresponds to the trace context supplied
   by the client application in a HTTP2 header of the original command submission.
   We typically use a header to transfer this type of information. Here we use message
   body, because it is used in gRPC streams which do not support per message headers.
   This field will be populated with the trace context contained in the original submission.
   If that was not provided, a unique ledger-api-server generated trace context will be used
   instead. **/
    traceContext?: TraceContext
    /** The time at which the transaction was recorded. The record time refers to the synchronizer
   which synchronized the transaction.
   Required **/
    recordTime: string
}
export type Map_Int_TreeEvent = Record<string, TreeEvent>
export type TreeEvent = CreatedTreeEvent | ExercisedTreeEvent
export interface CreatedTreeEvent {
    value: CreatedEvent
}
export interface ExercisedTreeEvent {
    value: ExercisedEvent
}
export interface WebSocketChannels {
    '/v2/commands/completions': {
        subscribe: Either_JsCantonError_CompletionStreamResponse
        publish: CompletionStreamRequest
    }
    '/v2/state/active-contracts': {
        subscribe: Either_JsCantonError_JsGetActiveContractsResponse
        publish: GetActiveContractsRequest
    }
    '/v2/updates': {
        subscribe: Either_JsCantonError_JsGetUpdatesResponse
        publish: GetUpdatesRequest
    }
    '/v2/updates/flats': {
        subscribe: Either_JsCantonError_JsGetUpdatesResponse
        publish: GetUpdatesRequest
    }
    '/v2/updates/trees': {
        subscribe: Either_JsCantonError_JsGetUpdateTreesResponse
        publish: GetUpdatesRequest
    }
}
export declare const CHANNELS: {
    v2_commands_completions: '/v2/commands/completions'
    v2_state_active_contracts: '/v2/state/active-contracts'
    v2_updates: '/v2/updates'
    v2_updates_flats: '/v2/updates/flats'
    v2_updates_trees: '/v2/updates/trees'
}
export declare const API_INFO: {
    readonly title: 'JSON Ledger API WebSocket endpoints'
    readonly version: '3.4.12-SNAPSHOT'
    readonly description: 'This specification version fixes the API inconsistencies where certain fields marked as required in the spec are in fact optional.\nIf you use code generation tool based on this file, you might need to adjust the existing application code to handle those fields as optional.\nIf you do not want to change your client code, continue using the OpenAPI specification from the previous Canton 3.4 patch release.\nMINIMUM_CANTON_VERSION=3.4.12'
}
//# sourceMappingURL=asyncapi-3.4.12.d.ts.map
