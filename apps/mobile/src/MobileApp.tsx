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
  Trash,
} from 'phosphor-react-native'
import { MobileNote, notes as fallbackNotes, sidebarSections } from './demoData'
import {
  createDemoVaultNote,
  deleteDemoVaultNote,
  loadDemoVaultNotes,
  saveDemoVaultDraft,
  saveDemoVaultNoteFrontmatter,
} from './mobileDemoVault'
import { createMobileAutosaveQueue } from './mobileAutosaveQueue'
import type { MobileEditorDraft } from './mobileEditorDraft'
import {
  idleMobileEditorSaveState,
  type MobileEditorSaveState,
} from './mobileEditorSaveState'
import { applySavedMobileEditorDraft } from './mobileSavedDraftProjection'
import { MobileEditorAdapter } from './MobileEditorAdapter'
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
  const [saveStateByNoteId, setSaveStateByNoteId] = useState<Record<string, MobileEditorSaveState>>({})
  const selectedNote = useMemo(
    () => availableNotes.find((note) => note.id === compactNavigation.selectedNoteId) ?? availableNotes[0],
    [availableNotes, compactNavigation.selectedNoteId],
  )
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
  const saveDraft = useCallback((draft: MobileEditorDraft) => autosaveQueue.enqueue(draft), [autosaveQueue])
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

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        {isTablet ? (
          <View style={styles.tabletShell}>
            <SidebarPanel activeVault={activeVaultMetadata} onOpenRemoteSetup={remoteSetupFlow.open} />
            <NoteListPanel
              gitSyncPlan={gitSyncFlow.gitSyncPlan}
              notes={availableNotes}
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
              note={selectedNote}
              saveState={selectedSaveState}
              onDeleteNote={deleteFlow.canDelete ? deleteFlow.deleteSelectedNote : undefined}
              onDraftChange={saveDraft}
            />
            {showsProperties ? (
              <MobilePropertiesPanel
                failed={propertiesFlow.failed}
                isSaving={propertiesFlow.isSaving}
                note={selectedNote}
                onChangeProperties={propertiesFlow.saveProperties}
              />
            ) : null}
          </View>
        ) : (
          <CompactShell
            activePanel={compactNavigation.panel}
            activeVault={activeVaultMetadata}
            note={selectedNote}
            gitSyncPlan={gitSyncFlow.gitSyncPlan}
            notes={availableNotes}
            saveState={selectedSaveState}
            selectedNoteId={compactNavigation.selectedNoteId}
            onNavigate={(event) => setCompactNavigation((state) => transitionCompactNavigation(state, event))}
            onDeleteNote={deleteFlow.canDelete ? deleteFlow.deleteSelectedNote : undefined}
            onDraftChange={saveDraft}
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

function CompactShell({
  activePanel,
  activeVault,
  note,
  gitSyncPlan,
  notes,
  saveState,
  onNavigate,
  onDeleteNote,
  onDraftChange,
  createNoteFailed,
  isCreatingNote,
  runtimeLoadFailed,
  onCreateNote,
  onGitSyncAction,
  onChangeProperties,
  onOpenRemoteSetup,
  onRetryRuntimeLoad,
  onSelectNote,
  propertiesFailed,
  isSavingProperties,
  selectedNoteId,
}: {
  activePanel: CompactPanel
  activeVault: MobileVaultMetadata
  note: MobileNote
  gitSyncPlan: MobileGitSyncPlan
  notes: MobileNote[]
  saveState: MobileEditorSaveState
  createNoteFailed: boolean
  isCreatingNote: boolean
  runtimeLoadFailed: boolean
  onNavigate: (event: CompactNavigationEvent) => void
  onDeleteNote?: () => void
  onDraftChange: (draft: MobileEditorDraft) => void
  onCreateNote: () => void
  onGitSyncAction: () => void
  onChangeProperties: (patch: MobileNotePropertyPatch) => void
  onOpenRemoteSetup: () => void
  onRetryRuntimeLoad: () => void
  onSelectNote: (note: MobileNote) => void
  propertiesFailed: boolean
  isSavingProperties: boolean
  selectedNoteId: string
}) {
  if (activePanel === 'sidebar') {
    return (
      <SwipeSurface panel="sidebar" onNavigate={onNavigate}>
        <SidebarPanel
          activeVault={activeVault}
          onClose={() => onNavigate({ type: 'closeSidebar' })}
          onOpenRemoteSetup={onOpenRemoteSetup}
        />
      </SwipeSurface>
    )
  }

  if (activePanel === 'note') {
    return (
      <SwipeSurface panel="note" onNavigate={onNavigate}>
        <EditorPanel
          note={note}
          saveState={saveState}
          onDeleteNote={onDeleteNote}
          onDraftChange={onDraftChange}
          onBack={() => onNavigate({ type: 'backToList' })}
          onOpenProperties={() => onNavigate({ type: 'openProperties' })}
        />
      </SwipeSurface>
    )
  }

  if (activePanel === 'properties') {
    return (
      <SwipeSurface panel="properties" onNavigate={onNavigate}>
        <MobilePropertiesPanel
          failed={propertiesFailed}
          isSaving={isSavingProperties}
          note={note}
          onChangeProperties={onChangeProperties}
          onClose={() => onNavigate({ type: 'closeProperties' })}
        />
      </SwipeSurface>
    )
  }

  return (
    <SwipeSurface panel="list" onNavigate={onNavigate}>
      <NoteListPanel
        gitSyncPlan={gitSyncPlan}
        notes={notes}
        selectedNoteId={selectedNoteId}
        createNoteFailed={createNoteFailed}
        isCreatingNote={isCreatingNote}
        runtimeLoadFailed={runtimeLoadFailed}
        onGitSyncAction={onGitSyncAction}
        onCreateNote={onCreateNote}
        onOpenSidebar={() => onNavigate({ type: 'openSidebar' })}
        onRetryRuntimeLoad={onRetryRuntimeLoad}
        onSelectNote={onSelectNote}
      />
    </SwipeSurface>
  )
}

function SidebarPanel({
  activeVault,
  onClose,
  onOpenRemoteSetup,
}: {
  activeVault: MobileVaultMetadata
  onClose?: () => void
  onOpenRemoteSetup: () => void
}) {
  return (
    <View style={styles.sidebar}>
      <Toolbar>
        {onClose ? <IconButton icon={<CaretLeft size={24} color={colors.textSoft} />} onPress={onClose} /> : null}
        <View style={styles.toolbarSpacer} />
      </Toolbar>
      <ScrollView contentContainerStyle={styles.sidebarContent}>
        <MobileVaultManagementCard vault={activeVault} onOpenRemoteSetup={onOpenRemoteSetup} />
        {sidebarSections.map((section) => (
          <View key={section.title} style={styles.sidebarSection}>
            <Text style={styles.sidebarSectionTitle}>{section.title}</Text>
            {section.items.map((item) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.sidebarItem,
                  item.id === 'inbox' ? styles.sidebarItemSelected : null,
                  pressed ? styles.pressed : null,
                ]}
              >
                <NamedIcon name={item.icon as IconName} size={20} color={item.id === 'inbox' ? colors.primary : colors.iconMuted} />
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

function NoteListPanel({
  gitSyncPlan,
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
        <Text style={styles.listTitle}>Inbox</Text>
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
              <NamedIcon name={item.icon as IconName} size={18} color={colors.primary} />
            </View>
            <Text numberOfLines={2} style={styles.noteSnippet}>{item.snippet}</Text>
            <View style={styles.noteMetaRow}>
              <Text style={styles.noteMeta}>{item.modified}</Text>
              <Text style={styles.noteMeta}>Created {item.date}</Text>
            </View>
            <View style={styles.tagRow}>
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
  note,
  saveState,
  onDeleteNote,
  onDraftChange,
  onBack,
  onOpenProperties,
}: {
  note: MobileNote
  saveState?: MobileEditorSaveState
  onDeleteNote?: () => void
  onDraftChange?: (draft: MobileEditorDraft) => void
  onBack?: () => void
  onOpenProperties?: () => void
}) {
  return (
    <View style={styles.editor}>
      <Toolbar>
        {onBack ? <IconButton icon={<CaretLeft size={25} color={colors.textSoft} />} onPress={onBack} /> : null}
        <MobileEditorBreadcrumb note={note} saveState={saveState ?? idleMobileEditorSaveState} />
        {onOpenProperties ? <IconButton icon={<Info size={23} color={colors.textSoft} />} onPress={onOpenProperties} /> : null}
        {onDeleteNote ? <IconButton icon={<Trash size={23} color={colors.textSoft} />} onPress={onDeleteNote} /> : null}
        <IconButton icon={<DotsThreeVertical size={23} color={colors.textSoft} />} />
      </Toolbar>
      <MobileEditorAdapter note={note} onDraftChange={onDraftChange} />
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
