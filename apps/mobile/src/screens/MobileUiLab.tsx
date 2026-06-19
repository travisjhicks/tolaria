import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { Linking, useWindowDimensions } from 'react-native'
import { PhoneWorkspace, type PhoneWorkspaceState } from './PhoneWorkspace'
import { TabletWorkspace } from './TabletWorkspace'
import { readOnlyWorkspaceRepository, type ReadOnlyWorkspaceRequest } from '../workspace/readOnlyWorkspaceRepository'
import {
  pickNativeWorkspaceDirectory,
  type NativeWorkspaceSelection,
} from '../workspace/nativeWorkspacePicker'
import { initialMobileEditorStateFromMode } from './mobileEditorMode'
import {
  nativeSourceSelectionProbeEnabled,
} from '../qa/nativeSourceSelectionProbe'
import {
  nativeWysiwygMutationProbeEnabled,
  nativeWysiwygMutationProbeInitialContent,
} from '../qa/nativeWysiwygMutationProbe'
import {
  nativeWysiwygPersistenceProbeEnabled,
} from '../qa/nativeWysiwygPersistenceProbe'
import {
  nativeWysiwygAutocompleteProbeEnabled,
} from '../qa/nativeWysiwygAutocompleteProbe'
import {
  nativeWysiwygWikilinkInsertProbeEnabled,
} from '../qa/nativeWysiwygWikilinkInsertProbe'
import {
  nativeWysiwygPersistenceProbeRepository,
  nativeWysiwygPersistenceProbeRequest,
} from '../qa/nativeWysiwygPersistenceProbeRepository'
import {
  nativeWorkspacePersistenceProbeEnabled,
} from '../qa/nativeWorkspacePersistenceProbe'
import {
  nativeWorkspacePersistenceProbeRepository,
  nativeWorkspacePersistenceProbeRequest,
} from '../qa/nativeWorkspacePersistenceProbeRepository'
import { setMobileLayoutMetricSinkUrl } from '../qa/mobileLayoutProbe'
import type { MobileNote, MobileWorkspaceSnapshot } from '../workspace/mobileWorkspaceModel'

export function MobileUiLab() {
  const { width } = useWindowDimensions()
  const isWideEnoughForTablet = width >= 900
  const searchParams = useMobileUiSearchParams()
  const [nativeWorkspace, setNativeWorkspace] = useState<NativeWorkspaceSelection | null>(null)
  const workspacePersistenceProbe = nativeWorkspacePersistenceProbeEnabled(searchParams)
  const wysiwygPersistenceProbe = nativeWysiwygPersistenceProbeEnabled(searchParams)
  const scenarioId = currentScenarioId(searchParams)
  const source = currentSnapshotSource(searchParams, nativeWorkspace)
  const baseRepositoryRequest = {
    scenarioId,
    source,
    vaultAlias: currentVaultAlias(searchParams, nativeWorkspace),
    vaultLabel: currentVaultLabel(searchParams, nativeWorkspace),
    vaultRootUri: currentVaultRootUri(searchParams, nativeWorkspace),
  }
  const repository = mobileRepositoryForProbes({ workspacePersistenceProbe, wysiwygPersistenceProbe })
  const repositoryRequest = mobileRepositoryRequestForProbes(
    baseRepositoryRequest,
    { workspacePersistenceProbe, wysiwygPersistenceProbe },
  )
  const { initialEditorEditing, initialEditorEditingMode } = initialMobileEditorStateFromMode(editorMode(searchParams))
  const layoutProbe = layoutProbeEnabled(searchParams)
  const metricSinkUrl = layoutProbe ? searchParams.get('metricSink') : null
  const sourceSelectionProbe = nativeSourceSelectionProbeEnabled(searchParams)
  const wysiwygAutocompleteProbe = nativeWysiwygAutocompleteProbeEnabled(searchParams)
  const wysiwygWikilinkInsertProbe = nativeWysiwygWikilinkInsertProbeEnabled(searchParams)
  const wysiwygMutationProbe = nativeWysiwygMutationProbeEnabled(searchParams) || wysiwygPersistenceProbe
  const baseSnapshot = repository.readSnapshot(repositoryRequest)
  const snapshot = wysiwygMutationProbe && !wysiwygPersistenceProbe
    ? snapshotWithWysiwygMutationProbeContent(baseSnapshot)
    : baseSnapshot
  const workspaceKey = mobileWorkspaceKey({
    initialEditorEditing,
    initialEditorEditingMode,
    layoutProbe,
    qaRun: searchParams.get('qaRun'),
    scenarioId,
    snapshot,
    source,
    sourceSelectionProbe,
    workspacePersistenceProbe,
    wysiwygAutocompleteProbe,
    wysiwygWikilinkInsertProbe,
    wysiwygMutationProbe,
    wysiwygPersistenceProbe,
  })
  const handleOpenNativeVault = useCallback(async () => {
    const selection = await pickNativeWorkspaceDirectory(repositoryRequest.vaultRootUri)
    if (selection) setNativeWorkspace(selection)
  }, [repositoryRequest.vaultRootUri])

  useLayoutEffect(() => {
    setMobileLayoutMetricSinkUrl(metricSinkUrl)
    return () => setMobileLayoutMetricSinkUrl(null)
  }, [metricSinkUrl])

  if (isWideEnoughForTablet) {
    return (
      <TabletWorkspace
        key={workspaceKey}
        initialEditorEditing={initialEditorEditing}
        initialEditorEditingMode={initialEditorEditingMode}
        layoutProbe={layoutProbe}
        onOpenNativeVault={handleOpenNativeVault}
        repository={repository}
        repositoryRequest={repositoryRequest}
        sourceSelectionProbe={sourceSelectionProbe}
        snapshot={snapshot}
        wysiwygAutocompleteProbe={wysiwygAutocompleteProbe}
        wysiwygWikilinkInsertProbe={wysiwygWikilinkInsertProbe}
        wysiwygMutationProbe={wysiwygMutationProbe}
      />
    )
  }

  return (
    <PhoneWorkspace
      key={workspaceKey}
      initialEditorEditing={initialEditorEditing}
      initialEditorEditingMode={initialEditorEditingMode}
      initialState={currentPhoneState(searchParams)}
      layoutProbe={layoutProbe}
      onOpenNativeVault={handleOpenNativeVault}
      repository={repository}
      repositoryRequest={repositoryRequest}
      snapshot={snapshot}
    />
  )
}

