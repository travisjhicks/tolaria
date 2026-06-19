import type { Directory, Paths } from 'expo-file-system'
import { applyMobileWorkspaceEditWithWrites } from '../workspace/mobileWorkspaceEditing'
import type { MobileWorkspaceSnapshot } from '../workspace/mobileWorkspaceModel'
import type { ReadOnlyWorkspaceRepository, ReadOnlyWorkspaceRequest } from '../workspace/readOnlyWorkspaceRepository'
import {
  nativeWorkspacePersistenceLogLine,
  nativeWorkspacePersistenceProbeVaultLabel,
  type NativeWorkspacePersistenceProof,
} from './nativeWorkspacePersistenceProbe'

type ExpoFileSystemModule = {
  Directory: typeof Directory
  Paths: typeof Paths
}

declare const require: (moduleName: string) => ExpoFileSystemModule

const createdNotePath = 'Writing/Drafts/Mobile Created.md'
const movedNotePath = 'Research/Seed.md'
const metadataNotePath = 'Metadata/Chrome State.md'
const oldTypeName = 'Retired Proof'
const oldViewName = 'Old Native Proof'
const relationshipSourcePath = 'Relationships/Source.md'
const relationshipTargetPath = 'Relationships/native-related-target.md'
const renamedTypeAssignedNotePath = 'Writing/Type Rename Assigned.md'
const renamedTypeName = 'Rename Target'
const renamedTypePath = 'rename-target.md'
const renamedTypeSchemaCarrierName = 'Schema Carrier'
const renamedTypeSourceName = 'Rename Source'
const renamedTypeSourcePath = 'rename-source.md'
const renamedFolderPath = 'Folders/Proof Queue'
const typeName = 'Proof Decision'
const workspaceProbeStartedRootUris = new Set<string>()

export function nativeWorkspacePersistenceProbeRepository(
  baseRepository: ReadOnlyWorkspaceRepository,
): ReadOnlyWorkspaceRepository {
  return {
    persistWrites: (writes, request) => baseRepository.persistWrites(
      writes,
      nativeWorkspacePersistenceProbeRequest(request),
    ),
    readNoteContent: (note, request) => baseRepository.readNoteContent(
      note,
      nativeWorkspacePersistenceProbeRequest(request),
    ),
    readSnapshot: (request) => {
      const probeRequest = nativeWorkspacePersistenceProbeRequest(request)
      queueWorkspacePersistenceProbe(baseRepository, probeRequest)
      return baseRepository.readSnapshot(probeRequest)
    },
  }
}

export function nativeWorkspacePersistenceProbeRequest(
  request?: ReadOnlyWorkspaceRequest,
): ReadOnlyWorkspaceRequest {
  return {
    ...request,
    source: 'native',
    vaultLabel: nativeWorkspacePersistenceProbeVaultLabel,
    vaultRootUri: workspacePersistenceProbeRootUri() ?? request?.vaultRootUri ?? null,
  }
}

function queueWorkspacePersistenceProbe(
  baseRepository: ReadOnlyWorkspaceRepository,
  request: ReadOnlyWorkspaceRequest,
) {
  const rootUri = request.vaultRootUri
  if (!rootUri || workspaceProbeStartedRootUris.has(rootUri)) return

  workspaceProbeStartedRootUris.add(rootUri)
  void logWorkspacePersistenceProof(baseRepository, request)
}

