import appCommandManifest from '../../../../src/shared/appCommandManifest.json'
import { mobileText } from '../i18n/mobileText'
import type { MobileSidebarItemSelection } from '../components/workspace/MobileWorkspaceSidebar'
import type { MobileNote, MobileWorkspaceSnapshot } from './mobileWorkspaceModel'

type DesktopCommandKey = keyof typeof appCommandManifest.commands

export type MobileCommandGroup = 'Navigation' | 'Note' | 'View' | 'Settings'

export type MobileCommandPaletteCommand = {
  desktopCommand?: DesktopCommandKey
  enabled: boolean
  execute: () => void
  group: MobileCommandGroup
  id: string
  keywords: string[]
  label: string
  shortcut?: string
}

export type MobileCommandPaletteGroup = {
  group: MobileCommandGroup
  items: MobileCommandPaletteCommand[]
}

export type MobileCommandPaletteHandlers = {
  canRedoWorkspaceEdit: boolean
  canUndoWorkspaceEdit: boolean
  onOpenBacklinks?: () => void
  onOpenChangeNoteType?: () => void
  onOpenCreateNote: () => void
  onOpenCreateType: () => void
  onOpenFindInNote: () => void
  onOpenMoveNoteToFolder?: () => void
  onOpenNativeVault?: () => void
  onOpenReplaceInNote: () => void
  onOpenSearch: () => void
  onOpenSetNoteIcon?: () => void
  onOpenTableOfContents: () => void
  onCopyDeepLink?: () => void
  onDeleteNote: () => void
  onExportNoteAsPdf?: () => void
  onRemoveNoteIcon?: () => void
  onRedoWorkspaceEdit: () => void
  onSelectSidebarItem: (selection: MobileSidebarItemSelection) => void
  onSetArchived: (archived: boolean) => void
  onSetOrganized: (organized: boolean) => void
  onToggleFavorite: () => void
  onToggleProperties?: () => void
  onToggleRawEditor?: () => void
  onUndoWorkspaceEdit: () => void
  onUpdateNoteContent?: (noteId: string, content: string) => void
  onViewAll?: () => void
  onViewEditorList?: () => void
  onViewEditorOnly?: () => void
  selectedNote: MobileNote | null
  snapshot: MobileWorkspaceSnapshot
}

type CommandConfig = {
  desktopCommand: DesktopCommandKey
  enabled?: boolean
  execute?: () => void
  group: MobileCommandGroup
  keywords: string[]
  label: string
}

type DynamicCommandConfig = Omit<CommandConfig, 'desktopCommand'> & { id: string; shortcut?: string }
type MobileTextKey = Parameters<typeof mobileText>[0]
type SelectedNoteCommandExecutor = (
  handlers: MobileCommandPaletteHandlers,
  note: MobileNote | null,
) => (() => void) | undefined
type SelectedNoteCommandPredicate = (
  handlers: MobileCommandPaletteHandlers,
  note: MobileNote | null,
) => boolean
type SelectedNoteCommandLabel = MobileTextKey | ((note: MobileNote | null) => MobileTextKey)
type SelectedNoteCommandSpec = {
  enabled: SelectedNoteCommandPredicate
  execute: SelectedNoteCommandExecutor
  keywords: string[]
  label: SelectedNoteCommandLabel
} & (
  | { desktopCommand: DesktopCommandKey; kind: 'desktop' }
  | { id: string; kind: 'dynamic' }
)