function currentScenarioId(searchParams: URLSearchParams) {
  return searchParams.get('scenario') || envValue('EXPO_PUBLIC_TOLARIA_SCENARIO')
}

function currentPhoneState(searchParams: URLSearchParams): PhoneWorkspaceState {
  const value = searchParams.get('phoneState')

  if (value === 'editor' || value === 'properties' || value === 'sidebar') return value

  return 'list'
}

function currentSnapshotSource(
  searchParams: URLSearchParams,
  nativeWorkspace: NativeWorkspaceSelection | null,
): NonNullable<ReadOnlyWorkspaceRequest['source']> {
  if (nativeWorkspace) return 'native'
  if (searchParams.get('source') === 'native-vault') return 'native'
  return searchParams.get('source') === 'host-vault' ? 'host' : 'fixture'
}

function editorMode(searchParams: URLSearchParams) {
  return searchParams.get('editorMode')
}

function mobileRepositoryForProbes({
  workspacePersistenceProbe,
  wysiwygPersistenceProbe,
}: {
  workspacePersistenceProbe: boolean
  wysiwygPersistenceProbe: boolean
}) {
  if (workspacePersistenceProbe) return nativeWorkspacePersistenceProbeRepository(readOnlyWorkspaceRepository)
  if (wysiwygPersistenceProbe) return nativeWysiwygPersistenceProbeRepository(readOnlyWorkspaceRepository)
  return readOnlyWorkspaceRepository
}

function mobileRepositoryRequestForProbes(
  request: ReadOnlyWorkspaceRequest,
  {
    workspacePersistenceProbe,
    wysiwygPersistenceProbe,
  }: {
    workspacePersistenceProbe: boolean
    wysiwygPersistenceProbe: boolean
  },
) {
  if (workspacePersistenceProbe) return nativeWorkspacePersistenceProbeRequest(request)
  if (wysiwygPersistenceProbe) return nativeWysiwygPersistenceProbeRequest(request)
  return request
}

function currentVaultRootUri(
  searchParams: URLSearchParams,
  nativeWorkspace: NativeWorkspaceSelection | null,
): string | null {
  if (nativeWorkspace) return nativeWorkspace.vaultRootUri
  return searchParams.get('vaultUri') || envValue('EXPO_PUBLIC_TOLARIA_NATIVE_VAULT_URI')
}

function currentVaultLabel(
  searchParams: URLSearchParams,
  nativeWorkspace: NativeWorkspaceSelection | null,
): string | null {
  if (nativeWorkspace) return nativeWorkspace.vaultLabel
  return searchParams.get('vaultLabel') || envValue('EXPO_PUBLIC_TOLARIA_NATIVE_VAULT_LABEL')
}

function currentVaultAlias(
  searchParams: URLSearchParams,
  nativeWorkspace: NativeWorkspaceSelection | null,
): string | null {
  if (nativeWorkspace) return nativeWorkspace.vaultAlias
  return searchParams.get('vaultAlias') || envValue('EXPO_PUBLIC_TOLARIA_NATIVE_VAULT_ALIAS')
}

function layoutProbeEnabled(searchParams: URLSearchParams) {
  return searchParams.get('layoutProbe') === '1' || envFlagEnabled('EXPO_PUBLIC_TOLARIA_LAYOUT_PROBE')
}