async function logWorkspacePersistenceProof(
  baseRepository: ReadOnlyWorkspaceRepository,
  request: ReadOnlyWorkspaceRequest,
) {
  resetWorkspacePersistenceProbeVault(request.vaultRootUri)
  await baseRepository.persistWrites(seedWorkspacePersistenceProbeWrites(), request)
  await baseRepository.persistWrites(workspacePersistenceProbeWrites(baseRepository.readSnapshot(request)), request)

  const snapshot = baseRepository.readSnapshot(request)
  const movedNote = snapshot.allNotes?.find((note) => note.path === movedNotePath)
    ?? snapshot.notes.find((note) => note.path === movedNotePath)
  const movedContent = movedNote ? await baseRepository.readNoteContent(movedNote, request) : null
  const renamedAssignedNote = noteByPath(snapshot, renamedTypeAssignedNotePath)
  const renamedAssignedContent = renamedAssignedNote
    ? await baseRepository.readNoteContent(renamedAssignedNote, request)
    : null
  const relationshipSource = noteByPath(snapshot, relationshipSourcePath)
  const relationshipSourceContent = relationshipSource
    ? await baseRepository.readNoteContent(relationshipSource, request)
    : null
  const metadataNote = noteByPath(snapshot, metadataNotePath)
  const metadataContent = metadataNote
    ? await baseRepository.readNoteContent(metadataNote, request)
    : null

  console.info(nativeWorkspacePersistenceLogLine(workspacePersistenceProof(snapshot, {
    metadataContent,
    movedContent,
    relationshipSourceContent,
    renamedAssignedContent,
  })))
}

function resetWorkspacePersistenceProbeVault(rootUri: string | null | undefined) {
  if (!rootUri) return

  const { Directory } = require('expo-file-system')
  const root = new Directory(rootUri)
  if (root.exists) root.delete()
  root.create({ idempotent: true, intermediates: true })
}

function workspacePersistenceProbeRootUri(): string | null {
  try {
    const { Directory, Paths } = require('expo-file-system')
    return new Directory(Paths.document, nativeWorkspacePersistenceProbeVaultLabel).uri
  } catch {
    return null
  }
}

function workspacePersistenceProbeWrites(seedSnapshot: MobileWorkspaceSnapshot) {
  return [
    ...workspacePersistenceNoteWrites(),
    ...workspacePersistenceMetadataWrites(seedSnapshot),
    ...workspacePersistenceViewWrites(),
    workspacePersistenceConfigWrite(),
    ...workspacePersistenceFolderWrites(),
    ...workspacePersistenceTypeWrites(),
    ...workspacePersistenceRelationshipTargetWrites(seedSnapshot),
    ...workspacePersistenceTypeRenameWrites(seedSnapshot),
  ]
}

function workspacePersistenceNoteWrites() {
  return [
    {
      content: mobileCreatedNoteContent(),
      kind: 'createNote' as const,
      path: createdNotePath,
    },
    {
      content: seedNoteUpdatedContent(),
      kind: 'saveNote' as const,
      path: 'Writing/Seed.md',
    },
    {
      kind: 'moveNote' as const,
      path: 'Writing/Seed.md',
      toPath: movedNotePath,
    },
  ]
}

type WorkspaceProbeEdit = Parameters<typeof applyMobileWorkspaceEditWithWrites>[1]
type WorkspaceProbeWrites = ReturnType<typeof applyMobileWorkspaceEditWithWrites>['writes']

function workspacePersistenceMetadataWrites(seedSnapshot: MobileWorkspaceSnapshot) {
  const note = noteByPath(seedSnapshot, metadataNotePath)
  if (!note) return []

  return workspacePersistenceEditWrites(seedSnapshot, [
    { key: '_icon', noteId: note.id, type: 'updateProperty', value: 'star' },
    { key: '_width', noteId: note.id, type: 'updateProperty', value: 'wide' },
    { archived: true, noteId: note.id, type: 'setArchived' },
    { noteId: note.id, organized: true, type: 'setOrganized' },
    { noteId: note.id, type: 'toggleFavorite' },
  ])
}

function workspacePersistenceEditWrites(
  seedSnapshot: MobileWorkspaceSnapshot,
  edits: WorkspaceProbeEdit[],
) {
  const writes: WorkspaceProbeWrites = []
  let snapshot = seedSnapshot

  for (const edit of edits) {
    const result = applyMobileWorkspaceEditWithWrites(snapshot, edit)
    snapshot = result.snapshot
    writes.push(...result.writes)
  }

  return writes
}

