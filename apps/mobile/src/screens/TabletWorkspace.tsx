import { useCallback, useMemo, useState } from 'react'
import { Dimensions, Platform, StyleSheet, useWindowDimensions, View } from 'react-native'
import { MobileNoteListPanel } from '../components/workspace/MobileNoteListPanel'
import { MobilePropertiesPanel } from '../components/workspace/MobilePropertiesPanel'
import { MobileSyncStatusBar } from '../components/workspace/MobileSyncStatusBar'
import {
  MobileWorkspaceSidebar,
  type MobileSidebarFolderSelection,
  type MobileSidebarItemSelection,
} from '../components/workspace/MobileWorkspaceSidebar'
import type { MobileEditorBlock, MobileNote, MobileWorkspaceSnapshot } from '../workspace/mobileWorkspaceModel'
import { mobileColors } from '../ui/tokens'
import { useHorizontalSwipe } from '../ui/useHorizontalSwipe'
import { TabletEditorPanel } from './TabletEditorPanel'

type TabletPanel = 'noteList' | 'properties' | 'sidebar'
type TabletSidebarSelection =
  | { count?: string; id: string; kind: 'item'; label: string; sectionId: string }
  | { id: string; kind: 'folder'; label: string }
type TabletWorkspaceChromeProps = {
  activeFolderId: string | null
  activeItemId: string | null
  compactTablet: boolean
  defaultPropertiesVisible: boolean
  editorBlocks: MobileEditorBlock[]
  editorBullets: string[]
  noteListSubtitle: string
  noteListTitle: string
  notes: MobileNote[]
  onSelectFolder: (selection: MobileSidebarFolderSelection) => void
  onSelectNote: (noteId: string) => void
  onSelectSidebarItem: (selection: MobileSidebarItemSelection) => void
  searchQuery?: string
  selectedNote: MobileNote | null
  selectedNoteId: string | null
  snapshot: MobileWorkspaceSnapshot
}

export function TabletWorkspace({
  snapshot,
}: {
  snapshot: MobileWorkspaceSnapshot
}) {
  const { height, width } = useWindowDimensions()
  const {
    activeFolderId,
    activeItemId,
    editorBlocks,
    editorBullets,
    noteListSubtitle,
    noteListTitle,
    notes,
    selectFolder,
    selectedNote,
    selectedNoteId,
    selectSidebarItem,
    setSelectedNoteId,
  } = useTabletWorkspaceNavigation(snapshot)
  const screen = Dimensions.get('screen')
  const nativeIpad = Platform.OS === 'ios' && Platform.isPad
  const compactTablet = !nativeIpad && width < 1080 && width < height && screen.width < screen.height
  const defaultPropertiesVisible = !nativeIpad || width >= 1200

  return (
    <View style={styles.shellRoot}>
      <TabletWorkspaceChrome
        activeFolderId={activeFolderId}
        activeItemId={activeItemId}
        compactTablet={compactTablet}
        defaultPropertiesVisible={defaultPropertiesVisible}
        editorBlocks={editorBlocks}
        editorBullets={editorBullets}
        noteListSubtitle={noteListSubtitle}
        noteListTitle={noteListTitle}
        notes={notes}
        searchQuery={snapshot.searchQuery}
        selectedNote={selectedNote}
        selectedNoteId={selectedNoteId}
        snapshot={snapshot}
        onSelectFolder={selectFolder}
        onSelectNote={setSelectedNoteId}
        onSelectSidebarItem={selectSidebarItem}
      />
      <MobileSyncStatusBar sync={snapshot.sync} />
    </View>
  )
}

