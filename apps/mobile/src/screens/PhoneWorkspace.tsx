import { useCallback, useState, type ReactNode } from 'react'
import {
  CaretLeft,
  Info,
  List,
} from 'phosphor-react-native'
import { StyleSheet, useWindowDimensions, View } from 'react-native'
import { Text } from '../components/ui/text'
import { MobileNoteListPanel } from '../components/workspace/MobileNoteListPanel'
import { MobilePropertiesPanel } from '../components/workspace/MobilePropertiesPanel'
import { MobileSyncStatusBar } from '../components/workspace/MobileSyncStatusBar'
import { MobileWorkspaceSidebar } from '../components/workspace/MobileWorkspaceSidebar'
import { mobileText } from '../i18n/mobileText'
import { MobileIconButton } from '../ui/MobileIconButton'
import { mobileColors, mobileSpace } from '../ui/tokens'
import { useHorizontalSwipe } from '../ui/useHorizontalSwipe'
import { mobileNoteIdForWikilinkTarget } from '../workspace/mobileWikilinks'
import type { MobileNote, MobileWorkspaceSnapshot } from '../workspace/mobileWorkspaceModel'
import {
  fixtureReadOnlyWorkspaceRepository,
  type ReadOnlyWorkspaceRepository,
  type ReadOnlyWorkspaceRequest,
} from '../workspace/readOnlyWorkspaceRepository'
import { TabletEditorPanel } from './TabletEditorPanel'
import { WorkspaceActionSheetHost } from './TabletWorkspace'
import { useTabletWorkspaceController } from './useTabletWorkspaceController'

export type PhoneWorkspaceState = 'editor' | 'list' | 'properties' | 'sidebar'

export function PhoneWorkspace({
  initialEditorEditing = false,
  initialState = 'list',
  repository = fixtureReadOnlyWorkspaceRepository,
  repositoryRequest,
  snapshot,
}: {
  initialEditorEditing?: boolean
  initialState?: PhoneWorkspaceState
  repository?: ReadOnlyWorkspaceRepository
  repositoryRequest?: ReadOnlyWorkspaceRequest
  snapshot: MobileWorkspaceSnapshot
}) {
  const controller = useTabletWorkspaceController({ repository, repositoryRequest, snapshot })
  const [phoneState, setPhoneState] = useState(initialState)
  const openList = useCallback(() => setPhoneState('list'), [])
  const openSidebar = useCallback(() => setPhoneState('sidebar'), [])
  const openProperties = useCallback(() => setPhoneState('properties'), [])
  const openEditor = useCallback((noteId?: string) => {
    if (noteId) controller.onSelectNote(noteId)
    setPhoneState('editor')
  }, [controller])
  const suggestionNotes = controller.snapshot.allNotes ?? controller.snapshot.notes

  return (
    <View style={styles.root}>
      <PhoneWorkspaceStateView
        controller={controller}
        initialEditorEditing={initialEditorEditing}
        openEditor={openEditor}
        openList={openList}
        openProperties={openProperties}
        openSidebar={openSidebar}
        phoneState={phoneState}
        suggestionNotes={suggestionNotes}
      />
      <WorkspaceActionSheetHost
        {...controller}
        compactTablet
        defaultPropertiesVisible={false}
        initialEditorEditing={initialEditorEditing}
        layoutProbe={false}
        suggestionNotes={suggestionNotes}
      />
      <MobileSyncStatusBar sync={controller.snapshot.sync} />
    </View>
  )
}

type PhoneWorkspaceController = ReturnType<typeof useTabletWorkspaceController>
type PhoneWorkspaceStateViewProps = {
  controller: PhoneWorkspaceController
  initialEditorEditing: boolean
  openEditor: (noteId?: string) => void
  openList: () => void
  openProperties: () => void
  openSidebar: () => void
  phoneState: PhoneWorkspaceState
  suggestionNotes: MobileNote[]
}

function PhoneWorkspaceStateView(props: PhoneWorkspaceStateViewProps) {
  if (props.phoneState === 'sidebar') return <PhoneSidebarDrawer {...props} />
  if (props.phoneState === 'properties') return <PhonePropertiesScreen {...props} />
  if (props.phoneState === 'editor' && props.controller.selectedNote) return <PhoneEditorScreen {...props} />
  return <PhoneNoteListScreen {...props} />
}

