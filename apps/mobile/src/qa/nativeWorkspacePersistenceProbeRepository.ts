import type { Directory, Paths } from 'expo-file-system'
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
const oldTypeName = 'Retired Proof'
const oldViewName = 'Old Native Proof'
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
  await baseRepository.persistWrites(workspacePersistenceProbeWrites(), request)

  const snapshot = baseRepository.readSnapshot(request)
  const movedNote = snapshot.allNotes?.find((note) => note.path === movedNotePath)
    ?? snapshot.notes.find((note) => note.path === movedNotePath)
  const movedContent = movedNote ? await baseRepository.readNoteContent(movedNote, request) : null

  console.info(nativeWorkspacePersistenceLogLine(workspacePersistenceProof(snapshot, movedContent)))
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

function workspacePersistenceProbeWrites() {
  return [
    ...seedWorkspacePersistenceProbeWrites(),
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
    {
      content: mobilePersistenceViewContent(),
      kind: 'saveView' as const,
      path: 'views/mobile-persistence.yml',
    },
    {
      kind: 'deleteView' as const,
      path: 'views/old-native-proof.yml',
    },
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

function seedWorkspacePersistenceProbeWrites() {
  return [
    {
      content: seedNoteInitialContent(),
      kind: 'createNote' as const,
      path: 'Writing/Seed.md',
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
  ]
}

function workspacePersistenceProof(
  snapshot: MobileWorkspaceSnapshot,
  movedContent: string | null,
): NativeWorkspacePersistenceProof {
  return {
    createdNoteHydrated: snapshotContainsNotePath(snapshot, createdNotePath),
    deletedTypeDefinitionRemoved: !typeDefinitionExists(snapshot, oldTypeName),
    deletedViewRemoved: !viewExists(snapshot, oldViewName),
    folderDeleteApplied: !folderPathStartsWith(snapshot, 'Scratch'),
    folderRenameApplied: folderRenameApplied(snapshot),
    movedNoteContentPreserved: movedContentPreserved(movedContent),
    persistedToNativeRepository: snapshot.source?.kind === 'localVault',
    savedViewHydrated: viewExists(snapshot, 'Mobile Persistence'),
    typeDefinitionHydrated: snapshot.typeDefinitions?.[typeName]?.tone === 'green',
  }
}

function folderRenameApplied(snapshot: MobileWorkspaceSnapshot) {
  return snapshot.folderPaths?.includes(renamedFolderPath) === true
    && snapshotContainsNotePath(snapshot, `${renamedFolderPath}/Keep.md`)
}

function snapshotContainsNotePath(snapshot: MobileWorkspaceSnapshot, path: string) {
  return Boolean(snapshot.allNotes?.some((note) => note.path === path) || snapshot.notes.some((note) => note.path === path))
}

function typeDefinitionExists(snapshot: MobileWorkspaceSnapshot, name: string) {
  return snapshot.typeDefinitions?.[name] !== undefined
}

function viewExists(snapshot: MobileWorkspaceSnapshot, name: string) {
  return snapshot.views?.some((view) => view.definition.name === name) === true
}

function folderPathStartsWith(snapshot: MobileWorkspaceSnapshot, pathPrefix: string) {
  return snapshot.folderPaths?.some((path) => path === pathPrefix || path.startsWith(`${pathPrefix}/`)) === true
}

function movedContentPreserved(content: string | null) {
  return content?.includes('saved before moving through native persistence') === true
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
