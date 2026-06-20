import appCommandManifest from '../../../../src/shared/appCommandManifest.json'
import { mobileText } from '../i18n/mobileText'
import type {
  MobileSidebarFolderSelection,
  MobileSidebarItemSelection,
} from '../components/workspace/MobileWorkspaceSidebar'
import type {
  MobileNote,
  MobileNoteWidth,
  MobileSidebarFolder,
  MobileSidebarItem,
  MobileWorkspaceSnapshot,
} from './mobileWorkspaceModel'
import type { MobileNoteListFilter } from './mobileNoteFilters'

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
  activeFolderId?: string | null
  activeItemId?: string | null
  canGoBack?: boolean
  canGoForward?: boolean
  canMoveSelectedViewDown?: boolean
  canMoveSelectedViewUp?: boolean
  canRedoWorkspaceEdit: boolean
  canUndoWorkspaceEdit: boolean
  defaultNoteWidth?: MobileNoteWidth | null
  onCreateNote?: (titleOverride?: string) => void
  onCreateNoteOfType?: (typeName: string) => void
  onOpenBacklinks?: () => void
  onOpenChangeNoteType?: () => void
  onOpenCreateNote: () => void
  onOpenCreateType: () => void
  onCopyFilePath?: () => void
  onCopySelectedFolderPath?: () => void
  onOpenFindInNote: () => void
  onOpenFileInDefaultApp?: () => void
  onOpenFolderActions?: (selection: MobileSidebarFolderSelection) => void
  onOpenMoveNoteToFolder?: () => void
  onOpenNativeVault?: () => void
  onOpenReplaceInNote: () => void
  onOpenRenameNoteFile?: () => void
  onOpenSearch: () => void
  onOpenPrimaryActions?: (selection: MobileSidebarItemSelection) => void
  onOpenSetNoteIcon?: () => void
  onOpenTableOfContents: () => void
  onOpenTypeActions?: (selection: MobileSidebarItemSelection) => void
  onOpenViewActions?: (selection: MobileSidebarItemSelection) => void
  onMoveSelectedViewDown?: () => void
  onMoveSelectedViewUp?: () => void
  onDeleteSelectedFolder?: () => void
  onGoBack?: () => void
  onGoForward?: () => void
  onNoteListFilterChange?: (filter: MobileNoteListFilter) => void
  onPastePlainText?: () => void
  onCopyDeepLink?: () => void
  onDeleteNote: () => void
  onEnterNeighborhood?: (noteId: string) => void
  onExportNoteAsPdf?: () => void
  onReloadVault?: () => void
  onRemoveNoteIcon?: () => void
  onRenameNoteFileToTitle?: () => void
  onRedoWorkspaceEdit: () => void
  onRevealSelectedFolder?: () => void
  onRevealFile?: () => void
  onSaveActiveEditor?: () => void
  onSelectSidebarItem: (selection: MobileSidebarItemSelection) => void
  onSetArchived: (archived: boolean) => void
  onSetDefaultNoteWidth?: (mode: MobileNoteWidth) => void
  onSetOrganized: (organized: boolean) => void
  onToggleFavorite: () => void
  onToggleNoteWidth?: () => void
  onToggleProperties?: () => void
  onToggleRawEditor?: () => void
  onUndoWorkspaceEdit: () => void
  onUpdateNoteContent?: (noteId: string, content: string) => void
  onViewAll?: () => void
  onViewEditorList?: () => void
  onViewEditorOnly?: () => void
  noteListFilter?: MobileNoteListFilter
  noteListFilterVisible?: boolean
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
type ActiveSidebarItem = MobileSidebarItem & { sectionId: string }
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
  group?: MobileCommandGroup
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
    enabled: (_handlers, note) => isMarkdownSelectedNote(note),
    execute: (handlers, note) => (note ? handlers.onToggleFavorite : undefined),
    kind: 'desktop',
    keywords: ['favorite', 'star', 'pin'],
    label: favoriteLabelKey,
  },
  {
    desktopCommand: 'noteToggleOrganized',
    enabled: (_handlers, note) => isMarkdownSelectedNote(note),
    execute: setSelectedNoteOrganized,
    kind: 'desktop',
    keywords: ['organized', 'inbox', 'triage'],
    label: organizedLabelKey,
  },
  {
    desktopCommand: 'noteArchive',
    enabled: (_handlers, note) => isMarkdownSelectedNote(note),
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
    enabled: (handlers, note) => markdownSelectedNoteCommandEnabled(note, handlers.onExportNoteAsPdf),
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
    enabled: (handlers, note) => selectedNoteCommandEnabled(note, handlers.onCopyFilePath),
    execute: (handlers) => handlers.onCopyFilePath,
    id: 'copy-active-file-path',
    kind: 'dynamic',
    keywords: ['file', 'path', 'copy', 'clipboard', 'filesystem'],
    label: 'editor.toolbar.copyFilePath',
  },
  {
    enabled: (handlers, note) => selectedNoteCommandEnabled(note, handlers.onRevealFile),
    execute: (handlers) => handlers.onRevealFile,
    id: 'reveal-active-file',
    kind: 'dynamic',
    keywords: ['file', 'folder', 'finder', 'reveal', 'show', 'filesystem'],
    label: 'editor.toolbar.revealFile',
  },
  {
    enabled: (handlers, note) => textLikeSelectedNoteCommandEnabled(note, handlers.onEnterNeighborhood),
    execute: openSelectedNeighborhood,
    id: 'open-active-neighborhood',
    kind: 'dynamic',
    keywords: ['neighborhood', 'map', 'relationships', 'related', 'graph'],
    label: 'editor.toolbar.openNeighborhood',
  },
  {
    enabled: (handlers, note) => markdownSelectedNoteCommandEnabled(note, handlers.onOpenSetNoteIcon),
    execute: (handlers) => handlers.onOpenSetNoteIcon,
    id: 'set-note-icon',
    kind: 'dynamic',
    keywords: ['icon', 'emoji'],
    label: 'command.note.setIcon',
  },
  {
    enabled: (handlers, note) => markdownSelectedNoteIconCommandEnabled(note, handlers.onRemoveNoteIcon),
    execute: (handlers) => handlers.onRemoveNoteIcon,
    id: 'remove-note-icon',
    kind: 'dynamic',
    keywords: ['icon', 'emoji', 'remove', 'delete'],
    label: 'command.note.removeIcon',
  },
  {
    enabled: (handlers, note) => markdownSelectedNoteCommandEnabled(note, handlers.onOpenChangeNoteType),
    execute: (handlers) => handlers.onOpenChangeNoteType,
    id: 'change-note-type',
    kind: 'dynamic',
    keywords: ['type', 'change'],
    label: 'command.note.changeType',
  },
  {
    enabled: (handlers, note) => markdownSelectedNoteCommandEnabled(note, handlers.onOpenMoveNoteToFolder),
    execute: (handlers) => handlers.onOpenMoveNoteToFolder,
    id: 'move-note-to-folder',
    kind: 'dynamic',
    keywords: ['move', 'folder', 'organize'],
    label: 'command.note.moveToFolder',
  },
  {
    enabled: (handlers, note) => markdownSelectedNoteCommandEnabled(note, handlers.onOpenRenameNoteFile),
    execute: (handlers) => handlers.onOpenRenameNoteFile,
    id: 'rename-active-file',
    kind: 'dynamic',
    keywords: ['rename', 'filename', 'file', 'path'],
    label: 'editor.filename.rename',
  },
  {
    enabled: (handlers, note) => markdownSelectedNoteCommandEnabled(note, handlers.onRenameNoteFileToTitle),
    execute: (handlers) => handlers.onRenameNoteFileToTitle,
    id: 'rename-active-file-to-title',
    kind: 'dynamic',
    keywords: ['rename', 'filename', 'title', 'file'],
    label: 'editor.filename.renameToTitle',
  },
  {
    enabled: (handlers, note) => nonMarkdownSelectedNoteCommandEnabled(note, handlers.onOpenFileInDefaultApp),
    execute: (handlers) => handlers.onOpenFileInDefaultApp,
    id: 'open-active-file-external',
    kind: 'dynamic',
    keywords: ['file', 'open', 'external', 'default', 'attachment'],
    label: 'editor.toolbar.openFileInDefaultApp',
  },
  {
    enabled: (handlers, note) => markdownSelectedNoteCommandEnabled(note, handlers.onToggleNoteWidth)
      && note?.noteWidth !== 'wide',
    execute: (handlers) => handlers.onToggleNoteWidth,
    group: 'View',
    id: 'set-note-width-wide',
    kind: 'dynamic',
    keywords: ['layout', 'note', 'column', 'width', 'wide', 'reading'],
    label: 'command.view.noteWidthWide',
  },
  {
    enabled: (handlers, note) => markdownSelectedNoteCommandEnabled(note, handlers.onToggleNoteWidth)
      && note?.noteWidth === 'wide',
    execute: (handlers) => handlers.onToggleNoteWidth,
    group: 'View',
    id: 'set-note-width-normal',
    kind: 'dynamic',
    keywords: ['layout', 'note', 'column', 'width', 'normal', 'reading'],
    label: 'command.view.noteWidthNormal',
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
    workspaceHistoryCommand('viewGoBack', handlers.canGoBack, handlers.onGoBack, mobileText('command.navigation.goBack')),
    workspaceHistoryCommand('viewGoForward', handlers.canGoForward, handlers.onGoForward, mobileText('command.navigation.goForward')),
    ...folderNavigationCommands(handlers),
    ...typeSectionNavigationCommands(handlers),
    ...noteListFilterCommands(handlers),
  ]
}

