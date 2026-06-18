import {
  parseLocalVaultDocument,
} from './localVaultFrontmatter'
import {
  mobileTypeDefinitionContent,
  mobileTypeDefinitionPath,
} from './mobileTypeDefinitions'
import {
  serializeMobileLocalVaultDocument,
  writeMobileFrontmatterContentValue,
} from './mobileFrontmatterWrites'
import type { MobileWorkspaceEdit, MobileWorkspaceEditResult, MobileWorkspaceWrite } from './mobileWorkspaceEditing'
import type {
  MobileNote,
  MobileTypeDefinition,
  MobileTypeDefinitions,
  MobileWorkspaceSnapshot,
} from './mobileWorkspaceModel'
import {
  noteWithWritePath,
  noteWritePath,
} from './mobileWorkspacePathRewrites'

type RenameTypeEdit = Extract<MobileWorkspaceEdit, { type: 'renameTypeDefinition' }>
type MarkdownContent = string
type TypeName = string
type TypeNameInput = string
type RebuildMobileWorkspaceSnapshot = (
  snapshot: MobileWorkspaceSnapshot,
  notes: MobileNote[],
  allNotes?: MobileNote[],
) => MobileWorkspaceSnapshot
type TypeRenameContext = {
  nextTypeName: TypeName
  sourceDefinition: MobileTypeDefinition
  sourceTypeName: TypeName
}
type TypeRenameWithDefinitions = TypeRenameContext & {
  typeDefinitions: MobileTypeDefinitions
}

const defaultTypeCanonicalCase = new Map([
  ['event', 'Event'],
  ['note', 'Note'],
  ['person', 'Person'],
  ['project', 'Project'],
])
const typeRenameAliases = new Map([['notes', 'Note']])

export function renameMobileTypeDefinition(
  snapshot: MobileWorkspaceSnapshot,
  edit: RenameTypeEdit,
  rebuildSnapshot: RebuildMobileWorkspaceSnapshot,
): MobileWorkspaceEditResult {
  const renameContext = typeRenameContext(snapshot, edit)
  if (!renameContext) return { snapshot, writes: [] }

  const renamedDefinition = renamedMobileTypeDefinition(renameContext)
  const typeDefinitions = renamedTypeDefinitions(snapshot.typeDefinitions, {
    definition: renamedDefinition,
    ...renameContext,
  })
  const renameWithDefinitions = { ...renameContext, typeDefinitions }
  const notes = renameTypeInNotes(snapshot.notes, renameWithDefinitions)
  const allNotes = snapshot.allNotes
    ? renameTypeInNotes(snapshot.allNotes, renameWithDefinitions)
    : undefined

  return {
    snapshot: rebuildSnapshot({ ...snapshot, typeDefinitions }, notes, allNotes),
    writes: renameTypeWrites(snapshot, {
      notes: allNotes ?? notes,
      renamedDefinition,
      ...renameContext,
    }),
  }
}

export function canRenameMobileTypeDefinition(
  definitions: MobileTypeDefinitions | undefined,
  sourceTypeName: TypeNameInput,
  nextTypeName: TypeNameInput,
): boolean {
  const sourceName = existingTypeDefinitionName(definitions, sourceTypeName)
  const normalizedNextTypeName = normalizeRenameTypeName(nextTypeName)
  if (!sourceName || !normalizedNextTypeName || sourceName === normalizedNextTypeName) return true

  return !conflictingTargetTypeName(definitions, {
    nextTypeName: normalizedNextTypeName,
    sourceTypeName: sourceName,
  })
}

export function mobileTypeRenameTargetName(value: TypeNameInput): TypeName {
  return normalizeRenameTypeName(value)
}

