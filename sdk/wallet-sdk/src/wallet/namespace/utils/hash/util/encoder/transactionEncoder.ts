// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { OfflineSDKContext } from '../../../../../sdk.js'
import { Encoder } from './encoder.js'
import { DamlTransaction } from '@canton-network/core-ledger-proto'
import { PrimitiveEncoder } from './primitiveEncoder.js'
import { CollectionEncoder } from './collectionEncoder.js'
import { LedgerApiValueEncoder } from './ledgerApiValueEncoder.js'
import {
    NODE_ENCODING_VERSION,
    PREPARED_TRANSACTION_HASH_PURPOSE,
} from '../const.js'
import { ArgValueOneOfKind, HashEncoder } from './types.js'

type Node = Extract<
    DamlTransaction['nodes'][number]['versionedNode'],
    { oneofKind: 'v1' }
>['v1']
type ArgKey = NonNullable<Node['nodeType']['oneofKind']>
type ArgValueOf<T extends ArgKey> = ArgValueOneOfKind<Node['nodeType'], T>
type EncodeNodeTypeArgs<T extends ArgKey> = {
    node: ArgValueOf<T>
    nodes?: DamlTransaction['nodes']
    seeds?: DamlTransaction['nodeSeeds']
    nodeId?: DamlTransaction['roots'][number]
}
type NodeTypeEncodingMethods = {
    [Key in ArgKey]: (args: EncodeNodeTypeArgs<Key>) => Promise<Uint8Array>
}

