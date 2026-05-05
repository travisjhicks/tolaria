import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FlatList,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import {
  CaretLeft,
  DotsThreeVertical,
  Info,
  List,
  MagnifyingGlass,
  PencilSimple,
  Robot,
  Star,
  Trash,
} from 'phosphor-react-native'
import { MobileNote, notes as fallbackNotes } from './demoData'
import {
  createDemoVaultNote,
  deleteDemoVaultNote,
  loadDemoVaultNotes,
  saveDemoVaultDraft,
  saveDemoVaultNoteFrontmatter,
} from './mobileDemoVault'
import { saveDemoVaultRawNote } from './mobileDemoVaultRawNote'
import { createMobileAutosaveQueue } from './mobileAutosaveQueue'
import type { MobileEditorDraft } from './mobileEditorDraft'
import {
  idleMobileEditorSaveState,
  type MobileEditorSaveState,
} from './mobileEditorSaveState'
import { applySavedMobileEditorDraft } from './mobileSavedDraftProjection'
import { MobileEditorAdapter } from './MobileEditorAdapter'
import { MobileRawEditor } from './MobileRawEditor'
import { MobileGitSyncStatusCard } from './MobileGitSyncStatusCard'
import {
  createCompactNavigationState,
  transitionCompactNavigation,
  type CompactNavigationEvent,
  type CompactPanel,
} from './compactNavigation'
import { NamedIcon, type IconName } from './NamedIcon'
import { SwipeSurface } from './SwipeSurface'
import { styles } from './styles'
import { colors } from './theme'
import { MobileEditorBreadcrumb } from './MobileEditorBreadcrumb'
import { MobilePropertiesPanel } from './MobilePropertiesPanel'
import { MobileAiPanel } from './MobileAiPanel'
import { MobileVaultManagementCard } from './MobileVaultManagementCard'
import { MobileVaultRemotePrompt } from './MobileVaultRemotePrompt'
import { useMobileNoteCreateFlow } from './useMobileNoteCreateFlow'
import { useMobileNoteDeleteFlow } from './useMobileNoteDeleteFlow'
import { useMobileNotePropertiesFlow } from './useMobileNotePropertiesFlow'
import { useMobileVaultRemoteSetupFlow } from './useMobileVaultRemoteSetupFlow'
import { createNativeMobileAppStateStorage } from './mobileNativeAppStateStorage'
import { createNativeMobileVaultMetadataStorage } from './mobileNativeVaultMetadataStorage'
import { createNativeMobileGitCredentialStorage } from './mobileNativeGitCredentialStorage'
import {
  createNativeMobileGitHubOAuthSessionFromEnvironment,
  currentMobileGitHubOAuthClientIdState,
} from './mobileGitHubOAuthEnvironment'
import type { MobileGitSyncPlan } from './mobileGitSyncPlan'
import { defaultMobileVaultMetadata, type MobileVaultMetadata } from './mobileVaultMetadata'
import type { MobileVaultRuntime } from './mobileVaultRuntime'
import { useMobileVaultRuntimeLoader } from './useMobileVaultRuntimeLoader'
import type { MobileNotePropertyPatch } from './mobileNoteProperties'
import { useMobileGitSyncFlow } from './useMobileGitSyncFlow'
import { createNativeMobileGitTransport } from './mobileNativeGitTransport'
import { loadExpoMobileGitNativeModule } from './mobileExpoNativeGitModule'
import { applyMobileRawNoteContent } from './mobileRawNoteProjection'
import {
  createMobileSidebarSections,
  defaultMobileSidebarSelection,
  filterNotesForSidebarSelection,
  isMobileSidebarSelectionActive,
  mobileSidebarTitle,
  type MobileSidebarSelection,
} from './mobileSidebarNavigation'
import { mobileTypeAppearance } from './mobileTypeAppearance'

