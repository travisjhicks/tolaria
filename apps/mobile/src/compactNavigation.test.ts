import { describe, expect, it } from 'vitest'
import {
  createCompactNavigationState,
  transitionCompactNavigation,
  type CompactNavigationState,
} from './compactNavigation'

describe('compact mobile navigation', () => {
  it('starts on the note list with the first note selected', () => {
    expect(createCompactNavigationState('workflow')).toEqual({
      panel: 'list',
      selectedNoteId: 'workflow',
    })
  })

  it('opens a selected note from the list', () => {
    const next = transitionCompactNavigation(createCompactNavigationState('workflow'), {
      type: 'selectNote',
      noteId: 'release',
    })

    expect(next).toEqual({
      panel: 'note',
      selectedNoteId: 'release',
    })
  })

  it('returns from sidebar and note surfaces to the list', () => {
    expect(panelAfter({ type: 'openSidebar' })).toBe('sidebar')
    expect(panelAfter({ type: 'closeSidebar' }, 'sidebar')).toBe('list')
    expect(panelAfter({ type: 'backToList' }, 'note')).toBe('list')
  })

  it('opens and closes note properties without changing the selected note', () => {
    const noteState: CompactNavigationState = {
      panel: 'note',
      selectedNoteId: 'workflow',
    }

    const propertiesState = transitionCompactNavigation(noteState, { type: 'openProperties' })
    const closedState = transitionCompactNavigation(propertiesState, { type: 'closeProperties' })

    expect(propertiesState).toEqual({
      panel: 'properties',
      selectedNoteId: 'workflow',
    })
    expect(closedState).toEqual({
      panel: 'note',
      selectedNoteId: 'workflow',
    })
  })
})

function panelAfter(
  event: Parameters<typeof transitionCompactNavigation>[1],
  panel: CompactNavigationState['panel'] = 'list',
) {
  const state = transitionCompactNavigation({ panel, selectedNoteId: 'workflow' }, event)
  return state.panel
}
