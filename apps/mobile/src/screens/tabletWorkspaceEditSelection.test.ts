import { describe, expect, it } from 'vitest'
import { workspaceScenarioForId } from '../fixtures/workspaceFixtures'
import { applyMobileWorkspaceEditWithWrites, type MobileWorkspaceEdit } from '../workspace/mobileWorkspaceEditing'
import { selectAfterWorkspaceEdit } from './tabletWorkspaceEditSelection'
import type { TabletSidebarSelection } from './tabletWorkspaceNavigation'

describe('tablet workspace edit selection', () => {
  it('selects the newly created relationship target note', () => {
    const base = workspaceScenarioForId('default')
    const sourceNote = {
      ...base.notes[0],
      rawContent: '# Workflow Orchestration Essay\n\nSource body.\n',
    }
    const snapshot = {
      ...base,
      allNotes: [sourceNote, ...base.notes.slice(1)],
      notes: [sourceNote, ...base.notes.slice(1)],
      selectedNoteId: sourceNote.id,
    }
    const edit: MobileWorkspaceEdit = {
      key: 'related_to',
      sourceNoteId: sourceNote.id,
      targetTitle: 'Brand New Target',
      type: 'createRelationshipTarget',
    }
    const result = applyMobileWorkspaceEditWithWrites(snapshot, edit)
    const selectedNoteIds: Array<string | null> = []

    selectAfterWorkspaceEdit({
      edit,
      navigation: inertNavigation(),
      result,
      setSelectedNoteId: (noteId) => selectedNoteIds.push(noteId),
    })

    expect(selectedNoteIds).toEqual(['Tolaria/Mobile UI/brand-new-target.md'])
  })

  it('selects a newly created Type section', () => {
    const snapshot = workspaceScenarioForId('default')
    const edit: MobileWorkspaceEdit = { type: 'createTypeDefinition', typeName: 'Decision' }
    const result = applyMobileWorkspaceEditWithWrites(snapshot, edit)
    const selectedItems: unknown[] = []

    selectAfterWorkspaceEdit({
      edit,
      navigation: inertNavigation({ selectSidebarItem: (selection) => { selectedItems.push(selection) } }),
      result,
      setSelectedNoteId: () => {},
    })

    expect(selectedItems).toEqual([expect.objectContaining({
      id: 'type-decision',
      label: 'Decisions',
      sectionId: 'types',
      typeName: 'Decision',
    })])
  })

  it('returns to the default section when deleting the selected Type document', () => {
    const snapshot = workspaceScenarioForId('default')
    const edit: MobileWorkspaceEdit = { type: 'deleteTypeDefinition', typeName: 'Procedure' }
    const result = applyMobileWorkspaceEditWithWrites(snapshot, edit)
    let selectedDefault = false

    selectAfterWorkspaceEdit({
      edit,
      navigation: inertNavigation({
        selectDefaultSidebarItem: () => { selectedDefault = true },
        sidebarSelection: {
          count: '1',
          id: 'type-procedure',
          kind: 'item',
          label: 'Procedures',
          sectionId: 'types',
          typeName: 'Procedure',
        },
      }),
      result,
      setSelectedNoteId: () => {},
    })

    expect(selectedDefault).toBe(true)
  })
})

type InertNavigationForTest = {
  selectDefaultSidebarItem: () => void
  selectFolder: () => void
  selectSavedView: () => void
  selectSidebarItem: (selection: SidebarItemSelectionForTest) => void
  sidebarSelection: TabletSidebarSelection
}

function inertNavigation(overrides: Partial<InertNavigationForTest> = {}): InertNavigationForTest {
  return {
    ...inertNavigationDefaults(),
    ...overrides,
  }
}

function inertNavigationDefaults(): InertNavigationForTest {
  const sidebarSelection: TabletSidebarSelection = {
    count: '7',
    id: 'inbox',
    kind: 'item',
    label: 'Inbox',
    sectionId: 'primary',
  }

  return {
    selectDefaultSidebarItem: () => {},
    selectFolder: () => {},
    selectSavedView: () => {},
    selectSidebarItem: () => {},
    sidebarSelection,
  }
}

type SidebarItemSelectionForTest = {
  count?: string
  id: string
  label: string
  sectionId: string
  typeName?: string
  viewId?: string
}