function TabletWorkspaceChrome(props: TabletWorkspaceChromeProps) {
  const {
    activeFolderId,
    activeItemId,
    compactTablet,
    defaultPropertiesVisible,
    editorBlocks,
    editorBullets,
    noteListSubtitle,
    noteListTitle,
    notes,
    onSelectFolder,
    onSelectNote,
    onSelectSidebarItem,
    searchQuery,
    selectedNote,
    selectedNoteId,
    snapshot,
  } = props
  const gestures = useTabletPanelGestures(compactTablet, defaultPropertiesVisible)

  return (
    <View style={styles.shell}>
      {gestures.showSidebar ? (
        <View {...gestures.sidebarSwipe} style={styles.panelHost}>
          <MobileWorkspaceSidebar
            activeFolderId={activeFolderId}
            activeItemId={activeItemId}
            sections={snapshot.sidebarSections}
            title={snapshot.source?.label}
            onSelectFolder={onSelectFolder}
            onSelectItem={onSelectSidebarItem}
          />
        </View>
      ) : <SwipeRail edge="left" swipeHandlers={gestures.sidebarRevealSwipe} />}
      {gestures.noteListVisible ? (
        <View {...gestures.noteListSwipe} style={styles.panelHost}>
          <MobileNoteListPanel
            compact={compactTablet}
            notes={notes}
            searchQuery={searchQuery}
            selectedNoteId={selectedNoteId}
            subtitle={noteListSubtitle}
            title={noteListTitle}
            onSelectNote={onSelectNote}
          />
        </View>
      ) : <SwipeRail edge="left" swipeHandlers={gestures.noteListRevealSwipe} />}
      <TabletEditorPanel blocks={editorBlocks} compact={compactTablet} note={selectedNote} bullets={editorBullets} />
      {gestures.propertiesVisible ? (
        <View {...gestures.propertiesSwipe} style={styles.panelHost}>
          <MobilePropertiesPanel compact={compactTablet} note={selectedNote} />
        </View>
      ) : <SwipeRail edge="right" swipeHandlers={gestures.propertiesRevealSwipe} />}
    </View>
  )
}

function SwipeRail({
  edge,
  swipeHandlers,
}: {
  edge: 'left' | 'right'
  swipeHandlers: ReturnType<typeof useHorizontalSwipe>
}) {
  return <View {...swipeHandlers} style={[styles.swipeRail, edge === 'right' ? styles.swipeRailRight : null]} />
}

function useTabletPanelVisibility(defaultPropertiesVisible: boolean) {
  const [visiblePanels, setVisiblePanels] = useState<Record<TabletPanel, boolean>>({
    noteList: true,
    properties: defaultPropertiesVisible,
    sidebar: true,
  })
  const setPanelVisibility = useCallback((panel: TabletPanel, visible: boolean) => {
    setVisiblePanels((current) => current[panel] === visible ? current : { ...current, [panel]: visible })
  }, [])

  return {
    hidePanel: useCallback((panel: TabletPanel) => setPanelVisibility(panel, false), [setPanelVisibility]),
    noteListVisible: visiblePanels.noteList,
    propertiesVisible: visiblePanels.properties,
    showPanel: useCallback((panel: TabletPanel) => setPanelVisibility(panel, true), [setPanelVisibility]),
    sidebarVisible: visiblePanels.sidebar,
  }
}

function useTabletPanelGestures(compactTablet: boolean, defaultPropertiesVisible: boolean) {
  const { hidePanel, noteListVisible, propertiesVisible, showPanel, sidebarVisible } = useTabletPanelVisibility(defaultPropertiesVisible)
  const showSidebar = !compactTablet && sidebarVisible

  return {
    noteListRevealSwipe: useHorizontalSwipe({
      disabled: noteListVisible,
      onSwipeRight: () => showPanel('noteList'),
    }),
    noteListSwipe: useHorizontalSwipe({
      disabled: !noteListVisible,
      onSwipeLeft: () => hidePanel('noteList'),
    }),
    noteListVisible,
    propertiesRevealSwipe: useHorizontalSwipe({
      disabled: propertiesVisible,
      onSwipeLeft: () => showPanel('properties'),
    }),
    propertiesSwipe: useHorizontalSwipe({
      disabled: !propertiesVisible,
      onSwipeRight: () => hidePanel('properties'),
    }),
    propertiesVisible,
    showSidebar,
    sidebarRevealSwipe: useHorizontalSwipe({
      disabled: showSidebar || compactTablet,
      onSwipeRight: () => showPanel('sidebar'),
    }),
    sidebarSwipe: useHorizontalSwipe({
      disabled: !showSidebar,
      onSwipeLeft: () => hidePanel('sidebar'),
    }),
  }
}

