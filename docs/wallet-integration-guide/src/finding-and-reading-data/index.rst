Finding and Reading Data
========================

The wallet SDK primarily focus on an on-party basis interaction, therefore it is almost always required to define the party you are using fo each command/

Reading Available Parties
-------------------------

Reading all available parties to you can easily be done using the wallet SDK as shown in the example below, and the result is paginated.
It's worth noting that the call to read all available parties doesn't use the the party and synchronizer fields therefore changing them has no effect on the result.

.. literalinclude:: ../../examples/snippets/list-wallets.ts
    :language: typescript
    :dedent:

Reading Ledger End
------------------

A lot of different requests will take a ledger offset to ensure the requested time correlates with ledger time. A Validator does not have a block height since
there is no total state replication. There are two values that correlate:

* ledger time - this is the time the ledger chooses when computing a transaction prior to commit.
* record time - this is the time assigned by the sequencer when registering the confirmation request.

Ledger time should be used for all operations in your local environment (that does not affect partners).
When doing reconciliation for transactions with partners or other members of a synchronizer it is better to use record time.

Ledger end is used as a default for wallet SDK operations.


Reading Active Contracts
------------------------

Using the above ledger time we can figure out what the current state of all active contracts are. Contracts can be in two states - active and archived - which correlates
to the UTXO mode of unspent and spent. Active contracts are contracts that are unspent and thereby can be used in new transactions or to exercise choices.

.. literalinclude:: ../../examples/snippets/read-active-contracts.ts
    :language: typescript
    :dedent:

.. _visualizing-a-transaction:

Visualizing a Transaction
-------------------------

The Wallet SDK uses a transaction parsing transform a fully fledged transaction tree into human recognizable transaction view. The full code
for the transaction parsing can be found at `parser typescript class <https://github.com/canton-network/wallet/blob/main/core/ledger-client/src/txparse/parser.ts>`__.

The Wallet SDK uses this parser to transform all transaction tree interacted with into PrettyTransactions.

for instance on the `getTransactionById` or `listHoldingTransactions` (:ref:`Detailed here <list-holding-transactions>`).

The Transactions will have format:

.. code-block:: javascript

    export interface Transaction {
        updateId: string // unique updateId
        offset: number // the ledger offset (local validator)
        recordTime: string // time recorded on the synchronizer (use this if needed to compare with another ledger)
        synchronizerId: string // the synchronizer the transaction happened on
        events: TokenStandardEvent[] // event representing all the changes caused by the transaction
    }

A single transaction can contain multiple events (deposits and withdrawals are considered events). In order to figure out the on chain
transaction it is required to iterate over all the events. The events have the format:

.. code-block:: javascript

    export interface TokenStandardEvent {
        label: Label // used to identify the type of transaction
        lockedHoldingsChange: HoldingsChange // all the changes to locked holdings
        lockedHoldingsChangeSummary: HoldingsChangeSummary // summary of above changes
        unlockedHoldingsChange: HoldingsChange // all the changes to unlocked holdings
        unlockedHoldingsChangeSummary: HoldingsChangeSummary // summary of above changes
        transferInstruction: TransferInstructionView | null // any pending transfer instructions
    }

below you can have a look at different event types and how to potentially visualize the transaction for a client

