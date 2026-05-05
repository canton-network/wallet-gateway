Wallet SDK Release Notes
========================

Below are the release notes for the Wallet SDK versions, detailing new features, improvements, and bug fixes in each version.

1.1.0
-----

**Released on April 28th, 2026**

* Added support for Canton 3.5.X & Splice 0.6.X
* Backwards compatibility with Canton 3.4X and Splice 0.5.X
* Allow offline SDK signing without ledger access
* Few improvments to the amulet fetch status to handle easier expectations like (expect cancelled or expired) 


1.0.0
-----

**Released on April 17th, 2026**

Wallet SDK v1 is the new long-term API shape for application development.
Rather than being an additive patch to v0, v1 introduces a cleaner and more explicit model focused on composability, multi-party flows,
and transport flexibility.

**Why move to v1**

* Stateless and safer by default: v1 removes global SDK/controller party state and requires explicit ``partyId`` at call time, which improves
    thread safety and makes concurrent multi-party operations much easier to reason about.
* Clearer transaction lifecycle: flows are modeled as explicit ``prepare -> sign -> execute`` steps, improving observability and reducing hidden behavior.
* Better API organization: v0 controllers are replaced by namespaces (``ledger``, ``party``, ``token``, ``amulet``, ``user``, ``asset``, ``events``)
    with clearer boundaries and easier discoverability.
* More flexible integration model: v1 supports static configuration and provider-based initialization, making it easier to integrate with browser,
    dApp, remote wallet, and alternative transport setups.
* Improved extension model: optional functionality can be enabled via ``extend()`` which keeps base initialization small and purpose-driven.

This release note intentionally avoids listing every single method-level change.
For full migration details and examples, use the migration guide:

* :doc:`Wallet SDK v1 Migration Guide <../wallet-sdk-v1-migration-guide/index>`
* :doc:`v1 Ledger Migration <../wallet-sdk-v1-migration-guide/ledger>`
* :doc:`v1 Token Migration <../wallet-sdk-v1-migration-guide/token>`
* :doc:`v1 Party Migration <../wallet-sdk-v1-migration-guide/party>`
* :doc:`v1 User Migration <../wallet-sdk-v1-migration-guide/user>`

0.21.1
------

**Released on February 20th, 2026**

* fix fetching active contracts in loop mode

*a bug was identified where fetching active contracts in loop mode (``continueUntilCompletion``) would not correctly handle pagination, resulting
in incomplete results being returned. This has now been fixed ensuring all contracts are reliably returned.*

0.21.0
------

**Released on February 6th, 2026**

* pagination support for listing UTXOs

*previously ``listHoldingsUtxo`` was limited to the ledger API upper bound of 200 items per request. For parties with a large number of holdings
this meant not all UTXOs would be returned. A new optional ``continueUntilCompletion`` parameter has been added that when set to true will
automatically page through all results, making it possible to reliably work with parties that hold more than 200 UTXOs.*

.. code-block:: javascript

    // fetch only the first page (default behaviour, up to 200 items)
    const utxos = await sdk.tokenStandard?.listHoldingsUtxo()

    // fetch ALL utxos regardless of how many there are
    const allUtxos = await sdk.tokenStandard?.listHoldingsUtxo(
        true,  // include locked
        undefined, // offset
        undefined, // limit
        true   // continueUntilCompletion
    )

* cost estimation now returned when using Canton 3.4

*when calling ``prepareSubmission`` against a Canton 3.4 participant the ``costEstimation`` field was previously dropped from the
response. The response type has been corrected and the cost estimation is now correctly surfaced.*

.. code-block:: javascript

    const prepared = await sdk.userLedger?.prepareSubmission(
        transferCommand,
        keyPairSender.publicKey
    )

    // costEstimation is now available when running against Canton 3.4
    logger.info(prepared?.costEstimation)

0.20.0
------

**Released on January 16th, 2026**

* subscribe to ledger update events via WebSocket

*it is now possible to open a persistent WebSocket connection and receive a real-time stream of ledger update events filtered by interface
or template id. The stream is exposed as an async generator so it integrates naturally with ``for await`` loops.*

.. code-block:: javascript

    const stream = sdk.userLedger?.subscribeToUpdates({
        partyId: sender!.partyId,
        interfaceIds: [HOLDING_INTERFACE_ID],
    })

    for await (const update of stream!) {
        logger.info(update, 'received ledger update')
        if (done) break
    }

* subscribe to command completions via WebSocket

*similarly to update subscriptions, you can now subscribe to command completion events so you can react to completed or failed commands
in real time instead of polling.*

.. code-block:: javascript

    const stream = sdk.userLedger?.subscribeToCompletions({
        parties: [sender!.partyId],
        beginOffset: 0,
    })

    for await (const completion of stream!) {
        logger.info(completion, 'received completion event')
        if (done) break
    }

* ``listWallets`` now only returns local parties

*previously ``listWallets`` could return parties that the user had been granted access to on remote validators, this was confusing and
incorrect behaviour. The method now only returns parties that are locally allocated on the connected participant.*

* optional input utxos for merge delegations

*the merge delegation setup previously required UTXOs to be provided explicitly. Input UTXOs are now optional and will fall back to
smart UTXO selection when not provided, consistent with other operations.*

0.19.1
------

**Released on December 29th, 2025**

Version bump to align package publication. No functional changes.

0.19.0
------

**Released on December 29th, 2025**

* **Important!: LedgerController constructor has changed to named parameters**