function useTabletWorkspaceNavigation(snapshot: MobileWorkspaceSnapshot) {
  const [sidebarSelection, setSidebarSelection] = useState<TabletSidebarSelection>(() => initialSidebarSelection(snapshot))
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(initialSelectedNoteId(snapshot))
  const notes = useMemo(() => notesForSidebarSelection(snapshot.notes, sidebarSelection), [sidebarSelection, snapshot.notes])
  const selectedNote = selectedMobileNote(notes, selectedNoteId)

  const selectSidebarSelection = useCallback((selection: TabletSidebarSelection) => {
    const nextNotes = notesForSidebarSelection(snapshot.notes, selection)
    setSidebarSelection(selection)
    setSelectedNoteId(nextNotes[0]?.id ?? null)
  }, [snapshot.notes])

  return {
    activeFolderId: sidebarSelection.kind === 'folder' ? sidebarSelection.id : null,
    activeItemId: sidebarSelection.kind === 'item' ? sidebarSelection.id : null,
    editorBlocks: selectedNote?.editorBlocks ?? snapshot.editorBlocks,
    editorBullets: selectedNote?.editorBullets ?? snapshot.editorBullets,
    noteListSubtitle: noteListSubtitle(sidebarSelection, snapshot.noteListSubtitle, notes.length),
    noteListTitle: sidebarSelection.label,
    notes,
    selectFolder: useCallback((selection: MobileSidebarFolderSelection) => {
      selectSidebarSelection({
        id: selection.id,
        kind: 'folder',
        label: selection.name,
      })
    }, [selectSidebarSelection]),
    selectSidebarItem: useCallback((selection: MobileSidebarItemSelection) => {
      selectSidebarSelection({
        count: selection.count,
        id: selection.id,
        kind: 'item',
        label: selection.label,
        sectionId: selection.sectionId,
      })
    }, [selectSidebarSelection]),
    selectedNote,
    selectedNoteId: selectedNote?.id ?? selectedNoteId,
    setSelectedNoteId,
  }
}

function initialSelectedNoteId(snapshot: MobileWorkspaceSnapshot) {
  return snapshot.selectedNoteId ?? snapshot.notes[0]?.id ?? null
}

function initialSidebarSelection(snapshot: MobileWorkspaceSnapshot): TabletSidebarSelection {
  const primaryItem = snapshot.sidebarSections
    .find((section) => section.id === 'primary')
    ?.items
    ?.find((item) => item.active)

  return {
    count: primaryItem?.count,
    id: primaryItem?.id ?? 'inbox',
    kind: 'item',
    label: primaryItem?.label ?? 'Inbox',
    sectionId: 'primary',
  }
}

function notesForSidebarSelection(notes: MobileNote[], selection: TabletSidebarSelection) {
  if (selection.kind === 'folder') return notes.filter((note) => noteBelongsToFolder(note, selection.label))
  if (selection.sectionId === 'favorites') return notes.filter((note) => note.favorite || note.title === selection.label)
  if (selection.sectionId === 'types') return notes.filter((note) => noteMatchesType(note, selection))
  if (selection.id === 'archive') return notes.filter((note) => note.archived)
  if (selection.id === 'all-notes') return notes.filter((note) => !note.archived)
  if (selection.id === 'inbox') return inboxNotes(notes)

  return notes
}

function inboxNotes(notes: MobileNote[]) {
  const filteredNotes = notes.filter((note) => !note.archived && !note.organized)
  return filteredNotes.length > 0 ? filteredNotes : notes
}

function noteBelongsToFolder(note: MobileNote, folderName: string) {
  return (note.path ?? '').split('/').slice(0, -1).some((segment) => normalizedLabel(segment) === normalizedLabel(folderName))
}

function noteMatchesType(note: MobileNote, selection: Extract<TabletSidebarSelection, { kind: 'item' }>) {
  return normalizedLabel(selection.id) === normalizedLabel(`type-${note.type}`)
    || normalizedLabel(selection.label).replace(/s$/, '') === normalizedLabel(note.type)
}

function normalizedLabel(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function noteListSubtitle(selection: TabletSidebarSelection, inboxSubtitle: string, noteCount: number) {
  if (selection.kind !== 'item') return noteCount.toLocaleString()
  if (selection.id === 'inbox') return inboxSubtitle

  return selection.count ?? noteCount.toLocaleString()
}

function selectedMobileNote(notes: MobileNote[], selectedNoteId: string | null) {
  return notes.find((note) => note.id === selectedNoteId) ?? notes[0] ?? null
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: mobileColors.app,
  },
  shellRoot: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: mobileColors.app,
  },
  panelHost: {
    alignSelf: 'stretch',
    height: '100%',
  },
  swipeRail: {
    width: 18,
    backgroundColor: mobileColors.card,
    borderRightColor: mobileColors.border,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  swipeRailRight: {
    borderLeftColor: mobileColors.border,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: 0,
  },
})
