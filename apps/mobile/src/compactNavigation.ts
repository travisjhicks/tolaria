export type CompactPanel = 'sidebar' | 'list' | 'note' | 'properties'

export type CompactNavigationState = {
  panel: CompactPanel
  selectedNoteId: string
}

export type CompactNavigationEvent =
  | { type: 'backToList' }
  | { type: 'closeProperties' }
  | { type: 'closeSidebar' }
  | { type: 'openProperties' }
  | { type: 'openSidebar' }
  | { type: 'selectNote'; noteId: string }

export function createCompactNavigationState(initialNoteId: string): CompactNavigationState {
  return {
    panel: 'list',
    selectedNoteId: initialNoteId,
  }
}

export function transitionCompactNavigation(
  state: CompactNavigationState,
  event: CompactNavigationEvent,
): CompactNavigationState {
  if (event.type === 'selectNote') {
    return { panel: 'note', selectedNoteId: event.noteId }
  }

  return {
    ...state,
    panel: nextPanel(state.panel, event),
  }
}

function nextPanel(currentPanel: CompactPanel, event: Exclude<CompactNavigationEvent, { type: 'selectNote' }>) {
  if (event.type === 'openSidebar') {
    return 'sidebar'
  }

  if (event.type === 'closeSidebar' || event.type === 'backToList') {
    return 'list'
  }

  if (event.type === 'openProperties') {
    return 'properties'
  }

  if (event.type === 'closeProperties') {
    return 'note'
  }

  return currentPanel
}
