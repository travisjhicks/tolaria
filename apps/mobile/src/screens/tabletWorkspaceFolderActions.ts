import type { MobileWorkspaceAction } from '../components/workspace/MobileWorkspaceActionSheet'
import type { MobileSidebarFolderSelection } from '../components/workspace/MobileWorkspaceSidebar'
import { writeMobileClipboardText } from '../workspace/mobileClipboard'
import type { MobileWorkspaceEdit } from '../workspace/mobileWorkspaceEditing'
import { mobileFolderName, mobileFolderParentPath } from '../workspace/mobileWorkspaceFolders'
import { buildMobileFilePathForRelativePath } from '../workspace/mobileNoteFilePath'
import type { TabletReadOnlyForm } from './tabletWorkspaceTypes'
import type { TabletSidebarSelection } from './tabletWorkspaceNavigation'

type ApplyWorkspaceEdit = (edit: MobileWorkspaceEdit) => void
type CloseWorkspaceAction = () => void
type ReadOnlyFormUpdater = <Key extends keyof TabletReadOnlyForm>(key: Key, value: TabletReadOnlyForm[Key]) => void
type SetOpenAction = (action: MobileWorkspaceAction | null) => void
type SelectFolder = (selection: MobileSidebarFolderSelection) => void
type ReadOnlyFormField = {
  [Key in keyof TabletReadOnlyForm]: { key: Key; value: TabletReadOnlyForm[Key] }
}[keyof TabletReadOnlyForm]

export function folderWorkspaceActions({
  applyEdit,
  closeAction,
  readOnlyForm,
  selectFolder,
  setOpenAction,
  updateReadOnlyForm,
  vaultRootUri,
}: {
  applyEdit: ApplyWorkspaceEdit
  closeAction: CloseWorkspaceAction
  readOnlyForm: TabletReadOnlyForm
  selectFolder: SelectFolder
  setOpenAction: SetOpenAction
  updateReadOnlyForm: ReadOnlyFormUpdater
  vaultRootUri?: string | null
}) {
  return {
    onCopyFolderPath: () => copyFolderPath({
      closeAction,
      folderPath: readOnlyForm.editingFolderPath,
      vaultRootUri,
    }),
    onCreateFolder: () => commitFolderEdit({
      applyEdit,
      closeAction,
      edit: {
        name: readOnlyForm.folderName,
        parentPath: readOnlyForm.folderParentPath,
        type: 'createFolder',
      },
    }),
    onDeleteFolder: () => deleteFolder({
      applyEdit,
      closeAction,
      folderPath: readOnlyForm.editingFolderPath,
    }),
    onFolderNameChange: (value: string) => updateReadOnlyForm('folderName', value),
    onOpenCreateChildFolder: () => openCreateFolderAction({
      parentPath: readOnlyForm.editingFolderPath,
      setOpenAction,
      updateReadOnlyForm,
    }),
    onOpenCreateNoteInFolder: () => openCreateNoteInFolder({
      folderPath: readOnlyForm.editingFolderPath,
      folderName: readOnlyForm.folderName,
      selectFolder,
      setOpenAction,
      updateReadOnlyForm,
    }),
    onRenameFolder: () => commitFolderEdit({
      applyEdit,
      closeAction,
      edit: {
        folderPath: readOnlyForm.editingFolderPath,
        name: readOnlyForm.folderName,
        type: 'renameFolder',
      },
    }),
  }
}

export function createFolderFields(parentPath: string): ReadOnlyFormField[] {
  return [
    { key: 'editingFolderPath', value: '' },
    { key: 'folderName', value: '' },
    { key: 'folderParentPath', value: parentPath },
  ]
}

export function folderActionFields(selection: MobileSidebarFolderSelection): ReadOnlyFormField[] {
  return [
    { key: 'editingFolderPath', value: selection.id },
    { key: 'folderName', value: selection.name },
    { key: 'folderParentPath', value: mobileFolderParentPath(selection.id) },
  ]
}

export function folderParentPathForSelection(selection: TabletSidebarSelection): string {
  return selection.kind === 'folder' ? selection.id : ''
}

function openCreateFolderAction({
  parentPath,
  setOpenAction,
  updateReadOnlyForm,
}: {
  parentPath: string
  setOpenAction: SetOpenAction
  updateReadOnlyForm: ReadOnlyFormUpdater
}) {
  for (const field of createFolderFields(parentPath)) {
    updateReadOnlyForm(field.key, field.value)
  }
  setOpenAction('createFolder')
}

function openCreateNoteInFolder({
  folderPath,
  folderName,
  selectFolder,
  setOpenAction,
  updateReadOnlyForm,
}: {
  folderPath: string
  folderName: string
  selectFolder: SelectFolder
  setOpenAction: SetOpenAction
  updateReadOnlyForm: ReadOnlyFormUpdater
}) {
  if (!folderPath) return
  updateReadOnlyForm('createTitle', '')
  selectFolder({ id: folderPath, name: folderName || mobileFolderName(folderPath) })
  setOpenAction('createNote')
}

export function copyMobileFolderPath({
  folderPath,
  onCopied,
  vaultRootUri,
}: {
  folderPath: string
  onCopied?: () => void
  vaultRootUri?: string | null
}) {
  const result = buildMobileFilePathForRelativePath({ path: folderPath, vaultRootUri })
  if (!result.ok) return

  onCopied?.()
  void writeMobileClipboardText(result.path).catch((error) => {
    console.warn('[mobile-folder-path] Failed to copy folder path:', error)
  })
}

function copyFolderPath({
  closeAction,
  folderPath,
  vaultRootUri,
}: {
  closeAction: CloseWorkspaceAction
  folderPath: string
  vaultRootUri?: string | null
}) {
  copyMobileFolderPath({ folderPath, onCopied: closeAction, vaultRootUri })
}

function commitFolderEdit({
  applyEdit,
  closeAction,
  edit,
}: {
  applyEdit: ApplyWorkspaceEdit
  closeAction: CloseWorkspaceAction
  edit: MobileWorkspaceEdit
}) {
  applyEdit(edit)
  closeAction()
}

function deleteFolder({
  applyEdit,
  closeAction,
  folderPath,
}: {
  applyEdit: ApplyWorkspaceEdit
  closeAction: CloseWorkspaceAction
  folderPath: string
}) {
  if (!folderPath) return
  commitFolderEdit({ applyEdit, closeAction, edit: { folderPath, type: 'deleteFolder' } })
}
