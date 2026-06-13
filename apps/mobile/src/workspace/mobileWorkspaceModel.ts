export type MobileTone = 'blue' | 'gray' | 'green' | 'orange' | 'purple' | 'red' | 'yellow'

export type MobileNote = {
  archived?: boolean
  created: string
  date: string
  editorBlocks?: MobileEditorBlock[]
  editorBullets?: string[]
  favorite: boolean
  id: string
  links: number
  modified: string
  organized?: boolean
  path?: string
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
  label?: string
  values: MobileRelationshipValue[]
}

export type MobileRelationshipValue = {
  title: string
  type: string
  typeTone: MobileTone
}

export type MobileSidebarIcon =
  | 'archive'
  | 'file'
  | 'folder'
  | 'inbox'
  | 'procedure'
  | 'star'
  | 'tag'

export type MobileSidebarItem = {
  active?: boolean
  count?: string
  icon: MobileSidebarIcon
  id: string
  label: string
  tone?: MobileTone
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

export type MobileWorkspaceSnapshot = {
  editorBlocks: MobileEditorBlock[]
  editorBullets: string[]
  noteListSubtitle: string
  notes: MobileNote[]
  searchQuery?: string
  selectedNoteId?: string
  sidebarSections: MobileSidebarSection[]
  source?: MobileWorkspaceSource
  sync: MobileSyncStatus
}

export type MobileWorkspaceSource = {
  kind: 'fixture' | 'localVault'
  label: string
  totalNotes: number
  visibleNotes: number
}