function folderNavigationCommands(handlers: MobileCommandPaletteHandlers): MobileCommandPaletteCommand[] {
  const folder = activeSidebarFolder(handlers)

  return [
    dynamicCommand({
      enabled: Boolean(folder && handlers.onRevealSelectedFolder),
      execute: handlers.onRevealSelectedFolder,
      group: 'Navigation',
      id: 'reveal-selected-folder',
      keywords: ['folder', 'directory', 'finder', 'reveal', 'show', 'filesystem'],
      label: mobileText('sidebar.action.revealFolderMenu'),
    }),
    dynamicCommand({
      enabled: Boolean(folder && handlers.onCopySelectedFolderPath),
      execute: handlers.onCopySelectedFolderPath,
      group: 'Navigation',
      id: 'copy-selected-folder-path',
      keywords: ['folder', 'directory', 'path', 'copy', 'clipboard'],
      label: mobileText('sidebar.action.copyFolderPathMenu'),
    }),
    dynamicCommand({
      enabled: Boolean(folder && handlers.onOpenFolderActions),
      execute: folder ? () => handlers.onOpenFolderActions?.(folder) : undefined,
      group: 'Navigation',
      id: 'rename-folder',
      keywords: ['folder', 'directory', 'sidebar', 'rename'],
      label: mobileText('command.navigation.renameFolder'),
    }),
    dynamicCommand({
      enabled: Boolean(folder && handlers.onDeleteSelectedFolder),
      execute: handlers.onDeleteSelectedFolder,
      group: 'Navigation',
      id: 'delete-folder',
      keywords: ['folder', 'directory', 'sidebar', 'delete', 'remove'],
      label: mobileText('command.navigation.deleteFolder'),
    }),
  ]
}

