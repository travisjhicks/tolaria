import {
  frontmatterFlag,
  frontmatterList,
  frontmatterProperties,
  frontmatterRelationships,
  frontmatterScalar,
  parseLocalVaultDocument,
} from './localVaultFrontmatter'
import {
  deriveLocalVaultTitle,
  localVaultEditorBlocks,
  localVaultEditorBullets,
  localVaultSnippet,
} from './localVaultMarkdown'
import type {
  MobileNote,
  MobileProperty,
  MobilePropertyValue,
  MobileRelationship,
  MobileRelationshipKind,
  MobileRelationshipValue,
  MobileSidebarFolder,
  MobileSidebarSection,
  MobileTone,
  MobileWorkspaceSnapshot,
} from './mobileWorkspaceModel'

type AbsoluteVaultPath = string
type LocalVaultLabel = string
type NoteId = string
type NoteTitle = string
type NoteTypeName = string
type RelationshipLabel = string
type RelativeVaultPath = string
type TimestampMs = number
type VaultRootPath = string
type WikilinkTarget = string

export type LocalVaultFile = {
  absolutePath: AbsoluteVaultPath
  content: string
  createdAt: TimestampMs | null
  modifiedAt: TimestampMs | null
  relativePath: RelativeVaultPath
  size: number
}

export type LocalVaultSnapshotOptions = {
  files: LocalVaultFile[]
  maxNotes?: number
  vaultLabel: LocalVaultLabel
  vaultPath: VaultRootPath
}

type LocalVaultEntry = {
  archived: boolean
  body: string
  createdAt: TimestampMs | null
  favorite: boolean
  filename: string
  id: NoteId
  links: number
  modifiedAt: TimestampMs | null
  organized: boolean
  path: RelativeVaultPath
  properties: MobileProperty[]
  rawContent: string
  relationships: Record<RelationshipLabel, WikilinkTarget[]>
  status: string
  tags: string[]
  title: NoteTitle
  type: NoteTypeName
  typeTone: MobileTone
}

type RelationshipResolver = (target: WikilinkTarget) => LocalVaultEntry | null

const DEFAULT_MAX_NOTES = 80

export function buildLocalVaultWorkspaceSnapshot({
  files,
  maxNotes = DEFAULT_MAX_NOTES,
  vaultLabel,
}: LocalVaultSnapshotOptions): MobileWorkspaceSnapshot {
  const entries = applyTypeDefinitionTones(files.map(parseLocalVaultEntry))
  const noteEntries = entries.filter((entry) => entry.type !== 'Type')
  const visibleEntries = visibleNoteEntries(noteEntries)
  const selectedEntries = visibleEntries.slice(0, maxNotes)
  const resolveRelationship = relationshipResolver(entries)
  const notes = selectedEntries.map((entry) => localEntryToMobileNote(entry, resolveRelationship, vaultLabel))
  const selectedNoteId = notes[0]?.id

  return {
    editorBlocks: notes[0]?.editorBlocks ?? [],
    editorBullets: notes[0]?.editorBullets ?? [],
    noteListSubtitle: noteListSubtitle(notes.length, visibleEntries.length),
    notes,
    selectedNoteId,
    sidebarSections: sidebarSections(entries, noteEntries),
    source: {
      kind: 'localVault',
      label: vaultLabel,
      totalNotes: noteEntries.length,
      visibleNotes: notes.length,
    },
    sync: { kind: 'synced', minutesAgo: 0 },
  }
}

function applyTypeDefinitionTones(entries: LocalVaultEntry[]): LocalVaultEntry[] {
  const tones = new Map(
    entries
      .filter((entry) => entry.type === 'Type')
      .map((entry) => [entry.title, entry.typeTone]),
  )

  return entries.map((entry) => {
    if (entry.type === 'Type') return entry
    return {
      ...entry,
      typeTone: tones.get(entry.type) ?? entry.typeTone,
    }
  })
}

function parseLocalVaultEntry(file: LocalVaultFile): LocalVaultEntry {
  const document = parseLocalVaultDocument(file.content)
  const filename = file.relativePath.split('/').at(-1) ?? file.relativePath
  const type = cleanTypeName(frontmatterScalar(document.frontmatter, ['type', 'Is A', 'is_a']) ?? 'Note')
  const color = frontmatterScalar(document.frontmatter, ['color', '_color'])

  return {
    archived: frontmatterFlag(document.frontmatter, ['_archived', 'Archived', 'archived']),
    body: document.body,
    createdAt: file.createdAt,
    favorite: frontmatterFlag(document.frontmatter, ['_favorite', 'favorite']),
    filename,
    id: file.relativePath,
    links: linkCount(document.body),
    modifiedAt: file.modifiedAt,
    organized: frontmatterFlag(document.frontmatter, ['_organized']),
    path: file.relativePath,
    properties: mobileProperties(frontmatterProperties(document.frontmatter)),
    rawContent: file.content,
    relationships: frontmatterRelationships(document.frontmatter),
    status: frontmatterScalar(document.frontmatter, ['Status', 'status']) ?? '',
    tags: frontmatterList(document.frontmatter, ['tags', 'Tags']).slice(0, 8),
    title: deriveLocalVaultTitle({
      body: document.body,
      fallbackTitle: frontmatterScalar(document.frontmatter, ['title']),
      filename,
    }),
    type,
    typeTone: toneFromDesktopColor(color, type),
  }
}

