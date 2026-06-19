import type { MobileSidebarFolderSelection } from '../components/workspace/MobileWorkspaceSidebar'
import type { MobileWorkspaceEdit } from '../workspace/mobileWorkspaceEditing'
import { copyMobileFolderPath } from './tabletWorkspaceFolderActions'
import type { TabletSidebarSelection } from './tabletWorkspaceNavigation'

type ApplyWorkspaceEdit = (edit: MobileWorkspaceEdit) => void

export function selectedFolderCommandActions({
  applyEdit,
  sidebarSelection,
  vaultRootUri,
}: {
  applyEdit: ApplyWorkspaceEdit
  sidebarSelection: TabletSidebarSelection
  vaultRootUri?: string | null
}) {
  const folder = selectedFolderSelection(sidebarSelection)

  return {
    onCopySelectedFolderPath: () => {
      if (!folder) return
      copyMobileFolderPath({ folderPath: folder.id, vaultRootUri })
    },
    onDeleteSelectedFolder: () => {
      if (!folder) return
      applyEdit({ folderPath: folder.id, type: 'deleteFolder' })
    },
  }
}

function selectedFolderSelection(selection: TabletSidebarSelection): MobileSidebarFolderSelection | null {
  if (selection.kind !== 'folder') return null
  return { id: selection.id, name: selection.label }
}
