import { workspaceScenarioForId } from '../fixtures/workspaceFixtures'
import type { MobileWorkspaceSnapshot } from './mobileWorkspaceModel'

export type ReadOnlyWorkspaceRequest = {
  scenarioId?: string | null
  source?: 'fixture' | 'host'
}

export type ReadOnlyWorkspaceRepository = {
  readSnapshot: (request?: ReadOnlyWorkspaceRequest) => MobileWorkspaceSnapshot
}

export const fixtureReadOnlyWorkspaceRepository: ReadOnlyWorkspaceRepository = {
  readSnapshot: (request) => workspaceScenarioForId(request?.scenarioId),
}

export const HOST_WORKSPACE_SNAPSHOT_STORAGE_KEY = 'tolaria:mobile-workspace-snapshot'
export const HOST_WORKSPACE_SNAPSHOT_GLOBAL_KEY = '__TOLARIA_MOBILE_WORKSPACE_SNAPSHOT__'

export const readOnlyWorkspaceRepository: ReadOnlyWorkspaceRepository = {
  readSnapshot: (request) => {
    if (request?.source === 'host') {
      return readHostWorkspaceSnapshot() ?? fixtureReadOnlyWorkspaceRepository.readSnapshot(request)
    }

    return fixtureReadOnlyWorkspaceRepository.readSnapshot(request)
  },
}

function readHostWorkspaceSnapshot(): MobileWorkspaceSnapshot | null {
  const injectedSnapshot = hostGlobalSnapshot()
  if (injectedSnapshot) return injectedSnapshot

  const storage = hostStorage()
  if (!storage) return null

  const serialized = storage.getItem(HOST_WORKSPACE_SNAPSHOT_STORAGE_KEY)
  if (!serialized) return null

  try {
    const parsed: unknown = JSON.parse(serialized)
    return isMobileWorkspaceSnapshot(parsed) ? parsed : null
  } catch {
    return null
  }
}

function hostGlobalSnapshot(): MobileWorkspaceSnapshot | null {
  const maybeSnapshot = (globalThis as Record<string, unknown>)[HOST_WORKSPACE_SNAPSHOT_GLOBAL_KEY]
  return isMobileWorkspaceSnapshot(maybeSnapshot) ? maybeSnapshot : null
}

function hostStorage(): Pick<Storage, 'getItem'> | null {
  const maybeStorage = (globalThis as { localStorage?: Pick<Storage, 'getItem'> }).localStorage
  return maybeStorage ?? null
}

function isMobileWorkspaceSnapshot(value: unknown): value is MobileWorkspaceSnapshot {
  if (!isRecord(value)) return false

  return Array.isArray(value.notes)
    && Array.isArray(value.sidebarSections)
    && isRecord(value.sync)
    && typeof value.noteListSubtitle === 'string'
    && Array.isArray(value.editorBlocks)
    && Array.isArray(value.editorBullets)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