const commandGroupOrder: MobileCommandGroup[] = ['Navigation', 'Note', 'View', 'Settings']
const selectedNoteCommandSpecs: SelectedNoteCommandSpec[] = [
  {
    desktopCommand: 'fileSave',
    enabled: (handlers, note) => selectedNoteCommandEnabled(note, handlers.onUpdateNoteContent),
    execute: saveSelectedNote,
    kind: 'desktop',
    keywords: ['save', 'write'],
    label: 'command.note.saveNote',
  },
  {
    desktopCommand: 'noteToggleFavorite',
    enabled: (_handlers, note) => hasSelectedNote(note),
    execute: (handlers, note) => (note ? handlers.onToggleFavorite : undefined),
    kind: 'desktop',
    keywords: ['favorite', 'star', 'pin'],
    label: favoriteLabelKey,
  },
  {
    desktopCommand: 'noteToggleOrganized',
    enabled: (_handlers, note) => hasSelectedNote(note),
    execute: setSelectedNoteOrganized,
    kind: 'desktop',
    keywords: ['organized', 'inbox', 'triage'],
    label: organizedLabelKey,
  },
  {
    desktopCommand: 'noteArchive',
    enabled: (_handlers, note) => hasSelectedNote(note),
    execute: setSelectedNoteArchived,
    kind: 'desktop',
    keywords: ['archive'],
    label: archiveLabelKey,
  },
  {
    desktopCommand: 'noteDelete',
    enabled: (_handlers, note) => hasSelectedNote(note),
    execute: (handlers, note) => (note ? handlers.onDeleteNote : undefined),
    kind: 'desktop',
    keywords: ['delete', 'remove'],
    label: 'command.note.deleteNote',
  },
  {
    desktopCommand: 'noteExportPdf',
    enabled: (handlers, note) => selectedNoteCommandEnabled(note, handlers.onExportNoteAsPdf),
    execute: (handlers) => handlers.onExportNoteAsPdf,
    kind: 'desktop',
    keywords: ['export', 'pdf', 'print', 'share'],
    label: 'command.note.exportPdf',
  },
  {
    enabled: (handlers, note) => selectedNoteCommandEnabled(note, handlers.onCopyDeepLink),
    execute: (handlers) => handlers.onCopyDeepLink,
    id: 'copy-active-deep-link',
    kind: 'dynamic',
    keywords: ['copy', 'deep link', 'url', 'link'],
    label: 'command.note.copyDeepLink',
  },
  {
    enabled: (handlers, note) => selectedNoteCommandEnabled(note, handlers.onOpenSetNoteIcon),
    execute: (handlers) => handlers.onOpenSetNoteIcon,
    id: 'set-note-icon',
    kind: 'dynamic',
    keywords: ['icon', 'emoji'],
    label: 'command.note.setIcon',
  },
  {
    enabled: (handlers, note) => selectedNoteIconCommandEnabled(note, handlers.onRemoveNoteIcon),
    execute: (handlers) => handlers.onRemoveNoteIcon,
    id: 'remove-note-icon',
    kind: 'dynamic',
    keywords: ['icon', 'emoji', 'remove', 'delete'],
    label: 'command.note.removeIcon',
  },
  {
    enabled: (handlers, note) => selectedNoteCommandEnabled(note, handlers.onOpenChangeNoteType),
    execute: (handlers) => handlers.onOpenChangeNoteType,
    id: 'change-note-type',
    kind: 'dynamic',
    keywords: ['type', 'change'],
    label: 'command.note.changeType',
  },
  {
    enabled: (handlers, note) => selectedNoteCommandEnabled(note, handlers.onOpenMoveNoteToFolder),
    execute: (handlers) => handlers.onOpenMoveNoteToFolder,
    id: 'move-note-to-folder',
    kind: 'dynamic',
    keywords: ['move', 'folder', 'organize'],
    label: 'command.note.moveToFolder',
  },
]

export function buildMobileCommandPaletteCommands(
  handlers: MobileCommandPaletteHandlers,
): MobileCommandPaletteCommand[] {
  return [
    ...navigationCommands(handlers),
    ...noteCreationCommands(handlers),
    ...noteHistoryCommands(handlers),
    ...noteFindCommands(handlers),
    ...selectedNoteCommands(handlers),
    ...viewCommands(handlers),
    ...settingsCommands(handlers),
  ]
}

export function mobileCommandPaletteResults(
  commands: MobileCommandPaletteCommand[],
  query: string,
): { flatList: MobileCommandPaletteCommand[]; groups: MobileCommandPaletteGroup[] } {
  const enabledCommands = commands.filter((command) => command.enabled)
  const trimmedQuery = query.trim()
  const flatList = trimmedQuery
    ? enabledCommands
      .map((command) => matchedCommand(trimmedQuery, command))
      .filter((match): match is { command: MobileCommandPaletteCommand; score: number } => match !== null)
      .sort((left, right) => right.score - left.score)
      .map((match) => match.command)
    : enabledCommands

  return {
    flatList,
    groups: groupCommands(flatList, trimmedQuery.length > 0),
  }
}

