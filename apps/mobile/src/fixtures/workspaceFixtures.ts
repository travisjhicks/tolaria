import type {
  MobileEditorBlock,
  MobileEditorInline,
  MobileNote,
  MobileRelationship,
  MobileRelationshipKind,
  MobileRelationshipValue,
  MobileSidebarFolder,
  MobileSidebarIcon,
  MobileSidebarItem,
  MobileSidebarSection,
  MobileSavedView,
  MobileSyncStatus,
  MobileTone,
  MobileWorkspaceSnapshot,
} from '../workspace/mobileWorkspaceModel'

export type FixtureNote = MobileNote
export type FixtureRelationshipKind = MobileRelationshipKind
export type FixtureRelationship = MobileRelationship
export type FixtureRelationshipValue = MobileRelationshipValue
export type FixtureTone = MobileTone
export type FixtureSidebarIcon = MobileSidebarIcon
export type FixtureSidebarItem = MobileSidebarItem
export type FixtureSidebarSection = MobileSidebarSection
export type FixtureSidebarFolder = MobileSidebarFolder
export type FixtureSavedView = MobileSavedView
export type FixtureSyncStatus = MobileSyncStatus
export type FixtureEditorInline = MobileEditorInline
export type FixtureEditorBlock = MobileEditorBlock

export type WorkspaceScenario = MobileWorkspaceSnapshot & {
  id: WorkspaceScenarioId
}

export type WorkspaceScenarioId =
  | 'default'
  | 'empty-inbox'
  | 'folder-tree'
  | 'long-title'
  | 'property-heavy'

export const fixtureEditorBullets = [
  'The current narrative routes every workflow through an LLM surface.',
  'Tolaria should keep writing, relationships, and properties visible together.',
  'The mobile UI should match desktop semantics before phone-specific reduction.',
]

export const fixtureEditorBlocks: FixtureEditorBlock[] = [
  {
    kind: 'paragraph',
    content: [
      { text: 'Tolaria should keep ' },
      { bold: true, text: 'writing, relationships, and properties' },
      { text: ' visible together before we reduce the interface for smaller screens.' },
    ],
  },
  {
    kind: 'heading',
    level: 2,
    text: 'Mobile parity notes',
  },
  {
    kind: 'bullets',
    items: [
      [
        { text: 'Start from desktop semantics, then adapt only for touch and navigation.' },
      ],
      [
        { text: 'Use ' },
        { code: true, text: 'muted' },
        { text: ' text for previews, section labels, dates, and lower-priority chrome.' },
      ],
      [
        { italic: true, text: 'Relationship values stay typed, colored, and full-width.' },
      ],
    ],
  },
  {
    kind: 'quote',
    content: [
      { text: 'Desktop parity is the baseline; mobile convention is an explicit exception.' },
    ],
  },
  {
    headers: ['Surface', 'Desktop source', 'Mobile target'],
    kind: 'table',
    rows: [
      ['Sidebar', 'SidebarGroupHeader', 'muted 10px groups'],
      ['Note list', 'NoteItem', '13px titles, 12px previews'],
      ['Inspector', 'RelationshipsPanel', 'full-width typed relationships'],
    ],
  },
]

const longTitleEditorBlocks: FixtureEditorBlock[] = [
  {
    kind: 'paragraph',
    content: [
      { text: 'This note intentionally uses a title long enough to pressure the row, toolbar, and editor heading.' },
    ],
  },
  {
    kind: 'bullets',
    items: [
      [{ text: 'Truncate in narrow chrome.' }],
      [{ text: 'Wrap only inside the editor content area.' }],
    ],
  },
]

const propertyHeavyEditorBlocks: FixtureEditorBlock[] = [
  {
    kind: 'paragraph',
    content: [
      { text: 'Property-heavy notes should preserve scanability even when relationships contain several typed groups.' },
    ],
  },
  {
    kind: 'heading',
    level: 3,
    text: 'Inspector pressure',
  },
  {
    kind: 'table',
    headers: ['Property', 'Expected rendering'],
    rows: [
      ['Tags', 'wrap under the label'],
      ['Belongs to', 'typed full-width rows'],
      ['Has', 'multiple values without a global heading'],
    ],
  },
]