.. tabs::

    .. tab:: Tap operation

       Here is an example on how a "tap" event looks like (:ref:`Performing tap <performing_tap>`):

       .. literalinclude:: ../../examples/snippets/tap-event.json
           :language: JSON
           :dedent:

       The tap gives a nice and simple view some key values to look at. Using the `label` we can quickly gage what is happening:

       .. code-block:: JSON

           "label": {
               "burnAmount": "0", // how much was burned
               "mintAmount": "2000000", // how much was minted
               "type": "Mint", // event type
               "tokenStandardChoice": null, // no token standard choice
               "reason": "tapped faucet", // reason
               "meta": {
                   "values": {} // any other meta data value
               }
           }

       For a "tap" event we don't have any locked holding changes, however we do have an unlocked create event:

       .. code-block:: JSON

           "unlockedHoldingsChange": {
               // we have one create event
               // if utxos what spend this would be an archive instead
               "creates": [
                   {
                       // amount on the utxo
                       "amount": "2000000.0000000000",
                       // instrument information
                       "instrumentId": {
                           "admin": "DSO::1220294d264ccf205000d72d9f0106e3a0e8ce8d34982d7f134c42d42d18750ccd36",
                           "id": "Amulet"
                       },
                       // the contract id of the new utxo
                       "contractId": "00cee8d2659d5966962fbda321aae358092eafbb162d46f2639a8da0688ef3ee8aca11122096aeb27e0fa9c03a3209fda9db88e4e67a2ba1509f094bdd82a38d844ca65305",
                       // owner of the utxo
                       "owner": "alice::12201acb807c49aceaeb68b1d89bb3bea95fe740b4b0a6cca428e6a351c2450540f4",
                       // any meta data
                       "meta": {
                           "values": {
                               "amulet.splice.lfdecentralizedtrust.org/created-in-round": "32",
                               "amulet.splice.lfdecentralizedtrust.org/rate-per-round": "0.00380518"
                           }
                       },
                       // lock if applicable
                       "lock": null
                   }
               ]
           }

    .. tab:: Merge Split

        A Merge or split is usually done by performing a transfer to yourself, by selecting several input utxos they can be consolidated into one
        and likewise a transfer to yourself of one big utxo can be used to split it into two. Below is the usual merge split that you would see
        if you use an utxo that is bigger than the transferred amount when performing a 2-step transfer:

       .. literalinclude:: ../../examples/snippets/merge-split-event.json
           :language: JSON
           :dedent:

       The label gives us the quick information

       .. code-block:: JSON

            "label": {
                    "burnAmount": "0",  // how much was burned
                    "mintAmount": "0",  // how much was minted
                    "type": "MergeSplit", // event type
                    "tokenStandardChoice": { // the entire token standard choice

                    },
                    "reason": "memo-ref", // memo tag
                    "meta": { // any other relevant meta data
                      "values": {}
                    }
                  }

       The locked holding change shows one new utxo equivalent to the amount send to Bob. Once Bob accepts the transfer this locked
       utxo would be archived.information.

       .. code-block:: JSON

             "lockedHoldingsChange": {
                    // we have 1 new locked holding of the transfer amount (100)
                    "creates": [
                      {
                        "amount": "100.0000000000",
                        "instrumentId": {
                          "admin": "DSO::1220294d264ccf205000d72d9f0106e3a0e8ce8d34982d7f134c42d42d18750ccd36",
                          "id": "Amulet"
                        },
                        "contractId": "00b0af2ac89701b35d60b52fa239a66a993b383f963a9230f3f04e6510290dbe95ca1112200df1866e4ed7b50d6f9ac02b348a47a47b70c4d74f8d9575a1453ee9fe175f1b",
                        // alice is still the owner since this a locked utxo, until bob accepts
                        "owner": "alice::12201acb807c49aceaeb68b1d89bb3bea95fe740b4b0a6cca428e6a351c2450540f4",
                        "meta": {
                          "values": {
                            "amulet.splice.lfdecentralizedtrust.org/created-in-round": "32",
                            "amulet.splice.lfdecentralizedtrust.org/rate-per-round": "0.00380518"
                          }
                        },
                        "lock": {
                        // the DSO (instrument Admin) is holder of the lock
                          "holders": [
                            "DSO::1220294d264ccf205000d72d9f0106e3a0e8ce8d34982d7f134c42d42d18750ccd36"
                          ],
                          "expiresAt": "2025-10-15T02:11:47.406Z",
                          "expiresAfter": null,
                          "context": "transfer to 'bob::1220447e99360f4e11caf7be818b96ead2a23c593eb927f792ae5f0a0bc15b264783'"
                        }
                      }
                    ]
                  },
                  //overview of how holdings have changed
                  "lockedHoldingsChangeSummary": {
                    "numOutputs": 1,
                    "outputAmount": "100",
                    "amountChange": "100"
                  },

       There is also an unlocked holding change, consist of one create and one archive. Since alice had one transaction of 2000000.0000000000,
       and only send 100, then she gets the remaining 1999900.0000000000 back:

       .. code-block:: JSON

            "unlockedHoldingsChange": {
                    // creates the new utxo for alice with the unspent amount
                    "creates": [
                      {
                        "amount": "1999900.0000000000",
                        "instrumentId": {
                          "admin": "DSO::1220294d264ccf205000d72d9f0106e3a0e8ce8d34982d7f134c42d42d18750ccd36",
                          "id": "Amulet"
                        },
                        "contractId": "00ba31e046f04908e6bf6fe5eeb725f0e2054f37353e85c7ef99a0924df8c1b891ca11122046dee24aeae91d4a5fc0570458cad8ccc94002645b6a6e2c82cc5f07ca897fe9",
                        "owner": "alice::12201acb807c49aceaeb68b1d89bb3bea95fe740b4b0a6cca428e6a351c2450540f4",
                        "meta": {
                          "values": {
                            "amulet.splice.lfdecentralizedtrust.org/created-in-round": "32",
                            "amulet.splice.lfdecentralizedtrust.org/rate-per-round": "0.00380518"
                          }
                        },
                        "lock": null
                      }
                    ],
                    // archives the old spend utxo
                    "archives": [
                      {
                        "amount": "2000000.0000000000",
                        "instrumentId": {
                          "admin": "DSO::1220294d264ccf205000d72d9f0106e3a0e8ce8d34982d7f134c42d42d18750ccd36",
                          "id": "Amulet"
                        },
                        "contractId": "00cee8d2659d5966962fbda321aae358092eafbb162d46f2639a8da0688ef3ee8aca11122096aeb27e0fa9c03a3209fda9db88e4e67a2ba1509f094bdd82a38d844ca65305",
                        "owner": "alice::12201acb807c49aceaeb68b1d89bb3bea95fe740b4b0a6cca428e6a351c2450540f4",
                        "meta": {
                          "values": {
                            "amulet.splice.lfdecentralizedtrust.org/created-in-round": "32",
                            "amulet.splice.lfdecentralizedtrust.org/rate-per-round": "0.00380518"
                          }
                        },
                        "lock": null
                      }
                    ]
                  },
                  // overview of how this has changed alices utxos
                  "unlockedHoldingsChangeSummary": {
                    "numInputs": 1,
                    "inputAmount": "2000000",
                    "numOutputs": 1,
                    "outputAmount": "1999900",
                    "amountChange": "-100"
                  }


    .. tab:: Transfer Out

        When Bob accepts the transfer we see the actual transfer out event. This is seen from Alice point of view

       .. literalinclude:: ../../examples/snippets/transfer-out-event.json
           :language: JSON
           :dedent:

       The label gives us the quick information.

       .. code-block:: JSON

           "label": {
                   "burnAmount": "0", // how much was burned
                   "mintAmount": "0",  // how much was minted
                   "type": "TransferOut", // event type
                   "receiverAmounts": [ // the list of receivers and how much
                     {
                       "receiver": "bob::1220447e99360f4e11caf7be818b96ead2a23c593eb927f792ae5f0a0bc15b264783",
                       "amount": "100"
                     }
                   ],
                   "tokenStandardChoice": { // the entire token standard choice

                   },
                   "reason": "memo-ref", // memo tag
                   "meta": { // any other meta data
                     "values": {}
                   }
                 }

       We can see that the locked 100 transfer is now archived, on Bobs side he will see a Transfer In that creates an
       unlocked holding of 100.

       .. code-block:: JSON

            "lockedHoldingsChange": {
                    // The locked utxo is archived
                    "archives": [
                      {
                        "amount": "100.0000000000",
                        "instrumentId": {
                          "admin": "DSO::1220294d264ccf205000d72d9f0106e3a0e8ce8d34982d7f134c42d42d18750ccd36",
                          "id": "Amulet"
                        },
                        "contractId": "00b0af2ac89701b35d60b52fa239a66a993b383f963a9230f3f04e6510290dbe95ca1112200df1866e4ed7b50d6f9ac02b348a47a47b70c4d74f8d9575a1453ee9fe175f1b",
                        "owner": "alice::12201acb807c49aceaeb68b1d89bb3bea95fe740b4b0a6cca428e6a351c2450540f4",
                        "meta": {
                          "values": {
                            "amulet.splice.lfdecentralizedtrust.org/created-in-round": "32",
                            "amulet.splice.lfdecentralizedtrust.org/rate-per-round": "0.00380518"
                          }
                        },
                        "lock": {
                          "holders": [
                            "DSO::1220294d264ccf205000d72d9f0106e3a0e8ce8d34982d7f134c42d42d18750ccd36"
                          ],
                          "expiresAt": "2025-10-15T02:11:47.406Z",
                          "expiresAfter": null,
                          "context": "transfer to 'bob::1220447e99360f4e11caf7be818b96ead2a23c593eb927f792ae5f0a0bc15b264783'"
                        }
                      }
                    ]
                  }

    .. tab:: Transfer In

        Bob will see a transfer in once he has accepted the transferInstruction from Alice. If Bob had set up transfer pre-approval, then he
        would only see the below transfer:

       .. literalinclude:: ../../examples/snippets/transfer-in-event.json
           :language: JSON
           :dedent:


       The label gives us the quick information.

       .. code-block:: JSON

           "label": {
                   "type": "TransferIn", // event type
                   "burnAmount": "0",  // how much was burned
                   "mintAmount": "0", // how much was minted
                   // the original sender of the amount
                   "sender": "alice::12201acb807c49aceaeb68b1d89bb3bea95fe740b4b0a6cca428e6a351c2450540f4",
                   "tokenStandardChoice": {

                   },
                   "reason": "memo-ref", // memo tag
                   "meta": { // any other meta fields
                     "values": {}
                   }
                 }

       Bob then also sees one new unlocked utxo for the 100.

       .. code-block:: JSON

            "unlockedHoldingsChange": {
                    // the new money available for Bob
                    "creates": [
                      {
                        "amount": "100.0000000000",
                        "instrumentId": {
                          "admin": "DSO::1220294d264ccf205000d72d9f0106e3a0e8ce8d34982d7f134c42d42d18750ccd36",
                          "id": "Amulet"
                        },
                        "contractId": "002e360f78cf28a40c742839572bbf7a683ba59c3db906757b284a2edf433700edca1112209685da5d5a5c531b51504601c175cbbeaba8956e7a7fc2926fa8909d8b81a95a",
                        "owner": "bob::1220447e99360f4e11caf7be818b96ead2a23c593eb927f792ae5f0a0bc15b264783",
                        "meta": {
                          "values": {
                            "amulet.splice.lfdecentralizedtrust.org/created-in-round": "32",
                            "amulet.splice.lfdecentralizedtrust.org/rate-per-round": "0.00380518"
                          }
                        },
                        "lock": null
                      }
                    ]
                  }