function workspacePersistenceViewWrites() {
  return [
    {
      content: mobilePersistenceViewContent(),
      kind: 'saveView' as const,
      path: 'views/mobile-persistence.yml',
    },
    {
      kind: 'deleteView' as const,
      path: 'views/old-native-proof.yml',
    },
  ]
}

function workspacePersistenceConfigWrite() {
  return {
    config: {
      allNotes: { noteListProperties: ['status', 'belongs_to'] },
      inbox: { explicitOrganization: true, noteListProperties: ['tags'] },
    },
    kind: 'saveVaultConfig' as const,
  }
}

function workspacePersistenceFolderWrites() {
  return [
    {
      kind: 'renameFolder' as const,
      path: 'Folders/Queue',
      toPath: renamedFolderPath,
    },
    {
      kind: 'createFolder' as const,
      path: 'Scratch/To Delete',
    },
    {
      kind: 'deleteFolder' as const,
      path: 'Scratch',
    },
  ]
}

function workspacePersistenceTypeWrites() {
  return [
    {
      content: typeDefinitionContent(typeName, 'green'),
      kind: 'createNote' as const,
      path: `Types/${typeName}.md`,
    },
    {
      kind: 'deleteNote' as const,
      path: `Types/${oldTypeName}.md`,
    },
  ]
}

function workspacePersistenceRelationshipTargetWrites(seedSnapshot: MobileWorkspaceSnapshot) {
  return applyMobileWorkspaceEditWithWrites(seedSnapshot, {
    key: 'related_to',
    sourceNoteId: relationshipSourcePath,
    targetTitle: 'Native Related Target',
    type: 'createRelationshipTarget',
  }).writes
}

function workspacePersistenceTypeRenameWrites(seedSnapshot: MobileWorkspaceSnapshot) {
  return applyMobileWorkspaceEditWithWrites(seedSnapshot, {
    nextTypeName: renamedTypeName,
    type: 'renameTypeDefinition',
    typeName: renamedTypeSourceName,
  }).writes
}

function seedWorkspacePersistenceProbeWrites() {
  return [
    {
      content: seedNoteInitialContent(),
      kind: 'createNote' as const,
      path: 'Writing/Seed.md',
    },
    {
      content: metadataNoteInitialContent(),
      kind: 'createNote' as const,
      path: metadataNotePath,
    },
    {
      content: '# Keep\n',
      kind: 'createNote' as const,
      path: 'Folders/Queue/Keep.md',
    },
    {
      content: oldNativeProofViewContent(),
      kind: 'saveView' as const,
      path: 'views/old-native-proof.yml',
    },
    {
      content: typeDefinitionContent(oldTypeName, 'gray'),
      kind: 'createNote' as const,
      path: `Types/${oldTypeName}.md`,
    },
    {
      content: typeDefinitionContent(renamedTypeSourceName, 'purple'),
      kind: 'createNote' as const,
      path: renamedTypeSourcePath,
    },
    {
      content: relationshipSourceContent(),
      kind: 'createNote' as const,
      path: relationshipSourcePath,
    },
    {
      content: renamedTypeSchemaCarrierContent(),
      kind: 'createNote' as const,
      path: 'schema-carrier.md',
    },
    {
      content: renamedTypeAssignedNoteContent(),
      kind: 'createNote' as const,
      path: renamedTypeAssignedNotePath,
    },
  ]
}