function PhoneNoteListScreen({
  controller,
  openEditor,
  openSidebar,
}: PhoneWorkspaceStateViewProps) {
  const swipeHandlers = useHorizontalSwipe({ onSwipeRight: openSidebar })

  return (
    <View {...swipeHandlers} style={styles.screen} testID="phone-note-list-screen">
      <MobileNoteListPanel
        compact
        displayPropertyKeys={controller.noteListProperties}
        fullWidth
        leading={(
          <MobileIconButton accessibilityLabel={mobileText('sidebar.action.expand')} testID="phone-sidebar-action" onPress={openSidebar}>
            <List color={mobileColors.textMuted} size={18} />
          </MobileIconButton>
        )}
        notes={controller.notes}
        searchQuery={controller.searchQuery || undefined}
        selectedNoteId={controller.selectedNoteId}
        subtitle={controller.noteListSubtitle}
        title={controller.noteListTitle}
        onOpenCreateNote={controller.onOpenCreateNote}
        onOpenSearch={controller.onOpenSearch}
        onSelectNote={openEditor}
      />
    </View>
  )
}

function PhoneSidebarDrawer({
  controller,
  openEditor,
  openList,
}: PhoneWorkspaceStateViewProps) {
  const { width } = useWindowDimensions()
  const drawerWidth = Math.min(320, Math.round(width * 0.78))
  const swipeHandlers = useHorizontalSwipe({ onSwipeLeft: openList })
  const selectFolder = useSelectAndOpenList(controller.onSelectFolder, openList)
  const selectItem = useSelectAndOpenList(controller.onSelectSidebarItem, openList)

  return (
    <View {...swipeHandlers} style={styles.drawerRoot} testID="phone-sidebar-screen">
      <View pointerEvents="none" style={[styles.drawerPreview, { left: drawerWidth, width }]}>
        <MobileNoteListPanel
          compact
          displayPropertyKeys={controller.noteListProperties}
          fullWidth
          notes={controller.notes}
          selectedNoteId={controller.selectedNoteId}
          subtitle={controller.noteListSubtitle}
          title={controller.noteListTitle}
          onOpenCreateNote={controller.onOpenCreateNote}
          onOpenSearch={controller.onOpenSearch}
          onSelectNote={openEditor}
        />
      </View>
      <View style={[styles.drawerPanel, { width: drawerWidth }]}>
        <MobileWorkspaceSidebar
          activeFolderId={controller.activeFolderId}
          activeItemId={controller.activeItemId}
          sections={controller.snapshot.sidebarSections}
          title={controller.snapshot.source?.label}
          onCreateFolder={controller.onOpenCreateFolder}
          onCreateType={controller.onOpenCreateType}
          onCreateView={controller.onOpenCreateView}
          onOpenFolderActions={controller.onOpenFolderActions}
          onOpenTypeActions={controller.onOpenTypeActions}
          onOpenViewActions={controller.onOpenViewActions}
          onSelectFolder={selectFolder}
          onSelectItem={selectItem}
          onCollapse={openList}
        />
      </View>
    </View>
  )
}

function PhoneEditorScreen({
  controller,
  initialEditorEditing,
  openList,
  openProperties,
  suggestionNotes,
}: PhoneWorkspaceStateViewProps) {
  const swipeHandlers = useHorizontalSwipe({ onSwipeRight: openList })
  const handleNavigateWikilink = usePhoneWikilinkNavigation({ controller, suggestionNotes })

  return (
    <View {...swipeHandlers} style={styles.screen} testID="phone-editor-screen">
      <PhoneEditorTopBar
        title={controller.selectedNote?.title ?? ''}
        onBack={openList}
        onOpenProperties={openProperties}
      />
      <PhoneEditorBody
        controller={controller}
        initialEditorEditing={initialEditorEditing}
        notes={suggestionNotes}
        onNavigateWikilink={handleNavigateWikilink}
      />
    </View>
  )
}

function PhoneEditorTopBar({
  onBack,
  onOpenProperties,
  title,
}: {
  onBack: () => void
  onOpenProperties: () => void
  title: string
}) {
  return (
    <PhoneTopBar title={title} onBack={onBack}>
      <MobileIconButton
        accessibilityLabel={mobileText('inspector.title.properties')}
        testID="phone-properties-action"
        onPress={onOpenProperties}
      >
        <Info color={mobileColors.textMuted} size={18} />
      </MobileIconButton>
    </PhoneTopBar>
  )
}

