import { useEffect, useMemo, useState } from 'react'
import { Linking, useWindowDimensions } from 'react-native'
import { PhoneWorkspaceMock, type PhoneWorkspaceState } from './PhoneWorkspaceMock'
import { TabletWorkspace } from './TabletWorkspace'
import { readOnlyWorkspaceRepository } from '../workspace/readOnlyWorkspaceRepository'

export function MobileUiLab() {
  const { width } = useWindowDimensions()
  const isWideEnoughForTablet = width >= 900
  const searchParams = useMobileUiSearchParams()
  const scenarioId = currentScenarioId(searchParams)
  const source = currentSnapshotSource(searchParams)
  const layoutProbe = layoutProbeEnabled(searchParams)
  const snapshot = readOnlyWorkspaceRepository.readSnapshot({
    scenarioId,
    source,
  })
  const workspaceKey = mobileWorkspaceKey({ layoutProbe, scenarioId, snapshot, source })

  if (isWideEnoughForTablet) {
    return <TabletWorkspace key={workspaceKey} layoutProbe={layoutProbe} snapshot={snapshot} />
  }

  return <PhoneWorkspaceMock key={workspaceKey} initialState={currentPhoneState(searchParams)} snapshot={snapshot} />
}

function currentScenarioId(searchParams: URLSearchParams) {
  return searchParams.get('scenario')
}

function currentPhoneState(searchParams: URLSearchParams): PhoneWorkspaceState {
  const value = searchParams.get('phoneState')

  if (value === 'editor' || value === 'sidebar') return value

  return 'list'
}

function currentSnapshotSource(searchParams: URLSearchParams) {
  return searchParams.get('source') === 'host-vault' ? 'host' : 'fixture'
}

function layoutProbeEnabled(searchParams: URLSearchParams) {
  return searchParams.get('layoutProbe') === '1' || envFlagEnabled('EXPO_PUBLIC_TOLARIA_LAYOUT_PROBE')
}

function mobileWorkspaceKey({
  layoutProbe,
  scenarioId,
  snapshot,
  source,
}: {
  layoutProbe: boolean
  scenarioId: string | null
  snapshot: ReturnType<typeof readOnlyWorkspaceRepository.readSnapshot>
  source: ReturnType<typeof currentSnapshotSource>
}) {
  return [
    source,
    scenarioId ?? 'default',
    layoutProbe ? 'probe' : 'view',
    snapshot.source?.kind ?? 'fixture',
    snapshot.source?.totalNotes ?? snapshot.notes.length,
    snapshot.notes[0]?.id ?? 'empty',
  ].join(':')
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
  const processGlobal = globalThis as { process?: { env?: Record<string, string | undefined> } }
  return processGlobal.process?.env?.[name] === '1'
}
