import { describe, expect, it } from 'vitest'
import {
  filterNotesBySearch,
  noteListPropertiesForSelection,
  notesForSidebarSelection,
  type TabletSidebarSelection,
} from './tabletWorkspaceNavigation'
import type { MobileNote, MobileWorkspaceSnapshot } from '../workspace/mobileWorkspaceModel'

describe('tablet workspace navigation', () => {
  it('uses canonical type names for renamed desktop Type sidebar sections', () => {
    const snapshot = workspaceSnapshot([
      note({ id: 'high', properties: [{ key: 'Priority', label: 'Priority', value: 1 }], title: 'High', type: 'Project' }),
      note({ id: 'low', properties: [{ key: 'Priority', label: 'Priority', value: 2 }], title: 'Low', type: 'Project' }),
      note({ id: 'label-match', title: 'Wrong Type', type: 'Client Work' }),
      note({ id: 'plain-note', title: 'Plain', type: 'Note' }),
    ])
    const selection: TabletSidebarSelection = {
      id: 'type-project',
      kind: 'item',
      label: 'Client Work',
      sectionId: 'types',
      typeName: 'Project',
    }

    expect(notesForSidebarSelection(snapshot, selection).map((candidate) => candidate.id)).toEqual(['high', 'low'])
    expect(noteListPropertiesForSelection(snapshot, selection)).toEqual(['Priority', 'belongs_to'])
  })

  it('filters note lists by displayed desktop property and relationship chips', () => {
    const notes = [
      note({
        id: 'workflow',
        properties: [{ key: 'Priority', label: 'Priority', value: 'High' }],
        relationships: [{
          kind: 'belongsTo',
          key: 'belongs_to',
          values: [{ id: 'parent', title: 'LLM Workflow', type: 'Essay', typeTone: 'green' }],
        }],
        title: 'Workflow Orchestration',
      }),
      note({
        id: 'release',
        properties: [{ key: 'Priority', label: 'Priority', value: 'Low' }],
        title: 'Release Notes',
      }),
    ]

    expect(filterNotesBySearch(notes, 'llm workflow', ['belongs_to']).map((candidate) => candidate.id)).toEqual(['workflow'])
    expect(filterNotesBySearch(notes, 'high', ['Priority']).map((candidate) => candidate.id)).toEqual(['workflow'])
    expect(filterNotesBySearch(notes, 'llm workflow', ['Priority'])).toEqual([])
  })
})

function workspaceSnapshot(notes: MobileNote[]): MobileWorkspaceSnapshot {
  return {
    allNotes: notes,
    editorBlocks: [],
    editorBullets: [],
    noteListSubtitle: String(notes.length),
    notes,
    sidebarSections: [{
      id: 'types',
      items: [{
        count: '2',
        icon: 'file',
        id: 'type-project',
        label: 'Client Work',
        typeName: 'Project',
      }],
      label: 'Types',
    }],
    sync: { kind: 'synced', minutesAgo: 0 },
    typeDefinitions: {
      Project: {
        label: 'Client Work',
        listPropertiesDisplay: ['Priority', 'belongs_to'],
        sort: 'property:Priority:asc',
      },
    },
  }
}

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