function cleanTypeName(value: string): NoteTypeName {
  return wikilinkTarget(value).replace(/\.md$/, '')
}

function localEntryToMobileNote(
  entry: LocalVaultEntry,
  resolveRelationship: RelationshipResolver,
  vaultLabel: string,
): MobileNote {
  const blocks = localVaultEditorBlocks(entry.body)

  return {
    created: relativeDate(entry.createdAt),
    date: absoluteDate(entry.modifiedAt),
    editorBlocks: blocks,
    editorBullets: localVaultEditorBullets(blocks),
    favorite: entry.favorite,
    id: entry.id,
    links: entry.links,
    modified: relativeDate(entry.modifiedAt),
    archived: entry.archived,
    organized: entry.organized,
    path: entry.path,
    properties: entry.properties,
    rawContent: entry.rawContent,
    relationships: mobileRelationships(entry.relationships, resolveRelationship),
    snippet: localVaultSnippet(entry.body),
    status: entry.status,
    tags: entry.tags,
    title: entry.title,
    type: entry.type,
    typeTone: entry.typeTone,
    workspace: vaultLabel,
  }
}

function visibleNoteEntries(entries: LocalVaultEntry[]): LocalVaultEntry[] {
  const inbox = entries.filter((entry) => !entry.archived && !entry.organized)
  const source = inbox.length > 0 ? inbox : entries.filter((entry) => !entry.archived)

  return [...source].sort(compareByModifiedDate)
}

function compareByModifiedDate(left: LocalVaultEntry, right: LocalVaultEntry): number {
  return (right.modifiedAt ?? 0) - (left.modifiedAt ?? 0)
}

function noteListSubtitle(visibleCount: number, totalCount: number): string {
  if (visibleCount === totalCount) return totalCount.toLocaleString()
  return `${visibleCount.toLocaleString()} / ${totalCount.toLocaleString()}`
}

function sidebarSections(entries: LocalVaultEntry[], noteEntries: LocalVaultEntry[]): MobileSidebarSection[] {
  const activeNotes = noteEntries.filter((entry) => !entry.archived)
  const archivedNotes = noteEntries.filter((entry) => entry.archived)
  const inboxNotes = activeNotes.filter((entry) => !entry.organized)

  return [
    {
      id: 'primary',
      items: [
        { active: true, count: countText(inboxNotes.length), icon: 'inbox', id: 'inbox', label: 'Inbox' },
        { count: countText(activeNotes.length), icon: 'file', id: 'all-notes', label: 'All Notes' },
        { count: countText(archivedNotes.length), icon: 'archive', id: 'archive', label: 'Archive' },
      ],
    },
    favoritesSection(activeNotes),
    typesSection(activeNotes),
    foldersSection(entries),
  ]
}

function favoritesSection(entries: LocalVaultEntry[]): MobileSidebarSection {
  return {
    id: 'favorites',
    items: entries.filter((entry) => entry.favorite).slice(0, 8).map((entry) => ({
      icon: 'star',
      id: `favorite-${entry.id}`,
      label: entry.title,
      tone: entry.typeTone,
    })),
    label: 'Favorites',
  }
}

function typesSection(entries: LocalVaultEntry[]): MobileSidebarSection {
  const counts = new Map<string, { count: number; tone: MobileTone }>()
  for (const entry of entries) {
    const current = counts.get(entry.type) ?? { count: 0, tone: entry.typeTone }
    counts.set(entry.type, { ...current, count: current.count + 1 })
  }

  return {
    count: countText(entries.length),
    id: 'types',
    items: [...counts.entries()]
      .sort((left, right) => right[1].count - left[1].count)
      .slice(0, 10)
      .map(([type, value]) => ({
        count: countText(value.count),
        icon: 'file',
        id: `type-${type}`,
        label: pluralizeType(type),
        tone: value.tone,
      })),
    label: 'Types',
  }
}

function foldersSection(entries: LocalVaultEntry[]): MobileSidebarSection {
  return {
    folders: folderTree(entries),
    id: 'folders',
    label: 'Folders',
  }
}

function folderTree(entries: LocalVaultEntry[]): MobileSidebarFolder[] {
  const roots: MobileSidebarFolder[] = []

  for (const entry of entries) {
    const parts = entry.path.split('/').slice(0, -1).filter(visibleFolderSegment)
    let level = roots

    for (const part of parts) {
      const folder = findOrCreateFolder(level, part)
      level = folder.children
    }
  }

  sortFolderTree(roots)
  return roots
}

