import { useCallback, useState } from 'react'
import { Dimensions, Platform, StyleSheet, useWindowDimensions, View } from 'react-native'
import { MobileNoteListPanel } from '../components/workspace/MobileNoteListPanel'
import { MobilePropertiesPanel } from '../components/workspace/MobilePropertiesPanel'
import { MobileSyncStatusBar } from '../components/workspace/MobileSyncStatusBar'
import { MobileWorkspaceActionSheet, type MobileWorkspaceAction } from '../components/workspace/MobileWorkspaceActionSheet'
import { MobileWorkspaceSidebar } from '../components/workspace/MobileWorkspaceSidebar'
import type { MobileWorkspaceSnapshot } from '../workspace/mobileWorkspaceModel'
import { applyMobileWorkspaceEdit, type MobileWorkspaceEdit } from '../workspace/mobileWorkspaceEditing'
import { mobileColors } from '../ui/tokens'
import { useHorizontalSwipe } from '../ui/useHorizontalSwipe'
import { TabletEditorPanel } from './TabletEditorPanel'
import { useTabletWorkspaceNavigation } from './tabletWorkspaceNavigation'
import type { TabletPanel, TabletReadOnlyForm, TabletWorkspaceChromeProps } from './tabletWorkspaceTypes'

const emptyReadOnlyForm: TabletReadOnlyForm = {
  createTitle: '',
  propertyName: '',
  propertyValue: '',
  relationshipName: '',
  relationshipNoteTitle: '',
}

