// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { PartyId } from '@canton-network/core-types'
import { TokenNamespaceConfig } from '../../../sdk.js'
import {
    Beneficiaries,
    FEATURED_APP_DELEGATE_PROXY_INTERFACE_ID,
} from '@canton-network/core-token-standard'
import { localNetStaticConfig } from '../../../../config.js'
import { LedgerTypes } from '../../../sdk.js'
import { FeaturedAppRight } from '../../amulet/types.js'
import { TokenStandardService } from '@canton-network/core-token-standard-service'
import { LedgerNamespace } from '../../ledger/index.js'

type ProxyDelegationCommandArgs = {
    proxyCid: string
    transferInstructionCid: string
    registryUrl?: URL
    featuredAppRight: FeaturedAppRight
    beneficiaries?: Beneficiaries[]
}

type ProxyDelegationCommand = 'accept' | 'reject' | 'withdraw'

type ProxyDelegationCommandWrapperFunction = (
    args: ProxyDelegationCommandArgs,
    cb: TokenStandardService['transfer'][
        | 'exerciseDelegateProxyTransferInstructioWithdraw'
        | 'exerciseDelegateProxyTransferInstructionAccept'
        | 'exerciseDelegateProxyTransferInstructionReject']
) => Promise<
    [
        { ExerciseCommand: LedgerTypes['ExerciseCommand'] },
        LedgerTypes['DisclosedContract'][],
    ]
>

type ProxyDelegationCommands = {
    [K in ProxyDelegationCommand]: (
        args: ProxyDelegationCommandArgs
    ) => ReturnType<ProxyDelegationCommandWrapperFunction>
}

export class ProxyDelegationNamespace {
    private readonly ledger: LedgerNamespace
    constructor(private readonly ctx: TokenNamespaceConfig) {
        this.ledger = new LedgerNamespace(ctx.commonCtx)
    }

    public async create(delegateParty: PartyId) {
        const command = {
            CreateCommand: {
                templateId: FEATURED_APP_DELEGATE_PROXY_INTERFACE_ID,
                createArguments: {
                    provider: this.ctx.validatorParty,
                    delegate: delegateParty,
                },
            },
        }

        return await this.ledger.internal.submit({
            commands: [command],
            actAs: [this.ctx.validatorParty],
        })
    }

    public commands: ProxyDelegationCommands = {
        accept: (args) =>
            this.commandWrapper(
                args,
                this.ctx.tokenStandardService.transfer.exerciseDelegateProxyTransferInstructionAccept.bind(
                    this.ctx.tokenStandardService.transfer
                )
            ),

        reject: (args) =>
            this.commandWrapper(
                args,
                this.ctx.tokenStandardService.transfer.exerciseDelegateProxyTransferInstructionReject.bind(
                    this.ctx.tokenStandardService.transfer
                )
            ),

        withdraw: (args) =>
            this.commandWrapper(
                args,
                this.ctx.tokenStandardService.transfer.exerciseDelegateProxyTransferInstructioWithdraw.bind(
                    this.ctx.tokenStandardService.transfer
                )
            ),
    }

    private commandWrapper: ProxyDelegationCommandWrapperFunction = async (
        args,
        cb
    ) => {
        const {
            proxyCid,
            transferInstructionCid,
            featuredAppRight,
            beneficiaries = [],
            registryUrl = localNetStaticConfig.LOCALNET_REGISTRY_API_URL,
        } = args

        const defaultBeneficiary: Beneficiaries = {
            beneficiary: this.ctx.validatorParty,
            weight: beneficiaries.reduce(
                (acc, beneficiary) => acc - beneficiary.weight,
                1
            ),
        }

        const [command, disclosedContracts] = await cb(
            proxyCid,
            transferInstructionCid,
            registryUrl,
            featuredAppRight.contract_id,
            [...beneficiaries, defaultBeneficiary]
        )

        return [
            {
                ExerciseCommand: command,
            },
            [
                ...disclosedContracts,
                this.createFeaturedAppDisclosedContract(args),
            ],
        ]
    }

    private createFeaturedAppDisclosedContract(
        args: ProxyDelegationCommandArgs
    ) {
        const { featuredAppRight } = args
        return {
            templateId: featuredAppRight.template_id,
            contractId: featuredAppRight.contract_id,
            createdEventBlob: featuredAppRight.created_event_blob,
        }
    }
}
