// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

export { runConformance } from './runner'
export { ConformanceService } from './conformance-service'
export { readRequiredMethodsBundled } from './required-methods'
export {
    ArtifactSchema,
    ProfileSchema,
    ProviderConfigSchema,
    TestResultSchema,
} from './schemas'
export {
    readArtifact,
    signArtifact,
    toBadgeData,
    verifyArtifactSignature,
    writeArtifact,
} from './artifact'
export type {
    Artifact,
    HttpProviderConfig,
    InjectedProviderConfig,
    Profile,
    ProviderConfig,
    TestResult,
} from './schemas'
export type {
    ExportBadgeCommandOptions,
    RunConformanceCommandOptions,
    ValidateArtifactCommandOptions,
    ValidateArtifactResult,
} from './conformance-service'
