import { describe, expect, it, vi } from 'vitest'
import appCommandManifest from '../../../../src/shared/appCommandManifest.json'
import { workspaceScenarios } from '../fixtures/workspaceFixtures'
import {
  buildMobileCommandPaletteCommands,
  mobileCommandPaletteResults,
  mobilePrimarySidebarSelection,
  type MobileCommandPaletteHandlers,
} from './mobileCommandPalette'

describe('mobile command palette', () => {
  it('builds mobile commands from shared desktop command ids and excludes explicit out-of-scope commands', () => {
    const commands = buildMobileCommandPaletteCommands(commandHandlers())
    const commandIds = commands.map((command) => command.id)

    expect(commandIds).toContain(appCommandManifest.commands.fileQuickOpen.id)
    expect(commandIds).toContain(appCommandManifest.commands.fileNewNote.id)
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
    onDeleteNote: vi.fn(),
    onExportNoteAsPdf: vi.fn(),
    onOpenBacklinks: vi.fn(),
    onOpenChangeNoteType: vi.fn(),
    onOpenCreateNote: vi.fn(),
    onOpenCreateType: vi.fn(),
    onOpenFindInNote: vi.fn(),
    onOpenMoveNoteToFolder: vi.fn(),
    onOpenNativeVault: vi.fn(),
    onOpenReplaceInNote: vi.fn(),
    onOpenSearch: vi.fn(),
    onOpenSetNoteIcon: vi.fn(),
    onOpenTableOfContents: vi.fn(),
    onRedoWorkspaceEdit: vi.fn(),
    onRemoveNoteIcon: vi.fn(),
    onSelectSidebarItem: vi.fn(),
    onSetArchived: vi.fn(),
    onSetOrganized: vi.fn(),
    onToggleFavorite: vi.fn(),
    onToggleProperties: vi.fn(),
    onUndoWorkspaceEdit: vi.fn(),
    onUpdateNoteContent: vi.fn(),
    onViewAll: vi.fn(),
    onViewEditorList: vi.fn(),
    onViewEditorOnly: vi.fn(),
    selectedNote,
    snapshot: workspaceScenarios.default,
  }
  return Object.assign(handlers, overrides)
}
