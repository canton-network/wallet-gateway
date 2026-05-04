export interface paths {
    '/v2/commands/submit-and-wait': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /** @description Submit a batch of commands and wait for the completion details */
        post: operations['postV2CommandsSubmit-and-wait']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/commands/submit-and-wait-for-transaction': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /** @description Submit a batch of commands and wait for the transaction response */
        post: operations['postV2CommandsSubmit-and-wait-for-transaction']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/commands/submit-and-wait-for-reassignment': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /** @description Submit a batch of reassignment commands and wait for the reassignment response */
        post: operations['postV2CommandsSubmit-and-wait-for-reassignment']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/commands/submit-and-wait-for-transaction-tree': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /**
         * @deprecated
         * @description Submit a batch of commands and wait for the transaction trees response. Provided for backwards compatibility, it will be removed in the Canton version 3.5.0, use submit-and-wait-for-transaction instead.
         */
        post: operations['postV2CommandsSubmit-and-wait-for-transaction-tree']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/commands/async/submit': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /** @description Submit a command asynchronously */
        post: operations['postV2CommandsAsyncSubmit']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/commands/async/submit-reassignment': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /** @description Submit reassignment command asynchronously */
        post: operations['postV2CommandsAsyncSubmit-reassignment']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/commands/completions': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /**
         * @description Query completions list (blocking call)
         *     Notice: This endpoint should be used for small results set.
         *     When number of results exceeded node configuration limit (`http-list-max-elements-limit`)
         *     there will be an error (`413 Content Too Large`) returned.
         *     Increasing this limit may lead to performance issues and high memory consumption.
         *     Consider using websockets (asyncapi) for better efficiency with larger results.
         */
        post: operations['postV2CommandsCompletions']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/events/events-by-contract-id': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /** @description Get events by contract Id */
        post: operations['postV2EventsEvents-by-contract-id']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/version': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /** @description Get the version details of the participant node */
        get: operations['getV2Version']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/dars/validate': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /** @description Validates a DAR for upgrade-compatibility against the current vetting state on the target synchronizer */
        post: operations['postV2DarsValidate']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/dars': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /** @description Upload a DAR to the participant node */
        post: operations['postV2Dars']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/packages': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /** @description List all packages uploaded on the participant node */
        get: operations['getV2Packages']
        put?: never
        /** @description Upload a DAR to the participant node. Behaves the same as /dars. This endpoint will be deprecated and removed in a future release. */
        post: operations['postV2Packages']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/packages/{package-id}': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /** @description Download the package for the requested package-id */
        get: operations['getV2PackagesPackage-id']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/packages/{package-id}/status': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /** @description Get package status */
        get: operations['getV2PackagesPackage-idStatus']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/package-vetting': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /**
         * @deprecated
         * @description Lists which participant node vetted what packages on which synchronizer.
         *     This endpoint (GET /package-vetting) is deprecated and will be removed in a future release. Please use POST /package-vetting/list instead.
         */
        get: operations['getV2Package-vetting']
        put?: never
        /**
         * @deprecated
         * @description Update the vetted packages of this participant
         *     This endpoint (POST /package-vetting) is deprecated and will be removed in a future release. Please use POST /package-vetting/update instead.
         */
        post: operations['postV2Package-vetting']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/package-vetting/list': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        post: operations['postV2Package-vettingList']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/package-vetting/update': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /** @description Update vetted packages */
        post: operations['postV2Package-vettingUpdate']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/parties': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /** @description List all known parties. */
        get: operations['getV2Parties']
        put?: never
        /** @description Allocate a new party to the participant node */
        post: operations['postV2Parties']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/parties/external/allocate': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /** @description Allocate a new external party */
        post: operations['postV2PartiesExternalAllocate']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/parties/participant-id': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /** @description Get participant id */
        get: operations['getV2PartiesParticipant-id']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/parties/{party}': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /** @description Get party details */
        get: operations['getV2PartiesParty']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        /** @description Allocate a new party to the participant node */
        patch: operations['patchV2PartiesParty']
        trace?: never
    }
    '/v2/parties/external/generate-topology': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /** @description Generate a topology for an external party */
        post: operations['postV2PartiesExternalGenerate-topology']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/state/active-contracts': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /**
         * @description Query active contracts list (blocking call).
         *     Querying active contracts is an expensive operation and if possible should not be repeated often.
         *     Consider querying active contracts initially (for a given offset)
         *     and then repeatedly call one of `/v2/updates/...`endpoints  to get subsequent modifications.
         *     You can also use websockets to get updates with better performance.
         *
         *     Notice: This endpoint should be used for small results set.
         *     When number of results exceeded node configuration limit (`http-list-max-elements-limit`)
         *     there will be an error (`413 Content Too Large`) returned.
         *     Increasing this limit may lead to performance issues and high memory consumption.
         *     Consider using websockets (asyncapi) for better efficiency with larger results.
         */
        post: operations['postV2StateActive-contracts']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/state/connected-synchronizers': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /** @description Get connected synchronizers */
        get: operations['getV2StateConnected-synchronizers']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/state/ledger-end': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /** @description Get ledger end */
        get: operations['getV2StateLedger-end']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/state/latest-pruned-offsets': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /** @description Get latest pruned offsets */
        get: operations['getV2StateLatest-pruned-offsets']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/updates': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /**
         * @description Query updates list (blocking call)
         *     Notice: This endpoint should be used for small results set.
         *     When number of results exceeded node configuration limit (`http-list-max-elements-limit`)
         *     there will be an error (`413 Content Too Large`) returned.
         *     Increasing this limit may lead to performance issues and high memory consumption.
         *     Consider using websockets (asyncapi) for better efficiency with larger results.
         */
        post: operations['postV2Updates']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/updates/flats': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /**
         * @deprecated
         * @description Query flat transactions update list (blocking call). Provided for backwards compatibility, it will be removed in the Canton version 3.5.0, use v2/updates instead.
         *     Notice: This endpoint should be used for small results set.
         *     When number of results exceeded node configuration limit (`http-list-max-elements-limit`)
         *     there will be an error (`413 Content Too Large`) returned.
         *     Increasing this limit may lead to performance issues and high memory consumption.
         *     Consider using websockets (asyncapi) for better efficiency with larger results.
         */
        post: operations['postV2UpdatesFlats']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/updates/trees': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /**
         * @deprecated
         * @description Query update transactions tree list (blocking call). Provided for backwards compatibility, it will be removed in the Canton version 3.5.0, use v2/updates instead.
         *     Notice: This endpoint should be used for small results set.
         *     When number of results exceeded node configuration limit (`http-list-max-elements-limit`)
         *     there will be an error (`413 Content Too Large`) returned.
         *     Increasing this limit may lead to performance issues and high memory consumption.
         *     Consider using websockets (asyncapi) for better efficiency with larger results.
         */
        post: operations['postV2UpdatesTrees']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/updates/transaction-tree-by-offset/{offset}': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /**
         * @deprecated
         * @description Get transaction tree by offset. Provided for backwards compatibility, it will be removed in the Canton version 3.5.0, use v2/updates/update-by-offset instead.
         */
        get: operations['getV2UpdatesTransaction-tree-by-offsetOffset']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/updates/transaction-by-offset': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /**
         * @deprecated
         * @description Get transaction by offset. Provided for backwards compatibility, it will be removed in the Canton version 3.5.0, use v2/updates/update-by-offset instead.
         */
        post: operations['postV2UpdatesTransaction-by-offset']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/updates/update-by-offset': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /** @description Get update by offset */
        post: operations['postV2UpdatesUpdate-by-offset']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/updates/transaction-by-id': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /**
         * @deprecated
         * @description Get transaction by id. Provided for backwards compatibility, it will be removed in the Canton version 3.5.0, use v2/updates/update-by-id instead.
         */
        post: operations['postV2UpdatesTransaction-by-id']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/updates/update-by-id': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /** @description Get update by id */
        post: operations['postV2UpdatesUpdate-by-id']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/updates/transaction-tree-by-id/{update-id}': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /**
         * @deprecated
         * @description Get transaction tree by id. Provided for backwards compatibility, it will be removed in the Canton version 3.5.0, use v2/updates/update-by-id instead.
         */
        get: operations['getV2UpdatesTransaction-tree-by-idUpdate-id']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/users': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /** @description List all users. */
        get: operations['getV2Users']
        put?: never
        /** @description Create user. */
        post: operations['postV2Users']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/users/{user-id}': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /** @description Get user details. */
        get: operations['getV2UsersUser-id']
        put?: never
        post?: never
        /** @description Delete user. */
        delete: operations['deleteV2UsersUser-id']
        options?: never
        head?: never
        /** @description Update  user. */
        patch: operations['patchV2UsersUser-id']
        trace?: never
    }
    '/v2/authenticated-user': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /** @description Get current user details (uses user for JWT). */
        get: operations['getV2Authenticated-user']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/users/{user-id}/rights': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /** @description List user rights. */
        get: operations['getV2UsersUser-idRights']
        put?: never
        /** @description Grant user rights. */
        post: operations['postV2UsersUser-idRights']
        delete?: never
        options?: never
        head?: never
        /** @description Revoke user rights. */
        patch: operations['patchV2UsersUser-idRights']
        trace?: never
    }
    '/v2/users/{user-id}/identity-provider-id': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        /** @description Update user identity provider. */
        patch: operations['patchV2UsersUser-idIdentity-provider-id']
        trace?: never
    }
    '/v2/idps': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /** @description List all identity provider configs */
        get: operations['getV2Idps']
        put?: never
        /** @description Create identity provider configs */
        post: operations['postV2Idps']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/idps/{idp-id}': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /** @description Get identity provider config */
        get: operations['getV2IdpsIdp-id']
        put?: never
        post?: never
        /** @description Delete identity provider config */
        delete: operations['deleteV2IdpsIdp-id']
        options?: never
        head?: never
        /** @description Update identity provider config */
        patch: operations['patchV2IdpsIdp-id']
        trace?: never
    }
    '/v2/interactive-submission/prepare': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /** @description Prepare commands for signing */
        post: operations['postV2Interactive-submissionPrepare']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/interactive-submission/execute': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /** @description Execute a signed transaction */
        post: operations['postV2Interactive-submissionExecute']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/interactive-submission/executeAndWait': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /** @description Execute a signed transaction and wait for its completion */
        post: operations['postV2Interactive-submissionExecuteandwait']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/interactive-submission/executeAndWaitForTransaction': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /** @description Execute a signed transaction and wait for the transaction response */
        post: operations['postV2Interactive-submissionExecuteandwaitfortransaction']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/interactive-submission/preferred-package-version': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /** @description Get the preferred package version for constructing a command submission */
        get: operations['getV2Interactive-submissionPreferred-package-version']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/interactive-submission/preferred-packages': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /** @description Get the version of preferred packages for constructing a command submission */
        post: operations['postV2Interactive-submissionPreferred-packages']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/contracts/contract-by-id': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /**
         * @description Looking up contract data by contract ID.
         *     This endpoint is experimental / alpha, therefore no backwards compatibility is guaranteed.
         *     This endpoint must not be used to look up contracts which entered the participant via party replication
         *     or repair service.
         */
        post: operations['postV2ContractsContract-by-id']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
}
export type webhooks = Record<string, never>
export interface components {
    schemas: {
        /**
         * AllocateExternalPartyRequest
         * @description Required authorization: ``HasRight(ParticipantAdmin) OR IsAuthenticatedIdentityProviderAdmin(identity_provider_id)``
         */
        AllocateExternalPartyRequest: {
            /**
             * @description TODO(#27670) support synchronizer aliases
             *     Synchronizer ID on which to onboard the party
             *
             *     Required
             */
            synchronizer: string
            /**
             * @description TopologyTransactions to onboard the external party
             *     Can contain:
             *     - A namespace for the party.
             *     This can be either a single NamespaceDelegation,
             *     or DecentralizedNamespaceDefinition along with its authorized namespace owners in the form of NamespaceDelegations.
             *     May be provided, if so it must be fully authorized by the signatures in this request combined with the existing topology state.
             *     - A PartyToKeyMapping to register the party's signing keys.
             *     May be provided, if so it must be fully authorized by the signatures in this request combined with the existing topology state.
             *     - A PartyToParticipant to register the hosting relationship of the party.
             *     Must be provided.
             *
             *     Required: must be non-empty
             */
            onboardingTransactions: components['schemas']['SignedTransaction'][]
            /**
             * @description Optional signatures of the combined hash of all onboarding_transactions
             *     This may be used instead of providing signatures on each individual transaction
             *
             *     Optional: can be empty
             */
            multiHashSignatures?: components['schemas']['Signature'][]
            /**
             * @description The id of the ``Identity Provider``
             *     If not set, assume the party is managed by the default identity provider.
             *
             *     Optional
             */
            identityProviderId?: string
        }
        /** AllocateExternalPartyResponse */
        AllocateExternalPartyResponse: {
            /**
             * @description The allocated party id
             *
             *     Required
             */
            partyId: string
        }
        /**
         * AllocatePartyRequest
         * @description Required authorization: ``HasRight(ParticipantAdmin) OR IsAuthenticatedIdentityProviderAdmin(identity_provider_id)``
         */
        AllocatePartyRequest: {
            /**
             * @description A hint to the participant which party ID to allocate. It can be
             *     ignored.
             *     Must be a valid PartyIdString (as described in ``value.proto``).
             *
             *     Optional
             */
            partyIdHint?: string
            /**
             * @description Formerly "display_name"
             *     Participant-local metadata to be stored in the ``PartyDetails`` of this newly allocated party.
             *
             *     Optional
             */
            localMetadata?: components['schemas']['ObjectMeta']
            /**
             * @description The id of the ``Identity Provider``
             *     If not set, assume the party is managed by the default identity provider or party is not hosted by the participant.
             *
             *     Optional
             */
            identityProviderId?: string
            /**
             * @description The synchronizer, on which the party should be allocated.
             *     For backwards compatibility, this field may be omitted, if the participant is connected to only one synchronizer.
             *     Otherwise a synchronizer must be specified.
             *
             *     Optional
             */
            synchronizerId?: string
            /**
             * @description The user who will get the act_as rights to the newly allocated party.
             *     If set to an empty string (the default), no user will get rights to the party.
             *
             *     Optional
             */
            userId?: string
        }
        /** AllocatePartyResponse */
        AllocatePartyResponse: {
            /**
             * @description The allocated party details
             *
             *     Required
             */
            partyDetails: components['schemas']['PartyDetails']
        }
        /**
         * ArchivedEvent
         * @description Records that a contract has been archived, and choices may no longer be exercised on it.
         */
        ArchivedEvent: {
            /**
             * Format: int64
             * @description The offset of origin.
             *     Offsets are managed by the participant nodes.
             *     Transactions can thus NOT be assumed to have the same offsets on different participant nodes.
             *     It is a valid absolute offset (positive integer)
             *
             *     Required
             */
            offset: number
            /**
             * Format: int32
             * @description The position of this event in the originating transaction or reassignment.
             *     Node IDs are not necessarily equal across participants,
             *     as these may see different projections/parts of transactions.
             *     Must be valid node ID (non-negative integer)
             *
             *     Required
             */
            nodeId: number
            /**
             * @description The ID of the archived contract.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *     Required
             */
            contractId: string
            /**
             * @description Identifies the template that defines the choice that archived the contract.
             *     This template's package-id may differ from the target contract's package-id
             *     if the target contract has been upgraded or downgraded.
             *
             *     The identifier uses the package-id reference format.
             *
             *     Required
             */
            templateId: string
            /**
             * @description The parties that are notified of this event. For an ``ArchivedEvent``,
             *     these are the intersection of the stakeholders of the contract in
             *     question and the parties specified in the ``TransactionFilter``. The
             *     stakeholders are the union of the signatories and the observers of
             *     the contract.
             *     Each one of its elements must be a valid PartyIdString (as described
             *     in ``value.proto``).
             *
             *     Required: must be non-empty
             */
            witnessParties: string[]
            /**
             * @description The package name of the contract.
             *
             *     Required
             */
            packageName: string
            /**
             * @description The interfaces implemented by the target template that have been
             *     matched from the interface filter query.
             *     Populated only in case interface filters with include_interface_view set.
             *
             *     If defined, the identifier uses the package-id reference format.
             *
             *     Optional: can be empty
             */
            implementedInterfaces?: string[]
        }
        /**
         * AssignCommand
         * @description Assign a contract
         */
        AssignCommand: {
            value: components['schemas']['AssignCommand1']
        }
        /**
         * AssignCommand
         * @description Assign a contract
         */
        AssignCommand1: {
            /**
             * @description The ID from the unassigned event to be completed by this assignment.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *
             *     Required
             */
            reassignmentId: string
            /**
             * @description The ID of the source synchronizer
             *     Must be a valid synchronizer id
             *
             *     Required
             */
            source: string
            /**
             * @description The ID of the target synchronizer
             *     Must be a valid synchronizer id
             *
             *     Required
             */
            target: string
        }
        /** CanActAs */
        CanActAs: {
            value: components['schemas']['CanActAs1']
        }
        /** CanActAs */
        CanActAs1: {
            party: string
        }
        /** CanExecuteAs */
        CanExecuteAs: {
            value: components['schemas']['CanExecuteAs1']
        }
        /** CanExecuteAs */
        CanExecuteAs1: {
            party: string
        }
        /** CanExecuteAsAnyParty */
        CanExecuteAsAnyParty: {
            value: components['schemas']['CanExecuteAsAnyParty1']
        }
        /** CanExecuteAsAnyParty */
        CanExecuteAsAnyParty1: Record<string, never>
        /** CanReadAs */
        CanReadAs: {
            value: components['schemas']['CanReadAs1']
        }
        /** CanReadAs */
        CanReadAs1: {
            party: string
        }
        /** CanReadAsAnyParty */
        CanReadAsAnyParty: {
            value: components['schemas']['CanReadAsAnyParty1']
        }
        /** CanReadAsAnyParty */
        CanReadAsAnyParty1: Record<string, never>
        /**
         * Command
         * @description A command can either create a new contract or exercise a choice on an existing contract.
         */
        Command:
            | {
                  CreateAndExerciseCommand: components['schemas']['CreateAndExerciseCommand']
              }
            | {
                  CreateCommand: components['schemas']['CreateCommand']
              }
            | {
                  ExerciseByKeyCommand: components['schemas']['ExerciseByKeyCommand']
              }
            | {
                  ExerciseCommand: components['schemas']['ExerciseCommand']
              }
        /**
         * Command
         * @description A command can either create a new contract or exercise a choice on an existing contract.
         */
        Command1:
            | {
                  AssignCommand: components['schemas']['AssignCommand']
              }
            | {
                  Empty: components['schemas']['Empty2']
              }
            | {
                  UnassignCommand: components['schemas']['UnassignCommand']
              }
        /**
         * Completion
         * @description A completion represents the status of a submitted command on the ledger: it can be successful or failed.
         */
        Completion: {
            value: components['schemas']['Completion1']
        }
        /**
         * Completion
         * @description A completion represents the status of a submitted command on the ledger: it can be successful or failed.
         */
        Completion1: {
            /**
             * @description The ID of the succeeded or failed command.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *
             *     Required
             */
            commandId: string
            /**
             * @description Identifies the exact type of the error.
             *     It uses the same format of conveying error details as it is used for the RPC responses of the APIs.
             *
             *     Optional
             */
            status?: components['schemas']['JsStatus']
            /**
             * @description The update_id of the transaction or reassignment that resulted from the command with command_id.
             *
             *     Only set for successfully executed commands.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *     Optional
             */
            updateId?: string
            /**
             * @description The user-id that was used for the submission, as described in ``commands.proto``.
             *     Must be a valid UserIdString (as described in ``value.proto``).
             *
             *     Required
             */
            userId: string
            /**
             * @description The set of parties on whose behalf the commands were executed.
             *     Contains the ``act_as`` parties from ``commands.proto``
             *     filtered to the requesting parties in CompletionStreamRequest.
             *     The order of the parties need not be the same as in the submission.
             *     Each element must be a valid PartyIdString (as described in ``value.proto``).
             *
             *     Required: must be non-empty
             */
            actAs: string[]
            /**
             * @description The submission ID this completion refers to, as described in ``commands.proto``.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *
             *     Optional
             */
            submissionId?: string
            deduplicationPeriod?: components['schemas']['DeduplicationPeriod1']
            /**
             * @description The Ledger API trace context
             *
             *     The trace context transported in this message corresponds to the trace context supplied
             *     by the client application in a HTTP2 header of the original command submission.
             *     We typically use a header to transfer this type of information. Here we use message
             *     body, because it is used in gRPC streams which do not support per message headers.
             *     This field will be populated with the trace context contained in the original submission.
             *     If that was not provided, a unique ledger-api-server generated trace context will be used
             *     instead.
             *
             *     Optional
             */
            traceContext?: components['schemas']['TraceContext']
            /**
             * Format: int64
             * @description May be used in a subsequent CompletionStreamRequest to resume the consumption of this stream at a later time.
             *     Must be a valid absolute offset (positive integer).
             *
             *     Required
             */
            offset: number
            /**
             * @description The synchronizer along with its record time.
             *     The synchronizer id provided, in case of
             *
             *     - successful/failed transactions: identifies the synchronizer of the transaction
             *     - for successful/failed unassign commands: identifies the source synchronizer
             *     - for successful/failed assign commands: identifies the target synchronizer
             *
             *     Required
             */
            synchronizerTime: components['schemas']['SynchronizerTime']
            /**
             * Format: int64
             * @description The traffic cost paid by this participant node for the confirmation request
             *     for the submitted command.
             *
             *     Commands whose execution is rejected before their corresponding
             *     confirmation request is ordered by the synchronizer will report a paid
             *     traffic cost of zero.
             *     If a confirmation request is ordered for a command, but the request fails
             *     (e.g., due to contention with a concurrent contract archival), the traffic
             *     cost is paid and reported on the failed completion for the request.
             *
             *     If you want to correlate the traffic cost of a successful completion
             *     with the transaction that resulted from the command, you can use the
             *     ``offset`` field to retrieve the transaction using
             *     ``UpdateService.GetUpdateByOffset`` on the same participant node; or alternatively use the ``update_id``
             *     field to retrieve the transaction using ``UpdateService.GetUpdateById`` on any participant node
             *     that sees the transaction.
             *
             *     Note: for completions processed before the participant started serving
             *     traffic cost on the Ledger API, this field will be set to zero.
             *     Additionally, the total cost incurred by the submitting node for the submission of the transaction may be greater
             *     than the reported cost, for example if retries were issued due to failed submissions to the synchronizer.
             *     The cost reported here is the one paid for ordering the confirmation request.
             *
             *     Optional
             */
            paidTrafficCost?: number
        }
        /**
         * CompletionResponse
         * @description Required
         */
        CompletionResponse:
            | {
                  Completion: components['schemas']['Completion']
              }
            | {
                  Empty: components['schemas']['Empty4']
              }
            | {
                  OffsetCheckpoint: components['schemas']['OffsetCheckpoint']
              }
        /** CompletionStreamRequest */
        CompletionStreamRequest: {
            /**
             * @description Only completions of commands submitted with the same user_id will be visible in the stream.
             *     Must be a valid UserIdString (as described in ``value.proto``).
             *
             *     Required unless authentication is used with a user token.
             *     In that case, the token's user-id will be used for the request's user_id.
             *
             *     Optional
             */
            userId?: string
            /**
             * @description Non-empty list of parties whose data should be included.
             *     The stream shows only completions of commands for which at least one of the ``act_as`` parties is in the given set of parties.
             *     Must be a valid PartyIdString (as described in ``value.proto``).
             *
             *     Required: must be non-empty
             */
            parties: string[]
            /**
             * Format: int64
             * @description This optional field indicates the minimum offset for completions. This can be used to resume an earlier completion stream.
             *     If not set the ledger uses the ledger begin offset instead.
             *     If specified, it must be a valid absolute offset (positive integer) or zero (ledger begin offset).
             *     If the ledger has been pruned, this parameter must be specified and greater than the pruning offset.
             *
             *     Optional
             */
            beginExclusive?: number
        }
        /** CompletionStreamResponse */
        CompletionStreamResponse: {
            completionResponse?: components['schemas']['CompletionResponse']
        }
        /** ConnectedSynchronizer */
        ConnectedSynchronizer: {
            synchronizerAlias: string
            synchronizerId: string
            /** @enum {string} */
            permission:
                | 'PARTICIPANT_PERMISSION_UNSPECIFIED'
                | 'PARTICIPANT_PERMISSION_SUBMISSION'
                | 'PARTICIPANT_PERMISSION_CONFIRMATION'
                | 'PARTICIPANT_PERMISSION_OBSERVATION'
        }
        /**
         * CostEstimation
         * @description Estimation of the cost of submitting the prepared transaction
         *     The estimation is done against the synchronizer chosen during preparation of the transaction
         *     (or the one explicitly requested).
         *     The cost of re-assigning contracts to another synchronizer when necessary is not included in the estimation.
         */
        CostEstimation: {
            /**
             * @description Timestamp at which the estimation was made
             *
             *     Required
             */
            estimationTimestamp: string
            /**
             * Format: int64
             * @description Estimated traffic cost of the confirmation request associated with the transaction
             *
             *     Required
             */
            confirmationRequestTrafficCostEstimation: number
            /**
             * Format: int64
             * @description Estimated traffic cost of the confirmation response associated with the transaction
             *     This field can also be used as an indication of the cost that other potential confirming nodes
             *     of the party will incur to approve or reject the transaction
             *
             *     Required
             */
            confirmationResponseTrafficCostEstimation: number
            /**
             * Format: int64
             * @description Sum of the fields above
             *
             *     Required
             */
            totalTrafficCostEstimation: number
        }
        /**
         * CostEstimationHints
         * @description Hints to improve cost estimation precision of a prepared transaction
         */
        CostEstimationHints: {
            /**
             * @description Disable cost estimation
             *     Default (not set) is false
             *
             *     Optional
             */
            disabled?: boolean
            /**
             * @description Details on the keys that will be used to sign the transaction (how many and of which type).
             *     Signature size impacts the cost of the transaction.
             *     If empty, the signature sizes will be approximated with threshold-many signatures (where threshold is defined
             *     in the PartyToKeyMapping of the external party), using keys in the order they are registered.
             *     Empty list is equivalent to not providing this field
             *
             *     Optional: can be empty
             */
            expectedSignatures?: (
                | 'SIGNING_ALGORITHM_SPEC_UNSPECIFIED'
                | 'SIGNING_ALGORITHM_SPEC_ED25519'
                | 'SIGNING_ALGORITHM_SPEC_EC_DSA_SHA_256'
                | 'SIGNING_ALGORITHM_SPEC_EC_DSA_SHA_384'
            )[]
        }
        /**
         * CreateAndExerciseCommand
         * @description Create a contract and exercise a choice on it in the same transaction.
         */
        CreateAndExerciseCommand: {
            /**
             * @description The template of the contract the client wants to create.
             *     Both package-name and package-id reference identifier formats for the template-id are supported.
             *     Note: The package-id reference identifier format is deprecated. We plan to end support for this format in version 3.4.
             *
             *     Required
             */
            templateId: string
            /**
             * @description The arguments required for creating a contract from this template.
             *
             *     Required
             */
            createArguments: unknown
            /**
             * @description The name of the choice the client wants to exercise.
             *     Must be a valid NameString (as described in ``value.proto``).
             *
             *     Required
             */
            choice: string
            /**
             * @description The argument for this choice.
             *
             *     Required
             */
            choiceArgument: unknown
        }
        /**
         * CreateCommand
         * @description Create a new contract instance based on a template.
         */
        CreateCommand: {
            /**
             * @description The template of contract the client wants to create.
             *     Both package-name and package-id reference identifier formats for the template-id are supported.
             *     Note: The package-id reference identifier format is deprecated. We plan to end support for this format in version 3.4.
             *
             *     Required
             */
            templateId: string
            /**
             * @description The arguments required for creating a contract from this template.
             *
             *     Required
             */
            createArguments: unknown
        }
        /** CreateIdentityProviderConfigRequest */
        CreateIdentityProviderConfigRequest: {
            /** @description Required */
            identityProviderConfig: components['schemas']['IdentityProviderConfig']
        }
        /** CreateIdentityProviderConfigResponse */
        CreateIdentityProviderConfigResponse: {
            /** @description Required */
            identityProviderConfig: components['schemas']['IdentityProviderConfig']
        }
        /**
         * CreateUserRequest
         * @description RPC requests and responses
         *     ///////////////////////////
         *      Required authorization: ``HasRight(ParticipantAdmin) OR IsAuthenticatedIdentityProviderAdmin(user.identity_provider_id)``
         */
        CreateUserRequest: {
            /**
             * @description The user to create.
             *
             *     Required
             */
            user: components['schemas']['User']
            /**
             * @description The rights to be assigned to the user upon creation,
             *     which SHOULD include appropriate rights for the ``user.primary_party``.
             *
             *     Optional: can be empty
             */
            rights?: components['schemas']['Right'][]
        }
        /** CreateUserResponse */
        CreateUserResponse: {
            /**
             * @description Created user.
             *
             *     Required
             */
            user: components['schemas']['User']
        }
        /**
         * CreatedEvent
         * @description Records that a contract has been created, and choices may now be exercised on it.
         */
        CreatedEvent: {
            /**
             * Format: int64
             * @description The offset of origin, which has contextual meaning, please see description at messages that include a CreatedEvent.
             *     Offsets are managed by the participant nodes.
             *     Transactions can thus NOT be assumed to have the same offsets on different participant nodes.
             *     It is a valid absolute offset (positive integer)
             *
             *     Required
             */
            offset: number
            /**
             * Format: int32
             * @description The position of this event in the originating transaction or reassignment.
             *     The origin has contextual meaning, please see description at messages that include a CreatedEvent.
             *     Node IDs are not necessarily equal across participants,
             *     as these may see different projections/parts of transactions.
             *     Must be valid node ID (non-negative integer)
             *
             *     Required
             */
            nodeId: number
            /**
             * @description The ID of the created contract.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *
             *     Required
             */
            contractId: string
            /**
             * @description The template of the created contract.
             *     The identifier uses the package-id reference format.
             *
             *     Required
             */
            templateId: string
            /**
             * @description The key of the created contract.
             *     This will be set if and only if ``template_id`` defines a contract key.
             *
             *     Optional
             */
            contractKey?: unknown
            /**
             * @description The arguments that have been used to create the contract.
             *
             *     Required
             */
            createArgument: unknown
            /**
             * @description Opaque representation of contract create event payload intended for forwarding
             *     to an API server as a contract disclosed as part of a command
             *     submission.
             *
             *     Optional: can be empty
             */
            createdEventBlob?: string
            /**
             * @description Interface views specified in the transaction filter.
             *     Includes an ``InterfaceView`` for each interface for which there is a ``InterfaceFilter`` with
             *
             *     - its party in the ``witness_parties`` of this event,
             *     - and which is implemented by the template of this event,
             *     - and which has ``include_interface_view`` set.
             *
             *     Optional: can be empty
             */
            interfaceViews?: components['schemas']['JsInterfaceView'][]
            /**
             * @description The parties that are notified of this event. When a ``CreatedEvent``
             *     is returned as part of a transaction tree or ledger-effects transaction, this will include all
             *     the parties specified in the ``TransactionFilter`` that are witnesses  of the event
             *     (the stakeholders of the contract and all informees of all the ancestors
             *     of this create action that this participant knows about).
             *     If served as part of a ACS delta transaction those will
             *     be limited to all parties specified in the ``TransactionFilter`` that
             *     are stakeholders of the contract (i.e. either signatories or observers).
             *     If the ``CreatedEvent`` is returned as part of an AssignedEvent,
             *     ActiveContract or IncompleteUnassigned (so the event is related to
             *     an assignment or unassignment): this will include all parties of the
             *     ``TransactionFilter`` that are stakeholders of the contract.
             *
             *     The behavior of reading create events visible to parties not hosted
             *     on the participant node serving the Ledger API is undefined. Concretely,
             *     there is neither a guarantee that the participant node will serve all their
             *     create events on the ACS stream, nor is there a guarantee that matching archive
             *     events are delivered for such create events.
             *
             *     For most clients this is not a problem, as they only read events for parties
             *     that are hosted on the participant node. If you need to read events
             *     for parties that may not be hosted at all times on the participant node,
             *     subscribe to the ``TopologyEvent``s for that party by setting a corresponding
             *     ``UpdateFormat``.  Using these events, query the ACS as-of an offset where the
             *     party is hosted on the participant node, and ignore create events at offsets
             *     where the party is not hosted on the participant node.
             *
             *     Required: must be non-empty
             */
            witnessParties: string[]
            /**
             * @description The signatories for this contract as specified by the template.
             *
             *     Required: must be non-empty
             */
            signatories: string[]
            /**
             * @description The observers for this contract as specified explicitly by the template or implicitly as choice controllers.
             *     This field never contains parties that are signatories.
             *
             *     Optional: can be empty
             */
            observers?: string[]
            /**
             * @description Ledger effective time of the transaction that created the contract.
             *
             *     Required
             */
            createdAt: string
            /**
             * @description The package name of the created contract.
             *
             *     Required
             */
            packageName: string
            /**
             * @description A package-id present in the participant package store that typechecks the contract's argument.
             *     This may differ from the package-id of the template used to create the contract.
             *     For contracts created before Canton 3.4, this field matches the contract's creation package-id.
             *
             *     NOTE: Experimental, server internal concept, not for client consumption. Subject to change without notice.
             *
             *     Required
             */
            representativePackageId: string
            /**
             * @description Whether this event would be part of respective ACS_DELTA shaped stream,
             *     and should therefore considered when tracking contract activeness on the client-side.
             *
             *     Required
             */
            acsDelta: boolean
        }
        /** CreatedTreeEvent */
        CreatedTreeEvent: {
            value: components['schemas']['CreatedEvent']
        }
        /**
         * CumulativeFilter
         * @description A filter that matches all contracts that are either an instance of one of
         *     the ``template_filters`` or that match one of the ``interface_filters``.
         */
        CumulativeFilter: {
            identifierFilter?: components['schemas']['IdentifierFilter']
        }
        /** DeduplicationDuration */
        DeduplicationDuration: {
            value: components['schemas']['Duration']
        }
        /** DeduplicationDuration */
        DeduplicationDuration1: {
            value: components['schemas']['Duration']
        }
        /** DeduplicationDuration */
        DeduplicationDuration2: {
            value: components['schemas']['Duration']
        }
        /** DeduplicationOffset */
        DeduplicationOffset: {
            /** Format: int64 */
            value: number
        }
        /** DeduplicationOffset */
        DeduplicationOffset1: {
            /** Format: int64 */
            value: number
        }
        /** DeduplicationOffset */
        DeduplicationOffset2: {
            /** Format: int64 */
            value: number
        }
        /**
         * DeduplicationPeriod
         * @description Specifies the deduplication period for the change ID.
         *     If omitted, the participant will assume the configured maximum deduplication time.
         *
         *     Optional
         */
        DeduplicationPeriod:
            | {
                  DeduplicationDuration: components['schemas']['DeduplicationDuration']
              }
            | {
                  DeduplicationOffset: components['schemas']['DeduplicationOffset']
              }
            | {
                  Empty: components['schemas']['Empty']
              }
        /**
         * DeduplicationPeriod
         * @description The actual deduplication window used for the submission, which is derived from
         *     ``Commands.deduplication_period``. The ledger may convert the deduplication period into other
         *     descriptions and extend the period in implementation-specified ways.
         *
         *     Used to audit the deduplication guarantee described in ``commands.proto``.
         *
         *     The deduplication guarantee applies even if the completion omits this field.
         *
         *     Optional
         */
        DeduplicationPeriod1:
            | {
                  DeduplicationDuration: components['schemas']['DeduplicationDuration1']
              }
            | {
                  DeduplicationOffset: components['schemas']['DeduplicationOffset1']
              }
            | {
                  Empty: components['schemas']['Empty3']
              }
        /** DeduplicationPeriod */
        DeduplicationPeriod2:
            | {
                  DeduplicationDuration: components['schemas']['DeduplicationDuration2']
              }
            | {
                  DeduplicationOffset: components['schemas']['DeduplicationOffset2']
              }
            | {
                  Empty: components['schemas']['Empty10']
              }
        /**
         * DeleteIdentityProviderConfigResponse
         * @description Does not (yet) contain any data.
         */
        DeleteIdentityProviderConfigResponse: Record<string, never>
        /**
         * DisclosedContract
         * @description An additional contract that is used to resolve
         *     contract & contract key lookups.
         */
        DisclosedContract: {
            /**
             * @description The template id of the contract.
             *     The identifier uses the package-id reference format.
             *
             *     If provided, used to validate the template id of the contract serialized in the created_event_blob.
             *
             *     Optional
             */
            templateId?: string
            /**
             * @description The contract id
             *
             *     If provided, used to validate the contract id of the contract serialized in the created_event_blob.
             *
             *     Optional
             */
            contractId?: string
            /**
             * @description Opaque byte string containing the complete payload required by the Daml engine
             *     to reconstruct a contract not known to the receiving participant.
             *
             *     Required: must be non-empty
             */
            createdEventBlob: string
            /**
             * @description The ID of the synchronizer where the contract is currently assigned
             *
             *     Optional
             */
            synchronizerId?: string
        }
        /** Duration */
        Duration: {
            /** Format: int64 */
            seconds: number
            /** Format: int32 */
            nanos: number
            /** @description This field is automatically added as part of protobuf to json mapping */
            unknownFields?: components['schemas']['UnknownFieldSet']
        }
        /** Empty */
        Empty: Record<string, never>
        /** Empty */
        Empty1: Record<string, never>
        /** Empty */
        Empty10: Record<string, never>
        /** Empty */
        Empty2: Record<string, never>
        /** Empty */
        Empty3: Record<string, never>
        /** Empty */
        Empty4: Record<string, never>
        /** Empty */
        Empty5: Record<string, never>
        /** Empty */
        Empty6: Record<string, never>
        /** Empty */
        Empty7: Record<string, never>
        /** Empty */
        Empty8: Record<string, never>
        /** Empty */
        Empty9: Record<string, never>
        /**
         * Event
         * @description Events in transactions can have two primary shapes:
         *
         *     - ACS delta: events can be CreatedEvent or ArchivedEvent
         *     - ledger effects: events can be CreatedEvent or ExercisedEvent
         *
         *     In the update service the events are restricted to the events
         *     visible for the parties specified in the transaction filter. Each
         *     event message type below contains a ``witness_parties`` field which
         *     indicates the subset of the requested parties that can see the event
         *     in question.
         */
        Event:
            | {
                  ArchivedEvent: components['schemas']['ArchivedEvent']
              }
            | {
                  CreatedEvent: components['schemas']['CreatedEvent']
              }
            | {
                  ExercisedEvent: components['schemas']['ExercisedEvent']
              }
        /**
         * EventFormat
         * @description A format for events which defines both which events should be included
         *     and what data should be computed and included for them.
         *
         *     Note that some of the filtering behavior depends on the `TransactionShape`,
         *     which is expected to be specified alongside usages of `EventFormat`.
         */
        EventFormat: {
            /**
             * @description Each key must be a valid PartyIdString (as described in ``value.proto``).
             *     The interpretation of the filter depends on the transaction-shape being filtered:
             *
             *     1. For **ledger-effects** create and exercise events are returned, for which the witnesses include at least one of
             *        the listed parties and match the per-party filter.
             *     2. For **transaction and active-contract-set streams** create and archive events are returned for all contracts whose
             *        stakeholders include at least one of the listed parties and match the per-party filter.
             *
             *     Optional: can be empty
             */
            filtersByParty?: components['schemas']['Map_Filters']
            /**
             * @description Wildcard filters that apply to all the parties existing on the participant. The interpretation of the filters is the same
             *     with the per-party filter as described above.
             *
             *     Optional
             */
            filtersForAnyParty?: components['schemas']['Filters']
            /**
             * @description If enabled, values served over the API will contain more information than strictly necessary to interpret the data.
             *     In particular, setting the verbose flag to true triggers the ledger to include labels for record fields.
             *
             *     Optional
             */
            verbose?: boolean
        }
        /** ExecuteSubmissionAndWaitResponse */
        ExecuteSubmissionAndWaitResponse: {
            /**
             * @description The id of the transaction that resulted from the submitted command.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *
             *     Required
             */
            updateId: string
            /**
             * Format: int64
             * @description The details of the offset field are described in ``community/ledger-api/README.md``.
             *
             *     Required
             */
            completionOffset: number
        }
        /** ExecuteSubmissionResponse */
        ExecuteSubmissionResponse: Record<string, never>
        /**
         * ExerciseByKeyCommand
         * @description Exercise a choice on an existing contract specified by its key.
         */
        ExerciseByKeyCommand: {
            /**
             * @description The template of contract the client wants to exercise.
             *     Both package-name and package-id reference identifier formats for the template-id are supported.
             *     Note: The package-id reference identifier format is deprecated. We plan to end support for this format in version 3.4.
             *
             *     Required
             */
            templateId: string
            /**
             * @description The key of the contract the client wants to exercise upon.
             *
             *     Required
             */
            contractKey: unknown
            /**
             * @description The name of the choice the client wants to exercise.
             *     Must be a valid NameString (as described in ``value.proto``)
             *
             *     Required
             */
            choice: string
            /**
             * @description The argument for this choice.
             *
             *     Required
             */
            choiceArgument: unknown
        }
        /**
         * ExerciseCommand
         * @description Exercise a choice on an existing contract.
         */
        ExerciseCommand: {
            /**
             * @description The template or interface of the contract the client wants to exercise.
             *     Both package-name and package-id reference identifier formats for the template-id are supported.
             *     Note: The package-id reference identifier format is deprecated. We plan to end support for this format in version 3.4.
             *     To exercise a choice on an interface, specify the interface identifier in the template_id field.
             *
             *     Required
             */
            templateId: string
            /**
             * @description The ID of the contract the client wants to exercise upon.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *
             *     Required
             */
            contractId: string
            /**
             * @description The name of the choice the client wants to exercise.
             *     Must be a valid NameString (as described in ``value.proto``)
             *
             *     Required
             */
            choice: string
            /**
             * @description The argument for this choice.
             *
             *     Required
             */
            choiceArgument: unknown
        }
        /**
         * ExercisedEvent
         * @description Records that a choice has been exercised on a target contract.
         */
        ExercisedEvent: {
            /**
             * Format: int64
             * @description The offset of origin.
             *     Offsets are managed by the participant nodes.
             *     Transactions can thus NOT be assumed to have the same offsets on different participant nodes.
             *     It is a valid absolute offset (positive integer)
             *
             *     Required
             */
            offset: number
            /**
             * Format: int32
             * @description The position of this event in the originating transaction or reassignment.
             *     Node IDs are not necessarily equal across participants,
             *     as these may see different projections/parts of transactions.
             *     Must be valid node ID (non-negative integer)
             *
             *     Required
             */
            nodeId: number
            /**
             * @description The ID of the target contract.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *     Required
             */
            contractId: string
            /**
             * @description Identifies the template that defines the executed choice.
             *     This template's package-id may differ from the target contract's package-id
             *     if the target contract has been upgraded or downgraded.
             *
             *     The identifier uses the package-id reference format.
             *
             *     Required
             */
            templateId: string
            /**
             * @description The interface where the choice is defined, if inherited.
             *     If defined, the identifier uses the package-id reference format.
             *
             *     Optional
             */
            interfaceId?: string
            /**
             * @description The choice that was exercised on the target contract.
             *     Must be a valid NameString (as described in ``value.proto``).
             *
             *     Required
             */
            choice: string
            /**
             * @description The argument of the exercised choice.
             *
             *     Required
             */
            choiceArgument: unknown
            /**
             * @description The parties that exercised the choice.
             *     Each element must be a valid PartyIdString (as described in ``value.proto``).
             *
             *     Required: must be non-empty
             */
            actingParties: string[]
            /**
             * @description If true, the target contract may no longer be exercised.
             *
             *     Required
             */
            consuming: boolean
            /**
             * @description The parties that are notified of this event. The witnesses of an exercise
             *     node will depend on whether the exercise was consuming or not.
             *     If consuming, the witnesses are the union of the stakeholders,
             *     the actors and all informees of all the ancestors of this event this
             *     participant knows about.
             *     If not consuming, the witnesses are the union of the signatories,
             *     the actors and all informees of all the ancestors of this event this
             *     participant knows about.
             *     In both cases the witnesses are limited to the querying parties, or not
             *     limited in case anyParty filters are used.
             *     Note that the actors might not necessarily be observers
             *     and thus stakeholders. This is the case when the controllers of a
             *     choice are specified using "flexible controllers", using the
             *     ``choice ... controller`` syntax, and said controllers are not
             *     explicitly marked as observers.
             *     Each element must be a valid PartyIdString (as described in ``value.proto``).
             *
             *     Required: must be non-empty
             */
            witnessParties: string[]
            /**
             * Format: int32
             * @description Specifies the upper boundary of the node ids of the events in the same transaction that appeared as a result of
             *     this ``ExercisedEvent``. This allows unambiguous identification of all the members of the subtree rooted at this
             *     node. A full subtree can be constructed when all descendant nodes are present in the stream. If nodes are heavily
             *     filtered, it is only possible to determine if a node is in a consequent subtree or not.
             *
             *     Required
             */
            lastDescendantNodeId: number
            /**
             * @description The result of exercising the choice.
             *
             *     Optional
             */
            exerciseResult?: unknown
            /**
             * @description The package name of the contract.
             *
             *     Required
             */
            packageName: string
            /**
             * @description If the event is consuming, the interfaces implemented by the target template that have been
             *     matched from the interface filter query.
             *     Populated only in case interface filters with include_interface_view set.
             *
             *     The identifier uses the package-id reference format.
             *
             *     Optional: can be empty
             */
            implementedInterfaces?: string[]
            /**
             * @description Whether this event would be part of respective ACS_DELTA shaped stream,
             *     and should therefore considered when tracking contract activeness on the client-side.
             *
             *     Required
             */
            acsDelta: boolean
        }
        /** ExercisedTreeEvent */
        ExercisedTreeEvent: {
            value: components['schemas']['ExercisedEvent']
        }
        /**
         * ExperimentalCommandInspectionService
         * @description Whether the Ledger API supports command inspection service
         */
        ExperimentalCommandInspectionService: {
            /** @description Required */
            supported: boolean
        }
        /**
         * ExperimentalFeatures
         * @description See the feature message definitions for descriptions.
         */
        ExperimentalFeatures: {
            /** @description Optional */
            staticTime?: components['schemas']['ExperimentalStaticTime']
            /** @description Optional */
            commandInspectionService?: components['schemas']['ExperimentalCommandInspectionService']
        }
        /**
         * ExperimentalStaticTime
         * @description Ledger is in the static time mode and exposes a time service.
         */
        ExperimentalStaticTime: {
            /** @description Required */
            supported: boolean
        }
        /** FeaturesDescriptor */
        FeaturesDescriptor: {
            /**
             * @description Features under development or features that are used
             *     for ledger implementation testing purposes only.
             *
             *     Daml applications SHOULD not depend on these in production.
             *
             *     Required
             */
            experimental: components['schemas']['ExperimentalFeatures']
            /**
             * @description If set, then the Ledger API server supports user management.
             *     It is recommended that clients query this field to gracefully adjust their behavior for
             *     ledgers that do not support user management.
             *
             *     Required
             */
            userManagement: components['schemas']['UserManagementFeature']
            /**
             * @description If set, then the Ledger API server supports party management configurability.
             *     It is recommended that clients query this field to gracefully adjust their behavior to
             *     maximum party page size.
             *
             *     Required
             */
            partyManagement: components['schemas']['PartyManagementFeature']
            /**
             * @description It contains the timeouts related to the periodic offset checkpoint emission
             *
             *     Required
             */
            offsetCheckpoint: components['schemas']['OffsetCheckpointFeature']
            /**
             * @description If set, then the Ledger API server supports package listing
             *     configurability. It is recommended that clients query this field to
             *     gracefully adjust their behavior to maximum package listing page size.
             *
             *     Required
             */
            packageFeature: components['schemas']['PackageFeature']
        }
        /** Field */
        Field: {
            varint?: number[]
            fixed64?: number[]
            fixed32?: number[]
            lengthDelimited?: string[]
        }
        /** FieldMask */
        FieldMask: {
            paths?: string[]
            unknownFields: components['schemas']['UnknownFieldSet']
        }
        /**
         * Filters
         * @description The union of a set of template filters, interface filters, or a wildcard.
         */
        Filters: {
            /**
             * @description Every filter in the cumulative list expands the scope of the resulting stream. Each interface,
             *     template or wildcard filter means additional events that will match the query.
             *     The impact of include_interface_view and include_created_event_blob fields in the filters will
             *     also be accumulated.
             *     A template or an interface SHOULD NOT appear twice in the accumulative field.
             *     A wildcard filter SHOULD NOT be defined more than once in the accumulative field.
             *     If no ``CumulativeFilter`` defined, the default of a single ``WildcardFilter`` with
             *     include_created_event_blob unset is used.
             *
             *     Optional: can be empty
             */
            cumulative?: components['schemas']['CumulativeFilter'][]
        }
        /** GenerateExternalPartyTopologyRequest */
        GenerateExternalPartyTopologyRequest: {
            /**
             * @description Synchronizer-id for which we are building this request.
             *     TODO(#27670) support synchronizer aliases
             *
             *     Required
             */
            synchronizer: string
            /**
             * @description The actual party id will be constructed from this hint and a fingerprint of the public key
             *
             *     Required
             */
            partyHint: string
            /**
             * @description Public key
             *
             *     Required
             */
            publicKey: components['schemas']['SigningPublicKey']
            /**
             * @description If true, then the local participant will only be observing, not confirming. Default false.
             *
             *     Optional
             */
            localParticipantObservationOnly?: boolean
            /**
             * @description Other participant ids which should be confirming for this party
             *
             *     Optional: can be empty
             */
            otherConfirmingParticipantUids?: string[]
            /**
             * Format: int32
             * @description Confirmation threshold >= 1 for the party. Defaults to all available confirmers (or if set to 0).
             *
             *     Optional
             */
            confirmationThreshold?: number
            /**
             * @description Other observing participant ids for this party
             *
             *     Optional: can be empty
             */
            observingParticipantUids?: string[]
        }
        /**
         * GenerateExternalPartyTopologyResponse
         * @description Response message with topology transactions and the multi-hash to be signed.
         */
        GenerateExternalPartyTopologyResponse: {
            /**
             * @description The generated party id
             *
             *     Required
             */
            partyId: string
            /**
             * @description The fingerprint of the supplied public key
             *
             *     Required
             */
            publicKeyFingerprint: string
            /**
             * @description The serialized topology transactions which need to be signed and submitted as part of the allocate party process
             *     Note that the serialization includes the versioning information. Therefore, the transaction here is serialized
             *     as an `UntypedVersionedMessage` which in turn contains the serialized `TopologyTransaction` in the version
             *     supported by the synchronizer.
             *
             *     Required: must be non-empty
             */
            topologyTransactions: string[]
            /**
             * @description the multi-hash which may be signed instead of each individual transaction
             *
             *     Required: must be non-empty
             */
            multiHash: string
        }
        /**
         * GetActiveContractsRequest
         * @description If the given offset is different than the ledger end, and there are (un)assignments in-flight at the given offset,
         *     the snapshot may fail with "FAILED_PRECONDITION/PARTICIPANT_PRUNED_DATA_ACCESSED".
         *     Note that it is ok to request acs snapshots for party migration with offsets other than ledger end, because party
         *     migration is not concerned with incomplete (un)assignments.
         */
        GetActiveContractsRequest: {
            /**
             * @description Provided for backwards compatibility, it will be removed in the Canton version 3.5.0.
             *     Templates to include in the served snapshot, per party.
             *     Optional, if specified event_format must be unset, if not specified event_format must be set.
             */
            filter?: components['schemas']['TransactionFilter']
            /**
             * @description Provided for backwards compatibility, it will be removed in the Canton version 3.5.0.
             *     If enabled, values served over the API will contain more information than strictly necessary to interpret the data.
             *     In particular, setting the verbose flag to true triggers the ledger to include labels for record fields.
             *     Optional, if specified event_format must be unset.
             */
            verbose?: boolean
            /**
             * Format: int64
             * @description The offset at which the snapshot of the active contracts will be computed.
             *     Must be no greater than the current ledger end offset.
             *     Must be greater than or equal to the last pruning offset.
             *     Must be a valid absolute offset (positive integer) or ledger begin offset (zero).
             *     If zero, the empty set will be returned.
             *
             *     Required
             */
            activeAtOffset: number
            /**
             * @description Format of the contract_entries in the result. In case of CreatedEvent the presentation will be of
             *     TRANSACTION_SHAPE_ACS_DELTA.
             *
             *     Required
             */
            eventFormat: components['schemas']['EventFormat']
        }
        /** GetConnectedSynchronizersResponse */
        GetConnectedSynchronizersResponse: {
            /** @description Optional: can be empty */
            connectedSynchronizers?: components['schemas']['ConnectedSynchronizer'][]
        }
        /** GetContractRequest */
        GetContractRequest: {
            /**
             * @description The ID of the contract.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *
             *     Required
             */
            contractId: string
            /**
             * @description The list of querying parties
             *     The stakeholders of the referenced contract must have an intersection with any of these parties
             *     to return the result.
             *     If no querying_parties specified, all possible contracts could be returned.
             *
             *     Optional: can be empty
             */
            queryingParties?: string[]
        }
        /** GetContractResponse */
        GetContractResponse: {
            /**
             * @description The representative_package_id will be always set to the contract package ID, therefore this endpoint should
             *     not be used to lookup contract which entered the participant via party replication or repair service.
             *     The witnesses field will contain only the querying_parties which are also stakeholders of the contract as well.
             *     The following fields of the created event cannot be populated, so those should not be used / parsed:
             *
             *     - offset
             *     - node_id
             *     - created_event_blob
             *     - interface_views
             *     - acs_delta
             *
             *     Required
             */
            createdEvent: components['schemas']['CreatedEvent']
        }
        /** GetEventsByContractIdRequest */
        GetEventsByContractIdRequest: {
            /**
             * @description The contract id being queried.
             *
             *     Required
             */
            contractId: string
            /**
             * @description Format of the events in the result, the presentation will be of TRANSACTION_SHAPE_ACS_DELTA.
             *
             *     Required
             */
            eventFormat: components['schemas']['EventFormat']
        }
        /** GetIdentityProviderConfigResponse */
        GetIdentityProviderConfigResponse: {
            /** @description Required */
            identityProviderConfig: components['schemas']['IdentityProviderConfig']
        }
        /** GetLatestPrunedOffsetsResponse */
        GetLatestPrunedOffsetsResponse: {
            /**
             * Format: int64
             * @description It will always be a non-negative integer.
             *     If positive, the absolute offset up to which the ledger has been pruned,
             *     disregarding the state of all divulged contracts pruning.
             *     If zero, the ledger has not been pruned yet.
             *
             *     Optional
             */
            participantPrunedUpToInclusive?: number
            /**
             * Format: int64
             * @description It will always be a non-negative integer.
             *     If positive, the absolute offset up to which all divulged events have been pruned on the ledger.
             *     It can be at or before the ``participant_pruned_up_to_inclusive`` offset.
             *     For more details about all divulged events pruning,
             *     see ``PruneRequest.prune_all_divulged_contracts`` in ``participant_pruning_service.proto``.
             *     If zero, the divulged events have not been pruned yet.
             *
             *     Optional
             */
            allDivulgedContractsPrunedUpToInclusive?: number
        }
        /** GetLedgerApiVersionResponse */
        GetLedgerApiVersionResponse: {
            /**
             * @description The version of the ledger API.
             *
             *     Required
             */
            version: string
            /**
             * @description The features supported by this Ledger API endpoint.
             *
             *     Daml applications CAN use the feature descriptor on top of
             *     version constraints on the Ledger API version to determine
             *     whether a given Ledger API endpoint supports the features
             *     required to run the application.
             *
             *     See the feature descriptions themselves for the relation between
             *     Ledger API versions and feature presence.
             *
             *     Required
             */
            features: components['schemas']['FeaturesDescriptor']
        }
        /** GetLedgerEndResponse */
        GetLedgerEndResponse: {
            /**
             * Format: int64
             * @description It will always be a non-negative integer.
             *     If zero, the participant view of the ledger is empty.
             *     If positive, the absolute offset of the ledger as viewed by the participant.
             *
             *     Optional
             */
            offset?: number
        }
        /** GetPackageStatusResponse */
        GetPackageStatusResponse: {
            /**
             * @description The status of the package.
             *
             *     Required
             * @enum {string}
             */
            packageStatus:
                | 'PACKAGE_STATUS_UNSPECIFIED'
                | 'PACKAGE_STATUS_REGISTERED'
        }
        /** GetParticipantIdResponse */
        GetParticipantIdResponse: {
            /**
             * @description Identifier of the participant, which SHOULD be globally unique.
             *     Must be a valid LedgerString (as describe in ``value.proto``).
             *
             *     Required
             */
            participantId: string
        }
        /** GetPartiesResponse */
        GetPartiesResponse: {
            /**
             * @description The details of the requested Daml parties by the participant, if known.
             *     The party details may not be in the same order as requested.
             *     Required: must be non-empty
             */
            partyDetails: components['schemas']['PartyDetails'][]
        }
        /** GetPreferredPackageVersionResponse */
        GetPreferredPackageVersionResponse: {
            /**
             * @description Not populated when no preferred package is found
             *
             *     Optional
             */
            packagePreference?: components['schemas']['PackagePreference']
        }
        /** GetPreferredPackagesRequest */
        GetPreferredPackagesRequest: {
            /**
             * @description The package-name vetting requirements for which the preferred packages should be resolved.
             *
             *     Generally it is enough to provide the requirements for the intended command's root package-names.
             *     Additional package-name requirements can be provided when additional Daml transaction informees need to use
             *     package dependencies of the command's root packages.
             *
             *     Required: must be non-empty
             */
            packageVettingRequirements: components['schemas']['PackageVettingRequirement'][]
            /**
             * @description The synchronizer whose vetting state should be used for resolving this query.
             *     If not specified, the vetting states of all synchronizers to which the participant is connected are used.
             *     Optional
             */
            synchronizerId?: string
            /**
             * @description The timestamp at which the package vetting validity should be computed
             *     on the latest topology snapshot as seen by the participant.
             *     If not provided, the participant's current clock time is used.
             *
             *     Optional
             */
            vettingValidAt?: string
        }
        /** GetPreferredPackagesResponse */
        GetPreferredPackagesResponse: {
            /**
             * @description The package references of the preferred packages.
             *     Must contain one package reference for each requested package-name.
             *
             *     If you build command submissions whose content depends on the returned
             *     preferred packages, then we recommend submitting the preferred package-ids
             *     in the ``package_id_selection_preference`` of the command submission to
             *     avoid race conditions with concurrent changes of the on-ledger package vetting state.
             *
             *     Required: must be non-empty
             */
            packageReferences: components['schemas']['PackageReference'][]
            /**
             * @description The synchronizer for which the package preferences are computed.
             *     If the synchronizer_id was specified in the request, then it matches the request synchronizer_id.
             *
             *     Required
             */
            synchronizerId: string
        }
        /**
         * GetTransactionByIdRequest
         * @description Provided for backwards compatibility, it will be removed in the Canton version 3.5.0.
         */
        GetTransactionByIdRequest: {
            /**
             * @description The ID of a particular transaction.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *     Required
             */
            updateId: string
            /**
             * @description Provided for backwards compatibility, it will be removed in the Canton version 3.5.0.
             *     The parties whose events the client expects to see.
             *     Events that are not visible for the parties in this collection will not be present in the response.
             *     Each element must be a valid PartyIdString (as described in ``value.proto``).
             *     Optional for backwards compatibility for GetTransactionById request: if defined transaction_format must be
             *     unset (falling back to defaults).
             */
            requestingParties?: string[]
            /**
             * @description Optional for GetTransactionById request for backwards compatibility: defaults to a transaction_format, where:
             *
             *     - event_format.filters_by_party will have template-wildcard filters for all the requesting_parties
             *     - event_format.filters_for_any_party is unset
             *     - event_format.verbose = true
             *     - transaction_shape = TRANSACTION_SHAPE_ACS_DELTA
             */
            transactionFormat?: components['schemas']['TransactionFormat']
        }
        /**
         * GetTransactionByOffsetRequest
         * @description Provided for backwards compatibility, it will be removed in the Canton version 3.5.0.
         */
        GetTransactionByOffsetRequest: {
            /**
             * Format: int64
             * @description The offset of the transaction being looked up.
             *     Must be a valid absolute offset (positive integer).
             *     Required
             */
            offset: number
            /**
             * @description Provided for backwards compatibility, it will be removed in the Canton version 3.5.0.
             *     The parties whose events the client expects to see.
             *     Events that are not visible for the parties in this collection will not be present in the response.
             *     Each element must be a valid PartyIdString (as described in ``value.proto``).
             *     Optional for backwards compatibility for GetTransactionByOffset request: if defined transaction_format must be
             *     unset (falling back to defaults).
             */
            requestingParties?: string[]
            /**
             * @description Optional for GetTransactionByOffset request for backwards compatibility: defaults to a TransactionFormat, where:
             *
             *     - event_format.filters_by_party will have template-wildcard filters for all the requesting_parties
             *     - event_format.filters_for_any_party is unset
             *     - event_format.verbose = true
             *     - transaction_shape = TRANSACTION_SHAPE_ACS_DELTA
             */
            transactionFormat?: components['schemas']['TransactionFormat']
        }
        /** GetUpdateByIdRequest */
        GetUpdateByIdRequest: {
            /**
             * @description The ID of a particular update.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *
             *     Required
             */
            updateId: string
            /**
             * @description The format for the update.
             *
             *     Required
             */
            updateFormat: components['schemas']['UpdateFormat']
        }
        /** GetUpdateByOffsetRequest */
        GetUpdateByOffsetRequest: {
            /**
             * Format: int64
             * @description The offset of the update being looked up.
             *     Must be a valid absolute offset (positive integer).
             *
             *     Required
             */
            offset: number
            /**
             * @description The format for the update.
             *
             *     Required
             */
            updateFormat: components['schemas']['UpdateFormat']
        }
        /** GetUpdatesRequest */
        GetUpdatesRequest: {
            /**
             * Format: int64
             * @description Beginning of the requested ledger section (non-negative integer).
             *     The response will only contain transactions whose offset is strictly greater than this.
             *     If not populated or set to zero, the stream will start from the beginning of the ledger.
             *     If positive, the streaming will start after this absolute offset.
             *     If the ledger has been pruned, this parameter must be specified and be greater than the pruning offset.
             *
             *     Optional
             */
            beginExclusive?: number
            /**
             * Format: int64
             * @description End of the requested ledger section.
             *     The response will only contain transactions whose offset is less than or equal to this.
             *     If empty, the stream will not terminate.
             *     If specified, the stream will terminate after this absolute offset (positive integer) is reached.
             *
             *     Optional
             */
            endInclusive?: number
            /**
             * @description Provided for backwards compatibility, it will be removed in the Canton version 3.5.0.
             *     Requesting parties with template filters.
             *     Template filters must be empty for GetUpdateTrees requests.
             *     Optional for backwards compatibility, if defined update_format must be unset
             */
            filter?: components['schemas']['TransactionFilter']
            /**
             * @description Provided for backwards compatibility, it will be removed in the Canton version 3.5.0.
             *     If enabled, values served over the API will contain more information than strictly necessary to interpret the data.
             *     In particular, setting the verbose flag to true triggers the ledger to include labels, record and variant type ids
             *     for record fields.
             *     Optional for backwards compatibility, if defined update_format must be unset
             */
            verbose?: boolean
            /**
             * @description The update format for this request
             *
             *     Required
             */
            updateFormat: components['schemas']['UpdateFormat']
        }
        /** GetUserResponse */
        GetUserResponse: {
            /**
             * @description Retrieved user.
             *
             *     Required
             */
            user: components['schemas']['User']
        }
        /**
         * GrantUserRightsRequest
         * @description Add the rights to the set of rights granted to the user.
         *
         *     Required authorization: ``HasRight(ParticipantAdmin) OR IsAuthenticatedIdentityProviderAdmin(identity_provider_id)``
         */
        GrantUserRightsRequest: {
            /**
             * @description The user to whom to grant rights.
             *
             *     Required
             */
            userId: string
            /**
             * @description The rights to grant.
             *
             *     Optional: can be empty
             */
            rights?: components['schemas']['Right'][]
            /**
             * @description The id of the ``Identity Provider``
             *     If not set, assume the user is managed by the default identity provider.
             *
             *     Optional
             */
            identityProviderId?: string
        }
        /** GrantUserRightsResponse */
        GrantUserRightsResponse: {
            /**
             * @description The rights that were newly granted by the request.
             *
             *     Optional: can be empty
             */
            newlyGrantedRights?: components['schemas']['Right'][]
        }
        /** Identifier */
        Identifier: {
            packageId: string
            moduleName: string
            entityName: string
        }
        /** IdentifierFilter */
        IdentifierFilter:
            | {
                  Empty: components['schemas']['Empty1']
              }
            | {
                  InterfaceFilter: components['schemas']['InterfaceFilter']
              }
            | {
                  TemplateFilter: components['schemas']['TemplateFilter']
              }
            | {
                  WildcardFilter: components['schemas']['WildcardFilter']
              }
        /** IdentityProviderAdmin */
        IdentityProviderAdmin: {
            value: components['schemas']['IdentityProviderAdmin1']
        }
        /** IdentityProviderAdmin */
        IdentityProviderAdmin1: Record<string, never>
        /** IdentityProviderConfig */
        IdentityProviderConfig: {
            /**
             * @description The identity provider identifier
             *     Must be a valid LedgerString (as describe in ``value.proto``).
             *
             *     Required
             */
            identityProviderId: string
            /**
             * @description When set, the callers using JWT tokens issued by this identity provider are denied all access
             *     to the Ledger API.
             *     Modifiable
             *
             *     Optional
             */
            isDeactivated?: boolean
            /**
             * @description Specifies the issuer of the JWT token.
             *     The issuer value is a case sensitive URL using the https scheme that contains scheme, host,
             *     and optionally, port number and path components and no query or fragment components.
             *     Modifiable
             *
             *     Can be left empty when used in `UpdateIdentityProviderConfigRequest` if the issuer is not being updated.
             *
             *     Required
             */
            issuer: string
            /**
             * @description The JWKS (JSON Web Key Set) URL.
             *     The Ledger API uses JWKs (JSON Web Keys) from the provided URL to verify that the JWT has been
             *     signed with the loaded JWK. Only RS256 (RSA Signature with SHA-256) signing algorithm is supported.
             *     Modifiable
             *
             *     Required
             */
            jwksUrl: string
            /**
             * @description Specifies the audience of the JWT token.
             *     When set, the callers using JWT tokens issued by this identity provider are allowed to get an access
             *     only if the "aud" claim includes the string specified here
             *     Modifiable
             *
             *     Optional
             */
            audience?: string
        }
        /**
         * InterfaceFilter
         * @description This filter matches contracts that implement a specific interface.
         */
        InterfaceFilter: {
            value: components['schemas']['InterfaceFilter1']
        }
        /**
         * InterfaceFilter
         * @description This filter matches contracts that implement a specific interface.
         */
        InterfaceFilter1: {
            /**
             * @description The interface that a matching contract must implement.
             *     The ``interface_id`` needs to be valid: corresponding interface should be defined in
             *     one of the available packages at the time of the query.
             *     Both package-name and package-id reference formats for the identifier are supported.
             *     Note: The package-id reference identifier format is deprecated. We plan to end support for this format in version 3.4.
             *
             *     Required
             */
            interfaceId: string
            /**
             * @description Whether to include the interface view on the contract in the returned ``CreatedEvent``.
             *     Use this to access contract data in a uniform manner in your API client.
             *
             *     Optional
             */
            includeInterfaceView?: boolean
            /**
             * @description Whether to include a ``created_event_blob`` in the returned ``CreatedEvent``.
             *     Use this to access the contract create event payload in your API client
             *     for submitting it as a disclosed contract with future commands.
             *
             *     Optional
             */
            includeCreatedEventBlob?: boolean
        }
        /** JsActiveContract */
        JsActiveContract: {
            /**
             * @description The event as it appeared in the context of its last update (i.e. daml transaction or
             *     reassignment). In particular, the last offset, node_id pair is preserved.
             *     The last update is the most recent update created or assigned this contract on synchronizer_id synchronizer.
             *     The offset of the CreatedEvent might point to an already pruned update, therefore it cannot necessarily be used
             *     for lookups.
             *
             *     Required
             */
            createdEvent: components['schemas']['CreatedEvent']
            /**
             * @description A valid synchronizer id
             *
             *     Required
             */
            synchronizerId: string
            /**
             * Format: int64
             * @description Each corresponding assigned and unassigned event has the same reassignment_counter. This strictly increases
             *     with each unassign command for the same contract. Creation of the contract corresponds to reassignment_counter
             *     equals zero.
             *     This field will be the reassignment_counter of the latest observable activation event on this synchronizer, which is
             *     before the active_at_offset.
             *
             *     Required
             */
            reassignmentCounter: number
        }
        /** JsArchived */
        JsArchived: {
            /** @description Required */
            archivedEvent: components['schemas']['ArchivedEvent']
            /**
             * @description The synchronizer which sequenced the archival of the contract
             *
             *     Required
             */
            synchronizerId: string
        }
        /**
         * JsAssignedEvent
         * @description Records that a contract has been assigned, and it can be used on the target synchronizer.
         */
        JsAssignedEvent: {
            /**
             * @description The ID of the source synchronizer.
             *     Must be a valid synchronizer id.
             *
             *     Required
             */
            source: string
            /**
             * @description The ID of the target synchronizer.
             *     Must be a valid synchronizer id.
             *
             *     Required
             */
            target: string
            /**
             * @description The ID from the unassigned event.
             *     For correlation capabilities.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *
             *     Required
             */
            reassignmentId: string
            /**
             * @description Party on whose behalf the assign command was executed.
             *     Empty if the assignment happened offline via the repair service.
             *     Must be a valid PartyIdString (as described in ``value.proto``).
             *
             *     Optional
             */
            submitter?: string
            /**
             * Format: int64
             * @description Each corresponding assigned and unassigned event has the same reassignment_counter. This strictly increases
             *     with each unassign command for the same contract. Creation of the contract corresponds to reassignment_counter
             *     equals zero.
             *
             *     Required
             */
            reassignmentCounter: number
            /**
             * @description The offset of this event refers to the offset of the assignment,
             *     while the node_id is the index of within the batch.
             *
             *     Required
             */
            createdEvent: components['schemas']['CreatedEvent']
        }
        /** JsAssignmentEvent */
        JsAssignmentEvent: {
            source: string
            target: string
            reassignmentId: string
            submitter: string
            /** Format: int64 */
            reassignmentCounter: number
            createdEvent: components['schemas']['CreatedEvent']
        }
        /** JsCantonError */
        JsCantonError: {
            code: string
            cause: string
            correlationId?: string
            traceId?: string
            context: components['schemas']['Map_String']
            resources?: components['schemas']['Tuple2_String_String'][]
            /** Format: int32 */
            errorCategory: number
            /** Format: int32 */
            grpcCodeValue?: number
            retryInfo?: string
            definiteAnswer?: boolean
        }
        /**
         * JsCommands
         * @description A composite command that groups multiple commands together.
         */
        JsCommands: {
            /**
             * @description Individual elements of this atomic command. Must be non-empty.
             *
             *     Required: must be non-empty
             */
            commands: components['schemas']['Command'][]
            /**
             * @description Uniquely identifies the command.
             *     The triple (user_id, act_as, command_id) constitutes the change ID for the intended ledger change,
             *     where act_as is interpreted as a set of party names.
             *     The change ID can be used for matching the intended ledger changes with all their completions.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *
             *     Required
             */
            commandId: string
            /**
             * @description Set of parties on whose behalf the command should be executed.
             *     If ledger API authorization is enabled, then the authorization metadata must authorize the sender of the request
             *     to act on behalf of each of the given parties.
             *     Each element must be a valid PartyIdString (as described in ``value.proto``).
             *
             *     Required: must be non-empty
             */
            actAs: string[]
            /**
             * @description Uniquely identifies the participant user that issued the command.
             *     Must be a valid UserIdString (as described in ``value.proto``).
             *     Required unless authentication is used with a user token.
             *     In that case, the token's user-id will be used for the request's user_id.
             *
             *     Optional
             */
            userId?: string
            /**
             * @description Set of parties on whose behalf (in addition to all parties listed in ``act_as``) contracts can be retrieved.
             *     This affects Daml operations such as ``fetch``, ``fetchByKey``, ``lookupByKey``, ``exercise``, and ``exerciseByKey``.
             *     Note: A participant node of a Daml network can host multiple parties. Each contract present on the participant
             *     node is only visible to a subset of these parties. A command can only use contracts that are visible to at least
             *     one of the parties in ``act_as`` or ``read_as``. This visibility check is independent from the Daml authorization
             *     rules for fetch operations.
             *     If ledger API authorization is enabled, then the authorization metadata must authorize the sender of the request
             *     to read contract data on behalf of each of the given parties.
             *
             *     Optional: can be empty
             */
            readAs?: string[]
            /**
             * @description Identifier of the on-ledger workflow that this command is a part of.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *
             *     Optional
             */
            workflowId?: string
            deduplicationPeriod?: components['schemas']['DeduplicationPeriod']
            /**
             * @description Lower bound for the ledger time assigned to the resulting transaction.
             *     Note: The ledger time of a transaction is assigned as part of command interpretation.
             *     Use this property if you expect that command interpretation will take a considerate amount of time, such that by
             *     the time the resulting transaction is sequenced, its assigned ledger time is not valid anymore.
             *     Must not be set at the same time as min_ledger_time_rel.
             *
             *     Optional
             */
            minLedgerTimeAbs?: string
            /**
             * @description Same as min_ledger_time_abs, but specified as a duration, starting from the time the command is received by the server.
             *     Must not be set at the same time as min_ledger_time_abs.
             *
             *     Optional
             */
            minLedgerTimeRel?: components['schemas']['Duration']
            /**
             * @description A unique identifier to distinguish completions for different submissions with the same change ID.
             *     Typically a random UUID. Applications are expected to use a different UUID for each retry of a submission
             *     with the same change ID.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *
             *     If omitted, the participant or the committer may set a value of their choice.
             *
             *     Optional
             */
            submissionId?: string
            /**
             * @description Additional contracts used to resolve contract & contract key lookups.
             *
             *     Optional: can be empty
             */
            disclosedContracts?: components['schemas']['DisclosedContract'][]
            /**
             * @description Must be a valid synchronizer id
             *
             *     Optional
             */
            synchronizerId?: string
            /**
             * @description The package-id selection preference of the client for resolving
             *     package names and interface instances in command submission and interpretation
             *
             *     Optional: can be empty
             */
            packageIdSelectionPreference?: string[]
            /**
             * @description Fetches the contract keys into the caches to speed up the command processing.
             *     Should only contain contract keys that are expected to be resolved during interpretation of the commands.
             *     Keys of disclosed contracts do not need prefetching.
             *
             *     Optional: can be empty
             */
            prefetchContractKeys?: components['schemas']['PrefetchContractKey'][]
            /**
             * Format: int32
             * @description The maximum number of passes for the Topology-Aware Package Selection (TAPS).
             *     Higher values can increase the chance of successful package selection for routing of interpreted transactions.
             *     If unset, this defaults to the value defined in the participant configuration.
             *     The provided value must not exceed the limit specified in the participant configuration.
             *
             *     Optional
             */
            tapsMaxPasses?: number
        }
        /**
         * JsContractEntry
         * @description For a contract there could be multiple contract_entry-s in the entire snapshot. These together define
         *     the state of one contract in the snapshot.
         *     A contract_entry is included in the result, if and only if there is at least one stakeholder party of the contract
         *     that is hosted on the synchronizer at the time of the event and the party satisfies the
         *     ``TransactionFilter`` in the query.
         *
         *     Required
         */
        JsContractEntry:
            | {
                  JsActiveContract: components['schemas']['JsActiveContract']
              }
            | {
                  JsEmpty: components['schemas']['JsEmpty']
              }
            | {
                  JsIncompleteAssigned: components['schemas']['JsIncompleteAssigned']
              }
            | {
                  JsIncompleteUnassigned: components['schemas']['JsIncompleteUnassigned']
              }
        /** JsCreated */
        JsCreated: {
            /**
             * @description The event as it appeared in the context of its original update (i.e. daml transaction or
             *     reassignment) on this participant node. You can use its offset and node_id to find the
             *     corresponding update and the node within it.
             *
             *     Required
             */
            createdEvent: components['schemas']['CreatedEvent']
            /**
             * @description The synchronizer which sequenced the creation of the contract
             *
             *     Required
             */
            synchronizerId: string
        }
        /** JsEmpty */
        JsEmpty: Record<string, never>
        /** JsExecuteSubmissionAndWaitForTransactionRequest */
        JsExecuteSubmissionAndWaitForTransactionRequest: {
            /**
             * @description the prepared transaction
             *     Typically this is the value of the `prepared_transaction` field in `PrepareSubmissionResponse`
             *     obtained from calling `prepareSubmission`.
             *
             *     Required
             */
            preparedTransaction: string
            /**
             * @description The party(ies) signatures that authorize the prepared submission to be executed by this node.
             *     Each party can provide one or more signatures..
             *     and one or more parties can sign.
             *     Note that currently, only single party submissions are supported.
             *
             *     Required
             */
            partySignatures: components['schemas']['PartySignatures']
            deduplicationPeriod?: components['schemas']['DeduplicationPeriod2']
            /**
             * @description A unique identifier to distinguish completions for different submissions with the same change ID.
             *     Typically a random UUID. Applications are expected to use a different UUID for each retry of a submission
             *     with the same change ID.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *
             *     Required
             */
            submissionId: string
            /**
             * @description See [PrepareSubmissionRequest.user_id]
             *
             *     Optional
             */
            userId?: string
            /**
             * @description The hashing scheme version used when building the hash
             *     Required
             * @enum {string}
             */
            hashingSchemeVersion:
                | 'HASHING_SCHEME_VERSION_UNSPECIFIED'
                | 'HASHING_SCHEME_VERSION_V2'
            /**
             * @description If set will influence the chosen ledger effective time but will not result in a submission delay so any override
             *     should be scheduled to executed within the window allowed by synchronizer.
             *
             *     Optional
             */
            minLedgerTime?: components['schemas']['MinLedgerTime']
            /**
             * @description If no ``transaction_format`` is provided, a default will be used where ``transaction_shape`` is set to
             *     TRANSACTION_SHAPE_ACS_DELTA, ``event_format`` is defined with ``filters_by_party`` containing wildcard-template
             *     filter for all original ``act_as`` and ``read_as`` parties and the ``verbose`` flag is set.
             *     When the ``transaction_shape`` TRANSACTION_SHAPE_ACS_DELTA shape is used (explicitly or is defaulted to as explained above),
             *     events will only be returned if the submitting party is hosted on this node.
             *
             *     Optional
             */
            transactionFormat?: components['schemas']['TransactionFormat']
        }
        /** JsExecuteSubmissionAndWaitForTransactionResponse */
        JsExecuteSubmissionAndWaitForTransactionResponse: {
            /**
             * @description The transaction that resulted from the submitted command.
             *     The transaction might contain no events (request conditions result in filtering out all of them).
             *
             *     Required
             */
            transaction: components['schemas']['JsTransaction']
        }
        /** JsExecuteSubmissionAndWaitRequest */
        JsExecuteSubmissionAndWaitRequest: {
            /**
             * @description the prepared transaction
             *     Typically this is the value of the `prepared_transaction` field in `PrepareSubmissionResponse`
             *     obtained from calling `prepareSubmission`.
             *
             *     Required
             */
            preparedTransaction: string
            /**
             * @description The party(ies) signatures that authorize the prepared submission to be executed by this node.
             *     Each party can provide one or more signatures..
             *     and one or more parties can sign.
             *     Note that currently, only single party submissions are supported.
             *
             *     Required
             */
            partySignatures: components['schemas']['PartySignatures']
            deduplicationPeriod?: components['schemas']['DeduplicationPeriod2']
            /**
             * @description A unique identifier to distinguish completions for different submissions with the same change ID.
             *     Typically a random UUID. Applications are expected to use a different UUID for each retry of a submission
             *     with the same change ID.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *
             *     Required
             */
            submissionId: string
            /**
             * @description See [PrepareSubmissionRequest.user_id]
             *
             *     Optional
             */
            userId?: string
            /**
             * @description The hashing scheme version used when building the hash
             *
             *     Required
             * @enum {string}
             */
            hashingSchemeVersion:
                | 'HASHING_SCHEME_VERSION_UNSPECIFIED'
                | 'HASHING_SCHEME_VERSION_V2'
            /**
             * @description If set will influence the chosen ledger effective time but will not result in a submission delay so any override
             *     should be scheduled to executed within the window allowed by synchronizer.
             *
             *     Optional
             */
            minLedgerTime?: components['schemas']['MinLedgerTime']
        }
        /** JsExecuteSubmissionRequest */
        JsExecuteSubmissionRequest: {
            /**
             * @description the prepared transaction
             *     Typically this is the value of the `prepared_transaction` field in `PrepareSubmissionResponse`
             *     obtained from calling `prepareSubmission`.
             *
             *     Required
             */
            preparedTransaction: string
            /**
             * @description The party(ies) signatures that authorize the prepared submission to be executed by this node.
             *     Each party can provide one or more signatures..
             *     and one or more parties can sign.
             *     Note that currently, only single party submissions are supported.
             *
             *     Required
             */
            partySignatures: components['schemas']['PartySignatures']
            deduplicationPeriod?: components['schemas']['DeduplicationPeriod2']
            /**
             * @description A unique identifier to distinguish completions for different submissions with the same change ID.
             *     Typically a random UUID. Applications are expected to use a different UUID for each retry of a submission
             *     with the same change ID.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *
             *     Required
             */
            submissionId: string
            /**
             * @description See [PrepareSubmissionRequest.user_id]
             *
             *     Optional
             */
            userId?: string
            /**
             * @description The hashing scheme version used when building the hash
             *
             *     Required
             * @enum {string}
             */
            hashingSchemeVersion:
                | 'HASHING_SCHEME_VERSION_UNSPECIFIED'
                | 'HASHING_SCHEME_VERSION_V2'
            /**
             * @description If set will influence the chosen ledger effective time but will not result in a submission delay so any override
             *     should be scheduled to executed within the window allowed by synchronizer.
             *
             *     Optional
             */
            minLedgerTime?: components['schemas']['MinLedgerTime']
        }
        /** JsGetActiveContractsResponse */
        JsGetActiveContractsResponse: {
            /**
             * @description The workflow ID used in command submission which corresponds to the contract_entry. Only set if
             *     the ``workflow_id`` for the command was set.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *
             *     Optional
             */
            workflowId?: string
            contractEntry?: components['schemas']['JsContractEntry']
        }
        /** JsGetEventsByContractIdResponse */
        JsGetEventsByContractIdResponse: {
            /**
             * @description The create event for the contract with the ``contract_id`` given in the request
             *     provided it exists and has not yet been pruned.
             *
             *     Optional
             */
            created?: components['schemas']['JsCreated']
            /**
             * @description The archive event for the contract with the ``contract_id`` given in the request
             *     provided such an archive event exists and it has not yet been pruned.
             *
             *     Optional
             */
            archived?: components['schemas']['JsArchived']
        }
        /**
         * JsGetTransactionResponse
         * @description Provided for backwards compatibility, it will be removed in the Canton version 3.5.0.
         */
        JsGetTransactionResponse: {
            /** @description Required */
            transaction: components['schemas']['JsTransaction']
        }
        /**
         * JsGetTransactionTreeResponse
         * @description Provided for backwards compatibility, it will be removed in the Canton version 3.5.0.
         */
        JsGetTransactionTreeResponse: {
            /** @description Required */
            transaction: components['schemas']['JsTransactionTree']
        }
        /** JsGetUpdateResponse */
        JsGetUpdateResponse: {
            update?: components['schemas']['Update']
        }
        /**
         * JsGetUpdateTreesResponse
         * @description Provided for backwards compatibility, it will be removed in the Canton version 3.5.0.
         */
        JsGetUpdateTreesResponse: {
            update?: components['schemas']['Update1']
        }
        /** JsGetUpdatesResponse */
        JsGetUpdatesResponse: {
            update?: components['schemas']['Update']
        }
        /** JsIncompleteAssigned */
        JsIncompleteAssigned: {
            /** @description Required */
            assignedEvent: components['schemas']['JsAssignedEvent']
        }
        /** JsIncompleteUnassigned */
        JsIncompleteUnassigned: {
            /**
             * @description The event as it appeared in the context of its last activation update (i.e. daml transaction or
             *     reassignment). In particular, the last activation offset, node_id pair is preserved.
             *     The last activation update is the most recent update created or assigned this contract on synchronizer_id synchronizer before
             *     the unassigned_event.
             *     The offset of the CreatedEvent might point to an already pruned update, therefore it cannot necessarily be used
             *     for lookups.
             *
             *     Required
             */
            createdEvent: components['schemas']['CreatedEvent']
            /** @description Required */
            unassignedEvent: components['schemas']['UnassignedEvent']
        }
        /**
         * JsInterfaceView
         * @description View of a create event matched by an interface filter.
         */
        JsInterfaceView: {
            /**
             * @description The interface implemented by the matched event.
             *     The identifier uses the package-id reference format.
             *
             *     Required
             */
            interfaceId: string
            /**
             * @description Whether the view was successfully computed, and if not,
             *     the reason for the error. The error is reported using the same rules
             *     for error codes and messages as the errors returned for API requests.
             *
             *     Required
             */
            viewStatus: components['schemas']['JsStatus']
            /**
             * @description The value of the interface's view method on this event.
             *     Set if it was requested in the ``InterfaceFilter`` and it could be
             *     successfully computed.
             *
             *     Optional
             */
            viewValue?: unknown
        }
        /** JsPrepareSubmissionRequest */
        JsPrepareSubmissionRequest: {
            /**
             * @description Uniquely identifies the participant user that prepares the transaction.
             *     Must be a valid UserIdString (as described in ``value.proto``).
             *     Required unless authentication is used with a user token.
             *     In that case, the token's user-id will be used for the request's user_id.
             *
             *     Optional
             */
            userId?: string
            /**
             * @description Uniquely identifies the command.
             *     The triple (user_id, act_as, command_id) constitutes the change ID for the intended ledger change,
             *     where act_as is interpreted as a set of party names.
             *     The change ID can be used for matching the intended ledger changes with all their completions.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *
             *     Required
             */
            commandId: string
            /**
             * @description Individual elements of this atomic command. Must be non-empty.
             *     Limitation: Only single command transaction are currently supported by the API.
             *     The field is marked as repeated in preparation for future support of multiple commands.
             *
             *     Required: must be non-empty
             */
            commands: components['schemas']['Command'][]
            /** @description Optional */
            minLedgerTime?: components['schemas']['MinLedgerTime']
            /**
             * @description Set of parties on whose behalf the command should be executed, if submitted.
             *     If ledger API authorization is enabled, then the authorization metadata must authorize the sender of the request
             *     to **read** (not act) on behalf of each of the given parties. This is because this RPC merely prepares a transaction
             *     and does not execute it. Therefore read authorization is sufficient even for actAs parties.
             *     Note: This may change, and more specific authorization scope may be introduced in the future.
             *     Each element must be a valid PartyIdString (as described in ``value.proto``).
             *
             *     Required: must be non-empty
             */
            actAs: string[]
            /**
             * @description Set of parties on whose behalf (in addition to all parties listed in ``act_as``) contracts can be retrieved.
             *     This affects Daml operations such as ``fetch``, ``fetchByKey``, ``lookupByKey``, ``exercise``, and ``exerciseByKey``.
             *     Note: A command can only use contracts that are visible to at least
             *     one of the parties in ``act_as`` or ``read_as``. This visibility check is independent from the Daml authorization
             *     rules for fetch operations.
             *     If ledger API authorization is enabled, then the authorization metadata must authorize the sender of the request
             *     to read contract data on behalf of each of the given parties.
             *
             *     Optional: can be empty
             */
            readAs?: string[]
            /**
             * @description Additional contracts used to resolve contract & contract key lookups.
             *
             *     Optional: can be empty
             */
            disclosedContracts?: components['schemas']['DisclosedContract'][]
            /**
             * @description Must be a valid synchronizer id
             *     If not set, a suitable synchronizer that this node is connected to will be chosen
             *
             *     Optional
             */
            synchronizerId?: string
            /**
             * @description The package-id selection preference of the client for resolving
             *     package names and interface instances in command submission and interpretation
             *
             *     Optional: can be empty
             */
            packageIdSelectionPreference?: string[]
            /**
             * @description When true, the response will contain additional details on how the transaction was encoded and hashed
             *     This can be useful for troubleshooting of hash mismatches. Should only be used for debugging.
             *     Defaults to false
             *
             *     Optional
             */
            verboseHashing?: boolean
            /**
             * @description Fetches the contract keys into the caches to speed up the command processing.
             *     Should only contain contract keys that are expected to be resolved during interpretation of the commands.
             *     Keys of disclosed contracts do not need prefetching.
             *
             *     Optional: can be empty
             */
            prefetchContractKeys?: components['schemas']['PrefetchContractKey'][]
            /**
             * @description Maximum timestamp at which the transaction can be recorded onto the ledger via the synchronizer specified in the `PrepareSubmissionResponse`.
             *     If submitted after it will be rejected even if otherwise valid, in which case it needs to be prepared and signed again
             *     with a new valid max_record_time.
             *     Use this to limit the time-to-life of a prepared transaction,
             *     which is useful to know when it can definitely not be accepted
             *     anymore and resorting to preparing another transaction for the same
             *     intent is safe again.
             *
             *     Optional
             */
            maxRecordTime?: string
            /**
             * @description Hints to improve the accuracy of traffic cost estimation.
             *     The estimation logic assumes that this node will be used for the execution of the transaction
             *     If another node is used instead, the estimation may be less precise.
             *     Request amplification is not accounted for in the estimation: each amplified request will
             *     result in the cost of the confirmation request to be charged additionally.
             *
             *     Traffic cost estimation is enabled by default if this field is not set
             *     To turn off cost estimation, set the CostEstimationHints#disabled field to true
             *
             *     Optional
             */
            estimateTrafficCost?: components['schemas']['CostEstimationHints']
            /**
             * Format: int32
             * @description The maximum number of passes for the Topology-Aware Package Selection (TAPS).
             *     Higher values can increase the chance of successful package selection for routing of interpreted transactions.
             *     If unset, this defaults to the value defined in the participant configuration.
             *     The provided value must not exceed the limit specified in the participant configuration.
             *
             *     Optional
             */
            tapsMaxPasses?: number
        }
        /**
         * JsPrepareSubmissionResponse
         * @description [docs-entry-end: HashingSchemeVersion]
         */
        JsPrepareSubmissionResponse: {
            /**
             * @description The interpreted transaction, it represents the ledger changes necessary to execute the commands specified in the request.
             *     Clients MUST display the content of the transaction to the user for them to validate before signing the hash if the preparing participant is not trusted.
             *
             *     Required
             */
            preparedTransaction: string
            /**
             * @description Hash of the transaction, this is what needs to be signed by the party to authorize the transaction.
             *     Only provided for convenience, clients MUST recompute the hash from the raw transaction if the preparing participant is not trusted.
             *     May be removed in future versions
             *
             *     Required: must be non-empty
             */
            preparedTransactionHash: string
            /**
             * @description The hashing scheme version used when building the hash
             *
             *     Required
             * @enum {string}
             */
            hashingSchemeVersion:
                | 'HASHING_SCHEME_VERSION_UNSPECIFIED'
                | 'HASHING_SCHEME_VERSION_V2'
            /**
             * @description Optional additional details on how the transaction was encoded and hashed. Only set if verbose_hashing = true in the request
             *     Note that there are no guarantees on the stability of the format or content of this field.
             *     Its content should NOT be parsed and should only be used for troubleshooting purposes.
             *
             *     Optional
             */
            hashingDetails?: string
            /**
             * @description Traffic cost estimation of the prepared transaction
             *
             *     Optional
             */
            costEstimation?: components['schemas']['CostEstimation']
        }
        /**
         * JsReassignment
         * @description Complete view of an on-ledger reassignment.
         */
        JsReassignment: {
            /**
             * @description Assigned by the server. Useful for correlating logs.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *
             *     Required
             */
            updateId: string
            /**
             * @description The ID of the command which resulted in this reassignment. Missing for everyone except the submitting party on the submitting participant.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *
             *     Optional
             */
            commandId?: string
            /**
             * @description The workflow ID used in reassignment command submission. Only set if the ``workflow_id`` for the command was set.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *
             *     Optional
             */
            workflowId?: string
            /**
             * Format: int64
             * @description The participant's offset. The details of this field are described in ``community/ledger-api/README.md``.
             *     Must be a valid absolute offset (positive integer).
             *
             *     Required
             */
            offset: number
            /**
             * @description The collection of reassignment events.
             *
             *     Required: must be non-empty
             */
            events: components['schemas']['JsReassignmentEvent'][]
            /**
             * @description Ledger API trace context
             *
             *     The trace context transported in this message corresponds to the trace context supplied
             *     by the client application in a HTTP2 header of the original command submission.
             *     We typically use a header to transfer this type of information. Here we use message
             *     body, because it is used in gRPC streams which do not support per message headers.
             *     This field will be populated with the trace context contained in the original submission.
             *     If that was not provided, a unique ledger-api-server generated trace context will be used
             *     instead.
             *
             *     Optional
             */
            traceContext?: components['schemas']['TraceContext']
            /**
             * @description The time at which the reassignment was recorded. The record time refers to the source/target
             *     synchronizer for an unassign/assign event respectively.
             *
             *     Required
             */
            recordTime: string
            /**
             * @description A valid synchronizer id.
             *     Identifies the synchronizer that synchronized this Reassignment.
             *
             *     Required
             */
            synchronizerId: string
            /**
             * Format: int64
             * @description The traffic cost that this participant node paid for the corresponding (un)assignment request.
             *
             *     Not set for transactions that were
             *     - initiated by another participant
             *     - initiated offline via the repair service
             *     - processed before the participant started serving traffic cost on the Ledger API
             *     - returned as part of a query filtering for a non submitting party
             *
             *     Optional: can be empty
             */
            paidTrafficCost?: number
        }
        /** JsReassignmentEvent */
        JsReassignmentEvent:
            | {
                  JsAssignmentEvent: components['schemas']['JsAssignmentEvent']
              }
            | {
                  JsUnassignedEvent: components['schemas']['JsUnassignedEvent']
              }
        /** JsStatus */
        JsStatus: {
            /** Format: int32 */
            code: number
            message: string
            details?: components['schemas']['ProtoAny'][]
        }
        /** JsSubmitAndWaitForReassignmentResponse */
        JsSubmitAndWaitForReassignmentResponse: {
            /**
             * @description The reassignment that resulted from the submitted reassignment command.
             *     The reassignment might contain no events (request conditions result in filtering out all of them).
             *
             *     Required
             */
            reassignment: components['schemas']['JsReassignment']
        }
        /**
         * JsSubmitAndWaitForTransactionRequest
         * @description These commands are executed as a single atomic transaction.
         */
        JsSubmitAndWaitForTransactionRequest: {
            /**
             * @description The commands to be submitted.
             *
             *     Required
             */
            commands: components['schemas']['JsCommands']
            /**
             * @description If no ``transaction_format`` is provided, a default will be used where ``transaction_shape`` is set to
             *     TRANSACTION_SHAPE_ACS_DELTA, ``event_format`` is defined with ``filters_by_party`` containing wildcard-template
             *     filter for all original ``act_as`` and ``read_as`` parties and the ``verbose`` flag is set.
             *
             *     Optional
             */
            transactionFormat?: components['schemas']['TransactionFormat']
        }
        /** JsSubmitAndWaitForTransactionResponse */
        JsSubmitAndWaitForTransactionResponse: {
            /**
             * @description The transaction that resulted from the submitted command.
             *     The transaction might contain no events (request conditions result in filtering out all of them).
             *
             *     Required
             */
            transaction: components['schemas']['JsTransaction']
        }
        /**
         * JsSubmitAndWaitForTransactionTreeResponse
         * @description Provided for backwards compatibility, it will be removed in the Canton version 3.5.0.
         */
        JsSubmitAndWaitForTransactionTreeResponse: {
            transactionTree?: components['schemas']['JsTransactionTree']
        }
        /** JsTopologyTransaction */
        JsTopologyTransaction: {
            /**
             * @description Assigned by the server. Useful for correlating logs.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *
             *     Required
             */
            updateId: string
            /**
             * Format: int64
             * @description The absolute offset. The details of this field are described in ``community/ledger-api/README.md``.
             *     It is a valid absolute offset (positive integer).
             *
             *     Required
             */
            offset: number
            /**
             * @description A valid synchronizer id.
             *     Identifies the synchronizer that synchronized the topology transaction.
             *
             *     Required
             */
            synchronizerId: string
            /**
             * @description The time at which the changes in the topology transaction become effective. There is a small delay between a
             *     topology transaction being sequenced and the changes it contains becoming effective. Topology transactions appear
             *     in order relative to a synchronizer based on their effective time rather than their sequencing time.
             *
             *     Required
             */
            recordTime: string
            /**
             * @description A non-empty list of topology events.
             *
             *     Required: must be non-empty
             */
            events: components['schemas']['TopologyEvent'][]
            /**
             * @description Ledger API trace context
             *
             *     The trace context transported in this message corresponds to the trace context supplied
             *     by the client application in a HTTP2 header of the original command submission.
             *     We typically use a header to transfer this type of information. Here we use message
             *     body, because it is used in gRPC streams which do not support per message headers.
             *     This field will be populated with the trace context contained in the original submission.
             *     If that was not provided, a unique ledger-api-server generated trace context will be used
             *     instead.
             *
             *     Optional
             */
            traceContext?: components['schemas']['TraceContext']
        }
        /**
         * JsTransaction
         * @description Filtered view of an on-ledger transaction's create and archive events.
         */
        JsTransaction: {
            /**
             * @description Assigned by the server. Useful for correlating logs.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *
             *     Required
             */
            updateId: string
            /**
             * @description The ID of the command which resulted in this transaction. Missing for everyone except the submitting party.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *
             *     Optional
             */
            commandId?: string
            /**
             * @description The workflow ID used in command submission.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *
             *     Optional
             */
            workflowId?: string
            /**
             * @description Ledger effective time.
             *
             *     Required
             */
            effectiveAt: string
            /**
             * @description The collection of events.
             *     Contains:
             *
             *     - ``CreatedEvent`` or ``ArchivedEvent`` in case of ACS_DELTA transaction shape
             *     - ``CreatedEvent`` or ``ExercisedEvent`` in case of LEDGER_EFFECTS transaction shape
             *
             *     Required: must be non-empty
             */
            events: components['schemas']['Event'][]
            /**
             * Format: int64
             * @description The absolute offset. The details of this field are described in ``community/ledger-api/README.md``.
             *     It is a valid absolute offset (positive integer).
             *
             *     Required
             */
            offset: number
            /**
             * @description A valid synchronizer id.
             *     Identifies the synchronizer that synchronized the transaction.
             *
             *     Required
             */
            synchronizerId: string
            /**
             * @description Ledger API trace context
             *
             *     The trace context transported in this message corresponds to the trace context supplied
             *     by the client application in a HTTP2 header of the original command submission.
             *     We typically use a header to transfer this type of information. Here we use message
             *     body, because it is used in gRPC streams which do not support per message headers.
             *     This field will be populated with the trace context contained in the original submission.
             *     If that was not provided, a unique ledger-api-server generated trace context will be used
             *     instead.
             *
             *     Optional
             */
            traceContext?: components['schemas']['TraceContext']
            /**
             * @description The time at which the transaction was recorded. The record time refers to the synchronizer
             *     which synchronized the transaction.
             *
             *     Required
             */
            recordTime: string
            /**
             * @description For transaction externally signed, contains the external transaction hash
             *     signed by the external party. Can be used to correlate an external submission with a committed transaction.
             *
             *     Optional: can be empty
             */
            externalTransactionHash?: string
            /**
             * Format: int64
             * @description The traffic cost that this participant node paid for the confirmation
             *     request for this transaction.
             *
             *     Not set for transactions that were
             *     - initiated by another participant
             *     - initiated offline via the repair service
             *     - processed before the participant started serving traffic cost on the Ledger API
             *     - returned as part of a query filtering for a non submitting party
             *
             *     Optional: can be empty
             */
            paidTrafficCost?: number
        }
        /**
         * JsTransactionTree
         * @description Provided for backwards compatibility, it will be removed in the Canton version 3.5.0.
         *     Complete view of an on-ledger transaction.
         */
        JsTransactionTree: {
            /**
             * @description Assigned by the server. Useful for correlating logs.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *     Required
             */
            updateId: string
            /**
             * @description The ID of the command which resulted in this transaction. Missing for everyone except the submitting party.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *     Optional
             */
            commandId?: string
            /**
             * @description The workflow ID used in command submission. Only set if the ``workflow_id`` for the command was set.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *     Optional
             */
            workflowId?: string
            /**
             * @description Ledger effective time.
             *     Required
             */
            effectiveAt: string
            /**
             * Format: int64
             * @description The absolute offset. The details of this field are described in ``community/ledger-api/README.md``.
             *     Required, it is a valid absolute offset (positive integer).
             */
            offset: number
            /**
             * @description Changes to the ledger that were caused by this transaction. Nodes of the transaction tree.
             *     Each key must be a valid node ID (non-negative integer).
             *     Required
             */
            eventsById: components['schemas']['Map_Int_TreeEvent']
            /**
             * @description A valid synchronizer id.
             *     Identifies the synchronizer that synchronized the transaction.
             *     Required
             */
            synchronizerId: string
            /**
             * @description Optional; ledger API trace context
             *
             *     The trace context transported in this message corresponds to the trace context supplied
             *     by the client application in a HTTP2 header of the original command submission.
             *     We typically use a header to transfer this type of information. Here we use message
             *     body, because it is used in gRPC streams which do not support per message headers.
             *     This field will be populated with the trace context contained in the original submission.
             *     If that was not provided, a unique ledger-api-server generated trace context will be used
             *     instead.
             */
            traceContext?: components['schemas']['TraceContext']
            /**
             * @description The time at which the transaction was recorded. The record time refers to the synchronizer
             *     which synchronized the transaction.
             *     Required
             */
            recordTime: string
        }
        /**
         * JsUnassignedEvent
         * @description Records that a contract has been unassigned, and it becomes unusable on the source synchronizer
         */
        JsUnassignedEvent: {
            value: components['schemas']['UnassignedEvent']
        }
        /**
         * Kind
         * @description Required
         */
        Kind:
            | {
                  CanActAs: components['schemas']['CanActAs']
              }
            | {
                  CanExecuteAs: components['schemas']['CanExecuteAs']
              }
            | {
                  CanExecuteAsAnyParty: components['schemas']['CanExecuteAsAnyParty']
              }
            | {
                  CanReadAs: components['schemas']['CanReadAs']
              }
            | {
                  CanReadAsAnyParty: components['schemas']['CanReadAsAnyParty']
              }
            | {
                  Empty: components['schemas']['Empty8']
              }
            | {
                  IdentityProviderAdmin: components['schemas']['IdentityProviderAdmin']
              }
            | {
                  ParticipantAdmin: components['schemas']['ParticipantAdmin']
              }
        /** ListIdentityProviderConfigsResponse */
        ListIdentityProviderConfigsResponse: {
            /**
             * @description The list of identity provider configs
             *
             *     Required: must be non-empty
             */
            identityProviderConfigs: components['schemas']['IdentityProviderConfig'][]
        }
        /** ListKnownPartiesResponse */
        ListKnownPartiesResponse: {
            /**
             * @description The details of all Daml parties known by the participant.
             *
             *     Required: must be non-empty
             */
            partyDetails: components['schemas']['PartyDetails'][]
            /**
             * @description Pagination token to retrieve the next page.
             *     Empty, if there are no further results.
             *
             *     Optional
             */
            nextPageToken?: string
        }
        /** ListPackagesResponse */
        ListPackagesResponse: {
            /**
             * @description The IDs of all Daml-LF packages supported by the server.
             *     Each element must be a valid PackageIdString (as described in ``value.proto``).
             *
             *     Required: must be non-empty
             */
            packageIds: string[]
        }
        /** ListUserRightsResponse */
        ListUserRightsResponse: {
            /**
             * @description All rights of the user.
             *
             *     Optional: can be empty
             */
            rights?: components['schemas']['Right'][]
        }
        /** ListUsersResponse */
        ListUsersResponse: {
            /**
             * @description A subset of users of the participant node that fit into this page.
             *     Can be empty if no more users
             *
             *     Optional: can be empty
             */
            users?: components['schemas']['User'][]
            /**
             * @description Pagination token to retrieve the next page.
             *     Empty, if there are no further results.
             *
             *     Optional
             */
            nextPageToken?: string
        }
        /** ListVettedPackagesRequest */
        ListVettedPackagesRequest: {
            /**
             * @description The package metadata filter the returned vetted packages set must satisfy.
             *
             *     Optional
             */
            packageMetadataFilter?: components['schemas']['PackageMetadataFilter']
            /**
             * @description The topology filter the returned vetted packages set must satisfy.
             *
             *     Optional
             */
            topologyStateFilter?: components['schemas']['TopologyStateFilter']
            /**
             * @description Pagination token to determine the specific page to fetch. Using the token
             *     guarantees that ``VettedPackages`` on a subsequent page are all greater
             *     (``VettedPackages`` are sorted by synchronizer ID then participant ID) than
             *     the last ``VettedPackages`` on a previous page.
             *
             *     The server does not store intermediate results between calls chained by a
             *     series of page tokens. As a consequence, if new vetted packages are being
             *     added and a page is requested twice using the same token, more packages can
             *     be returned on the second call.
             *
             *     Leave unspecified (i.e. as empty string) to fetch the first page.
             *
             *     Optional
             */
            pageToken?: string
            /**
             * Format: int32
             * @description Maximum number of ``VettedPackages`` results to return in a single page.
             *
             *     If the page_size is unspecified (i.e. left as 0), the server will decide
             *     the number of results to be returned.
             *
             *     If the page_size exceeds the maximum supported by the server, an
             *     error will be returned.
             *
             *     To obtain the server's maximum consult the PackageService descriptor
             *     available in the VersionService.
             *
             *     Optional
             */
            pageSize?: number
        }
        /** ListVettedPackagesResponse */
        ListVettedPackagesResponse: {
            /**
             * @description All ``VettedPackages`` that contain at least one ``VettedPackage`` matching
             *     both a ``PackageMetadataFilter`` and a ``TopologyStateFilter``.
             *     Sorted by synchronizer_id then participant_id.
             *
             *     Optional: can be empty
             */
            vettedPackages?: components['schemas']['VettedPackages'][]
            /**
             * @description Pagination token to retrieve the next page.
             *     Empty string if there are no further results.
             *
             *     Optional
             */
            nextPageToken?: string
        }
        /** Map_Filters */
        Map_Filters: {
            [key: string]: components['schemas']['Filters']
        }
        /** Map_Int_Field */
        Map_Int_Field: {
            [key: string]: components['schemas']['Field']
        }
        /** Map_Int_TreeEvent */
        Map_Int_TreeEvent: {
            [key: string]: components['schemas']['TreeEvent']
        }
        /** Map_String */
        Map_String: {
            [key: string]: string
        }
        /** MinLedgerTime */
        MinLedgerTime: {
            time?: components['schemas']['Time']
        }
        /** MinLedgerTimeAbs */
        MinLedgerTimeAbs: {
            value: string
        }
        /** MinLedgerTimeRel */
        MinLedgerTimeRel: {
            value: components['schemas']['Duration']
        }
        /** NoPrior */
        NoPrior: Record<string, never>
        /**
         * ObjectMeta
         * @description Represents metadata corresponding to a participant resource (e.g. a participant user or participant local information about a party).
         *
         *     Based on ``ObjectMeta`` meta used in Kubernetes API.
         *     See https://github.com/kubernetes/apimachinery/blob/master/pkg/apis/meta/v1/generated.proto#L640
         */
        ObjectMeta: {
            /**
             * @description An opaque, non-empty value, populated by a participant server which represents the internal version of the resource
             *     this ``ObjectMeta`` message is attached to. The participant server will change it to a unique value each time the corresponding resource is updated.
             *     You must not rely on the format of resource version. The participant server might change it without notice.
             *     You can obtain the newest resource version value by issuing a read request.
             *     You may use it for concurrent change detection by passing it back unmodified in an update request.
             *     The participant server will then compare the passed value with the value maintained by the system to determine
             *     if any other updates took place since you had read the resource version.
             *     Upon a successful update you are guaranteed that no other update took place during your read-modify-write sequence.
             *     However, if another update took place during your read-modify-write sequence then your update will fail with an appropriate error.
             *     Concurrent change control is optional. It will be applied only if you include a resource version in an update request.
             *     When creating a new instance of a resource you must leave the resource version empty.
             *     Its value will be populated by the participant server upon successful resource creation.
             *
             *     Optional
             */
            resourceVersion?: string
            /**
             * @description A set of modifiable key-value pairs that can be used to represent arbitrary, client-specific metadata.
             *     Constraints:
             *
             *     1. The total size over all keys and values cannot exceed 256kb in UTF-8 encoding.
             *     2. Keys are composed of an optional prefix segment and a required name segment such that:
             *
             *        - key prefix, when present, must be a valid DNS subdomain with at most 253 characters, followed by a '/' (forward slash) character,
             *        - name segment must have at most 63 characters that are either alphanumeric ([a-z0-9A-Z]), or a '.' (dot), '-' (dash) or '_' (underscore);
             *          and it must start and end with an alphanumeric character.
             *
             *     3. Values can be any non-empty strings.
             *
             *     Keys with empty prefix are reserved for end-users.
             *     Properties set by external tools or internally by the participant server must use non-empty key prefixes.
             *     Duplicate keys are disallowed by the semantics of the protobuf3 maps.
             *     See: https://developers.google.com/protocol-buffers/docs/proto3#maps
             *     Annotations may be a part of a modifiable resource.
             *     Use the resource's update RPC to update its annotations.
             *     In order to add a new annotation or update an existing one using an update RPC, provide the desired annotation in the update request.
             *     In order to remove an annotation using an update RPC, provide the target annotation's key but set its value to the empty string in the update request.
             *     Modifiable
             *
             *     Optional: can be empty
             */
            annotations?: components['schemas']['Map_String']
        }
        /**
         * OffsetCheckpoint
         * @description OffsetCheckpoints may be used to:
         *
         *     - detect time out of commands.
         *     - provide an offset which can be used to restart consumption.
         */
        OffsetCheckpoint: {
            value: components['schemas']['OffsetCheckpoint1']
        }
        /**
         * OffsetCheckpoint
         * @description OffsetCheckpoints may be used to:
         *
         *     - detect time out of commands.
         *     - provide an offset which can be used to restart consumption.
         */
        OffsetCheckpoint1: {
            /**
             * Format: int64
             * @description The participant's offset, the details of the offset field are described in ``community/ledger-api/README.md``.
             *     Must be a valid absolute offset (positive integer).
             *
             *     Required
             */
            offset: number
            /**
             * @description The times associated with each synchronizer at this offset.
             *
             *     Optional: can be empty
             */
            synchronizerTimes?: components['schemas']['SynchronizerTime'][]
        }
        /**
         * OffsetCheckpoint
         * @description OffsetCheckpoints may be used to:
         *
         *     - detect time out of commands.
         *     - provide an offset which can be used to restart consumption.
         */
        OffsetCheckpoint2: {
            value: components['schemas']['OffsetCheckpoint1']
        }
        /**
         * OffsetCheckpoint
         * @description OffsetCheckpoints may be used to:
         *
         *     - detect time out of commands.
         *     - provide an offset which can be used to restart consumption.
         */
        OffsetCheckpoint3: {
            value: components['schemas']['OffsetCheckpoint1']
        }
        /** OffsetCheckpointFeature */
        OffsetCheckpointFeature: {
            /**
             * @description The maximum delay to emmit a new OffsetCheckpoint if it exists
             *
             *     Required
             */
            maxOffsetCheckpointEmissionDelay: components['schemas']['Duration']
        }
        /**
         * Operation
         * @description Required
         */
        Operation:
            | {
                  Empty: components['schemas']['Empty5']
              }
            | {
                  Unvet: components['schemas']['Unvet']
              }
            | {
                  Vet: components['schemas']['Vet']
              }
        /** PackageFeature */
        PackageFeature: {
            /**
             * Format: int32
             * @description The maximum number of vetted packages the server can return in a single
             *     response (page) when listing them.
             *
             *     Required
             */
            maxVettedPackagesPageSize: number
        }
        /**
         * PackageMetadataFilter
         * @description Filter the VettedPackages by package metadata.
         *
         *     A PackageMetadataFilter without package_ids and without package_name_prefixes
         *     matches any vetted package.
         *
         *     Non-empty fields specify candidate values of which at least one must match.
         *     If both fields are set, then a candidate is returned if it matches one of the fields.
         */
        PackageMetadataFilter: {
            /**
             * @description If this list is non-empty, any vetted package with a package ID in this
             *     list will match the filter.
             *
             *     Optional: can be empty
             */
            packageIds?: string[]
            /**
             * @description If this list is non-empty, any vetted package with a name matching at least
             *     one prefix in this list will match the filter.
             *
             *     Optional: can be empty
             */
            packageNamePrefixes?: string[]
        }
        /** PackagePreference */
        PackagePreference: {
            /**
             * @description The package reference of the preferred package.
             *
             *     Required
             */
            packageReference: components['schemas']['PackageReference']
            /**
             * @description The synchronizer for which the preferred package was computed.
             *     If the synchronizer_id was specified in the request, then it matches the request synchronizer_id.
             *
             *     Required
             */
            synchronizerId: string
        }
        /** PackageReference */
        PackageReference: {
            /** @description Required */
            packageId: string
            /** @description Required */
            packageName: string
            /** @description Required */
            packageVersion: string
        }
        /**
         * PackageVettingRequirement
         * @description Defines a package-name for which the commonly vetted package with the highest version must be found.
         */
        PackageVettingRequirement: {
            /**
             * @description The parties whose participants' vetting state should be considered when resolving the preferred package.
             *
             *     Required: must be non-empty
             */
            parties: string[]
            /**
             * @description The package-name for which the preferred package should be resolved.
             *
             *     Required
             */
            packageName: string
        }
        /** ParticipantAdmin */
        ParticipantAdmin: {
            value: components['schemas']['ParticipantAdmin1']
        }
        /** ParticipantAdmin */
        ParticipantAdmin1: Record<string, never>
        /** ParticipantAuthorizationAdded */
        ParticipantAuthorizationAdded: {
            value: components['schemas']['ParticipantAuthorizationAdded1']
        }
        /** ParticipantAuthorizationAdded */
        ParticipantAuthorizationAdded1: {
            /** @description Required */
            partyId: string
            /** @description Required */
            participantId: string
            /**
             * @description Required
             * @enum {string}
             */
            participantPermission:
                | 'PARTICIPANT_PERMISSION_UNSPECIFIED'
                | 'PARTICIPANT_PERMISSION_SUBMISSION'
                | 'PARTICIPANT_PERMISSION_CONFIRMATION'
                | 'PARTICIPANT_PERMISSION_OBSERVATION'
        }
        /** ParticipantAuthorizationChanged */
        ParticipantAuthorizationChanged: {
            value: components['schemas']['ParticipantAuthorizationChanged1']
        }
        /** ParticipantAuthorizationChanged */
        ParticipantAuthorizationChanged1: {
            /** @description Required */
            partyId: string
            /** @description Required */
            participantId: string
            /**
             * @description Required
             * @enum {string}
             */
            participantPermission:
                | 'PARTICIPANT_PERMISSION_UNSPECIFIED'
                | 'PARTICIPANT_PERMISSION_SUBMISSION'
                | 'PARTICIPANT_PERMISSION_CONFIRMATION'
                | 'PARTICIPANT_PERMISSION_OBSERVATION'
        }
        /** ParticipantAuthorizationRevoked */
        ParticipantAuthorizationRevoked: {
            value: components['schemas']['ParticipantAuthorizationRevoked1']
        }
        /** ParticipantAuthorizationRevoked */
        ParticipantAuthorizationRevoked1: {
            /** @description Required */
            partyId: string
            /** @description Required */
            participantId: string
        }
        /**
         * ParticipantAuthorizationTopologyFormat
         * @description A format specifying which participant authorization topology transactions to include and how to render them.
         */
        ParticipantAuthorizationTopologyFormat: {
            /**
             * @description List of parties for which the topology transactions should be sent.
             *     Empty means: for all parties.
             *
             *     Optional: can be empty
             */
            parties?: string[]
        }
        /** PartyDetails */
        PartyDetails: {
            /**
             * @description The stable unique identifier of a Daml party.
             *     Must be a valid PartyIdString (as described in ``value.proto``).
             *
             *     Required
             */
            party: string
            /**
             * @description true if party is hosted by the participant and the party shares the same identity provider as the user issuing the request.
             *
             *     Optional
             */
            isLocal?: boolean
            /**
             * @description Participant-local metadata of this party.
             *     Modifiable
             *
             *     Optional
             */
            localMetadata?: components['schemas']['ObjectMeta']
            /**
             * @description The id of the ``Identity Provider``
             *     Optional, if not set, there could be 3 options:
             *
             *     1. the party is managed by the default identity provider.
             *     2. party is not hosted by the participant.
             *     3. party is hosted by the participant, but is outside of the user's identity provider.
             *
             *     Optional
             */
            identityProviderId?: string
        }
        /** PartyManagementFeature */
        PartyManagementFeature: {
            /**
             * Format: int32
             * @description The maximum number of parties the server can return in a single response (page).
             *
             *     Required
             */
            maxPartiesPageSize: number
        }
        /**
         * PartySignatures
         * @description Additional signatures provided by the submitting parties
         */
        PartySignatures: {
            /**
             * @description Additional signatures provided by all individual parties
             *
             *     Required: must be non-empty
             */
            signatures: components['schemas']['SinglePartySignatures'][]
        }
        /**
         * PrefetchContractKey
         * @description Preload contracts
         */
        PrefetchContractKey: {
            /**
             * @description The template of contract the client wants to prefetch.
             *     Both package-name and package-id reference identifier formats for the template-id are supported.
             *     Note: The package-id reference identifier format is deprecated. We plan to end support for this format in version 3.4.
             *
             *     Required
             */
            templateId: string
            /**
             * @description The key of the contract the client wants to prefetch.
             *
             *     Required
             */
            contractKey: unknown
        }
        /** Prior */
        Prior: {
            /** Format: int32 */
            value: number
        }
        /**
         * PriorTopologySerial
         * @description The serial of last ``VettedPackages`` topology transaction on a given
         *     participant and synchronizer.
         */
        PriorTopologySerial: {
            serial?: components['schemas']['Serial']
        }
        /** ProtoAny */
        ProtoAny: {
            typeUrl: string
            value: string
            unknownFields: components['schemas']['UnknownFieldSet']
            valueDecoded?: string
        }
        /**
         * Reassignment
         * @description Complete view of an on-ledger reassignment.
         */
        Reassignment: {
            value: components['schemas']['JsReassignment']
        }
        /**
         * Reassignment
         * @description Complete view of an on-ledger reassignment.
         */
        Reassignment1: {
            value: components['schemas']['JsReassignment']
        }
        /** ReassignmentCommand */
        ReassignmentCommand: {
            command?: components['schemas']['Command1']
        }
        /** ReassignmentCommands */
        ReassignmentCommands: {
            /**
             * @description Identifier of the on-ledger workflow that this command is a part of.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *     Optional
             */
            workflowId?: string
            /**
             * @description Uniquely identifies the participant user that issued the command.
             *     Must be a valid UserIdString (as described in ``value.proto``).
             *     Required unless authentication is used with a user token.
             *     In that case, the token's user-id will be used for the request's user_id.
             *
             *     Optional
             */
            userId?: string
            /**
             * @description Uniquely identifies the command.
             *     The triple (user_id, submitter, command_id) constitutes the change ID for the intended ledger change.
             *     The change ID can be used for matching the intended ledger changes with all their completions.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *
             *     Required
             */
            commandId: string
            /**
             * @description Party on whose behalf the command should be executed.
             *     If ledger API authorization is enabled, then the authorization metadata must authorize the sender of the request
             *     to act on behalf of the given party.
             *     Must be a valid PartyIdString (as described in ``value.proto``).
             *
             *     Required
             */
            submitter: string
            /**
             * @description A unique identifier to distinguish completions for different submissions with the same change ID.
             *     Typically a random UUID. Applications are expected to use a different UUID for each retry of a submission
             *     with the same change ID.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *
             *     If omitted, the participant or the committer may set a value of their choice.
             *     Optional
             */
            submissionId?: string
            /**
             * @description Individual elements of this reassignment. Must be non-empty.
             *
             *     Required: must be non-empty
             */
            commands: components['schemas']['ReassignmentCommand'][]
        }
        /**
         * RevokeUserRightsRequest
         * @description Remove the rights from the set of rights granted to the user.
         *
         *     Required authorization: ``HasRight(ParticipantAdmin) OR IsAuthenticatedIdentityProviderAdmin(identity_provider_id)``
         */
        RevokeUserRightsRequest: {
            /**
             * @description The user from whom to revoke rights.
             *
             *     Required
             */
            userId: string
            /**
             * @description The rights to revoke.
             *
             *     Optional: can be empty
             */
            rights?: components['schemas']['Right'][]
            /**
             * @description The id of the ``Identity Provider``
             *     If not set, assume the user is managed by the default identity provider.
             *
             *     Optional
             */
            identityProviderId?: string
        }
        /** RevokeUserRightsResponse */
        RevokeUserRightsResponse: {
            /**
             * @description The rights that were actually revoked by the request.
             *
             *     Optional: can be empty
             */
            newlyRevokedRights?: components['schemas']['Right'][]
        }
        /**
         * Right
         * @description A right granted to a user.
         */
        Right: {
            kind?: components['schemas']['Kind']
        }
        /**
         * Serial
         * @description Optional
         */
        Serial:
            | {
                  Empty: components['schemas']['Empty6']
              }
            | {
                  NoPrior: components['schemas']['NoPrior']
              }
            | {
                  Prior: components['schemas']['Prior']
              }
        /** Signature */
        Signature: {
            /** @description Required */
            format: string
            /** @description Required: must be non-empty */
            signature: string
            /**
             * @description The fingerprint/id of the keypair used to create this signature and needed to verify.
             *
             *     Required
             */
            signedBy: string
            /**
             * @description The signing algorithm specification used to produce this signature
             *
             *     Required
             */
            signingAlgorithmSpec: string
        }
        /** SignedTransaction */
        SignedTransaction: {
            transaction: string
            signatures?: components['schemas']['Signature'][]
        }
        /** SigningPublicKey */
        SigningPublicKey: {
            /**
             * @description The serialization format of the public key
             *
             *     Required
             * @example CRYPTO_KEY_FORMAT_DER_X509_SUBJECT_PUBLIC_KEY_INFO
             */
            format: string
            /**
             * @description Serialized public key in the format specified above
             *
             *     Required: must be non-empty
             */
            keyData: string
            /**
             * @description The key specification
             *
             *     Required
             * @example SIGNING_KEY_SPEC_EC_CURVE25519
             */
            keySpec: string
        }
        /**
         * SinglePartySignatures
         * @description Signatures provided by a single party
         */
        SinglePartySignatures: {
            /**
             * @description Submitting party
             *
             *     Required
             */
            party: string
            /**
             * @description Signatures
             *
             *     Required: must be non-empty
             */
            signatures: components['schemas']['Signature'][]
        }
        /**
         * SubmitAndWaitForReassignmentRequest
         * @description This reassignment is executed as a single atomic update.
         */
        SubmitAndWaitForReassignmentRequest: {
            /**
             * @description The reassignment commands to be submitted.
             *
             *     Required
             */
            reassignmentCommands: components['schemas']['ReassignmentCommands']
            /**
             * @description If no event_format provided, the result will contain no events.
             *     The events in the result, will take shape TRANSACTION_SHAPE_ACS_DELTA.
             *
             *     Optional
             */
            eventFormat?: components['schemas']['EventFormat']
        }
        /** SubmitAndWaitResponse */
        SubmitAndWaitResponse: {
            /**
             * @description The id of the transaction that resulted from the submitted command.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *
             *     Required
             */
            updateId: string
            /**
             * Format: int64
             * @description The details of the offset field are described in ``community/ledger-api/README.md``.
             *
             *     Required
             */
            completionOffset: number
        }
        /** SubmitReassignmentRequest */
        SubmitReassignmentRequest: {
            /**
             * @description The reassignment command to be submitted.
             *
             *     Required
             */
            reassignmentCommands: components['schemas']['ReassignmentCommands']
        }
        /** SubmitReassignmentResponse */
        SubmitReassignmentResponse: Record<string, never>
        /** SubmitResponse */
        SubmitResponse: Record<string, never>
        /** SynchronizerTime */
        SynchronizerTime: {
            /**
             * @description The id of the synchronizer.
             *
             *     Required
             */
            synchronizerId: string
            /**
             * @description All commands with a maximum record time below this value MUST be considered lost if their completion has not arrived before this checkpoint.
             *
             *     Required
             */
            recordTime: string
        }
        /**
         * TemplateFilter
         * @description This filter matches contracts of a specific template.
         */
        TemplateFilter: {
            value: components['schemas']['TemplateFilter1']
        }
        /**
         * TemplateFilter
         * @description This filter matches contracts of a specific template.
         */
        TemplateFilter1: {
            /**
             * @description A template for which the payload should be included in the response.
             *     The ``template_id`` needs to be valid: corresponding template should be defined in
             *     one of the available packages at the time of the query.
             *     Both package-name and package-id reference formats for the identifier are supported.
             *     Note: The package-id reference identifier format is deprecated. We plan to end support for this format in version 3.4.
             *
             *     Required
             */
            templateId: string
            /**
             * @description Whether to include a ``created_event_blob`` in the returned ``CreatedEvent``.
             *     Use this to access the contract event payload in your API client
             *     for submitting it as a disclosed contract with future commands.
             *
             *     Optional
             */
            includeCreatedEventBlob?: boolean
        }
        /**
         * Time
         * @description Required
         */
        Time:
            | {
                  Empty: components['schemas']['Empty9']
              }
            | {
                  MinLedgerTimeAbs: components['schemas']['MinLedgerTimeAbs']
              }
            | {
                  MinLedgerTimeRel: components['schemas']['MinLedgerTimeRel']
              }
        /** TopologyEvent */
        TopologyEvent: {
            event?: components['schemas']['TopologyEventEvent']
        }
        /** TopologyEventEvent */
        TopologyEventEvent:
            | {
                  Empty: components['schemas']['Empty7']
              }
            | {
                  ParticipantAuthorizationAdded: components['schemas']['ParticipantAuthorizationAdded']
              }
            | {
                  ParticipantAuthorizationChanged: components['schemas']['ParticipantAuthorizationChanged']
              }
            | {
                  ParticipantAuthorizationRevoked: components['schemas']['ParticipantAuthorizationRevoked']
              }
        /**
         * TopologyFormat
         * @description A format specifying which topology transactions to include and how to render them.
         */
        TopologyFormat: {
            /**
             * @description Include participant authorization topology events in streams.
             *     If unset, no participant authorization topology events are emitted in the stream.
             *
             *     Optional
             */
            includeParticipantAuthorizationEvents?: components['schemas']['ParticipantAuthorizationTopologyFormat']
        }
        /**
         * TopologyStateFilter
         * @description Filter the vetted packages by the participant and synchronizer that they are
         *     hosted on.
         *
         *     Empty fields are ignored, such that a ``TopologyStateFilter`` without
         *     participant_ids and without synchronizer_ids matches a vetted package hosted
         *     on any participant and synchronizer.
         *
         *     Non-empty fields specify candidate values of which at least one must match.
         *     If both fields are set then at least one candidate value must match from each
         *     field.
         */
        TopologyStateFilter: {
            /**
             * @description If this list is non-empty, only vetted packages hosted on participants
             *     listed in this field match the filter.
             *     Query the current Ledger API's participant's ID via the public
             *     ``GetParticipantId`` command in ``PartyManagementService``.
             *
             *     Optional: can be empty
             */
            participantIds?: string[]
            /**
             * @description If this list is non-empty, only vetted packages from the topology state of
             *     the synchronizers in this list match the filter.
             *
             *     Optional: can be empty
             */
            synchronizerIds?: string[]
        }
        /** TopologyTransaction */
        TopologyTransaction: {
            value: components['schemas']['JsTopologyTransaction']
        }
        /** TraceContext */
        TraceContext: {
            /**
             * @description https://www.w3.org/TR/trace-context/
             *     Optional
             */
            traceparent?: string
            /** @description Optional */
            tracestate?: string
        }
        /**
         * Transaction
         * @description Filtered view of an on-ledger transaction's create and archive events.
         */
        Transaction: {
            value: components['schemas']['JsTransaction']
        }
        /**
         * TransactionFilter
         * @description Provided for backwards compatibility, it will be removed in the Canton version 3.5.0.
         *     Used both for filtering create and archive events as well as for filtering transaction trees.
         */
        TransactionFilter: {
            /**
             * @description Each key must be a valid PartyIdString (as described in ``value.proto``).
             *     The interpretation of the filter depends on the transaction-shape being filtered:
             *
             *     1. For **transaction trees** (used in GetUpdateTreesResponse for backwards compatibility) all party keys used as
             *        wildcard filters, and all subtrees whose root has one of the listed parties as an informee are returned.
             *        If there are ``CumulativeFilter``s, those will control returned ``CreatedEvent`` fields where applicable, but will
             *        not be used for template/interface filtering.
             *     2. For **ledger-effects** create and exercise events are returned, for which the witnesses include at least one of
             *        the listed parties and match the per-party filter.
             *     3. For **transaction and active-contract-set streams** create and archive events are returned for all contracts whose
             *        stakeholders include at least one of the listed parties and match the per-party filter.
             */
            filtersByParty?: components['schemas']['Map_Filters']
            /**
             * @description Wildcard filters that apply to all the parties existing on the participant. The interpretation of the filters is the same
             *     with the per-party filter as described above.
             */
            filtersForAnyParty?: components['schemas']['Filters']
        }
        /**
         * TransactionFormat
         * @description A format that specifies what events to include in Daml transactions
         *     and what data to compute and include for them.
         */
        TransactionFormat: {
            /** @description Required */
            eventFormat: components['schemas']['EventFormat']
            /**
             * @description What transaction shape to use for interpreting the filters of the event format.
             *
             *     Required
             * @enum {string}
             */
            transactionShape:
                | 'TRANSACTION_SHAPE_UNSPECIFIED'
                | 'TRANSACTION_SHAPE_ACS_DELTA'
                | 'TRANSACTION_SHAPE_LEDGER_EFFECTS'
        }
        /**
         * TransactionTree
         * @description Provided for backwards compatibility, it will be removed in the Canton version 3.5.0.
         *     Complete view of an on-ledger transaction.
         */
        TransactionTree: {
            value: components['schemas']['JsTransactionTree']
        }
        /**
         * TreeEvent
         * @description Provided for backwards compatibility, it will be removed in the Canton version 3.5.0.
         *     Each tree event message type below contains a ``witness_parties`` field which
         *     indicates the subset of the requested parties that can see the event
         *     in question.
         *
         *     Note that transaction trees might contain events with
         *     _no_ witness parties, which were included simply because they were
         *     children of events which have witnesses.
         */
        TreeEvent:
            | {
                  CreatedTreeEvent: components['schemas']['CreatedTreeEvent']
              }
            | {
                  ExercisedTreeEvent: components['schemas']['ExercisedTreeEvent']
              }
        /** Tuple2_String_String */
        Tuple2_String_String: string[]
        /**
         * UnassignCommand
         * @description Unassign a contract
         */
        UnassignCommand: {
            value: components['schemas']['UnassignCommand1']
        }
        /**
         * UnassignCommand
         * @description Unassign a contract
         */
        UnassignCommand1: {
            /**
             * @description The ID of the contract the client wants to unassign.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *
             *     Required
             */
            contractId: string
            /**
             * @description The ID of the source synchronizer
             *     Must be a valid synchronizer id
             *
             *     Required
             */
            source: string
            /**
             * @description The ID of the target synchronizer
             *     Must be a valid synchronizer id
             *
             *     Required
             */
            target: string
        }
        /**
         * UnassignedEvent
         * @description Records that a contract has been unassigned, and it becomes unusable on the source synchronizer
         */
        UnassignedEvent: {
            /**
             * @description The ID of the unassignment. This needs to be used as an input for a assign ReassignmentCommand.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *
             *     Required
             */
            reassignmentId: string
            /**
             * @description The ID of the reassigned contract.
             *     Must be a valid LedgerString (as described in ``value.proto``).
             *
             *     Required
             */
            contractId: string
            /**
             * @description The template of the reassigned contract.
             *     The identifier uses the package-id reference format.
             *
             *     Required
             */
            templateId: string
            /**
             * @description The ID of the source synchronizer
             *     Must be a valid synchronizer id
             *
             *     Required
             */
            source: string
            /**
             * @description The ID of the target synchronizer
             *     Must be a valid synchronizer id
             *
             *     Required
             */
            target: string
            /**
             * @description Party on whose behalf the unassign command was executed.
             *     Empty if the unassignment happened offline via the repair service.
             *     Must be a valid PartyIdString (as described in ``value.proto``).
             *
             *     Optional
             */
            submitter?: string
            /**
             * Format: int64
             * @description Each corresponding assigned and unassigned event has the same reassignment_counter. This strictly increases
             *     with each unassign command for the same contract. Creation of the contract corresponds to reassignment_counter
             *     equals zero.
             *
             *     Required
             */
            reassignmentCounter: number
            /**
             * @description Assignment exclusivity
             *     Before this time (measured on the target synchronizer), only the submitter of the unassignment can initiate the assignment
             *     Defined for reassigning participants.
             *
             *     Optional
             */
            assignmentExclusivity?: string
            /**
             * @description The parties that are notified of this event.
             *
             *     Required: must be non-empty
             */
            witnessParties: string[]
            /**
             * @description The package name of the contract.
             *
             *     Required
             */
            packageName: string
            /**
             * Format: int64
             * @description The offset of origin.
             *     Offsets are managed by the participant nodes.
             *     Reassignments can thus NOT be assumed to have the same offsets on different participant nodes.
             *     Must be a valid absolute offset (positive integer)
             *
             *     Required
             */
            offset: number
            /**
             * Format: int32
             * @description The position of this event in the originating reassignment.
             *     Node IDs are not necessarily equal across participants,
             *     as these may see different projections/parts of reassignments.
             *     Must be valid node ID (non-negative integer)
             *
             *     Required
             */
            nodeId: number
        }
        /** UnknownFieldSet */
        UnknownFieldSet: {
            fields: components['schemas']['Map_Int_Field']
        }
        /** Unvet */
        Unvet: {
            value: components['schemas']['Unvet1']
        }
        /** Unvet */
        Unvet1: {
            packages?: components['schemas']['VettedPackagesRef'][]
        }
        /** Update */
        Update:
            | {
                  OffsetCheckpoint: components['schemas']['OffsetCheckpoint2']
              }
            | {
                  Reassignment: components['schemas']['Reassignment']
              }
            | {
                  TopologyTransaction: components['schemas']['TopologyTransaction']
              }
            | {
                  Transaction: components['schemas']['Transaction']
              }
        /** Update */
        Update1:
            | {
                  OffsetCheckpoint: components['schemas']['OffsetCheckpoint3']
              }
            | {
                  Reassignment: components['schemas']['Reassignment1']
              }
            | {
                  TransactionTree: components['schemas']['TransactionTree']
              }
        /**
         * UpdateFormat
         * @description A format specifying what updates to include and how to render them.
         */
        UpdateFormat: {
            /**
             * @description Include Daml transactions in streams.
             *     If unset, no transactions are emitted in the stream.
             *
             *     Optional
             */
            includeTransactions?: components['schemas']['TransactionFormat']
            /**
             * @description Include (un)assignments in the stream.
             *     The events in the result take the shape TRANSACTION_SHAPE_ACS_DELTA.
             *     If unset, no (un)assignments are emitted in the stream.
             *
             *     Optional
             */
            includeReassignments?: components['schemas']['EventFormat']
            /**
             * @description Include topology events in streams.
             *     If unset no topology events are emitted in the stream.
             *
             *     Optional
             */
            includeTopologyEvents?: components['schemas']['TopologyFormat']
        }
        /** UpdateIdentityProviderConfigRequest */
        UpdateIdentityProviderConfigRequest: {
            /**
             * @description The identity provider config to update.
             *     Modifiable
             *
             *     Required
             */
            identityProviderConfig: components['schemas']['IdentityProviderConfig']
            /**
             * @description An update mask specifies how and which properties of the ``IdentityProviderConfig`` message are to be updated.
             *     An update mask consists of a set of update paths.
             *     A valid update path points to a field or a subfield relative to the ``IdentityProviderConfig`` message.
             *     A valid update mask must:
             *
             *     1. contain at least one update path,
             *     2. contain only valid update paths.
             *
             *     Fields that can be updated are marked as ``Modifiable``.
             *     For additional information see the documentation for standard protobuf3's ``google.protobuf.FieldMask``.
             *
             *     Required
             */
            updateMask: components['schemas']['FieldMask']
        }
        /** UpdateIdentityProviderConfigResponse */
        UpdateIdentityProviderConfigResponse: {
            /**
             * @description Updated identity provider config
             *
             *     Required
             */
            identityProviderConfig: components['schemas']['IdentityProviderConfig']
        }
        /**
         * UpdatePartyDetailsRequest
         * @description Required authorization: ``HasRight(ParticipantAdmin) OR IsAuthenticatedIdentityProviderAdmin(party_details.identity_provider_id)``
         */
        UpdatePartyDetailsRequest: {
            /**
             * @description Party to be updated
             *     Modifiable
             *
             *     Required
             */
            partyDetails: components['schemas']['PartyDetails']
            /**
             * @description An update mask specifies how and which properties of the ``PartyDetails`` message are to be updated.
             *     An update mask consists of a set of update paths.
             *     A valid update path points to a field or a subfield relative to the ``PartyDetails`` message.
             *     A valid update mask must:
             *
             *     1. contain at least one update path,
             *     2. contain only valid update paths.
             *
             *     Fields that can be updated are marked as ``Modifiable``.
             *     An update path can also point to non-``Modifiable`` fields such as 'party' and 'local_metadata.resource_version'
             *     because they are used:
             *
             *     1. to identify the party details resource subject to the update,
             *     2. for concurrent change control.
             *
             *     An update path can also point to non-``Modifiable`` fields such as 'is_local'
             *     as long as the values provided in the update request match the server values.
             *     Examples of update paths: 'local_metadata.annotations', 'local_metadata'.
             *     For additional information see the documentation for standard protobuf3's ``google.protobuf.FieldMask``.
             *     For similar Ledger API see ``com.daml.ledger.api.v2.admin.UpdateUserRequest``.
             *
             *     Required
             */
            updateMask: components['schemas']['FieldMask']
        }
        /** UpdatePartyDetailsResponse */
        UpdatePartyDetailsResponse: {
            /**
             * @description Updated party details
             *
             *     Required
             */
            partyDetails: components['schemas']['PartyDetails']
        }
        /**
         * UpdateUserIdentityProviderIdRequest
         * @description Required authorization: ``HasRight(ParticipantAdmin)``
         */
        UpdateUserIdentityProviderIdRequest: {
            /**
             * @description User to update
             *
             *     Required
             */
            userId: string
            /**
             * @description Current identity provider ID of the user
             *     If omitted, the default IDP is assumed
             *
             *     Optional
             */
            sourceIdentityProviderId?: string
            /**
             * @description Target identity provider ID of the user
             *     If omitted, the default IDP is assumed
             *
             *     Optional
             */
            targetIdentityProviderId?: string
        }
        /** UpdateUserIdentityProviderIdResponse */
        UpdateUserIdentityProviderIdResponse: Record<string, never>
        /**
         * UpdateUserRequest
         * @description Required authorization: ``HasRight(ParticipantAdmin) OR IsAuthenticatedIdentityProviderAdmin(user.identity_provider_id)``
         */
        UpdateUserRequest: {
            /**
             * @description The user to update.
             *     Modifiable
             *
             *     Required
             */
            user: components['schemas']['User']
            /**
             * @description An update mask specifies how and which properties of the ``User`` message are to be updated.
             *     An update mask consists of a set of update paths.
             *     A valid update path points to a field or a subfield relative to the ``User`` message.
             *     A valid update mask must:
             *
             *     1. contain at least one update path,
             *     2. contain only valid update paths.
             *
             *     Fields that can be updated are marked as ``Modifiable``.
             *     An update path can also point to a non-``Modifiable`` fields such as 'id' and 'metadata.resource_version'
             *     because they are used:
             *
             *     1. to identify the user resource subject to the update,
             *     2. for concurrent change control.
             *
             *     Examples of valid update paths: 'primary_party', 'metadata', 'metadata.annotations'.
             *     For additional information see the documentation for standard protobuf3's ``google.protobuf.FieldMask``.
             *     For similar Ledger API see ``com.daml.ledger.api.v2.admin.UpdatePartyDetailsRequest``.
             *
             *     Required
             */
            updateMask: components['schemas']['FieldMask']
        }
        /** UpdateUserResponse */
        UpdateUserResponse: {
            /**
             * @description Updated user
             *
             *     Required
             */
            user: components['schemas']['User']
        }
        /** UpdateVettedPackagesRequest */
        UpdateVettedPackagesRequest: {
            /**
             * @description Changes to apply to the current vetting state of the participant on the
             *     specified synchronizer. The changes are applied in order.
             *     Any package not changed will keep their previous vetting state.
             *
             *     Required: must be non-empty
             */
            changes: components['schemas']['VettedPackagesChange'][]
            /**
             * @description If dry_run is true, then the changes are only prepared, but not applied. If
             *     a request would trigger an error when run (e.g. TOPOLOGY_DEPENDENCIES_NOT_VETTED),
             *     it will also trigger an error when dry_run.
             *
             *     Use this flag to preview a change before applying it.
             *     Defaults to false.
             *
             *     Optional
             */
            dryRun?: boolean
            /**
             * @description If set, the requested changes will take place on the specified
             *     synchronizer. If synchronizer_id is unset and the participant is only
             *     connected to a single synchronizer, that synchronizer will be used by
             *     default. If synchronizer_id is unset and the participant is connected to
             *     multiple synchronizers, the request will error out with
             *     PACKAGE_SERVICE_CANNOT_AUTODETECT_SYNCHRONIZER.
             *
             *     Optional
             */
            synchronizerId?: string
            /**
             * @description The serial of the last ``VettedPackages`` topology transaction of this
             *     participant and on this synchronizer.
             *
             *     Execution of the request fails if this is not correct. Use this to guard
             *     against concurrent changes.
             *
             *     If left unspecified, no validation is done against the last transaction's
             *     serial.
             *
             *     Optional
             */
            expectedTopologySerial?: components['schemas']['PriorTopologySerial']
            /**
             * @description Controls whether potentially unsafe vetting updates are allowed.
             *
             *     Optional: can be empty
             */
            updateVettedPackagesForceFlags?: (
                | 'UPDATE_VETTED_PACKAGES_FORCE_FLAG_UNSPECIFIED'
                | 'UPDATE_VETTED_PACKAGES_FORCE_FLAG_ALLOW_VET_INCOMPATIBLE_UPGRADES'
                | 'UPDATE_VETTED_PACKAGES_FORCE_FLAG_ALLOW_UNVETTED_DEPENDENCIES'
            )[]
        }
        /** UpdateVettedPackagesResponse */
        UpdateVettedPackagesResponse: {
            /**
             * @description All vetted packages on this participant and synchronizer, before the
             *     specified changes. Empty if no vetting state existed beforehand.
             *
             *     Not populated if no vetted topology state exists prior to the update.
             *
             *     Optional
             */
            pastVettedPackages?: components['schemas']['VettedPackages']
            /**
             * @description All vetted packages on this participant and synchronizer, after the specified changes.
             *
             *     Required
             */
            newVettedPackages: components['schemas']['VettedPackages']
        }
        /**
         * UploadDarFileResponse
         * @description A message that is received when the upload operation succeeded.
         */
        UploadDarFileResponse: Record<string, never>
        /**
         * User
         * @description Users and rights
         *     /////////////////
         *      Users are used to dynamically manage the rights given to Daml applications.
         *      They are stored and managed per participant node.
         */
        User: {
            /**
             * @description The user identifier, which must be a non-empty string of at most 128
             *     characters that are either alphanumeric ASCII characters or one of the symbols "@^$.!`-#+'~_|:()".
             *
             *     Required
             */
            id: string
            /**
             * @description The primary party as which this user reads and acts by default on the ledger
             *     *provided* it has the corresponding ``CanReadAs(primary_party)`` or
             *     ``CanActAs(primary_party)`` rights.
             *     Ledger API clients SHOULD set this field to a non-empty value for all users to
             *     enable the users to act on the ledger using their own Daml party.
             *     Users for participant administrators MAY have an associated primary party.
             *     Modifiable
             *
             *     Optional
             */
            primaryParty?: string
            /**
             * @description When set, then the user is denied all access to the Ledger API.
             *     Otherwise, the user has access to the Ledger API as per the user's rights.
             *     Modifiable
             *
             *     Optional
             */
            isDeactivated?: boolean
            /**
             * @description The metadata of this user.
             *     Note that the ``metadata.resource_version`` tracks changes to the properties described by the ``User`` message and not the user's rights.
             *     Modifiable
             *
             *     Optional
             */
            metadata?: components['schemas']['ObjectMeta']
            /**
             * @description The ID of the identity provider configured by ``Identity Provider Config``
             *     If not set, assume the user is managed by the default identity provider.
             *
             *     Optional
             */
            identityProviderId?: string
        }
        /** UserManagementFeature */
        UserManagementFeature: {
            /**
             * @description Whether the Ledger API server provides the user management service.
             *
             *     Required
             */
            supported: boolean
            /**
             * Format: int32
             * @description The maximum number of rights that can be assigned to a single user.
             *     Servers MUST support at least 100 rights per user.
             *     A value of 0 means that the server enforces no rights per user limit.
             *
             *     Required
             */
            maxRightsPerUser: number
            /**
             * Format: int32
             * @description The maximum number of users the server can return in a single response (page).
             *     Servers MUST support at least a 100 users per page.
             *     A value of 0 means that the server enforces no page size limit.
             *
             *     Required
             */
            maxUsersPageSize: number
        }
        /** Vet */
        Vet: {
            value: components['schemas']['Vet1']
        }
        /** Vet */
        Vet1: {
            packages?: components['schemas']['VettedPackagesRef'][]
            newValidFromInclusive?: string
            newValidUntilExclusive?: string
        }
        /**
         * VettedPackage
         * @description A package that is vetting on a given participant and synchronizer,
         *     modelled after ``VettedPackage`` in `topology.proto <https://github.com/digital-asset/canton/blob/main/community/base/src/main/protobuf/com/digitalasset/canton/protocol/v30/topology.proto#L206>`_,
         *     enriched with the package name and version.
         */
        VettedPackage: {
            /**
             * @description Package ID of this package
             *
             *     Required
             */
            packageId: string
            /**
             * @description The time from which this package is vetted. Empty if vetting time has no
             *     lower bound.
             *
             *     Optional
             */
            validFromInclusive?: string
            /**
             * @description The time until which this package is vetted. Empty if vetting time has no
             *     upper bound.
             *
             *     Optional
             */
            validUntilExclusive?: string
            /**
             * @description Name of this package.
             *     Only available if the package has been uploaded to the current participant.
             *
             *     Optional
             */
            packageName?: string
            /**
             * @description Version of this package.
             *     Only available if the package has been uploaded to the current participant.
             *
             *     Optional
             */
            packageVersion?: string
        }
        /**
         * VettedPackages
         * @description The list of packages vetted on a given participant and synchronizer, modelled
         *     after ``VettedPackages`` in `topology.proto <https://github.com/digital-asset/canton/blob/main/community/base/src/main/protobuf/com/digitalasset/canton/protocol/v30/topology.proto#L206>`_.
         *     The list only contains packages that matched a filter in the query that
         *     originated it.
         */
        VettedPackages: {
            /**
             * @description Sorted by package_name and package_version where known, and package_id as a
             *     last resort.
             *
             *     Required: must be non-empty
             */
            packages: components['schemas']['VettedPackage'][]
            /**
             * @description Participant on which these packages are vetted.
             *
             *     Required
             */
            participantId: string
            /**
             * @description Synchronizer on which these packages are vetted.
             *
             *     Required
             */
            synchronizerId: string
            /**
             * Format: int32
             * @description Serial of last ``VettedPackages`` topology transaction of this participant
             *     and on this synchronizer.
             *
             *     Required
             */
            topologySerial: number
        }
        /**
         * VettedPackagesChange
         * @description A change to the set of vetted packages.
         */
        VettedPackagesChange: {
            operation?: components['schemas']['Operation']
        }
        /**
         * VettedPackagesRef
         * @description A reference to identify one or more packages.
         *
         *     A reference matches a package if its ``package_id`` matches the package's ID,
         *     its ``package_name`` matches the package's name, and its ``package_version``
         *     matches the package's version. If an attribute in the reference is left
         *     unspecified (i.e. as an empty string), that attribute is treated as a
         *     wildcard. At a minimum, ``package_id`` or the ``package_name`` must be
         *     specified.
         *
         *     If a reference does not match any package, the reference is considered
         *     unresolved and the entire update request is rejected.
         */
        VettedPackagesRef: {
            /**
             * @description Package's package id must be the same as this field.
             *
             *     Optional
             */
            packageId?: string
            /**
             * @description Package's name must be the same as this field.
             *
             *     Optional
             */
            packageName?: string
            /**
             * @description Package's version must be the same as this field.
             *
             *     Optional
             */
            packageVersion?: string
        }
        /**
         * WildcardFilter
         * @description This filter matches all templates.
         */
        WildcardFilter: {
            value: components['schemas']['WildcardFilter1']
        }
        /**
         * WildcardFilter
         * @description This filter matches all templates.
         */
        WildcardFilter1: {
            /**
             * @description Whether to include a ``created_event_blob`` in the returned ``CreatedEvent``.
             *     Use this to access the contract create event payload in your API client
             *     for submitting it as a disclosed contract with future commands.
             *
             *     Optional
             */
            includeCreatedEventBlob?: boolean
        }
    }
    responses: never
    parameters: never
    requestBodies: never
    headers: never
    pathItems: never
}
export type $defs = Record<string, never>
export interface operations {
    'postV2CommandsSubmit-and-wait': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['JsCommands']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['SubmitAndWaitResponse']
                }
            }
            /** @description Invalid value for: body, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'postV2CommandsSubmit-and-wait-for-transaction': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['JsSubmitAndWaitForTransactionRequest']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsSubmitAndWaitForTransactionResponse']
                }
            }
            /** @description Invalid value for: body, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'postV2CommandsSubmit-and-wait-for-reassignment': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['SubmitAndWaitForReassignmentRequest']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsSubmitAndWaitForReassignmentResponse']
                }
            }
            /** @description Invalid value for: body, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'postV2CommandsSubmit-and-wait-for-transaction-tree': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['JsCommands']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsSubmitAndWaitForTransactionTreeResponse']
                }
            }
            /** @description Invalid value for: body, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    postV2CommandsAsyncSubmit: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['JsCommands']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['SubmitResponse']
                }
            }
            /** @description Invalid value for: body, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'postV2CommandsAsyncSubmit-reassignment': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['SubmitReassignmentRequest']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['SubmitReassignmentResponse']
                }
            }
            /** @description Invalid value for: body, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    postV2CommandsCompletions: {
        parameters: {
            query?: {
                /** @description maximum number of elements to return, this param is ignored if is bigger than server setting */
                limit?: number
                /** @description timeout to complete and send result if no new elements are received (for open ended streams) */
                stream_idle_timeout_ms?: number
            }
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['CompletionStreamRequest']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['CompletionStreamResponse'][]
                }
            }
            /** @description Invalid value for: body, Invalid value for: query parameter limit, Invalid value for: query parameter stream_idle_timeout_ms, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'postV2EventsEvents-by-contract-id': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['GetEventsByContractIdRequest']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsGetEventsByContractIdResponse']
                }
            }
            /** @description Invalid value for: body, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    getV2Version: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetLedgerApiVersionResponse']
                }
            }
            /** @description Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    postV2DarsValidate: {
        parameters: {
            query?: {
                synchronizerId?: string
            }
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/octet-stream': string
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content?: never
            }
            /** @description Invalid value for: body, Invalid value for: query parameter synchronizerId, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    postV2Dars: {
        parameters: {
            query?: {
                vetAllPackages?: boolean
                synchronizerId?: string
            }
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/octet-stream': string
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['UploadDarFileResponse']
                }
            }
            /** @description Invalid value for: body, Invalid value for: query parameter vetAllPackages, Invalid value for: query parameter synchronizerId, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    getV2Packages: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['ListPackagesResponse']
                }
            }
            /** @description Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    postV2Packages: {
        parameters: {
            query?: {
                vetAllPackages?: boolean
                synchronizerId?: string
            }
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/octet-stream': string
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['UploadDarFileResponse']
                }
            }
            /** @description Invalid value for: body, Invalid value for: query parameter vetAllPackages, Invalid value for: query parameter synchronizerId, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'getV2PackagesPackage-id': {
        parameters: {
            query?: never
            header?: never
            path: {
                'package-id': string
            }
            cookie?: never
        }
        requestBody?: never
        responses: {
            200: {
                headers: {
                    'Canton-Package-Hash': string
                    [name: string]: unknown
                }
                content: {
                    'application/octet-stream': string
                }
            }
            /** @description Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'getV2PackagesPackage-idStatus': {
        parameters: {
            query?: never
            header?: never
            path: {
                'package-id': string
            }
            cookie?: never
        }
        requestBody?: never
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetPackageStatusResponse']
                }
            }
            /** @description Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'getV2Package-vetting': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['ListVettedPackagesRequest']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['ListVettedPackagesResponse']
                }
            }
            /** @description Invalid value for: body, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'postV2Package-vetting': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['UpdateVettedPackagesRequest']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['UpdateVettedPackagesResponse']
                }
            }
            /** @description Invalid value for: body, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'postV2Package-vettingList': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['ListVettedPackagesRequest']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['ListVettedPackagesResponse']
                }
            }
            /** @description Invalid value for: body, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'postV2Package-vettingUpdate': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['UpdateVettedPackagesRequest']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['UpdateVettedPackagesResponse']
                }
            }
            /** @description Invalid value for: body, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    getV2Parties: {
        parameters: {
            query?: {
                'identity-provider-id'?: string
                'filter-party'?: string
                /** @description maximum number of elements in a returned page */
                pageSize?: number
                /** @description token - to continue results from a given page, leave empty to start from the beginning of the list, obtain token from the result of previous page */
                pageToken?: string
            }
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['ListKnownPartiesResponse']
                }
            }
            /** @description Invalid value for: query parameter identity-provider-id, Invalid value for: query parameter filter-party, Invalid value for: query parameter pageSize, Invalid value for: query parameter pageToken, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    postV2Parties: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['AllocatePartyRequest']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['AllocatePartyResponse']
                }
            }
            /** @description Invalid value for: body, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    postV2PartiesExternalAllocate: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['AllocateExternalPartyRequest']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['AllocateExternalPartyResponse']
                }
            }
            /** @description Invalid value for: body, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'getV2PartiesParticipant-id': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetParticipantIdResponse']
                }
            }
            /** @description Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    getV2PartiesParty: {
        parameters: {
            query?: {
                'identity-provider-id'?: string
                parties?: string[]
            }
            header?: never
            path: {
                party: string
            }
            cookie?: never
        }
        requestBody?: never
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetPartiesResponse']
                }
            }
            /** @description Invalid value for: query parameter identity-provider-id, Invalid value for: query parameter parties, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    patchV2PartiesParty: {
        parameters: {
            query?: never
            header?: never
            path: {
                party: string
            }
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['UpdatePartyDetailsRequest']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['UpdatePartyDetailsResponse']
                }
            }
            /** @description Invalid value for: body, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'postV2PartiesExternalGenerate-topology': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['GenerateExternalPartyTopologyRequest']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GenerateExternalPartyTopologyResponse']
                }
            }
            /** @description Invalid value for: body, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'postV2StateActive-contracts': {
        parameters: {
            query?: {
                /** @description maximum number of elements to return, this param is ignored if is bigger than server setting */
                limit?: number
                /** @description timeout to complete and send result if no new elements are received (for open ended streams) */
                stream_idle_timeout_ms?: number
            }
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['GetActiveContractsRequest']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsGetActiveContractsResponse'][]
                }
            }
            /** @description Invalid value for: body, Invalid value for: query parameter limit, Invalid value for: query parameter stream_idle_timeout_ms, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'getV2StateConnected-synchronizers': {
        parameters: {
            query?: {
                party?: string
                participantId?: string
                identityProviderId?: string
            }
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetConnectedSynchronizersResponse']
                }
            }
            /** @description Invalid value for: query parameter party, Invalid value for: query parameter participantId, Invalid value for: query parameter identityProviderId, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'getV2StateLedger-end': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetLedgerEndResponse']
                }
            }
            /** @description Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'getV2StateLatest-pruned-offsets': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetLatestPrunedOffsetsResponse']
                }
            }
            /** @description Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    postV2Updates: {
        parameters: {
            query?: {
                /** @description maximum number of elements to return, this param is ignored if is bigger than server setting */
                limit?: number
                /** @description timeout to complete and send result if no new elements are received (for open ended streams) */
                stream_idle_timeout_ms?: number
            }
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['GetUpdatesRequest']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsGetUpdatesResponse'][]
                }
            }
            /** @description Invalid value for: body, Invalid value for: query parameter limit, Invalid value for: query parameter stream_idle_timeout_ms, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    postV2UpdatesFlats: {
        parameters: {
            query?: {
                /** @description maximum number of elements to return, this param is ignored if is bigger than server setting */
                limit?: number
                /** @description timeout to complete and send result if no new elements are received (for open ended streams) */
                stream_idle_timeout_ms?: number
            }
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['GetUpdatesRequest']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsGetUpdatesResponse'][]
                }
            }
            /** @description Invalid value for: body, Invalid value for: query parameter limit, Invalid value for: query parameter stream_idle_timeout_ms, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    postV2UpdatesTrees: {
        parameters: {
            query?: {
                /** @description maximum number of elements to return, this param is ignored if is bigger than server setting */
                limit?: number
                /** @description timeout to complete and send result if no new elements are received (for open ended streams) */
                stream_idle_timeout_ms?: number
            }
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['GetUpdatesRequest']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsGetUpdateTreesResponse'][]
                }
            }
            /** @description Invalid value for: body, Invalid value for: query parameter limit, Invalid value for: query parameter stream_idle_timeout_ms, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'getV2UpdatesTransaction-tree-by-offsetOffset': {
        parameters: {
            query?: {
                parties?: string[]
            }
            header?: never
            path: {
                offset: number
            }
            cookie?: never
        }
        requestBody?: never
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsGetTransactionTreeResponse']
                }
            }
            /** @description Invalid value for: path parameter offset, Invalid value for: query parameter parties, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'postV2UpdatesTransaction-by-offset': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['GetTransactionByOffsetRequest']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsGetTransactionResponse']
                }
            }
            /** @description Invalid value for: body, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'postV2UpdatesUpdate-by-offset': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['GetUpdateByOffsetRequest']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsGetUpdateResponse']
                }
            }
            /** @description Invalid value for: body, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'postV2UpdatesTransaction-by-id': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['GetTransactionByIdRequest']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsGetTransactionResponse']
                }
            }
            /** @description Invalid value for: body, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'postV2UpdatesUpdate-by-id': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['GetUpdateByIdRequest']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsGetUpdateResponse']
                }
            }
            /** @description Invalid value for: body, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'getV2UpdatesTransaction-tree-by-idUpdate-id': {
        parameters: {
            query?: {
                parties?: string[]
            }
            header?: never
            path: {
                'update-id': string
            }
            cookie?: never
        }
        requestBody?: never
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsGetTransactionTreeResponse']
                }
            }
            /** @description Invalid value for: query parameter parties, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    getV2Users: {
        parameters: {
            query?: {
                /** @description maximum number of elements in a returned page */
                pageSize?: number
                /** @description token - to continue results from a given page, leave empty to start from the beginning of the list, obtain token from the result of previous page */
                pageToken?: string
            }
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['ListUsersResponse']
                }
            }
            /** @description Invalid value for: query parameter pageSize, Invalid value for: query parameter pageToken, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    postV2Users: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['CreateUserRequest']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['CreateUserResponse']
                }
            }
            /** @description Invalid value for: body, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'getV2UsersUser-id': {
        parameters: {
            query?: {
                'identity-provider-id'?: string
            }
            header?: never
            path: {
                'user-id': string
            }
            cookie?: never
        }
        requestBody?: never
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetUserResponse']
                }
            }
            /** @description Invalid value for: query parameter identity-provider-id, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'deleteV2UsersUser-id': {
        parameters: {
            query?: never
            header?: never
            path: {
                'user-id': string
            }
            cookie?: never
        }
        requestBody?: never
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': Record<string, never>
                }
            }
            /** @description Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'patchV2UsersUser-id': {
        parameters: {
            query?: never
            header?: never
            path: {
                'user-id': string
            }
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['UpdateUserRequest']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['UpdateUserResponse']
                }
            }
            /** @description Invalid value for: body, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'getV2Authenticated-user': {
        parameters: {
            query?: {
                'identity-provider-id'?: string
            }
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetUserResponse']
                }
            }
            /** @description Invalid value for: query parameter identity-provider-id, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'getV2UsersUser-idRights': {
        parameters: {
            query?: never
            header?: never
            path: {
                'user-id': string
            }
            cookie?: never
        }
        requestBody?: never
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['ListUserRightsResponse']
                }
            }
            /** @description Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'postV2UsersUser-idRights': {
        parameters: {
            query?: never
            header?: never
            path: {
                'user-id': string
            }
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['GrantUserRightsRequest']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GrantUserRightsResponse']
                }
            }
            /** @description Invalid value for: body, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'patchV2UsersUser-idRights': {
        parameters: {
            query?: never
            header?: never
            path: {
                'user-id': string
            }
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['RevokeUserRightsRequest']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['RevokeUserRightsResponse']
                }
            }
            /** @description Invalid value for: body, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'patchV2UsersUser-idIdentity-provider-id': {
        parameters: {
            query?: never
            header?: never
            path: {
                'user-id': string
            }
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['UpdateUserIdentityProviderIdRequest']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['UpdateUserIdentityProviderIdResponse']
                }
            }
            /** @description Invalid value for: body, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    getV2Idps: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['ListIdentityProviderConfigsResponse']
                }
            }
            /** @description Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    postV2Idps: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['CreateIdentityProviderConfigRequest']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['CreateIdentityProviderConfigResponse']
                }
            }
            /** @description Invalid value for: body, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'getV2IdpsIdp-id': {
        parameters: {
            query?: never
            header?: never
            path: {
                'idp-id': string
            }
            cookie?: never
        }
        requestBody?: never
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetIdentityProviderConfigResponse']
                }
            }
            /** @description Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'deleteV2IdpsIdp-id': {
        parameters: {
            query?: never
            header?: never
            path: {
                'idp-id': string
            }
            cookie?: never
        }
        requestBody?: never
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['DeleteIdentityProviderConfigResponse']
                }
            }
            /** @description Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'patchV2IdpsIdp-id': {
        parameters: {
            query?: never
            header?: never
            path: {
                'idp-id': string
            }
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['UpdateIdentityProviderConfigRequest']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['UpdateIdentityProviderConfigResponse']
                }
            }
            /** @description Invalid value for: body, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'postV2Interactive-submissionPrepare': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['JsPrepareSubmissionRequest']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsPrepareSubmissionResponse']
                }
            }
            /** @description Invalid value for: body, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'postV2Interactive-submissionExecute': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['JsExecuteSubmissionRequest']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['ExecuteSubmissionResponse']
                }
            }
            /** @description Invalid value for: body, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'postV2Interactive-submissionExecuteandwait': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['JsExecuteSubmissionAndWaitRequest']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['ExecuteSubmissionAndWaitResponse']
                }
            }
            /** @description Invalid value for: body, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'postV2Interactive-submissionExecuteandwaitfortransaction': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['JsExecuteSubmissionAndWaitForTransactionRequest']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsExecuteSubmissionAndWaitForTransactionResponse']
                }
            }
            /** @description Invalid value for: body, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'getV2Interactive-submissionPreferred-package-version': {
        parameters: {
            query: {
                parties?: string[]
                'package-name': string
                vetting_valid_at?: string
                'synchronizer-id'?: string
            }
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetPreferredPackageVersionResponse']
                }
            }
            /** @description Invalid value for: query parameter parties, Invalid value for: query parameter package-name, Invalid value for: query parameter vetting_valid_at, Invalid value for: query parameter synchronizer-id, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'postV2Interactive-submissionPreferred-packages': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['GetPreferredPackagesRequest']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetPreferredPackagesResponse']
                }
            }
            /** @description Invalid value for: body, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
    'postV2ContractsContract-by-id': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['GetContractRequest']
            }
        }
        responses: {
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetContractResponse']
                }
            }
            /** @description Invalid value for: body, Invalid value for: headers */
            400: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'text/plain': string
                }
            }
            default: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['JsCantonError']
                }
            }
        }
    }
}
