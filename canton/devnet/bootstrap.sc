import com.google.protobuf.ByteString

import java.io._
import java.net.{HttpURLConnection, URI}
import java.nio.file.{Files, Path, StandardCopyOption}
import scala.concurrent.blocking
import better.files.File
import com.digitalasset.canton.console.{
  InstanceReference,
  LocalInstanceReference,
  LocalMediatorReference,
  LocalSequencerReference,
  MediatorReference,
  ParticipantReference,
  SequencerReference,
}
import com.digitalasset.canton.version.ProtocolVersion._
import com.digitalasset.canton.topology.{SynchronizerId, UniqueIdentifier}
import com.digitalasset.canton.console.commands.ConsoleCommandGroup
import com.digitalasset.canton.util.BinaryFileUtil
import com.digitalasset.canton.admin.api.client.data.{SequencerConnections, SubmissionRequestAmplification, SequencerConnectionPoolDelays}


val cantonDir = "canton"
val synchronizerDir = s"$cantonDir/synchronizer-bootstrap"

logger.info(s"WALLET-KERNEL-BOOTSTRAP")

val keyName = "participant1NameSpaceKey"

participant1.keys.secret.upload_from(s"$cantonDir/participant1.key", Some(keyName))

val key = participant1.keys.secret.list(filterName = keyName).headOption.get


val namespaceKey = key.publicKey match { case s: SigningPublicKey => s }


val namespace = Namespace(namespaceKey.id)

participant1.topology.init_id_from_uid(UniqueIdentifier.tryCreate(participant1.name, namespace))

participant1.topology.namespace_delegations.propose_delegation(namespace, namespaceKey, CanSignAllMappings)

participant1.health.wait_for_ready_for_node_topology()

val sequencerAuthKey = participant1.keys.secret.generate_signing_key(s"participant1-${SigningKeyUsage.SequencerAuthentication.identifier}", SigningKeyUsage.SequencerAuthenticationOnly)

val signingKey = participant1.keys.secret.generate_signing_key(s"participant1-${SigningKeyUsage.Protocol.identifier}", SigningKeyUsage.ProtocolOnly)
val encryptionKey = participant1.keys.secret.generate_encryption_key("participant1-encryption")


participant1.topology.owner_to_key_mappings.propose(
  member = participant1.id.member,
  keys = com.daml.nonempty.NonEmpty(Seq, sequencerAuthKey, signingKey, encryptionKey),
  signedBy = Seq(namespaceKey.fingerprint, sequencerAuthKey.fingerprint, signingKey.fingerprint),
)



participant1.health.wait_for_initialized()

//import data
logger.info("Importing sequencer/mediator data ")

val synchronizerId = SynchronizerId.tryFromString(better.files.File(s"$synchronizerDir/synchronizer-id").contentAsString)
logger.info(s"synchronizer id is $synchronizerId")

val testedProtocolVersion = ProtocolVersion.v35


val newStaticSynchronizerParameters =
  StaticSynchronizerParameters.defaultsWithoutKMS(protocolVersion = testedProtocolVersion)

val physicalSynchronizerId = com.digitalasset.canton.topology.PhysicalSynchronizerId(synchronizerId, newStaticSynchronizerParameters.toInternal)

migrateNode(
  migratedNode = sequencer1,
  newStaticSynchronizerParameters = newStaticSynchronizerParameters,
  synchronizerId = physicalSynchronizerId,
  newSequencers = Seq(sequencer1),
  dars = Seq(),
  exportDirectory = better.files.File(synchronizerDir),
)

migrateNode(
  migratedNode = mediator1,
  newStaticSynchronizerParameters = newStaticSynchronizerParameters,
  synchronizerId = physicalSynchronizerId,
  newSequencers = Seq(sequencer1),
  dars = Seq(),
  exportDirectory = better.files.File(synchronizerDir),
)


// start all local instances defined in the configuration file

nodes.local.start()

bootstrap.synchronizer(
  synchronizerName = "wallet",
  sequencers = Seq(sequencer1),
  mediators = Seq(mediator1),
  synchronizerOwners = Seq(sequencer1),
  synchronizerThreshold = PositiveInt.one,
  staticSynchronizerParameters = StaticSynchronizerParameters.defaultsWithoutKMS(ProtocolVersion.forSynchronizer),
)



// Connect participant1 to wallet using the connect macro.
// The connect macro will inspect the synchronizer configuration to find the correct URL and Port.
// The macro is convenient for local testing, but obviously doesn't work in a distributed setup.
participant1.synchronizers.connect_local(sequencer1, alias = "wallet")

utils.retry_until_true {
  participant1.synchronizers.active("wallet")
}


val parId = participant1.id.toLengthLimitedString

logger.info(s"WALLET-KERNEL-BOOTSTRAP ParticipantId is: $parId")
val operatorParty = participant1.ledger_api.parties.allocate("operator").party


