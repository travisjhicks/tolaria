export type MobileParityInventoryEntry = {
  assertions: string[]
  contracts: string[]
  desktopSource: string
  mobileFile: string
  surface: string
}

export const mobileParityInventory = [
  {
    assertions: ['panel chrome computed styles'],
    contracts: ['desktopPanelParity', 'desktopToolbarParity'],
    desktopSource: 'App shell split panes, NoteListHeader, InspectorHeader, BreadcrumbBar',
    mobileFile: 'src/ui/MobilePanel.tsx',
    surface: 'Panel and toolbar chrome',
  },
  {
    assertions: ['sync footer computed styles'],
    contracts: ['desktopStatusBarParity'],
    desktopSource: 'StatusBarFooter and StatusBarAction',
    mobileFile: 'src/ui/MobileButton.tsx',
    surface: 'Status-density buttons',
  },
  {
    assertions: ['property chips and sidebar count computed styles'],
    contracts: ['desktopPropertyParity', 'desktopSidebarParity'],
    desktopSource: 'SidebarCountPill and property chip styles',
    mobileFile: 'src/ui/MobileChip.tsx',
    surface: 'Pills and property chips',
  },
  {
    assertions: ['toolbar action computed styles'],
    contracts: ['desktopToolbarActionParity'],
    desktopSource: 'NoteListHeader action buttons and BreadcrumbBar icon buttons',
    mobileFile: 'src/ui/MobileIconButton.tsx',
    surface: 'Toolbar icon actions',
  },
  {
    assertions: ['note list computed styles'],
    contracts: ['desktopNoteItemParity'],
    desktopSource: 'NoteItem',
    mobileFile: 'src/ui/MobileListRow.tsx',
    surface: 'Note list rows',
  },
  {
    assertions: ['properties computed styles'],
    contracts: ['desktopPropertyParity'],
    desktopSource: 'propertyPanelLayout',
    mobileFile: 'src/ui/MobilePropertyRow.tsx',
    surface: 'Property rows',
  },
  {
    assertions: ['sidebar computed styles and click navigation'],
    contracts: ['desktopPanelParity', 'desktopSidebarParity'],
    desktopSource: 'SidebarGroupHeader, SidebarParts, FolderTree',
    mobileFile: 'src/components/workspace/MobileWorkspaceSidebar.tsx',
    surface: 'Workspace sidebar',
  },
  {
    assertions: ['note list computed styles and selection click'],
    contracts: ['desktopNoteItemParity', 'desktopPanelParity', 'desktopToolbarParity'],
    desktopSource: 'NoteListHeader and NoteItem',
    mobileFile: 'src/components/workspace/MobileNoteListPanel.tsx',
    surface: 'Note list panel',
  },
  {
    assertions: ['properties computed styles'],
    contracts: ['desktopPanelParity', 'desktopPropertyParity', 'desktopRelationshipParity'],
    desktopSource: 'InspectorHeader, propertyPanelLayout, RelationshipsPanel',
    mobileFile: 'src/components/workspace/MobilePropertiesPanel.tsx',
    surface: 'Properties panel',
  },
  {
    assertions: ['sync footer computed styles'],
    contracts: ['desktopStatusBarParity'],
    desktopSource: 'StatusBarFooter and StatusBarBadges',
    mobileFile: 'src/components/workspace/MobileSyncStatusBar.tsx',
    surface: 'Sync status bar',
  },
  {
    assertions: ['note and relationship icon size/color computed through parent rows'],
    contracts: ['desktopNoteItemParity', 'desktopRelationshipParity'],
    desktopSource: 'NoteItem type indicators and inspector relationship icons',
    mobileFile: 'src/components/workspace/MobileWorkspaceIcons.tsx',
    surface: 'Workspace type icons',
  },
  {
    assertions: ['editor computed styles'],
    contracts: ['desktopEditorParity', 'desktopPanelParity', 'desktopToolbarParity'],
    desktopSource: 'EditorTheme.css, theme.json, BreadcrumbBar',
    mobileFile: 'src/screens/TabletEditorPanel.tsx',
    surface: 'Tablet editor panel',
  },
  {
    assertions: ['panel widths, swipe gesture checks, click navigation'],
    contracts: ['desktopPanelParity'],
    desktopSource: 'Desktop four-panel workspace shell',
    mobileFile: 'src/screens/TabletWorkspace.tsx',
    surface: 'Tablet workspace shell',
  },
] as const satisfies MobileParityInventoryEntry[]