export class TransactionEncoder
    extends Encoder
    implements HashEncoder<DamlTransaction>
{
    private readonly encodePrimitive: PrimitiveEncoder
    private readonly encodeCollection: CollectionEncoder
    private readonly encodeLedgerApiValue: LedgerApiValueEncoder
    constructor(protected readonly ctx: OfflineSDKContext) {
        super(ctx)
        this.encodePrimitive = new PrimitiveEncoder(ctx)
        this.encodeCollection = new CollectionEncoder(ctx)
        this.encodeLedgerApiValue = new LedgerApiValueEncoder(ctx)
    }

    private readonly findSeed = (args: {
        nodeId: string
        seeds: DamlTransaction['nodeSeeds']
    }) => {
        return args.seeds.find(
            ({ nodeId }) => nodeId.toString() === args.nodeId
        )?.seed
    }

    public nodeType: NodeTypeEncodingMethods = {
        create: async (args: EncodeNodeTypeArgs<'create'>) => {
            const { nodeId, seeds, node } = args
            const {
                lfVersion,
                contractId,
                packageName,
                templateId,
                argument,
                signatories,
                stakeholders,
            } = node
            return this.concatBytes(
                NODE_ENCODING_VERSION,
                this.encodePrimitive.string(lfVersion),
                0x00,
                this.encodeCollection.optionalSync(
                    this.findSeed({
                        nodeId: nodeId ?? '',
                        seeds: seeds ?? [],
                    })
                ),
                this.encodePrimitive.hexString(contractId),
                this.encodePrimitive.string(packageName),
                // TODO: find a way to remove non-null assertion
                this.encodeLedgerApiValue.identifier(templateId!),
                this.encodeLedgerApiValue.value(argument),
                this.encodeCollection.repeatedSync(
                    signatories,
                    this.encodePrimitive.string
                ),
                this.encodeCollection.repeatedSync(
                    stakeholders,
                    this.encodePrimitive.string
                )
            )
        },
        exercise: async (args: EncodeNodeTypeArgs<'exercise'>) => {
            const { nodeId, seeds, node, nodes } = args
            const {
                lfVersion,
                contractId,
                packageName,
                templateId,
                actingParties,
                interfaceId,
                choiceId,
                chosenValue,
                consuming,
                children,
                exerciseResult,
                choiceObservers,
                signatories,
                stakeholders,
            } = node
            return this.concatBytes(
                NODE_ENCODING_VERSION,
                this.encodePrimitive.string(lfVersion),
                0x01,
                // TODO: find a way to remove non-null assertion
                this.findSeed({ nodeId: nodeId ?? '', seeds: seeds ?? [] })!,
                this.encodePrimitive.hexString(contractId),
                this.encodePrimitive.string(packageName),
                // TODO: find a way to remove non-null assertion
                this.encodeLedgerApiValue.identifier(templateId!),
                this.encodeCollection.repeatedSync(
                    signatories,
                    this.encodePrimitive.string
                ),
                this.encodeCollection.repeatedSync(
                    stakeholders,
                    this.encodePrimitive.string
                ),
                this.encodeCollection.repeatedSync(
                    actingParties,
                    this.encodePrimitive.string
                ),
                this.encodeCollection.optionalSync(
                    interfaceId,
                    this.encodeLedgerApiValue.identifier
                ),
                this.encodePrimitive.string(choiceId),
                this.encodeLedgerApiValue.value(chosenValue),
                this.encodePrimitive.bool(consuming),
                this.encodeCollection.optionalSync(
                    exerciseResult,
                    this.encodeLedgerApiValue.value
                ),
                this.encodeCollection.repeatedSync(
                    choiceObservers,
                    this.encodePrimitive.string
                ),
                await this.encodeCollection.repeated(
                    children,
                    this.nodeId({
                        nodes: nodes ?? [],
                        seeds: seeds ?? [],
                    })
                )
            )
        },
        fetch: async (args: EncodeNodeTypeArgs<'fetch'>) => {
            const { node } = args
            const {
                lfVersion,
                contractId,
                packageName,
                templateId,
                signatories,
                stakeholders,
                interfaceId,
                actingParties,
            } = node
            return this.concatBytes(
                NODE_ENCODING_VERSION,
                this.encodePrimitive.string(lfVersion),
                0x02,
                this.encodePrimitive.hexString(contractId),
                this.encodePrimitive.string(packageName),
                // TODO: find a way to remove non-null assertion
                this.encodeLedgerApiValue.identifier(templateId!),
                this.encodeCollection.repeatedSync(
                    signatories,
                    this.encodePrimitive.string
                ),
                this.encodeCollection.repeatedSync(
                    stakeholders,
                    this.encodePrimitive.string
                ),
                this.encodeCollection.optionalSync(
                    interfaceId,
                    this.encodeLedgerApiValue.identifier
                ),
                this.encodeCollection.repeatedSync(
                    actingParties,
                    this.encodePrimitive.string
                )
            )
        },
        rollback: async (args: EncodeNodeTypeArgs<'rollback'>) => {
            const { node, nodes, seeds } = args
            const { children } = node
            return this.concatBytes(
                NODE_ENCODING_VERSION,
                0x03,
                await this.encodeCollection.repeated(
                    children,
                    this.nodeId({
                        nodes: nodes ?? [],
                        seeds: seeds ?? [],
                    })
                )
            )
        },
    }

    private readonly node = async (args: {
        nodes: DamlTransaction['nodes']
        node: DamlTransaction['nodes'][number]
        seeds: DamlTransaction['nodeSeeds']
    }) => {
        const { node, seeds, nodes } = args
        if (node.versionedNode.oneofKind !== 'v1')
            this.ctx.error.throw({
                message: 'Incorrect node version set',
                type: 'SDKOperationUnsupported',
            })

        const { oneofKind, ...rest } = node.versionedNode.v1.nodeType
        if (
            !oneofKind ||
            !(oneofKind in this.nodeType) ||
            !(oneofKind in rest)
        ) {
            this.ctx.error.throw({
                message: 'Wrong data structure input',
                type: 'CantonError',
            })
        }
        return await this.nodeType[oneofKind]({
            nodes,
            seeds,
            nodeId: node.nodeId,
            node: rest[oneofKind as keyof typeof rest],
        })
    }

    private nodeId =
        (args: {
            nodes: DamlTransaction['nodes']
            seeds: DamlTransaction['nodeSeeds']
        }) =>
        async (root: DamlTransaction['roots'][number]) => {
            const { nodes, seeds } = args
            const node = nodes.find((node) => node.nodeId === root)
            if (!node)
                this.ctx.error.throw({
                    message:
                        'Missing node - all node ids should have a unique node in the nodes list',
                    type: 'CantonError',
                })

            return await this.sha256(
                await this.node({
                    nodes,
                    node,
                    seeds,
                })
            )
        }

    private readonly encode = async (value: DamlTransaction) => {
        const { version, roots, nodes, nodeSeeds } = value
        return this.concatBytes(
            this.encodePrimitive.string(version),
            await this.encodeCollection.repeated(
                roots,
                this.nodeId({ nodes, seeds: nodeSeeds })
            )
        )
    }

    public async hash(value: DamlTransaction) {
        return await this.sha256(
            this.concatBytes(
                PREPARED_TRANSACTION_HASH_PURPOSE,
                await this.encode(value)
            )
        )
    }
}
