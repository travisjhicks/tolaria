import { describe, expect, it } from 'vitest'
import { workspaceScenarioForId } from '../fixtures/workspaceFixtures'
import { applyMobileWorkspaceEdit } from './mobileWorkspaceEditing'
import {
  mobileFolderSuggestions,
  mobileDefaultListPropertyDisplay,
  mobileListPropertySuggestions,
  mobilePropertyKeySuggestions,
  mobilePropertyValueSuggestions,
  mobileRelationshipKeySuggestions,
  mobileTypeSuggestions,
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

  it('suggests retargeting types and folders excluding the selected note destination', () => {
    const notes = workspaceScenarioForId('default').notes
    const selectedNote = notes[2] ?? null

    expect(mobileTypeSuggestions(notes, selectedNote, '')).toEqual(['Essay', 'Procedure'])
    expect(mobileFolderSuggestions(notes, selectedNote, '')).toEqual(['Tolaria/Mobile UI'])
    expect(mobileFolderSuggestions(notes, selectedNote, 'mobile')).toEqual(['Tolaria/Mobile UI'])
  })

  it('suggests desktop saved-view fields and values from notes', () => {
    const notes = workspaceScenarioForId('default').notes

    expect(mobileViewFieldSuggestions(notes, '').slice(0, 5)).toEqual(['type', 'status', 'title', 'favorite', 'body'])
    expect(mobileViewFieldSuggestions(notes, 'bel')).toContain('belongs_to')
    expect(mobileViewValueSuggestions(notes, 'type', 'ess')).toEqual(['Essay'])
    expect(mobileViewValueSuggestions(notes, 'belongs_to', 'mvp')).toContain('Tolaria MVP')
  })

  it('suggests desktop note-list display properties and derives type defaults', () => {
    const scenario = workspaceScenarioForId('default')
    const notes = scenario.notes

    expect(mobileListPropertySuggestions(notes, '')).toEqual(
      expect.arrayContaining(['belongs_to', 'Mentions', 'status', 'tags']),
    )
    expect(mobileListPropertySuggestions(notes, 'bel')).toEqual(['belongs_to'])
    expect(mobileDefaultListPropertyDisplay(notes, {
      Essay: { listPropertiesDisplay: ['status', 'belongs_to'] },
      Procedure: { listPropertiesDisplay: ['tags', 'status'] },
    })).toEqual(['status', 'belongs_to', 'tags'])
  })
})
