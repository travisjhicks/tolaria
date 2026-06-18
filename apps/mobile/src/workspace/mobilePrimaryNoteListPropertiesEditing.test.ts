import { describe, expect, it } from 'vitest'
import { workspaceScenarioForId } from '../fixtures/workspaceFixtures'
import { applyMobileWorkspaceEditWithWrites } from './mobileWorkspaceEditing'

describe('primary note-list property overrides', () => {
  it('persists primary note-list display overrides through vault config writes', () => {
    const base = workspaceScenarioForId('default')
    const result = applyMobileWorkspaceEditWithWrites(base, {
      listPropertiesDisplay: [' status ', 'belongs_to', 'Status', ''],
      target: 'allNotes',
      type: 'updatePrimaryNoteListProperties',
    })

    expect(result.writes).toEqual([{
      config: {
        allNotes: { noteListProperties: ['status', 'belongs_to'] },
      },
      kind: 'saveVaultConfig',
    }])
    expect(result.snapshot.noteListPropertyOverrides).toEqual({
      allNotes: ['status', 'belongs_to'],
    })
    expect(result.snapshot.vaultConfig).toEqual({
      allNotes: { noteListProperties: ['status', 'belongs_to'] },
    })

    const reset = applyMobileWorkspaceEditWithWrites(result.snapshot, {
      listPropertiesDisplay: [],
      target: 'allNotes',
      type: 'updatePrimaryNoteListProperties',
    })

    expect(reset.writes).toEqual([{
      config: {
        allNotes: { noteListProperties: null },
      },
      kind: 'saveVaultConfig',
    }])
    expect(reset.snapshot.noteListPropertyOverrides).toBeUndefined()
    expect(reset.snapshot.vaultConfig).toEqual({
      allNotes: { noteListProperties: null },
    })
  })

  it('preserves unrelated vault config when resetting one primary list target', () => {
    const base = {
      ...workspaceScenarioForId('default'),
      vaultConfig: {
        allNotes: { noteListProperties: ['tags'] },
        inbox: { explicitOrganization: true, noteListProperties: ['status'] },
      },
    }

    const result = applyMobileWorkspaceEditWithWrites(base, {
      listPropertiesDisplay: [],
      target: 'inbox',
      type: 'updatePrimaryNoteListProperties',
    })

    expect(result.snapshot.noteListPropertyOverrides).toEqual({ allNotes: ['tags'] })
    expect(result.writes).toEqual([{
      config: {
        allNotes: { noteListProperties: ['tags'] },
        inbox: { explicitOrganization: true, noteListProperties: null },
      },
      kind: 'saveVaultConfig',
    }])
  })
})
