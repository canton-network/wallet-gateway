Signing Transactions from third party dApps
=============================================

A normal flow on blockchain applications is to have dApps that interact with the blockchain on the clients behalf,
these flows usually require the user to sign transactions that the dApp prepares and submit it. To faciliate this in
Canton it is required that the prepared transaction is sent to the wallet for signing. An easy way of supporting this
is to expose a dApp API (OpenRPC spec can be found here: https://github.com/canton-network/wallet-gateway/blob/main/api-specs/openrpc-dapp-api.json ).

*The specs are in OpenRPC to conform with traditional standards like for ethereum.*

A client can provide access to a Wallet Providers dApp API by either embedding a wallet provider in the dApp or by
connecting to an external wallet provider via a browser extension or other means. Then the dApp is able to funnel transactions
through to the wallet provider for signing.

Receiving a Transaction
-----------------------

A dApp would usually call the ``prepareExecute`` endpoint or the ``prepareExecuteAndWait`` endpoint. In both cases the Wallet Provider
would prepare, sign and submit the transaction to the ledger.

You can prepare the incoming transaction using the Wallet SDK:

.. literalinclude:: ../../examples/snippets/prepare-incoming-command.ts
    :language: typescript
    :dedent:

Reading and Visualising the Transaction
---------------------------------------
It is important when integrating with third party dApps to showcase the User exactly what is being signed. Once the signature
is applied the transaction can be considered valid (and executed). The easiest would be to create a visualizer that takes
a JSON representation of the transaction. The Json for a prepared transaction (before signature is applied) can be obtained
using the Wallet SDK:

.. Relies on https://github.com/canton-network/wallet-gateway/issues/1538
.. .. literalinclude:: ../../examples/snippets/convert-transaction-to-json.ts
..     :language: typescript
..     :dedent:



.. todo :: what is preapprovals in this case ?



