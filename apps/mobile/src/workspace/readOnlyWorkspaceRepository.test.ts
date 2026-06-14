import { describe, expect, it } from 'vitest'
import { workspaceScenarios } from '../fixtures/workspaceFixtures'
import {
  fixtureReadOnlyWorkspaceRepository,
  HOST_WORKSPACE_SNAPSHOT_GLOBAL_KEY,
  HOST_WORKSPACE_SNAPSHOT_STORAGE_KEY,
  readOnlyWorkspaceRepository,
} from './readOnlyWorkspaceRepository'

describe('fixtureReadOnlyWorkspaceRepository', () => {
  it('returns the default read-only workspace snapshot when no scenario is requested', () => {
    const snapshot = fixtureReadOnlyWorkspaceRepository.readSnapshot()

    expect(snapshot).toBe(workspaceScenarios.default)
    expect(snapshot.notes[0]?.title).toBe('Workflow Orchestration Essay')
  })

  it('returns scenario snapshots through the read-only workspace boundary', () => {
    const snapshot = fixtureReadOnlyWorkspaceRepository.readSnapshot({ scenarioId: 'property-heavy' })

    expect(snapshot).toBe(workspaceScenarios['property-heavy'])
    expect(snapshot.sidebarSections.some((section) => section.id === 'folders')).toBe(true)
  })

  it('prefers an injected host snapshot only when explicitly requested', () => {
    const hostSnapshot = {
      ...workspaceScenarios.default,
      noteListSubtitle: '12 / 6,011',
      source: {
        kind: 'localVault' as const,
        label: 'Laputa',
        totalNotes: 6011,
        visibleNotes: 12,
      },
    }
    const storage = {
      getItem: (key: string) => key === HOST_WORKSPACE_SNAPSHOT_STORAGE_KEY ? JSON.stringify(hostSnapshot) : null,
    }

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: storage,
    })

    expect(readOnlyWorkspaceRepository.readSnapshot({ source: 'fixture' })).toBe(workspaceScenarios.default)
    expect(readOnlyWorkspaceRepository.readSnapshot({ source: 'host' })).toMatchObject({
      noteListSubtitle: '12 / 6,011',
      source: { kind: 'localVault', label: 'Laputa' },
    })

    Reflect.deleteProperty(globalThis, 'localStorage')
  })

  it('reads host snapshots from the injected global before localStorage', () => {
    const hostSnapshot = {
      ...workspaceScenarios.default,
      noteListSubtitle: 'global snapshot',
      source: {
        kind: 'localVault' as const,
        label: 'Laputa',
        totalNotes: 8846,
        visibleNotes: 80,
      },
    }

    Reflect.set(globalThis, HOST_WORKSPACE_SNAPSHOT_GLOBAL_KEY, hostSnapshot)
    expect(readOnlyWorkspaceRepository.readSnapshot({ source: 'host' })).toMatchObject({
      noteListSubtitle: 'global snapshot',
      source: { kind: 'localVault', label: 'Laputa' },
    })
    Reflect.deleteProperty(globalThis, HOST_WORKSPACE_SNAPSHOT_GLOBAL_KEY)
  })
})
