import { describe, expect, it } from 'vitest'
import { mobileWorkspaceKeyboardAction } from './mobileWorkspaceKeyboardShortcuts'

describe('mobile workspace keyboard shortcuts', () => {
  it('opens quick search from desktop quick-open shortcuts', () => {
    expect(shortcut('o')).toBe('search')
    expect(shortcut('p')).toBe('search')
  })

  it('opens the command palette from the desktop command palette shortcut', () => {
    expect(shortcut('k')).toBe('commandPalette')
  })

  it('opens find in note from the desktop find shortcut', () => {
    expect(shortcut('f')).toBe('findInNote')
  })

  it('toggles the raw editor from the desktop raw-editor shortcut', () => {
    expect(shortcut('\\')).toBe('toggleRawEditor')
    expect(shortcut('Backslash')).toBe('toggleRawEditor')
  })

  it('moves across visible notes with unmodified arrow keys', () => {
    expect(unmodifiedShortcut('ArrowDown')).toBe('nextNote')
    expect(unmodifiedShortcut('ArrowUp')).toBe('previousNote')
  })

  it('ignores shifted or unmodified keys', () => {
    expect(shortcut('k', { shiftKey: true })).toBeNull()
    expect(unmodifiedShortcut('k')).toBeNull()
  })
})

function shortcut(
  key: string,
  overrides: Partial<Pick<KeyboardEvent, 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey'>> = {},
) {
  return mobileWorkspaceKeyboardAction({
    altKey: false,
    ctrlKey: false,
    key,
    metaKey: true,
    shiftKey: false,
    ...overrides,
  })
}

function unmodifiedShortcut(key: string) {
  return mobileWorkspaceKeyboardAction({
    altKey: false,
    ctrlKey: false,
    key,
    metaKey: false,
    shiftKey: false,
  })
}
