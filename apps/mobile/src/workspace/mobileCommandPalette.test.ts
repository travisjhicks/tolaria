import { describe, expect, it, vi } from 'vitest'
import appCommandManifest from '../../../../src/shared/appCommandManifest.json'
import { workspaceScenarios } from '../fixtures/workspaceFixtures'
import {
  buildMobileCommandPaletteCommands,
  mobileCommandPaletteResults,
  mobilePrimarySidebarSelection,
  type MobileCommandPaletteHandlers,
} from './mobileCommandPalette'
import type { MobileNote } from './mobileWorkspaceModel'

describe('mobile command palette', () => {
  it('builds mobile commands from shared desktop command ids and excludes explicit out-of-scope commands', () => {
    const commands = buildMobileCommandPaletteCommands(commandHandlers())
    const commandIds = commands.map((command) => command.id)

    expect(commandIds).toContain(appCommandManifest.commands.fileQuickOpen.id)
    expect(commandIds).toContain(appCommandManifest.commands.fileNewNote.id)
    expect(commandIds).toContain(appCommandManifest.commands.editPastePlainText.id)
    expect(commandIds).toContain(appCommandManifest.commands.viewToggleProperties.id)
    expect(commandIds).toContain(appCommandManifest.commands.vaultOpen.id)
    expect(commandIds).not.toContain(appCommandManifest.commands.vaultCommitPush.id)
    expect(commandIds).not.toContain(appCommandManifest.commands.viewToggleAiChat.id)
  })

  it('uses desktop primary sidebar selections for navigation commands', () => {
    const handlers = commandHandlers()
    const allNotes = enabledCommand(handlers, appCommandManifest.commands.goAllNotes.id)

    allNotes.execute()

    expect(handlers.onSelectSidebarItem).toHaveBeenCalledWith(
      expect.objectContaining({
        count: '8846',
        id: 'all-notes',
        label: 'All Notes',
        sectionId: 'primary',
      }),
    )
  })

  it('exposes desktop-style type section navigation commands', () => {
    const handlers = commandHandlers()
    const commands = buildMobileCommandPaletteCommands(handlers)
    const essayCommand = commands.find((command) => command.id === 'list-essay')

    expect(essayCommand).toMatchObject({
      enabled: true,
      group: 'Navigation',
      label: 'List Essays',
    })

    essayCommand?.execute()

    expect(handlers.onSelectSidebarItem).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'essays',
        label: 'Essays',
        sectionId: 'types',
        typeName: 'Essay',
      }),
    )
  })

  it('exposes desktop-style typed note creation commands', () => {
    const handlers = commandHandlers()
    const commands = buildMobileCommandPaletteCommands(handlers)
    const essayCommand = commands.find((command) => command.id === 'new-essay')

    expect(essayCommand).toMatchObject({
      enabled: true,
      group: 'Note',
      label: 'New Essay',
    })

    essayCommand?.execute()

    expect(handlers.onCreateNoteOfType).toHaveBeenCalledWith('Essay')
  })

  it('exposes desktop-style section filter commands when note-list filters are visible', () => {
    const handlers = commandHandlers({ noteListFilter: 'open', noteListFilterVisible: true })
    const results = mobileCommandPaletteResults(buildMobileCommandPaletteCommands(handlers), '')
    const commandIds = results.flatList.map((command) => command.id)

    expect(commandIds).toContain('filter-archived')
    expect(commandIds).not.toContain('filter-open')

    enabledCommand(handlers, 'filter-archived').execute()

    expect(handlers.onNoteListFilterChange).toHaveBeenCalledWith('archived')
  })

  it('exposes selected markdown note utility commands through the palette', () => {
    const handlers = commandHandlers()
    const commandIds = mobileCommandPaletteResults(buildMobileCommandPaletteCommands(handlers), '')
      .flatList
      .map((command) => command.id)

    expect(commandIds).toEqual(expect.arrayContaining([
      'copy-active-file-path',
      'reveal-active-file',
      'open-active-neighborhood',
      'rename-active-file',
      'rename-active-file-to-title',
      'set-note-width-wide',
    ]))

    enabledCommand(handlers, 'copy-active-file-path').execute()
    enabledCommand(handlers, 'reveal-active-file').execute()
    enabledCommand(handlers, 'open-active-neighborhood').execute()

    expect(handlers.onCopyFilePath).toHaveBeenCalledOnce()
    expect(handlers.onRevealFile).toHaveBeenCalledOnce()
    expect(handlers.onEnterNeighborhood).toHaveBeenCalledWith(handlers.selectedNote?.id)
  })

  it('keeps non-markdown file commands aligned with the mobile More sheet', () => {
    const textFile = selectedFile({ fileKind: 'text', id: 'Files/config.yml', path: 'Files/config.yml', title: 'config.yml' })
    const binaryFile = selectedFile({ fileKind: 'binary', id: 'Files/diagram.png', path: 'Files/diagram.png', title: 'diagram.png' })
    const textCommandIds = mobileCommandPaletteResults(
      buildMobileCommandPaletteCommands(commandHandlers({ selectedNote: textFile })),
      '',
    ).flatList.map((command) => command.id)
    const binaryCommandIds = mobileCommandPaletteResults(
      buildMobileCommandPaletteCommands(commandHandlers({ selectedNote: binaryFile })),
      '',
    ).flatList.map((command) => command.id)

    expect(textCommandIds).toContain('open-active-file-external')
    expect(textCommandIds).toContain('open-active-neighborhood')
    expect(textCommandIds).not.toContain('change-note-type')
    expect(textCommandIds).not.toContain('set-note-width-wide')
    expect(binaryCommandIds).toContain('open-active-file-external')
    expect(binaryCommandIds).not.toContain('open-active-neighborhood')
  })

  it('filters enabled commands by label, keyword, and group with desktop-like fuzzy ranking', () => {
    const handlers = commandHandlers()
    const commands = buildMobileCommandPaletteCommands(handlers)

    expect(mobileCommandPaletteResults(commands, 'pdf').flatList.map((command) => command.id)).toEqual([
      appCommandManifest.commands.noteExportPdf.id,
    ])
    expect(mobileCommandPaletteResults(commands, 'folder').flatList.map((command) => command.id)).toContain('move-note-to-folder')
    expect(mobileCommandPaletteResults(commands, 'settings').groups.map((group) => group.group)).toEqual(['Settings'])
  })

  it('keeps unavailable commands out of the executable results', () => {
    const handlers = commandHandlers({ selectedNote: null, canUndoWorkspaceEdit: false })
    const results = mobileCommandPaletteResults(buildMobileCommandPaletteCommands(handlers), '')
    const commandIds = results.flatList.map((command) => command.id)

    expect(commandIds).not.toContain(appCommandManifest.commands.noteDelete.id)
    expect(commandIds).not.toContain(appCommandManifest.commands.editUndo.id)
    expect(commandIds).toContain(appCommandManifest.commands.fileNewNote.id)
  })

  it('dispatches paste-without-formatting only when the active editor registers it', () => {
    const handlers = commandHandlers()
    const command = enabledCommand(handlers, appCommandManifest.commands.editPastePlainText.id)

    command.execute()

    expect(handlers.onPastePlainText).toHaveBeenCalledOnce()

    const commandIdsWithoutEditor = mobileCommandPaletteResults(
      buildMobileCommandPaletteCommands(commandHandlers({ onPastePlainText: undefined })),
      '',
    ).flatList.map((candidate) => candidate.id)

    expect(commandIdsWithoutEditor).not.toContain(appCommandManifest.commands.editPastePlainText.id)
  })

  it('normalizes primary sidebar selections from the snapshot', () => {
    expect(mobilePrimarySidebarSelection(workspaceScenarios.default, 'inbox')).toEqual(
      expect.objectContaining({
        count: '7',
        id: 'inbox',
        label: 'Inbox',
        sectionId: 'primary',
      }),
    )
  })
})