function PhoneEditorBody({
  controller,
  initialEditorEditing,
  notes,
  onNavigateWikilink,
}: {
  controller: PhoneWorkspaceController
  initialEditorEditing: boolean
  notes: MobileNote[]
  onNavigateWikilink: (target: string) => void
}) {
  return (
    <TabletEditorPanel
      blocks={controller.editorBlocks}
      bullets={controller.editorBullets}
      compact
      initialEditing={initialEditorEditing}
      note={controller.selectedNote}
      notes={notes}
      onNavigateWikilink={onNavigateWikilink}
      onOpenMoreActions={controller.onOpenMoreActions}
      onToggleFavorite={controller.onToggleFavorite}
      onUpdateContent={controller.onUpdateNoteContent}
      onUpdateTitle={controller.onUpdateNoteTitle}
    />
  )
}

function PhonePropertiesScreen({
  controller,
  openEditor,
}: PhoneWorkspaceStateViewProps) {
  const returnToEditor = useCallback(() => openEditor(), [openEditor])
  const swipeHandlers = useHorizontalSwipe({ onSwipeRight: returnToEditor })

  return (
    <View {...swipeHandlers} style={styles.screen} testID="phone-properties-screen">
      <PhoneTopBar title={mobileText('inspector.title.properties')} onBack={returnToEditor} />
      <MobilePropertiesPanel
        compact
        fullWidth
        note={controller.selectedNote}
        typeDefinitions={controller.snapshot.typeDefinitions}
        onAddProperty={controller.onAddProperty}
        onAddRelationship={controller.onAddRelationship}
        onDeleteProperty={controller.onDeleteProperty}
        onEditProperty={controller.onEditProperty}
        onOpenChangeNoteType={controller.onOpenChangeNoteType}
        onRemoveRelationship={controller.onRemoveRelationship}
        onSelectNote={openEditor}
      />
    </View>
  )
}

function PhoneTopBar({
  children,
  onBack,
  title,
}: {
  children?: ReactNode
  onBack: () => void
  title: string
}) {
  return (
    <View style={styles.topBar} testID="phone-top-bar">
      <MobileIconButton accessibilityLabel={mobileText('command.navigation.goBack')} testID="phone-back-action" onPress={onBack}>
        <CaretLeft color={mobileColors.textMuted} size={18} />
      </MobileIconButton>
      <Text numberOfLines={1} style={styles.topBarTitle}>{title}</Text>
      <View style={styles.topBarActions}>{children}</View>
    </View>
  )
}

function usePhoneWikilinkNavigation({
  controller,
  suggestionNotes,
}: {
  controller: PhoneWorkspaceController
  suggestionNotes: MobileNote[]
}) {
  return useCallback((target: string) => {
    const noteId = mobileNoteIdForWikilinkTarget(suggestionNotes, target)
    if (!noteId) return

    controller.onSelectNote(noteId)
  }, [controller, suggestionNotes])
}

function useSelectAndOpenList<Selection>(
  select: (selection: Selection) => void,
  openList: () => void,
) {
  return useCallback((selection: Selection) => {
    select(selection)
    openList()
  }, [select, openList])
}

const styles = StyleSheet.create({
  drawerPanel: {
    flex: 1,
    backgroundColor: mobileColors.sidebar,
    borderRightColor: mobileColors.border,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  drawerPreview: {
    bottom: 0,
    opacity: 0.72,
    position: 'absolute',
    top: 0,
  },
  drawerRoot: {
    flex: 1,
    backgroundColor: mobileColors.sidebar,
    overflow: 'hidden',
  },
  root: {
    flex: 1,
    backgroundColor: mobileColors.app,
  },
  screen: {
    flex: 1,
    backgroundColor: mobileColors.app,
  },
  topBar: {
    minHeight: 44,
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.xs,
    borderBottomColor: mobileColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: mobileColors.card,
    paddingHorizontal: mobileSpace.sm,
  },
  topBarActions: {
    minWidth: 32,
    alignItems: 'flex-end',
  },
  topBarTitle: {
    flex: 1,
    color: mobileColors.text,
    fontSize: 13,
    fontWeight: '600',
  },
})