export const fixtureNotes: FixtureNote[] = [
  {
    id: 'workflow-orchestration',
    path: 'Tolaria/Mobile UI/Workflow Orchestration Essay.md',
    title: 'Workflow Orchestration Essay',
    snippet: 'The current narrative and temptation: everything routed through an LLM.',
    type: 'Essay',
    typeTone: 'green',
    tags: ['Design', 'AI'],
    status: 'Draft',
    date: 'May 13, 2026',
    modified: '9h ago',
    created: '5d ago',
    favorite: true,
    links: 12,
    relationships: [
      {
        kind: 'belongsTo',
        values: [
          { title: 'LLM Workflow', type: 'Essay', typeTone: 'green' },
          { title: 'Tolaria MVP', type: 'Project', typeTone: 'purple' },
        ],
      },
      {
        kind: 'relatedTo',
        values: [
          { title: 'Release Notes', type: 'Release', typeTone: 'orange' },
        ],
      },
      {
        kind: 'custom',
        label: 'Mentions',
        values: [
          { title: 'AI Ops Guide', type: 'Procedure', typeTone: 'purple' },
        ],
      },
    ],
    workspace: 'TV',
  },
  {
    id: 'open-source-project',
    path: 'Tolaria/Mobile UI/How I Run an Open Source Project.md',
    title: 'How I Run an Open Source Project',
    snippet: 'Tolaria unexpected success: various sources of input, requests, and bugs.',
    type: 'Procedure',
    typeTone: 'purple',
    tags: ['Process', 'Public'],
    status: 'Active',
    date: 'May 12, 2026',
    modified: '10h ago',
    created: '10h ago',
    favorite: false,
    links: 8,
    relationships: [
      {
        kind: 'has',
        values: [
          { title: 'Contributor Guide', type: 'Procedure', typeTone: 'purple' },
          { title: 'Community Forum', type: 'Essay', typeTone: 'green' },
        ],
      },
      {
        kind: 'belongsTo',
        values: [
          { title: 'Project Board', type: 'Project', typeTone: 'purple' },
        ],
      },
    ],
    workspace: 'TV',
  },
  {
    id: 'release-2026-05-02',
    path: 'Tolaria/Releases/v2026-05-02.md',
    title: 'v2026-05-02',
    snippet: 'Release cleanup date, bug fixes, and mobile planning notes.',
    type: 'Release',
    typeTone: 'orange',
    tags: ['Tolaria MVP'],
    status: 'Shipped',
    date: 'May 2, 2026',
    modified: '12h ago',
    created: '1d ago',
    favorite: false,
    links: 18,
    relationships: [
      {
        kind: 'relatedTo',
        values: [
          { title: 'QA Checklist', type: 'Procedure', typeTone: 'purple' },
          { title: 'Mobile Planning', type: 'Essay', typeTone: 'green' },
        ],
      },
      {
        kind: 'has',
        values: [
          { title: 'Release Notes', type: 'Release', typeTone: 'orange' },
          { title: 'Postmortem', type: 'Essay', typeTone: 'green' },
        ],
      },
    ],
    workspace: 'TV',
  },
]

const longTitleNote: FixtureNote = {
  id: 'long-title-layout-pressure',
  path: 'Writing/Essays/A Very Long Note Title.md',
  title: 'A Very Long Note Title That Should Stay Readable Without Pushing Type Icons or Property Controls Out of Alignment',
  snippet: 'Used to verify row truncation, editor title wrapping, and toolbar stability.',
  type: 'Essay',
  typeTone: 'green',
  tags: ['Design', 'Mobile', 'Layout'],
  status: 'Draft',
  date: 'June 3, 2026',
  modified: '14m ago',
  created: '2d ago',
  favorite: false,
  links: 6,
  relationships: [
    {
      kind: 'relatedTo',
      values: [
        { title: 'Tablet Shell', type: 'Project', typeTone: 'purple' },
        { title: 'Properties Panel', type: 'Procedure', typeTone: 'purple' },
      ],
    },
  ],
  workspace: 'TV',
}

