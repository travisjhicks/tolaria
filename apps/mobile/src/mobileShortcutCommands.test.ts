import { describe, expect, it } from 'vitest'
import desktopCommandManifest from '../../../src/shared/appCommandManifest.json'
import { mobileShortcutBindings, mobileShortcutCommandFromKeyPress } from './mobileShortcutCommands'

describe('mobile shortcut commands', () => {
  it('keeps core mobile shortcuts aligned with desktop accelerators', () => {
    const desktopCommands = desktopCommandManifest.commands

    for (const binding of mobileShortcutBindings) {
      expect(desktopCommands[binding.command].shortcut?.accelerator).toBe(binding.accelerator)
    }
  })

  it('maps hardware keyboard events to mobile workflow commands', () => {
    expect(mobileShortcutCommandFromKeyPress({ key: 'n', metaKey: true })).toBe('fileNewNote')
    expect(mobileShortcutCommandFromKeyPress({ key: '\\', metaKey: true })).toBe('editToggleRawEditor')
    expect(mobileShortcutCommandFromKeyPress({ key: 'i', metaKey: true, shiftKey: true })).toBe('viewToggleProperties')
    expect(mobileShortcutCommandFromKeyPress({ key: 'Backspace', metaKey: true })).toBe('noteDelete')
  })

  it('ignores unmodified and alternative-modified keys', () => {
    expect(mobileShortcutCommandFromKeyPress({ key: 'n' })).toBeNull()
    expect(mobileShortcutCommandFromKeyPress({ altKey: true, key: 'n', metaKey: true })).toBeNull()
  })
})
