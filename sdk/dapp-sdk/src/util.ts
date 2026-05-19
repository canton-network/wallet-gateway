// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { popup } from '@canton-network/core-wallet-ui-components'
import { removeKernelDiscovery, removeKernelSession } from './storage'
import { SIWXMessageParams } from './adapter/walletconnect-adapter'

export const clearAllLocalState = ({
    closePopup,
}: { closePopup?: boolean } = {}) => {
    removeKernelSession()
    removeKernelDiscovery()
    if (closePopup) {
        popup.close()
    }
}

interface ComposeSIWXMessageParams extends SIWXMessageParams {
    chainId: string
    accountAddress: string
}

export const composeSIWXMessage = (
    params: ComposeSIWXMessageParams
): string => {
    {
        const networkName = 'Canton'

        return [
            `${params.domain} wants you to sign in with your ${networkName} account:`,
            params.accountAddress,
            params.statement ? `\n${params.statement}\n` : '',
            `URI: ${params.uri}`,
            `Version: ${params.version}`,
            `Chain ID: ${params.chainId}`,
            `Nonce: ${params.nonce}`,
            params.issuedAt && `Issued At: ${params.issuedAt}`,
            params.expirationTime &&
                `Expiration Time: ${params.expirationTime}`,
            params.notBefore && `Not Before: ${params.notBefore}`,
            params.requestId && `Request ID: ${params.requestId}`,
            params.resources?.length &&
                params.resources.reduce(
                    (acc: string, resource: string) => `${acc}\n- ${resource}`,
                    'Resources:'
                ),
        ]
            .filter((line) => typeof line === 'string')
            .join('\n')
            .trim()
    }
}