const propertyHeavyNote: FixtureNote = {
  id: 'mobile-ui-property-heavy',
  path: 'Tolaria/Mobile UI/Mobile UI Parity Review.md',
  title: 'Mobile UI Parity Review',
  snippet: 'A dense fixture for multi-value properties, relationship groups, and long metadata sets.',
  type: 'Procedure',
  typeTone: 'purple',
  tags: ['Mobile', 'Parity', 'Design QA', 'Tablet', 'Inspector', 'Relationships'],
  status: 'Active',
  date: 'June 9, 2026',
  modified: '3m ago',
  created: '4d ago',
  favorite: true,
  links: 32,
  relationships: [
    {
      kind: 'belongsTo',
      values: [
        { title: 'Tolaria Mobile', type: 'Project', typeTone: 'purple' },
        { title: 'Tablet Workspace', type: 'Essay', typeTone: 'green' },
      ],
    },
    {
      kind: 'has',
      values: [
        { title: 'Navigation Pass', type: 'Procedure', typeTone: 'purple' },
        { title: 'Property Inspector Pass', type: 'Procedure', typeTone: 'purple' },
        { title: 'Sync Footer Pass', type: 'Procedure', typeTone: 'purple' },
        { title: 'Screenshot QA Matrix', type: 'Release', typeTone: 'orange' },
      ],
    },
    {
      kind: 'relatedTo',
      values: [
        { title: 'Desktop Inspector', type: 'Essay', typeTone: 'green' },
        { title: 'Relationship Model', type: 'Essay', typeTone: 'green' },
        { title: 'Mobile Design Review', type: 'Procedure', typeTone: 'purple' },
      ],
    },
    {
      kind: 'custom',
      label: 'Depends on',
      values: [
        { title: 'Fixture Harness', type: 'Procedure', typeTone: 'purple' },
        { title: 'Expo Web Export', type: 'Procedure', typeTone: 'purple' },
        { title: 'Playwright Screenshots', type: 'Release', typeTone: 'orange' },
      ],
    },
  ],
  workspace: 'TV',
}

const defaultSidebarSections: FixtureSidebarSection[] = [
  {
    id: 'primary',
    items: [
      { id: 'inbox', active: true, count: '7', icon: 'inbox', label: 'Inbox' },
      { id: 'all-notes', count: '8846', icon: 'file', label: 'All Notes' },
      { id: 'archive', count: '276', icon: 'archive', label: 'Archive' },
    ],
  },
  {
    id: 'favorites',
    label: 'Favorites',
    items: [
      { id: 'personal-journal', icon: 'star', label: 'Personal Journal' },
      { id: 'tolaria-mvp', icon: 'folder', label: 'Tolaria MVP' },
    ],
  },
  {
    id: 'views',
    label: 'Views',
    items: [
      { id: 'view-active-procedures', count: '1', icon: 'view', label: 'Active Procedures', tone: 'purple', viewId: 'view-active-procedures' },
    ],
  },
  {
    count: '517',
    id: 'types',
    label: 'Types',
    items: [
      { id: 'essays', count: '448', icon: 'file', label: 'Essays', tone: 'green' },
      { id: 'procedures', count: '51', icon: 'procedure', label: 'Procedures', tone: 'purple' },
      { id: 'responsibilities', count: '18', icon: 'tag', label: 'Responsibilities', tone: 'orange' },
    ],
  },
  {
    id: 'folders',
    label: 'Folders',
    folders: [
      {
        id: 'writing',
        name: 'Writing',
        expanded: true,
        children: [
          { id: 'writing-essays', name: 'Essays', children: [] },
          { id: 'writing-drafts', name: 'Drafts', children: [] },
        ],
      },
      {
        id: 'tolaria',
        name: 'Tolaria',
        expanded: true,
        active: true,
        children: [
          { id: 'tolaria-mobile', name: 'Mobile UI', children: [] },
          { id: 'tolaria-releases', name: 'Releases', children: [] },
        ],
      },
    ],
  },
]

const fixtureViews: FixtureSavedView[] = [
  {
    filename: 'active-procedures.yml',
    id: 'view-active-procedures',
    definition: {
      color: 'purple',
      filters: {
        all: [
          { field: 'type', op: 'equals', value: 'Procedure' },
          { field: 'status', op: 'equals', value: 'Active' },
        ],
      },
      icon: null,
      name: 'Active Procedures',
      sort: 'modified:desc',
    },
  },
]