function enabledCommand(handlers: MobileCommandPaletteHandlers, id: string) {
  const command = buildMobileCommandPaletteCommands(handlers).find((candidate) => candidate.id === id)
  expect(command?.enabled).toBe(true)
  return command!
}

function commandHandlers(
  overrides: Partial<MobileCommandPaletteHandlers> = {},
): MobileCommandPaletteHandlers {
  const selectedNote = workspaceScenarios.default.notes[0] ?? null
  const handlers: MobileCommandPaletteHandlers = {
    canRedoWorkspaceEdit: true,
    canUndoWorkspaceEdit: true,
    onCopyDeepLink: vi.fn(),
    onCopyFilePath: vi.fn(),
    onCreateNoteOfType: vi.fn(),
    onDeleteNote: vi.fn(),
    onEnterNeighborhood: vi.fn(),
    onExportNoteAsPdf: vi.fn(),
    onOpenBacklinks: vi.fn(),
    onOpenChangeNoteType: vi.fn(),
    onOpenCreateNote: vi.fn(),
    onOpenCreateType: vi.fn(),
    onOpenFindInNote: vi.fn(),
    onOpenFileInDefaultApp: vi.fn(),
    onOpenMoveNoteToFolder: vi.fn(),
    onOpenNativeVault: vi.fn(),
    onOpenReplaceInNote: vi.fn(),
    onOpenRenameNoteFile: vi.fn(),
    onOpenSearch: vi.fn(),
    onOpenSetNoteIcon: vi.fn(),
    onOpenTableOfContents: vi.fn(),
    onNoteListFilterChange: vi.fn(),
    onPastePlainText: vi.fn(),
    onRedoWorkspaceEdit: vi.fn(),
    onRemoveNoteIcon: vi.fn(),
    onRenameNoteFileToTitle: vi.fn(),
    onRevealFile: vi.fn(),
    onSelectSidebarItem: vi.fn(),
    onSetArchived: vi.fn(),
    onSetOrganized: vi.fn(),
    onToggleFavorite: vi.fn(),
    onToggleNoteWidth: vi.fn(),
    onToggleProperties: vi.fn(),
    onUndoWorkspaceEdit: vi.fn(),
    onUpdateNoteContent: vi.fn(),
    onViewAll: vi.fn(),
    onViewEditorList: vi.fn(),
    onViewEditorOnly: vi.fn(),
    noteListFilter: 'open',
    noteListFilterVisible: false,
    selectedNote,
    snapshot: workspaceScenarios.default,
  }
  return Object.assign(handlers, overrides)
}

function selectedFile(overrides: Partial<MobileNote>): MobileNote {
  return {
    ...workspaceScenarios.default.notes[0]!,
    ...overrides,
  }
}