*the ``LedgerController`` constructor has been refactored from positional parameters to a named parameter object. This is a breaking change
if you construct ``LedgerController`` directly. The new signature also accepts an optional custom ``fetch`` implementation which is useful
for routing requests through an intermediary such as the wallet gateway.*

.. code-block:: javascript

    // previous constructor
    const ledger = new LedgerController(
        userId,
        new URL('http://127.0.0.1:5001'),
        token
    )

    // new constructor with named params
    const ledger = new LedgerController({
        userId,
        baseUrl: new URL('http://127.0.0.1:5001'),
        token,
        // optional: provide a custom fetch to route requests through a proxy
        fetch: myCustomFetch,
    })

* get created contract by update id

*a new method ``getCreatedContractByUpdateId`` has been added on the ledger controller. After submitting a transaction you can use the
returned ``updateId`` to look up the contract(s) that were created as part of that transaction. Optionally you can narrow the result by
providing template or interface ids.*

.. code-block:: javascript

    const result = await sdk.userLedger?.prepareSignExecuteAndWaitFor(
        transferCommand,
        keyPairSender.privateKey,
        v4(),
        disclosedContracts
    )

    const transferCid = (
        await sdk.userLedger!.getCreatedContractByUpdateId(
            result!.updateId,
            {
                interfaceIds: [TRANSFER_INSTRUCTION_INTERFACE_ID],
            }
        )
    ).contractId!

* unified ``createTransferInstruction`` choice helper

*the logic for Accept, Reject and Withdraw on a transfer instruction has been consolidated into a single ``createTransferInstruction``
method, reducing boilerplate when you want to exercise a choice without caring about which specific one.*

.. code-block:: javascript

    const [command, disclosedContracts] =
        await sdk.tokenStandard!.createTransferInstruction(
            transferCid,
            'Accept' // or 'Reject' or 'Withdraw'
        )

    await sdk.userLedger?.prepareSignExecuteAndWaitFor(
        command,
        keyPairSender.privateKey,
        v4(),
        disclosedContracts
    )

* browser support for the ledger client

*the ``@canton-network/core-ledger-client`` package can now be imported and used directly in a browser environment. Node.js-specific
modules have been removed from the main bundle so that browser-based dApps and portfolio UIs can leverage the ledger utilities without
additional bundler workarounds.*

* fixed decimal precision handling

*decimal arithmetic is now handled using ``decimal.js`` to prevent floating-point precision errors when working with large or fractional
CC amounts.*


0.18.0
------

**Released on November 26th, 2025**

* merge utxos command

*you can now easily perform utxos merging for you by simply calling the method `mergeHoldingUtxos`, this returns a series of commands that each needs to be executed
individually to merge the assets. It returns a list of utxos commands because: Firstly, it supports multi-assets (so it will merge both CC and non-CC tokens)
and secondly there is an upper limit of 100 inputs per transaction so to facilitate if more is present then it splices it for the client.*

.. code-block:: javascript

    const [mergeUtxoCommands, mergedDisclosedContracts] =
        await sdk.tokenStandard!.mergeHoldingUtxos()!

    for (let i = 0; i < mergeUtxoCommands.length; i++) {
        await sdk.userLedger?.prepareSignExecuteAndWaitFor(
            mergeUtxoCommands[i],
            keyPairSender.privateKey,
            v4(),
            mergedDisclosedContracts
        )
    }

* merge utxos delegation

*instead of manually monitor and act you can set up utxos merge delegation as described at* `merge-delegation <https://docs.dev.sync.global/app_dev/token_standard/index.html#setting-up-mergedelegations>`__
*using the new functionality like. An example of the complete setup can be found here:* `Wallet SDK example 18 <https://github.com/hyperledger-labs/splice-wallet-kernel/blob/main/docs/wallet-integration-guide/examples/scripts/18-merge-delegation-proposal.ts>`__

* create party with preapproval

*creating a party with preapproval is such a common task that we have decided to add is a combined function similar to lots of other cases.*

.. code-block:: javascript

    const receiver =
        await sdk.userLedger?.signAndAllocateExternalPartyWithPreapproval(
            keyPairReceiver.privateKey,
            validatorOperatorParty,
            instrumentAdminPartyId,
            'bob'
        )

* get traffic status

*in previous release we enabled the purchase of traffic using an external party, now we have included an option to fetch the balance so you can check if
you actually need to top up with an external party. However this does require providing a scanApiBaseUrl to the tokenStandardController.*

.. code-block:: javascript

    const trafficStatus =
        await sdk.tokenStandard!.getMemberTrafficStatus(participantId!)

* list holdings at offset

*listHoldingsUtxo have been extended with an optional offset parameter, normally it uses the ledgerEnd, but this allow you to define it yourself.
Do be warned that this is not a performant operation.*

0.17.0
------

**Released on November 14th, 2025**

* Wallet SDK has been updated to support 0.5.1 & Canton 3.4.7

*previous versions are mostly compatible, however you might run into a previous safeguard against earlier versions of canton 3.4.X where
external party onboarding was not supported.*

* wallet.localhost changed to localhost

*with newer versions of splice we can now remove the need for adding parameters for /etc/hosts and use localhost directly for the examples.*

* Improved utxo selection when no utxos was provided

*previously when perform a transfer and not providing utxos (as an empty array), then the sdk would automatically select all utxos to perform
the transfer. This had various problems like adding more than 100 utxos or utxos not having enough funds, this has also been improved with better
error messaging.*

