// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { vi, describe, it, expect, beforeEach } from 'vitest'

import { AmuletService } from './amulet-service'
import {
    amuletRules,
    activeRoundNormalized,
    renewCommand,
    devnetTapCommand,
} from './amulet-service-consts.test'

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('AmuletService', () => {
    const mockScanProxyClient = {
        get: vi.fn(),
        isDevNet: vi.fn(),
        getAmuletRules: vi.fn(),
        getActiveOpenMiningRound: vi.fn(),
    }
    const mockTokenStandard = {
        get: vi.fn(),
        getInputHoldingsCids: vi.fn(),
        core: {
            toQualifiedMemberId: vi.fn(),
        },
        transfer: {
            fetchTransferFactoryChoiceContext: vi.fn(),
        },
    }
    const mockScanClient = {
        get: vi.fn(),
    }

    let service: AmuletService

    beforeEach(() => {
        vi.resetAllMocks()

        service = new AmuletService(
            mockTokenStandard as any,
            mockScanProxyClient as any,
            mockScanClient as any
        )
    })

    it('should correctly call the scan proxy and return the transfer pre-approval', async () => {
        const mockResponse = {
            transfer_preapproval: {
                expiresAt: '2026-07-27T17:11:02.784Z',
                dso: 'DSO::1220eba34d13ab223f1a933fbde4e760dff9a3a965031151b0918ca9739424406ded',
                contractId:
                    '0022871f63af26ccb13dc48f58d189568618bea77a5e7ff6f49d273096f0eee5b7ca1212200b214acf13730a0296c9910174d26822baf45c52dbb3e09d01a4e428e7a9f1f2',
                templateId:
                    '6c5802f86709a0ad4784af81f0bab40f3070b2f58128d8843da1e1784c147802:Splice.AmuletRules:TransferPreapproval',
            },
        }

        vi.mocked(mockScanProxyClient.get).mockResolvedValue(mockResponse)

        const result = await service.getTransferPreApprovalByParty('party-123')

        expect(mockScanProxyClient.get).toHaveBeenCalledWith(
            '/v0/scan-proxy/transfer-preapprovals/by-party/{party}',
            { path: { party: 'party-123' } }
        )
        expect(result).toEqual(mockResponse.transfer_preapproval)
    })

    it('should correctly call scan proxy and get featured apps by party', async () => {
        const mockResponse = {
            featured_app_right: {
                template_id:
                    '6c5802f86709a0ad4784af81f0bab40f3070b2f58128d8843da1e1784c147802:Splice.Amulet:FeaturedAppRight',
                contract_id:
                    '00eee8c6832ca5d8f0db72f9ab272749f0b68f6a85667734d6683badba0ad08bb3ca121220c31ac9ddba7e520ef4b4ceb22dd80fd8712835d830e2d5cb779972f940adff26',
                payload: {
                    dso: 'DSO::1220eba34d13ab223f1a933fbde4e760dff9a3a965031151b0918ca9739424406ded',
                    provider:
                        'app_user_localnet-localparty-1::1220a317b92f3c8d9deb01f107cb2e87ca4ff7c7b48afa1a8c6b614adaf40caea0fd',
                },
                created_event_blob:
                    'CgMyLjES4QQKRQDu6MaDLKXY8Nty+asnJ0nwto9qhWZ3NNZoO626CtCLs8oSEiDDGsndun5SDvS0zrIt2A/YcSg12DDi1ct3mXL5QK3/JhINc3BsaWNlLWFtdWxldBpkCkA2YzU4MDJmODY3MDlhMGFkNDc4NGFmODFmMGJhYjQwZjMwNzBiMmY1ODEyOGQ4ODQzZGExZTE3ODRjMTQ3ODAyEgZTcGxpY2USBkFtdWxldBoQRmVhdHVyZWRBcHBSaWdodCK8AWq5AQpNCks6SURTTzo6MTIyMGViYTM0ZDEzYWIyMjNmMWE5MzNmYmRlNGU3NjBkZmY5YTNhOTY1MDMxMTUxYjA5MThjYTk3Mzk0MjQ0MDZkZWQKaApmOmRhcHBfdXNlcl9sb2NhbG5ldC1sb2NhbHBhcnR5LTE6OjEyMjBhMzE3YjkyZjNjOGQ5ZGViMDFmMTA3Y2IyZTg3Y2E0ZmY3YzdiNDhhZmExYThjNmI2MTRhZGFmNDBjYWVhMGZkKklEU086OjEyMjBlYmEzNGQxM2FiMjIzZjFhOTMzZmJkZTRlNzYwZGZmOWEzYTk2NTAzMTE1MWIwOTE4Y2E5NzM5NDI0NDA2ZGVkMmRhcHBfdXNlcl9sb2NhbG5ldC1sb2NhbHBhcnR5LTE6OjEyMjBhMzE3YjkyZjNjOGQ5ZGViMDFmMTA3Y2IyZTg3Y2E0ZmY3YzdiNDhhZmExYThjNmI2MTRhZGFmNDBjYWVhMGZkObBCWR6GUAYAQioKJgokCAESILtrzNvaNAlL/f9efHCZuKhyJJGmO5Xg3gVIuebKI15aEB4=',
                created_at: '2026-04-28T14:33:45.269936Z',
            },
        }

        vi.mocked(mockScanProxyClient.get).mockResolvedValue(mockResponse)

        const result =
            await service.getFeaturedAppsByParty('featured-party-123')

        expect(mockScanProxyClient.get).toHaveBeenCalledWith(
            '/v0/scan-proxy/featured-apps/{provider_party_id}',
            { path: { provider_party_id: 'featured-party-123' } }
        )
        expect(result).toEqual(mockResponse.featured_app_right)
    })

    it('should correctly fetch the member traffic status', async () => {
        const mockResponse = {
            traffic_status: {
                actual: { total_consumed: 0, total_limit: 1600000 },
                target: { total_purchased: 1600000 },
            },
        }

        const domainId = 'fakeDomainId'
        const memberId = 'PAR::fakeparticipant'

        vi.mocked(mockScanClient.get).mockResolvedValue(mockResponse)
        vi.mocked(mockTokenStandard.core.toQualifiedMemberId).mockReturnValue(
            /^(PAR|MED)::/.test(memberId) ? memberId : `PAR::${memberId}`
        )

        await service.getMemberTrafficStatus(domainId, memberId)

        expect(mockScanClient.get).toHaveBeenCalledWith(
            '/v0/domains/{domain_id}/members/{member_id}/traffic-status',
            {
                path: {
                    domain_id: domainId,
                    member_id: memberId,
                },
            }
        )
    })

    it('should correctly fetch the member traffic status and prepend PAR to memberId if not supplied', async () => {
        const mockResponse = {
            traffic_status: {
                actual: { total_consumed: 0, total_limit: 1600000 },
                target: { total_purchased: 1600000 },
            },
        }

        const domainId = 'fakeDomainId'
        const memberId = 'fakeparticipant'

        vi.mocked(mockScanClient.get).mockResolvedValue(mockResponse)
        vi.mocked(mockTokenStandard.core.toQualifiedMemberId).mockReturnValue(
            /^(PAR|MED)::/.test(memberId) ? memberId : `PAR::${memberId}`
        )

        await service.getMemberTrafficStatus(domainId, memberId)

        expect(mockScanClient.get).toHaveBeenCalledWith(
            '/v0/domains/{domain_id}/members/{member_id}/traffic-status',
            {
                path: {
                    domain_id: domainId,
                    member_id: `PAR::${memberId}`,
                },
            }
        )
    })

    it('should throw an error if there is no scanClient', async () => {
        const domainId = 'fakeDomainId'
        const memberId = 'PAR::fakeparticipant'

        vi.mocked(mockTokenStandard.core.toQualifiedMemberId).mockReturnValue(
            /^(PAR|MED)::/.test(memberId) ? memberId : `PAR::${memberId}`
        )

        const serviceNoScanClient = new AmuletService(
            mockTokenStandard as any,
            mockScanProxyClient as any,
            undefined
        )

        await expect(
            serviceNoScanClient.getMemberTrafficStatus(domainId, memberId)
        ).rejects.toThrow('Scan API URL was not provided')
    })

    it('should correctly determine devnet', async () => {
        vi.mocked(mockScanProxyClient.isDevNet).mockResolvedValue(true)

        const result = await service.isDevNet()

        expect(mockScanProxyClient.isDevNet).toHaveBeenCalledWith()
        expect(result).toEqual(true)
    })

    it('should correctly build the tap command', async () => {
        vi.mocked(mockScanProxyClient.getAmuletRules).mockResolvedValue(
            amuletRules
        )
        vi.mocked(
            mockScanProxyClient.getActiveOpenMiningRound
        ).mockResolvedValue(activeRoundNormalized)

        const disclosedContracts = {
            contractId: amuletRules.contract_id,
            createdEventBlob: amuletRules.created_event_blob,
            synchronizerId: amuletRules.domain_id,
            templateId: amuletRules.template_id,
        }

        vi.mocked(
            mockTokenStandard.transfer.fetchTransferFactoryChoiceContext
        ).mockResolvedValue({
            factoryId: 'factory-1',
            transferKind: 'direct',
            choiceContext: {
                disclosedContracts: [disclosedContracts],
            },
        })

        const [command, tapDisclosedContracts] = await service.createTap(
            'receiverParty',
            '2000',
            amuletRules.payload.dso,
            'Amulet',
            'registry'
        )

        const transfer = {
            sender: 'DSO::1220eba34d13ab223f1a933fbde4e760dff9a3a965031151b0918ca9739424406ded',
            receiver: 'receiverParty',
            amount: '2000',
            instrumentId: {
                admin: 'DSO::1220eba34d13ab223f1a933fbde4e760dff9a3a965031151b0918ca9739424406ded',
                id: 'Amulet',
            },
            lock: null,
            inputHoldingCids: [],
            meta: { values: {} },
        }

        expect(
            mockTokenStandard.transfer.fetchTransferFactoryChoiceContext
        ).toHaveBeenCalledWith('registry', {
            expectedAdmin:
                'DSO::1220eba34d13ab223f1a933fbde4e760dff9a3a965031151b0918ca9739424406ded',
            transfer: expect.objectContaining(transfer),
            extraArgs: { context: { values: {} }, meta: { values: {} } },
        })

        expect(tapDisclosedContracts).toHaveLength(1)
        expect(command.choice).toBe('AmuletRules_DevNet_Tap')
        expect(command.choiceArgument).toStrictEqual(
            devnetTapCommand.choiceArgument
        )
        expect((command.choiceArgument as any).amount).toBe('2000')
    })

    it('should correctly build the cancelTransferPreapproval command', async () => {
        const [command, dc] = await service.cancelTransferPreapproval(
            '0022871f63af26ccb13dc48f58d189568618bea77a5e7ff6f49d273096f0eee5b7ca1212200b214acf13730a0296c9910174d26822baf45c52dbb3e09d01a4e428e7a9f1f2',
            '6c5802f86709a0ad4784af81f0bab40f3070b2f58128d8843da1e1784c147802:Splice.AmuletRules:TransferPreapproval',
            'cancel-preapproval-party'
        )

        expect(command.choice).toEqual('TransferPreapproval_Cancel')
        expect(dc.length).toBe(0)
    })

    it('should correctly build the renewPreapproval command', async () => {
        vi.mocked(mockScanProxyClient.getAmuletRules).mockResolvedValue(
            amuletRules
        )
        vi.mocked(
            mockScanProxyClient.getActiveOpenMiningRound
        ).mockResolvedValue(activeRoundNormalized)

        vi.mocked(mockTokenStandard.getInputHoldingsCids).mockResolvedValue([
            'cid1',
            'cid2',
        ])

        const [command, dc] = await service.renewTransferPreapproval(
            'cId',
            '6c5802f86709a0ad4784af81f0bab40f3070b2f58128d8843da1e1784c147802:Splice.AmuletRules:TransferPreapproval',
            'provider-party',
            amuletRules.domain_id
        )

        expect(command.choice).toEqual('TransferPreapproval_Renew')
        expect((command.choiceArgument as any).context).toEqual(
            renewCommand.choiceArgument.context
        )
        expect((command.choiceArgument as any).inputs).toEqual(
            renewCommand.choiceArgument.inputs
        )
        expect(command.contractId).toEqual('cId')
        expect(command.templateId).toEqual(
            '6c5802f86709a0ad4784af81f0bab40f3070b2f58128d8843da1e1784c147802:Splice.AmuletRules:TransferPreapproval'
        )

        expect('newExpiresAt' in (command.choiceArgument as any)).toBeTruthy()

        expect(dc.length).toBe(2)
    })

    it('should throw an error if there are no AmuleRules contract', async () => {
        vi.mocked(mockScanProxyClient.getAmuletRules).mockResolvedValue(null)
        await expect(
            service.renewTransferPreapproval(
                'cId',
                '6c5802f86709a0ad4784af81f0bab40f3070b2f58128d8843da1e1784c147802:Splice.AmuletRules:TransferPreapproval',
                'provider-party',
                amuletRules.domain_id
            )
        ).rejects.toThrow('AmuletRules contract not found')
    })

    it('should throw an error if there are no OpenMiningRound active', async () => {
        vi.mocked(mockScanProxyClient.getAmuletRules).mockResolvedValue(
            amuletRules
        )
        vi.mocked(
            mockScanProxyClient.getActiveOpenMiningRound
        ).mockResolvedValue(null)

        await expect(
            service.renewTransferPreapproval(
                'cId',
                '6c5802f86709a0ad4784af81f0bab40f3070b2f58128d8843da1e1784c147802:Splice.AmuletRules:TransferPreapproval',
                'provider-party',
                amuletRules.domain_id
            )
        ).rejects.toThrow('OpenMiningRound active at current moment not found')
    })

    it('should correctly build the buyMemberTraffic command', async () => {
        vi.mocked(mockScanProxyClient.getAmuletRules).mockResolvedValue(
            amuletRules
        )
        vi.mocked(
            mockScanProxyClient.getActiveOpenMiningRound
        ).mockResolvedValue(activeRoundNormalized)
        vi.mocked(mockTokenStandard.getInputHoldingsCids).mockResolvedValue([
            'cid1',
            'cid2',
        ])

        vi.mocked(mockTokenStandard.core.toQualifiedMemberId).mockReturnValue(
            'PAR:participant1'
        )

        const [command, disclosedContracts] = await service.buyMemberTraffic(
            'DSO::1220eba34d13ab223f1a933fbde4e760dff9a3a965031151b0918ca9739424406ded',
            'provider-party',
            10000,
            'synchronizer1',
            'PAR:participant1',
            0
        )

        expect(disclosedContracts).toHaveLength(2)
        expect(command.choice).toBe('AmuletRules_BuyMemberTraffic')
        expect((command.choiceArgument as any).trafficAmount).toBe('10000')
    })

    it('should throw an error if there are no amuletRules for buyMemberTraffic', async () => {
        vi.mocked(mockScanProxyClient.getAmuletRules).mockResolvedValue(null)

        await expect(
            service.buyMemberTraffic(
                'DSO::1220eba34d13ab223f1a933fbde4e760dff9a3a965031151b0918ca9739424406ded',
                'provider-party',
                10000,
                'synchronizer1',
                'PAR:participant1',
                0
            )
        ).rejects.toThrow('AmuletRules contract not found')
    })

    it('should throw an error if there are no OpenMiningRounds active for buyMemberTraffic', async () => {
        vi.mocked(mockScanProxyClient.getAmuletRules).mockResolvedValue(
            amuletRules
        )
        vi.mocked(
            mockScanProxyClient.getActiveOpenMiningRound
        ).mockResolvedValue(null)

        await expect(
            service.buyMemberTraffic(
                'DSO::1220eba34d13ab223f1a933fbde4e760dff9a3a965031151b0918ca9739424406ded',
                'provider-party',
                10000,
                'synchronizer1',
                'PAR:participant1',
                0
            )
        ).rejects.toThrow('OpenMiningRound active at current moment not found')
    })
})