function workspacePersistenceProof(
  snapshot: MobileWorkspaceSnapshot,
  content: {
    metadataContent: string | null
    movedContent: string | null
    relationshipSourceContent: string | null
    renamedAssignedContent: string | null
  },
): NativeWorkspacePersistenceProof {
  return {
    createdNoteHydrated: snapshotContainsNotePath(snapshot, createdNotePath),
    deletedTypeDefinitionRemoved: !typeDefinitionExists(snapshot, oldTypeName),
    deletedViewRemoved: !viewExists(snapshot, oldViewName),
    folderDeleteApplied: !folderPathStartsWith(snapshot, 'Scratch'),
    folderRenameApplied: folderRenameApplied(snapshot),
    movedNoteContentPreserved: movedContentPreserved(content.movedContent),
    noteChromeMetadataHydrated: noteChromeMetadataHydrated(snapshot, content.metadataContent),
    noteStateMetadataHydrated: noteStateMetadataHydrated(snapshot, content.metadataContent),
    persistedToNativeRepository: snapshot.source?.kind === 'localVault',
    relationshipSourceRefHydrated: relationshipSourceRefHydrated(content.relationshipSourceContent),
    relationshipTargetHydrated: snapshotContainsNotePath(snapshot, relationshipTargetPath),
    renamedTypeAssignedNoteHydrated: renamedTypeAssignedNoteHydrated(snapshot, content.renamedAssignedContent),
    renamedTypeDefinitionHydrated: renamedTypeDefinitionHydrated(snapshot),
    renamedTypeSchemaRefsHydrated: renamedTypeSchemaRefsHydrated(snapshot),
    savedViewHydrated: viewExists(snapshot, 'Mobile Persistence'),
    typeDefinitionHydrated: snapshot.typeDefinitions?.[typeName]?.tone === 'green',
    vaultConfigHydrated: vaultConfigHydrated(snapshot),
  }
}

function folderRenameApplied(snapshot: MobileWorkspaceSnapshot) {
  return snapshot.folderPaths?.includes(renamedFolderPath) === true
    && snapshotContainsNotePath(snapshot, `${renamedFolderPath}/Keep.md`)
}

function snapshotContainsNotePath(snapshot: MobileWorkspaceSnapshot, path: string) {
  return noteByPath(snapshot, path) !== null
}

function typeDefinitionExists(snapshot: MobileWorkspaceSnapshot, name: string) {
  return snapshot.typeDefinitions?.[name] !== undefined
}

function viewExists(snapshot: MobileWorkspaceSnapshot, name: string) {
  return snapshot.views?.some((view) => view.definition.name === name) === true
}

function vaultConfigHydrated(snapshot: MobileWorkspaceSnapshot) {
  return joinedProperties(snapshot.noteListPropertyOverrides?.allNotes) === 'status|belongs_to'
    && joinedProperties(snapshot.noteListPropertyOverrides?.inbox) === 'tags'
    && snapshot.vaultConfig?.inbox?.explicitOrganization === true
}

function joinedProperties(properties: string[] | undefined) {
  return properties?.join('|') ?? ''
}

function folderPathStartsWith(snapshot: MobileWorkspaceSnapshot, pathPrefix: string) {
  return snapshot.folderPaths?.some((path) => path === pathPrefix || path.startsWith(`${pathPrefix}/`)) === true
}

function movedContentPreserved(content: string | null) {
  return content?.includes('saved before moving through native persistence') === true
}

function noteChromeMetadataHydrated(snapshot: MobileWorkspaceSnapshot, content: string | null) {
  const note = noteByPath(snapshot, metadataNotePath)
  return noteMatches(note, { icon: 'star', noteWidth: 'wide' })
    && textContainsAll(content, ['_icon: star', '_width: wide'])
}

function noteStateMetadataHydrated(snapshot: MobileWorkspaceSnapshot, content: string | null) {
  const note = noteByPath(snapshot, metadataNotePath)
  return noteMatches(note, { archived: true, favorite: true, organized: true })
    && textContainsAll(content, ['_archived: true', '_organized: true', '_favorite: true', '_favorite_index:'])
}

function noteMatches(
  note: ReturnType<typeof noteByPath>,
  expected: Partial<Pick<NonNullable<ReturnType<typeof noteByPath>>, 'archived' | 'favorite' | 'icon' | 'noteWidth' | 'organized'>>,
) {
  return note !== null && Object.entries(expected).every(([key, value]) => note[key as keyof typeof expected] === value)
}

function textContainsAll(content: string | null, fragments: string[]) {
  return content !== null && fragments.every((fragment) => content.includes(fragment))
}

function relationshipSourceRefHydrated(content: string | null) {
  return content?.includes('related_to:') === true
    && content.includes('native-related-target')
}