* Better automation around token metadata

*the token standard controller have two new methods: `getInstrumentById` & `listInstruments`, these uses the transferRegistryUrl provided to fetch
relevant data from the original source making non-CC token integration more seamless. Likewise in certain cases the instrumentAdmin has been made optional
since we can use the above to fetch these.*

* test improvements of snippets

*test snippets used as part of the wallet integration guide was previously considered theoretical examples, the entire suite has been upgraded
and now each snippets have been tested against a running validator to ensure it is correct in its completeness. This means we also had to change
some of the values from using example naming the actual naming.*

* buy member traffic

*new method added that allows the purchase of traffic for a specific validator using an external party.*

.. code-block:: javascript


    const [buyTrafficCommand, buyTrafficDisclosedContracts] =
        await sdk.tokenStandard!.buyMemberTraffic(
            sender?.partyId!, // buying party
            200000, // cc amount to purchase traffic for
            participantId!, // receiving participants
            [], // input utxos, if none is provided it will use smart utxo selection
            0 // migrationID, beware that this will be 0 for localnet,devnet & testnet while mainnet will have 3
        )

    await sdk.userLedger?.prepareSignExecuteAndWaitFor(
        buyTrafficCommand,
        keyPairSender.privateKey,
        v4(),
        buyTrafficDisclosedContracts
    )

* made decodeTopologyTransaction static

*toDecodedTopologyTransaction introduced in previous version has been moved as a static method on the ledgerController, this is primarily
so it can be used in offline mode.*

* supported executeAs individual rights for reading

*executeAs also grants read access, however this was not including in the filtering (this has no impact with executeAsAnyParty).*

0.16.0
------

**Released on November 4th, 2025**

* caching for amulet rules and open mining round

*Amulet rules are mostly static and open mining round persists for 10 min, so we can cache this response*

* observing participants for multi-hosting

