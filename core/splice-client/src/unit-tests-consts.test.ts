// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

export function makeAmuletRulesResponse(
    isDevNet: boolean,
    withFutureValues: boolean = false
) {
    return {
        data: {
            amulet_rules: {
                contract: {
                    template_id:
                        'a31be0483f3175647053f28965a4e6d97e3dbc433ea2338be303fae69bbcff6a:Splice.AmuletRules:AmuletRules',
                    contract_id:
                        '007d9acc79005fa57fe80d45cdb3b69146de88c5ea282c11cd9072d20e7e8bed29ca1212200c89b843291b2ea2acf8f30d3c0202ad871a21f8fd9cf239ac40c56bf8127f95',
                    payload: {
                        dso: 'DSO::1220c0e3494aacc431feb89cde65d265e904019a48e11ff16ad5d43dd15c1a33d3db',
                        configSchedule: {
                            initialValue: {
                                packageConfig: {
                                    amuletNameService: '0.1.19',
                                    walletPayments: '0.1.18',
                                    dsoGovernance: '0.1.24',
                                    validatorLifecycle: '0.1.7',
                                    amulet: '0.1.18',
                                    wallet: '0.1.19',
                                },
                                externalPartyConfigStateTickDuration: null,
                                decentralizedSynchronizer: {
                                    requiredSynchronizers: {
                                        map: [
                                            [
                                                'global-domain::1220c0e3494aacc431feb89cde65d265e904019a48e11ff16ad5d43dd15c1a33d3db',
                                                {},
                                            ],
                                        ],
                                    },
                                    activeSynchronizer:
                                        'global-domain::1220c0e3494aacc431feb89cde65d265e904019a48e11ff16ad5d43dd15c1a33d3db',
                                    fees: {
                                        baseRateTrafficLimits: {
                                            burstAmount: '400000',
                                            burstWindow: {
                                                microseconds: '1200000000',
                                            },
                                        },
                                        extraTrafficPrice: '16.67',
                                        readVsWriteScalingFactor: '4',
                                        minTopupAmount: '200000',
                                    },
                                },
                                transferConfig: {
                                    holdingFee: {
                                        rate: '0.0000190259',
                                    },
                                    extraFeaturedAppRewardAmount: '1.0',
                                    maxNumInputs: '100',
                                    lockHolderFee: {
                                        fee: '0.0',
                                    },
                                    createFee: {
                                        fee: '0.0',
                                    },
                                    maxNumLockHolders: '50',
                                    transferFee: {
                                        initialRate: '0.0',
                                        steps: [],
                                    },
                                    maxNumOutputs: '100',
                                },
                                optDevelopmentFundManager: null,
                                transferPreapprovalFee: null,
                                issuanceCurve: {
                                    initialValue: {
                                        validatorRewardPercentage: '0.05',
                                        optDevelopmentFundPercentage: null,
                                        unfeaturedAppRewardCap: '0.6',
                                        appRewardPercentage: '0.15',
                                        featuredAppRewardCap: '100.0',
                                        amuletToIssuePerYear: '40000000000.0',
                                        validatorRewardCap: '0.2',
                                        optValidatorFaucetCap: '2.85',
                                    },
                                    futureValues: [
                                        {
                                            _1: {
                                                microseconds: '15768000000000',
                                            },
                                            _2: {
                                                validatorRewardPercentage:
                                                    '0.12',
                                                optDevelopmentFundPercentage:
                                                    null,
                                                unfeaturedAppRewardCap: '0.6',
                                                appRewardPercentage: '0.4',
                                                featuredAppRewardCap: '100.0',
                                                amuletToIssuePerYear:
                                                    '20000000000.0',
                                                validatorRewardCap: '0.2',
                                                optValidatorFaucetCap: '2.85',
                                            },
                                        },
                                        {
                                            _1: {
                                                microseconds: '47304000000000',
                                            },
                                            _2: {
                                                validatorRewardPercentage:
                                                    '0.18',
                                                optDevelopmentFundPercentage:
                                                    null,
                                                unfeaturedAppRewardCap: '0.6',
                                                appRewardPercentage: '0.62',
                                                featuredAppRewardCap: '100.0',
                                                amuletToIssuePerYear:
                                                    '10000000000.0',
                                                validatorRewardCap: '0.2',
                                                optValidatorFaucetCap: '2.85',
                                            },
                                        },
                                        {
                                            _1: {
                                                microseconds: '157680000000000',
                                            },
                                            _2: {
                                                validatorRewardPercentage:
                                                    '0.21',
                                                optDevelopmentFundPercentage:
                                                    null,
                                                unfeaturedAppRewardCap: '0.6',
                                                appRewardPercentage: '0.69',
                                                featuredAppRewardCap: '100.0',
                                                amuletToIssuePerYear:
                                                    '5000000000.0',
                                                validatorRewardCap: '0.2',
                                                optValidatorFaucetCap: '2.85',
                                            },
                                        },
                                        {
                                            _1: {
                                                microseconds: '315360000000000',
                                            },
                                            _2: {
                                                validatorRewardPercentage:
                                                    '0.2',
                                                optDevelopmentFundPercentage:
                                                    null,
                                                unfeaturedAppRewardCap: '0.6',
                                                appRewardPercentage: '0.75',
                                                featuredAppRewardCap: '100.0',
                                                amuletToIssuePerYear:
                                                    '2500000000.0',
                                                validatorRewardCap: '0.2',
                                                optValidatorFaucetCap: '2.85',
                                            },
                                        },
                                    ],
                                },
                                featuredAppActivityMarkerAmount: '1.0',
                                tickDuration: {
                                    microseconds: '600000000',
                                },
                            },
                            futureValues: withFutureValues ? futureValues : [],
                        },
                        isDevNet: isDevNet,
                        contractStateSchemaVersion: null,
                    },
                    created_event_blob:
                        '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',
                    created_at: '2026-05-06T17:01:42.567288Z',
                },
                domain_id:
                    'global-domain::1220c0e3494aacc431feb89cde65d265e904019a48e11ff16ad5d43dd15c1a33d3db',
            },
        },
        error: undefined,
    }
}