function renamedTypeDefinitionHydrated(snapshot: MobileWorkspaceSnapshot) {
  return snapshot.typeDefinitions?.[renamedTypeName]?.tone === 'purple'
    && snapshot.typeDefinitions?.[renamedTypeSourceName] === undefined
    && snapshotContainsNotePath(snapshot, renamedTypePath)
    && !snapshotContainsNotePath(snapshot, renamedTypeSourcePath)
}

function renamedTypeAssignedNoteHydrated(
  snapshot: MobileWorkspaceSnapshot,
  content: string | null,
) {
  return noteByPath(snapshot, renamedTypeAssignedNotePath)?.type === renamedTypeName
    && content?.includes(`type: ${renamedTypeName}`) === true
    && content?.includes('[[rename-target]]') === true
}

function renamedTypeSchemaRefsHydrated(snapshot: MobileWorkspaceSnapshot) {
  const schemaCarrier = snapshot.typeDefinitions?.[renamedTypeSchemaCarrierName]
  return schemaCarrier?.relationships?.related_to?.includes('[[rename-target]]') === true
    && schemaCarrier.rawContent?.includes('[[rename-target]]') === true
}

function noteByPath(snapshot: MobileWorkspaceSnapshot, path: string) {
  return (snapshot.allNotes ?? snapshot.notes).find((note) => note.path === path) ?? null
}

function seedNoteInitialContent() {
  return [
    '---',
    'type: Essay',
    'status: Draft',
    '---',
    '# Seeded Mobile Note',
    '',
    'Initial content.',
    '',
  ].join('\n')
}

function seedNoteUpdatedContent() {
  return [
    '---',
    'type: Essay',
    'status: Active',
    '---',
    '# Seeded Mobile Note',
    '',
    'This was saved before moving through native persistence.',
    '',
  ].join('\n')
}

function metadataNoteInitialContent() {
  return [
    '---',
    'type: Essay',
    'status: Draft',
    '---',
    '# Chrome State',
    '',
    'Metadata persistence proof seed.',
    '',
  ].join('\n')
}

function mobileCreatedNoteContent() {
  return [
    '---',
    'type: Essay',
    'status: Draft',
    'tags:',
    '  - Mobile',
    '---',
    '# Mobile Created',
    '',
    'Created through native workspace persistence.',
    '',
  ].join('\n')
}

function relationshipSourceContent() {
  return [
    '---',
    'type: Essay',
    'status: Draft',
    '---',
    '# Relationship Source',
    '',
    'Create a relationship target from this note.',
    '',
  ].join('\n')
}

function renamedTypeAssignedNoteContent() {
  return [
    '---',
    `type: ${renamedTypeSourceName}`,
    'status: Draft',
    '---',
    '# Type Rename Assigned',
    '',
    `References [[${renamedTypeSourceName}]].`,
    '',
  ].join('\n')
}

function renamedTypeSchemaCarrierContent() {
  return [
    '---',
    'type: Type',
    'color: orange',
    'icon: file-text',
    'related_to:',
    `  - "[[${renamedTypeSourceName}]]"`,
    '---',
    `# ${renamedTypeSchemaCarrierName}`,
    '',
  ].join('\n')
}

function typeDefinitionContent(name: string, color: string) {
  return [
    '---',
    'type: Type',
    `color: ${color}`,
    'icon: file-text',
    '---',
    `# ${name}`,
    '',
  ].join('\n')
}

function mobilePersistenceViewContent() {
  return [
    'name: Mobile Persistence',
    'icon: file-text',
    'color: green',
    'sort: modified:desc',
    'filters:',
    '  all:',
    '    - field: type',
    '      op: equals',
    '      value: Essay',
    '',
  ].join('\n')
}

function oldNativeProofViewContent() {
  return [
    `name: ${oldViewName}`,
    'icon: archive',
    'color: gray',
    'sort: null',
    'filters:',
    '  all: []',
    '',
  ].join('\n')
}
