import { useEffect, useMemo, useState } from 'react'
import { Linking, useWindowDimensions } from 'react-native'
import { PhoneWorkspaceMock, type PhoneWorkspaceState } from './PhoneWorkspaceMock'
import { TabletWorkspace } from './TabletWorkspace'
import { readOnlyWorkspaceRepository, type ReadOnlyWorkspaceRequest } from '../workspace/readOnlyWorkspaceRepository'

export function MobileUiLab() {
  const { width } = useWindowDimensions()
  const isWideEnoughForTablet = width >= 900
  const searchParams = useMobileUiSearchParams()
  const scenarioId = currentScenarioId(searchParams)
  const source = currentSnapshotSource(searchParams)
  const repositoryRequest = {
    scenarioId,
    source,
    vaultLabel: currentVaultLabel(searchParams),
    vaultRootUri: currentVaultRootUri(searchParams),
  }
  const initialEditorEditing = editorMode(searchParams) === 'raw'
  const layoutProbe = layoutProbeEnabled(searchParams)
  const snapshot = readOnlyWorkspaceRepository.readSnapshot(repositoryRequest)
  const workspaceKey = mobileWorkspaceKey({ initialEditorEditing, layoutProbe, scenarioId, snapshot, source })

  if (isWideEnoughForTablet) {
    return (
      <TabletWorkspace
        key={workspaceKey}
        initialEditorEditing={initialEditorEditing}
        layoutProbe={layoutProbe}
        repository={readOnlyWorkspaceRepository}
        repositoryRequest={repositoryRequest}
        snapshot={snapshot}
      />
    )
  }

  return <PhoneWorkspaceMock key={workspaceKey} initialState={currentPhoneState(searchParams)} snapshot={snapshot} />
}

function currentScenarioId(searchParams: URLSearchParams) {
  return searchParams.get('scenario') || envValue('EXPO_PUBLIC_TOLARIA_SCENARIO')
}

function currentPhoneState(searchParams: URLSearchParams): PhoneWorkspaceState {
  const value = searchParams.get('phoneState')

  if (value === 'editor' || value === 'sidebar') return value

  return 'list'
}

function currentSnapshotSource(searchParams: URLSearchParams): NonNullable<ReadOnlyWorkspaceRequest['source']> {
  if (searchParams.get('source') === 'native-vault') return 'native'
  return searchParams.get('source') === 'host-vault' ? 'host' : 'fixture'
}

function editorMode(searchParams: URLSearchParams) {
  return searchParams.get('editorMode')
}

function currentVaultRootUri(searchParams: URLSearchParams): string | null {
  return searchParams.get('vaultUri') || envValue('EXPO_PUBLIC_TOLARIA_NATIVE_VAULT_URI')
}

function currentVaultLabel(searchParams: URLSearchParams): string | null {
  return searchParams.get('vaultLabel') || envValue('EXPO_PUBLIC_TOLARIA_NATIVE_VAULT_LABEL')
}

function layoutProbeEnabled(searchParams: URLSearchParams) {
  return searchParams.get('layoutProbe') === '1' || envFlagEnabled('EXPO_PUBLIC_TOLARIA_LAYOUT_PROBE')
}

function mobileWorkspaceKey({
  initialEditorEditing,
  layoutProbe,
  scenarioId,
  snapshot,
  source,
}: {
  initialEditorEditing: boolean
  layoutProbe: boolean
  scenarioId: string | null
  snapshot: ReturnType<typeof readOnlyWorkspaceRepository.readSnapshot>
  source: ReturnType<typeof currentSnapshotSource>
}) {
  const sourceInfo = snapshot.source

  return [
    source,
    scenarioIdOrDefault(scenarioId),
    initialEditorEditing ? 'raw-editor' : 'read-editor',
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