const futureValues = [
    {
        packageConfig: {
            amuletNameService: '0.1.19',
            walletPayments: '0.1.18',
            dsoGovernance: '0.1.24',
            validatorLifecycle: '0.1.7',
            amulet: '0.1.18',
            wallet: '0.1.19',
        },
        externalPartyConfigStateTickDuration: null,
        decentralizedSynchronizer: {
            requiredSynchronizers: {
                map: [['global-domain::newsynchronizer', {}]],
            },
            activeSynchronizer: 'global-domain::newsynchronizer',
            fees: {
                baseRateTrafficLimits: {
                    burstAmount: '400000',
                    burstWindow: {
                        microseconds: '1200000000',
                    },
                },
                extraTrafficPrice: '16.67',
                readVsWriteScalingFactor: '4',
                minTopupAmount: '200000',
            },
        },
        transferConfig: {
            holdingFee: {
                rate: '0.0000190259',
            },
            extraFeaturedAppRewardAmount: '1.0',
            maxNumInputs: '100',
            lockHolderFee: {
                fee: '0.0',
            },
            createFee: {
                fee: '0.0',
            },
            maxNumLockHolders: '50',
            transferFee: {
                initialRate: '0.0',
                steps: [],
            },
            maxNumOutputs: '100',
        },
        optDevelopmentFundManager: null,
        transferPreapprovalFee: null,
        issuanceCurve: {
            initialValue: {
                validatorRewardPercentage: '0.05',
                optDevelopmentFundPercentage: null,
                unfeaturedAppRewardCap: '0.6',
                appRewardPercentage: '0.15',
                featuredAppRewardCap: '100.0',
                amuletToIssuePerYear: '40000000000.0',
                validatorRewardCap: '0.2',
                optValidatorFaucetCap: '2.85',
            },
            futureValues: [
                {
                    _1: {
                        microseconds: '15768000000000',
                    },
                    _2: {
                        validatorRewardPercentage: '0.12',
                        optDevelopmentFundPercentage: null,
                        unfeaturedAppRewardCap: '0.6',
                        appRewardPercentage: '0.4',
                        featuredAppRewardCap: '100.0',
                        amuletToIssuePerYear: '20000000000.0',
                        validatorRewardCap: '0.2',
                        optValidatorFaucetCap: '2.85',
                    },
                },
                {
                    _1: {
                        microseconds: '47304000000000',
                    },
                    _2: {
                        validatorRewardPercentage: '0.18',
                        optDevelopmentFundPercentage: null,
                        unfeaturedAppRewardCap: '0.6',
                        appRewardPercentage: '0.62',
                        featuredAppRewardCap: '100.0',
                        amuletToIssuePerYear: '10000000000.0',
                        validatorRewardCap: '0.2',
                        optValidatorFaucetCap: '2.85',
                    },
                },
                {
                    _1: {
                        microseconds: '157680000000000',
                    },
                    _2: {
                        validatorRewardPercentage: '0.21',
                        optDevelopmentFundPercentage: null,
                        unfeaturedAppRewardCap: '0.6',
                        appRewardPercentage: '0.69',
                        featuredAppRewardCap: '100.0',
                        amuletToIssuePerYear: '5000000000.0',
                        validatorRewardCap: '0.2',
                        optValidatorFaucetCap: '2.85',
                    },
                },
                {
                    _1: {
                        microseconds: '315360000000000',
                    },
                    _2: {
                        validatorRewardPercentage: '0.2',
                        optDevelopmentFundPercentage: null,
                        unfeaturedAppRewardCap: '0.6',
                        appRewardPercentage: '0.75',
                        featuredAppRewardCap: '100.0',
                        amuletToIssuePerYear: '2500000000.0',
                        validatorRewardCap: '0.2',
                        optValidatorFaucetCap: '2.85',
                    },
                },
            ],
        },
        featuredAppActivityMarkerAmount: '1.0',
        tickDuration: {
            microseconds: '600000000',
        },
    },
]