export function MobileApp() {
  const { width } = useWindowDimensions()
  const isTablet = width >= 820
  const showsProperties = width >= 1000
  const appStateStorage = useMemo(() => createNativeMobileAppStateStorage(), [])
  const gitCredentialStorage = useMemo(() => createNativeMobileGitCredentialStorage(), [])
  const gitTransport = useMemo(() => createNativeMobileGitTransport(loadExpoMobileGitNativeModule()), [])
  const gitHubOAuthClientIdState = useMemo(() => currentMobileGitHubOAuthClientIdState(), [])
  const vaultMetadataStorage = useMemo(() => createNativeMobileVaultMetadataStorage(), [])
  const [activeVaultMetadata, setActiveVaultMetadata] = useState(defaultMobileVaultMetadata)
  const [availableNotes, setAvailableNotes] = useState(fallbackNotes)
  const [compactNavigation, setCompactNavigation] = useState(() => createCompactNavigationState(fallbackNotes[0].id))
  const [editorModeByNoteId, setEditorModeByNoteId] = useState<Record<string, 'raw' | 'rich'>>({})
  const [rightPanel, setRightPanel] = useState<'ai' | 'properties'>('properties')
  const [sidebarSelection, setSidebarSelection] = useState<MobileSidebarSelection>(defaultMobileSidebarSelection)
  const [saveStateByNoteId, setSaveStateByNoteId] = useState<Record<string, MobileEditorSaveState>>({})
  const sidebarSections = useMemo(() => createMobileSidebarSections(availableNotes), [availableNotes])
  const visibleNotes = useMemo(
    () => filterNotesForSidebarSelection({ notes: availableNotes, selection: sidebarSelection }),
    [availableNotes, sidebarSelection],
  )
  const listTitle = useMemo(() => mobileSidebarTitle(sidebarSelection), [sidebarSelection])
  const selectedNote = useMemo(
    () => availableNotes.find((note) => note.id === compactNavigation.selectedNoteId) ?? availableNotes[0],
    [availableNotes, compactNavigation.selectedNoteId],
  )
  const selectedEditorMode = editorModeByNoteId[selectedNote.id] ?? 'rich'
  const selectedSaveState = saveStateByNoteId[selectedNote.id] ?? idleMobileEditorSaveState
  const gitSyncFlow = useMobileGitSyncFlow({
    createGitHubOAuthSession: createNativeMobileGitHubOAuthSessionFromEnvironment,
    credentialStorage: gitCredentialStorage,
    gitTransport,
    vault: activeVaultMetadata,
  })
  const autosaveQueue = useMemo(
    () =>
      createMobileAutosaveQueue({
        delayMs: 700,
        saveDraft: (draft) => saveDemoVaultDraft(draft, activeVaultMetadata),
        onStateChange: (noteId, saveState) => {
          setSaveStateByNoteId((state) => ({ ...state, [noteId]: saveState }))
        },
        onSavedDraft: (draft) => {
          setAvailableNotes((notes) => applySavedMobileEditorDraft({ draft, notes }))
        },
      }),
    [activeVaultMetadata],
  )

  const applyLoadedVaultRuntime = useCallback(({ activeVault, notes, selectedNoteId }: MobileVaultRuntime) => {
    setActiveVaultMetadata(activeVault)
    setAvailableNotes(notes)
    setCompactNavigation((state) => selectLoadedNote(state, notes, selectedNoteId))
  }, [])

  const runtimeLoader = useMobileVaultRuntimeLoader({
    appStateStorage,
    loadNotes: loadDemoVaultNotes,
    metadataStorage: vaultMetadataStorage,
    onLoaded: applyLoadedVaultRuntime,
  })
  const remoteSetupFlow = useMobileVaultRemoteSetupFlow({
    activeVault: activeVaultMetadata,
    metadataStorage: vaultMetadataStorage,
    onActiveVaultChanged: setActiveVaultMetadata,
  })

  useEffect(() => () => autosaveQueue.cancelAll(), [autosaveQueue])

  const selectNoteId = useCallback((noteId: string) => {
    setCompactNavigation((state) => transitionCompactNavigation(state, { type: 'selectNote', noteId }))
    void appStateStorage.save({ activeVaultId: activeVaultMetadata.id, selectedNoteId: noteId }).catch(() => {})
  }, [activeVaultMetadata.id, appStateStorage])
  const selectNote = useCallback((note: MobileNote) => selectNoteId(note.id), [selectNoteId])
  const selectSidebar = useCallback((selection: MobileSidebarSelection) => {
    setSidebarSelection(selection)

    const nextNotes = filterNotesForSidebarSelection({ notes: availableNotes, selection })
    if (nextNotes.length > 0 && !nextNotes.some((note) => note.id === selectedNote.id)) {
      selectNoteId(nextNotes[0].id)
    }
  }, [availableNotes, selectNoteId, selectedNote.id])
  const toggleEditorMode = useCallback(() => {
    setEditorModeByNoteId((state) => ({
      ...state,
      [selectedNote.id]: selectedEditorMode === 'raw' ? 'rich' : 'raw',
    }))
  }, [selectedEditorMode, selectedNote.id])
  const saveDraft = useCallback((draft: MobileEditorDraft) => autosaveQueue.enqueue(draft), [autosaveQueue])
  const saveRawMarkdown = useCallback((content: string) => {
    const noteId = selectedNote.id
    setSaveStateByNoteId((state) => ({ ...state, [noteId]: { label: 'Saving', state: 'saving' } }))
    setAvailableNotes((notes) => applyMobileRawNoteContent({ content, noteId, notes }))

    void saveDemoVaultRawNote({ content, noteId, vaultMetadata: activeVaultMetadata })
      .then((result) => {
        setSaveStateByNoteId((state) => ({
          ...state,
          [noteId]: result.status === 'saved'
            ? { label: 'Saved', state: 'saved' }
            : { label: 'Save failed', state: 'failed' },
        }))
      })
      .catch(() => {
        setSaveStateByNoteId((state) => ({ ...state, [noteId]: { label: 'Save failed', state: 'failed' } }))
      })
  }, [activeVaultMetadata, selectedNote.id])
  const deleteFlow = useMobileNoteDeleteFlow({
    deleteNote: (noteId) => deleteDemoVaultNote(noteId, activeVaultMetadata),
    loadNotes: () => loadDemoVaultNotes(activeVaultMetadata),
    notes: availableNotes,
    onNotesLoaded: setAvailableNotes,
    onSelectedNoteId: selectNoteId,
    selectedNoteId: selectedNote.id,
  })
  const createFlow = useMobileNoteCreateFlow({
    createNote: (title) => createDemoVaultNote({ title, vaultMetadata: activeVaultMetadata }),
    onCreated: (note) => {
      setAvailableNotes((notes) => [note, ...notes.filter((item) => item.id !== note.id)])
      selectNoteId(note.id)
    },
  })
  const propertiesFlow = useMobileNotePropertiesFlow({
    loadNotes: () => loadDemoVaultNotes(activeVaultMetadata),
    onNotesLoaded: setAvailableNotes,
    saveFrontmatter: (noteId, metadata) => saveDemoVaultNoteFrontmatter({
      metadata,
      noteId,
      vaultMetadata: activeVaultMetadata,
    }),
    selectedNote,
  })
  const toggleSelectedArchive = useCallback(() => {
    const archived = !selectedNote.archived
    setAvailableNotes((notes) => notes.map((note) => (note.id === selectedNote.id ? { ...note, archived } : note)))
    propertiesFlow.saveProperties({ archived })
  }, [propertiesFlow, selectedNote.archived, selectedNote.id])
  const toggleSelectedFavorite = useCallback(() => {
    const favorite = !selectedNote.favorite
    const favoriteIndex = favorite ? availableNotes.filter((note) => note.favorite).length : null
    setAvailableNotes((notes) => notes.map((note) => (note.id === selectedNote.id ? { ...note, favorite, favoriteIndex } : note)))
    propertiesFlow.saveProperties({ favorite, favoriteIndex })
  }, [availableNotes, propertiesFlow, selectedNote.favorite, selectedNote.id])

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        {isTablet ? (
          <View style={styles.tabletShell}>
            <SidebarPanel
              activeVault={activeVaultMetadata}
              activeSelection={sidebarSelection}
              sections={sidebarSections}
              onOpenRemoteSetup={remoteSetupFlow.open}
              onSelect={selectSidebar}
            />
            <NoteListPanel
              gitSyncPlan={gitSyncFlow.gitSyncPlan}
              listTitle={listTitle}
              notes={visibleNotes}
              selectedNoteId={compactNavigation.selectedNoteId}
              createNoteFailed={createFlow.failed}
              isCreatingNote={createFlow.isCreating}
              runtimeLoadFailed={runtimeLoader.failed}
              onCreateNote={createFlow.create}
              onGitSyncAction={gitSyncFlow.runPrimaryAction}
              onRetryRuntimeLoad={runtimeLoader.retry}
              onSelectNote={selectNote}
            />
            <EditorPanel
              editorMode={selectedEditorMode}
              notes={availableNotes}
              note={selectedNote}
              saveState={selectedSaveState}
              onDeleteNote={deleteFlow.canDelete ? deleteFlow.deleteSelectedNote : undefined}
              onDraftChange={saveDraft}
              onOpenAi={() => setRightPanel('ai')}
              onOpenProperties={() => setRightPanel('properties')}
              onRawMarkdownChange={saveRawMarkdown}
              onToggleArchive={toggleSelectedArchive}
              onToggleEditorMode={toggleEditorMode}
              onToggleFavorite={toggleSelectedFavorite}
            />
            {showsProperties && rightPanel === 'properties' ? (
              <MobilePropertiesPanel
                failed={propertiesFlow.failed}
                isSaving={propertiesFlow.isSaving}
                notes={availableNotes}
                note={selectedNote}
                onChangeProperties={propertiesFlow.saveProperties}
                onOpenNote={selectNoteId}
              />
            ) : null}
            {showsProperties && rightPanel === 'ai' ? <MobileAiPanel note={selectedNote} /> : null}
          </View>
        ) : (
          <CompactShell
            activePanel={compactNavigation.panel}
            activeVault={activeVaultMetadata}
            activeSidebarSelection={sidebarSelection}
            allNotes={availableNotes}
            editorMode={selectedEditorMode}
            note={selectedNote}
            gitSyncPlan={gitSyncFlow.gitSyncPlan}
            listTitle={listTitle}
            notes={visibleNotes}
            saveState={selectedSaveState}
            selectedNoteId={compactNavigation.selectedNoteId}
            sidebarSections={sidebarSections}
            onNavigate={(event) => setCompactNavigation((state) => transitionCompactNavigation(state, event))}
            onDeleteNote={deleteFlow.canDelete ? deleteFlow.deleteSelectedNote : undefined}
            onDraftChange={saveDraft}
            onRawMarkdownChange={saveRawMarkdown}
            onSelectSidebar={selectSidebar}
            onToggleArchive={toggleSelectedArchive}
            onToggleEditorMode={toggleEditorMode}
            onToggleFavorite={toggleSelectedFavorite}
            createNoteFailed={createFlow.failed}
            isCreatingNote={createFlow.isCreating}
            runtimeLoadFailed={runtimeLoader.failed}
            onCreateNote={createFlow.create}
            onGitSyncAction={gitSyncFlow.runPrimaryAction}
            onRetryRuntimeLoad={runtimeLoader.retry}
            onSelectNote={selectNote}
            propertiesFailed={propertiesFlow.failed}
            isSavingProperties={propertiesFlow.isSaving}
            onChangeProperties={propertiesFlow.saveProperties}
            onOpenRemoteSetup={remoteSetupFlow.open}
          />
        )}
        {remoteSetupFlow.isOpen ? (
          <MobileVaultRemotePrompt
            failed={remoteSetupFlow.failed}
            hasGitHubOAuthClientId={gitHubOAuthClientIdState.state === 'configured'}
            isSaving={remoteSetupFlow.isSaving}
            onCancel={remoteSetupFlow.cancel}
            onChangeRemoteUrl={remoteSetupFlow.setRemoteUrl}
            onSubmit={remoteSetupFlow.submit}
            remoteUrl={remoteSetupFlow.remoteUrl}
          />
        ) : null}
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

type CompactShellProps = {
  activePanel: CompactPanel
  activeVault: MobileVaultMetadata
  activeSidebarSelection: MobileSidebarSelection
  allNotes: MobileNote[]
  editorMode: 'raw' | 'rich'
  note: MobileNote
  gitSyncPlan: MobileGitSyncPlan
  listTitle: string
  notes: MobileNote[]
  saveState: MobileEditorSaveState
  sidebarSections: ReturnType<typeof createMobileSidebarSections>
  createNoteFailed: boolean
  isCreatingNote: boolean
  runtimeLoadFailed: boolean
  onNavigate: (event: CompactNavigationEvent) => void
  onDeleteNote?: () => void
  onDraftChange: (draft: MobileEditorDraft) => void
  onOpenAi?: () => void
  onRawMarkdownChange: (markdown: string) => void
  onCreateNote: () => void
  onGitSyncAction: () => void
  onChangeProperties: (patch: MobileNotePropertyPatch) => void
  onOpenRemoteSetup: () => void
  onRetryRuntimeLoad: () => void
  onSelectNote: (note: MobileNote) => void
  onSelectSidebar: (selection: MobileSidebarSelection) => void
  onToggleArchive: () => void
  onToggleEditorMode: () => void
  onToggleFavorite: () => void
  propertiesFailed: boolean
  isSavingProperties: boolean
  selectedNoteId: string
}

function CompactShell(props: CompactShellProps) {
  if (props.activePanel === 'sidebar') {
    return <CompactSidebarPanel {...props} />
  }

  if (props.activePanel === 'note') {
    return <CompactEditorPanel {...props} />
  }

  if (props.activePanel === 'properties') {
    return <CompactPropertiesPanel {...props} />
  }

  return <CompactNoteListPanel {...props} />
}

function CompactSidebarPanel(props: CompactShellProps) {
  return (
    <SwipeSurface panel="sidebar" onNavigate={props.onNavigate}>
      <SidebarPanel
        activeVault={props.activeVault}
        activeSelection={props.activeSidebarSelection}
        onClose={() => props.onNavigate({ type: 'closeSidebar' })}
        onOpenRemoteSetup={props.onOpenRemoteSetup}
        onSelect={(selection) => {
          props.onSelectSidebar(selection)
          props.onNavigate({ type: 'closeSidebar' })
        }}
        sections={props.sidebarSections}
      />
    </SwipeSurface>
  )
}

function CompactEditorPanel(props: CompactShellProps) {
  return (
    <SwipeSurface panel="note" onNavigate={props.onNavigate}>
      <EditorPanel
        editorMode={props.editorMode}
        notes={props.allNotes}
        note={props.note}
        saveState={props.saveState}
        onDeleteNote={props.onDeleteNote}
        onDraftChange={props.onDraftChange}
        onOpenAi={props.onOpenAi}
        onRawMarkdownChange={props.onRawMarkdownChange}
        onBack={() => props.onNavigate({ type: 'backToList' })}
        onOpenProperties={() => props.onNavigate({ type: 'openProperties' })}
        onToggleArchive={props.onToggleArchive}
        onToggleEditorMode={props.onToggleEditorMode}
        onToggleFavorite={props.onToggleFavorite}
      />
    </SwipeSurface>
  )
}

function CompactPropertiesPanel(props: CompactShellProps) {
  return (
    <SwipeSurface panel="properties" onNavigate={props.onNavigate}>
      <MobilePropertiesPanel
        failed={props.propertiesFailed}
        isSaving={props.isSavingProperties}
        notes={props.allNotes}
        note={props.note}
        onChangeProperties={props.onChangeProperties}
        onClose={() => props.onNavigate({ type: 'closeProperties' })}
        onOpenNote={(noteId) => openCompactRelationship({ noteId, props })}
      />
    </SwipeSurface>
  )
}

function CompactNoteListPanel(props: CompactShellProps) {
  return (
    <SwipeSurface panel="list" onNavigate={props.onNavigate}>
      <NoteListPanel
        gitSyncPlan={props.gitSyncPlan}
        listTitle={props.listTitle}
        notes={props.notes}
        selectedNoteId={props.selectedNoteId}
        createNoteFailed={props.createNoteFailed}
        isCreatingNote={props.isCreatingNote}
        runtimeLoadFailed={props.runtimeLoadFailed}
        onGitSyncAction={props.onGitSyncAction}
        onCreateNote={props.onCreateNote}
        onOpenSidebar={() => props.onNavigate({ type: 'openSidebar' })}
        onRetryRuntimeLoad={props.onRetryRuntimeLoad}
        onSelectNote={props.onSelectNote}
      />
    </SwipeSurface>
  )
}

function openCompactRelationship({
  noteId,
  props,
}: {
  noteId: string
  props: CompactShellProps
}) {
  props.onNavigate({ type: 'closeProperties' })
  props.onSelectNote(props.allNotes.find((item) => item.id === noteId) ?? props.note)
}

function SidebarPanel({
  activeVault,
  activeSelection,
  onClose,
  onOpenRemoteSetup,
  onSelect,
  sections,
}: {
  activeVault: MobileVaultMetadata
  activeSelection: MobileSidebarSelection
  onClose?: () => void
  onOpenRemoteSetup: () => void
  onSelect: (selection: MobileSidebarSelection) => void
  sections: ReturnType<typeof createMobileSidebarSections>
}) {
  return (
    <View style={styles.sidebar}>
      <Toolbar>
        {onClose ? <IconButton icon={<CaretLeft size={24} color={colors.textSoft} />} onPress={onClose} /> : null}
        <View style={styles.toolbarSpacer} />
      </Toolbar>
      <ScrollView contentContainerStyle={styles.sidebarContent}>
        <MobileVaultManagementCard vault={activeVault} onOpenRemoteSetup={onOpenRemoteSetup} />
        {sections.map((section) => (
          <View key={section.title} style={styles.sidebarSection}>
            <Text style={styles.sidebarSectionTitle}>{section.title}</Text>
            {section.items.map((item) => (
              <Pressable
                key={sidebarItemKey(item.selection)}
                onPress={() => onSelect(item.selection)}
                style={({ pressed }) => [
                  styles.sidebarItem,
                  isMobileSidebarSelectionActive({ candidate: item.selection, current: activeSelection })
                    ? styles.sidebarItemSelected
                    : null,
                  pressed ? styles.pressed : null,
                ]}
              >
                <NamedIcon
                  name={item.icon as IconName}
                  size={20}
                  color={isMobileSidebarSelectionActive({ candidate: item.selection, current: activeSelection }) ? colors.primary : colors.iconMuted}
                />
                <Text style={styles.sidebarItemText}>{item.label}</Text>
                {item.count > 0 ? <Text style={styles.sidebarCount}>{item.count}</Text> : null}
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

function sidebarItemKey(selection: MobileSidebarSelection) {
  if (selection.kind === 'type') return `type:${selection.type}`
  if (selection.kind === 'view') return `view:${selection.id}`
  return `library:${selection.id}`
}

function NoteListPanel({
  gitSyncPlan,
  listTitle,
  notes,
  createNoteFailed,
  isCreatingNote,
  runtimeLoadFailed,
  onGitSyncAction,
  onCreateNote,
  onOpenSidebar,
  onRetryRuntimeLoad,
  onSelectNote,
  selectedNoteId,
}: {
  gitSyncPlan: MobileGitSyncPlan
  listTitle: string
  notes: MobileNote[]
  createNoteFailed: boolean
  isCreatingNote: boolean
  runtimeLoadFailed: boolean
  onGitSyncAction: () => void
  onCreateNote: () => void
  onOpenSidebar?: () => void
  onRetryRuntimeLoad: () => void
  onSelectNote: (note: MobileNote) => void
  selectedNoteId: string
}) {
  return (
    <View style={styles.noteList}>
      <Toolbar>
        {onOpenSidebar ? <IconButton icon={<List size={25} color={colors.textSoft} />} onPress={onOpenSidebar} /> : null}
        <Text style={styles.listTitle}>{listTitle}</Text>
        <View style={styles.toolbarSpacer} />
        <IconButton icon={<MagnifyingGlass size={23} color={colors.textSoft} />} />
      </Toolbar>
      <MobileGitSyncStatusCard plan={gitSyncPlan} onPrimaryAction={onGitSyncAction} />
      {runtimeLoadFailed ? <VaultLoadErrorNotice onRetry={onRetryRuntimeLoad} /> : null}
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.noteListContent}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onSelectNote(item)}
            style={({ pressed }) => [
              styles.noteRow,
              item.id === selectedNoteId ? styles.noteRowSelected : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <View style={styles.noteRowHeader}>
              <Text style={styles.noteTitle}>{item.title}</Text>
              {item.favorite ? <Star color={colors.primary} size={16} weight="fill" /> : null}
              <NamedIcon name={item.icon as IconName} size={18} color={colors.primary} />
            </View>
            <Text numberOfLines={2} style={styles.noteSnippet}>{item.snippet}</Text>
            <View style={styles.noteMetaRow}>
              <Text style={styles.noteMeta}>{item.modified}</Text>
              <Text style={styles.noteMeta}>Created {item.date}</Text>
            </View>
            <View style={styles.tagRow}>
              <TypeChip type={item.type} />
              {item.tags.slice(0, 2).map((tag) => <Tag key={tag} label={tag} />)}
            </View>
          </Pressable>
        )}
      />
      {createNoteFailed ? <Text style={styles.propertyError}>Could not create note.</Text> : null}
      <Pressable
        accessibilityLabel="Create note"
        disabled={isCreatingNote}
        onPress={onCreateNote}
        style={({ pressed }) => [
          styles.composeButton,
          isCreatingNote ? styles.composeButtonDisabled : null,
          pressed ? styles.pressed : null,
        ]}
      >
        <PencilSimple size={28} color="#ffffff" />
      </Pressable>
    </View>
  )
}

function VaultLoadErrorNotice({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.vaultLoadError}>
      <Text style={styles.vaultLoadErrorText}>Could not load vault notes.</Text>
      <Pressable onPress={onRetry} style={({ pressed }) => [styles.vaultLoadRetry, pressed ? styles.pressed : null]}>
        <Text style={styles.vaultLoadRetryText}>Retry</Text>
      </Pressable>
    </View>
  )
}

function selectLoadedNote(
  state: ReturnType<typeof createCompactNavigationState>,
  loadedNotes: MobileNote[],
  preferredNoteId: string | null,
) {
  if (preferredNoteId && loadedNotes.some((note) => note.id === preferredNoteId)) {
    return { ...state, selectedNoteId: preferredNoteId }
  }

  return loadedNotes.some((note) => note.id === state.selectedNoteId)
    ? state
    : { ...state, selectedNoteId: loadedNotes[0].id }
}

function EditorPanel({
  editorMode,
  notes,
  note,
  saveState,
  onDeleteNote,
  onDraftChange,
  onOpenAi,
  onBack,
  onOpenProperties,
  onRawMarkdownChange,
  onToggleArchive,
  onToggleEditorMode,
  onToggleFavorite,
}: {
  editorMode: 'raw' | 'rich'
  notes: MobileNote[]
  note: MobileNote
  saveState?: MobileEditorSaveState
  onDeleteNote?: () => void
  onDraftChange?: (draft: MobileEditorDraft) => void
  onOpenAi?: () => void
  onBack?: () => void
  onOpenProperties?: () => void
  onRawMarkdownChange: (markdown: string) => void
  onToggleArchive: () => void
  onToggleEditorMode: () => void
  onToggleFavorite: () => void
}) {
  return (
    <View style={styles.editor}>
      <Toolbar>
        {onBack ? <IconButton icon={<CaretLeft size={25} color={colors.textSoft} />} onPress={onBack} /> : null}
        <MobileEditorBreadcrumb
          isRawMode={editorMode === 'raw'}
          note={note}
          saveState={saveState ?? idleMobileEditorSaveState}
          onToggleArchive={onToggleArchive}
          onToggleFavorite={onToggleFavorite}
          onToggleRawMode={onToggleEditorMode}
        />
        {onOpenProperties ? <IconButton icon={<Info size={23} color={colors.textSoft} />} onPress={onOpenProperties} /> : null}
        {onOpenAi ? <IconButton icon={<Robot size={23} color={colors.textSoft} />} onPress={onOpenAi} /> : null}
        {onDeleteNote ? <IconButton icon={<Trash size={23} color={colors.textSoft} />} onPress={onDeleteNote} /> : null}
        <IconButton icon={<DotsThreeVertical size={23} color={colors.textSoft} />} />
      </Toolbar>
      {editorMode === 'raw'
        ? <MobileRawEditor key={note.id} notes={notes} note={note} onRawMarkdownChange={onRawMarkdownChange} />
        : <MobileEditorAdapter note={note} onDraftChange={onDraftChange} />}
    </View>
  )
}

function Toolbar({ children }: { children: React.ReactNode }) {
  return <View style={styles.toolbar}>{children}</View>
}

function IconButton({ icon, onPress }: { icon: React.ReactNode; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}>
      {icon}
    </Pressable>
  )
}

function Tag({ label }: { label: string }) {
  return <Text style={styles.tag}>{label}</Text>
}

function TypeChip({ type }: { type: string }) {
  const appearance = mobileTypeAppearance(type)
  return (
    <Text
      style={[
        styles.tag,
        {
          backgroundColor: appearance.backgroundColor,
          borderColor: appearance.borderColor,
          color: appearance.color,
        },
      ]}
    >
      {type}
    </Text>
  )
}
