import { localNetStaticConfig, SDK } from '@canton-network/wallet-sdk'
import { pino } from 'pino'
import { TOKEN_PROVIDER_CONFIG_DEFAULT } from './utils/index.js'
const logger = pino({ name: 'v1-multi-user-setup', level: 'info' })

logger.info('Operator sets up users and primary parties')

const operatorSdk = await SDK.create({
    auth: TOKEN_PROVIDER_CONFIG_DEFAULT,
    ledgerClientUrl: localNetStaticConfig.LOCALNET_APP_USER_LEDGER_URL,
})

const aliceInternal = await operatorSdk.party.internal.allocate({
    partyHint: 'v1-09-alice',
})

const bobInternal = await operatorSdk.party.internal.allocate({
    partyHint: 'v1-09-bob',
})

const masterPartyInternal = await operatorSdk.party.internal.allocate({
    partyHint: 'v1-09-master',
})

logger.info('Created the internal parties')

const aliceUser = await operatorSdk.user.create({
    userId: 'alice-user',
    primaryParty: aliceInternal,
    userRights: {
        participantAdmin: true,
    },
})

const bobUser = await operatorSdk.user.create({
    userId: 'bob-user',
    primaryParty: bobInternal,
    userRights: {
        participantAdmin: true,
    },
})

const masterUser = await operatorSdk.user.create({
    userId: 'master-user',
    primaryParty: masterPartyInternal,
    userRights: {
        participantAdmin: true,
    },
})

logger.info('created the users')

if (!(aliceUser || bobUser || masterUser)) {
    throw new Error(`One of the users was not created correctly`)
}

await operatorSdk.user.rights.grant({
    userId: masterUser.id!,
    userRights: {
        canExecuteAsAnyParty: true,
        canReadAsAnyParty: true,
    },
})

logger.info(
    `Created alice user: ${aliceUser.id} with primary party (internal) ${aliceUser.primaryParty}`
)
logger.info(
    `Created bob user: ${bobUser.id} with primary party (internal) ${bobUser.primaryParty}`
)
logger.info(
    `Created master user: ${masterUser.id} with primary party (internal) ${masterUser.primaryParty}, with read as and execute as rights`
)

const aliceSdk = await SDK.create({
    auth: {
        method: 'self_signed',
        issuer: 'unsafe-auth',
        credentials: {
            clientId: aliceUser.id,
            clientSecret: 'unsafe',
            audience: 'https://canton.network.global',
            scope: '',
        },
    },
    ledgerClientUrl: localNetStaticConfig.LOCALNET_APP_USER_LEDGER_URL,
})

const aliceKeyPair = aliceSdk.keys.generate()
const aliceExternal = await aliceSdk.party.external
    .create(aliceKeyPair.publicKey, {
        partyHint: 'v1-09-alice',
    })
    .sign(aliceKeyPair.privateKey)
    .execute()

logger.info(`alice created external party`)

const bobSdk = await SDK.create({
    auth: {
        method: 'self_signed',
        issuer: 'unsafe-auth',
        credentials: {
            clientId: bobUser.id,
            clientSecret: 'unsafe',
            audience: 'https://canton.network.global',
            scope: '',
        },
    },
    ledgerClientUrl: localNetStaticConfig.LOCALNET_APP_USER_LEDGER_URL,
})

const bobKeyPair = bobSdk.keys.generate()
const bobExternal = await bobSdk.party.external
    .create(bobKeyPair.publicKey, {
        partyHint: 'v1-09-bob',
    })
    .sign(bobKeyPair.privateKey)
    .execute()
logger.info(`bob created external party`)

const masterUserSdk = await SDK.create({
    auth: {
        method: 'self_signed',
        issuer: 'unsafe-auth',
        credentials: {
            clientId: masterUser.id,
            clientSecret: 'unsafe',
            audience: 'https://canton.network.global',
            scope: '',
        },
    },
    ledgerClientUrl: localNetStaticConfig.LOCALNET_APP_USER_LEDGER_URL,
})

const masterWalletView = await masterUserSdk.party.list()

if (!masterWalletView?.find((p) => p === aliceExternal.partyId)) {
    throw new Error('master user cannot see alice party')
}
if (!masterWalletView?.find((p) => p === bobExternal.partyId)) {
    throw new Error('master user cannot see bob party')
}

const aliceWalletView = await aliceSdk.party.list()
logger.info(aliceWalletView)

if (aliceWalletView?.find((p) => p === bobExternal.partyId)) {
    throw new Error('alice user can see bob party')
}

const bobWalletView = await bobSdk.party.list()

if (bobWalletView?.find((p) => p === aliceExternal.partyId)) {
    throw new Error('bob user can see alice party')
}

logger.info(
    'alice and bob have proper isolation and cannot see each others external parties'
)

//user management test
await bobSdk.user.rights.grant({
    userRights: {
        readAs: [aliceExternal.partyId],
    },
})

const bobWalletViewAfterGrantRights = await bobSdk.party.list()

if (!bobWalletViewAfterGrantRights?.find((p) => p === aliceExternal.partyId)) {
    throw new Error('bob user cannot see alice party even with ReadAs rights')
}

const bobRightsAfterGrantRights = await bobSdk.user.rights.list()

logger.info(bobRightsAfterGrantRights, 'Bob user rights')

await bobSdk.user.rights.revoke({
    userRights: {
        readAs: [aliceExternal.partyId],
    },
})

const bobWalletViewAfterRevokeRights = await bobSdk.party.list()

if (bobWalletViewAfterRevokeRights?.find((p) => p === aliceExternal.partyId)) {
    throw new Error('bob user can see alice party even after revoking rights')
}