participant1.ledger_api.users.create(id = "operator", actAs = Set(operatorParty), readAs = Set(operatorParty), primaryParty = Some(operatorParty), participantAdmin = false, isDeactivated = false, annotations = Map("foo" -> "bar", "description" -> "This is a description"))


participant1.ledger_api.users.create(id = "operator2", actAs = Set(operatorParty), readAs = Set(operatorParty), primaryParty = Some(operatorParty), participantAdmin = false, isDeactivated = false, annotations = Map("foo" -> "bar", "description" -> "This is a description"))


participant1.ledger_api.identity_provider_config.create("mock-oauth2", isDeactivated = false, jwksUrl = "http://127.0.0.1:8889/jwks", issuer = "http://127.0.0.1:8889", audience = None)

participant1.ledger_api.users
  .create(
    id = "mock-oauth2-user",
    primaryParty = Some(operatorParty),
    actAs = Set(),
    readAs = Set(),
    participantAdmin = true,
    isDeactivated = false,
    identityProviderAdmin = true,
    identityProviderId = "mock-oauth2",
    annotations = Map()
  )


def initializeSequencer(
                         migrated: SequencerReference,
                         genesisState: ByteString,
                         staticSynchronizerParameters: StaticSynchronizerParameters,
                       ): Unit = {
  migrated.health.wait_for_ready_for_initialization()
  migrated.setup.assign_from_genesis_state(
    genesisState,
    staticSynchronizerParameters,
  )

  migrated.health.initialized()

}

def migrateNode(
                 migratedNode: InstanceReference with ConsoleCommandGroup,
                 newStaticSynchronizerParameters: StaticSynchronizerParameters,
                 synchronizerId: com.digitalasset.canton.topology.PhysicalSynchronizerId,
                 newSequencers: Seq[SequencerReference],
                 dars: Seq[String],
                 sequencerTrustThreshold: PositiveInt = PositiveInt.one,
                 exportDirectory: File,
                 sequencerLivenessMargin: NonNegativeInt = NonNegativeInt.zero,
               ): Unit = {
  val files = UpgradeDataFiles.from(migratedNode.name, exportDirectory)

  files.keys.foreach { case (keys, name) =>
    migratedNode.keys.secret.upload(keys, name)
  }
  migratedNode.topology.init_id_from_uid(files.uid)
  migratedNode.health.wait_for_ready_for_node_topology()
  migratedNode.topology.transactions
    .import_topology_snapshot(files.authorizedStore, TopologyStoreId.Authorized)

  migratedNode match {
    case newSequencer: SequencerReference =>
      initializeSequencer(newSequencer, files.genesisState, newStaticSynchronizerParameters)

    case newMediator: MediatorReference =>
      newMediator.setup.assign(
        synchronizerId,
        SequencerConnections.tryMany(
          newSequencers
            .map(s => s.sequencerConnection.withAlias(SequencerAlias.tryCreate(s.name))),
          sequencerTrustThreshold,
          sequencerLivenessMargin,
          SubmissionRequestAmplification.NoAmplification,
          SequencerConnectionPoolDelays.default
        ),
      )

    case newParticipant: ParticipantReference =>
      val node = newParticipant
      // user-manual-entry-begin: WaitForParticipantInitialization
      node.health.wait_for_initialized()
      // user-manual-entry-end: WaitForParticipantInitialization
      dars.foreach(dar => newParticipant.dars.upload(dar))

    case _ =>
      throw new IllegalStateException(
        s"Unsupported migration from $files to $migratedNode"
      )
  }
}

final case class UpgradeDataFiles(
                                   uidFile: File,
                                   keyFiles: Seq[File],
                                   authorizedStoreFile: File,
                                   acsSnapshotFile: File,
                                   genesisStateFile: File,
                                 ) {
  def uid: UniqueIdentifier =
    UniqueIdentifier.tryFromProtoPrimitive(
      uidFile.contentAsString
    )

  def keys: Seq[(ByteString, Option[String])] =
    keyFiles.map { file =>
      val key = BinaryFileUtil.tryReadByteStringFromFile(file.canonicalPath)
      val name = file.name.stripSuffix(".keys")
      key -> Option(name)
    }

  def authorizedStore: ByteString =
    BinaryFileUtil.tryReadByteStringFromFile(authorizedStoreFile.canonicalPath)

  def genesisState: ByteString =
    BinaryFileUtil.tryReadByteStringFromFile(genesisStateFile.canonicalPath)
}

object UpgradeDataFiles {
  def from(nodeName: String, baseDirectory: File): UpgradeDataFiles = {
    val keys =
      baseDirectory.list
        .filter(file => file.name.startsWith(nodeName) && file.name.endsWith(".keys"))
        .toList
    UpgradeDataFiles(
      uidFile = baseDirectory / s"$nodeName-uid",
      keyFiles = keys,
      authorizedStoreFile = baseDirectory / s"$nodeName-authorized-store",
      acsSnapshotFile = baseDirectory / s"$nodeName-acs-snapshot",
      genesisStateFile = baseDirectory / s"$nodeName-genesis-state",
    )
  }
}
