// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

bootstrap.synchronizer(
  synchronizerName = "app-synchronizer",
  sequencers = Seq(`app-sequencer`),
  mediators = Seq(`app-mediator`),
  synchronizerOwners = Seq(`app-sequencer`),
  synchronizerThreshold = 1,
  staticSynchronizerParameters = StaticSynchronizerParameters.defaultsWithoutKMS(ProtocolVersion.latest),
)

// Connect app-provider to the new synchronizer.
// TODO: app-user is intentionally NOT connected to app-synchronizer so that
// the SDK (which picks connectedSynchronizers[0]) always selects the global synchronizer.
// This is a temporary workaround until we have a better way to select synchronizers in the SDK.
`app-provider`.synchronizers.connect_local(`app-sequencer`, "app-synchronizer")

// Wait for app-provider to be active on app-synchronizer
utils.retry_until_true {
  `app-provider`.synchronizers.active("app-synchronizer")
}

// Replicate package vetting from the global synchronizer to app-synchronizer so that
// the new synchronizer is fully functional for app-provider.
//
// Splice connects app-provider to the global synchronizer under the alias "global".
// We read vetting from its per-synchronizer store rather than the authorized store
// because we want to replicate exactly what is active on the global synchronizer.
// We wait until the global-synchronizer view is non-empty to avoid a topology-
// propagation race (which caused `multi-sync-startup` to fail in CI).
val connectedSynchronizers = `app-provider`.synchronizers.list_connected()
val appSyncId = connectedSynchronizers
  .find(_.synchronizerAlias.unwrap == "app-synchronizer")
  .getOrElse(throw new RuntimeException("app-synchronizer not found in connected synchronizers"))
  .synchronizerId
val globalSyncId = connectedSynchronizers
  .find(_.synchronizerAlias.unwrap == "global")
  .getOrElse(throw new RuntimeException(
    s"'global' synchronizer not found. Connected: ${connectedSynchronizers.map(_.synchronizerAlias.unwrap).mkString(", ")}"
  ))
  .synchronizerId

utils.retry_until_true {
  `app-provider`.topology.vetted_packages
    .list(store = Some(TopologyStoreId.Synchronizer(globalSyncId)), filterParticipant = `app-provider`.id.filterString)
    .flatMap(_.item.packages)
    .nonEmpty
}

val vettedPackages = `app-provider`.topology.vetted_packages
  .list(store = Some(TopologyStoreId.Synchronizer(globalSyncId)), filterParticipant = `app-provider`.id.filterString)
  .flatMap(_.item.packages)

logger.info(s"Vetting ${vettedPackages.size} packages on app-synchronizer for app-provider")
`app-provider`.topology.vetted_packages.propose_delta(
  participant = `app-provider`.id,
  store = appSyncId,
  adds = vettedPackages.toSeq,
)

// Wait for vetting to propagate on app-synchronizer
utils.retry_until_true {
  val providerVetted = `app-provider`.topology.vetted_packages
    .list(store = Some(appSyncId), filterParticipant = `app-provider`.id.filterString)
  providerVetted.nonEmpty && providerVetted.head.item.packages.nonEmpty
}

logger.info("app-synchronizer bootstrap with package vetting completed successfully")
