import type { MobileWorkspaceAction } from '../components/workspace/MobileWorkspaceActionSheet'
import type {
  MobileSidebarFolderSelection,
  MobileSidebarItemSelection,
} from '../components/workspace/MobileWorkspaceSidebar'
import type {
  MobileEditorBlock,
  MobileNote,
  MobilePropertyValue,
  MobileViewFilterGroup,
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
  editingViewId: ReadOnlyFormValue
  propertyName: ReadOnlyFormValue
  propertyValue: ReadOnlyFormValue
  relationshipName: ReadOnlyFormValue
  relationshipNoteTitle: ReadOnlyFormValue
  viewFilters: MobileViewFilterGroup
  viewName: ReadOnlyFormValue
}

export type TabletWorkspaceChromeProps = {
  activeFolderId: string | null
  activeItemId: string | null
  compactTablet: boolean
  defaultPropertiesVisible: boolean
  editorBlocks: MobileEditorBlock[]
  editorBullets: string[]
  layoutProbe?: boolean
  noteListSubtitle: NoteCountText
  noteListTitle: SidebarLabel
  notes: MobileNote[]
  onAddProperty: () => void
  onAddRelationship: () => void
  onCloseAction: () => void
  onCreateNote: () => void
  onCreateTitleChange: (value: ReadOnlyFormValue) => void
  onCreateView: () => void
  onDeleteView: () => void
  onDeleteProperty: (noteId: NoteId, key: string) => void
  onOpenCreateNote: () => void
  onOpenCreateView: () => void
  onOpenViewActions: (selection: MobileSidebarItemSelection) => void
  onOpenMoreActions: () => void
  onOpenSearch: () => void
  onRemoveRelationship: (noteId: NoteId, key: string, ref: string) => void
  onSaveProperty: () => void
  onSaveRelationship: () => void
  onUpdateNoteContent: (noteId: NoteId, content: string) => void
  onUpdateNoteTitle: (noteId: NoteId, title: string) => void
  onUpdateProperty: (noteId: NoteId, key: string, value: MobilePropertyValue) => void
  onViewFiltersChange: (value: MobileViewFilterGroup) => void
  onViewNameChange: (value: ReadOnlyFormValue) => void
  onSaveView: () => void
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
