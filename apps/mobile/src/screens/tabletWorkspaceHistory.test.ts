import { describe, expect, it } from 'vitest'
import { workspaceScenarioForId } from '../fixtures/workspaceFixtures'
import { mobileNoteEditableContent } from '../workspace/mobileDocumentContent'
import { applyMobileWorkspaceEdit, type MobileWorkspaceEdit } from '../workspace/mobileWorkspaceEditing'
import type { MobileNote, MobileTypeDefinition, MobileWorkspaceSnapshot } from '../workspace/mobileWorkspaceModel'
import {
  emptyMobileWorkspaceHistory,
  mobileWorkspaceHistoryEntry,
  recordMobileWorkspaceHistory,
} from './tabletWorkspaceHistory'

describe('tablet workspace editing history', () => {
  it('records reversible markdown content edits from workspace snapshots', () => {
    const originalContent = '# Workflow Orchestration Essay\n\nOriginal body.\n'
    const previousSnapshot = snapshotWithEditableNote({
      id: 'workflow-orchestration',
      rawContent: originalContent,
    })
    const nextContent = '# Workflow Orchestration Essay\n\nUpdated body.\n'
    const nextSnapshot = applyMobileWorkspaceEdit(previousSnapshot, {
      content: nextContent,
      noteId: 'workflow-orchestration',
      type: 'updateNoteContent',
    })

    const entry = mobileWorkspaceHistoryEntry(previousSnapshot, nextSnapshot)

    expect(entry).toEqual({
      redoEdits: [{ content: nextContent, noteId: 'workflow-orchestration', type: 'updateNoteContent' }],
      undoEdits: [{ content: originalContent, noteId: 'workflow-orchestration', type: 'updateNoteContent' }],
    })
    expect(noteById(applyMobileWorkspaceEdit(nextSnapshot, entry?.undoEdits[0] ?? neverEdit()), 'workflow-orchestration').rawContent).toBe(originalContent)
  })

  it('records text file edits without converting them into markdown notes', () => {
    const previousSnapshot = snapshotWithEditableNote({
      fileKind: 'text',
      id: 'workflow-orchestration',
      rawContent: 'plain=true\n',
    })
    const nextSnapshot = applyMobileWorkspaceEdit(previousSnapshot, {
      content: 'plain=false\n',
      noteId: 'workflow-orchestration',
      type: 'updateTextFileContent',
    })

    const entry = mobileWorkspaceHistoryEntry(previousSnapshot, nextSnapshot)

    expect(entry?.undoEdits).toEqual([
      { content: 'plain=true\n', noteId: 'workflow-orchestration', type: 'updateTextFileContent' },
    ])
    expect(entry?.redoEdits).toEqual([
      { content: 'plain=false\n', noteId: 'workflow-orchestration', type: 'updateTextFileContent' },
    ])
  })

  it('records fixture editor-block edits when raw content has not been hydrated yet', () => {
    const previousSnapshot = workspaceScenarioForId('default')
    const selectedNote = noteById(previousSnapshot, 'workflow-orchestration')
    const content = mobileNoteEditableContent({
      ...selectedNote,
      editorBlocks: previousSnapshot.editorBlocks,
      editorBullets: previousSnapshot.editorBullets,
    })
    const nextContent = content.replace('lower-priority', 'quiet')
    const edit = {
      content: nextContent,
      noteId: 'workflow-orchestration',
      type: 'updateNoteContent',
    } as const
    const nextSnapshot = applyMobileWorkspaceEdit(previousSnapshot, edit)

    const entry = mobileWorkspaceHistoryEntry(previousSnapshot, nextSnapshot, edit)

    const undoEdit = entry?.undoEdits.find(isUpdateNoteContentEdit)
    const redoEdit = entry?.redoEdits.find(isUpdateNoteContentEdit)

    expect(undoEdit).toMatchObject({
      noteId: 'workflow-orchestration',
      type: 'updateNoteContent',
    })
    expect(undoEdit?.content).toContain('lower-priority chrome')
    expect(redoEdit?.content).toContain('quiet chrome')
  })

  it('does not record hydration or structural edits without stable loaded content', () => {
    const previousSnapshot = workspaceScenarioForId('default')
    const hydratedSnapshot = applyMobileWorkspaceEdit(previousSnapshot, {
      noteId: 'workflow-orchestration',
      rawContent: '# Workflow Orchestration Essay\n\nLoaded body.\n',
      type: 'hydrateNoteContent',
    })
    const renamedSnapshot = applyMobileWorkspaceEdit(snapshotWithEditableNote({
      id: 'workflow-orchestration',
      rawContent: '# Workflow Orchestration Essay\n\nLoaded body.\n',
    }), {
      filenameStem: 'renamed-workflow',
      noteId: 'workflow-orchestration',
      type: 'renameNoteFile',
    })

    expect(mobileWorkspaceHistoryEntry(previousSnapshot, hydratedSnapshot, {
      noteId: 'workflow-orchestration',
      rawContent: '# Workflow Orchestration Essay\n\nLoaded body.\n',
      type: 'hydrateNoteContent',
    })).toBeNull()
    expect(mobileWorkspaceHistoryEntry(previousSnapshot, renamedSnapshot)).toBeNull()
  })

  it('appends new edits to the past stack and clears redo history', () => {
    const entry = {
      redoEdits: [{ content: 'next', noteId: 'workflow-orchestration', type: 'updateNoteContent' as const }],
      undoEdits: [{ content: 'previous', noteId: 'workflow-orchestration', type: 'updateNoteContent' as const }],
    }
    const history = recordMobileWorkspaceHistory({
      future: [entry],
      past: [],
    }, entry)

    expect(history).toEqual({
      future: [],
      past: [entry],
    })
    expect(recordMobileWorkspaceHistory(emptyMobileWorkspaceHistory, null)).toBe(emptyMobileWorkspaceHistory)
  })

  it('undoes and redoes created notes with the exact created markdown', () => {
    const previousSnapshot = workspaceScenarioForId('default')
    const nextSnapshot = applyMobileWorkspaceEdit(previousSnapshot, {
      title: 'Mobile Structural History',
      type: 'createNote',
    })
    const entry = requiredHistoryEntry(previousSnapshot, nextSnapshot, {
      title: 'Mobile Structural History',
      type: 'createNote',
    })

    const undoneSnapshot = applyHistoryEdits(nextSnapshot, entry.undoEdits)
    const redoneSnapshot = applyHistoryEdits(undoneSnapshot, entry.redoEdits)

    expect(noteByIdOptional(undoneSnapshot, 'mobile-structural-history.md')).toBeNull()
    expect(noteById(redoneSnapshot, 'mobile-structural-history.md').rawContent).toBe(
      '---\ntitle: Mobile Structural History\ntype: Note\n---\n',
    )
  })

  it('undoes and redoes saved views without losing their generated filename', () => {
    const previousSnapshot = workspaceScenarioForId('default')
    const edit: MobileWorkspaceEdit = {
      definition: {
        color: 'purple',
        filters: { all: [{ field: 'type', op: 'equals', value: 'Procedure' }] },
        icon: 'star',
        name: 'Procedure History',
        sort: 'modified:desc',
      },
      type: 'createView',
    }
    const nextSnapshot = applyMobileWorkspaceEdit(previousSnapshot, edit)
    const entry = requiredHistoryEntry(previousSnapshot, nextSnapshot, edit)

    const undoneSnapshot = applyHistoryEdits(nextSnapshot, entry.undoEdits)
    const redoneSnapshot = applyHistoryEdits(undoneSnapshot, entry.redoEdits)

    expect(undoneSnapshot.views?.some((view) => view.filename === 'procedure-history.yml')).toBe(false)
    expect(redoneSnapshot.views?.find((view) => view.filename === 'procedure-history.yml')?.definition).toMatchObject({
      color: 'purple',
      icon: 'star',
      name: 'Procedure History',
    })
  })

  it('undoes and redoes type section metadata updates exactly', () => {
    const previousSnapshot = workspaceScenarioForId('default')
    const edit: MobileWorkspaceEdit = {
      patch: { label: 'Long Essays', tone: 'blue' },
      type: 'updateTypeDefinition',
      typeName: 'Essay',
    }
    const nextSnapshot = applyMobileWorkspaceEdit(previousSnapshot, edit)
    const entry = requiredHistoryEntry(previousSnapshot, nextSnapshot, edit)

    const undoneSnapshot = applyHistoryEdits(nextSnapshot, entry.undoEdits)
    const redoneSnapshot = applyHistoryEdits(undoneSnapshot, entry.redoEdits)
    const undoneDefinition = typeDefinitionByName(undoneSnapshot, 'Essay')
    const redoneDefinition = typeDefinitionByName(redoneSnapshot, 'Essay')

    expect(undoneDefinition.label).toBeUndefined()
    expect(undoneDefinition.tone).toBe('green')
    expect(redoneDefinition.label).toBe('Long Essays')
    expect(redoneDefinition.tone).toBe('blue')
  })

  it('undoes and redoes note folder moves through path edits', () => {
    const previousSnapshot = snapshotWithFolderPaths(['Tolaria/Mobile UI', 'Writing/Essays'])
    const { redoneSnapshot, undoneSnapshot } = historyRoundTrip(previousSnapshot, {
      folderPath: 'Writing/Essays',
      noteId: 'workflow-orchestration',
      type: 'moveNoteToFolder',
    })

    expect(noteById(undoneSnapshot, 'workflow-orchestration').path).toBe('Tolaria/Mobile UI/Workflow Orchestration Essay.md')
    expect(noteById(redoneSnapshot, 'workflow-orchestration').path).toBe('Writing/Essays/Workflow Orchestration Essay.md')
  })

  it('undoes and redoes path-backed note filename renames', () => {
    const previousSnapshot = snapshotWithPathBackedSelectedNote()
    const { redoneSnapshot, undoneSnapshot } = historyRoundTrip(previousSnapshot, {
      filenameStem: 'workflow-manual',
      noteId: 'Tolaria/Mobile UI/Workflow Orchestration Essay.md',
      type: 'renameNoteFile',
    })

    expect(noteById(undoneSnapshot, 'Tolaria/Mobile UI/Workflow Orchestration Essay.md').path).toBe('Tolaria/Mobile UI/Workflow Orchestration Essay.md')
    expect(noteById(redoneSnapshot, 'Tolaria/Mobile UI/workflow-manual.md').path).toBe('Tolaria/Mobile UI/workflow-manual.md')
  })

  it('undoes and redoes folder subtree renames through folder edits', () => {
    const previousSnapshot = snapshotWithFolderPaths(['Tolaria', 'Tolaria/Mobile UI'])
    const { redoneSnapshot, undoneSnapshot } = historyRoundTrip(previousSnapshot, {
      folderPath: 'Tolaria',
      name: 'Research',
      type: 'renameFolder',
    })

    expect(noteById(undoneSnapshot, 'workflow-orchestration').path).toBe('Tolaria/Mobile UI/Workflow Orchestration Essay.md')
    expect(noteById(redoneSnapshot, 'workflow-orchestration').path).toBe('Research/Mobile UI/Workflow Orchestration Essay.md')
  })

  it('undoes and redoes primary note-list display property overrides', () => {
    const previousSnapshot = workspaceScenarioForId('default')
    const { redoneSnapshot, undoneSnapshot } = historyRoundTrip(previousSnapshot, {
      listPropertiesDisplay: [' status ', 'belongs_to', 'Status'],
      target: 'allNotes',
      type: 'updatePrimaryNoteListProperties',
    })

    expect(undoneSnapshot.noteListPropertyOverrides).toBeUndefined()
    expect(redoneSnapshot.noteListPropertyOverrides).toEqual({
      allNotes: ['status', 'belongs_to'],
    })
  })

  it('undoes primary note-list display resets back to the previous override', () => {
    const previousSnapshot = {
      ...workspaceScenarioForId('default'),
      noteListPropertyOverrides: { inbox: ['status', 'tags'] },
    }
    const { redoneSnapshot, undoneSnapshot } = historyRoundTrip(previousSnapshot, {
      listPropertiesDisplay: [],
      target: 'inbox',
      type: 'updatePrimaryNoteListProperties',
    })

    expect(undoneSnapshot.noteListPropertyOverrides).toEqual({
      inbox: ['status', 'tags'],
    })
    expect(redoneSnapshot.noteListPropertyOverrides).toBeUndefined()
  })

  it('records bulk note edits as one reversible history entry', () => {
    const previousSnapshot = snapshotWithEditableNotes([
      ['workflow-orchestration', '# Workflow Orchestration Essay\n\nBulk organize.\n'],
      ['open-source-project', '# How I Run an Open Source Project\n\nBulk organize.\n'],
    ])
    const edit: MobileWorkspaceEdit = {
      edits: previousSnapshot.notes.map((note) => ({ noteId: note.id, organized: true, type: 'setOrganized' })),
      type: 'bulkEdit',
    }
    const nextSnapshot = applyMobileWorkspaceEdit(previousSnapshot, edit)
    const entry = requiredHistoryEntry(previousSnapshot, nextSnapshot, edit)
    const undoneSnapshot = applyHistoryEdits(nextSnapshot, entry.undoEdits)
    const redoneSnapshot = applyHistoryEdits(undoneSnapshot, entry.redoEdits)

    expect(entry.undoEdits).toHaveLength(2)
    expect(undoneSnapshot.notes.map((note) => note.organized)).toEqual([false, false])
    expect(redoneSnapshot.notes.map((note) => note.organized)).toEqual([true, true])
  })
})