const folderTreePressureSections: FixtureSidebarSection[] = [
  ...defaultSidebarSections.filter((section) => section.id !== 'folders'),
  {
    id: 'folders',
    label: 'Folders',
    folders: [
      {
        id: 'writing',
        name: 'Writing',
        expanded: true,
        children: [
          { id: 'writing-essays', name: 'Essays', children: [] },
          { id: 'writing-drafts', name: 'Drafts', children: [] },
          { id: 'writing-research', name: 'Research Backlog', children: [] },
        ],
      },
      {
        id: 'tolaria',
        name: 'Tolaria',
        expanded: true,
        active: true,
        children: [
          {
            id: 'tolaria-mobile',
            name: 'Mobile UI',
            expanded: true,
            children: [
              { id: 'tolaria-mobile-tablet', name: 'Tablet Shell', children: [] },
              { id: 'tolaria-mobile-properties', name: 'Properties Panel', children: [] },
            ],
          },
          { id: 'tolaria-releases', name: 'Releases', children: [] },
        ],
      },
      {
        id: 'attachments',
        name: 'Attachments',
        expanded: true,
        children: [
          { id: 'attachments-images', name: 'Images', children: [] },
          { id: 'attachments-pdfs', name: 'PDFs', children: [] },
        ],
      },
    ],
  },
]

export const defaultWorkspaceScenarioId: WorkspaceScenarioId = 'default'

export const workspaceScenarios: Record<WorkspaceScenarioId, WorkspaceScenario> = {
  default: {
    editorBlocks: fixtureEditorBlocks,
    editorBullets: fixtureEditorBullets,
    id: 'default',
    noteListSubtitle: '7 open notes',
    notes: fixtureNotes,
    selectedNoteId: fixtureNotes[0].id,
    sidebarSections: defaultSidebarSections,
    sync: { kind: 'synced', minutesAgo: 2 },
    views: fixtureViews,
  },
  'folder-tree': {
    editorBlocks: fixtureEditorBlocks,
    editorBullets: fixtureEditorBullets,
    id: 'folder-tree',
    noteListSubtitle: '7 open notes',
    notes: fixtureNotes,
    selectedNoteId: fixtureNotes[1].id,
    sidebarSections: folderTreePressureSections,
    sync: { kind: 'synced', minutesAgo: 8 },
    views: fixtureViews,
  },
  'empty-inbox': {
    editorBlocks: fixtureEditorBlocks,
    editorBullets: fixtureEditorBullets,
    id: 'empty-inbox',
    noteListSubtitle: '0 open notes',
    notes: [],
    searchQuery: 'Inbox',
    sidebarSections: defaultSidebarSections,
    sync: { kind: 'pullRequired' },
    views: fixtureViews,
  },
  'long-title': {
    editorBlocks: longTitleEditorBlocks,
    editorBullets: [
      'This note intentionally uses a title long enough to pressure the row, toolbar, and editor heading.',
      'The title should truncate in narrow slots and wrap only inside the editor content area.',
    ],
    id: 'long-title',
    noteListSubtitle: '8 open notes',
    notes: [longTitleNote, ...fixtureNotes],
    selectedNoteId: longTitleNote.id,
    sidebarSections: defaultSidebarSections,
    sync: { kind: 'synced', minutesAgo: 1 },
    views: fixtureViews,
  },
  'property-heavy': {
    editorBlocks: propertyHeavyEditorBlocks,
    editorBullets: [
      'Property-heavy notes should preserve scanability even when relationships contain several typed groups.',
      'The add-property and add-relationship affordances must remain visible without becoming floating actions.',
    ],
    id: 'property-heavy',
    noteListSubtitle: '8 open notes',
    notes: [propertyHeavyNote, ...fixtureNotes],
    selectedNoteId: propertyHeavyNote.id,
    sidebarSections: defaultSidebarSections,
    sync: { kind: 'conflict' },
    views: fixtureViews,
  },
}

export function workspaceScenarioForId(id: string | null | undefined) {
  if (!id || !(id in workspaceScenarios)) {
    return workspaceScenarios[defaultWorkspaceScenarioId]
  }

  return workspaceScenarios[id as WorkspaceScenarioId]
}
