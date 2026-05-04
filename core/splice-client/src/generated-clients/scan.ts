// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

export interface paths {
    '/readyz': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get: operations['isReady']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/livez': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get: operations['isLive']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/status': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get: operations['getHealthStatus']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/version': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get: operations['getVersion']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/dso': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get: operations['getDsoInfo']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/validators/validator-faucets': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /**
         * @description For every argument that is a valid onboarded validator, return
         *     statistics on its liveness activity, according to on-ledger state at the
         *     time of the request.
         */
        get: operations['getValidatorFaucetsByValidator']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/scans': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /**
         * @description Retrieve Canton scan configuration for all SVs, grouped by
         *     connected synchronizer ID
         */
        get: operations['listDsoScans']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/admin/validator/licenses': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /**
         * @description List all validators currently approved by members of the DSO, paginated,
         *     sorted newest-first.
         */
        get: operations['listValidatorLicenses']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/dso-sequencers': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /**
         * @description Retrieve Canton sequencer configuration for all SVs, grouped by
         *     connected synchronizer ID
         */
        get: operations['listDsoSequencers']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/sv-bft-sequencers': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /** @description Retrieve Canton BFT sequencer configuration for this SV, for each configured Synchronizer */
        get: operations['listSvBftSequencers']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/roll-forward-lsu': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /** @description Retrieve information on a roll-forward LSU */
        get: operations['getRollForwardLsu']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/active-synchronizer-serial': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /** @description Get the current physical synchronizer serial as reported by the SV participant. */
        get: operations['getActivePhysicalSynchronizerSerial']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/domains/{domain_id}/parties/{party_id}/participant-id': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /**
         * @description Get the ID of the participant hosting a given party.  This will fail if
         *     there are multiple party-to-participant mappings for the given
         *     synchronizer and party, which is not currently supported.
         */
        get: operations['getPartyToParticipant']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v1/domains/{domain_id}/parties/{party_id}/participant-id': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /**
         * @description Get the IDs of the participants hosting a given party.
         *     Unlike /v0, this endpoint supports parties hosted on multiple participants.
         */
        get: operations['getPartyToParticipantV1']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/domains/{domain_id}/members/{member_id}/traffic-status': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /**
         * @description Get a member's traffic status as reported by the sequencer, according to
         *     ledger state at the time of the request.
         */
        get: operations['getMemberTrafficStatus']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/closed-rounds': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /**
         * @description Every closed mining round on the ledger still in post-close process for
         *     the connected Splice network, in round number order, earliest-first.
         */
        get: operations['getClosedRounds']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/open-and-issuing-mining-rounds': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /**
         * @description All current open and issuing mining rounds, if the request is empty;
         *     passing contract IDs in the request can reduce the response data for
         *     polling/client-cache-update efficiency.
         */
        post: operations['getOpenAndIssuingMiningRounds']
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
         * @description Returns the update history in ascending order, paged, from ledger begin or optionally starting after a record time.
         *     Compared to `/v1/updates`, the `/v2/updates` removes the `offset` field in responses,
         *     which was hardcoded to 1 in `/v1/updates` for compatibility, and is now removed.
         *     `/v2/updates` sorts events lexicographically in `events_by_id` by `ID` for convenience, which should not be confused with the
         *     order of events in the transaction, for this you should rely on the order of `root_event_ids` and `child_event_ids`.
         *     Updates are ordered lexicographically by `(migration id, record time)`.
         *     For a given migration id, each update has a unique record time.
         *     The record time ranges of different migrations may overlap, i.e.,
         *     it is not guaranteed that the maximum record time of one migration is smaller than the minimum record time of the next migration,
         *     and there may be two updates with the same record time but different migration ids.
         */
        post: operations['getUpdateHistoryV2']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/updates/{update_id}': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /**
         * @description Returns the update with the given update_id.
         *     Compared to `/v1/updates/{update_id}`, the `/v2/updates/{update_id}` removes the `offset` field in responses,
         *     which was hardcoded to 1 in `/v1/updates/{update_id}` for compatibility, and is now removed.
         *     `/v2/updates/{update_id}` sorts events lexicographically in `events_by_id` by `ID` for convenience, which should not be confused with the
         *     order of events in the transaction, for this you should rely on the order of `root_event_ids` and `child_event_ids`.
         */
        get: operations['getUpdateByIdV2']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v1/updates': {
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
         * @description Returns the update history in ascending order, paged, from ledger begin or optionally starting after a record time.
         *     Unlike /v0/updates, this endpoint returns responses that are consistent across different
         *     scan instances. Event ids returned by this endpoint are not comparable to event ids returned by /v0/updates.
         *
         *     Updates are ordered lexicographically by `(migration id, record time)`.
         *     For a given migration id, each update has a unique record time.
         *     The record time ranges of different migrations may overlap, i.e.,
         *     it is not guaranteed that the maximum record time of one migration is smaller than the minimum record time of the next migration,
         *     and there may be two updates with the same record time but different migration ids.
         *     The order of items in events_by_id is not defined.
         */
        post: operations['getUpdateHistoryV1']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v1/updates/{update_id}': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /**
         * @deprecated
         * @description Returns the update with the given update_id.
         *     Unlike /v0/updates/{update_id}, this endpoint returns responses that are consistent across different
         *     scan instances. Event ids returned by this endpoint are not comparable to event ids returned by /v0/updates.
         *     The order of items in events_by_id is not defined.
         */
        get: operations['getUpdateByIdV1']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v2/updates/hash/{hash}': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /**
         * @description Returns the update associated with the given hash of the prepared transaction.
         *
         *     This endpoint is not always BFT safe.
         *     For transactions committed before a scan instance started indexing hashes, the instance will return a 404 error.
         *     For transactions committed around the time different scans started indexing hashes,
         *     some scan instances might return a 404 error while others return the matching update.
         *
         *     This is in contrast to the `v2/updates` and `v2/updates/{update_id}` endpoints, which are guaranteed to be always BFT safe.
         */
        get: operations['getUpdateByHash']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/state/acs/snapshot-timestamp': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /**
         * @description Returns the timestamp of the most recent snapshot before the given date, for the given migration_id.
         *     This corresponds to the record time of the last transaction in the snapshot.
         */
        get: operations['getDateOfMostRecentSnapshotBefore']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/state/acs/snapshot-timestamp-after': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /** @description Returns the timestamp of the first snapshot after the given date, for the given migration_id or larger. */
        get: operations['getDateOfFirstSnapshotAfter']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/state/acs': {
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
         * @description Deprecated. Please use /v1/state/acs instead. Returns the ACS in creation date ascending order, paged, for a given migration id and record time.
         */
        post: operations['getAcsSnapshotAt']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v1/state/acs': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /**
         * @description Returns the ACS in creation date ascending order, paged, for a given migration id and record time.
         *     Unlike /v0/state/acs, every contract is identified by an (optional) update_id
         *     (as opposed to the event ID in /v0/state/acs, which was not BFT-safe).
         *     The update_id is the ID of the update in which the contract was created, and can be used to correlate with updates returned by /v2/updates.
         *     For contracts created in an earlier migration ID, the update_id will be absent.
         */
        post: operations['getAcsSnapshotAtV1']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/state/acs/force': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /**
         * @description Takes a snapshot of the ACS at the current time.
         *     The responses can be used as parameters to `/v0/state/acs` to retrieve the snapshot.
         *     Disabled in production environments due to its persistent alteration of
         *     the behavior of future invocations of `/v0/state/acs`, as it causes an
         *     immediate internal snapshot and delay in the next automatic snapshot.
         */
        post: operations['forceAcsSnapshotNow']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/holdings/state': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /** @description Deprecated. Please use /v1/holdings/state instead. Returns the active amulet contracts for a given migration id and record time, in creation date ascending order, paged. */
        post: operations['getHoldingsStateAt']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v1/holdings/state': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /** @description Returns the active amulet contracts for a given migration id and record time, in creation date ascending order, paged. */
        post: operations['getHoldingsStateAtV1']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/holdings/summary': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /**
         * @description Returns the summary of active amulet contracts for a given migration id and record time, for the given parties.
         *     This is an aggregate of `/v0/holdings/state` by owner party ID with better performance than client-side computation.
         */
        post: operations['getHoldingsSummaryAt']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/ans-entries': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /**
         * @description Lists all non-expired ANS entries whose names are prefixed with the
         *     `name_prefix`, up to `page_size` entries.
         */
        get: operations['listAnsEntries']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/ans-entries/by-party/{party}': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /**
         * @description If present, the first ANS entry for user `party` according to
         *     `name` lexicographic order.
         */
        get: operations['lookupAnsEntryByParty']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/ans-entries/by-name/{name}': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /** @description If present, the ANS entry named exactly `name`. */
        get: operations['lookupAnsEntryByName']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/dso-party-id': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /** @description The party ID of the DSO for the Splice network connected by this Scan app. */
        get: operations['getDsoPartyId']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/amulet-rules': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        post: operations['getAmuletRules']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/external-party-amulet-rules': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        post: operations['getExternalPartyAmuletRules']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/ans-rules': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        post: operations['getAnsRules']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/featured-apps': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /** @description List every `FeaturedAppRight` registered with the DSO on the ledger. */
        get: operations['listFeaturedAppRights']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/featured-apps/{provider_party_id}': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /**
         * @description If `provider_party_id` has a `FeaturedAppRight` registered with the DSO,
         *     return it; `featured_app_right` will be empty otherwise.
         */
        get: operations['lookupFeaturedAppRight']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/featured-apps/by-provider/{provider_party_id}': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /** @description List all `FeaturedAppRight` contracts for the given provider. */
        get: operations['listFeaturedAppRightsByProvider']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/featured-apps/by-contract-id/{contract_id}': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /**
         * @description Look up a `FeaturedAppRight` contract by its contract ID.
         *     Returns `featured_app_right` if found, empty otherwise.
         */
        get: operations['lookupFeaturedAppRightByContractId']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/top-validators-by-validator-faucets': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /**
         * @description Get a list of top validators by number of rounds in which they collected
         *     faucets, and basis statistics on their round collection history
         */
        get: operations['getTopValidatorsByValidatorFaucets']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/transfer-preapprovals/by-party/{party}': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /** @description Lookup a TransferPreapproval by the receiver party. */
        get: operations['lookupTransferPreapprovalByParty']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/transfer-command-counter/{party}': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /** @description Lookup a TransferCommandCounter by the receiver party. */
        get: operations['lookupTransferCommandCounterByParty']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/transfer-command/status': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /** @description Retrieve the status of all transfer commands (up to a limit of 100) of the given sender for the specified nonce. */
        get: operations['lookupTransferCommandStatus']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/migrations/schedule': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /**
         * @description If the DSO has scheduled a synchronizer upgrade, return its planned time
         *     and the new migration ID.
         */
        get: operations['getMigrationSchedule']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/synchronizer-identities/{domain_id_prefix}': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get: operations['getSynchronizerIdentities']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/synchronizer-bootstrapping-transactions/{domain_id_prefix}': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get: operations['getSynchronizerBootstrappingTransactions']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/splice-instance-names': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /** @description Retrieve the UI names of various elements of this Splice network. */
        get: operations['getSpliceInstanceNames']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/amulet-price/votes': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /** @description Retrieve a list of the latest amulet price votes */
        get: operations['listAmuletPriceVotes']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/voterequest': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /** @description Look up several `VoteRequest`\ s at once by their contract IDs. */
        post: operations['listVoteRequestsByTrackingCid']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/voterequests/{vote_request_contract_id}': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /** @description Look up a `VoteRequest` by contract ID. */
        get: operations['lookupDsoRulesVoteRequest']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/admin/sv/voterequests': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /** @description List all active `VoteRequest`\ s. */
        get: operations['listDsoRulesVoteRequests']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/admin/sv/voteresults': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        post: operations['listVoteRequestResults']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/backfilling/migration-info': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /** @description List all previous synchronizer migrations in this Splice network's history. */
        post: operations['getMigrationInfo']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/backfilling/updates-before': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /**
         * @description Retrieve transactions and synchronizer reassignments prior to the
         *     request's specification.
         */
        post: operations['getUpdatesBefore']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/backfilling/status': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /** @description Retrieve the status of the backfilling process. */
        get: operations['getBackfillingStatus']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/acs/{party}': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /**
         * @deprecated
         * @description **Deprecated**. Fetch the current SV participant ACS snapshot for the DSO and `party`.
         */
        get: operations['getAcsSnapshot']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/aggregated-rounds': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /**
         * @deprecated
         * @description **Deprecated**. Retrieve the current earliest and latest rounds aggregated for this Scan.
         */
        get: operations['getAggregatedRounds']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/round-totals': {
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
         * @description **Deprecated**. List Amulet statistics for up to 200 closed rounds.
         */
        post: operations['listRoundTotals']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/round-party-totals': {
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
         * @description **Deprecated**. Retrieve per-party Amulet statistics for up to 50 closed rounds.
         */
        post: operations['listRoundPartyTotals']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/amulet-config-for-round': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /**
         * @deprecated
         * @description **Deprecated**. Retrieve some information from the `AmuletRules` selected for the given round
         */
        get: operations['getAmuletConfigForRound']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/round-of-latest-data': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /**
         * @deprecated
         * @description **Deprecated**. Get the latest round number for which aggregated data is available and
         *     the ledger effective time at which the round was closed.
         */
        get: operations['getRoundOfLatestData']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/rewards-collected': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /**
         * @deprecated
         * @description **Deprecated**. Get the total rewards collected ever
         */
        get: operations['getRewardsCollected']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/top-providers-by-app-rewards': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /**
         * @deprecated
         * @description **Deprecated**. Get a list of top-earning app providers, and the total earned app
         *     rewards for each
         */
        get: operations['getTopProvidersByAppRewards']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/top-validators-by-validator-rewards': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /**
         * @deprecated
         * @description **Deprecated**. Get a list of top-earning validators, and the total earned validator
         *     rewards for each
         */
        get: operations['getTopValidatorsByValidatorRewards']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/top-validators-by-purchased-traffic': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /**
         * @deprecated
         * @description **Deprecated**. Get a list of validators and their domain fees spends, sorted by the
         *     amount of extra traffic purchased
         */
        get: operations['getTopValidatorsByPurchasedTraffic']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/activities': {
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
         * @description **Deprecated**. Lists activities in descending order, paged, optionally starting after a provided event id.
         */
        post: operations['listActivity']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/transactions': {
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
         * @description **Deprecated with known bugs that will not be fixed, use /v2/updates instead**.
         *
         *     Lists transactions, by default in ascending order, paged, from ledger begin or optionally starting after a provided event id.
         */
        post: operations['listTransactionHistory']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/updates': {
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
         * @description **Deprecated**, use /v2/updates instead.
         *     Returns the update history in ascending order, paged, from ledger begin or optionally starting after a record time.
         */
        post: operations['getUpdateHistory']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/updates/{update_id}': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /**
         * @deprecated
         * @description **Deprecated**, use /v2/updates/{update_id} instead.
         */
        get: operations['getUpdateById']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/feature-support': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get: operations['featureSupport']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/backfilling/import-updates': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        post: operations['getImportUpdates']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/events': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /**
         * @description Returns the event history in ascending order, paged, from ledger begin or optionally starting after a record time.
         *     An event bears some combination of a transaction, a contract reassignment, and a verdict.
         *     Events are ordered lexicographically by `(migration id, record time)`.
         *     For a given migration id, each event has a unique record time.
         *     The record time ranges of different migrations may overlap, i.e.,
         *     it is not guaranteed that the maximum record time of one migration is smaller than the minimum record time of the next migration,
         *     and there may be two updates with the same record time but different migration ids.
         */
        post: operations['getEventHistory']
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/events/{update_id}': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /**
         * @description Returns the event with the given update_id.
         *     An event bears some combination of a transaction, a contract reassignment, and a verdict.
         */
        get: operations['getEventById']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/unclaimed-development-fund-coupons': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /** @description List all unclaimed development fund coupons. */
        get: operations['listUnclaimedDevelopmentFundCoupons']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/reward-accounting-process/rounds/earliest-available': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /**
         * @description SV node internal API (CIP-0104, subject to change).
         *     Returns the earliest round for which CIP-0104 reward accounting activity
         *     records are complete.
         */
        get: operations['getRewardAccountingEarliestAvailableRound']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/reward-accounting-process/rounds/{round_number}/activity-totals': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /**
         * @description SV node internal API (CIP-0104, subject to change).
         *     Return the CIP-0104 per-round activity totals for the
         *     specified round number.
         */
        get: operations['getRewardAccountingActivityTotals']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/reward-accounting-process/rounds/{round_number}/root-hash': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /**
         * @description SV node internal API (CIP-0104, subject to change).
         *     Returns the root hash computed for the specified round.
         */
        get: operations['getRewardAccountingRootHash']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/reward-accounting-process/rounds/{round_number}/batches/{batch_hash}': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /**
         * @description SV node internal API (CIP-0104, subject to change).
         *     Returns the contents of a reward batch identified by its hash.
         *     The response is either a list of child batch hashes (for internal nodes)
         *     or a list of minting allowances (for leaf nodes).
         */
        get: operations['getRewardAccountingBatch']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/history/bulk/acs': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        /** @description **Under Development, do not use in production yet** Get download URLs and metadata for an ACS snapshot available for bulk download, at or before a certain record time. */
        get: operations['listBulkAcsSnapshotObjects']
        put?: never
        post?: never
        delete?: never
        options?: never
        head?: never
        patch?: never
        trace?: never
    }
    '/v0/history/bulk/updates': {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        get?: never
        put?: never
        /**
         * @description **Under Development, do not use in production yet** Get download URLs and metadata for update history objects available for bulk download, between two record times.
         *     Note that the returned objects may include also updates outside of the requested record time range (since only full objects are served from storage), but guaranteed
         *     to include all updates in the requested range.
         */
        post: operations['listBulkUpdateHistoryObjects']
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
        GetSpliceInstanceNamesResponse: {
            /** @description What to call this Splice network. */
            network_name: string
            /** @description URL of an HTML favicon for this Splice network. */
            network_favicon_url: string
            /** @description What this Splice network calls Amulet. */
            amulet_name: string
            /** @description The three-letter acronym for Amulet. */
            amulet_name_acronym: string
            /** @description What this Splice network calls the Amulet Name Service. */
            name_service_name: string
            /** @description The acronym for `name_service_name`. */
            name_service_name_acronym: string
        }
        GetDsoPartyIdResponse: {
            dso_party_id: string
        }
        GetClosedRoundsResponse: {
            /**
             * @description Contracts of the Daml template `Splice.Round:ClosedMiningRound`, one
             *     for every closed round that is still in process, i.e. it either has
             *     unprocessed rewards or a missing `Splice.DsoRules:Confirmation`.
             */
            rounds: components['schemas']['Contract'][]
        }
        GetOpenAndIssuingMiningRoundsRequest: {
            /**
             * @description The contract IDs for `open_mining_rounds` in the response the caller
             *     knows about. If unsure, an empty array is fine; only a performance
             *     penalty is incurred.
             */
            cached_open_mining_round_contract_ids: components['schemas']['ContractId'][]
            /**
             * @description The contract IDs for `issuing_mining_rounds` in the response the
             *     caller knows about. If unsure, an empty array is fine; only a
             *     performance penalty is incurred.
             */
            cached_issuing_round_contract_ids: components['schemas']['ContractId'][]
        }
        /**
         * @description Daml contracts of the templates `Splice.Round.OpenMiningRound` and
         *     `Splice.Round.IssuingMiningRound` representing rounds for which rewards
         *     can be registered or are currently being computed, respectively.
         *     Contract IDs in the input serve as input sets for the two
         *     `MaybeCachedContractWithStateMap`s as described for that structure for
         *     `open_mining_rounds` and `issuing_mining_rounds`.
         */
        GetOpenAndIssuingMiningRoundsResponse: {
            /**
             * @description Suggested cache TTL for the response; this should expire before the
             *     `opensAt` of any open rounds that may not be in this response yet.
             */
            time_to_live_in_microseconds: number
            open_mining_rounds: components['schemas']['MaybeCachedContractWithStateMap']
            issuing_mining_rounds: components['schemas']['MaybeCachedContractWithStateMap']
        }
        GetAmuletRulesRequest: {
            cached_amulet_rules_contract_id?: components['schemas']['ContractId']
            cached_amulet_rules_domain_id?: string
        }
        /**
         * @description Contract of the Daml template `Splice.AmuletRules.AmuletRules`,
         *     including the full schedule of `AmuletConfig` changes approved by
         *     the DSO. Callers should not assume that `initialValue` is up-to-date,
         *     and should instead search `futureValues` for the latest configuration
         *     valid as of now. `contract` will be absent if its ID matches the input
         *     `cached_amulet_rules_contract_id`.
         */
        GetAmuletRulesResponse: {
            amulet_rules_update: components['schemas']['MaybeCachedContractWithState']
        }
        GetExternalPartyAmuletRulesRequest: {
            cached_external_party_amulet_rules_contract_id?: components['schemas']['ContractId']
            cached_external_party_amulet_rules_domain_id?: string
        }
        /**
         * @description A contract state update of Daml template
         *     `Splice.ExternalPartyAmuletRules.ExternalPartyAmuletRules`
         */
        GetExternalPartyAmuletRulesResponse: {
            external_party_amulet_rules_update: components['schemas']['MaybeCachedContractWithState']
        }
        GetAnsRulesRequest: {
            cached_ans_rules_contract_id?: components['schemas']['ContractId']
            cached_ans_rules_domain_id?: string
        }
        /** @description A contract state update of Daml template `Splice.Ans.AnsRules`. */
        GetAnsRulesResponse: {
            ans_rules_update: components['schemas']['MaybeCachedContractWithState']
        }
        /** @description Contracts of Daml template `Splice.Amulet.FeaturedAppRight`. */
        ListFeaturedAppRightsResponse: {
            featured_apps: components['schemas']['Contract'][]
        }
        /** @description If defined, a contract of Daml template `Splice.Amulet.FeaturedAppRight`. */
        LookupFeaturedAppRightResponse: {
            featured_app_right?: components['schemas']['Contract']
        }
        GetAmuletConfigForRoundResponse: {
            amulet_create_fee: string
            holding_fee: string
            lock_holder_fee: string
            transfer_fee: components['schemas']['SteppedRate']
        }
        SteppedRate: {
            initial: string
            steps: components['schemas']['RateStep'][]
        }
        RateStep: {
            amount: string
            rate: string
        }
        GetRoundOfLatestDataResponse: {
            /** Format: int64 */
            round: number
            /** Format: date-time */
            effectiveAt: string
        }
        GetRewardsCollectedResponse: {
            amount: string
        }
        GetValidatorTrafficBalanceResponse: {
            /** Format: double */
            remainingBalance: number
            /** Format: double */
            totalPurchased: number
        }
        CheckAndUpdateValidatorTrafficBalanceResponse: {
            approved: boolean
        }
        GetTopProvidersByAppRewardsResponse: {
            providersAndRewards: components['schemas']['PartyAndRewards'][]
        }
        GetTopValidatorsByValidatorRewardsResponse: {
            validatorsAndRewards: components['schemas']['PartyAndRewards'][]
        }
        PartyAndRewards: {
            provider: string
            rewards: string
        }
        GetTopValidatorsByValidatorFaucetsResponse: {
            /**
             * @description Up to `limit` validators, sorted greatest number of rounds
             *     collected first
             */
            validatorsByReceivedFaucets: components['schemas']['ValidatorReceivedFaucets'][]
        }
        GetTopValidatorsByPurchasedTrafficResponse: {
            validatorsByPurchasedTraffic: components['schemas']['ValidatorPurchasedTraffic'][]
        }
        ValidatorPurchasedTraffic: {
            validator: string
            /** Format: int64 */
            numPurchases: number
            /** Format: int64 */
            totalTrafficPurchased: number
            totalCcSpent: string
            /** Format: int64 */
            lastPurchasedInRound: number
        }
        ListSvBftSequencersResponse: {
            bftSequencers: components['schemas']['SynchronizerBftSequencer'][]
        }
        SynchronizerBftSequencer: {
            /**
             * Format: int64
             * @description The synchronizer serial corresponding to this sequencer.
             */
            serialId: number
            /** @description The id of the sequencer. */
            id: string
            /** @description The public accessible P2P url of the sequencer, use for inter sequencer communication. */
            p2pUrl: string
        }
        ListDsoSequencersResponse: {
            domainSequencers: components['schemas']['DomainSequencers'][]
        }
        DomainSequencers: {
            /** @description the synchronizer ID for the associated sequencers */
            domainId: string
            /** @description the sequencers associated with the synchronizer */
            sequencers: components['schemas']['DsoSequencer'][]
        }
        DsoSequencer: {
            /**
             * Format: int64
             * @description The synchronizer migration id corresponding to this sequencer.
             *     Set to -1 if serial is set.
             */
            migrationId: number
            /**
             * Format: int64
             * @description The synchronizer serial corresponding to this sequencer.
             *     One of migrationId or serialId will be set.
             */
            synchronizerSerial?: number
            /** @description The id of the sequencer. */
            id: string
            /** @description The public accessible url of the sequencer. */
            url: string
            /** @description The sequencer's operating SV name. */
            svName: string
            /**
             * Format: date-time
             * @description Any participant should subscribe to this sequencer after this time.
             */
            availableAfter: string
        }
        GetRollForwardLsuResponse: {
            /** @description Info on a roll-forward LSU */
            rollForwardLsu?: components['schemas']['RollForwardLsu']
        }
        RollForwardLsu: {
            /**
             * Format: date-time
             * @description The time at which to upgrade
             */
            upgradeTime: string
            currentPhysicalSynchronizerId: string
            successorPhysicalSynchronizerId: string
        }
        GetActivePhysicalSynchronizerSerialResponse: {
            /**
             * Format: int64
             * @description The current physical synchronizer serial as reported by the SV participant.
             */
            serial: number
        }
        ListDsoScansResponse: {
            scans: components['schemas']['DomainScans'][]
        }
        DomainScans: {
            domainId: string
            /**
             * @description SV scans for the associated synchronizer ID; there is at most one
             *     scan per SV for each synchronizer ID.
             */
            scans: components['schemas']['ScanInfo'][]
        }
        ScanInfo: {
            /** @description The public accessible url of the scan. */
            publicUrl: string
            /** @description The sequencer's operating SV name. */
            svName: string
        }
        TransactionHistoryRequest: {
            /**
             * @description Note that all transactions carry some monotonically-increasing event_id.
             *     Omit this page_end_event_id to start reading the first page, from the beginning or the end of the ledger, depending on the sort_order column.
             *     A subsequent request can fill the page_end_event_id with the last event_id of the TransactionHistoryResponse to continue reading in the same sort_order.
             *     The transaction with event_id == page_end_event_id will be skipped in the next response, making it possible to continuously read pages in the same sort_order.
             */
            page_end_event_id?: string
            /**
             * @description Sort order for the transactions. For ascending order, from beginning to the end of the ledger, use "asc".
             *     For descending order, from end to beginning of the ledger, use "desc".
             *     "asc" is used if the sort_order is omitted.
             * @enum {string}
             */
            sort_order?: 'asc' | 'desc'
            /**
             * Format: int64
             * @description The maximum number of transactions returned for this request.
             */
            page_size: number
        }
        TransactionHistoryResponse: {
            transactions: components['schemas']['TransactionHistoryResponseItem'][]
        }
        TransactionHistoryResponseItem: {
            /**
             * @description Describes the type of activity that occurred.
             *     Determines if the data for the transaction should be read
             *     from the `transfer`, `mint`, or `tap` property.
             * @enum {string}
             */
            transaction_type:
                | 'transfer'
                | 'mint'
                | 'devnet_tap'
                | 'abort_transfer_instruction'
            /** @description The event id. */
            event_id: string
            /**
             * @description The ledger offset of the event.
             *     Note that this field may not be the same across nodes, and therefore should not be compared between SVs.
             */
            offset?: string
            /**
             * Format: date-time
             * @description The effective date of the event.
             */
            date: string
            /** @description The id of the domain through which this transaction was sequenced. */
            domain_id: string
            /**
             * Format: int64
             * @description The round for which this transaction was registered.
             */
            round?: number
            /** @description A (batch) transfer from sender to receivers. */
            transfer?: components['schemas']['Transfer']
            /** @description The DSO mints amulet for the cases where the DSO rules allow for that. */
            mint?: components['schemas']['AmuletAmount']
            /** @description A tap creates a Amulet, only used for development purposes, and enabled only on DevNet. */
            tap?: components['schemas']['AmuletAmount']
            abort_transfer_instruction?: components['schemas']['AbortTransferInstruction']
        }
        UpdateHistoryRequestAfter: {
            /**
             * Format: int64
             * @description The migration id from which to start returning transactions. This is inclusive.
             */
            after_migration_id: number
            /**
             * @description The record time to start returning transactions from. This only affects
             *     transactions with the same migration id as after_migration_id. Higher migration ids
             *     are always considered to be later.
             */
            after_record_time: string
        }
        UpdateHistoryRequest: {
            /**
             * @description The transactions returned will either have a higher migration id or
             *     the same migration id and a record_time greater than the migration id and record time
             *     specified.
             */
            after?: components['schemas']['UpdateHistoryRequestAfter']
            /**
             * Format: int32
             * @description The maximum number of transactions returned for this request.
             */
            page_size: number
            /**
             * @description Whether contract payload should be encoded into json using a lossless, but much harder to process, encoding.
             *     This is mostly used for backend calls, and is not recommended for external users.
             *     Optional and defaults to false.
             */
            lossless?: boolean
        }
        UpdateHistoryRequestV1: {
            /**
             * @description The transactions returned will either have a higher migration id or
             *     the same migration id and a record_time greater than the migration id and record time
             *     specified.
             */
            after?: components['schemas']['UpdateHistoryRequestAfter']
            /**
             * Format: int32
             * @description The maximum number of transactions returned for this request.
             */
            page_size: number
            daml_value_encoding?: components['schemas']['DamlValueEncoding']
        }
        UpdateHistoryRequestV2: {
            /**
             * @description The transactions returned will either have a higher migration id or
             *     the same migration id and a record_time greater than the migration id and record time
             *     specified.
             */
            after?: components['schemas']['UpdateHistoryRequestAfter']
            /**
             * Format: int32
             * @description The maximum number of transactions returned for this request.
             */
            page_size: number
            daml_value_encoding?: components['schemas']['DamlValueEncoding']
        }
        UpdateHistoryResponseV2: {
            transactions: components['schemas']['UpdateHistoryItemV2'][]
        }
        UpdateHistoryResponse: {
            transactions: components['schemas']['UpdateHistoryItem'][]
        }
        /** @description An individual item in the update history. May be a transaction or a contract reassignment. */
        UpdateHistoryItemV2WithHash:
            | components['schemas']['UpdateHistoryTransactionV2WithHash']
            | components['schemas']['UpdateHistoryReassignment']
        /** @description An individual item in the update history. May be a transaction or a contract reassignment. */
        UpdateHistoryItemV2:
            | components['schemas']['UpdateHistoryTransactionV2']
            | components['schemas']['UpdateHistoryReassignment']
        /** @description An individual item in the update history. May be a transaction or a contract reassignment. */
        UpdateHistoryItem:
            | components['schemas']['UpdateHistoryTransaction']
            | components['schemas']['UpdateHistoryReassignment']
        /** @description A contract reassignment between synchronizer. May be an assignment or unassignment. */
        UpdateHistoryReassignment: {
            /** @description The id of the update. */
            update_id: string
            /**
             * @description The absolute offset.
             *     Note that this field may not be the same across nodes, and therefore should not be compared between SVs.
             */
            offset: string
            /** @description The time at which the transaction was sequenced. */
            record_time: string
            /** @description The reassignment event. May be an assignment or unassignment. */
            event:
                | components['schemas']['UpdateHistoryAssignment']
                | components['schemas']['UpdateHistoryUnassignment']
        }
        UpdateHistoryAssignment: {
            /** @description The party ID who submitted this reassignment */
            submitter: string
            /** @description The id of the synchronizer from which the contract was reassigned */
            source_synchronizer: string
            /** @description The id of the synchronizer to which the contract was reassigned */
            target_synchronizer: string
            /**
             * Format: int64
             * @description The migration id of the target synchronizer
             */
            migration_id: number
            /**
             * @description The id of the corresponding unassign event; this assignment will
             *     usually, but not always, occur after the so-identified unassignment
             *     event.
             */
            unassign_id: string
            /** @description The corresponding contract create event */
            created_event: components['schemas']['CreatedEvent']
            /**
             * Format: int64
             * @description Each corresponding assigned and unassigned event has the same reassignment_counter. This strictly increases with each unassign command for the same contract. Creation of the contract corresponds to reassignment_counter 0.
             */
            reassignment_counter: number
        }
        UpdateHistoryUnassignment: {
            /** @description The party who submitted this reassignment */
            submitter: string
            /** @description The id of the synchronizer from which the contract was reassigned */
            source_synchronizer: string
            /**
             * Format: int64
             * @description The migration id of the synchronizer from which the contract was reassigned
             */
            migration_id: number
            /** @description The id of the synchronizer to which the contract was reassigned */
            target_synchronizer: string
            /** @description The id of the unassign event, to later be correlated to an assign event */
            unassign_id: string
            /**
             * Format: int64
             * @description Each corresponding assigned and unassigned event has the same reassignment_counter. This strictly increases with each unassign command for the same contract. Creation of the contract corresponds to reassignment_counter 0.
             */
            reassignment_counter: number
            /** @description The id of the unassigned contract */
            contract_id: string
        }
        UpdateHistoryTransaction: {
            /** @description The id of the update. */
            update_id: string
            /**
             * Format: int64
             * @description The migration id of the synchronizer.
             */
            migration_id: number
            /**
             * @description This transaction's Daml workflow ID; a workflow ID can be associated
             *     with multiple transactions. If empty, no workflow ID was set.
             */
            workflow_id: string
            /**
             * @description The time at which the transaction was sequenced, with microsecond
             *     resolution, using ISO-8601 representation.
             */
            record_time: string
            /** @description The id of the synchronizer through which this transaction was sequenced. */
            synchronizer_id: string
            /**
             * @description Ledger effective time, using ISO-8601 representation. This is the time
             *     returned by `getTime` for all Daml executed as part of this transaction,
             *     both by the submitting participant and all confirming participants.
             */
            effective_at: string
            /**
             * @description The absolute offset.
             *     Note that this field may not be the same across nodes, and therefore should not be compared between SVs.
             *     However, within a single SV's scan, it is monotonically, lexicographically increasing.
             */
            offset: string
            /**
             * @description Roots of the transaction tree. These are guaranteed to occur as keys
             *     of the `events_by_id` object.
             */
            root_event_ids: string[]
            /**
             * @description Changes to the ledger that were caused by this transaction, keyed by ID.
             *     Values are nodes of the transaction tree.
             *     Within a transaction, IDs may be referenced by `root_event_ids` or
             *     `child_event_ids` in `ExercisedEvent` herein.
             */
            events_by_id: {
                [key: string]: components['schemas']['TreeEvent']
            }
            /**
             * @description For an externally signed transaction, contains the external transaction hash
             *     signed by the external party. Can be used to correlate an external submission with a committed transaction.
             *     This field is conditionally omitted from JSON when null (see OmitNullString).
             */
            external_transaction_hash?: string
        }
        BaseUpdateHistoryTransaction: {
            /** @description The id of the update. */
            update_id: string
            /**
             * Format: int64
             * @description The migration id of the synchronizer.
             */
            migration_id: number
            /**
             * @description This transaction's Daml workflow ID; a workflow ID can be associated
             *     with multiple transactions. If empty, no workflow ID was set.
             */
            workflow_id: string
            /**
             * @description The time at which the transaction was sequenced, with microsecond
             *     resolution, using ISO-8601 representation.
             */
            record_time: string
            /** @description The id of the synchronizer through which this transaction was sequenced. */
            synchronizer_id: string
            /**
             * @description Ledger effective time, using ISO-8601 representation. This is the time
             *     returned by `getTime` for all Daml executed as part of this transaction,
             *     both by the submitting participant and all confirming participants.
             */
            effective_at: string
            /**
             * @description Roots of the transaction tree. These are guaranteed to occur as keys
             *     of the `events_by_id` object.
             */
            root_event_ids: string[]
            /**
             * @description Changes to the ledger that were caused by this transaction, keyed by ID and sorted lexicographically by ID for display consistency.
             *     Values are nodes of the transaction tree.
             *     Within a transaction, IDs may be referenced by `root_event_ids` or
             *     `child_event_ids` in `ExercisedEvent` herein, which are sorted in the order as they occurred in the transaction.
             */
            events_by_id: {
                [key: string]: components['schemas']['TreeEvent']
            }
        }
        UpdateHistoryTransactionV2: components['schemas']['BaseUpdateHistoryTransaction'] & {
            /**
             * @description For an externally signed transaction, contains the external transaction hash
             *     signed by the external party. Can be used to correlate an external submission with a committed transaction.
             *     This field is conditionally omitted from JSON when null (see OmitNullString).
             */
            external_transaction_hash?: string
        }
        UpdateHistoryTransactionV2WithHash: components['schemas']['BaseUpdateHistoryTransaction'] & {
            /**
             * @description For an externally signed transaction, contains the external transaction hash
             *     signed by the external party. Can be used to correlate an external submission with a committed transaction.
             */
            external_transaction_hash: string
        }
        /** @description Either a creation or an exercise of a contract. */
        TreeEvent:
            | components['schemas']['CreatedEvent']
            | components['schemas']['ExercisedEvent']
        CreatedEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            event_type: 'created_event'
            /**
             * @description The ID of this particular event. Equal to the key of this element of
             *     the containing `events_by_id` if this is part of a `TreeEvent`.
             */
            event_id: string
            /** @description The ID of the created contract. */
            contract_id: string
            /** @description The template of the created contract. */
            template_id: string
            /** @description The package name of the created contract. */
            package_name: string
            /**
             * @description The arguments that have been used to create the contract, in the
             *     form of JSON representation of a Daml record.
             */
            create_arguments: Record<string, never>
            /**
             * Format: date-time
             * @description Ledger effective time of the transaction that created the contract.
             */
            created_at: string
            /** @description Signatories to the contract, in the form of party IDs. */
            signatories: string[]
            /** @description Observers to the contract, in the form of party IDs. */
            observers: string[]
        }
        ActiveContract: {
            /**
             * @description The id of the update in which this contract was created.
             *     Optional and will be absent for contracts created in prior migration IDs.
             */
            created_in_update_id?: string
            /** @description The ID of the created contract. */
            contract_id: string
            /** @description The template of the created contract. */
            template_id: string
            /** @description The package name of the created contract. */
            package_name: string
            /**
             * @description The arguments that have been used to create the contract, in the
             *     form of JSON representation of a Daml record.
             */
            create_arguments: Record<string, never>
            /**
             * Format: date-time
             * @description Ledger effective time of the transaction that created the contract.
             */
            created_at: string
            /** @description Signatories to the contract, in the form of party IDs. */
            signatories: string[]
            /** @description Observers to the contract, in the form of party IDs. */
            observers: string[]
        }
        ExercisedEvent: {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            event_type: 'exercised_event'
            /**
             * @description The ID of this particular event. Equal to the key of this element of
             *     the containing `events_by_id` if this is part of a `TreeEvent`.
             */
            event_id: string
            /** @description The ID of the created contract. */
            contract_id: string
            /** @description The template of the created contract. */
            template_id: string
            /** @description The package name of the created contract. */
            package_name: string
            /**
             * @description The choice that was exercised on the target contract, as an unqualified
             *     choice name, i.e. with no package or module name qualifiers.
             */
            choice: string
            /**
             * @description The argument of the exercised choice, in the form of JSON
             *     representation of a Daml value. This is usually a record with field
             *     names being the argument names, even in the case of a single apparent
             *     choice argument, which is represented as a single-element Daml record.
             */
            choice_argument: Record<string, never>
            /**
             * @description References to further events in the same transaction that appeared as a result of this ExercisedEvent.
             *     It contains only the immediate children of this event, not all members of the subtree rooted at this node.
             *     The order of the children is the same as the event order in the transaction.
             */
            child_event_ids: string[]
            /**
             * @description The result of exercising the choice, as the JSON representation of a
             *     Daml value.
             */
            exercise_result: Record<string, never>
            /** @description If true, the target contract may no longer be exercised. */
            consuming: boolean
            /** @description The parties that exercised the choice, in the form of party IDs. */
            acting_parties: string[]
            /** @description The interface where the choice is defined, if inherited. */
            interface_id?: string
        }
        AcsSnapshotTimestampResponse: {
            /**
             * Format: date-time
             * @description The record time of the last transaction in the snapshot.
             */
            record_time: string
        }
        AcsRequest: {
            /**
             * Format: int64
             * @description The migration id for which to return the ACS.
             */
            migration_id: number
            /**
             * Format: date-time
             * @description The timestamp at which the contract set was active.
             *     This needs to be an exact timestamp, i.e.,
             *     needs to correspond to a timestamp reported by `/v0/state/acs/snapshot-timestamp` if `record_time_match` is set to `exact` (which is the default).
             *     If `record_time_match` is set to `at_or_before`, this can be any timestamp, and the most recent snapshot at or before the given `record_time` will be returned.
             */
            record_time: string
            /**
             * @description How to match the record_time. "exact" requires the record_time to match exactly.
             *     "at_or_before" finds the most recent snapshot at or before the given record_time.
             * @default exact
             * @enum {string}
             */
            record_time_match: 'exact' | 'at_or_before'
            /**
             * Format: int64
             * @description Pagination token for the next page of results. For this to be valid,
             *     this must be the `next_page_token` from a prior request with identical
             *     parameters aside from `after` and `page_size`; the response may be
             *     invalid otherwise.
             */
            after?: number
            /**
             * Format: int32
             * @description The maximum number of created events returned for this request.
             */
            page_size: number
            /** @description Filters the ACS by contracts in which these party IDs are stakeholders. */
            party_ids?: string[]
            /** @description Filters the ACS by contracts with these template IDs, specified as "PACKAGE_NAME:MODULE_NAME:ENTITY_NAME". */
            templates?: string[]
        }
        HoldingsStateRequest: {
            /**
             * Format: int64
             * @description The migration id for which to return the ACS.
             */
            migration_id: number
            /**
             * Format: date-time
             * @description The timestamp at which the contract set was active.
             *     This needs to be an exact timestamp, i.e.,
             *     needs to correspond to a timestamp reported by `/v0/state/acs/snapshot-timestamp` if `record_time_match` is set to `exact` (which is the default).
             *     If `record_time_match` is set to `at_or_before`, this can be any timestamp, and the most recent snapshot at or before the given `record_time` will be returned.
             */
            record_time: string
            /**
             * @description How to match the record_time. "exact" requires the record_time to match exactly.
             *     "at_or_before" finds the most recent snapshot at or before the given record_time.
             * @default exact
             * @enum {string}
             */
            record_time_match: 'exact' | 'at_or_before'
            /**
             * Format: int64
             * @description Pagination token for the next page of results.
             */
            after?: number
            /**
             * Format: int32
             * @description The maximum number of created events returned for this request.
             */
            page_size: number
            /** @description Filters by contracts in which these party_ids are the owners of the amulets. */
            owner_party_ids: string[]
        }
        HoldingsSummaryRequest: {
            /**
             * Format: int64
             * @description The migration id for which to return the summary.
             */
            migration_id: number
            /**
             * Format: date-time
             * @description The timestamp at which the contract set was active.
             *     This needs to be an exact timestamp, i.e.,
             *     needs to correspond to a timestamp reported by `/v0/state/acs/snapshot-timestamp` if `record_time_match` is set to `exact` (which is the default).
             *     If `record_time_match` is set to `at_or_before`, this can be any timestamp, and the most recent snapshot at or before the given `record_time` will be returned.
             */
            record_time: string
            /**
             * @description How to match the record_time. "exact" requires the record_time to match exactly.
             *     "at_or_before" finds the most recent snapshot at or before the given record_time.
             * @default exact
             * @enum {string}
             */
            record_time_match: 'exact' | 'at_or_before'
            /** @description The owners for which to compute the summary. */
            owner_party_ids: string[]
            /**
             * Format: int64
             * @description Compute holding fees as of this round. Defaults to the earliest open mining round.
             */
            as_of_round?: number
        }
        ForceAcsSnapshotResponse: {
            /**
             * Format: date-time
             * @description The [recent] time for which this ACS snapshot was persisted.
             */
            record_time: string
            /**
             * Format: int64
             * @description The current migration ID of the Scan.
             */
            migration_id: number
        }
        AcsResponse: {
            /**
             * Format: date-time
             * @description The same `record_time` as in the request.
             */
            record_time: string
            /**
             * Format: int64
             * @description The same `migration_id` as in the request.
             */
            migration_id: number
            /**
             * @description Up to `page_size` contracts in the ACS.
             *     `create_arguments` are always encoded as `compact_json`.
             */
            created_events: components['schemas']['CreatedEvent'][]
            /**
             * Format: int64
             * @description When requesting the next page of results, pass this as `after`
             *     to the `AcsRequest` or `HoldingsStateRequest`.
             *     Will be absent when there are no more pages.
             */
            next_page_token?: number
        }
        AcsResponseV1: {
            /**
             * Format: date-time
             * @description The same `record_time` as in the request.
             */
            record_time: string
            /**
             * Format: int64
             * @description The same `migration_id` as in the request.
             */
            migration_id: number
            /**
             * @description Up to `page_size` contracts in the ACS.
             *     `create_arguments` are always encoded as `compact_json`.
             */
            created_events: components['schemas']['ActiveContract'][]
            /**
             * Format: int64
             * @description When requesting the next page of results, pass this as `after`
             *     to the `AcsRequest` or `HoldingsStateRequest`.
             *     Will be absent when there are no more pages.
             */
            next_page_token?: number
        }
        HoldingsSummaryResponse: {
            /**
             * Format: date-time
             * @description The same `record_time` as in the request.
             */
            record_time: string
            /**
             * Format: int64
             * @description The same `migration_id` as in the request.
             */
            migration_id: number
            /**
             * Format: int64
             * @description The same `as_of_round` as in the request, with the same default.
             */
            computed_as_of_round: number
            summaries: components['schemas']['HoldingsSummary'][]
        }
        /** @description Aggregate Amulet totals for a particular owner party ID. */
        HoldingsSummary: {
            /** @description Owner party ID of the amulet. Guaranteed to be unique among `summaries`. */
            party_id: string
            /**
             * @description Sum of unlocked amulet at time of reception, not counting holding
             *     fees deducted since.
             */
            total_unlocked_coin: string
            /**
             * @description Sum of locked amulet at time of original amulet reception, not
             *     counting holding fees deducted since.
             */
            total_locked_coin: string
            /** @description `total_unlocked_coin` + `total_locked_coin`. */
            total_coin_holdings: string
            /**
             * @description Sum of holding fees as of `computed_as_of_round` that apply to
             *     unlocked amulet.
             */
            accumulated_holding_fees_unlocked: string
            /**
             * @description Sum of holding fees as of `computed_as_of_round` that apply to
             *     locked amulet, including fees applied since the amulet's creation
             *     round.
             */
            accumulated_holding_fees_locked: string
            /** @description Same as `accumulated_holding_fees_unlocked` + `accumulated_holding_fees_locked`. */
            accumulated_holding_fees_total: string
            /** @description Same as `total_unlocked_coin` - `accumulated_holding_fees_unlocked`. */
            total_available_coin: string
        }
        ListActivityRequest: {
            /**
             * @description Minimal event_id for returned activities.
             *     Note that all activities carry some monotonically-increasing event_id. begin_after_id sets the minimum value for event_id's for the query.
             */
            begin_after_id?: string
            /**
             * Format: int64
             * @description The maximum number of activity items returned for this request.
             */
            page_size: number
        }
        ListActivityResponse: {
            activities: components['schemas']['ListActivityResponseItem'][]
        }
        ListActivityResponseItem: {
            /**
             * @description Describes the type of activity that occurred.
             *     Determines if the data for the activity should be read
             *     from the `transfer`, `mint`, or `tap` property.
             * @enum {string}
             */
            activity_type:
                | 'transfer'
                | 'mint'
                | 'devnet_tap'
                | 'abort_transfer_instruction'
            /** @description The event id. */
            event_id: string
            /**
             * @description The ledger offset of the event.
             *     Note that this field may not be the same across nodes, and therefore should not be compared between SVs.
             */
            offset?: string
            /**
             * Format: date-time
             * @description The effective date of the event.
             */
            date: string
            /** @description The id of the domain through which this transaction was sequenced. */
            domain_id: string
            /**
             * Format: int64
             * @description The round for which this transaction was registered.
             */
            round?: number
            /** @description A (batch) transfer from sender to receivers. */
            transfer?: components['schemas']['Transfer']
            /** @description The DSO mints amulet for the cases where the DSO rules allow for that. */
            mint?: components['schemas']['AmuletAmount']
            /** @description A tap creates a Amulet, only used for development purposes, and enabled only on DevNet. */
            tap?: components['schemas']['AmuletAmount']
            abort_transfer_instruction?: components['schemas']['AbortTransferInstruction']
        }
        /** @description A transfer between one sender and possibly many receivers */
        Transfer: {
            /** @description The sender amounts and fees. */
            sender: components['schemas']['SenderAmount']
            /** @description The amounts and fees per receiver. */
            receivers: components['schemas']['ReceiverAmount'][]
            /** @description Normalized balance changes per party caused by this transfer. */
            balance_changes: components['schemas']['BalanceChange'][]
            description?: string
            transferInstructionReceiver?: string
            transferInstructionAmount?: string
            transferInstructionCid?: string
            /** @enum {string} */
            transfer_kind?:
                | 'create_transfer_instruction'
                | 'transfer_instruction_accept'
                | 'preapproval_send'
        }
        AbortTransferInstruction: {
            /** @enum {string} */
            abort_kind: 'withdraw' | 'reject'
            transfer_instruction_cid: string
        }
        BalanceChange: {
            /** @description The party for which the balance changes. */
            party: string
            /**
             * @description The change to the total balance introduced by this balance change, normalized to round zero, i.e.,
             *     a amulet created in round 3 is treated as a amulet created in round 0 with a higher initial amount.
             */
            change_to_initial_amount_as_of_round_zero: string
            /** @description The change of total holding fees introduced by this balance change. */
            change_to_holding_fees_rate: string
        }
        AmuletAmount: {
            /** @description The party that owns the amulet. */
            amulet_owner: string
            /** @description The amulet amount. */
            amulet_amount: string
        }
        SenderAmount: {
            /** @description The sender who has transferred amulet. */
            party: string
            /** @description Total amount of amulet input into this transfer, before deducting holding fees. */
            input_amulet_amount?: string
            /** @description Total amount of app rewards input into this transfer. */
            input_app_reward_amount?: string
            /** @description Total amount of validator rewards input into this transfer. */
            input_validator_reward_amount?: string
            /** @description Total amount of sv rewards input into this transfer. */
            input_sv_reward_amount?: string
            /** @description Total amount of validator faucet coupon issuance input into this transfer. */
            input_validator_faucet_amount?: string
            /**
             * @description Fee charged for returning change to the sender,
             *     which is the smaller of the left-over balance after paying for all outputs
             *     or one amulet create fee.
             */
            sender_change_fee: string
            /** @description The final amount of amulet returned to the sender after paying for all outputs and fees. */
            sender_change_amount: string
            /** @description Total fees paid by the sender, based on receiver's receiver_fee_ratio on outputs */
            sender_fee: string
            /** @description Holding fees paid by the sender on their input amulets. */
            holding_fees: string
        }
        ReceiverAmount: {
            /** @description The receiver who will own the created output amulet. */
            party: string
            /** @description The amount of amulet to receive, before deducting receiver's part of the fees. */
            amount: string
            /** @description Total fees paid by the receiver, based on receiver_fee_ratio on outputs */
            receiver_fee: string
        }
        ListEntriesResponse: {
            entries: components['schemas']['AnsEntry'][]
        }
        LookupEntryByPartyResponse: {
            entry: components['schemas']['AnsEntry']
        }
        LookupEntryByNameResponse: {
            entry: components['schemas']['AnsEntry']
        }
        /** @description A Daml contract of template `Splice.AmuletRules:TransferPreapproval`. */
        LookupTransferPreapprovalByPartyResponse: {
            transfer_preapproval: components['schemas']['ContractWithState']
        }
        /** @description A Daml contract of template `Splice.ExternalPartyAmuletRules:TransferCommandCounter`. */
        LookupTransferCommandCounterByPartyResponse: {
            transfer_command_counter: components['schemas']['ContractWithState']
        }
        LookupTransferCommandStatusResponse: {
            transfer_commands_by_contract_id: components['schemas']['TransferCommandMap']
        }
        TransferCommandMap: {
            [
                key: string
            ]: components['schemas']['TransferCommandContractWithStatus']
        }
        /**
         * @description A contract of Daml template `Splice.ExternalPartyAmuletRules:TransferCommand`,
         *     and its status determined by the latest transactions.
         */
        TransferCommandContractWithStatus: {
            contract: components['schemas']['Contract']
            status: components['schemas']['TransferCommandContractStatus']
        }
        TransferCommandContractStatus:
            | components['schemas']['TransferCommandCreatedResponse']
            | components['schemas']['TransferCommandSentResponse']
            | components['schemas']['TransferCommandFailedResponse']
        BaseLookupTransferCommandStatusResponse: {
            /**
             * @description The status of the transfer command.
             *     created:
             *       The transfer command has been created and is waiting for automation to complete it.
             *     sent:
             *       The transfer command has been completed and the transfer to the receiver has finished.
             *     failed:
             *       The transfer command has failed permanently and nothing has been transferred. Refer to
             *       failure_reason for details. A new transfer command can be created.
             */
            status: string
        }
        TransferCommandCreatedResponse: components['schemas']['BaseLookupTransferCommandStatusResponse'] & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            status: 'created'
        }
        TransferCommandSentResponse: components['schemas']['BaseLookupTransferCommandStatusResponse'] & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            status: 'sent'
        }
        TransferCommandFailedResponse: components['schemas']['BaseLookupTransferCommandStatusResponse'] & {
            /**
             * @description The reason for the failure of the TransferCommand.
             *     failed:
             *       Completing the transfer failed, check the reason for details.
             *     withdrawn:
             *       The sender has withdrawn the TransferCommand before it could be completed.
             *     expired:
             *       The expiry time on the TransferCommand was reached before it could be completed.
             * @enum {string}
             */
            failure_kind: 'failed' | 'expired' | 'withdrawn'
            /** @description Human readable description of the failure */
            reason: string
        } & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            status: 'failed'
        }
        GetAcsSnapshotResponse: {
            /** @description base64-encoded ACS snapshot for the intersection of the DSO party and the requested party’s ACS */
            acs_snapshot: string
        }
        AnsEntry: {
            /**
             * @description If present, Daml contract ID of template `Splice.Ans:AnsEntry`.
             *     If absent, this is a DSO-provided entry for either the DSO or an SV.
             */
            contract_id?: string
            /** @description Owner party ID of this ANS entry. */
            user: string
            /** @description The ANS entry name. */
            name: string
            /** @description Either empty, or an http/https URL supplied by the `user`. */
            url: string
            /** @description Arbitrary description text supplied by `user`; may be empty. */
            description: string
            /**
             * Format: date-time
             * @description Time after which this ANS entry expires; if renewed, it will have a
             *     new `contract_id` and `expires_at`.
             *     If `null` or absent, does not expire; this is the case only for
             *     special entries provided by the DSO.
             */
            expires_at?: string
        }
        GetAggregatedRoundsResponse: {
            /** Format: int64 */
            start: number
            /** Format: int64 */
            end: number
        }
        ListRoundTotalsRequest: {
            /** Format: int64 */
            start_round: number
            /** Format: int64 */
            end_round: number
        }
        ListRoundPartyTotalsRequest: {
            /** Format: int64 */
            start_round: number
            /** Format: int64 */
            end_round: number
        }
        ListRoundTotalsResponse: {
            entries: components['schemas']['RoundTotals'][]
        }
        ListRoundPartyTotalsResponse: {
            entries: components['schemas']['RoundPartyTotals'][]
        }
        RoundPartyTotals: {
            /** Format: int64 */
            closed_round: number
            party: string
            app_rewards: string
            validator_rewards: string
            /** Format: int64 */
            traffic_purchased: number
            traffic_purchased_cc_spent: string
            /** Format: int64 */
            traffic_num_purchases: number
            cumulative_app_rewards: string
            cumulative_validator_rewards: string
            cumulative_change_to_initial_amount_as_of_round_zero: string
            cumulative_change_to_holding_fees_rate: string
            /** Format: int64 */
            cumulative_traffic_purchased: number
            cumulative_traffic_purchased_cc_spent: string
            /** Format: int64 */
            cumulative_traffic_num_purchases: number
        }
        RoundTotals: {
            /** Format: int64 */
            closed_round: number
            /** Format: date-time */
            closed_round_effective_at: string
            app_rewards: string
            validator_rewards: string
            change_to_initial_amount_as_of_round_zero: string
            change_to_holding_fees_rate: string
            cumulative_app_rewards: string
            cumulative_validator_rewards: string
            cumulative_change_to_initial_amount_as_of_round_zero: string
            cumulative_change_to_holding_fees_rate: string
            total_amulet_balance: string
        }
        MigrationSchedule: {
            /** Format: date-time */
            time: string
            /** Format: int64 */
            migration_id: number
        }
        SynchronizerIdentities: {
            sequencer_id: string
            sequencer_identity_transactions: string[]
            mediator_id: string
            mediator_identity_transactions: string[]
        }
        SynchronizerBootstrappingTransactions: {
            domain_parameters: string
            sequencer_domain_state: string
            mediator_domain_state: string
        }
        GetMigrationInfoRequest: {
            /** Format: int64 */
            migration_id: number
        }
        GetMigrationInfoResponse: {
            /**
             * Format: int64
             * @description The migration id that was active before the given migration id, if any.
             */
            previous_migration_id?: number
            /**
             * @description All domains for which there are updates in the given migration id,
             *     along with the record time of the newest and oldest update associated with each domain
             */
            record_time_range: components['schemas']['RecordTimeRange'][]
            /**
             * @description The update id of the last import update (where import updates are sorted by update id, ascending)
             *     for the given migration id, if any
             */
            last_import_update_id?: string
            /** @description True if this scan has all non-import updates for given migration id */
            complete: boolean
            /** @description True if this scan has all import updates for the given migration id */
            import_updates_complete?: boolean
        }
        RecordTimeRange: {
            synchronizer_id: string
            /** Format: date-time */
            min: string
            /** Format: date-time */
            max: string
        }
        GetUpdatesBeforeRequest: {
            /** Format: int64 */
            migration_id: number
            synchronizer_id: string
            /**
             * Format: date-time
             * @description Only return updates with a record time strictly smaller than this time.
             */
            before: string
            /**
             * Format: date-time
             * @description Only return updates with a record time equal to or greater than this time.
             */
            at_or_after?: string
            /**
             * Format: int32
             * @description Return at most this many updates. The actual number of updates returned may be smaller.
             */
            count: number
        }
        GetUpdatesBeforeResponse: {
            transactions: components['schemas']['UpdateHistoryItem'][]
        }
        GetImportUpdatesRequest: {
            /** Format: int64 */
            migration_id: number
            /** @description Only return updates with an update id strictly greater than this. */
            after_update_id: string
            /**
             * Format: int32
             * @description Return at most this many updates. The actual number of updates returned may be smaller.
             */
            limit: number
        }
        GetImportUpdatesResponse: {
            transactions: components['schemas']['UpdateHistoryItem'][]
        }
        /**
         * @description How daml values should be encoded in the response.
         *     "compact_json" is a compact, human-readable JSON encoding. It is the same encoding
         *     as the one used in the HTTP JSON API or the JavaScript codegen.
         *     "protobuf_json" is a verbose JSON encoding that is more difficult to parse,
         *     but contains type information, i.e., the values can be parsed losslessly
         *     without having access to the Daml source code.
         *     Optional and defaults to "compact_json".
         * @enum {string}
         */
        DamlValueEncoding: 'compact_json' | 'protobuf_json'
        GetMemberTrafficStatusResponse: {
            /**
             * @description The current traffic state for the member on the synchronizer under
             *     `actual`, and the total purchased traffic under `target`.  The purchased
             *     traffic may exceed the `actual` limit as purchases take time to be
             *     incorporated into the limit.
             */
            traffic_status: components['schemas']['MemberTrafficStatus']
        }
        MemberTrafficStatus: {
            /** @description The current traffic state for the member on the synchronizer */
            actual: components['schemas']['ActualMemberTrafficState']
            /** @description Total purchased traffic; may exceed limit in `actual` */
            target: components['schemas']['TargetMemberTrafficState']
        }
        ActualMemberTrafficState: {
            /**
             * Format: int64
             * @description Total extra traffic consumed by the member on the given synchronizer
             */
            total_consumed: number
            /**
             * Format: int64
             * @description Current extra traffic limit set for the member on the given synchronizer.
             *     An extra traffic top-up is complete once total_limit matches total_purchased.
             */
            total_limit: number
        }
        TargetMemberTrafficState: {
            /**
             * Format: int64
             * @description Total extra traffic purchased for the member on the given
             *     synchronizer in bytes.
             */
            total_purchased: number
        }
        GetPartyToParticipantResponse: {
            /**
             * @description ID of the participant hosting the provided party, in the form
             *     `PAR::id::fingerprint`
             */
            participant_id: string
        }
        GetPartyToParticipantResponseV1: {
            /**
             * @description IDs of the participants hosting the provided party, each in the form
             *     `PAR::id::fingerprint`
             */
            participant_ids: string[]
        }
        GetValidatorFaucetsByValidatorResponse: {
            /**
             * @description Statistics for any party ID arguments found to have valid onboarding
             *     licenses; the order in the response is unrelated to argument order.
             */
            validatorsReceivedFaucets: components['schemas']['ValidatorReceivedFaucets'][]
        }
        ValidatorReceivedFaucets: {
            /** @description The party ID of the onboarded validator */
            validator: string
            /**
             * Format: int64
             * @description how many rounds the validator has received a faucet for; guaranteed
             *     that collected + missed = last - first + 1
             */
            numRoundsCollected: number
            /**
             * Format: int64
             * @description how many rounds between firstCollected and lastCollected in which
             *     the validator failed to collect (i.e. was not active or available);
             *     can at most be max(0, lastCollected - firstCollected - 1).
             */
            numRoundsMissed: number
            /**
             * Format: int64
             * @description the round number when this validator started collecting faucets;
             *     the validator definitely recorded liveness in this round
             */
            firstCollectedInRound: number
            /**
             * Format: int64
             * @description The most recent round number in which the validator collected a faucet;
             *     the validator definitely recorded liveness in this round.  Will equal
             *     `firstCollected` if the validator has collected in only one round
             */
            lastCollectedInRound: number
        }
        GetBackfillingStatusResponse: {
            /**
             * @description True if ALL backfilling processes are complete, false otherwise.
             *
             *     Some scan endpoints return error responses if backfilling is not complete
             *     (e.g., `/v1/updates`), others return partial results (e.g., `/v0/transactions`).
             *     This endpoint is a simple indicator for whether historical information may be incomplete.
             *
             *     To determine the progress of individual backfilling processes, inspect the corresponding metrics.
             */
            complete: boolean
        }
        EventHistoryRequest: {
            /**
             * @description The events returned will either have a higher migration id or
             *     the same migration id and a record_time greater than the migration id and record time
             *     specified.
             */
            after?: components['schemas']['UpdateHistoryRequestAfter']
            /**
             * Format: int32
             * @description The maximum number of events returned for this request.
             */
            page_size: number
            daml_value_encoding?: components['schemas']['DamlValueEncoding']
        }
        EventHistoryResponse: {
            events: components['schemas']['EventHistoryItem'][]
        }
        /**
         * @description An event history item may contain a transaction update, a verdict from a mediator, both, or a contract reassignment.
         *     If an event pertains to a contract reassignment, there will be no verdict data.
         *     If an event pertains to a wholly private transaction, there will only be verdict data.
         *     If an event pertains to a transaction that is partially private, it may also bear verdict information for the private portions.
         *     When both fields are present, the transaction and verdict have the same `update_id` and `record_time`.
         *
         *     **Experimental**: for networks where the SVs enable activity record
         *     computation, a traffic summary and app activity record are present when
         *     a verdict is present.
         *
         *     This support is experimental while the preview phase of CIP-104 is running.
         */
        EventHistoryItem: {
            update?: components['schemas']['UpdateHistoryItemV2']
            verdict?: components['schemas']['EventHistoryVerdict']
            /**
             * @description **EXPERIMENTAL**: This property is experimental and subject to change. Data may be incomplete or missing.
             *
             *     This is our current best guess for how the summaries are served, but there remains a chance that the API needs to be adjusted.
             */
            traffic_summary?: components['schemas']['EventHistoryTrafficSummary']
            /** @description **EXPERIMENTAL**: This property is experimental and subject to change. Data may be incomplete or missing. */
            app_activity_records?: components['schemas']['EventHistoryAppActivityRecords']
        }
        EventHistoryVerdict: {
            /** @description The ID of the transaction update associated with this verdict. */
            update_id: string
            /**
             * Format: int64
             * @description The migration id of the domain through which this event was sequenced.
             */
            migration_id: number
            /** @description The id of the domain through which this event was sequenced. */
            domain_id: string
            /** @description The record_time of the transaction the verdict corresponds to. */
            record_time: string
            /**
             * @description The finalization_time of the transaction the verdict corresponds to.
             *     Note that this time might be different between different scans/mediators.
             */
            finalization_time: string
            /** @description Parties on whose behalf the transaction was submitted. */
            submitting_parties: string[]
            /** @description UID of the submitting participant. */
            submitting_participant_uid: string
            /** @description Result of the verdict. */
            verdict_result: components['schemas']['VerdictResult']
            /**
             * Format: int32
             * @description The mediator group which finalized this verdict.
             */
            mediator_group: number
            transaction_views: components['schemas']['TransactionViews']
        }
        TransactionViews: {
            views: components['schemas']['TransactionView'][]
            root_views: number[]
        }
        TransactionView: {
            /** Format: int32 */
            view_id: number
            informees: string[]
            confirming_parties: components['schemas']['Quorum'][]
            sub_views: number[]
            /** @description Hash of the view, for correlation with sequencer traffic data. Empty for older data ingested before this field was added. */
            view_hash: string
        }
        Quorum: {
            parties: string[]
            /** Format: int32 */
            threshold: number
        }
        /** @enum {string} */
        VerdictResult:
            | 'VERDICT_RESULT_UNSPECIFIED'
            | 'VERDICT_RESULT_ACCEPTED'
            | 'VERDICT_RESULT_REJECTED'
        /** @description Traffic summary data from the sequencer for the confirmation request corresponding to an event. */
        EventHistoryTrafficSummary: {
            /**
             * Format: int64
             * @description Total traffic cost of the confirmation request paid by the validator node that submitted it.
             */
            total_traffic_cost: number
            /** @description Summary of traffic-related data for all envelopes in the confirmation request. */
            envelope_traffic_summaries: components['schemas']['EnvelopeTrafficSummary'][]
        }
        /** @description Traffic cost for a single envelope and the view IDs contained in it */
        EnvelopeTrafficSummary: {
            /**
             * Format: int64
             * @description Traffic cost in bytes for this envelope.
             */
            traffic_cost: number
            /** @description View IDs from the verdict contained in this envelope */
            view_ids: number[]
        }
        /**
         * @description App activity record computed from verdicts and traffic summaries
         *     as per [CIP-104](https://github.com/canton-foundation/cips/blob/main/cip-0104/cip-0104.md).
         */
        EventHistoryAppActivityRecords: {
            /**
             * Format: int64
             * @description The round number assigned to the activity records.
             */
            round_number: number
            /** @description App activity records, one per app provider. */
            records: components['schemas']['AppActivityRecord'][]
        }
        /** @description ActivityRecord for an app. */
        AppActivityRecord: {
            /** @description The app provider party identifier. */
            party: string
            /**
             * Format: int64
             * @description Activity weight in bytes of traffic.
             */
            weight: number
        }
        ListUnclaimedDevelopmentFundCouponsResponse: {
            /** @description Contracts of the Daml template `Splice.Amulet:UnclaimedDevelopmentFundCoupon`. */
            'unclaimed-development-fund-coupons': components['schemas']['ContractWithState'][]
        }
        ListBulkAcsSnapshotObjectsResponse: {
            /**
             * Format: date-time
             * @description The record time for which the ACS snapshot was taken.
             */
            record_time: string
            /** @description The list of references to the bulk storage objects containing the ACS snapshot data. */
            object_refs: components['schemas']['BulkStorageObjectRef'][]
        }
        ListBulkUpdateHistoryObjectsRequest: {
            /**
             * Format: date-time
             * @description The returned objects must include all updates with record time greater than start_record_time (but may also include updates before it).
             */
            start_record_time: string
            /**
             * Format: date-time
             * @description The returned objects must include all updates with record time at most end_record_time (but may also include updates after it).
             */
            end_record_time: string
            /** @description The pagination token returned from a previous call to this endpoint with the same arguments. */
            next_page_token?: string
            /**
             * Format: int32
             * @description The maximum number of objects returned for this request.
             */
            page_size: number
        }
        ListBulkUpdateHistoryObjectsResponse: {
            /** @description The list of references to the bulk storage objects containing the updates. */
            object_refs: components['schemas']['BulkStorageObjectRef'][]
            /**
             * @description When requesting the next page of results, pass this as `after`
             *     to the next `ListBulkUpdateHistoryObjectsRequest` invocation.
             *     Will be absent when there are no more pages.
             */
            next_page_token?: string
        }
        BulkStorageObjectRef: {
            /** @description The URL from which the bulk storage object can be downloaded. */
            url: string
            /** @description The sha256 digest of the bulk storage object, for verification of integrity and consistency across SVs. */
            digest: string
        }
        GetRewardAccountingEarliestAvailableRoundResponse: {
            /** Format: int64 */
            earliest_round: number
        }
        GetRewardAccountingActivityTotalsResponse: {
            /** Format: int64 */
            round_number: number
            /** Format: int64 */
            total_app_activity_weight: number
            /** Format: int64 */
            active_parties_count: number
            /** Format: int64 */
            activity_records_count: number
        }
        GetRewardAccountingRootHashResponse: {
            /** Format: int64 */
            round_number: number
            /** @description Hex-encoded root hash */
            root_hash: string
        }
        GetRewardAccountingBatchResponse:
            | components['schemas']['RewardAccountingBatchOfBatches']
            | components['schemas']['RewardAccountingBatchOfMintingAllowances']
        BaseRewardAccountingBatch: {
            /**
             * @description The type of batch.
             *     BatchOfBatches: Contains child batch hashes.
             *     BatchOfMintingAllowances: Contains party + amount pairs.
             */
            batch_type: string
        }
        RewardAccountingBatchOfBatches: components['schemas']['BaseRewardAccountingBatch'] & {
            /** @description Hex-encoded child batch hashes */
            child_hashes: string[]
        } & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            batch_type: 'BatchOfBatches'
        }
        RewardAccountingBatchOfMintingAllowances: components['schemas']['BaseRewardAccountingBatch'] & {
            /** @description Party + amount pairs */
            minting_allowances: components['schemas']['RewardAccountingMintingAllowance'][]
        } & {
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            batch_type: 'BatchOfMintingAllowances'
        }
        RewardAccountingMintingAllowance: {
            provider: string
            amount: string
        }
        Status: {
            id: string
            uptime: string
            ports: {
                [key: string]: number
            }
            /** Format: binary */
            extra?: string
            active: boolean
        }
        SuccessStatusResponse: {
            success: components['schemas']['Status']
        }
        NotInitialized: {
            active: boolean
        }
        NotInitializedStatusResponse: {
            not_initialized: components['schemas']['NotInitialized']
        }
        ErrorResponse: {
            error: string
        }
        FailureStatusResponse: {
            failed: components['schemas']['ErrorResponse']
        }
        NodeStatus:
            | components['schemas']['SuccessStatusResponse']
            | components['schemas']['NotInitializedStatusResponse']
            | components['schemas']['FailureStatusResponse']
        Version: {
            version: string
            /** Format: date-time */
            commit_ts: string
        }
        Contract: {
            template_id: string
            contract_id: string
            payload: Record<string, never>
            created_event_blob: string
            created_at: string
        }
        ContractWithState: {
            contract: components['schemas']['Contract']
            domain_id?: string
        }
        GetDsoInfoResponse: {
            /** @description User ID representing the SV */
            sv_user: string
            /** @description Party representing the SV */
            sv_party_id: string
            /**
             * @description Party representing the whole DSO; for Scan only, also returned by
             *     `/v0/dso-party-id`
             */
            dso_party_id: string
            /**
             * @description Threshold required to pass vote requests; also known as the
             *     "governance threshold", it is always derived from the number of
             *     `svs` in `dso_rules`
             */
            voting_threshold: number
            /**
             * @description Contract of the Daml template `Splice.Round.OpenMiningRound`, the
             *     one with the highest round number on the ledger that has been signed
             *     by `dso_party_id`. The round may not be usable as it may not be
             *     opened yet, in accordance with its `opensAt` template field
             */
            latest_mining_round: components['schemas']['ContractWithState']
            /**
             * @description Contract of the Daml template `Splice.AmuletRules.AmuletRules`,
             *     including the full schedule of `AmuletConfig` changes approved by
             *     the DSO. Callers should not assume that `initialValue` is up-to-date,
             *     and should instead search `futureValues` for the latest configuration
             *     valid as of now
             */
            amulet_rules: components['schemas']['ContractWithState']
            /**
             * @description Contract of the Daml template `Splice.DsoRules.DsoRules`, listing
             *     the governance rules approved by the DSO governing this Splice network.
             */
            dso_rules: components['schemas']['ContractWithState']
            /**
             * @description For every one of `svs` listed in `dso_rules`, a contract of the Daml
             *     template `Splice.DSO.SvState.SvNodeState`. This does not include
             *     states for offboarded SVs, though they may still have an on-ledger
             *     state contract
             */
            sv_node_states: components['schemas']['ContractWithState'][]
            /** @description Initial round from which the network bootstraps */
            initial_round?: string
        }
        ListValidatorLicensesResponse: {
            /** @description Contracts of Daml template `Splice.ValidatorLicense:ValidatorLicense`. */
            validator_licenses: components['schemas']['Contract'][]
            /**
             * Format: int64
             * @description When requesting the next page of results, pass this as URL query parameter `after`.
             *     If absent or `null`, there are no more pages.
             */
            next_page_token?: number
        }
        ContractId: string
        MaybeCachedContractWithState: {
            contract?: components['schemas']['Contract']
            domain_id?: string
        }
        /**
         * @description Always created with respect to an input set of contract IDs. If an input
         *     contract ID is absent from the keys of this map, that contract should be
         *     considered removed by the caller; if present, `contract` may be empty,
         *     reflecting that the caller should already have the full contract data
         *     for that contract ID. Contracts not present in the input set will have
         *     full contract data. `domain_id` is always up-to-date; if undefined the
         *     contract is currently unassigned to a synchronizer, i.e. "in-flight".
         */
        MaybeCachedContractWithStateMap: {
            [key: string]: components['schemas']['MaybeCachedContractWithState']
        }
        /** @description Contracts of Daml template `Splice.DSO:AmuletPrice:AmuletPriceVote`. */
        ListAmuletPriceVotesResponse: {
            amulet_price_votes: components['schemas']['Contract'][]
        }
        BatchListVotesByVoteRequestsRequest: {
            /** @description Contract IDs of Daml template `Splice.DsoRules:VoteRequest`. */
            vote_request_contract_ids: string[]
        }
        ListVoteRequestByTrackingCidResponse: {
            /**
             * @description Contracts of Daml template `Splice.DsoRules:VoteRequest` that match
             *     `vote_request_contract_ids` in the request.
             */
            vote_requests: components['schemas']['Contract'][]
        }
        /** @description A contract of Daml template `Splice.DsoRules:VoteRequest`. */
        LookupDsoRulesVoteRequestResponse: {
            dso_rules_vote_request: components['schemas']['Contract']
        }
        /** @description Contracts of Daml template `Splice.DsoRules:VoteRequest`. */
        ListDsoRulesVoteRequestsResponse: {
            dso_rules_vote_requests: components['schemas']['Contract'][]
        }
        ListVoteResultsRequest: {
            actionName?: string
            accepted?: boolean
            requester?: string
            effectiveFrom?: string
            effectiveTo?: string
            limit: number
        }
        ListDsoRulesVoteResultsResponse: {
            dso_rules_vote_results: Record<string, never>[]
        }
        FeatureSupportResponse: {
            dummy?: boolean
        }
    }
    responses: {
        /** @description bad request */
        400: {
            headers: {
                [name: string]: unknown
            }
            content: {
                'application/json': components['schemas']['ErrorResponse']
            }
        }
        /** @description not found */
        404: {
            headers: {
                [name: string]: unknown
            }
            content: {
                'application/json': components['schemas']['ErrorResponse']
            }
        }
        /** @description internal server error */
        500: {
            headers: {
                [name: string]: unknown
            }
            content: {
                'application/json': components['schemas']['ErrorResponse']
            }
        }
        /** @description not implemented */
        501: {
            headers: {
                [name: string]: unknown
            }
            content: {
                'application/json': components['schemas']['ErrorResponse']
            }
        }
    }
    parameters: never
    requestBodies: never
    headers: never
    pathItems: never
}
export type $defs = Record<string, never>
export interface operations {
    isReady: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content?: never
            }
            /** @description service_unavailable */
            503: {
                headers: {
                    [name: string]: unknown
                }
                content?: never
            }
        }
    }
    isLive: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content?: never
            }
            /** @description service_unavailable */
            503: {
                headers: {
                    [name: string]: unknown
                }
                content?: never
            }
        }
    }
    getHealthStatus: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['NodeStatus']
                }
            }
        }
    }
    getVersion: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['Version']
                }
            }
        }
    }
    getDsoInfo: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetDsoInfoResponse']
                }
            }
        }
    }
    getValidatorFaucetsByValidator: {
        parameters: {
            query: {
                /**
                 * @description A list of validator party IDs, one per specification of the parameter.
                 *     Any party IDs not matching onboarded validators will be ignored
                 */
                validator_ids: string[]
            }
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetValidatorFaucetsByValidatorResponse']
                }
            }
            400: components['responses']['400']
            404: components['responses']['404']
        }
    }
    listDsoScans: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['ListDsoScansResponse']
                }
            }
        }
    }
    listValidatorLicenses: {
        parameters: {
            query?: {
                /** @description A `next_page_token` from a prior response; if absent, return the first page. */
                after?: number
                /** @description Maximum number of elements to return, 1000 by default. */
                limit?: number
            }
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['ListValidatorLicensesResponse']
                }
            }
        }
    }
    listDsoSequencers: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['ListDsoSequencersResponse']
                }
            }
        }
    }
    listSvBftSequencers: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['ListSvBftSequencersResponse']
                }
            }
        }
    }
    getRollForwardLsu: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetRollForwardLsuResponse']
                }
            }
        }
    }
    getActivePhysicalSynchronizerSerial: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetActivePhysicalSynchronizerSerialResponse']
                }
            }
            404: components['responses']['404']
            500: components['responses']['500']
        }
    }
    getPartyToParticipant: {
        parameters: {
            query?: never
            header?: never
            path: {
                /** @description The synchronizer ID to look up a mapping for. */
                domain_id: string
                /** @description The party ID to lookup a participant ID for. */
                party_id: string
            }
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetPartyToParticipantResponse']
                }
            }
            404: components['responses']['404']
            500: components['responses']['500']
        }
    }
    getPartyToParticipantV1: {
        parameters: {
            query?: never
            header?: never
            path: {
                /** @description The synchronizer ID to look up a mapping for. */
                domain_id: string
                /** @description The party ID to lookup a participant ID for. */
                party_id: string
            }
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetPartyToParticipantResponseV1']
                }
            }
            404: components['responses']['404']
            500: components['responses']['500']
        }
    }
    getMemberTrafficStatus: {
        parameters: {
            query?: never
            header?: never
            path: {
                /** @description The synchronizer ID to look up traffic for. */
                domain_id: string
                /**
                 * @description The participant or mediator whose traffic to look up, in the format
                 *     `code::id::fingerprint` where `code` is `PAR` or `MED`.
                 */
                member_id: string
            }
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetMemberTrafficStatusResponse']
                }
            }
            400: components['responses']['400']
            404: components['responses']['404']
            500: components['responses']['500']
        }
    }
    getClosedRounds: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetClosedRoundsResponse']
                }
            }
        }
    }
    getOpenAndIssuingMiningRounds: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['GetOpenAndIssuingMiningRoundsRequest']
            }
        }
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetOpenAndIssuingMiningRoundsResponse']
                }
            }
        }
    }
    getUpdateHistoryV2: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['UpdateHistoryRequestV2']
            }
        }
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['UpdateHistoryResponseV2']
                }
            }
            400: components['responses']['400']
            500: components['responses']['500']
        }
    }
    getUpdateByIdV2: {
        parameters: {
            query?: {
                daml_value_encoding?: components['schemas']['DamlValueEncoding']
            }
            header?: never
            path: {
                update_id: string
            }
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['UpdateHistoryItemV2']
                }
            }
            400: components['responses']['400']
            404: components['responses']['404']
            500: components['responses']['500']
        }
    }
    getUpdateHistoryV1: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['UpdateHistoryRequestV1']
            }
        }
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['UpdateHistoryResponse']
                }
            }
            400: components['responses']['400']
            500: components['responses']['500']
        }
    }
    getUpdateByIdV1: {
        parameters: {
            query?: {
                daml_value_encoding?: components['schemas']['DamlValueEncoding']
            }
            header?: never
            path: {
                update_id: string
            }
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['UpdateHistoryItem']
                }
            }
            400: components['responses']['400']
            404: components['responses']['404']
            500: components['responses']['500']
        }
    }
    getUpdateByHash: {
        parameters: {
            query?: {
                daml_value_encoding?: components['schemas']['DamlValueEncoding']
            }
            header?: never
            path: {
                hash: string
            }
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['UpdateHistoryItemV2WithHash']
                }
            }
            400: components['responses']['400']
            404: components['responses']['404']
            500: components['responses']['500']
        }
    }
    getDateOfMostRecentSnapshotBefore: {
        parameters: {
            query: {
                before: string
                migration_id: number
            }
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['AcsSnapshotTimestampResponse']
                }
            }
            400: components['responses']['400']
            404: components['responses']['404']
            500: components['responses']['500']
        }
    }
    getDateOfFirstSnapshotAfter: {
        parameters: {
            query: {
                after: string
                migration_id: number
            }
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['AcsSnapshotTimestampResponse']
                }
            }
            400: components['responses']['400']
            404: components['responses']['404']
            500: components['responses']['500']
        }
    }
    getAcsSnapshotAt: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['AcsRequest']
            }
        }
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['AcsResponse']
                }
            }
            400: components['responses']['400']
            404: components['responses']['404']
            500: components['responses']['500']
        }
    }
    getAcsSnapshotAtV1: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['AcsRequest']
            }
        }
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['AcsResponseV1']
                }
            }
            400: components['responses']['400']
            404: components['responses']['404']
            500: components['responses']['500']
        }
    }
    forceAcsSnapshotNow: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['ForceAcsSnapshotResponse']
                }
            }
            400: components['responses']['400']
            500: components['responses']['500']
        }
    }
    getHoldingsStateAt: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['HoldingsStateRequest']
            }
        }
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['AcsResponse']
                }
            }
            400: components['responses']['400']
            404: components['responses']['404']
            500: components['responses']['500']
        }
    }
    getHoldingsStateAtV1: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['HoldingsStateRequest']
            }
        }
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['AcsResponseV1']
                }
            }
            400: components['responses']['400']
            404: components['responses']['404']
            500: components['responses']['500']
        }
    }
    getHoldingsSummaryAt: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['HoldingsSummaryRequest']
            }
        }
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['HoldingsSummaryResponse']
                }
            }
            400: components['responses']['400']
            404: components['responses']['404']
            500: components['responses']['500']
        }
    }
    listAnsEntries: {
        parameters: {
            query: {
                /**
                 * @description Every result's name will start with this substring; if empty or absent,
                 *     all entries will be listed.
                 *     Does not have to be a whole word or segment; any substring will be accepted.
                 */
                name_prefix?: string
                /**
                 * @description The maximum number of results returned.
                 *     Older (but still non-expired) results are listed first.
                 */
                page_size: number
            }
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['ListEntriesResponse']
                }
            }
        }
    }
    lookupAnsEntryByParty: {
        parameters: {
            query?: never
            header?: never
            path: {
                /** @description The user party ID that holds the ANS entry. */
                party: string
            }
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['LookupEntryByPartyResponse']
                }
            }
            404: components['responses']['404']
        }
    }
    lookupAnsEntryByName: {
        parameters: {
            query?: never
            header?: never
            path: {
                name: string
            }
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['LookupEntryByNameResponse']
                }
            }
            404: components['responses']['404']
        }
    }
    getDsoPartyId: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetDsoPartyIdResponse']
                }
            }
        }
    }
    getAmuletRules: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['GetAmuletRulesRequest']
            }
        }
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetAmuletRulesResponse']
                }
            }
        }
    }
    getExternalPartyAmuletRules: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['GetExternalPartyAmuletRulesRequest']
            }
        }
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetExternalPartyAmuletRulesResponse']
                }
            }
        }
    }
    getAnsRules: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['GetAnsRulesRequest']
            }
        }
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetAnsRulesResponse']
                }
            }
        }
    }
    listFeaturedAppRights: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['ListFeaturedAppRightsResponse']
                }
            }
        }
    }
    lookupFeaturedAppRight: {
        parameters: {
            query?: never
            header?: never
            path: {
                provider_party_id: string
            }
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['LookupFeaturedAppRightResponse']
                }
            }
        }
    }
    listFeaturedAppRightsByProvider: {
        parameters: {
            query?: never
            header?: never
            path: {
                provider_party_id: string
            }
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['ListFeaturedAppRightsResponse']
                }
            }
        }
    }
    lookupFeaturedAppRightByContractId: {
        parameters: {
            query?: never
            header?: never
            path: {
                contract_id: string
            }
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['LookupFeaturedAppRightResponse']
                }
            }
        }
    }
    getTopValidatorsByValidatorFaucets: {
        parameters: {
            query: {
                /**
                 * @description Maximum number of validator records that may be returned in the
                 *     response
                 */
                limit: number
            }
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetTopValidatorsByValidatorFaucetsResponse']
                }
            }
            400: components['responses']['400']
            404: components['responses']['404']
        }
    }
    lookupTransferPreapprovalByParty: {
        parameters: {
            query?: never
            header?: never
            path: {
                party: string
            }
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['LookupTransferPreapprovalByPartyResponse']
                }
            }
            404: components['responses']['404']
        }
    }
    lookupTransferCommandCounterByParty: {
        parameters: {
            query?: never
            header?: never
            path: {
                party: string
            }
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['LookupTransferCommandCounterByPartyResponse']
                }
            }
            /** @description No TransferCommandCounter exists for this party. This means the nonce that should be used is 0. */
            404: components['responses']['404']
        }
    }
    lookupTransferCommandStatus: {
        parameters: {
            query: {
                sender: string
                nonce: number
            }
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['LookupTransferCommandStatusResponse']
                }
            }
            /** @description No TransferCommand exists with this contract id within the last 24h */
            404: components['responses']['404']
        }
    }
    getMigrationSchedule: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['MigrationSchedule']
                }
            }
            /** @description No migration scheduled */
            404: {
                headers: {
                    [name: string]: unknown
                }
                content?: never
            }
        }
    }
    getSynchronizerIdentities: {
        parameters: {
            query?: never
            header?: never
            path: {
                domain_id_prefix: string
            }
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['SynchronizerIdentities']
                }
            }
            404: components['responses']['404']
        }
    }
    getSynchronizerBootstrappingTransactions: {
        parameters: {
            query?: never
            header?: never
            path: {
                domain_id_prefix: string
            }
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['SynchronizerBootstrappingTransactions']
                }
            }
            404: components['responses']['404']
        }
    }
    getSpliceInstanceNames: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetSpliceInstanceNamesResponse']
                }
            }
            404: components['responses']['404']
        }
    }
    listAmuletPriceVotes: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['ListAmuletPriceVotesResponse']
                }
            }
        }
    }
    listVoteRequestsByTrackingCid: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['BatchListVotesByVoteRequestsRequest']
            }
        }
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['ListVoteRequestByTrackingCidResponse']
                }
            }
        }
    }
    lookupDsoRulesVoteRequest: {
        parameters: {
            query?: never
            header?: never
            path: {
                vote_request_contract_id: string
            }
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['LookupDsoRulesVoteRequestResponse']
                }
            }
            /** @description VoteRequest contract not found. */
            404: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['ErrorResponse']
                }
            }
        }
    }
    listDsoRulesVoteRequests: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['ListDsoRulesVoteRequestsResponse']
                }
            }
        }
    }
    listVoteRequestResults: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['ListVoteResultsRequest']
            }
        }
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['ListDsoRulesVoteResultsResponse']
                }
            }
        }
    }
    getMigrationInfo: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['GetMigrationInfoRequest']
            }
        }
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetMigrationInfoResponse']
                }
            }
            404: components['responses']['404']
        }
    }
    getUpdatesBefore: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['GetUpdatesBeforeRequest']
            }
        }
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetUpdatesBeforeResponse']
                }
            }
            404: components['responses']['404']
        }
    }
    getBackfillingStatus: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetBackfillingStatusResponse']
                }
            }
        }
    }
    getAcsSnapshot: {
        parameters: {
            query?: {
                record_time?: string
            }
            header?: never
            path: {
                party: string
            }
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetAcsSnapshotResponse']
                }
            }
        }
    }
    getAggregatedRounds: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetAggregatedRoundsResponse']
                }
            }
            404: components['responses']['404']
        }
    }
    listRoundTotals: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['ListRoundTotalsRequest']
            }
        }
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['ListRoundTotalsResponse']
                }
            }
            400: components['responses']['400']
            404: components['responses']['404']
            500: components['responses']['500']
        }
    }
    listRoundPartyTotals: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['ListRoundPartyTotalsRequest']
            }
        }
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['ListRoundPartyTotalsResponse']
                }
            }
            400: components['responses']['400']
            404: components['responses']['404']
            500: components['responses']['500']
        }
    }
    getAmuletConfigForRound: {
        parameters: {
            query: {
                round: number
            }
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetAmuletConfigForRoundResponse']
                }
            }
            404: components['responses']['404']
        }
    }
    getRoundOfLatestData: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetRoundOfLatestDataResponse']
                }
            }
            404: components['responses']['404']
        }
    }
    getRewardsCollected: {
        parameters: {
            query?: {
                round?: number
            }
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetRewardsCollectedResponse']
                }
            }
            404: components['responses']['404']
        }
    }
    getTopProvidersByAppRewards: {
        parameters: {
            query: {
                round: number
                limit: number
            }
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetTopProvidersByAppRewardsResponse']
                }
            }
            400: components['responses']['400']
            404: components['responses']['404']
        }
    }
    getTopValidatorsByValidatorRewards: {
        parameters: {
            query: {
                round: number
                limit: number
            }
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetTopValidatorsByValidatorRewardsResponse']
                }
            }
            400: components['responses']['400']
            404: components['responses']['404']
        }
    }
    getTopValidatorsByPurchasedTraffic: {
        parameters: {
            query: {
                round: number
                limit: number
            }
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetTopValidatorsByPurchasedTrafficResponse']
                }
            }
            400: components['responses']['400']
            404: components['responses']['404']
        }
    }
    listActivity: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['ListActivityRequest']
            }
        }
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['ListActivityResponse']
                }
            }
            404: components['responses']['404']
            500: components['responses']['500']
        }
    }
    listTransactionHistory: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['TransactionHistoryRequest']
            }
        }
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['TransactionHistoryResponse']
                }
            }
            400: components['responses']['400']
            404: components['responses']['404']
            500: components['responses']['500']
        }
    }
    getUpdateHistory: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['UpdateHistoryRequest']
            }
        }
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['UpdateHistoryResponse']
                }
            }
            400: components['responses']['400']
            500: components['responses']['500']
        }
    }
    getUpdateById: {
        parameters: {
            query?: {
                /**
                 * @description Whether contract payload should be encoded into json using a lossless, but much harder to process, encoding.
                 *     This is mostly used for backend calls, and is not recommended for external users.
                 *     Optional and defaults to false.
                 */
                lossless?: boolean
            }
            header?: never
            path: {
                update_id: string
            }
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['UpdateHistoryItem']
                }
            }
            400: components['responses']['400']
            404: components['responses']['404']
            500: components['responses']['500']
        }
    }
    featureSupport: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['FeatureSupportResponse']
                }
            }
            500: components['responses']['500']
        }
    }
    getImportUpdates: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['GetImportUpdatesRequest']
            }
        }
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetImportUpdatesResponse']
                }
            }
            404: components['responses']['404']
        }
    }
    getEventHistory: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['EventHistoryRequest']
            }
        }
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['EventHistoryResponse']
                }
            }
            400: components['responses']['400']
            500: components['responses']['500']
        }
    }
    getEventById: {
        parameters: {
            query?: {
                daml_value_encoding?: components['schemas']['DamlValueEncoding']
            }
            header?: never
            path: {
                update_id: string
            }
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['EventHistoryItem']
                }
            }
            400: components['responses']['400']
            404: components['responses']['404']
            500: components['responses']['500']
        }
    }
    listUnclaimedDevelopmentFundCoupons: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['ListUnclaimedDevelopmentFundCouponsResponse']
                }
            }
            500: components['responses']['500']
        }
    }
    getRewardAccountingEarliestAvailableRound: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetRewardAccountingEarliestAvailableRoundResponse']
                }
            }
            404: components['responses']['404']
        }
    }
    getRewardAccountingActivityTotals: {
        parameters: {
            query?: never
            header?: never
            path: {
                round_number: number
            }
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetRewardAccountingActivityTotalsResponse']
                }
            }
            404: components['responses']['404']
        }
    }
    getRewardAccountingRootHash: {
        parameters: {
            query?: never
            header?: never
            path: {
                round_number: number
            }
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetRewardAccountingRootHashResponse']
                }
            }
            404: components['responses']['404']
        }
    }
    getRewardAccountingBatch: {
        parameters: {
            query?: never
            header?: never
            path: {
                round_number: number
                batch_hash: string
            }
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['GetRewardAccountingBatchResponse']
                }
            }
            404: components['responses']['404']
        }
    }
    listBulkAcsSnapshotObjects: {
        parameters: {
            query: {
                at_or_before_record_time: string
            }
            header?: never
            path?: never
            cookie?: never
        }
        requestBody?: never
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['ListBulkAcsSnapshotObjectsResponse']
                }
            }
            404: components['responses']['404']
            501: components['responses']['501']
        }
    }
    listBulkUpdateHistoryObjects: {
        parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
        }
        requestBody: {
            content: {
                'application/json': components['schemas']['ListBulkUpdateHistoryObjectsRequest']
            }
        }
        responses: {
            /** @description ok */
            200: {
                headers: {
                    [name: string]: unknown
                }
                content: {
                    'application/json': components['schemas']['ListBulkUpdateHistoryObjectsResponse']
                }
            }
            400: components['responses']['404']
            404: components['responses']['404']
            501: components['responses']['501']
        }
    }
}
