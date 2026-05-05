import { describe, expect, it } from 'vitest'
import type { MobileAppStateStorage } from './mobileAppStateStorage'
import type { MobileNote } from './demoData'
import { loadMobileVaultRuntime } from './mobileVaultRuntime'
import type { MobileVaultMetadataStorage } from './mobileVaultMetadataStorage'

describe('mobile vault runtime', () => {
  it('loads notes and app state for the active metadata vault', async () => {
    const calls: string[] = []
    const runtime = await loadMobileVaultRuntime({
      appStateStorage: createAppStateStorage(calls),
      loadNotes: async (vault) => {
        calls.push(`notes:${vault.id}`)
        return [note({ id: 'workflow' })]
      },
      metadataStorage: createMetadataStorage(),
    })

    expect(runtime.activeVault).toEqual({ id: 'personal', name: 'Personal Journal' })
    expect(runtime.notes).toEqual([note({ id: 'workflow' })])
    expect(runtime.selectedNoteId).toBe('workflow')
    expect(calls).toEqual(['app-state:personal', 'notes:personal'])
  })

  it('uses the first persisted vault when the default vault is absent', async () => {
    const runtime = await loadMobileVaultRuntime({
      appStateStorage: createAppStateStorage([]),
      loadNotes: async () => [note({ id: 'work-note' })],
      metadataStorage: createMetadataStorage([{ id: 'work', name: 'Work Vault' }]),
    })

    expect(runtime.activeVault).toEqual({ id: 'work', name: 'Work Vault' })
  })
})

function createMetadataStorage(vaults = [{ id: 'personal', name: 'Personal Journal' }]): MobileVaultMetadataStorage {
  return {
    load: async () => vaults,
    save: async () => {},
  }
}

function createAppStateStorage(calls: string[]): MobileAppStateStorage {
  return {
    load: async (activeVaultId) => {
      calls.push(`app-state:${activeVaultId}`)
      return { activeVaultId, selectedNoteId: 'workflow' }
    },
    save: async () => {},
  }
}

function note({ id }: { id: string }): MobileNote {
  return {
    archived: false,
    backlinks: [],
    belongsTo: [],
    content: '',
    customProperties: {},
    date: 'today',
    favorite: false,
    favoriteIndex: null,
    has: [],
    icon: 'essay',
    id,
    modified: 'today',
    outgoingLinks: [],
    relatedTo: [],
    relationships: {},
    snippet: '',
    tags: [],
    title: id,
    type: 'Essay',
    words: 0,
  }
}
