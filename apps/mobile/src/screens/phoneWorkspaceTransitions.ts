export type PhoneWorkspaceState = 'editor' | 'list' | 'properties' | 'sidebar'
export type PhoneWorkspaceTransitionDirection = 'fade' | 'fromLeft' | 'fromRight'

export const phoneWorkspaceTransitionDurationMs = 180

const phoneStateOrder = {
  sidebar: 0,
  list: 1,
  editor: 2,
  properties: 3,
} satisfies Record<PhoneWorkspaceState, number>

export function phoneWorkspaceTransitionDirection(
  previousState: PhoneWorkspaceState,
  nextState: PhoneWorkspaceState,
): PhoneWorkspaceTransitionDirection {
  if (previousState === nextState) return 'fade'
  return phoneStateOrder[nextState] > phoneStateOrder[previousState] ? 'fromRight' : 'fromLeft'
}
