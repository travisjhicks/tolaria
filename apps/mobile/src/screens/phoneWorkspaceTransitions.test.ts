import { describe, expect, it } from 'vitest'
import {
  phoneWorkspaceTransitionDirection,
  type PhoneWorkspaceState,
} from './phoneWorkspaceTransitions'

describe('phoneWorkspaceTransitionDirection', () => {
  it.each([
    ['list', 'sidebar', 'fromLeft'],
    ['sidebar', 'list', 'fromRight'],
    ['list', 'editor', 'fromRight'],
    ['editor', 'list', 'fromLeft'],
    ['editor', 'properties', 'fromRight'],
    ['properties', 'editor', 'fromLeft'],
  ] satisfies Array<[PhoneWorkspaceState, PhoneWorkspaceState, ReturnType<typeof phoneWorkspaceTransitionDirection>]>)(
    'moves from %s to %s as %s',
    (previousState, nextState, direction) => {
      expect(phoneWorkspaceTransitionDirection(previousState, nextState)).toBe(direction)
    },
  )

  it('does not slide when the phone state is unchanged', () => {
    expect(phoneWorkspaceTransitionDirection('list', 'list')).toBe('fade')
  })
})
