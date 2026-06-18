import type { MobileWorkspaceEdit } from '../workspace/mobileWorkspaceEditing'

type ApplyWorkspaceEdit = (edit: MobileWorkspaceEdit) => void
type BulkNoteEditFactory = (noteId: string) => MobileWorkspaceEdit

export function tabletWorkspaceBulkNoteActions(applyEdit: ApplyWorkspaceEdit) {
  return {
    onBulkArchiveNotes: (noteIds: string[], archived: boolean) => {
      applyBulkNoteEdit(noteIds, (noteId) => ({ archived, noteId, type: 'setArchived' }), applyEdit)
    },
    onBulkDeleteNotes: (noteIds: string[]) => {
      applyBulkNoteEdit(noteIds, (noteId) => ({ noteId, type: 'deleteNote' }), applyEdit)
    },
    onBulkOrganizeNotes: (noteIds: string[]) => {
      applyBulkNoteEdit(noteIds, (noteId) => ({ noteId, organized: true, type: 'setOrganized' }), applyEdit)
    },
  }
}

function applyBulkNoteEdit(
  noteIds: string[],
  toEdit: BulkNoteEditFactory,
  applyEdit: ApplyWorkspaceEdit,
) {
  applyEdit({
    edits: noteIds.map(toEdit),
    type: 'bulkEdit',
  })
}
