import { useCallback, useEffect, useMemo, useState } from 'react'
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
  nativeWysiwygMutationProbeEnabled,
  nativeWysiwygMutationProbeInitialContent,
} from '../qa/nativeWysiwygMutationProbe'
import type { MobileNote, MobileWorkspaceSnapshot } from '../workspace/mobileWorkspaceModel'

export function MobileUiLab() {
  const { width } = useWindowDimensions()
  const isWideEnoughForTablet = width >= 900
  const searchParams = useMobileUiSearchParams()
  const [nativeWorkspace, setNativeWorkspace] = useState<NativeWorkspaceSelection | null>(null)
  const scenarioId = currentScenarioId(searchParams)
  const source = currentSnapshotSource(searchParams, nativeWorkspace)
  const repositoryRequest = {
    scenarioId,
    source,
    vaultLabel: currentVaultLabel(searchParams, nativeWorkspace),
    vaultRootUri: currentVaultRootUri(searchParams, nativeWorkspace),
  }
  const { initialEditorEditing, initialEditorEditingMode } = initialMobileEditorStateFromMode(editorMode(searchParams))
  const layoutProbe = layoutProbeEnabled(searchParams)
  const wysiwygMutationProbe = nativeWysiwygMutationProbeEnabled(searchParams)
  const baseSnapshot = readOnlyWorkspaceRepository.readSnapshot(repositoryRequest)
  const snapshot = wysiwygMutationProbe ? snapshotWithWysiwygMutationProbeContent(baseSnapshot) : baseSnapshot
  const workspaceKey = mobileWorkspaceKey({
    initialEditorEditing,
    initialEditorEditingMode,
    layoutProbe,
    qaRun: searchParams.get('qaRun'),
    scenarioId,
    snapshot,
    source,
    wysiwygMutationProbe,
  })
  const handleOpenNativeVault = useCallback(async () => {
    const selection = await pickNativeWorkspaceDirectory(repositoryRequest.vaultRootUri)
    if (selection) setNativeWorkspace(selection)
  }, [repositoryRequest.vaultRootUri])

  if (isWideEnoughForTablet) {
    return (
      <TabletWorkspace
        key={workspaceKey}
        initialEditorEditing={initialEditorEditing}
        initialEditorEditingMode={initialEditorEditingMode}
        layoutProbe={layoutProbe}
        onOpenNativeVault={handleOpenNativeVault}
        repository={readOnlyWorkspaceRepository}
        repositoryRequest={repositoryRequest}
        snapshot={snapshot}
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
      onOpenNativeVault={handleOpenNativeVault}
      repository={readOnlyWorkspaceRepository}
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
  wysiwygMutationProbe,
}: {
  initialEditorEditing: boolean
  initialEditorEditingMode: string
  layoutProbe: boolean
  qaRun: string | null
  scenarioId: string | null
  snapshot: ReturnType<typeof readOnlyWorkspaceRepository.readSnapshot>
  source: ReturnType<typeof currentSnapshotSource>
  wysiwygMutationProbe: boolean
}) {
  const sourceInfo = snapshot.source

  return [
    source,
    scenarioIdOrDefault(scenarioId),
    qaRun ?? 'interactive',
    initialEditorEditing ? 'raw-editor' : 'read-editor',
    initialEditorEditingMode,
    wysiwygMutationProbe ? 'wysiwyg-mutation-probe' : 'no-wysiwyg-mutation-probe',
    layoutProbeMode(layoutProbe),
    sourceInfo ? sourceInfo.kind : 'fixture',
    sourceInfo ? sourceInfo.label : 'Tolaria Vault',
    sourceInfo ? sourceInfo.totalNotes : snapshot.notes.length,
    firstNoteId(snapshot),
  ].join(':')
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