export function mobileCommandGroupLabel(group: MobileCommandGroup): string {
  if (group === 'Navigation') return mobileText('command.group.navigation')
  if (group === 'Note') return mobileText('command.group.note')
  if (group === 'View') return mobileText('command.group.view')
  return mobileText('command.group.settings')
}

export function mobilePrimarySidebarSelection(
  snapshot: MobileWorkspaceSnapshot,
  itemId: 'all-notes' | 'archive' | 'inbox',
): MobileSidebarItemSelection | null {
  const item = snapshot.sidebarSections
    .find((section) => section.id === 'primary')
    ?.items
    ?.find((candidate) => candidate.id === itemId)

  if (!item) return null

  return {
    count: item.count,
    id: item.id,
    label: item.label,
    noteId: item.noteId,
    sectionId: 'primary',
    typeName: item.typeName,
    viewId: item.viewId,
  }
}

function navigationCommands(handlers: MobileCommandPaletteHandlers): MobileCommandPaletteCommand[] {
  return [
    command({
      desktopCommand: 'fileQuickOpen',
      execute: handlers.onOpenSearch,
      group: 'Navigation',
      keywords: ['quick', 'open', 'find'],
      label: mobileText('command.navigation.searchNotes'),
    }),
    primaryNavigationCommand('goInbox', 'inbox', mobileText('command.navigation.goInbox'), handlers),
    primaryNavigationCommand('goAllNotes', 'all-notes', mobileText('command.navigation.goAllNotes'), handlers),
    primaryNavigationCommand('goArchived', 'archive', mobileText('command.navigation.goArchived'), handlers),
  ]
}

function noteCreationCommands(handlers: MobileCommandPaletteHandlers): MobileCommandPaletteCommand[] {
  return [
    command({
      desktopCommand: 'fileNewNote',
      execute: handlers.onOpenCreateNote,
      group: 'Note',
      keywords: ['new', 'create', 'add'],
      label: mobileText('command.note.newNote'),
    }),
    command({
      desktopCommand: 'fileNewType',
      execute: handlers.onOpenCreateType,
      group: 'Note',
      keywords: ['new', 'create', 'type', 'template'],
      label: mobileText('command.note.newType'),
    }),
  ]
}

function noteHistoryCommands(handlers: MobileCommandPaletteHandlers): MobileCommandPaletteCommand[] {
  return [
    command({
      desktopCommand: 'editUndo',
      enabled: handlers.canUndoWorkspaceEdit,
      execute: handlers.onUndoWorkspaceEdit,
      group: 'Note',
      keywords: ['undo', 'history', 'revert'],
      label: mobileText('command.note.undo'),
    }),
    command({
      desktopCommand: 'editRedo',
      enabled: handlers.canRedoWorkspaceEdit,
      execute: handlers.onRedoWorkspaceEdit,
      group: 'Note',
      keywords: ['redo', 'history', 'repeat'],
      label: mobileText('command.note.redo'),
    }),
  ]
}

function noteFindCommands(handlers: MobileCommandPaletteHandlers): MobileCommandPaletteCommand[] {
  return [
    command({
      desktopCommand: 'editFindInNote',
      execute: handlers.onOpenFindInNote,
      group: 'Note',
      keywords: ['find', 'search', 'current note'],
      label: mobileText('command.note.findInNote'),
    }),
    command({
      desktopCommand: 'editReplaceInNote',
      execute: handlers.onOpenReplaceInNote,
      group: 'Note',
      keywords: ['replace', 'find', 'current note'],
      label: mobileText('command.note.replaceInNote'),
    }),
    command({
      desktopCommand: 'editFindInVault',
      execute: handlers.onOpenSearch,
      group: 'Navigation',
      keywords: ['find', 'search', 'vault', 'all notes'],
      label: mobileText('menu.edit.findInVault'),
    }),
  ]
}

function selectedNoteCommands(handlers: MobileCommandPaletteHandlers): MobileCommandPaletteCommand[] {
  const note = handlers.selectedNote

  return selectedNoteCommandSpecs.map((spec) => selectedNoteCommand(spec, handlers, note))
}

