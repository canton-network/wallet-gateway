.. _wallet-sdk-config:

Wallet SDK Configuration
========================

If you have already played around with the wallet SDK you might have come across snippets like:

.. literalinclude:: ../../examples/scripts/01-init.ts
            :language: typescript
            :dedent:

This is the default config that can be used in combination with a
non-altered `Localnet <https://docs.global.canton.network.sync.global/app_dev/testing/localnet.html>`__  running instance.


However as soon as you need to migrate your script, code and deployment to a different environment these default configurations are
no longer viable to use. In those cases creating custom factories for each controller is needed. Here is a template that you can use
when setting up your own custom connectivity configuration:

.. literalinclude:: ../../examples/snippets/config-template.ts
            :language: typescript
            :dedent:


How do I validate my configurations?
------------------------------------

Knowing if you are using the correct url and port can be daunting, here is a few curl and gcurl commands you can use to validate against
an expected output


**my-json-ledger-api** can be identified with ``curl http://${my-json-ledger-api}/v2/version`` it should produce a json that looks like

.. code-block:: JSON

      {
      "version": "3.4.12-SNAPSHOT",
      "features": {
         "experimental": {
               "staticTime": {
                  "supported": false
               },
               "commandInspectionService": {
                  "supported": true
               }
         },
         "userManagement": {
               "supported": true,
               "maxRightsPerUser": 1000,
               "maxUsersPageSize": 1000
         },
         "partyManagement": {
               "maxPartiesPageSize": 10000
         },
         "offsetCheckpoint": {
               "maxOffsetCheckpointEmissionDelay": {
                  "seconds": 75,
                  "nanos": 0,
                  "unknownFields": {
                     "fields": {}
                  }
               }
         },
         "packageFeature": {
               "maxVettedPackagesPageSize": 100
         }
      }
   }


the fields may vary based on your configuration.

**my-validator-app-api** can be identified with ``curl ${api}/version`` it should produce an output like

.. code-block:: JSON

    {"version":"0.4.15","commit_ts":"2025-09-05T11:38:13Z"}

**my-scan-proxy-api** is an api inside the validator api and can be defined as ``${my-validator-app-api}/v0/scan-proxy``.

**my-registry-api** is the registry for the token you want to use, for Canton Coin you can use **my-scan-proxy-api**, however for any other
token standard token it is required to source the api from a reputable source.

Configuring auth
---------------------------

The wallet-sdk can either take in a Provider (which will have auth bundled into it) or a LedgerClientUrl + TokenProviderConfig.
In our examples, we have provided a default TokenProviderConfig for connecting to localnet, which uses a self-signed token.

.. code-block:: javascript

      {
      method: 'self_signed',
      issuer: 'unsafe-auth',
      credentials: {
         clientId: 'ledger-api-user',
         clientSecret: 'unsafe',
         audience: 'https://canton.network.global',
         scope: '',
      },
   }

The value for some of the audiences in localnet would have to be adjusted to match "https://canton.network.global".
This is specifically the `LEDGER_API_AUTH_AUDIENCE` & `VALIDATOR_AUTH_AUDIENCE`.

When upgrading your setup from a localnet setup to a production or client facing environment then it might make more sense
to add proper authentication to the ledger api and other services. The community contributions include okta and keycloak
`OIDC <https://docs.dev.sync.global/community/oidc-config-okta-keycloak.html>`__. These can easily be configured for the
SDK using a different TokenProviderConfig. The following programmatic methods of token fetching are supported:

 1. `static`: a fixed, in-memory token. Only used for compatibility, it will totally break for expired tokens.
 2. `self_signed`: only for development purposes, used for Canton setups that accept HMAC256 self signed tokens.
 3. `client_credentials`: used to programmatically acquire tokens via oauth2, a.k.a "machine-to-machine" tokens

.. code-block:: javascript

   export type TokenProviderConfig =
      | {
            method: 'static'
            token: string
         }
      | {
            method: 'self_signed'
            issuer: string
            credentials: ClientCredentials
         }
      | {
            method: 'client_credentials'
            configUrl: string
            credentials: ClientCredentials
         }

   export interface ClientCredentials {
    clientId: string
    clientSecret: string
    scope: string | undefined
    audience: string | undefined
   }


Registering Plugins
-------------------

The Wallet SDK supports extending its functionality through a plugin system. Plugins allow you to add custom methods and functionality
to the SDK instance while maintaining access to the SDK context and logger.

Creating and Registering a Plugin
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

To create a plugin, extend the ``SDKPlugin`` class and implement your custom functionality. Plugins are registered using the
``registerPlugins`` method, which accepts a record of plugin constructors keyed by their desired property names.

.. literalinclude:: ../../examples/snippets/plugin.ts
            :language: typescript
            :dedent:

Key Points
^^^^^^^^^^

- **Plugin Constructor**: Plugin classes must accept ``SDKContext`` as a constructor parameter and pass it to the ``super()`` call along with the plugin name.
- **Type Safety**: The ``registerPlugins`` method provides full type safety, ensuring that registered plugins are accessible with proper autocompletion and type checking.
- **Access to SDK Context**: Plugins have access to the SDK's context, logger, and other internal utilities through the ``ctx`` property.
- **Multiple Plugins**: You can register multiple plugins at once by passing them in a single object to ``registerPlugins``.