function typeRenameContext(
  snapshot: MobileWorkspaceSnapshot,
  edit: RenameTypeEdit,
): TypeRenameContext | null {
  const sourceTypeName = existingTypeDefinitionName(snapshot.typeDefinitions, edit.typeName)
  const nextTypeName = normalizeRenameTypeName(edit.nextTypeName)
  if (!sourceTypeName || !nextTypeName || sourceTypeName === nextTypeName) return null
  if (conflictingTargetTypeName(snapshot.typeDefinitions, { nextTypeName, sourceTypeName })) return null

  const sourceDefinition = snapshot.typeDefinitions?.[sourceTypeName]
  return sourceDefinition ? { nextTypeName, sourceDefinition, sourceTypeName } : null
}

function conflictingTargetTypeName(
  definitions: MobileTypeDefinitions | undefined,
  rename: Pick<TypeRenameContext, 'nextTypeName' | 'sourceTypeName'>,
): boolean {
  const targetTypeName = existingTypeDefinitionName(definitions, rename.nextTypeName)
  return Boolean(targetTypeName && targetTypeName !== rename.sourceTypeName)
}

function renamedMobileTypeDefinition(rename: TypeRenameContext): MobileTypeDefinition {
  const rawContent = renamedTypeContent(
    mobileTypeDefinitionContent(rename.nextTypeName, rename.sourceDefinition, { label: null }),
    rename.nextTypeName,
  )

  return {
    ...rename.sourceDefinition,
    label: null,
    path: mobileTypeDefinitionPath(rename.nextTypeName, undefined),
    rawContent,
  }
}

function renamedTypeDefinitions(
  definitions: MobileTypeDefinitions | undefined,
  rename: {
    definition: MobileTypeDefinition
    nextTypeName: string
    sourceTypeName: string
  },
): MobileTypeDefinitions {
  const nextDefinitions = { ...(definitions ?? {}) }
  Reflect.deleteProperty(nextDefinitions, rename.sourceTypeName)
  nextDefinitions[rename.nextTypeName] = rename.definition
  return nextDefinitions
}

function renameTypeInNotes(
  notes: MobileNote[],
  rename: TypeRenameWithDefinitions,
): MobileNote[] {
  return notes.map((note) => {
    if (isTypeDocumentNote(note, rename)) {
      return noteWithRenamedTypeDocument(note, rename)
    }

    if (note.type !== rename.sourceTypeName) return note
    return noteWithRenamedAssignedType(note, rename)
  })
}

function noteWithRenamedTypeDocument(
  note: MobileNote,
  rename: TypeRenameWithDefinitions,
): MobileNote {
  const definition = rename.typeDefinitions[rename.nextTypeName]
  const nextNote = noteWithWritePath(note, mobileTypeDefinitionPath(rename.nextTypeName, definition))

  return {
    ...nextNote,
    rawContent: definition?.rawContent ?? nextNote.rawContent,
    title: rename.nextTypeName,
  }
}

function noteWithRenamedAssignedType(
  note: MobileNote,
  rename: TypeRenameWithDefinitions,
): MobileNote {
  const rawContent = note.rawContent === undefined
    ? undefined
    : writeMobileFrontmatterContentValue(note.rawContent, 'type', rename.nextTypeName)

  return {
    ...note,
    rawContent,
    type: rename.nextTypeName,
    typeTone: rename.typeDefinitions[rename.nextTypeName]?.tone ?? note.typeTone,
  }
}

function renameTypeWrites(
  snapshot: MobileWorkspaceSnapshot,
  rename: TypeRenameContext & {
    notes: MobileNote[]
    renamedDefinition: MobileTypeDefinition
  },
): MobileWorkspaceWrite[] {
  return [
    ...moveTypeDocumentWrite(rename),
    ...saveTypeDocumentWrite(rename),
    ...saveAssignedTypeWrites(snapshot, rename),
  ]
}

function moveTypeDocumentWrite(rename: {
  nextTypeName: string
  renamedDefinition: MobileTypeDefinition
  sourceDefinition: MobileTypeDefinition
  sourceTypeName: string
}): MobileWorkspaceWrite[] {
  const previousPath = mobileTypeDefinitionPath(rename.sourceTypeName, rename.sourceDefinition)
  const nextPath = mobileTypeDefinitionPath(rename.nextTypeName, rename.renamedDefinition)
  return previousPath === nextPath ? [] : [{ kind: 'moveNote', path: previousPath, toPath: nextPath }]
}

