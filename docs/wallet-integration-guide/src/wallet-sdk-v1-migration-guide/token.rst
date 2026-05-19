.. Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
.. SPDX-License-Identifier: Apache-2.0

.. _token-migration-v1:

Token
=====

The token namespace provides methods to manage token operations including transfers, holdings, UTXOs, and allocations on the Canton Network. In v1, the token namespace replaces the ``tokenStandard`` controller from v0.

Availability and extensibility
------------------------------

The token namespace is an extended namespace that requires configuration. You can initialize it either during SDK creation or later using the ``extend()`` method.

**Option 1: Initialize during SDK creation**

.. literalinclude:: ../../examples/snippets/token.ts
    :language: typescript
    :dedent:

**Option 2: Add token namespace later using extend()**

.. literalinclude:: ../../examples/snippets/token-extended.ts
    :language: typescript
    :dedent:

Key changes from v0 to v1
-------------------------

v0 used the ``tokenStandard`` controller with implicit party context set via ``sdk.setPartyId()``.

v1 uses the ``token`` namespace where you:

- Pass ``partyId`` explicitly to each operation
- Initialize the namespace with configuration
- Access operations through logical groupings (``transfer``, ``utxos``, ``allocation``)

.. before-after::

   .. code-block:: javascript

      sdk.setPartyId(myPartyId)
      const holdings = await sdk.tokenStandard?.listHoldingTransactions()

   ---

   .. code-block:: javascript

      const holdings = await sdk.token.holdings({ partyId: myPartyId })

This enables thread-safe concurrent operations and clearer code organization.

Transfers
---------

**Creating transfers**

.. before-after::

   .. code-block:: javascript

      const transfer = await sdk.tokenStandard.createTransfer(
          senderPartyId,
          recipientPartyId,
          amount.toString(),
          {
            instrumentId: 'Amulet',
            instrumentAdmin: instrumentAdminPartyId
          },
          registryUrl,
          memo
      )

   ---

   .. code-block:: javascript

      const [command, disclosedContracts] = await sdk.token.transfer.create({
          sender: senderPartyId,
          recipient: recipientPartyId,
          amount: amount.toString(),
          instrumentId: 'Amulet',
          registryUrl,
          inputUtxos: ['utxo-1', 'utxo-2'],
          memo: 'Payment for services',
      })

**Accepting, rejecting, or withdrawing transfers**

.. before-after::

   .. code-block:: javascript

      await sdk.tokenStandard.exerciseTransferInstructionChoice(transferCid, choiceType /* 'Accept' | 'Withdraw' | 'Reject' */)

   ---

   .. code-block:: javascript

      // Accept transfer
      const [acceptCommand, disclosed1] = await sdk.token.transfer.accept({
          transferInstructionCid,
          registryUrl,
      })

      // Reject transfer
      const [rejectCommand, disclosed2] = await sdk.token.transfer.reject({
          transferInstructionCid,
          registryUrl,
      })

      // Withdraw transfer
      const [withdrawCommand, disclosed3] = await sdk.token.transfer.withdraw({
          transferInstructionCid,
          registryUrl,
      })

**Listing pending transfers**

.. before-after::

   .. code-block:: javascript

        await sdk.setPartyId(partyId)
        const pending = await sdk.tokenStandard
            .fetchPendingTransferInstructionView()

   ---

   .. code-block:: javascript

      const pending = await sdk.token.transfer.pending(myPartyId)

Holdings
--------

Holdings represent the transaction history of token ownership for a party.

.. before-after::

   .. code-block:: javascript

        await sdk.setPartyId(partyId)
        const holdings = await sdk.tokenStandard
            .listHoldingTransactions()

   ---

   .. code-block:: javascript

      const holdings = await sdk.token.holdings({ partyId })

You can also specify offsets for pagination:

.. code-block:: javascript

   const holdings = await sdk.token.holdings({
       partyId,
       afterOffset: 10,
       beforeOffset: 100,
   })

Transactions by updateId:

.. before-after::

   .. code-block:: javascript

        await sdk.setPartyId(partyId)
        const tx = await sdk.tokenStandard.getTransactionById('my-update-id')

   ---

   .. code-block:: javascript

      const tx = await sdk.token.transactionsById({ updateId, partyId })

UTXOs
-----

UTXOs (Unspent Transaction Outputs) are the actual holding contracts that represent token balances.

**Listing UTXOs**

.. before-after::

   .. code-block:: javascript

        await sdk.setPartyId(partyId)
        // List all UTXOs including locked ones
        const allUtxos = await sdk.tokenStandard?.listHoldingUtxos()

        // List only unlocked UTXOs
        const usableUtxos = await sdk.tokenStandard?.listHoldingUtxos(false)

   ---

   .. code-block:: javascript

      // List only unlocked UTXOs (default)
      const usableUtxos = await sdk.token.utxos.list({
          partyId
      })

      // List all UTXOs including locked ones
      const allUtxos = await sdk.token.utxos.list({
          partyId,
          includeLocked: true,
      })