function snapshotWithEditableNote(overrides: Partial<MobileNote> & { id: string; rawContent: string }): MobileWorkspaceSnapshot {
  const base = workspaceScenarioForId('default')
  const notes = base.notes.map((note) => note.id === overrides.id ? { ...note, ...overrides } : note)
  const allNotes = (base.allNotes ?? base.notes).map((note) => note.id === overrides.id ? { ...note, ...overrides } : note)

  return {
    ...base,
    allNotes,
    notes,
  }
}

function snapshotWithFolderPaths(folderPaths: string[]): MobileWorkspaceSnapshot {
  return {
    ...workspaceScenarioForId('default'),
    folderPaths,
  }
}

function snapshotWithPathBackedSelectedNote(): MobileWorkspaceSnapshot {
  const base = workspaceScenarioForId('default')
  const pathBackedNote = {
    ...base.notes[0],
    id: 'Tolaria/Mobile UI/Workflow Orchestration Essay.md',
  }
  return {
    ...base,
    allNotes: [pathBackedNote, ...base.notes.slice(1)],
    notes: [pathBackedNote, ...base.notes.slice(1)],
    selectedNoteId: pathBackedNote.id,
  }
}

function snapshotWithEditableNotes(notesById: Array<[string, string]>): MobileWorkspaceSnapshot {
  const base = workspaceScenarioForId('default')
  const editableNotes = notesById.map(([noteId, rawContent]) => ({
    ...noteById(base, noteId),
    rawContent,
  }))

  return {
    ...base,
    allNotes: editableNotes,
    notes: editableNotes,
    selectedNoteId: editableNotes[0]?.id,
  }
}

