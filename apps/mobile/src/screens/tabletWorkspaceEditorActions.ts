import type { MobileNote, MobileWorkspaceSnapshot } from '../workspace/mobileWorkspaceModel'
import { writeMobileClipboardText } from '../workspace/mobileClipboard'
import { buildMobileDeepLinkForNote } from '../workspace/mobileDeepLinks'
import { exportMobileNoteAsPdf } from '../workspace/mobilePdfExport'
import { toggleMobileNoteWidth } from '../workspace/mobileNoteWidth'
import type { MobileWorkspaceEdit } from '../workspace/mobileWorkspaceEditing'
import type { ReadOnlyWorkspaceRequest } from '../workspace/readOnlyWorkspaceRepository'
import { tabletWorkspaceBulkNoteActions } from './tabletWorkspaceBulkActions'

type ApplyWorkspaceEdit = (edit: MobileWorkspaceEdit) => void

export function editorWorkspaceActions({
  applyEdit,
  repositoryRequest,
  selectedNote,
  workspaceSnapshot,
}: {
  applyEdit: ApplyWorkspaceEdit
  repositoryRequest?: ReadOnlyWorkspaceRequest
  selectedNote: MobileNote | null
  workspaceSnapshot: MobileWorkspaceSnapshot
}) {
  return {
    onCopyDeepLink: () => {
      const result = buildMobileDeepLinkForNote({
        note: selectedNote,
        source: workspaceSnapshot.source,
        vaultRootUri: repositoryRequest?.vaultRootUri,
      })
      if (!result.ok) return

      void writeMobileClipboardText(result.url).catch((error) => {
        console.warn('[mobile-deep-link] Failed to copy deep link:', error)
      })
    },
    onDeleteNote: () => {
      if (selectedNote) applyEdit({ noteId: selectedNote.id, type: 'deleteNote' })
    },
    onExportNoteAsPdf: () => {
      void exportMobileNoteAsPdf(selectedNote).catch((error) => {
        console.warn('[mobile-pdf-export] Failed to export PDF:', error)
      })
    },
    onSetArchived: (archived: boolean) => {
      if (selectedNote) applyEdit({ archived, noteId: selectedNote.id, type: 'setArchived' })
    },
    onSetOrganized: (organized: boolean) => {
      if (selectedNote) applyEdit({ noteId: selectedNote.id, organized, type: 'setOrganized' })
    },
    onToggleFavorite: () => {
      if (selectedNote) applyEdit({ noteId: selectedNote.id, type: 'toggleFavorite' })
    },
    onToggleNoteWidth: () => {
      if (selectedNote) applyEdit({
        key: '_width',
        noteId: selectedNote.id,
        type: 'updateProperty',
        value: toggleMobileNoteWidth(selectedNote.noteWidth),
      })
    },
    onUpdateNoteContent: (noteId: string, content: string) => {
      applyEdit(editorContentUpdate(workspaceSnapshot, noteId, content))
    },
    ...tabletWorkspaceBulkNoteActions(applyEdit),
  }
}

function editorContentUpdate(
  snapshot: MobileWorkspaceSnapshot,
  noteId: string,
  content: string,
): MobileWorkspaceEdit {
  const note = workspaceNotes(snapshot).find((candidate) => candidate.id === noteId)
  return note?.fileKind === 'text'
    ? { content, noteId, type: 'updateTextFileContent' }
    : { content, noteId, type: 'updateNoteContent' }
}

function workspaceNotes(snapshot: MobileWorkspaceSnapshot): MobileNote[] {
  return snapshot.allNotes ?? snapshot.notes
}