function findOrCreateFolder(folders: MobileSidebarFolder[], name: string): MobileSidebarFolder {
  const existing = folders.find((folder) => folder.name === name)
  if (existing) return existing

  const folder = { children: [], expanded: true, id: name, name }
  folders.push(folder)
  return folder
}

function sortFolderTree(folders: MobileSidebarFolder[]) {
  folders.sort(compareFolders)
  folders.forEach((folder) => sortFolderTree(folder.children))
}

function compareFolders(left: MobileSidebarFolder, right: MobileSidebarFolder): number {
  return left.name.localeCompare(right.name)
}

function visibleFolderSegment(segment: string): boolean {
  return Boolean(segment) && !segment.startsWith('.') && segment !== 'type'
}

function mobileRelationships(
  relationships: Record<RelationshipLabel, WikilinkTarget[]>,
  resolveRelationship: RelationshipResolver,
): MobileRelationship[] {
  return Object.entries(relationships).map(([label, values]) => ({
    key: label,
    kind: relationshipKind(label),
    label: relationshipLabel(label),
    values: values.map((value) => relationshipValue(value, resolveRelationship)),
  }))
}

function relationshipKind(label: RelationshipLabel): MobileRelationshipKind {
  const canonical = label.toLowerCase().replaceAll(' ', '_')
  if (canonical === 'belongs_to') return 'belongsTo'
  if (canonical === 'related_to') return 'relatedTo'
  if (canonical === 'has' || canonical.startsWith('has_')) return 'has'
  return 'custom'
}

function relationshipLabel(label: RelationshipLabel): string | undefined {
  return relationshipKind(label) === 'custom' ? humanizeRelationshipKey(label) : undefined
}

function relationshipValue(rawValue: WikilinkTarget, resolveRelationship: RelationshipResolver): MobileRelationshipValue {
  const target = wikilinkTarget(rawValue)
  const entry = resolveRelationship(target)

  return {
    id: entry?.id,
    ref: rawValue,
    title: entry?.title ?? target,
    type: entry?.type ?? 'Note',
    typeTone: entry?.typeTone ?? 'gray',
  }
}

function mobileProperties(properties: Record<string, unknown>): MobileProperty[] {
  return Object.entries(properties).map(([key, value]) => ({
    key,
    label: humanizeRelationshipKey(key),
    value: mobilePropertyValue(value),
  }))
}

function mobilePropertyValue(value: unknown): MobilePropertyValue {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string')
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value
  return ''
}

function relationshipResolver(entries: LocalVaultEntry[]): RelationshipResolver {
  const index = new Map<string, LocalVaultEntry>()
  for (const entry of entries) {
    index.set(normalizedTarget(entry.title), entry)
    index.set(normalizedTarget(entry.filename.replace(/\.[^.]+$/, '')), entry)
    index.set(normalizedTarget(entry.path.replace(/\.[^.]+$/, '')), entry)
  }

  return (target) => index.get(normalizedTarget(target)) ?? null
}

function normalizedTarget(target: WikilinkTarget): WikilinkTarget {
  return target.trim().toLowerCase()
}

function wikilinkTarget(value: string): WikilinkTarget {
  const match = value.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/)
  return (match?.[1] ?? value).trim()
}

function toneFromDesktopColor(color: string | null, type: NoteTypeName): MobileTone {
  const normalized = color?.trim().toLowerCase()
  if (isMobileTone(normalized)) return normalized

  const fallback = typeToneFallbacks[type]
  return fallback ?? 'gray'
}

function isMobileTone(value: string | null | undefined): value is MobileTone {
  return value === 'blue'
    || value === 'gray'
    || value === 'green'
    || value === 'orange'
    || value === 'purple'
    || value === 'red'
    || value === 'yellow'
}

const typeToneFallbacks: Record<string, MobileTone> = {
  Event: 'yellow',
  Experiment: 'red',
  Person: 'yellow',
  Procedure: 'purple',
  Project: 'red',
  Responsibility: 'purple',
  Topic: 'green',
  Type: 'blue',
}

function relativeDate(timestamp: TimestampMs | null): string {
  if (!timestamp) return '-'

  const elapsedMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60_000))
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`

  const elapsedHours = Math.round(elapsedMinutes / 60)
  if (elapsedHours < 48) return `${elapsedHours}h ago`

  const elapsedDays = Math.round(elapsedHours / 24)
  return `${elapsedDays}d ago`
}

function absoluteDate(timestamp: TimestampMs | null): string {
  if (!timestamp) return '-'
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(timestamp))
}

function linkCount(body: string): number {
  return body.match(/\[\[[^\]]+\]\]/g)?.length ?? 0
}

function countText(count: number): string {
  return count.toLocaleString()
}

function pluralizeType(type: NoteTypeName): string {
  if (type.endsWith('s')) return type
  if (type.endsWith('y')) return `${type.slice(0, -1)}ies`
  return `${type}s`
}

function humanizeRelationshipKey(label: RelationshipLabel): string {
  return label
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