function selectedNoteCommand(
  spec: SelectedNoteCommandSpec,
  handlers: MobileCommandPaletteHandlers,
  note: MobileNote | null,
): MobileCommandPaletteCommand {
  const config = {
    enabled: spec.enabled(handlers, note),
    execute: spec.execute(handlers, note),
    group: 'Note' as const,
    keywords: spec.keywords,
    label: mobileText(selectedNoteCommandLabel(spec.label, note)),
  }

  if (spec.kind === 'desktop') {
    return command({ ...config, desktopCommand: spec.desktopCommand })
  }

  return dynamicCommand({ ...config, id: spec.id })
}

function selectedNoteCommandLabel(
  label: SelectedNoteCommandLabel,
  note: MobileNote | null,
): MobileTextKey {
  return typeof label === 'function' ? label(note) : label
}

function hasSelectedNote(note: MobileNote | null): boolean {
  return note !== null
}

function selectedNoteCommandEnabled(
  note: MobileNote | null,
  handler: unknown,
): boolean {
  return hasSelectedNote(note) && handler !== undefined
}

function selectedNoteIconCommandEnabled(
  note: MobileNote | null,
  handler: unknown,
): boolean {
  return typeof note?.icon === 'string' && note.icon.length > 0 && handler !== undefined
}

function saveSelectedNote(
  handlers: MobileCommandPaletteHandlers,
  note: MobileNote | null,
): (() => void) | undefined {
  const saveContent = handlers.onUpdateNoteContent
  if (!note || saveContent === undefined) return undefined
  return () => saveContent(note.id, note.rawContent ?? '')
}

function setSelectedNoteOrganized(
  handlers: MobileCommandPaletteHandlers,
  note: MobileNote | null,
): (() => void) | undefined {
  if (!note) return undefined
  return () => handlers.onSetOrganized(!note.organized)
}

function setSelectedNoteArchived(
  handlers: MobileCommandPaletteHandlers,
  note: MobileNote | null,
): (() => void) | undefined {
  if (!note) return undefined
  return () => handlers.onSetArchived(!note.archived)
}

function favoriteLabelKey(note: MobileNote | null) {
  return note?.favorite ? 'command.note.removeFavorite' : 'command.note.addFavorite'
}

function organizedLabelKey(note: MobileNote | null) {
  return note?.organized ? 'command.note.markUnorganized' : 'command.note.markOrganized'
}

function archiveLabelKey(note: MobileNote | null) {
  return note?.archived ? 'command.note.unarchiveNote' : 'command.note.archiveNote'
}

function viewCommands(handlers: MobileCommandPaletteHandlers): MobileCommandPaletteCommand[] {
  return [
    command({
      desktopCommand: 'viewEditorOnly',
      execute: handlers.onViewEditorOnly,
      group: 'View',
      keywords: ['layout', 'focus', 'editor'],
      label: mobileText('command.view.editorOnly'),
    }),
    command({
      desktopCommand: 'viewEditorList',
      execute: handlers.onViewEditorList,
      group: 'View',
      keywords: ['layout', 'notes', 'list'],
      label: mobileText('command.view.editorNoteList'),
    }),
    command({
      desktopCommand: 'viewAll',
      execute: handlers.onViewAll,
      group: 'View',
      keywords: ['layout', 'sidebar', 'all panels'],
      label: mobileText('command.view.fullLayout'),
    }),
    command({
      desktopCommand: 'viewToggleProperties',
      execute: handlers.onToggleProperties,
      group: 'View',
      keywords: ['properties', 'inspector', 'panel'],
      label: mobileText('command.view.toggleProperties'),
    }),
    command({
      desktopCommand: 'viewToggleTableOfContents',
      enabled: handlers.selectedNote !== null,
      execute: handlers.onOpenTableOfContents,
      group: 'View',
      keywords: ['toc', 'headings', 'outline'],
      label: mobileText('menu.note.toggleTableOfContents'),
    }),
    command({
      desktopCommand: 'viewToggleBacklinks',
      enabled: handlers.selectedNote !== null && handlers.onOpenBacklinks !== undefined,
      execute: handlers.onOpenBacklinks,
      group: 'View',
      keywords: ['backlinks', 'references', 'mentions'],
      label: mobileText('command.view.toggleBacklinks'),
    }),
    command({
      desktopCommand: 'editToggleRawEditor',
      enabled: handlers.selectedNote !== null && handlers.onToggleRawEditor !== undefined,
      execute: handlers.onToggleRawEditor,
      group: 'View',
      keywords: ['raw', 'source', 'markdown', 'frontmatter'],
      label: mobileText('command.view.toggleRaw'),
    }),
  ]
}

