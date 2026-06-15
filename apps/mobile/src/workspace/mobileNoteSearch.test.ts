import { describe, expect, it } from 'vitest'
import { mobileNoteDisplayLabels } from './mobileNoteDisplay'
import { mobileNoteListMatchesQuery } from './mobileNoteSearch'
import type { MobileNote } from './mobileWorkspaceModel'

describe('mobile note search', () => {
  it('uses configured note-list chip labels for displayed properties and relationships', () => {
    const candidate = note({
      properties: [
        { key: 'Priority', label: 'Priority', value: 'High' },
        { key: 'Score', label: 'Score', value: 3 },
      ],
      relationships: [{
        kind: 'belongsTo',
        key: 'belongs_to',
        values: [{ id: 'llm-workflow', title: 'LLM Workflow', type: 'Essay', typeTone: 'green' }],
      }, {
        kind: 'custom',
        key: 'Owner',
        label: 'Owner',
        values: [{ id: 'person-luca', title: 'Luca', type: 'Person', typeTone: 'blue' }],
      }],
    })

    expect(mobileNoteDisplayLabels(candidate, ['Priority', 'belongs_to', 'Owner'])).toEqual([
      'High',
      'LLM Workflow',
      'Luca',
    ])
    expect(mobileNoteListMatchesQuery(candidate, 'llm workflow', ['belongs_to'])).toBe(true)
    expect(mobileNoteListMatchesQuery(candidate, 'high', ['Priority'])).toBe(true)
    expect(mobileNoteListMatchesQuery(candidate, 'luca', ['Owner'])).toBe(true)
    expect(mobileNoteListMatchesQuery(candidate, 'llm workflow', ['Priority'])).toBe(false)
  })

  it('keeps title, snippet, and default row chips searchable without a display override', () => {
    const candidate = note({
      snippet: 'Release cleanup checklist',
      status: 'Active',
      tags: ['Design'],
      title: 'v2026-05-02',
      type: 'Procedure',
      typeTone: 'purple',
    })

    expect(mobileNoteListMatchesQuery(candidate, 'release cleanup')).toBe(true)
    expect(mobileNoteListMatchesQuery(candidate, 'procedure')).toBe(true)
    expect(mobileNoteListMatchesQuery(candidate, 'active')).toBe(true)
    expect(mobileNoteListMatchesQuery(candidate, 'design')).toBe(true)
  })
})

function note(overrides: Partial<MobileNote>): MobileNote {
  return {
    created: '-',
    date: '-',
    favorite: false,
    id: 'note',
    links: 0,
    modified: '-',
    relationships: [],
    snippet: '',
    status: '',
    tags: [],
    title: 'Note',
    type: 'Note',
    typeTone: 'gray',
    workspace: 'TV',
    ...overrides,
  }
}
