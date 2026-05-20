.. _integration-extensions:

Integration Extensions
----------------------

This page describes the following additional features that you can consider adding to your integration,
beyond the MVP described in the :ref:`exchange-integration-overview` section:

Optimizing App Rewards
~~~~~~~~~~~~~~~~~~~~~~

The MVP for all CN tokens described in the :ref:`exchange-integration-overview` section
comes with the limitation that application rewards are only earned on deposits of CC,
but not on deposits of other CN tokens.
We recommend to lift this limitation and
to improve the profitability of the integration using Canton Coin's
`featured application activity marker mechanism <https://docs.dev.sync.global/background/tokenomics/feat_app_act_marker_tokenomics.html>`__.
It allows tagging transactions with a featured application activity marker
and earn application rewards for them.

The idea is to tag both the initatiation of withdrawals and the acceptance of
deposit offers with a featured application activity marker to attribute the
transaction to the ``exchangeParty``.
Tagging these transactions is compliant with the
`guidance given in the Splice documentation <https://docs.dev.sync.global/background/tokenomics/feat_app_act_marker_tokenomics.html>`__,
as they correspond to transfers and create value for the network.

In order for the ``treasuryParty`` to create featured application activity markers in the name of the ``exchangeParty``,
a delegation contract is required.
A suitable
`delegation template <https://github.com/hyperledger-labs/splice/blob/5870d2d8b0c6b9dfcf8afe11ab0685e2ee58342f/daml/splice-util-featured-app-proxies/daml/Splice/Util/FeaturedApp/DelegateProxy.daml#L35-L55>`__
called ``DelegateProxy`` is part of the
`splice-util-featured-app-proxies <https://github.com/hyperledger-labs/splice/tree/main/daml/splice-util-featured-app-proxies>`__ package.
We recommend to use this package and template as explained in the sections below.


.. _withdrawal-app-rewards:

Earning App Rewards for Withdrawals
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

The following steps describe how to adjust the Withdrawal Automation
to tag withdrawal transfers with a featured application activity marker.

