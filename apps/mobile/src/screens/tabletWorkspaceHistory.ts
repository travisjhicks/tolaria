import type { MobileNote, MobileWorkspaceSnapshot } from '../workspace/mobileWorkspaceModel'
import type { MobileWorkspaceEdit } from '../workspace/mobileWorkspaceEditing'
import { mobileNoteEditableContent } from '../workspace/mobileDocumentContent'

type WorkspaceHistoryEdit = Extract<
  MobileWorkspaceEdit,
  { type: 'updateNoteContent' | 'updateTextFileContent' }
>

export type MobileWorkspaceHistoryEntry = {
  redoEdits: WorkspaceHistoryEdit[]
  undoEdits: WorkspaceHistoryEdit[]
}

export type MobileWorkspaceHistoryState = {
  future: MobileWorkspaceHistoryEntry[]
  past: MobileWorkspaceHistoryEntry[]
}

const maxWorkspaceHistoryEntries = 100

export const emptyMobileWorkspaceHistory: MobileWorkspaceHistoryState = {
  future: [],
  past: [],
}

export function mobileWorkspaceHistoryEntry(
  previousSnapshot: MobileWorkspaceSnapshot,
  nextSnapshot: MobileWorkspaceSnapshot,
  sourceEdit?: MobileWorkspaceEdit,
): MobileWorkspaceHistoryEntry | null {
  if (sourceEdit && !historyRecordsEdit(sourceEdit)) return null

  const nextNotesById = new Map(workspaceNotes(nextSnapshot).map((note) => [note.id, note]))
  const edits = workspaceNotes(previousSnapshot).reduce<MobileWorkspaceHistoryEntry>((entry, previousNote) => {
    const nextNote = nextNotesById.get(previousNote.id)
    const reversible = reversibleContentChange({
      nextNote,
      nextSnapshot,
      previousNote,
      previousSnapshot,
    })
    if (!reversible) return entry

    entry.undoEdits.push(reversible.undoEdit)
    entry.redoEdits.push(reversible.redoEdit)
    return entry
  }, { redoEdits: [], undoEdits: [] })

  return edits.undoEdits.length > 0 ? edits : null
}

export function recordMobileWorkspaceHistory(
  history: MobileWorkspaceHistoryState,
  entry: MobileWorkspaceHistoryEntry | null,
): MobileWorkspaceHistoryState {
  if (!entry) return history

  return {
    future: [],
    past: [...history.past, entry].slice(-maxWorkspaceHistoryEntries),
  }
}

function reversibleContentChange({
  nextNote,
  nextSnapshot,
  previousNote,
  previousSnapshot,
}: {
  nextNote: MobileNote | undefined
  nextSnapshot: MobileWorkspaceSnapshot
  previousNote: MobileNote
  previousSnapshot: MobileWorkspaceSnapshot
}): { redoEdit: WorkspaceHistoryEdit; undoEdit: WorkspaceHistoryEdit } | null {
  if (!nextNote || !stableEditableNote(previousNote, nextNote)) return null
  const previousContent = editableContent(previousNote, previousSnapshot)
  const nextContent = editableContent(nextNote, nextSnapshot)
  if (previousContent === null || nextContent === null) return null
  if (previousContent === nextContent) return null

  return reversibleContentEdits({
    contentKind: noteContentHistoryKind(previousNote, nextNote),
    nextContent,
    noteId: previousNote.id,
    previousContent,
  })
}

function reversibleContentEdits({
  contentKind,
  nextContent,
  noteId,
  previousContent,
}: {
  contentKind: 'markdown' | 'text' | null
  nextContent: string
  noteId: string
  previousContent: string
}): { redoEdit: WorkspaceHistoryEdit; undoEdit: WorkspaceHistoryEdit } | null {
  if (!contentKind) return null

  return contentKind === 'text'
    ? {
      redoEdit: { content: nextContent, noteId, type: 'updateTextFileContent' },
      undoEdit: { content: previousContent, noteId, type: 'updateTextFileContent' },
    }
    : {
      redoEdit: { content: nextContent, noteId, type: 'updateNoteContent' },
      undoEdit: { content: previousContent, noteId, type: 'updateNoteContent' },
    }
}

function stableEditableNote(previousNote: MobileNote, nextNote: MobileNote): boolean {
  return previousNote.id === nextNote.id
    && notePath(previousNote) === notePath(nextNote)
    && noteContentKind(previousNote) === noteContentKind(nextNote)
}

function noteContentHistoryKind(
  previousNote: MobileNote,
  nextNote: MobileNote,
): 'markdown' | 'text' | null {
  const kind = noteContentKind(previousNote)
  if (kind === 'binary' || noteContentKind(nextNote) === 'binary') return null
  return kind
}

function noteContentKind(note: MobileNote): 'binary' | 'markdown' | 'text' {
  return note.fileKind ?? 'markdown'
}

function editableContent(note: MobileNote, snapshot: MobileWorkspaceSnapshot): string | null {
  if (note.rawContent !== undefined) return note.rawContent
  if (noteContentKind(note) !== 'markdown') return null
  return mobileNoteEditableContent(noteWithSnapshotEditorContent(note, snapshot))
}

function historyRecordsEdit(edit: MobileWorkspaceEdit): boolean {
  return edit.type !== 'hydrateNoteContent' && edit.type !== 'hydrateTextFileContent'
}

function noteWithSnapshotEditorContent(note: MobileNote, snapshot: MobileWorkspaceSnapshot): MobileNote {
  if (snapshot.selectedNoteId !== note.id) return note

  return {
    ...note,
    editorBlocks: note.editorBlocks ?? snapshot.editorBlocks,
    editorBullets: note.editorBullets ?? snapshot.editorBullets,
  }
}

function notePath(note: MobileNote): string {
  return note.path ?? note.id
}

function workspaceNotes(snapshot: MobileWorkspaceSnapshot): MobileNote[] {
  return snapshot.allNotes ?? snapshot.notes
}