function snapshotWithWysiwygMutationProbeContent(snapshot: MobileWorkspaceSnapshot): MobileWorkspaceSnapshot {
  const selectedNoteId = snapshot.selectedNoteId ?? snapshot.notes[0]?.id
  if (!selectedNoteId) return snapshot

  const seedSelectedNote = (note: MobileNote) => {
    if (note.id !== selectedNoteId || note.rawContent !== undefined) return note

    return {
      ...note,
      rawContent: nativeWysiwygMutationProbeInitialContent(note),
    }
  }

  return {
    ...snapshot,
    allNotes: snapshot.allNotes?.map(seedSelectedNote),
    notes: snapshot.notes.map(seedSelectedNote),
  }
}

function mobileWorkspaceKey({
  initialEditorEditing,
  initialEditorEditingMode,
  layoutProbe,
  qaRun,
  scenarioId,
  snapshot,
  source,
  sourceSelectionProbe,
  workspacePersistenceProbe,
  wysiwygAutocompleteProbe,
  wysiwygWikilinkInsertProbe,
  wysiwygMutationProbe,
  wysiwygPersistenceProbe,
}: {
  initialEditorEditing: boolean
  initialEditorEditingMode: string
  layoutProbe: boolean
  qaRun: string | null
  scenarioId: string | null
  snapshot: ReturnType<typeof readOnlyWorkspaceRepository.readSnapshot>
  source: ReturnType<typeof currentSnapshotSource>
  sourceSelectionProbe: boolean
  workspacePersistenceProbe: boolean
  wysiwygAutocompleteProbe: boolean
  wysiwygWikilinkInsertProbe: boolean
  wysiwygMutationProbe: boolean
  wysiwygPersistenceProbe: boolean
}) {
  const sourceInfo = snapshot.source

  return [
    source,
    scenarioIdOrDefault(scenarioId),
    qaRun ?? 'interactive',
    flagKey(initialEditorEditing, 'raw-editor', 'read-editor'),
    initialEditorEditingMode,
    flagKey(sourceSelectionProbe, 'source-selection-probe', 'no-source-selection-probe'),
    flagKey(workspacePersistenceProbe, 'workspace-persistence-probe', 'no-workspace-persistence-probe'),
    flagKey(wysiwygAutocompleteProbe, 'wysiwyg-autocomplete-probe', 'no-wysiwyg-autocomplete-probe'),
    flagKey(wysiwygWikilinkInsertProbe, 'wysiwyg-wikilink-insert-probe', 'no-wysiwyg-wikilink-insert-probe'),
    flagKey(wysiwygMutationProbe, 'wysiwyg-mutation-probe', 'no-wysiwyg-mutation-probe'),
    flagKey(wysiwygPersistenceProbe, 'wysiwyg-persistence-probe', 'no-wysiwyg-persistence-probe'),
    layoutProbeMode(layoutProbe),
    sourceInfo?.kind ?? 'fixture',
    sourceInfo?.alias ?? 'no-workspace-alias',
    sourceInfo?.label ?? 'Tolaria Vault',
    sourceInfo?.totalNotes ?? snapshot.notes.length,
    firstNoteId(snapshot),
  ].join(':')
}

function flagKey(enabled: boolean, enabledKey: string, disabledKey: string): string {
  return enabled ? enabledKey : disabledKey
}

function scenarioIdOrDefault(scenarioId: string | null) {
  return scenarioId ?? 'default'
}

function layoutProbeMode(layoutProbe: boolean) {
  return layoutProbe ? 'probe' : 'view'
}

function firstNoteId(snapshot: ReturnType<typeof readOnlyWorkspaceRepository.readSnapshot>) {
  return snapshot.notes[0]?.id ?? 'empty'
}

function useMobileUiSearchParams() {
  const [nativeSearch, setNativeSearch] = useState('')
  const webSearch = currentWebSearch()

  useEffect(() => {
    let mounted = true
    const subscription = Linking.addEventListener('url', ({ url }) => {
      setNativeSearch(searchFromUrl(url))
    })

    Linking.getInitialURL()
      .then((url) => {
        if (mounted) setNativeSearch(searchFromUrl(url))
      })
      .catch(() => {
        if (mounted) setNativeSearch('')
      })

    return () => {
      mounted = false
      subscription.remove()
    }
  }, [])

  return useMemo(() => new URLSearchParams(nativeSearch || webSearch), [nativeSearch, webSearch])
}

function currentWebSearch() {
  const search = (globalThis as { location?: { search?: string } }).location?.search
  return search ?? ''
}

function searchFromUrl(url: string | null) {
  if (!url) return ''

  const queryStart = url.indexOf('?')
  if (queryStart === -1) return ''

  return url.slice(queryStart)
}

function envFlagEnabled(name: string) {
  return envValue(name) === '1'
}

function envValue(name: string) {
  const processGlobal = globalThis as { process?: { env?: Record<string, string | undefined> } }
  return processGlobal.process?.env?.[name] ?? null
}