function noteById(snapshot: MobileWorkspaceSnapshot, noteId: string): MobileNote {
  const note = (snapshot.allNotes ?? snapshot.notes).find((candidate) => candidate.id === noteId)
  if (!note) throw new Error(`Expected note ${noteId}`)
  return note
}

function noteByIdOptional(snapshot: MobileWorkspaceSnapshot, noteId: string): MobileNote | null {
  return (snapshot.allNotes ?? snapshot.notes).find((candidate) => candidate.id === noteId) ?? null
}

function typeDefinitionByName(snapshot: MobileWorkspaceSnapshot, typeName: string): MobileTypeDefinition {
  const definition = snapshot.typeDefinitions?.[typeName]
  if (!definition) throw new Error(`Expected type definition ${typeName}`)
  return definition
}

function requiredHistoryEntry(
  previousSnapshot: MobileWorkspaceSnapshot,
  nextSnapshot: MobileWorkspaceSnapshot,
  sourceEdit: MobileWorkspaceEdit,
) {
  const entry = mobileWorkspaceHistoryEntry(previousSnapshot, nextSnapshot, sourceEdit)
  if (!entry) throw new Error('Expected history entry')
  return entry
}

function applyHistoryEdits(snapshot: MobileWorkspaceSnapshot, edits: MobileWorkspaceEdit[]) {
  return edits.reduce(applyMobileWorkspaceEdit, snapshot)
}

function historyRoundTrip(previousSnapshot: MobileWorkspaceSnapshot, edit: MobileWorkspaceEdit) {
  const nextSnapshot = applyMobileWorkspaceEdit(previousSnapshot, edit)
  const entry = requiredHistoryEntry(previousSnapshot, nextSnapshot, edit)
  const undoneSnapshot = applyHistoryEdits(nextSnapshot, entry.undoEdits)

  return {
    redoneSnapshot: applyHistoryEdits(undoneSnapshot, entry.redoEdits),
    undoneSnapshot,
  }
}

function neverEdit(): never {
  throw new Error('Expected history entry')
}

function isUpdateNoteContentEdit(
  edit: { type: string },
): edit is Extract<MobileWorkspaceEdit, { type: 'updateNoteContent' }> {
  return edit.type === 'updateNoteContent'
}