export function TabletWorkspace({
  layoutProbe = false,
  snapshot,
}: {
  layoutProbe?: boolean
  snapshot: MobileWorkspaceSnapshot
}) {
  const { height, width } = useWindowDimensions()
  const [workspaceSnapshot, setWorkspaceSnapshot] = useState(snapshot)
  const [openAction, setOpenAction] = useState<MobileWorkspaceAction | null>(null)
  const [readOnlyForm, setReadOnlyForm] = useState<TabletReadOnlyForm>(emptyReadOnlyForm)
  const [searchQuery, setSearchQuery] = useState('')
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
  } = useTabletWorkspaceNavigation(workspaceSnapshot, searchQuery)
  const screen = Dimensions.get('screen')
  const nativeIpad = Platform.OS === 'ios' && Platform.isPad
  const effectiveTabletWidth = nativeIpad ? Math.max(width, height, screen.width, screen.height) : width
  const compactTablet = !nativeIpad && width < 1080 && width < height && screen.width < screen.height
  const defaultPropertiesVisible = nativeIpad ? effectiveTabletWidth >= 1200 : true
  const updateReadOnlyForm = useCallback(<Key extends keyof TabletReadOnlyForm,>(key: Key, value: TabletReadOnlyForm[Key]) => {
    setReadOnlyForm((current) => ({ ...current, [key]: value }))
  }, [])
  const resetForm = useCallback(() => setReadOnlyForm(emptyReadOnlyForm), [])
  const closeAction = useCallback(() => {
    setOpenAction(null)
    resetForm()
  }, [resetForm])
  const applyEdit = useCallback((edit: MobileWorkspaceEdit) => {
    setWorkspaceSnapshot((current) => {
      const next = applyMobileWorkspaceEdit(current, edit)
      if (next.selectedNoteId) setSelectedNoteId(next.selectedNoteId)
      return next
    })
  }, [setSelectedNoteId])
  const toggleFavorite = useCallback(() => {
    if (selectedNote) applyEdit({ noteId: selectedNote.id, type: 'toggleFavorite' })
  }, [applyEdit, selectedNote])
  const createNote = useCallback(() => {
    applyEdit({ title: readOnlyForm.createTitle, type: 'createNote' })
    closeAction()
  }, [applyEdit, closeAction, readOnlyForm.createTitle])
  const saveProperty = useCallback(() => {
    if (!selectedNote) return
    applyEdit({
      key: readOnlyForm.propertyName,
      noteId: selectedNote.id,
      type: 'updateProperty',
      value: readOnlyForm.propertyValue,
    })
    closeAction()
  }, [applyEdit, closeAction, readOnlyForm.propertyName, readOnlyForm.propertyValue, selectedNote])
  const saveRelationship = useCallback(() => {
    if (!selectedNote) return
    applyEdit({
      key: readOnlyForm.relationshipName,
      noteId: selectedNote.id,
      targetTitle: readOnlyForm.relationshipNoteTitle,
      type: 'addRelationship',
    })
    closeAction()
  }, [applyEdit, closeAction, readOnlyForm.relationshipName, readOnlyForm.relationshipNoteTitle, selectedNote])

  return (
    <View style={styles.shellRoot}>
      <TabletWorkspaceChrome
        activeFolderId={activeFolderId}
        activeItemId={activeItemId}
        compactTablet={compactTablet}
        defaultPropertiesVisible={defaultPropertiesVisible}
        editorBlocks={editorBlocks}
        editorBullets={editorBullets}
        layoutProbe={layoutProbe}
        noteListSubtitle={noteListSubtitle}
        noteListTitle={noteListTitle}
        notes={notes}
        openAction={openAction}
        readOnlyForm={readOnlyForm}
        searchQuery={searchQuery}
        selectedNote={selectedNote}
        selectedNoteId={selectedNoteId}
        snapshot={workspaceSnapshot}
        onAddProperty={() => setOpenAction('addProperty')}
        onAddRelationship={() => setOpenAction('addRelationship')}
        onCloseAction={closeAction}
        onCreateNote={createNote}
        onCreateTitleChange={(value) => updateReadOnlyForm('createTitle', value)}
        onDeleteProperty={(noteId, key) => applyEdit({ key, noteId, type: 'deleteProperty' })}
        onOpenCreateNote={() => setOpenAction('createNote')}
        onOpenMoreActions={() => setOpenAction('moreActions')}
        onOpenSearch={() => setOpenAction('search')}
        onPropertyNameChange={(value) => updateReadOnlyForm('propertyName', value)}
        onPropertyValueChange={(value) => updateReadOnlyForm('propertyValue', value)}
        onRemoveRelationship={(noteId, key, ref) => applyEdit({ key, noteId, ref, type: 'removeRelationship' })}
        onSaveProperty={saveProperty}
        onSaveRelationship={saveRelationship}
        onRelationshipNameChange={(value) => updateReadOnlyForm('relationshipName', value)}
        onRelationshipNoteTitleChange={(value) => updateReadOnlyForm('relationshipNoteTitle', value)}
        onSearchQueryChange={setSearchQuery}
        onSelectFolder={selectFolder}
        onSelectNote={setSelectedNoteId}
        onSelectSidebarItem={selectSidebarItem}
        onToggleFavorite={toggleFavorite}
        onUpdateNoteContent={(noteId, content) => applyEdit({ content, noteId, type: 'updateNoteContent' })}
        onUpdateNoteTitle={(noteId, title) => applyEdit({ noteId, title, type: 'renameNoteTitle' })}
        onUpdateProperty={(noteId, key, value) => applyEdit({ key, noteId, type: 'updateProperty', value })}
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
    layoutProbe,
    noteListSubtitle,
    noteListTitle,
    notes,
    onAddProperty,
    onAddRelationship,
    onCloseAction,
    onCreateNote,
    onCreateTitleChange,
    onDeleteProperty,
    onOpenCreateNote,
    onOpenMoreActions,
    onOpenSearch,
    onPropertyNameChange,
    onPropertyValueChange,
    onRelationshipNameChange,
    onRelationshipNoteTitleChange,
    onRemoveRelationship,
    onSaveProperty,
    onSaveRelationship,
    onSearchQueryChange,
    onSelectFolder,
    onSelectNote,
    onSelectSidebarItem,
    onToggleFavorite,
    onUpdateNoteContent,
    onUpdateNoteTitle,
    onUpdateProperty,
    openAction,
    readOnlyForm,
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
            layoutProbe={layoutProbe}
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
            searchQuery={searchQuery || undefined}
            selectedNoteId={selectedNoteId}
            subtitle={noteListSubtitle}
            title={noteListTitle}
            onOpenCreateNote={onOpenCreateNote}
            onOpenSearch={onOpenSearch}
            onSelectNote={onSelectNote}
          />
        </View>
      ) : <SwipeRail edge="left" swipeHandlers={gestures.noteListRevealSwipe} />}
      <TabletEditorPanel
        blocks={editorBlocks}
        bullets={editorBullets}
        compact={compactTablet}
        note={selectedNote}
        notes={snapshot.notes}
        onOpenMoreActions={onOpenMoreActions}
        onToggleFavorite={onToggleFavorite}
        onUpdateContent={onUpdateNoteContent}
        onUpdateTitle={onUpdateNoteTitle}
      />
      {gestures.propertiesVisible ? (
        <View {...gestures.propertiesSwipe} style={styles.panelHost}>
          <MobilePropertiesPanel
            compact={compactTablet}
            note={selectedNote}
            onAddProperty={onAddProperty}
            onAddRelationship={onAddRelationship}
            onDeleteProperty={onDeleteProperty}
            onRemoveRelationship={onRemoveRelationship}
            onUpdateProperty={onUpdateProperty}
          />
        </View>
      ) : <SwipeRail edge="right" swipeHandlers={gestures.propertiesRevealSwipe} />}
      {openAction ? (
        <MobileWorkspaceActionSheet
          action={openAction}
          createTitle={readOnlyForm.createTitle}
          notes={notes}
          propertyName={readOnlyForm.propertyName}
          propertyValue={readOnlyForm.propertyValue}
          relationshipName={readOnlyForm.relationshipName}
          relationshipNoteTitle={readOnlyForm.relationshipNoteTitle}
          searchQuery={searchQuery}
          selectedNote={selectedNote}
          onClose={onCloseAction}
          onCreateNote={onCreateNote}
          onCreateTitleChange={onCreateTitleChange}
          onPropertyNameChange={onPropertyNameChange}
          onPropertyValueChange={onPropertyValueChange}
          onRelationshipNameChange={onRelationshipNameChange}
          onRelationshipNoteTitleChange={onRelationshipNoteTitleChange}
          onSaveProperty={onSaveProperty}
          onSaveRelationship={onSaveRelationship}
          onSearchQueryChange={onSearchQueryChange}
          onSelectNote={onSelectNote}
        />
      ) : null}
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
  const [panelOverrides, setPanelOverrides] = useState<Partial<Record<TabletPanel, boolean>>>({})
  const setPanelVisibility = useCallback((panel: TabletPanel, visible: boolean) => {
    setPanelOverrides((current) => current[panel] === visible ? current : { ...current, [panel]: visible })
  }, [])

  return {
    hidePanel: useCallback((panel: TabletPanel) => setPanelVisibility(panel, false), [setPanelVisibility]),
    noteListVisible: panelOverrides.noteList ?? true,
    propertiesVisible: panelOverrides.properties ?? defaultPropertiesVisible,
    showPanel: useCallback((panel: TabletPanel) => setPanelVisibility(panel, true), [setPanelVisibility]),
    sidebarVisible: panelOverrides.sidebar ?? true,
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
