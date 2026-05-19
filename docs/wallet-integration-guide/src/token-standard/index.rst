..
   Copyright (c) 2024 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
..
   SPDX-License-Identifier: Apache-2.0

.. #TODO: copy of https://raw.githubusercontent.com/hyperledger-labs/splice/3c0770e648b21a48ef8dde202ef27065592f9422/docs/src/deployment/traffic.rst

.. _token_standard:

Token Standard
==============

The Wallet SDK support performing basic token standard operations, these are exposed through the `sdk.tokenStandard` a complete
overview of the underlying integration can be found `here <https://docs.sync.global/app_dev/token_standard/index.html#>` and the CIP
is defined `here <https://github.com/global-synchronizer-foundation/cips/blob/main/cip-0056/cip-0056.md>`.


How do i quickly perform a transfer between two parties?
--------------------------------------------------------

The below performs a 2-step transfer between Alice and Bob and expose their holdings:

.. tabs::

    .. tab:: Creating a transfer

        .. literalinclude:: ../../examples/scripts/02-two-step-transfer/index.ts
            :language: typescript
            :dedent:

    .. tab:: Accepting a transfer

        .. literalinclude:: ../../examples/scripts/02-two-step-transfer/_accept.ts
            :language: typescript
            :dedent:
    .. tab:: Rejecting a transfer

        .. literalinclude:: ../../examples/scripts/02-two-step-transfer/_reject.ts
            :language: typescript
            :dedent:
    .. tab:: Withdrawing a transfer

        .. literalinclude:: ../../examples/scripts/02-two-step-transfer/_withdraw.ts
            :language: typescript
            :dedent:




Listing holdings (UTXO's)
-------------------------

Canton uses created and archived events to determine the state of the ledger. This correlates to how UTXO's are handled on other blockchains
like Bitcoin. This means that at any point in time you can retrieve all your active contracts with the interface 'Holding' to see all assets
you posses across different instruments.

.. literalinclude:: ../../examples/snippets/list-holdings.ts
    :language: typescript
    :dedent:

the above script can safely be used to determine used in a transfer, if you provide no boolean value or true then you need to filter
out the locked ones manually.

.. _list-holding-transactions:

Listing holding transactions
----------------------------

In order to stream transaction events as they happen on ledger the `listHoldingTransactions` endpoint can be used. This takes two ledger
offset and gives an overview of all token standard transactions that have happened between. It also returns a `nextOffset` that can be used
when calling the endpoint again. This will allow you to easily ensure you do not receive any transaction twice and you are only querying the
transactions that have happened after.


.. literalinclude:: ../../examples/snippets/monitor-transaction-holdings.ts
    :language: typescript
    :dedent:


to quickly convert the stream into deposit and withdrawal you can use this function:

.. code-block:: javascript

    function convertToTransaction(pt: Transaction, associatedParty: string): object[] {
        return pt.events.flatMap((event) => {
            if (event.label.type === 'TransferIn') {
                return [{
                    updateId: pt.updateId,
                    recordTime: pt.recordTime,
                    from: event.label.sender,
                    to: associatedParty,
                    amount: Number(event.unlockedHoldingsChangeSummary.amountChange),
                    instrumentId: 'Amulet', //hardcoded instrumentId from local net
                    fee: Number(event.label.burnAmount),
                    memo: event.label.reason,
                }];
            } else if (event.label.type === 'TransferOut') {
                const label = event.label
                return event.label.receiverAmounts.map((receiverAmount: any) => ({
                    updateId: pt.updateId,
                    recordTime: pt.recordTime,
                    from: associatedParty,
                    to: receiverAmount.receiver,
                    amount: Number(receiverAmount.amount),
                    instrumentId: 'Amulet', //hardcoded instrumentId from local net
                    fee: Number(label.burnAmount),
                    memo: label.meta.reason,
                }));
            } else {
                return [];
            }
        });
    }


.. _performing_tap:

Performing a Tap on DevNet or LocalNet
--------------------------------------
When writing scripts and setup it is important to have funds present, this can be very tedious on blockchains. Therefor
most blockchains support some form of a faucet (that allows to receive a small amount of funds to play with). On canton
we allow the `tap` method that is only present on DevNet (or LocalNet), by using this you can stock funds to easily attempt
some of the CC transfer flows:

.. literalinclude:: ../../examples/snippets/tap-coins.ts
    :language: typescript
    :dedent:

this is an important pre-requisite for the creating of transfer in your script.

Creating a transfer
-------------------

In order to create a simple transfer you can use the `createTransfer` on the token standard. Then like any other operation
you can use the `prepareSubmission` endpoint, sign the returned hash and finally `executeSubmission`.


.. literalinclude:: ../../examples/snippets/create-transfer-command.ts
    :language: typescript
    :dedent:

UTXO management and locked funds
--------------------------------

The default script for creating a transfer above uses automated utxo selection, the automatic being to simply select all utxo's.
In a more professional way, you would want to carefully pick which utxo's you would like to use as input for your transfers, alongside
you might also want to define a custom expiration time for when the transaction should automatically expire.


.. literalinclude:: ../../examples/snippets/create-transfer-command-full.ts
    :language: typescript
    :dedent:

if we call `sdk.token.utxos.list({partyId})` or `sdk.token.utxos.list({partyId, includeLocked: false})` then it will show 1 utxo of 50 (then one we excluded). This defaults to filtering out the locked utxos.

if we call `sdk.token.utxos.list({partyId, includeLocked: true})` then it will show all 3 utxos (100 and 25 both will have a lock).



2-step transfer vs 1-step transfer
----------------------------------

The default behavior for all tokens are a 2-step transfer, this matches how funds are usually transferred in TradFi, however this is
counter-intuitive in the blockchain world. Canton Coin supports setting up a "Transfer Pre-approval", this allows a party to designate
that he wants to auto-accept all incoming transfer, giving a similar behavior of the blockchain world.

.. literalinclude:: ../../examples/snippets/create-transfer-preapproval.ts
    :language: typescript
    :dedent:

Accepting or rejecting a 2-step transfer
----------------------------------------

If no Transfer pre-approval have been set up, then it is required to fetch incoming transfer instructions and consume either the `Accept`
or `Reject` choice, this can be done easily using the Wallet SDK.

.. literalinclude:: ../../examples/snippets/read-pending-transfer-instructions.ts
    :language: typescript
    :dedent:


the above give a list of pending transfer instructions, you can then exercise the accept or reject choice on them:

.. literalinclude:: ../../examples/snippets/accept-or-reject-transfer.ts
    :language: typescript
    :dedent:


Withdrawing a 2-step transfer before it gets accepted
-----------------------------------------------------

Apart from accepting or rejecting a transfer instruction, it is also possible for the sender to `withdraw` the offer, thereby retrieving
the locked funds.

.. literalinclude:: ../../examples/snippets/withdraw-transfer-instruction.ts
    :language: typescript
    :dedent:

How do i quickly setup transfer preapproval?
--------------------------------------------

It is worth nothing that using the validator operator party as the providing party causes the transfer pre-approval to auto-renew.
The below script setup transfer preapproval for Bob and performs a 1-step transfer from Alice to Bob:

.. literalinclude:: ../../examples/scripts/05-preapproval.ts
    :language: typescript
    :dedent:

How to renew or cancel a transfer preapproval
---------------------------------------------
If you have used the validator operator party as the provider, then it will automatically renew the transfer preapproval approximately
20 days before expiry, however there are cases where you would like to perform the preapproval renewal manually:

.. code-block:: javascript

    await amulet.preapproval.renew({
        parties: {
            receiver: myPartyId,
        },
        expiresAt: newExpiresAt,
    })

You can also deploy a secondary transfer preapproval, however this means that there are simply two preapprovals instead of it replacing
the existing.

If you have accidentally created a transfer preapproval that you dont want to keep you can perform a cancel instead:

.. code-block:: javascript

    const [cancelPreapprovalCommand, cancelDisclosedContracts] =
    await amulet.preapproval.command.cancel({
        parties: {
            receiver: myPartyId,
        },
    })
    await sdk.ledger
        .prepare({
            partyId: myPartyId,
            commands: cancelPreapprovalCommand,
            disclosedContracts: cancelDisclosedContracts,
        })
        .sign(myPrivateKey)
        .execute({
            partyId: myPartyId,
        })


How do I fetch transaction by updateId? 
----------------------------------------

Given an update Id, the token namespace has a method for getting a transaction based on the updateId.
This will print out the transaction in the same format as `sdk.token.holdings`

.. literalinclude:: ../../examples/snippets/transaction-update-by-id.ts
    :language: typescript
    :dedent:
