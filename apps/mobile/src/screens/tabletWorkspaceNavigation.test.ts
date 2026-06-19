import { describe, expect, it } from 'vitest'
import {
  favoriteNeighborhoodSelectionForSidebarItem,
  filterNotesBySearch,
  noteListFilterCountsForSelection,
  noteListPropertiesForSelection,
  notesForSidebarSelection,
  type TabletSidebarSelection,
} from './tabletWorkspaceNavigation'
import type { MobileNote, MobileWorkspaceSnapshot } from '../workspace/mobileWorkspaceModel'

describe('tablet workspace navigation', () => {
  it('uses canonical type names for renamed desktop Type sidebar sections', () => {
    const snapshot = workspaceSnapshot([
      note({ archived: true, id: 'archived', properties: [{ key: 'Priority', label: 'Priority', value: 0 }], title: 'Archived', type: 'Project' }),
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
    expect(noteListFilterCountsForSelection(snapshot, selection)).toEqual({ archived: 1, open: 2 })
    expect(notesForSidebarSelection(snapshot, selection, { noteListFilter: 'archived' }).map((candidate) => candidate.id)).toEqual(['archived'])
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

  it('uses Type display defaults for primary note-list search until a primary override is set', () => {
    const notes = [
      note({
        id: 'workflow',
        properties: [{ key: 'Priority', label: 'Priority', value: 'High' }],
        title: 'Workflow Orchestration',
        type: 'Essay',
      }),
      note({
        id: 'release',
        properties: [{ key: 'Priority', label: 'Priority', value: 'Low' }],
        title: 'Release Notes',
        type: 'Procedure',
      }),
    ]
    const snapshot = {
      ...workspaceSnapshot(notes),
      noteListPropertyOverrides: { allNotes: ['tags'] },
      typeDefinitions: {
        Essay: { listPropertiesDisplay: ['Priority'] },
        Procedure: { listPropertiesDisplay: ['Priority'] },
      },
    }
    const allNotesSelection: TabletSidebarSelection = {
      id: 'all-notes',
      kind: 'item',
      label: 'All Notes',
      sectionId: 'primary',
    }

    expect(filterNotesBySearch(notes, 'high', [], snapshot.typeDefinitions).map((candidate) => candidate.id)).toEqual(['workflow'])
    expect(noteListPropertiesForSelection(snapshot, allNotesSelection)).toEqual(['tags'])
    expect(filterNotesBySearch(notes, 'high', noteListPropertiesForSelection(snapshot, allNotesSelection), snapshot.typeDefinitions)).toEqual([])
  })

  it('opens the selected active favorite note instead of every favorite or title match', () => {
    const snapshot = workspaceSnapshot([
      note({ favorite: true, id: 'selected', title: 'Journal' }),
      note({ id: 'same-title', title: 'Journal' }),
      note({ archived: true, favorite: true, id: 'archived-favorite', title: 'Archived' }),
      note({ favorite: true, id: 'other-favorite', title: 'Other' }),
    ])

    expect(notesForSidebarSelection(snapshot, {
      id: 'favorite-selected',
      kind: 'item',
      label: 'Journal',
      sectionId: 'favorites',
    }).map((candidate) => candidate.id)).toEqual(['selected'])
  })

  it('resolves favorite sidebar items to desktop Neighborhood selections', () => {
    const snapshot = workspaceSnapshot([
      note({ favorite: true, id: 'alpha', title: 'Alpha' }),
      note({ favorite: true, id: 'duplicate-title', title: 'Journal' }),
      note({ archived: true, favorite: true, id: 'archived', title: 'Archived' }),
    ])

    expect(favoriteNeighborhoodSelectionForSidebarItem(snapshot, {
      id: 'favorite-alpha',
      label: 'Different label',
      sectionId: 'favorites',
    })).toEqual({
      id: 'alpha',
      kind: 'entity',
      label: 'Alpha',
    })
    expect(favoriteNeighborhoodSelectionForSidebarItem(snapshot, {
      id: 'legacy-journal',
      label: 'Journal',
      sectionId: 'favorites',
    })).toEqual({
      id: 'duplicate-title',
      kind: 'entity',
      label: 'Journal',
    })
    expect(favoriteNeighborhoodSelectionForSidebarItem(snapshot, {
      id: 'favorite-archived',
      label: 'Archived',
      sectionId: 'favorites',
    })).toBeNull()
    expect(favoriteNeighborhoodSelectionForSidebarItem(snapshot, {
      id: 'all-notes',
      label: 'All Notes',
      sectionId: 'primary',
    })).toBeNull()
  })

  it('keeps inbox limited to active unorganized non-Type notes', () => {
    const inboxSelection: TabletSidebarSelection = {
      id: 'inbox',
      kind: 'item',
      label: 'Inbox',
      sectionId: 'primary',
    }

    expect(notesForSidebarSelection(workspaceSnapshot([
      note({ id: 'organized', organized: true, title: 'Organized' }),
      note({ archived: true, id: 'archived', title: 'Archived' }),
    ]), inboxSelection)).toEqual([])

    expect(notesForSidebarSelection(workspaceSnapshot([
      note({ id: 'capture', title: 'Capture' }),
      note({ id: 'type-doc', title: 'Type Doc', type: 'Type' }),
      note({ organized: true, id: 'organized', title: 'Organized' }),
    ]), inboxSelection).map((candidate) => candidate.id)).toEqual(['capture'])
  })

  it('keeps primary filters markdown-only while folder navigation can show file entries', () => {
    const snapshot = workspaceSnapshot([
      note({ id: 'root', path: 'Root.md', title: 'Root' }),
      note({ fileKind: 'text', id: 'docs/config.yml', path: 'docs/config.yml', title: 'config.yml', type: 'File' }),
      note({ fileKind: 'binary', id: 'docs/logo.png', path: 'docs/logo.png', title: 'logo.png', type: 'File' }),
      note({ id: 'attachments/reference.md', path: 'attachments/reference.md', title: 'Reference' }),
      note({ archived: true, id: 'archive/old.md', path: 'archive/old.md', title: 'Old' }),
      note({ archived: true, fileKind: 'binary', id: 'archive/old.zip', path: 'archive/old.zip', title: 'old.zip', type: 'File' }),
    ])

    expect(notesForSidebarSelection(snapshot, {
      id: 'all-notes',
      kind: 'item',
      label: 'All Notes',
      sectionId: 'primary',
    }).map((candidate) => candidate.id)).toEqual(['root'])
    expect(notesForSidebarSelection(snapshot, {
      id: 'all-notes',
      kind: 'item',
      label: 'All Notes',
      sectionId: 'primary',
    }, { noteListFilter: 'archived' }).map((candidate) => candidate.id)).toEqual(['root'])
    expect(notesForSidebarSelection(snapshot, {
      id: 'archive',
      kind: 'item',
      label: 'Archive',
      sectionId: 'primary',
    }).map((candidate) => candidate.id)).toEqual(['archive/old.md'])
    expect(notesForSidebarSelection(snapshot, {
      id: 'docs',
      kind: 'folder',
      label: 'docs',
    }).map((candidate) => candidate.id)).toEqual(['docs/config.yml', 'docs/logo.png'])
  })

  it('selects folders by path and includes descendants without matching duplicate labels', () => {
    const snapshot = workspaceSnapshot([
      note({ id: 'writing-root', path: 'Writing/Root.md', title: 'Root' }),
      note({ id: 'writing-project', path: 'Writing/Projects/Alpha.md', title: 'Alpha' }),
      note({ archived: true, id: 'writing-archived', path: 'Writing/Archived.md', title: 'Archived' }),
      note({ id: 'other-project', path: 'Other/Projects/Beta.md', title: 'Beta' }),
      note({ id: 'other-root', path: 'Other/Root.md', title: 'Other root' }),
    ])

    expect(notesForSidebarSelection(snapshot, {
      id: 'Writing',
      kind: 'folder',
      label: 'Writing',
    }).map((candidate) => candidate.id)).toEqual(['writing-root', 'writing-project'])
    expect(noteListFilterCountsForSelection(snapshot, {
      id: 'Writing',
      kind: 'folder',
      label: 'Writing',
    })).toEqual({ archived: 1, open: 2 })
    expect(notesForSidebarSelection(snapshot, {
      id: 'Writing',
      kind: 'folder',
      label: 'Writing',
    }, { noteListFilter: 'archived' }).map((candidate) => candidate.id)).toEqual(['writing-archived'])

    expect(notesForSidebarSelection(snapshot, {
      id: 'Writing/Projects',
      kind: 'folder',
      label: 'Projects',
    }).map((candidate) => candidate.id)).toEqual(['writing-project'])
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