.. code-block:: javascript

    /**
         * Generate topology transactions for an external party that can be signed and submitted in order to create a new external party.
         *
         * @param publicKey
         * @param partyHint (optional) hint to use for the partyId, if not provided the publicKey will be used.
         * @param confirmingThreshold (optional) parameter for multi-hosted parties (default is 1).
         * @param confirmingParticipantUids (optional) list of participant UIDs that will host the party with confirming permissions.
         * @param observingParticipantUids (optional) list of participant UIDs that will have Observation (read-only) permissions.
         * @returns
         */
        async generateExternalParty(
            publicKey: PublicKey,
            partyHint?: string,
            confirmingThreshold?: number,
            confirmingParticipantUids?: string[],
            //new field for observing participants
            observingParticipantUids?: string[]
        ): Promise<GenerateTransactionResponse> {

* decode topology transactions

.. code-block:: javascript

    generateExternalPartyResponse!.topologyTransactions!.map((topologyTx) => {

        const decodedTx = sdk.userLedger!.toDecodedTopologyTransaction(topologyTx)

        logger.info(decodedTx)
    })

0.15.0
------

**Released on October 29th, 2025**


.. important::

    Due to CommonJS compatibility, the module type needs to be explicitly declared in certain cases. If you see an error like
    `ERROR: Top-level await is currently not supported with the "cjs" output format` and are intended on using ESM then
    you should set `"type": "module"` in your package.json.

* Handling inflight transmissions

*Introduced special handling cases for `REQUEST_ALREADY_IN_FLIGHT` and `SUBMISSION_ALREADY_IN_FLIGHT`, now in those cases
the SDK will retrieve the inflight submission and track that for ..AndWait functions.*

* support cjs module

*The SDK now has a cjs release for consumption.*

* better handling of readAs and actAs rights

*Upgraded the handling in regards to readAs and actAs to be more fleshed out, especially also for the listWallets function.*

* ACS client side caching

*Querying the ACS is an expensive ledger API operation, as an alternative the ACS is fetched into memory once and subscribe to new
events instead. This should significantly reduce the load on the ledger especially in heavy read operations.*

* Caching of Access Tokens

*Previously a new token was retrieved from the AuthController every time a request was made, this is not a huge problem for `unsafe` tokens,
however still unnecessary. Tokens are now kept in memory and reused and a new token is only requested upon expiry.*

*For this change to take effect you need to alter your token usage to use `AccessTokenProvider` instead, all examples are updated accordingly.*


0.14.0
------

**Released on October 23th, 2025**

* Fixed broken dependency problem introduced in 0.13.X

0.13.1
------

**Released on October 22th, 2025**

.. important::

   Release 0.13.0 & 0.13.1 have broken dependencies, use 0.14.0 instead.

* Greatly reduced the size of the SDK from ~ 80 MB to ~ 35 MB
* introduced optional `limit` field for `listHoldingsUtxo`


0.13.0
------

**Released on October 22th, 2025**

.. important::

   Release 0.13.0 & 0.13.1 have broken dependencies, use 0.14.0 instead.


* **Important!: await completion has changed signature**


.. code-block:: javascript

        // old version
        async waitForCompletion(
            ledgerEnd: number | Types['GetLedgerEndResponse'],
            timeoutMs: number,
            commandId?: string,
            submissionId?: string
        ): Promise<Types['Completion']['value']> {

        // new version
        async waitForCompletion(
            ledgerEnd: number | Types['GetLedgerEndResponse'],
            timeoutMs: number,
            commandIdOrSubmissionId: string
        ): Promise<Types['Completion']['value']> {

*this change is to make it simpler, the method would regardless throw an error if commandId and SubmissionId was undefined*

* retry logic & stress testing

*we have substantially tested and verified the SDK working on moderate and heavy load mimicking MainNet, this highlighted some
retryable errors that could be handled.*

* multi hosted party fix and synchronized handling

*multi hosted parties have had a change under the hood, previously it would return the party asynchronously. This has been resolved
by calling the allocation on all the available ledger thereby ensuring the party is ready for use once it is returned by the method.*

* proxy delegation for feature app marker for deposits

*Proxy delegation support have been added for deposits allowing attaching a featured app marker flag to an incoming deposit, this requires
running the dar `splice-util-featured-app-proxies-1.1.0.dar` on the validator.*

.. code-block:: javascript

    const delegateCommand = await sdk.userLedger?.createDelegateProxyCommand(
        exchangeParty!,
        treasuryParty!.partyId
    )

    const delegationContractResult =
        await sdk.userLedger?.submitCommand(delegateCommand)

    const [acceptCommand, disclosedContracts4] =
        await sdk.tokenStandard?.exerciseTransferInstructionChoiceWithDelegate(
            transferCid, //incoming transfer
            'Accept',
            proxyCid!,
            featuredAppRights?.contract_id!,
            [
                {
                    beneficiary: exchangeParty!,
                    weight: 1.0,
                },
            ],
            featuredAppRights!
        )!

    //prepare, sign and execute the above command

* manual preapproval renewal and cancellation

*you an now use the SDK to manually renew a preapproval or cancel it*

.. code-block:: javascript

    //create renew command to be prepared, signed and executed
    const [renewCmd, disclosedContractsRenew] =
        await sdk.tokenStandard!.createRenewTransferPreapproval(
            preapproval.contractId,
            preapproval.templateId,
            validatorOperatorParty!
        )

    //create cancel command to be prepared, signed and executed
    const [cancelCmd, disclosedContractsCancel] =
        await sdk.tokenStandard!.createCancelTransferPreapproval(
            preapprovalAfterRenewal.contractId,
            preapprovalAfterRenewal.templateId,
            receiver!.partyId
        )

0.12.0
------

**Released on October 15th, 2025**

* **Important!: The custom meta-data on create transfer have changed format**

.. code-block:: javascript

    //previous format
    await sdk.tokenStandard!.createTransfer(
            sender!.partyId,
            receiver!.partyId,
            '100',
            {
                instrumentId: 'Amulet',
                instrumentAdmin: instrumentAdminPartyId,
            },
            [],
            'memo-ref',
            new Date(Date.now() + 24 * 60 * 60 * 1000),
            {
                key1: "value1",
                key2: "value2"
            }
        )


    //new format
    await sdk.tokenStandard!.createTransfer(
            sender!.partyId,
            receiver!.partyId,
            '100',
            {
                instrumentId: 'Amulet',
                instrumentAdmin: instrumentAdminPartyId,
            },
            [],
            'memo-ref',
            new Date(Date.now() + 24 * 60 * 60 * 1000),
                {
                values: {
                    key1: "value1",
                    key2: "value2"
                }
            }
        )

* Feature app marker delegation proxy

*The Wallet SDK is heavy focused on external party submission flows, however there are certain administrative tasks
that requires using the validator operator party (which is internally hosted). This is especially useful for setting up
delegation proxy contract needed for featured app markers.*

.. code-block:: javascript

    const delegateCommand = await sdk.userLedger?.createDelegateProxyCommand(
        exchangeParty,
        treasuryParty
    )

    const delegationContractResult =  await sdk.userLedger?.submitCommand(delegateCommand)

* Possibility to create commands offline

*certain commands like transfer required to be performed in an online context, this was needed to fetch relevant data
like transferInstruction choice context. This method (and allocation) have now been extended with optional parameters in
case that it is preferred to be pre-fetched.*

.. code-block:: javascript

    const choiceContext = await sdk.tokenStandard?.getCreateTransferContext(
        senderParty,
        receiverParty,
        amount,
        { instrumentId, instrumentAdmin},
        //normal optional parameters for a transfer here like memo and utxos
        )

     //OFFLINE

     const transferCommand = await sdk.tokenStandard?.createTransfer(
        senderParty,
        receiverParty,
        amount,
        { instrumentId, instrumentAdmin},
        prefetchedRegistryChoiceContext: choiceContext
     )



* Fetch contract by id

.. code-block:: javascript

    const holding = await sdk.tokenStandard?.listHoldingsUtxo(contractId)

* TLS enablement for grpc admin (topologyController)

*TLS configuration can now be provided for the topologyController allowing a safe and secure connection.*

.. code-block:: javascript

    const tlsTopologyController = (
        userId: string,
        userAdminToken: string
    ): TopologyController => {
        return new TopologyController(
            '127.0.0.1:5012',
            new URL('http://127.0.0.1:5003'),
            userId,
            userAdminToken,
            'wallet::1220e7b23ea52eb5c672fb0b1cdbc916922ffed3dd7676c223a605664315e2d43edd',
            {
                useTls: true,
                tls: {
                    rootCert: path.join(here, PATH_TO_TLS_DIR, 'ca.crt'),
                    mutual: false,
                },
            }
        )
    }

* Stress tested party creation

*Party creation is under heavy load on mainnet and would consistently run into: `The server was not able to produce a timely response to your request`.
Safe guard has been added against this, when the error occurs we continuously look for the party to be available. If a timeout is
required then it will have to be handled outside of the method. It is worth nothing that the party creation has no timeout on ledger.*

you can disable this by setting `expectHeavyLoad` to false

.. code-block:: javascript

     /** Submits a prepared and signed external party topology to the ledger.
     * This will also authorize the new party to the participant and grant the user rights to the party.
     * @param signedHash The signed combined hash of the prepared transactions.
     * @param preparedParty The prepared party object from prepareExternalPartyTopology.
     * @param grantUserRights Defines if the transaction should also grant user right to current user (default is true)
     * @param expectHeavyLoad If true, the method will handle potential timeouts from the ledger api (default is true).
     * @returns An AllocatedParty object containing the partyId of the new party.
     */

    async allocateExternalParty(
        signedHash: string,
        preparedParty: GenerateTransactionResponse,
        grantUserRights: boolean = true,
        expectHeavyLoad: boolean = true
    )


0.11.0
------

**Released on October 10th, 2025**

* Added support to tap internal parties

*previously you could only tap external parties using signing flow, now it can be done for internal parties. this is useful
for tapping the validator operator party right after startup in case of missing funds.*

.. code-block:: javascript

    await sdk.tokenStandard?.createAndSubmitTapInternal(
        validatorOperatorParty!,
        '20000000',
        {
            instrumentId: 'Amulet',
            instrumentAdmin: instrumentAdminPartyId,
        }
    )

* Dar-file manage

*the functionality have been added for the adminLedgerController to upload dars, this is useful for testing custom dar flows*

.. code-block:: javascript

    // check if a specific dar files exist
    const isDarUploaded = await sdk.userLedger?.isPackageUploaded(
        MY_DAR_PACKAGE
    )

    //upload a dar
    await sdk.adminLedger?.uploadDar(MY_DAR_BYTES)

* Full support for token standard allocations

.. code-block:: javascript

    // check pending allocation requests
    const pendingAllocationRequests = await sdk.tokenStandard?.fetchPendingAllocationRequestView()

    // create allocation command
    const specAlice = {
        settlement: allocationRequestViewAlice.settlement,
        transferLegId: legIdAlice,
        transferLeg: legAlice,
    }

    const [allocateCmdAlice, allocateDisclosedAlice] =
        await sdk.tokenStandard!.createAllocationInstruction(
            specAlice,
            legAlice.instrumentId.admin
        )

    // venue can check the allocation
    const allocationsVenue = await sdk.tokenStandard!.fetchPendingAllocationView()

* Party onboarding can now be done on the ledgerController instead of the TopologyController

*this removes the need for grpc admin access*

you can replace as such:

=================================================   ==============================================
Previous Method                                     new Method
=================================================   ==============================================
`sdk.topology?.prepareExternalPartyTopology`        `sdk.userLedger?.generateExternalParty`
`sdk.topology?.submitExternalPartyTopology`         `sdk.userLedger?.allocateExternalParty`
`sdk.topology?.prepareSignAndSubmitExternalParty`   `sdk.userLedger?.signAndAllocateExternalParty`
=================================================   ==============================================

the multi-hosted configuration is the same, except that **the ledger you call** should not be included in the array

.. code-block:: javascript

    //previous example of multi hosting
    const multiHostedParticipantEndpointConfig = [
        {
            adminApiUrl: '127.0.0.1:2902', //this is the ledger we actual call to allocate
            baseUrl: new URL('http://127.0.0.1:2975'),
            accessToken: adminToken.accessToken,
        },
        {
            adminApiUrl: '127.0.0.1:3902',
            baseUrl: new URL('http://127.0.0.1:3975'),
            accessToken: adminToken.accessToken,
        },
    ]

    //new example of multi hosting
    const multiHostedParticipantEndpointConfig = [
        {
            //admin url is not needed anymore
            url: new URL('http://127.0.0.1:3975'),
            accessToken: adminToken.accessToken,
        },
    ]

for backwards compatibility the previous endpoints are still there and available.

* User creation and rights management

*you can now create new users and manage rights through the Wallet SDK. This can be useful for setting up a master user*

.. code-block:: javascript

    //create new user for alice
    const aliceUser = await sdk.adminLedger!.createUser(
        'alice-user',
        aliceInternal
    )

    // grant alice CanReadAsAnyParty and CanExecuteAsAnyParty rights
    await sdk.adminLedger!.grantMasterUserRights(aliceUser.id, true, true)

* ListWallets now returns a list of partyIds instead of partyDetails
* ListWallets now correctly returns the parties that the user has access to (including CanReadAsAnyParty)
* Extended the max timeout when onboarding a party from 20s to 1 minute
* Party onboarding now queries the specific party instead of all parties (performance improvement)
* Party onboarding now has idempotent behavior
* Default values changed for Wallet SDK from `localLedgerDefault` to `localNetledgerDefault` on all controllers

.. code-block:: javascript

    //previous instantiation (still preferred)
    const sdk = new WalletSDKImpl().configure({
        logger: logger,
        authFactory: localNetAuthDefault,
        ledgerFactory: localNetLedgerDefault,
        topologyFactory: localNetTopologyDefault,
        tokenStandardFactory: localNetTokenStandardDefault,
    })

    //new version (does the same)
    const sdk = new WalletSDKImpl().configure({
        logger: logger
    })

0.10.0
------

**Released on October 2nd, 2025**

* Self-issue feature app rights

*you can now grant yourself feature app rights (similar to the wallet UI) for both internal and external parties*

.. code-block:: javascript

    // For external parties
    const [command,disclosedContracts] = sdk.tokenStandard!.selfGrantFeatureAppRights()

    await sdk.userLedger?.prepareSignExecuteAndWaitFor(
        command,
        keyPair.privateKey,
        v4(),
        disclosedContracts
    )

    // For internal parties
    await sdk.tokenStandard!.grantFeatureAppRightsForInternalParty()

* localNet variation for AppProvider & AppUser

*you can now use both the appProvider and AppUser easily for show operations between two validators*

.. code-block:: javascript

        const providerSDK = new WalletSDKImpl().configure({
            logger,
            authFactory: localNetAuthDefault,
            ledgerFactory: localNetLedgerAppProvider, //new variations here
            topologyFactory: localNetTopologyAppProvider, //new variations here
            tokenStandardFactory: localNetTokenStandardAppProvider, //new variations here
            validatorFactory: localValidatorDefault,
        })

        const userSDK = new WalletSDKImpl().configure({
            logger,
            authFactory: localNetAuthDefault,
            ledgerFactory: localNetLedgerAppUser, //new variations here
            topologyFactory: localNetTopologyAppUser, //new variations here
            tokenStandardFactory: localNetTokenStandardAppUser, //new variations here
            validatorFactory: localValidatorDefault,
        })

*LocalNet..Default still exists, they as previously defaults to the appUser validator*

* topology transaction recalculate hash

*you can now offline validate a topology transaction by recomputing the hash*

.. code-block:: javascript

    const recomputeHash = await TopologyController.computeTopologyTxHash(
        prepared!.partyTransactions
    )

    if (recomputeHash !== prepared!.combinedHash) {
        throw new Error(
            'Recomputed hash does not match prepared combined hash'
        )
    }

* new awaiting variation with `prepareSignExecuteAndWaitFor` & `executeSubmissionAndWaitFor`

*release 0.7.0 introduced the `waitForCompletion`, we have now backed that into the executions*

.. code-block:: javascript

    // PREVIOUS CODE EXAMPLE
    //it is recommended to fetch ledger offset before preparing your command
    const offsetLatest = (await sdk.userLedger?.ledgerEnd())?.offset ?? 0

    const transferCommandId =
        // prepareSignAndExecuteTransaction & prepareSign now returns the commandId
        await sdk.userLedger?.prepareSignAndExecuteTransaction(
            [{ ExerciseCommand: transferCommand }],
            keyPairSender.privateKey,
            v4(),
            disclosedContracts2
        )

    //new command that scans the ledger to ensure the command have completed
    const completion = await sdk.userLedger?.waitForCompletion(
        offsetLatest, //where to start from
        5000, //optional timeout in ms
        transferCommandId! //the command to look for
    )

    // NEW VARIATION
    const completion =
            await sdk.userLedger?.prepareSignExecuteAndWaitFor(
                transferCommand,
                keyPairSender.privateKey,
                v4(),
                disclosedContracts,
                10000 // 10 second timeout, if no value is provided here a default of 15 seconds is used
            )

    // VARIATION FOR `ExecuteSubmission`
    const completion =
            await onlineSDK.userLedger?.executeSubmissionAndWaitFor(
                transferCommand,
                signedHash,
                keyPairSender.publicKey,
                v4()
            )



* `executeSubmission` now returns the submissionId similarly to `prepareSignAndExecuteTransaction`
* fixed thrown exception for missing seed when using `TopologyController.createTransactionHash`
* `prepareSubmission` now has same command input signature as `prepareSignAndExecuteTransaction`

0.9.0
-----

**Released on September 26th, 2025**

* Supporting both canton 3.3 and 3.4 at the same timeout

*since canton 3.4 will soon come to splice being able to support both versions is imperative before*

* `localNetStaticConfig` added

*since the wallet api and registry are static for localnet, a new config has been added to make early development easier*

.. code-block:: javascript

    import {
        WalletSDKImpl,
        localNetAuthDefault,
        localNetLedgerDefault,
        localNetTopologyDefault,
        localNetTokenStandardDefault,
        localNetStaticConfig,
    } from '@canton-network/wallet-sdk'

    const sdk = new WalletSDKImpl().configure({
        logger,
        authFactory: localNetAuthDefault,
        ledgerFactory: localNetLedgerDefault,
        topologyFactory: localNetTopologyDefault,
        tokenStandardFactory: localNetTokenStandardDefault,
    })

    await sdk.connectTopology(localNetStaticConfig.LOCALNET_APP_VALIDATOR_URL)

    sdk.tokenStandard?.setTransferFactoryRegistryUrl(
        localNetStaticConfig.LOCALNET_REGISTRY_API_URL
    )

0.8.0
-----

**Release on September 24th, 2025**

* **Important!: The flow has been simplified for prepare and execute of commands, however this means code needs to be converted**

.. code-block:: javascript

    // previous prepare and submit flow
    const [tapCommand, disclosedContracts] = await sdk.tokenStandard!.createTap(
        sender!.partyId,
        '2000000',
        {
            instrumentId: 'Amulet',
            instrumentAdmin: instrumentAdminPartyId,
        }
    )

    await sdk.userLedger?.prepareSignAndExecuteTransaction(
        [{ ExerciseCommand: tapCommand }],
        keyPairSender.privateKey,
        v4(),
        disclosedContracts
    )

in the new flow it is no longer needed to perform the array wrapping `[{ ExerciseCommand: tapCommand }]`
and you can instead pass the `tapCommand` directly


.. code-block:: javascript

    // new prepare and submit flow
    const [tapCommand, disclosedContracts] = await sdk.tokenStandard!.createTap(
        sender!.partyId,
        '2000000',
        {
            instrumentId: 'Amulet',
            instrumentAdmin: instrumentAdminPartyId,
        }
    )

    await sdk.userLedger?.prepareSignAndExecuteTransaction(
        tapCommand,
        keyPairSender.privateKey,
        v4(),
        disclosedContracts
    )

this goes for all transaction!

* Support Withdrawal flow for 2-step transfer

it is now possible for sender to withdraw a 2-step transfer that have previously been send

.. code-block:: javascript

    // Alice withdraws the transfer
    const [withdrawTransferCommand, disclosedContracts] =
        await sdk.tokenStandard!.exerciseTransferInstructionChoice(
            transferCid!,
            'Withdraw'
        )

note: this does not work if the receiver have already perform `Accept` or `Reject`

* Allow validating if receiver have set up transfer pre-approval before performing a transaction

.. code-block:: javascript

    //check if bob have set up transfer pre approval before sending
    const transferPreApprovalStatus =
            await sdk.tokenStandard?.getTransferPreApprovalByParty(
                receiver!.partyId,
                'Amulet'
            )
        logger.info(transferPreApprovalStatus, '[BOB] transfer preapproval status')

* Tested and verified against Splice 0.4.17
* Fix endless loop bug when onboarding a party


0.7.0
-----

**Release on September 18th, 2025**

* **Important!: scan api is not longer used for methods like `connectTopology` use scan proxy instead**
* Added support for multi-hosting a party upon creation against multiple validators

.. code-block:: javascript

    // setup config against multiple nodes to acquire signature
    const multiHostedParticipantEndpointConfig = [
        {
            adminApiUrl: '127.0.0.1:2902',
            baseUrl: new URL('http://127.0.0.1:2975'),
            accessToken: adminToken.accessToken,
        },
        {
            adminApiUrl: '127.0.0.1:3902',
            baseUrl: new URL('http://127.0.0.1:3975'),
            accessToken: adminToken.accessToken,
        },
    ]

    const participantIdPromises = multiHostedParticipantEndpointConfig.map(
        async (endpoint) => {
            return await sdk.topology?.getParticipantId(endpoint)
        }
    )
    const participantIds = await Promise.all(participantIdPromises)

    const participantPermissionMap = new Map<string, Enums_ParticipantPermission>()

    // decide on Permission for each participant
    participantIds.map((pId) =>
        participantPermissionMap.set(pId!, Enums_ParticipantPermission.CONFIRMATION)
    )

    // setup multi-hosting for a party against
    await sdk.topology?.prepareSignAndSubmitMultiHostExternalParty(
        multiHostedParticipantEndpointConfig,
        multiHostedParty.privateKey,
        synchronizerId,
        participantPermissionMap,
        'bob'
    )

* Verify signed transaction hash

we have also extended the `executeSubmission` and `prepareSignAndExecuteTransaction` to validate the hash before transmitting to the ledger

.. code-block:: javascript

    const hash = 'my-transaction-hash'
    const publicKey = 'my-public-key'
    const signature = 'my-signed-hash-with-private-key'
    const isValid = sdk.userLedger?.verifyTxHash(hash, publicKey, signature)

* wait for command completion

.. code-block:: javascript

    //it is recommended to fetch ledger offset before preparing your command
    const offsetLatest = (await sdk.userLedger?.ledgerEnd())?.offset ?? 0

    const transferCommandId =
        // prepareSignAndExecuteTransaction & prepareSign now returns the commandId
        await sdk.userLedger?.prepareSignAndExecuteTransaction(
            [{ ExerciseCommand: transferCommand }],
            keyPairSender.privateKey,
            v4(),
            disclosedContracts2
        )

    //new command that scans the ledger to ensure the command have completed
    const completion = await sdk.userLedger?.waitForCompletion(
        offsetLatest, //where to start from
        5000, //optional timeout in ms
        transferCommandId! //the command to look for
    )

* Added new endpoint to quickly fetch all pending 2-step incoming transfer to easily accept or reject

.. code-block:: javascript

    const pendingInstructions = await sdk.tokenStandard?.fetchPendingTransferInstructionView()

    const [acceptTransferCommand, disclosedContracts3] =
        await sdk.tokenStandard!.exerciseTransferInstructionChoice(
            transferCid,
            'Accept'
        )

* optional expiry date for create transfer

.. code-block:: javascript

    const [transferCommand, disclosedContracts2] =
        await sdk.tokenStandard!.createTransfer(
            sender!.partyId,
            receiver!.partyId,
            '100',
            {
                instrumentId: 'Amulet',
                instrumentAdmin: instrumentAdminPartyId,
            },
            utxos?.map((t) => t.contractId),
            'memo-ref',
            new Date(Date.now()+60*1000) // custom expiry of 1 hour
            // default is 24 hours
        )

* fetch transaction by update id

.. code-block:: javascript

    // convenient new endpoint to get transaction based on update id
    // this will come out in same format as listHoldingTransactions
    sdk.tokenStandard?.getTransactionById('my-update-id')

* The access token generated by the authController is now correctly passed to the scan proxy and registry



0.6.1
-----

**Released on September 16th, 2025**

Fixed a minor edge case where a future mining round would be chosen if there was a client clock skew.

0.6.0
-----

**Released on September 16th, 2025**

* ledgerFactory, TopologyFactory & ValidatorFactory changed to use URL instead of strings (where applicable)

.. code-block:: javascript

    const myLedgerFactory = (userId: string, token: string) => {
        return new LedgerController(
            userId,
            new URL('http://my-json-ledger-api'), //HERE
            token
        )
    }

    const myTopologyFactory = (
        userId: string,
        userAdminToken: string,
        synchronizerId: string
    ) => {
        return new TopologyController(
            'my-grpc-admin-api',
            new URL('http://my-json-ledger-api'), //HERE
            userId,
            userAdminToken,
            synchronizerId
        )
    }

    const myValidatorFactory = (userId: string, token: string) => {
        return new ValidatorController(
            userId,
            new URL('http://my-validator-app-api'), //HERE
            token
        )
    }

* connectTopology now uses scanProxy instead of scan for proper decentralized setup
* stronger typing now required strings of specific formats for parties across all controllers
* fixed a bug where the combinedHash returned from topologyController.prepareExternalPartyTopology was in hex encoding instead of base64

.. code-block:: javascript

    const preparedParty = await sdk.topology?.prepareExternalPartyTopology(
        keyPair.publicKey
    )

    logger.info('Prepared external topology')

    if (preparedParty) {
        logger.info('Signing the hash')
        const signedHash = signTransactionHash(
        //previously this would have to be converted from hex to base64
            preparedParty?.combinedHash,
            keyPair.privateKey
        )

        const allocatedParty = await sdk.topology?.submitExternalPartyTopology(
            signedHash,
            preparedParty
        )

* fixed a bug that caused the expectedDso field to be required when performing TransferPreApprovalProposal (this is only required after Splice 0.1.11)
* simplified setParty & setSynchronizer, now it can all be done with one call on sdk.setPartyId()

.. code-block:: javascript

    //the connects are still needed and should be run before sdk.setPartyId
    await sdk.connect()
    await sdk.connectAdmin()
    await sdk.connectTopology(LOCALNET_SCAN_API_URL)

    //Previously all these was required to get everything working
    sdk.userLedger!.setPartyId(partyId)
    sdk.userLedger!.setSynchronizerId(synchronizerId)
    sdk.tokenStandard?.setPartyId(partyId)
    sdk.tokenStandard?.setSynchronizerId(synchronizerId)
    sdk.validator?.setPartyId(partyId)
    sdk.validator?.setSynchronizerId(synchronizerId)

    //New version
    await sdk.setPartyId(partyId,synchronizerId)
    //synchronizerId is optional, it will automatically select the first synchronizerId,
    //that the party is connected to if, none is defined

0.5.0
-----

**Released on September 11th, 2025**

* Memo field added to create transfer

.. code-block:: javascript

    const [transferCommand, disclosedContracts2] =
        await sdk.tokenStandard!.createTransfer(
            sender!.partyId,
            receiver!.partyId,
            '100',
            {
                instrumentId: 'Amulet',
                instrumentAdmin: instrumentAdminPartyId,
            },
            'my-new-favorite-memo-field'
        )

* pre-approval creation now supported through ledgerController instead of validatorController


previously

.. code-block:: javascript

    await sdk.validator?.externalPartyPreApprovalSetup(privateKey)

now instead using ledger api:

.. code-block:: javascript

    const transferPreApprovalProposal =
        sdk.userLedger?.createTransferPreapprovalCommand(
            validatorOperatorParty, //this needs to be sourced from the validator
            receiver?.partyId,
            instrumentAdminPartyId
        )

    await sdk.userLedger?.prepareSignAndExecuteTransaction(
        [transferPreApprovalProposal],
        keyPairReceiver.privateKey,
        v4()
    )


0.4.0
-----

**Released on September 10th, 2025**

* Range filter for `listHoldingTransactions(afterOffset?: string,beforeOffset?: string)`
* Transfer pre-approval support:

.. code-block:: javascript

    const sdk = new WalletSDKImpl().configure({
        logger,
        authFactory: localNetAuthDefault,
        ledgerFactory: localNetLedgerDefault,
        topologyFactory: localNetTopologyDefault,
        tokenStandardFactory: localNetTokenStandardDefault,
        validatorFactory: localValidatorDefault, //Extend SDK with new validator factory
    })

    //set the party
    sdk.validator?.setPartyId(receiver?.partyId!)

    //provide private key to sign the pre-approval
    await sdk.validator?.externalPartyPreApprovalSetup(keyPairReceiver.privateKey)

* Support added for 2-step transfers (propose / accept)

.. code-block:: javascript

    const [acceptTransferCommand, disclosedContracts3] =
        await sdk.tokenStandard!.exerciseTransferInstructionChoice(
            transferCid, //cid of the transfer instruction
            'Accept' // or 'Reject'
        )

* ``listHoldingsUtxo`` has been extended to only ``nonLocked`` UTXOs

.. code-block:: javascript

    //new optional parameter, default is true (to be backwards compatible
    const usableUtxos = await sdk.tokenStandard?.listHoldingUtxos(false)

    //this include locked UTXOs
    const allUtxos = await sdk.tokenStandard?.listHoldingUtxos()

* Include some small bug fixes. The most noteable are:
    * ``Contract not found`` error when listing holdings (https://github.com/hyperledger-labs/splice-wallet-kernel/issues/357)
    * Requirements to have extra import (like @protobuf-ts/runtime-rpc) resolved