function typeSectionNavigationCommands(handlers: MobileCommandPaletteHandlers): MobileCommandPaletteCommand[] {
  return typeSidebarItems(handlers.snapshot).map((item) => dynamicCommand({
    enabled: true,
    execute: () => handlers.onSelectSidebarItem(sidebarSelectionFromTypeItem(item)),
    group: 'Navigation',
    id: `list-${commandSlug(item.typeName ?? item.label)}`,
    keywords: ['list', 'show', 'filter', item.label, item.typeName ?? 'type'],
    label: mobileText('command.navigation.listType').replace('{type}', item.label),
  }))
}

function noteListFilterCommands(handlers: MobileCommandPaletteHandlers): MobileCommandPaletteCommand[] {
  if (!handlers.noteListFilterVisible || handlers.onNoteListFilterChange === undefined) return []

  return [
    noteListFilterCommand('open', mobileText('command.navigation.showOpenNotes'), handlers),
    noteListFilterCommand('archived', mobileText('command.navigation.showArchivedNotes'), handlers),
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
    currentFolderNoteCommand(handlers),
    command({
      desktopCommand: 'fileNewType',
      execute: handlers.onOpenCreateType,
      group: 'Note',
      keywords: ['new', 'create', 'type', 'template'],
      label: mobileText('command.note.newType'),
    }),
    ...typedNoteCreationCommands(handlers),
  ]
}

