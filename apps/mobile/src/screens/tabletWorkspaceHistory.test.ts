import { describe, expect, it } from 'vitest'
import { workspaceScenarioForId } from '../fixtures/workspaceFixtures'
import { mobileNoteEditableContent } from '../workspace/mobileDocumentContent'
import { applyMobileWorkspaceEdit } from '../workspace/mobileWorkspaceEditing'
import type { MobileNote, MobileWorkspaceSnapshot } from '../workspace/mobileWorkspaceModel'
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

    expect(entry?.undoEdits[0]).toMatchObject({
      noteId: 'workflow-orchestration',
      type: 'updateNoteContent',
    })
    expect(entry?.undoEdits[0]?.content).toContain('lower-priority chrome')
    expect(entry?.redoEdits[0]?.content).toContain('quiet chrome')
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

function noteById(snapshot: MobileWorkspaceSnapshot, noteId: string): MobileNote {
  const note = (snapshot.allNotes ?? snapshot.notes).find((candidate) => candidate.id === noteId)
  if (!note) throw new Error(`Expected note ${noteId}`)
  return note
}

function neverEdit(): never {
  throw new Error('Expected history entry')
}
