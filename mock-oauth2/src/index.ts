// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { OAuth2Server } from 'oauth2-mock-server'
import basicAuth from 'basic-auth'
import pino from 'pino'
import { createHash } from 'crypto'
const logger = pino({ name: 'mock-oauth2-server', level: 'debug' })

const toBase64Url = (input: Buffer | string): string =>
    Buffer.from(input)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '')

const pkceS256 = (verifier: string): string =>
    toBase64Url(createHash('sha256').update(verifier).digest())

const readQueryParam = (req: { url?: string }, key: string): string => {
    const requestUrl = new URL(req.url || '/', 'http://localhost')
    return requestUrl.searchParams.get(key) || ''
}

async function main() {
    logger.info('Starting mock-oauth2 server...')

    const server = new OAuth2Server()
    const host = '127.0.0.1'
    const port = 8889
    const protocol = 'http'

    await server.issuer.keys.generate('RS256')
    await server.start(port, host)

    logger.info('Mock OAuth2 server started')

    const service = server.service
    const authCodeChallengeByCode = new Map<string, string>()

    service.on('beforeAuthorizeRedirect', (authorizeRedirectUri, req) => {
        const responseType = readQueryParam(req, 'response_type')

        if (responseType !== 'code') {
            return
        }

        const codeChallenge = readQueryParam(req, 'code_challenge')
        const codeChallengeMethod = readQueryParam(req, 'code_challenge_method')

        if (!codeChallenge || codeChallengeMethod !== 'S256') {
            logger.warn(
                {
                    codeChallengePresent: Boolean(codeChallenge),
                    codeChallengeMethod,
                },
                'Rejecting authorize request: PKCE is required with S256'
            )
            authorizeRedirectUri.url.searchParams.delete('code')
            authorizeRedirectUri.url.searchParams.set(
                'error',
                'invalid_request'
            )
            authorizeRedirectUri.url.searchParams.set(
                'error_description',
                'code challenge required'
            )
            return
        }

        const authCode = authorizeRedirectUri.url.searchParams.get('code')
        if (authCode) {
            authCodeChallengeByCode.set(authCode, codeChallenge)
        }
    })

    service.on('beforeResponse', (tokenEndpointResponse, req) => {
        if (req.body.grant_type !== 'authorization_code') {
            return
        }

        const code = req.body.code as string | undefined
        const codeVerifier = req.body.code_verifier as string | undefined

        if (!codeVerifier) {
            logger.warn('Rejecting token request: missing code_verifier')
            tokenEndpointResponse.statusCode = 400
            tokenEndpointResponse.body = {
                error: 'invalid_request',
                error_description: 'code verifier required',
            }
            return
        }

        if (!code) {
            logger.warn('Rejecting token request: missing authorization code')
            tokenEndpointResponse.statusCode = 400
            tokenEndpointResponse.body = {
                error: 'invalid_grant',
                error_description: 'missing authorization code',
            }
            return
        }

        const expectedChallenge = authCodeChallengeByCode.get(code)

        if (!expectedChallenge) {
            logger.warn(
                { code },
                'Rejecting token request: no PKCE challenge for code'
            )
            tokenEndpointResponse.statusCode = 400
            tokenEndpointResponse.body = {
                error: 'invalid_grant',
                error_description: 'authorization code is not PKCE-bound',
            }
            return
        }

        authCodeChallengeByCode.delete(code)

        if (pkceS256(codeVerifier) !== expectedChallenge) {
            logger.warn(
                { code },
                'Rejecting token request: PKCE verifier mismatch'
            )
            tokenEndpointResponse.statusCode = 400
            tokenEndpointResponse.body = {
                error: 'invalid_grant',
                error_description: 'code verifier mismatch',
            }
        }
    })

    service.on('beforeTokenSigning', (token, req) => {
        logger.info({ body: req.body }, 'Received token request')
        const credentials = basicAuth(req)
        const clientId = credentials ? credentials.name : req.body.client_id

        token.payload.iss = `${protocol}://${host}:${port}`
        const aud = req.body.audience
        token.payload.sub = clientId // Mocked subject given the clientId
        token.payload.email =
            process.env.BLOCKDAEMON_API_EMAIL ||
            'phillip.olesen@digitalasset.com'
        token.payload.aud = aud
        //alternative to scope claim
        token.payload.scp = ['daml_ledger_api']

        // Set token expiration to 1 hour from now
        const now = Math.floor(Date.now() / 1000)
        token.payload.exp = now + 3600
        token.payload.iat = now
    })
}

main()
