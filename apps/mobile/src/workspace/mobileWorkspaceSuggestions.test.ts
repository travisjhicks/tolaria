import { describe, expect, it } from 'vitest'
import { workspaceScenarioForId } from '../fixtures/workspaceFixtures'
import { applyMobileWorkspaceEdit } from './mobileWorkspaceEditing'
import {
  mobilePropertyKeySuggestions,
  mobilePropertyValueSuggestions,
  mobileRelationshipKeySuggestions,
  mobileViewFieldSuggestions,
  mobileViewValueSuggestions,
} from './mobileWorkspaceSuggestions'

describe('mobile workspace suggestions', () => {
  it('suggests safe desktop property keys and existing custom keys', () => {
    const withPriority = applyMobileWorkspaceEdit(workspaceScenarioForId('default'), {
      key: 'Priority',
      noteId: 'open-source-project',
      type: 'updateProperty',
      value: 'High',
    })
    const selectedNote = withPriority.notes.find((note) => note.id === 'workflow-orchestration') ?? null

    expect(mobilePropertyKeySuggestions(withPriority.notes, selectedNote, '')).toEqual(
      expect.arrayContaining(['Date', 'URL', 'Priority']),
    )
    expect(mobilePropertyKeySuggestions(withPriority.notes, selectedNote, 'prio')).toEqual(['Priority'])
    expect(mobilePropertyKeySuggestions(withPriority.notes, selectedNote, '')).not.toContain('Status')
  })

  it('suggests existing property values for the selected key', () => {
    const withPriority = applyMobileWorkspaceEdit(workspaceScenarioForId('default'), {
      key: 'Priority',
      noteId: 'workflow-orchestration',
      type: 'updateProperty',
      value: 'High',
    })

    expect(mobilePropertyValueSuggestions(withPriority.notes, 'Priority', '')).toContain('High')
    expect(mobilePropertyValueSuggestions(withPriority.notes, 'Status', 'ship')).toEqual(['Shipped'])
  })

  it('suggests canonical relationship keys plus custom vault relationship keys', () => {
    const suggestions = mobileRelationshipKeySuggestions(workspaceScenarioForId('default').notes, '')

    expect(suggestions.slice(0, 3)).toEqual(['belongs_to', 'related_to', 'has'])
    expect(mobileRelationshipKeySuggestions(workspaceScenarioForId('default').notes, 'ment')).toEqual(['Mentions'])
  })

  it('suggests desktop saved-view fields and values from notes', () => {
    const notes = workspaceScenarioForId('default').notes

    expect(mobileViewFieldSuggestions(notes, '').slice(0, 5)).toEqual(['type', 'status', 'title', 'favorite', 'body'])
    expect(mobileViewFieldSuggestions(notes, 'bel')).toContain('belongs_to')
    expect(mobileViewValueSuggestions(notes, 'type', 'ess')).toEqual(['Essay'])
    expect(mobileViewValueSuggestions(notes, 'belongs_to', 'mvp')).toContain('Tolaria MVP')
  })
})
