export type MobileTone = 'blue' | 'gray' | 'green' | 'orange' | 'purple' | 'red' | 'yellow'

export type MobileNote = {
  archived?: boolean
  created: string
  createdAt?: number | null
  date: string
  editorBlocks?: MobileEditorBlock[]
  editorBullets?: string[]
  favorite: boolean
  id: string
  links: number
  modified: string
  modifiedAt?: number | null
  organized?: boolean
  path?: string
  properties?: MobileProperty[]
  rawContent?: string
  relationships: MobileRelationship[]
  status: string
  snippet: string
  tags: string[]
  title: string
  type: string
  typeTone: MobileTone
  workspace: string
}

export type MobileRelationshipKind = 'belongsTo' | 'has' | 'relatedTo' | 'custom'

export type MobileRelationship = {
  kind: MobileRelationshipKind
  key?: string
  label?: string
  values: MobileRelationshipValue[]
}

export type MobileRelationshipValue = {
  id?: string
  ref?: string
  title: string
  type: string
  typeTone: MobileTone
}

export type MobilePropertyValue = string | number | boolean | string[]

export type MobileProperty = {
  key: string
  label: string
  value: MobilePropertyValue
}

export type MobileSidebarIcon =
  | 'archive'
  | 'file'
  | 'folder'
  | 'inbox'
  | 'procedure'
  | 'star'
  | 'tag'
  | 'view'

export type MobileSidebarItem = {
  active?: boolean
  count?: string
  icon: MobileSidebarIcon
  id: string
  label: string
  tone?: MobileTone
  viewId?: string
}

export type MobileSidebarSection = {
  count?: string
  folders?: MobileSidebarFolder[]
  id: string
  items?: MobileSidebarItem[]
  label?: string
}

export type MobileSidebarFolder = {
  active?: boolean
  children: MobileSidebarFolder[]
  expanded?: boolean
  id: string
  name: string
}

export type MobileSyncStatus = {
  kind: 'conflict' | 'pullRequired' | 'synced'
  minutesAgo?: number
}

export type MobileEditorInline = {
  bold?: boolean
  code?: boolean
  italic?: boolean
  text: string
}

export type MobileEditorBlock =
  | { content: MobileEditorInline[]; kind: 'paragraph' }
  | { kind: 'heading'; level: 2 | 3; text: string }
  | { items: MobileEditorInline[][]; kind: 'bullets' }
  | { content: MobileEditorInline[]; kind: 'quote' }
  | { headers: string[]; kind: 'table'; rows: string[][] }

export type MobileViewFilterOp = 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'any_of' | 'none_of' | 'is_empty' | 'is_not_empty' | 'before' | 'after'

export type MobileViewFilterCondition = {
  field: string
  op: MobileViewFilterOp
  regex?: boolean
  value?: unknown
}

export type MobileViewFilterGroup = { all: MobileViewFilterNode[] } | { any: MobileViewFilterNode[] }
export type MobileViewFilterNode = MobileViewFilterCondition | MobileViewFilterGroup

export type MobileViewDefinition = {
  color: string | null
  filters: MobileViewFilterGroup
  icon: string | null
  listPropertiesDisplay?: string[]
  name: string
  order?: number | null
  sort: string | null
}

export type MobileSavedView = {
  definition: MobileViewDefinition
  filename: string
  id: string
}

export type MobileWorkspaceSnapshot = {
  allNotes?: MobileNote[]
  editorBlocks: MobileEditorBlock[]
  editorBullets: string[]
  noteListSubtitle: string
  notes: MobileNote[]
  searchQuery?: string
  selectedNoteId?: string
  sidebarSections: MobileSidebarSection[]
  source?: MobileWorkspaceSource
  sync: MobileSyncStatus
  views?: MobileSavedView[]
}

export type MobileWorkspaceSource = {
  kind: 'fixture' | 'localVault'
  label: string
  totalNotes: number
  visibleNotes: number
}
