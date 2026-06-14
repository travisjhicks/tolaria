import type { MobileWorkspaceAction } from '../components/workspace/MobileWorkspaceActionSheet'
import type {
  MobileSidebarFolderSelection,
  MobileSidebarItemSelection,
} from '../components/workspace/MobileWorkspaceSidebar'
import type {
  MobileEditorBlock,
  MobileNote,
  MobileWorkspaceSnapshot,
} from '../workspace/mobileWorkspaceModel'
import type {
  NoteCountText,
  NoteId,
  ReadOnlyFormValue,
  SearchQuery,
  SidebarLabel,
} from './tabletWorkspaceNavigation'

export type TabletPanel = 'noteList' | 'properties' | 'sidebar'

export type TabletReadOnlyForm = {
  createTitle: ReadOnlyFormValue
  propertyName: ReadOnlyFormValue
  propertyValue: ReadOnlyFormValue
  relationshipName: ReadOnlyFormValue
  relationshipNoteTitle: ReadOnlyFormValue
}

export type TabletWorkspaceChromeProps = {
  activeFolderId: string | null
  activeItemId: string | null
  compactTablet: boolean
  defaultPropertiesVisible: boolean
  editorBlocks: MobileEditorBlock[]
  editorBullets: string[]
  noteListSubtitle: NoteCountText
  noteListTitle: SidebarLabel
  notes: MobileNote[]
  onAddProperty: () => void
  onAddRelationship: () => void
  onCloseAction: () => void
  onCreateTitleChange: (value: ReadOnlyFormValue) => void
  onOpenCreateNote: () => void
  onOpenMoreActions: () => void
  onOpenSearch: () => void
  onPropertyNameChange: (value: ReadOnlyFormValue) => void
  onPropertyValueChange: (value: ReadOnlyFormValue) => void
  onRelationshipNameChange: (value: ReadOnlyFormValue) => void
  onRelationshipNoteTitleChange: (value: ReadOnlyFormValue) => void
  onSearchQueryChange: (value: SearchQuery) => void
  onSelectFolder: (selection: MobileSidebarFolderSelection) => void
  onSelectNote: (noteId: NoteId) => void
  onSelectSidebarItem: (selection: MobileSidebarItemSelection) => void
  onToggleFavorite: () => void
  openAction: MobileWorkspaceAction | null
  readOnlyForm: TabletReadOnlyForm
  searchQuery: SearchQuery
  selectedNote: MobileNote | null
  selectedNoteId: string | null
  snapshot: MobileWorkspaceSnapshot
}