function saveTypeDocumentWrite(rename: {
  nextTypeName: string
  renamedDefinition: MobileTypeDefinition
  sourceDefinition: MobileTypeDefinition
}): MobileWorkspaceWrite[] {
  const rawContent = rename.renamedDefinition.rawContent
  if (!rawContent || rawContent === rename.sourceDefinition.rawContent) return []

  return [{
    content: rawContent,
    kind: 'saveNote',
    path: mobileTypeDefinitionPath(rename.nextTypeName, rename.renamedDefinition),
  }]
}

function saveAssignedTypeWrites(
  snapshot: MobileWorkspaceSnapshot,
  rename: {
    notes: MobileNote[]
    sourceTypeName: string
  },
): MobileWorkspaceWrite[] {
  const previousByPath = new Map(workspaceNotePool(snapshot).map((note) => [noteWritePath(note), note]))

  return rename.notes.flatMap((note) => {
    const previousNote = previousByPath.get(noteWritePath(note))
    if (previousNote?.type !== rename.sourceTypeName) return []
    if (previousNote.rawContent === undefined || note.rawContent === undefined) return []
    if (previousNote.rawContent === note.rawContent) return []

    return [{
      content: note.rawContent,
      kind: 'saveNote' as const,
      path: noteWritePath(note),
    }]
  })
}

function isTypeDocumentNote(
  note: MobileNote,
  rename: TypeRenameContext,
): boolean {
  return note.type === 'Type'
    && (
      note.title === rename.sourceTypeName
      || noteWritePath(note) === mobileTypeDefinitionPath(rename.sourceTypeName, rename.sourceDefinition)
    )
}

function renamedTypeContent(content: MarkdownContent, nextTypeName: TypeName): MarkdownContent {
  const document = parseLocalVaultDocument(content)
  return serializeMobileLocalVaultDocument(
    document.frontmatter,
    bodyWithRenamedFirstHeading(document.body, nextTypeName),
  )
}

function bodyWithRenamedFirstHeading(body: MarkdownContent, nextTypeName: TypeName): MarkdownContent {
  const lines = body.split('\n')
  const headingIndex = lines.findIndex((line) => line.trim().length > 0)
  if (headingIndex === -1) return `# ${nextTypeName}\n`

  const firstLine = lines[headingIndex]
  if (!firstLine.startsWith('# ')) return `# ${nextTypeName}\n\n${body}`

  return [
    ...lines.slice(0, headingIndex),
    `# ${nextTypeName}`,
    ...lines.slice(headingIndex + 1),
  ].join('\n')
}

function existingTypeDefinitionName(
  definitions: MobileTypeDefinitions | undefined,
  typeName: TypeNameInput,
): TypeName | null {
  const cleanType = cleanTypeName(typeName)
  const typeSlug = slugifyTypeName(cleanType)
  return Object.keys(definitions ?? {}).find((candidate) => (
    candidate === cleanType || slugifyTypeName(candidate) === typeSlug
  )) ?? null
}

function normalizeRenameTypeName(value: TypeNameInput): TypeName {
  const cleanType = cleanTypeName(value)
  const lowerType = cleanType.toLowerCase()
  return typeRenameAliases.get(lowerType) ?? defaultTypeCanonicalCase.get(lowerType) ?? cleanType
}

function cleanTypeName(value: TypeNameInput): TypeName {
  return wikilinkTarget(value).replace(/\.md$/, '')
}

function slugifyTypeName(value: TypeName): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/gu, '')
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-|-$/gu, '') || 'type'
}

function wikilinkTarget(value: TypeNameInput): string {
  const match = value.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/)
  return (match?.[1] ?? value).trim()
}

function workspaceNotePool(snapshot: MobileWorkspaceSnapshot): MobileNote[] {
  return snapshot.allNotes ?? snapshot.notes
}