function currentFolderNoteCommand(handlers: MobileCommandPaletteHandlers): MobileCommandPaletteCommand {
  return dynamicCommand({
    enabled: Boolean(handlers.activeFolderId && handlers.onCreateNote),
    execute: () => handlers.onCreateNote?.(''),
    group: 'Note',
    id: 'create-note-current-folder',
    keywords: ['new', 'create', 'add', 'folder', 'current'],
    label: mobileText('command.note.newNoteInCurrentFolder'),
  })
}

function typedNoteCreationCommands(handlers: MobileCommandPaletteHandlers): MobileCommandPaletteCommand[] {
  const createTypedNote = handlers.onCreateNoteOfType
  if (!createTypedNote) return []

  return typeSidebarItems(handlers.snapshot).flatMap((item) => {
    const typeName = typeNameForCommand(item)
    if (genericTypeCommandName(typeName)) return []

    return [dynamicCommand({
      enabled: true,
      execute: () => createTypedNote(typeName),
      group: 'Note',
      id: `new-${commandSlug(typeName)}`,
      keywords: ['new', 'create', typeName.toLowerCase()],
      label: mobileText('command.note.newTypedNote').replace('{type}', typeName),
    })]
  })
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
    command({
      desktopCommand: 'editPastePlainText',
      enabled: textLikeSelectedNoteCommandEnabled(handlers.selectedNote, handlers.onPastePlainText),
      execute: handlers.onPastePlainText,
      group: 'Note',
      keywords: ['paste', 'plain', 'formatting', 'clipboard', 'match style'],
      label: mobileText('command.note.pastePlainText'),
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
    group: spec.group ?? 'Note',
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

function isMarkdownSelectedNote(note: MobileNote | null): boolean {
  return note !== null && (note.fileKind ?? 'markdown') === 'markdown'
}

function isNonMarkdownSelectedNote(note: MobileNote | null): boolean {
  return note !== null && (note.fileKind ?? 'markdown') !== 'markdown'
}

function isTextLikeSelectedNote(note: MobileNote | null): boolean {
  return note !== null && note.fileKind !== 'binary'
}

function selectedNoteCommandEnabled(
  note: MobileNote | null,
  handler: unknown,
): boolean {
  return hasSelectedNote(note) && handler !== undefined
}

function markdownSelectedNoteCommandEnabled(
  note: MobileNote | null,
  handler: unknown,
): boolean {
  return isMarkdownSelectedNote(note) && handler !== undefined
}

function nonMarkdownSelectedNoteCommandEnabled(
  note: MobileNote | null,
  handler: unknown,
): boolean {
  return isNonMarkdownSelectedNote(note) && handler !== undefined
}

function textLikeSelectedNoteCommandEnabled(
  note: MobileNote | null,
  handler: unknown,
): boolean {
  return isTextLikeSelectedNote(note) && handler !== undefined
}

function markdownSelectedNoteIconCommandEnabled(
  note: MobileNote | null,
  handler: unknown,
): boolean {
  return isMarkdownSelectedNote(note) && typeof note?.icon === 'string' && note.icon.length > 0 && handler !== undefined
}

function saveSelectedNote(
  handlers: MobileCommandPaletteHandlers,
  note: MobileNote | null,
): (() => void) | undefined {
  if (note && handlers.onSaveActiveEditor) return handlers.onSaveActiveEditor

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

function openSelectedNeighborhood(
  handlers: MobileCommandPaletteHandlers,
  note: MobileNote | null,
): (() => void) | undefined {
  const openNeighborhood = handlers.onEnterNeighborhood
  if (!note || !isTextLikeSelectedNote(note) || openNeighborhood === undefined) return undefined
  return () => openNeighborhood(note.id)
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
    ...selectedViewMoveCommands(handlers),
    ...defaultNoteWidthCommands(handlers),
    customizeNoteListColumnsCommand(handlers),
  ]
}

function defaultNoteWidthCommands(handlers: MobileCommandPaletteHandlers): MobileCommandPaletteCommand[] {
  return [
    defaultNoteWidthCommand('normal', 'command.view.defaultNoteWidthNormal', handlers),
    defaultNoteWidthCommand('wide', 'command.view.defaultNoteWidthWide', handlers),
  ]
}

function defaultNoteWidthCommand(
  mode: MobileNoteWidth,
  labelKey: MobileTextKey,
  handlers: MobileCommandPaletteHandlers,
): MobileCommandPaletteCommand {
  const activeMode = handlers.defaultNoteWidth ?? 'normal'

  return dynamicCommand({
    enabled: Boolean(handlers.onSetDefaultNoteWidth && activeMode !== mode),
    execute: () => handlers.onSetDefaultNoteWidth?.(mode),
    group: 'View',
    id: `set-default-note-width-${mode}`,
    keywords: ['layout', 'note', 'column', 'width', mode, 'default', 'reading'],
    label: mobileText(labelKey),
  })
}

function selectedViewMoveCommands(handlers: MobileCommandPaletteHandlers): MobileCommandPaletteCommand[] {
  const selectedView = selectedSidebarItem(handlers, 'views')
  const viewName = selectedView?.label.trim()

  return [
    dynamicCommand({
      enabled: Boolean(selectedView && handlers.canMoveSelectedViewUp && handlers.onMoveSelectedViewUp),
      execute: handlers.onMoveSelectedViewUp,
      group: 'View',
      id: 'move-view-up',
      keywords: ['saved view', 'view', 'views', 'order', 'sidebar', 'move', 'up'],
      label: viewName
        ? mobileText('command.view.moveNamedViewUp').replace('{name}', viewName)
        : mobileText('command.view.moveViewUp'),
    }),
    dynamicCommand({
      enabled: Boolean(selectedView && handlers.canMoveSelectedViewDown && handlers.onMoveSelectedViewDown),
      execute: handlers.onMoveSelectedViewDown,
      group: 'View',
      id: 'move-view-down',
      keywords: ['saved view', 'view', 'views', 'order', 'sidebar', 'move', 'down'],
      label: viewName
        ? mobileText('command.view.moveNamedViewDown').replace('{name}', viewName)
        : mobileText('command.view.moveViewDown'),
    }),
  ]
}

function customizeNoteListColumnsCommand(handlers: MobileCommandPaletteHandlers): MobileCommandPaletteCommand {
  const item = activeSidebarItem(handlers)
  const selection = item ? sidebarSelectionFromItem(item, item.sectionId) : null
  const config = selection ? customizeColumnsCommandConfig(selection, handlers) : null

  return dynamicCommand({
    enabled: config !== null,
    execute: config?.execute,
    group: 'View',
    id: 'customize-note-list-columns',
    keywords: ['columns', 'chips', 'properties', 'note list', selection?.label ?? ''],
    label: config?.label ?? mobileText('noteList.properties.customizeColumns'),
  })
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
    command({
      desktopCommand: 'vaultReload',
      enabled: handlers.onReloadVault !== undefined,
      execute: handlers.onReloadVault,
      group: 'Settings',
      keywords: ['vault', 'reload', 'refresh', 'disk'],
      label: mobileText('command.settings.reloadVault'),
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

function workspaceHistoryCommand(
  desktopCommand: Extract<DesktopCommandKey, 'viewGoBack' | 'viewGoForward'>,
  canNavigate: boolean | undefined,
  execute: (() => void) | undefined,
  label: string,
): MobileCommandPaletteCommand {
  return command({
    desktopCommand,
    enabled: Boolean(canNavigate && execute),
    execute,
    group: 'Navigation',
    keywords: ['go', 'navigate', 'history', label],
    label,
  })
}

function noteListFilterCommand(
  filter: MobileNoteListFilter,
  label: string,
  handlers: MobileCommandPaletteHandlers,
): MobileCommandPaletteCommand {
  return dynamicCommand({
    enabled: handlers.noteListFilter !== filter,
    execute: () => handlers.onNoteListFilterChange?.(filter),
    group: 'Navigation',
    id: `filter-${filter}`,
    keywords: ['filter', filter, 'notes', 'section', 'pill'],
    label,
  })
}

function typeSidebarItems(snapshot: MobileWorkspaceSnapshot): MobileSidebarItem[] {
  return snapshot.sidebarSections
    .find((section) => section.id === 'types')
    ?.items
    ?.filter((item) => item.typeName || item.label) ?? []
}

function activeSidebarFolder(handlers: MobileCommandPaletteHandlers): MobileSidebarFolderSelection | null {
  const folderId = handlers.activeFolderId
  if (!folderId) return null

  for (const section of handlers.snapshot.sidebarSections) {
    const folder = findSidebarFolder(section.folders ?? [], folderId)
    if (folder) return { id: folder.id, name: folder.name }
  }

  return null
}

function findSidebarFolder(
  folders: MobileSidebarFolder[],
  folderId: string,
): MobileSidebarFolder | null {
  for (const folder of folders) {
    if (folder.id === folderId) return folder
    const child = findSidebarFolder(folder.children, folderId)
    if (child) return child
  }

  return null
}

function activeSidebarItem(handlers: MobileCommandPaletteHandlers): ActiveSidebarItem | null {
  if (!handlers.activeItemId) return null

  for (const section of handlers.snapshot.sidebarSections) {
    const item = section.items?.find((candidate) => candidate.id === handlers.activeItemId)
    if (item) return { ...item, sectionId: section.id }
  }

  return null
}

function selectedSidebarItem(
  handlers: MobileCommandPaletteHandlers,
  sectionId: string,
): ActiveSidebarItem | null {
  const item = activeSidebarItem(handlers)
  return item?.sectionId === sectionId ? item : null
}

function customizeColumnsCommandConfig(
  selection: MobileSidebarItemSelection,
  handlers: MobileCommandPaletteHandlers,
): { execute: () => void; label: string } | null {
  if (selection.sectionId === 'primary') return primaryColumnsCommandConfig(selection, handlers)
  if (selection.sectionId === 'types' && handlers.onOpenTypeActions) {
    return {
      execute: () => handlers.onOpenTypeActions?.(selection),
      label: mobileText('noteList.properties.customizeColumns'),
    }
  }
  if (selection.sectionId === 'views' && handlers.onOpenViewActions) {
    return {
      execute: () => handlers.onOpenViewActions?.(selection),
      label: mobileText('noteList.properties.customizeViewColumns').replace('{name}', selection.label),
    }
  }
  return null
}

function primaryColumnsCommandConfig(
  selection: MobileSidebarItemSelection,
  handlers: MobileCommandPaletteHandlers,
): { execute: () => void; label: string } | null {
  if (!handlers.onOpenPrimaryActions || !['all-notes', 'inbox'].includes(selection.id)) return null

  return {
    execute: () => handlers.onOpenPrimaryActions?.(selection),
    label: selection.id === 'all-notes'
      ? mobileText('noteList.properties.customizeAllColumns')
      : mobileText('noteList.properties.customizeInboxColumns'),
  }
}

function typeNameForCommand(item: MobileSidebarItem): string {
  return (item.typeName ?? item.label).trim()
}

function genericTypeCommandName(typeName: string): boolean {
  return ['note', 'type'].includes(typeName.toLowerCase())
}

function sidebarSelectionFromTypeItem(item: MobileSidebarItem): MobileSidebarItemSelection {
  return sidebarSelectionFromItem(item, 'types')
}

function sidebarSelectionFromItem(
  item: MobileSidebarItem,
  sectionId: string,
): MobileSidebarItemSelection {
  return {
    count: item.count,
    id: item.id,
    label: item.label,
    noteId: item.noteId,
    sectionId,
    typeName: item.typeName,
    viewId: item.viewId,
  }
}

function commandSlug(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-')
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
