import type { MobileWorkspaceAction } from '../components/workspace/MobileWorkspaceActionSheet'
import { mobileCreateNoteDefaultsForType } from '../workspace/mobileCreateNoteDefaults'
import {
  normalizedDisplayProperties,
  type MobileWorkspaceEdit,
} from '../workspace/mobileWorkspaceEditing'
import type {
  MobileCreateNoteDefaults,
  MobileSidebarIcon,
  MobileTone,
  MobileTypeDefinitions,
  MobileViewFilterGroup,
} from '../workspace/mobileWorkspaceModel'
import type { ReadOnlyWorkspaceRequest } from '../workspace/readOnlyWorkspaceRepository'
import { mobileSidebarIconFromValue } from '../workspace/mobileWorkspaceMetadata'
import { createNoteDefaultsForSelection } from './tabletWorkspaceCreateDefaults'
import type { TabletSidebarSelection } from './tabletWorkspaceNavigation'
import type { TabletReadOnlyForm } from './tabletWorkspaceTypes'

type ApplyWorkspaceEdit = (edit: MobileWorkspaceEdit) => void
type ReadOnlyFormUpdater = <Key extends keyof TabletReadOnlyForm>(key: Key, value: TabletReadOnlyForm[Key]) => void
type SetOpenAction = (action: MobileWorkspaceAction | null) => void

type CreateNoteContext = {
  applyEdit: ApplyWorkspaceEdit
  closeAction: () => void
  selection: TabletSidebarSelection
  title: string
  typeDefinitions?: MobileTypeDefinitions
}

type CreateTypedNoteContext = {
  applyEdit: ApplyWorkspaceEdit
  closeAction: () => void
  typeDefinitions?: MobileTypeDefinitions
  typeName: string
}

export type TabletWorkspaceCreateActionsContext = {
  applyEdit: ApplyWorkspaceEdit
  closeAction: () => void
  readOnlyForm: TabletReadOnlyForm
  repositoryRequest?: ReadOnlyWorkspaceRequest
  selectFolder: (folderId: string) => void
  selection: TabletSidebarSelection
  setOpenAction: SetOpenAction
  updateReadOnlyForm: ReadOnlyFormUpdater
}

export function createWorkspaceNote({
  applyEdit,
  closeAction,
  selection,
  title,
  typeDefinitions,
}: CreateNoteContext) {
  applyEdit({
    defaults: createNoteDefaultsForSelection(selection, typeDefinitions),
    title,
    type: 'createNote',
  })
  closeAction()
}

export function createTypedWorkspaceNote({
  applyEdit,
  closeAction,
  typeDefinitions,
  typeName,
}: CreateTypedNoteContext) {
  const defaults = mobileCreateNoteDefaultsForType(typeName, typeDefinitions)
  createWorkspaceNoteFromDefaults({ applyEdit, closeAction, defaults, title: '' })
}

export function createWorkspaceView({
  applyEdit,
  closeAction,
  displayProperties,
  filters,
  icon,
  name,
  sort,
  tone,
}: {
  applyEdit: ApplyWorkspaceEdit
  closeAction: () => void
  displayProperties: string[]
  filters: MobileViewFilterGroup
  icon: string
  name: string
  sort: string
  tone: MobileTone | null
}) {
  const trimmedName = name.trim()
  if (!trimmedName) return

  applyEdit({
    definition: {
      color: tone,
      filters,
      icon: normalizedOptionalIcon(icon),
      listPropertiesDisplay: normalizedDisplayProperties(displayProperties),
      name: trimmedName,
      sort: normalizedOptionalSort(sort),
    },
    type: 'createView',
  })
  closeAction()
}

export function normalizedOptionalSort(sort: string) {
  return sort.trim() || null
}

export function normalizedOptionalIcon(icon: string): MobileSidebarIcon | null {
  return icon.trim() ? mobileSidebarIconFromValue(icon, 'view') : null
}

function createWorkspaceNoteFromDefaults({
  applyEdit,
  closeAction,
  defaults,
  title,
}: {
  applyEdit: ApplyWorkspaceEdit
  closeAction: () => void
  defaults: MobileCreateNoteDefaults
  title: string
}) {
  applyEdit({ defaults, title, type: 'createNote' })
  closeAction()
}