1. Download the most recent version of the ``splice-util-featured-app-proxies.dar``
   file from the `Splice repository's checked-in .dars <https://github.com/hyperledger-labs/splice/tree/main/daml/dars>`__.

   Note that at the time of writing, there was no official release of the Splice .dars
   that included this package, which is why we recommend downloading the .dar
   directly from the repository.

   .. TODO(#444): switch the instructions to the official release once available

2. Upload that ``splice-util-featured-app-proxies.dar`` file to your Exchange Validator Node.

3. Change the :ref:`Ledger API user setup <setup-ledger-api-users>`
   such that the

   a. the user used by Withdrawal Automation also has the ``readAs(exchangeParty)`` right

   b. the user that performs the :ref:`exchange parties setup <exchange-parties-setup>`
      also has the ``canActAs(exchangeParty)`` right.

4. Add a step to the :ref:`treasury party setup <treasury-party-setup>` to also create a ``DelegateProxy`` contract with
   ``provider = exchangeParty`` and ``delegate = treasuryParty``.

   Use the ``/v2/commands/submit-and-wait``
   `endpoint <https://github.com/digital-asset/canton/blob/97b837d7b7e9a499963cba1d39a017648c46e8d7/community/ledger/ledger-json-api/src/test/resources/json-api-docs/openapi.yaml#L6>`__
   submit the ``create`` command for the ``DelegateProxy`` template.

5. Change the initialization code of the Withdrawal Automation to:

   a. query the active contracts of the ``exchangeParty`` for the
      ``DelegateProxy`` contract created in the previous step and
      store its contract ID in ``proxyCid``.

   b. query the active contracts of the ``exchangeParty`` for the
      ``FeaturedAppRight`` contract and store its contract ID in ``featuredAppRightCid``
      and its `create-event-blob <https://docs.digitalasset.com/build/3.3/sdlc-howtos/applications/develop/explicit-contract-disclosure.html>`__
      in ``featuredAppRightEventBlob``.

6. Change the Withdrawal Automation code that initiates a withdrawal transfer to
   call the ``DelegateProxy_TransferFactory_Transfer`` choice
   instead of the ``TransferFactory_Transfer`` choice, as shown in
   `this test case <https://github.com/hyperledger-labs/splice/blob/5870d2d8b0c6b9dfcf8afe11ab0685e2ee58342f/daml/splice-util-featured-app-proxies-test/daml/Splice/Scripts/TestFeaturedDepositsAndWithdrawals.daml#L204-L215>`__.

   The call to the choice takes the ``proxyCid`` and the ``featuredAppRightCid`` as parameters
   alongside the actual transfer parameters.
   Pass in the ``featuredAppRightEventBlob`` as an
   `additional disclosed contract <https://docs.digitalasset.com/build/3.3/sdlc-howtos/applications/develop/explicit-contract-disclosure.html>`__.


The Tx History Ingestion as :ref:`described here <one-step-transfer-parsing>` does not need changing,
as it descends into the ``TransferFactory_Transfer`` choice that is called by the ``DelegateProxy_TransferFactory_Transfer`` choice.


.. _deposit-app-rewards:

Earning App Rewards for Deposits
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Steps 1 to 5 are analogous to the steps described in the :ref:`withdrawal-app-rewards` section above.

In Step 6, change the Deposit Automation code that accepts a deposit offer to
call the ``DelegateProxy_TransferInstruction_Accept`` choice
instead of the ``TransferInstruction_Accept`` choice, as shown in
`this test case <https://github.com/hyperledger-labs/splice/blob/5870d2d8b0c6b9dfcf8afe11ab0685e2ee58342f/daml/splice-util-featured-app-proxies-test/daml/Splice/Scripts/TestFeaturedDepositsAndWithdrawals.daml#L147-L161>`__.


.. _share-rewards-with-customers:

Sharing App Rewards with your Customers
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

The featured app marker API allows splitting the activity record across multiple beneficiaries.
Each of them then gets credited for a fraction of the activity.
You can use this feature to share some of the application rewards with your customers
to incentivize them to use your exchange.

To do so, you need to adjust the code changes described in the sections above
to pass in multiple beneficiaries to the respective choices,
as called out in `this test case <https://github.com/hyperledger-labs/splice/blob/5870d2d8b0c6b9dfcf8afe11ab0685e2ee58342f/daml/splice-util-featured-app-proxies-test/daml/Splice/Scripts/TestFeaturedDepositsAndWithdrawals.daml#L147-L161>`__.


.. _treasury-sharding:

Sharding the Treasury
~~~~~~~~~~~~~~~~~~~~~

Sharding your treasury over multiple treasury parties may be interesting to reduce the risk
of compromise of a single ``treasuryParty``'s private key.
Using multiple treasury parties also provides operational flexibility with respect
to which validator nodes host what party.
This can be useful for load balancing or to incrementally change your party hosting setup.

You can shard your treasury over multiple parties as follows:

#. Setup multiple treasury parties instead of using a single ``treasuryParty``.
   Use the setup described in the :ref:`treasury-party-setup` section for each of them.
#. Run one instance of Tx History Ingestion, Withdrawal Automation, and
   Multi-Step Deposit Automation for each treasury party.
#. Share the Canton Integration DB across all instances, but adjust
   the schema such that UTXOs and pending multi-step transfers are tracked per treasury party.
#. Change your Exchange Internal Systems such that they select the treasury party
   as well as the ``Holding`` UTXOs to use for funding a withdrawal.
   For large withdrawals that surpass the funds available to a single treasury party,
   you can either rebalance the funds across multiple treasury parties
   or split the withdrawal into multiple smaller ones.

.. _treasury-party-multi-hosting:

Multi-Hosting the Treasury Party
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The :ref:`documentation on setting up the exchange party <treasury-party-setup>` describes how to setup a party with a single
confirming node. This can be sufficient but the confirming nodes for
the party are essential to keep your party secure and compromise of
them could lead to loss of funds. Refer to the trust model `trust
model
<https://docs.digitalasset.com/overview/3.3/explanations/canton/external-party.html#party-trust-model>`_
for more details.

To guard against compromise of the confirming nodes, you can setup your ``treasuryParty`` with multiple
confirming nodes and a threshold N > 1. As long as less than N nodes
are compromised, your party is still secured. Common setups are:

1. Two confirming nodes with a threshold of 2. This provides security
   against a single node being compromised. However, if one of the two nodes is down,
   transactions for the party will fail.
2. Three confirming nodes with a threshold of 2. This extends the previous
   setup to also provide availability in case one of the nodes goes
   down or gets compromised as the other two nodes are still functional.

Party Setup
^^^^^^^^^^^

.. TODO:: https://github.com/canton-network/wallet/issues/272 Update this when wallet SDK support is available

As part of the :ref:`initial treasury party setup
<create-an-external-party>`, you generate the ``PartyToParticipant``
topology transaction which lists both the confirming nodes and the
confirmation threshold.  To host a party on multiple nodes, you need
to include all confirming nodes in the ``PartyToParticipant`` mapping
when you setup the party initially. Note that at this point, the
wallet SDK library does not yet support this so you must go directly
through the Canton APIs. This is expected to change soon.

Until then, the easiest way to do so at the moment is through the Canton
console. You can find a full reference for all required steps in the
`integration test <https://github.com/digital-asset/canton/blob/3c9ac9891c03cb06303736d7224bcc01dbd50084/community/app/src/test/scala/com/digitalasset/canton/integration/tests/jsonapi/ExternalPartyLedgerApiOnboardingTest.scala#L183>`_.
Note in particular that you must sign the ``PartyToParticipant`` mapping
not just by your party's key but also by all confirming
participants. This is accomplished through the
``participant2.topology.transactions.authorize`` step in the test.

.dar File Management
^^^^^^^^^^^^^^^^^^^^

Any .dar file that you upload, both as part of the initial setup but also
whenever you upload newer versions to upgrade an existing package,
must be uploaded to all validator nodes hosting your party.

Reading Data and Submitting Transactions
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Both nodes serve all transactions for the ``treasuryParty`` and can
thus be used in principle to read them.
However, offsets are not comparable across nodes so it
is recommended that to run Tx History Ingestion against the same node
under normal operations. If you do need to switch nodes, you can do so
following the same procedure used for `restoring a validator from a
backup <validator_backup_restore>`_ to resynchronize Tx History
Ingestion against the offsets of the new node.

Preparation and execution of transactions can also be done against any
of the confirming nodes of the party. However, `Command Deduplication
<https://docs.digitalasset.com/build/3.3/sdlc-howtos/applications/develop/command-deduplication.html>`_
is only performed by the executing node so if you submit across nodes
you cannot rely on it. It is therefore recommend _not_ to rely on
command deduplication at all in favor of :ref:`UTXO and max record time based deuplication <withdrawal-automation>`.

.. TODO:: Link to recommended deduplication strategy https://github.com/canton-network/wallet/issues/423

Changing the set of Confirming Nodes
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

There are some limitations on changing the set of confirming nodes:

Removing confirming nodes is possible by submitting a new
``PartyToParticipant`` topology transaction. However, this can leave the nodes that
you remove in a broken state so this should be limited to cases where
that node got compromised or is no longer needed for other purposes.

Adding new confirming nodes is not currently possible. If this is required, you need to instead:

1. Setup a new treasury party with the desired set of confirming nodes.
2. Either transfer all funds from the existing treasury party to the
   new one and switch only to the new treasury party or rely on
   :ref:`treasury-sharding` to use both treasury parties until you are
   ready to phase out the old party.

Changing the confirmation threshold is possible at any point by
submitting a new ``PartyToParticipant`` topology transaction with the
updated threshold.

Future versions of Canton will allow changing the confirming nodes without the need for setting up a new party.


Using a KMS for Validator Node Keys
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

See the `Splice docs for how to setup you validator node with keys stored in a KMS <https://docs.dev.sync.global/validator_operator/validator_security.html#using-an-external-kms-for-managing-participant-keys>`__.
Consider doing so as an additional security hardening measure to
protect the keys of the `confirming node(s) <treasury-party-multi-hosting>`__ of your ``treasuryParty``.


Using the gRPC Ledger API
~~~~~~~~~~~~~~~~~~~~~~~~~

Feel free to do so if you prefer using gRPC.
It is functionally equivalent to the JSON Ledger API.
See this `Ledger API overview <https://docs.digitalasset.com/build/3.3/explanations/ledger-api.html>`__ for more information.