You can specify additional parameters for pagination and limits:

.. code-block:: javascript

   const utxos = await sdk.token.utxos.list({
       partyId,
       includeLocked: false,
       limit: 100,
       offset: 0,
       continueUntilCompletion: false,
   })

**Merging UTXOs**

Merging consolidates multiple small UTXOs into larger ones to improve performance.

.. before-after::

   .. code-block:: javascript

        await sdk.setPartyId(partyId)
        const [commands, disclosedContracts] =
            await sdk.tokenStandard.mergeHoldingUtxos(nodeLimit)

   ---

   .. code-block:: javascript

      const [commands, disclosedContracts] = await sdk.token.utxos.merge({
          partyId,
          nodeLimit: 200,
          memo: 'merge-utxos',
      })

The merge operation groups UTXOs by instrument and creates self-transfers to consolidate them. You can optionally provide specific UTXOs to merge:

.. code-block:: javascript

   const [commands, disclosedContracts] = await sdk.token.utxos.merge({
       partyId,
       inputUtxos,
       memo: 'custom merge',
   })

Allocation
----------

Allocations handle the issuance and distribution of new tokens.

**Listing pending allocations**

.. before-after::

   .. code-block:: javascript

        await sdk.setPartyId(partyId)
        // Allocation requests
        const requests = await sdk.tokenStandard
            .fetchPendingAllocationRequestView()

        // Allocation instructions
        const instructions = await sdk.tokenStandard
            .fetchPendingAllocationInstructionView()

        // Allocations
        const allocations = await sdk.tokenStandard
            .fetchPendingAllocationView()

   ---

   .. code-block:: javascript

      // All pending allocations (default)
      const allocations = await sdk.token.allocation.pending(myPartyId)

The ``pending`` method accepts an optional interface ID to filter by allocation type:

.. code-block:: javascript

   import {
       ALLOCATION_REQUEST_INTERFACE_ID,
       ALLOCATION_INSTRUCTION_INTERFACE_ID,
       ALLOCATION_INTERFACE_ID,
   } from '@canton-network/core-token-standard'

   // Filter by specific type
   const requests = await sdk.token.allocation.pending(
       myPartyId,
       ALLOCATION_REQUEST_INTERFACE_ID
   )

**Executing, withdrawing or cancelling allocations**

.. before-after::

    .. code-block:: javascript

        const [command, disclosedContracts] = await sdk.tokenStandard.exerciseAllocationChoice(allocationCid, choice /* 'ExecuteTransfer' | 'Withdraw' | 'Cancel' */)

    ---

    .. code-block:: javascript

        // Execute allocation
        const [executeCommand, disclosedContracts1] = await sdk.token.allocation.execute({
            allocationCid,
            asset
        })

         // Withdraw allocation
        const [withdrawCommand, disclosedContracts2] = await sdk.token.allocation.withdraw({
            allocationCid,
            asset,
        })

        // Cancel allocation
        const [cancelCommand, disclosedContracts3] = await sdk.token.allocation.cancel({
            allocationCid,
            asset,
        })

Migration reference
-------------------

..  list-table:: Token-related method migration
    :widths: 25 25
    :header-rows: 1

    * - v0 method
      - v1 method
    * - ``sdk.tokenStandard.createTransfer``
      - ``sdk.token.transfer.create``
    * - ``sdk.tokenStandard.exerciseTransferInstructionChoice``
      - ``sdk.token.transfer.accept`` / ``sdk.token.transfer.reject`` / ``sdk.token.transfer.withdraw``
    * - ``sdk.tokenStandard.fetchPendingTransferInstructionView``
      - ``sdk.token.transfer.pending``
    * - ``sdk.tokenStandard.listHoldingTransactions({partyId})``
      - ``sdk.token.holdings({partyId})``
    * - ``sdk.tokenStandard.listHoldingUtxos()``
      - ``sdk.token.utxos.list({partyId})``
    * - ``sdk.tokenStandard.mergeHoldingUtxos``
      - ``sdk.token.utxos.merge``
    * - ``sdk.tokenStandard.fetchPendingAllocationRequestView``
      - ``sdk.token.allocation.pending(partyId, ALLOCATION_REQUEST_INTERFACE_ID)``
    * - ``sdk.tokenStandard.fetchPendingAllocationInstructionView``
      - ``sdk.token.allocation.pending(partyId, ALLOCATION_INSTRUCTION_INTERFACE_ID)``
    * - ``sdk.tokenStandard.fetchPendingAllocationView``
      - ``sdk.token.allocation.pending(partyId)``

See also
--------

- :ref:`wallet-sdk-config` - SDK configuration
- :ref:`preparing-and-signing-transactions` - Transaction lifecycle