export function makeOpenAndIssuingMiningRoundsResponse() {
    return {
        data: {
            open_mining_rounds: [
                {
                    contract: {
                        template_id:
                            'a31be0483f3175647053f28965a4e6d97e3dbc433ea2338be303fae69bbcff6a:Splice.Round:OpenMiningRound',
                        contract_id:
                            '0022776a7a2956ab8f280c144fa186b6792f7e6ce7b8267df5c95e10efd50a9ef6ca12122076644e580612da0ccac6e8361c08f6b7300cf66450a14cf964cff2b7ba0fe2f8',
                        payload: {
                            dso: 'DSO::1220c0e3494aacc431feb89cde65d265e904019a48e11ff16ad5d43dd15c1a33d3db',
                            tickDuration: {
                                microseconds: '600000000',
                            },
                            issuingFor: {
                                microseconds: '7200000000',
                            },
                            amuletPrice: '0.005',
                            issuanceConfig: {
                                validatorRewardPercentage: '0.05',
                                optDevelopmentFundPercentage: null,
                                unfeaturedAppRewardCap: '0.6',
                                appRewardPercentage: '0.15',
                                featuredAppRewardCap: '100.0',
                                amuletToIssuePerYear: '40000000000.0',
                                validatorRewardCap: '0.2',
                                optValidatorFaucetCap: '2.85',
                            },
                            opensAt: '2026-05-06T18:55:30.287791Z',
                            transferConfigUsd: {
                                holdingFee: {
                                    rate: '0.0000190259',
                                },
                                extraFeaturedAppRewardAmount: '1.0',
                                maxNumInputs: '100',
                                lockHolderFee: {
                                    fee: '0.0',
                                },
                                createFee: {
                                    fee: '0.0',
                                },
                                maxNumLockHolders: '50',
                                transferFee: {
                                    initialRate: '0.0',
                                    steps: [],
                                },
                                maxNumOutputs: '100',
                            },
                            targetClosesAt: '2026-05-06T19:15:30.287791Z',
                            round: {
                                number: '12',
                            },
                        },
                        created_event_blob:
                            'CgMyLjESkwYKRQAid2p6KVarjygMFE+hhrZ5L35s57gmffXJXhDv1Qqe9soSEiB2ZE5YBhLaDMrG6DYcCPa3MAz2ZFChTPlkz/K3ug/i+BINc3BsaWNlLWFtdWxldBpiCkBhMzFiZTA0ODNmMzE3NTY0NzA1M2YyODk2NWE0ZTZkOTdlM2RiYzQzM2VhMjMzOGJlMzAzZmFlNjliYmNmZjZhEgZTcGxpY2USBVJvdW5kGg9PcGVuTWluaW5nUm91bmQi1gNq0wMKTQpLOklEU086OjEyMjBjMGUzNDk0YWFjYzQzMWZlYjg5Y2RlNjVkMjY1ZTkwNDAxOWE0OGUxMWZmMTZhZDVkNDNkZDE1YzFhMzNkM2RiCgoKCGoGCgQKAhgYChAKDjIMMC4wMDUwMDAwMDAwCgsKCSmv0Cu1KlEGAAoLCgkpr1yy/CpRBgAKDgoMagoKCAoGGICgutI1CpIBCo8BaowBChYKFGoSChAKDjIMMC4wMDAwMDAwMDAwChYKFGoSChAKDjIMMC4wMDAwMTkwMjU5ChwKGmoYChAKDjIMMC4wMDAwMDAwMDAwCgQKAloAChYKFGoSChAKDjIMMC4wMDAwMDAwMDAwChAKDjIMMS4wMDAwMDAwMDAwCgUKAxjIAQoFCgMYyAEKBAoCGGQKlAEKkQFqjgEKGgoYMhY0MDAwMDAwMDAwMC4wMDAwMDAwMDAwChAKDjIMMC4wNTAwMDAwMDAwChAKDjIMMC4xNTAwMDAwMDAwChAKDjIMMC4yMDAwMDAwMDAwChIKEDIOMTAwLjAwMDAwMDAwMDAKEAoOMgwwLjYwMDAwMDAwMDAKFAoSUhAKDjIMMi44NTAwMDAwMDAwCg4KDGoKCggKBhiAmJq8BCpJRFNPOjoxMjIwYzBlMzQ5NGFhY2M0MzFmZWI4OWNkZTY1ZDI2NWU5MDQwMTlhNDhlMTFmZjE2YWQ1ZDQzZGQxNWMxYTMzZDNkYjmvimiRKlEGAEIqCiYKJAgBEiAj5rNZW6SiyT+MTbvKONh6OJAGce2yqn+kYJGnwdex4RAe',
                        created_at: '2026-05-06T18:45:30.287791Z',
                    },
                    domain_id:
                        'global-domain::1220c0e3494aacc431feb89cde65d265e904019a48e11ff16ad5d43dd15c1a33d3db',
                },
                {
                    contract: {
                        template_id:
                            'a31be0483f3175647053f28965a4e6d97e3dbc433ea2338be303fae69bbcff6a:Splice.Round:OpenMiningRound',
                        contract_id:
                            '00c98bc7e876ea6628d3a6f6c57aca3b8aff9565c323890bc7d0790d68f73364bcca121220008a8bff24637750748eb29054770922d4a249cefdd038019acd052026bbe4ee',
                        payload: {
                            dso: 'DSO::1220c0e3494aacc431feb89cde65d265e904019a48e11ff16ad5d43dd15c1a33d3db',
                            tickDuration: {
                                microseconds: '600000000',
                            },
                            issuingFor: {
                                microseconds: '7800000000',
                            },
                            amuletPrice: '0.005',
                            issuanceConfig: {
                                validatorRewardPercentage: '0.05',
                                optDevelopmentFundPercentage: null,
                                unfeaturedAppRewardCap: '0.6',
                                appRewardPercentage: '0.15',
                                featuredAppRewardCap: '100.0',
                                amuletToIssuePerYear: '40000000000.0',
                                validatorRewardCap: '0.2',
                                optValidatorFaucetCap: '2.85',
                            },
                            opensAt: '2026-05-06T19:06:05.437897Z',
                            transferConfigUsd: {
                                holdingFee: {
                                    rate: '0.0000190259',
                                },
                                extraFeaturedAppRewardAmount: '1.0',
                                maxNumInputs: '100',
                                lockHolderFee: {
                                    fee: '0.0',
                                },
                                createFee: {
                                    fee: '0.0',
                                },
                                maxNumLockHolders: '50',
                                transferFee: {
                                    initialRate: '0.0',
                                    steps: [],
                                },
                                maxNumOutputs: '100',
                            },
                            targetClosesAt: '2026-05-06T19:26:05.437897Z',
                            round: {
                                number: '13',
                            },
                        },
                        created_event_blob:
                            'CgMyLjESkwYKRQDJi8fodupmKNOm9sV6yjuK/5VlwyOJC8fQeQ1o9zNkvMoSEiAAiov/JGN3UHSOspBUdwki1KJJzv3QOAGazQUgJrvk7hINc3BsaWNlLWFtdWxldBpiCkBhMzFiZTA0ODNmMzE3NTY0NzA1M2YyODk2NWE0ZTZkOTdlM2RiYzQzM2VhMjMzOGJlMzAzZmFlNjliYmNmZjZhEgZTcGxpY2USBVJvdW5kGg9PcGVuTWluaW5nUm91bmQi1gNq0wMKTQpLOklEU086OjEyMjBjMGUzNDk0YWFjYzQzMWZlYjg5Y2RlNjVkMjY1ZTkwNDAxOWE0OGUxMWZmMTZhZDVkNDNkZDE1YzFhMzNkM2RiCgoKCGoGCgQKAhgaChAKDjIMMC4wMDUwMDAwMDAwCgsKCSnJbwfbKlEGAAoLCgkpyfuNIitRBgAKDgoMagoKCAoGGIC41I46CpIBCo8BaowBChYKFGoSChAKDjIMMC4wMDAwMDAwMDAwChYKFGoSChAKDjIMMC4wMDAwMTkwMjU5ChwKGmoYChAKDjIMMC4wMDAwMDAwMDAwCgQKAloAChYKFGoSChAKDjIMMC4wMDAwMDAwMDAwChAKDjIMMS4wMDAwMDAwMDAwCgUKAxjIAQoFCgMYyAEKBAoCGGQKlAEKkQFqjgEKGgoYMhY0MDAwMDAwMDAwMC4wMDAwMDAwMDAwChAKDjIMMC4wNTAwMDAwMDAwChAKDjIMMC4xNTAwMDAwMDAwChAKDjIMMC4yMDAwMDAwMDAwChIKEDIOMTAwLjAwMDAwMDAwMDAKEAoOMgwwLjYwMDAwMDAwMDAKFAoSUhAKDjIMMi44NTAwMDAwMDAwCg4KDGoKCggKBhiAmJq8BCpJRFNPOjoxMjIwYzBlMzQ5NGFhY2M0MzFmZWI4OWNkZTY1ZDI2NWU5MDQwMTlhNDhlMTFmZjE2YWQ1ZDQzZGQxNWMxYTMzZDNkYjnJKUS3KlEGAEIqCiYKJAgBEiAMp/Rp2DThkqaUeveoWPKV+kuCKSXdhFew7M7KzZMcUxAe',
                        created_at: '2026-05-06T18:56:05.437897Z',
                    },
                    domain_id:
                        'global-domain::1220c0e3494aacc431feb89cde65d265e904019a48e11ff16ad5d43dd15c1a33d3db',
                },
                {
                    contract: {
                        template_id:
                            'a31be0483f3175647053f28965a4e6d97e3dbc433ea2338be303fae69bbcff6a:Splice.Round:OpenMiningRound',
                        contract_id:
                            '00ce1dee5b9ee39c7c17abcc76ef8c79152ac9abb69da630e0857aacef7eb8b5daca121220d8b944329b10b410d3335d3f16afba51c38c00179208332527cec69864fa4c24',
                        payload: {
                            dso: 'DSO::1220c0e3494aacc431feb89cde65d265e904019a48e11ff16ad5d43dd15c1a33d3db',
                            tickDuration: {
                                microseconds: '600000000',
                            },
                            issuingFor: {
                                microseconds: '8400000000',
                            },
                            amuletPrice: '0.005',
                            issuanceConfig: {
                                validatorRewardPercentage: '0.05',
                                optDevelopmentFundPercentage: null,
                                unfeaturedAppRewardCap: '0.6',
                                appRewardPercentage: '0.15',
                                featuredAppRewardCap: '100.0',
                                amuletToIssuePerYear: '40000000000.0',
                                validatorRewardCap: '0.2',
                                optValidatorFaucetCap: '2.85',
                            },
                            opensAt: '2026-05-06T19:16:40.874716Z',
                            transferConfigUsd: {
                                holdingFee: {
                                    rate: '0.0000190259',
                                },
                                extraFeaturedAppRewardAmount: '1.0',
                                maxNumInputs: '100',
                                lockHolderFee: {
                                    fee: '0.0',
                                },
                                createFee: {
                                    fee: '0.0',
                                },
                                maxNumLockHolders: '50',
                                transferFee: {
                                    initialRate: '0.0',
                                    steps: [],
                                },
                                maxNumOutputs: '100',
                            },
                            targetClosesAt: '2026-05-06T19:36:40.874716Z',
                            round: {
                                number: '14',
                            },
                        },
                        created_event_blob:
                            'CgMyLjESkwYKRQDOHe5bnuOcfBerzHbvjHkVKsmrtp2mMOCFeqzvfri12soSEiDYuUQymxC0ENMzXT8Wr7pRw4wAF5IIMyUnzsaYZPpMJBINc3BsaWNlLWFtdWxldBpiCkBhMzFiZTA0ODNmMzE3NTY0NzA1M2YyODk2NWE0ZTZkOTdlM2RiYzQzM2VhMjMzOGJlMzAzZmFlNjliYmNmZjZhEgZTcGxpY2USBVJvdW5kGg9PcGVuTWluaW5nUm91bmQi1gNq0wMKTQpLOklEU086OjEyMjBjMGUzNDk0YWFjYzQzMWZlYjg5Y2RlNjVkMjY1ZTkwNDAxOWE0OGUxMWZmMTZhZDVkNDNkZDE1YzFhMzNkM2RiCgoKCGoGCgQKAhgcChAKDjIMMC4wMDUwMDAwMDAwCgsKCSncbucAK1EGAAoLCgkp3PptSCtRBgAKDgoMagoKCAoGGIDQ7so+CpIBCo8BaowBChYKFGoSChAKDjIMMC4wMDAwMDAwMDAwChYKFGoSChAKDjIMMC4wMDAwMTkwMjU5ChwKGmoYChAKDjIMMC4wMDAwMDAwMDAwCgQKAloAChYKFGoSChAKDjIMMC4wMDAwMDAwMDAwChAKDjIMMS4wMDAwMDAwMDAwCgUKAxjIAQoFCgMYyAEKBAoCGGQKlAEKkQFqjgEKGgoYMhY0MDAwMDAwMDAwMC4wMDAwMDAwMDAwChAKDjIMMC4wNTAwMDAwMDAwChAKDjIMMC4xNTAwMDAwMDAwChAKDjIMMC4yMDAwMDAwMDAwChIKEDIOMTAwLjAwMDAwMDAwMDAKEAoOMgwwLjYwMDAwMDAwMDAKFAoSUhAKDjIMMi44NTAwMDAwMDAwCg4KDGoKCggKBhiAmJq8BCpJRFNPOjoxMjIwYzBlMzQ5NGFhY2M0MzFmZWI4OWNkZTY1ZDI2NWU5MDQwMTlhNDhlMTFmZjE2YWQ1ZDQzZGQxNWMxYTMzZDNkYjncKCTdKlEGAEIqCiYKJAgBEiCI6Iu3bkUTjvBkb6P1aiLT+lh//ENgCdOWmUrAHOwyNxAe',
                        created_at: '2026-05-06T19:06:40.874716Z',
                    },
                    domain_id:
                        'global-domain::1220c0e3494aacc431feb89cde65d265e904019a48e11ff16ad5d43dd15c1a33d3db',
                },
            ],
            issuing_mining_rounds: [
                {
                    contract: {
                        template_id:
                            'a31be0483f3175647053f28965a4e6d97e3dbc433ea2338be303fae69bbcff6a:Splice.Round:IssuingMiningRound',
                        contract_id:
                            '0069518486723ad566aba135043f5e6731cfb9acd25239ebadddba2ac05ef68a34ca12122078a0a8f998a268009857d5f4db267ed30a5539c994d2883f6e98e02b3c529e9b',
                        payload: {
                            dso: 'DSO::1220c0e3494aacc431feb89cde65d265e904019a48e11ff16ad5d43dd15c1a33d3db',
                            optIssuancePerValidatorFaucetCoupon: '570.0',
                            issuancePerFeaturedAppRewardCoupon: '100.0',
                            opensAt: '2026-05-06T18:55:36.318881Z',
                            issuancePerSvRewardCoupon: '57.8386605784',
                            targetClosesAt: '2026-05-06T19:15:36.318881Z',
                            issuancePerUnfeaturedAppRewardCoupon: '0.6',
                            round: {
                                number: '9',
                            },
                            issuancePerValidatorRewardCoupon: '0.2',
                        },
                        created_event_blob:
                            'CgMyLjESmwQKRQBpUYSGcjrVZquhNQQ/Xmcxz7ms0lI5663duirAXvaKNMoSEiB4oKj5mKJoAJhX1fTbJn7TClU5yZTSiD9umOArPFKemxINc3BsaWNlLWFtdWxldBplCkBhMzFiZTA0ODNmMzE3NTY0NzA1M2YyODk2NWE0ZTZkOTdlM2RiYzQzM2VhMjMzOGJlMzAzZmFlNjliYmNmZjZhEgZTcGxpY2USBVJvdW5kGhJJc3N1aW5nTWluaW5nUm91bmQi2wFq2AEKTQpLOklEU086OjEyMjBjMGUzNDk0YWFjYzQzMWZlYjg5Y2RlNjVkMjY1ZTkwNDAxOWE0OGUxMWZmMTZhZDVkNDNkZDE1YzFhMzNkM2RiCgoKCGoGCgQKAhgSChAKDjIMMC4yMDAwMDAwMDAwChIKEDIOMTAwLjAwMDAwMDAwMDAKEAoOMgwwLjYwMDAwMDAwMDAKEQoPMg01Ny44Mzg2NjA1Nzg0CgsKCSmh14e1KlEGAAoLCgkpoWMO/SpRBgAKFgoUUhIKEDIONTcwLjAwMDAwMDAwMDAqSURTTzo6MTIyMGMwZTM0OTRhYWNjNDMxZmViODljZGU2NWQyNjVlOTA0MDE5YTQ4ZTExZmYxNmFkNWQ0M2RkMTVjMWEzM2QzZGI5oZHEkSpRBgBCKgomCiQIARIg1mtnTY6WsX0oxhf3b2cZDifzdYjngyJyQF3I7iDuvQEQHg==',
                        created_at: '2026-05-06T18:45:36.318881Z',
                    },
                    domain_id:
                        'global-domain::1220c0e3494aacc431feb89cde65d265e904019a48e11ff16ad5d43dd15c1a33d3db',
                },
                {
                    contract: {
                        template_id:
                            'a31be0483f3175647053f28965a4e6d97e3dbc433ea2338be303fae69bbcff6a:Splice.Round:IssuingMiningRound',
                        contract_id:
                            '008e5a42a6a7c7f2f2add270e15673f9126728d6b16cd0a87cd35fc40c0f008cd4ca121220827929e0036dc9cb44fbb5d11ccc3bdfd815b50a000eeae7bd7c20e7f449dce5',
                        payload: {
                            dso: 'DSO::1220c0e3494aacc431feb89cde65d265e904019a48e11ff16ad5d43dd15c1a33d3db',
                            optIssuancePerValidatorFaucetCoupon: '570.0',
                            issuancePerFeaturedAppRewardCoupon: '100.0',
                            opensAt: '2026-05-06T19:06:32.851099Z',
                            issuancePerSvRewardCoupon: '57.8386605784',
                            targetClosesAt: '2026-05-06T19:26:32.851099Z',
                            issuancePerUnfeaturedAppRewardCoupon: '0.6',
                            round: {
                                number: '10',
                            },
                            issuancePerValidatorRewardCoupon: '0.2',
                        },
                        created_event_blob:
                            'CgMyLjESmwQKRQCOWkKmp8fy8q3ScOFWc/kSZyjWsWzQqHzTX8QMDwCM1MoSEiCCeSngA23Jy0T7tdEczDvf2BW1CgAO6ue9fCDn9Enc5RINc3BsaWNlLWFtdWxldBplCkBhMzFiZTA0ODNmMzE3NTY0NzA1M2YyODk2NWE0ZTZkOTdlM2RiYzQzM2VhMjMzOGJlMzAzZmFlNjliYmNmZjZhEgZTcGxpY2USBVJvdW5kGhJJc3N1aW5nTWluaW5nUm91bmQi2wFq2AEKTQpLOklEU086OjEyMjBjMGUzNDk0YWFjYzQzMWZlYjg5Y2RlNjVkMjY1ZTkwNDAxOWE0OGUxMWZmMTZhZDVkNDNkZDE1YzFhMzNkM2RiCgoKCGoGCgQKAhgUChAKDjIMMC4yMDAwMDAwMDAwChIKEDIOMTAwLjAwMDAwMDAwMDAKEAoOMgwwLjYwMDAwMDAwMDAKEQoPMg01Ny44Mzg2NjA1Nzg0CgsKCSmbuqncKlEGAAoLCgkpm0YwJCtRBgAKFgoUUhIKEDIONTcwLjAwMDAwMDAwMDAqSURTTzo6MTIyMGMwZTM0OTRhYWNjNDMxZmViODljZGU2NWQyNjVlOTA0MDE5YTQ4ZTExZmYxNmFkNWQ0M2RkMTVjMWEzM2QzZGI5m3TmuCpRBgBCKgomCiQIARIgy8VhuWcdFxmZV8DRZiHVVH/8IDUQSuCVO+wRdHYnsbYQHg==',
                        created_at: '2026-05-06T18:56:32.851099Z',
                    },
                    domain_id:
                        'global-domain::1220c0e3494aacc431feb89cde65d265e904019a48e11ff16ad5d43dd15c1a33d3db',
                },
                {
                    contract: {
                        template_id:
                            'a31be0483f3175647053f28965a4e6d97e3dbc433ea2338be303fae69bbcff6a:Splice.Round:IssuingMiningRound',
                        contract_id:
                            '003db070fa51f5ff18e77cf4da81e04afd7a79850d6874b7af4045c766a0f41d42ca121220ee6001780f6a2e8373d0844553b4168d5480b8601a95adf096a616bc243024a8',
                        payload: {
                            dso: 'DSO::1220c0e3494aacc431feb89cde65d265e904019a48e11ff16ad5d43dd15c1a33d3db',
                            optIssuancePerValidatorFaucetCoupon: '570.0',
                            issuancePerFeaturedAppRewardCoupon: '100.0',
                            opensAt: '2026-05-06T19:17:04.549172Z',
                            issuancePerSvRewardCoupon: '57.8386605784',
                            targetClosesAt: '2026-05-06T19:37:04.549172Z',
                            issuancePerUnfeaturedAppRewardCoupon: '0.6',
                            round: {
                                number: '11',
                            },
                            issuancePerValidatorRewardCoupon: '0.2',
                        },
                        created_event_blob:
                            'CgMyLjESmwQKRQA9sHD6UfX/GOd89NqB4Er9enmFDWh0t69ARcdmoPQdQsoSEiDuYAF4D2oug3PQhEVTtBaNVIC4YBqVrfCWpha8JDAkqBINc3BsaWNlLWFtdWxldBplCkBhMzFiZTA0ODNmMzE3NTY0NzA1M2YyODk2NWE0ZTZkOTdlM2RiYzQzM2VhMjMzOGJlMzAzZmFlNjliYmNmZjZhEgZTcGxpY2USBVJvdW5kGhJJc3N1aW5nTWluaW5nUm91bmQi2wFq2AEKTQpLOklEU086OjEyMjBjMGUzNDk0YWFjYzQzMWZlYjg5Y2RlNjVkMjY1ZTkwNDAxOWE0OGUxMWZmMTZhZDVkNDNkZDE1YzFhMzNkM2RiCgoKCGoGCgQKAhgWChAKDjIMMC4yMDAwMDAwMDAwChIKEDIOMTAwLjAwMDAwMDAwMDAKEAoOMgwwLjYwMDAwMDAwMDAKEQoPMg01Ny44Mzg2NjA1Nzg0CgsKCSk0rVACK1EGAAoLCgkpNDnXSStRBgAKFgoUUhIKEDIONTcwLjAwMDAwMDAwMDAqSURTTzo6MTIyMGMwZTM0OTRhYWNjNDMxZmViODljZGU2NWQyNjVlOTA0MDE5YTQ4ZTExZmYxNmFkNWQ0M2RkMTVjMWEzM2QzZGI5NGeN3ipRBgBCKgomCiQIARIgFnZ3C6zi/NFH8R/17c65VGYbQQv1GceU4reaf8ywBUEQHg==',
                        created_at: '2026-05-06T19:07:04.549172Z',
                    },
                    domain_id:
                        'global-domain::1220c0e3494aacc431feb89cde65d265e904019a48e11ff16ad5d43dd15c1a33d3db',
                },
            ],
        },
        error: undefined,
    }
}

//TODO: add function to generate open mining rounds based on time