function settingsCommands(handlers: MobileCommandPaletteHandlers): MobileCommandPaletteCommand[] {
  return [
    command({
      desktopCommand: 'vaultOpen',
      enabled: handlers.onOpenNativeVault !== undefined,
      execute: handlers.onOpenNativeVault,
      group: 'Settings',
      keywords: ['vault', 'open', 'folder'],
      label: mobileText('command.settings.openVault'),
    }),
  ]
}

function primaryNavigationCommand(
  desktopCommand: DesktopCommandKey,
  itemId: 'all-notes' | 'archive' | 'inbox',
  label: string,
  handlers: MobileCommandPaletteHandlers,
): MobileCommandPaletteCommand {
  const selection = mobilePrimarySidebarSelection(handlers.snapshot, itemId)
  return command({
    desktopCommand,
    enabled: selection !== null,
    execute: selection ? () => handlers.onSelectSidebarItem(selection) : undefined,
    group: 'Navigation',
    keywords: [itemId, 'go', 'navigate', 'sidebar'],
    label,
  })
}

function command(config: CommandConfig): MobileCommandPaletteCommand {
  const manifestCommand = appCommandManifest.commands[config.desktopCommand]
  const shortcut = 'shortcut' in manifestCommand ? manifestCommand.shortcut?.display : undefined

  return {
    desktopCommand: config.desktopCommand,
    enabled: config.enabled ?? config.execute !== undefined,
    execute: config.execute ?? noop,
    group: config.group,
    id: manifestCommand.id,
    keywords: config.keywords,
    label: config.label,
    shortcut,
  }
}

function dynamicCommand(config: DynamicCommandConfig): MobileCommandPaletteCommand {
  return {
    enabled: config.enabled ?? config.execute !== undefined,
    execute: config.execute ?? noop,
    group: config.group,
    id: config.id,
    keywords: config.keywords,
    label: config.label,
    shortcut: config.shortcut,
  }
}

function matchedCommand(
  query: string,
  command: MobileCommandPaletteCommand,
): { command: MobileCommandPaletteCommand; score: number } | null {
  const labelResult = fuzzyMatch(query, command.label)
  if (labelResult.match) return { command, score: labelResult.score }

  for (const keyword of command.keywords) {
    const keywordResult = fuzzyMatch(query, keyword)
    if (keywordResult.match) return { command, score: keywordResult.score - 1 }
  }

  const groupResult = fuzzyMatch(query, command.group)
  if (groupResult.match) return { command, score: groupResult.score - 2 }
  return null
}

function groupCommands(
  commands: MobileCommandPaletteCommand[],
  byRelevance: boolean,
): MobileCommandPaletteGroup[] {
  const groups = new Map<MobileCommandGroup, MobileCommandPaletteCommand[]>()
  for (const commandItem of commands) {
    groups.set(commandItem.group, [...(groups.get(commandItem.group) ?? []), commandItem])
  }

  const entries = Array.from(groups.entries())
  if (!byRelevance) {
    entries.sort((left, right) => commandGroupOrder.indexOf(left[0]) - commandGroupOrder.indexOf(right[0]))
  }

  return entries.map(([group, items]) => ({ group, items }))
}

function fuzzyMatch(query: string, target: string): { match: boolean; score: number } {
  const q = query.toLowerCase()
  const t = target.toLowerCase()
  let qi = 0
  let score = 0
  let lastMatchIndex = -1

  for (let ti = 0; ti < t.length && qi < q.length; ti += 1) {
    if (t.charAt(ti) !== q.charAt(qi)) continue
    if (ti === lastMatchIndex + 1) score += 2
    if (ti === 0 || [' ', '-'].includes(t.charAt(ti - 1))) score += 3
    score += 1
    lastMatchIndex = ti
    qi += 1
  }

  return { match: qi === q.length, score }
}

function noop() {}
