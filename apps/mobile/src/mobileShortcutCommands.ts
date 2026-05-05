export type MobileShortcutCommand =
  | 'editToggleRawEditor'
  | 'fileNewNote'
  | 'noteDelete'
  | 'noteToggleFavorite'
  | 'viewAll'
  | 'viewEditorList'
  | 'viewEditorOnly'
  | 'viewGoBack'
  | 'viewToggleProperties'

export type MobileShortcutBinding = {
  accelerator: string
  command: MobileShortcutCommand
}

export type MobileShortcutKeyPress = {
  altKey?: boolean
  ctrlKey?: boolean
  key: string
  metaKey?: boolean
  shiftKey?: boolean
}

export const mobileShortcutBindings: MobileShortcutBinding[] = [
  { accelerator: 'CmdOrCtrl+N', command: 'fileNewNote' },
  { accelerator: 'CmdOrCtrl+\\', command: 'editToggleRawEditor' },
  { accelerator: 'CmdOrCtrl+1', command: 'viewEditorOnly' },
  { accelerator: 'CmdOrCtrl+2', command: 'viewEditorList' },
  { accelerator: 'CmdOrCtrl+3', command: 'viewAll' },
  { accelerator: 'CmdOrCtrl+Shift+I', command: 'viewToggleProperties' },
  { accelerator: 'CmdOrCtrl+Left', command: 'viewGoBack' },
  { accelerator: 'CmdOrCtrl+Backspace', command: 'noteDelete' },
  { accelerator: 'CmdOrCtrl+D', command: 'noteToggleFavorite' },
]

export function mobileShortcutCommandFromKeyPress(event: MobileShortcutKeyPress) {
  const key = normalizedShortcutKey(event.key)
  if (!isEligibleShortcutEvent({ ...event, key })) {
    return null
  }

  return mobileShortcutBindings.find((binding) => binding.accelerator === acceleratorForKeyPress({ ...event, key }))?.command ?? null
}

function isEligibleShortcutEvent(event: MobileShortcutKeyPress) {
  return usesCommandModifier(event) && event.altKey !== true && normalizedShortcutKey(event.key) !== ''
}

function usesCommandModifier(event: MobileShortcutKeyPress) {
  return event.metaKey === true || event.ctrlKey === true
}

function acceleratorForKeyPress(event: MobileShortcutKeyPress) {
  const segments = ['CmdOrCtrl']
  if (event.shiftKey === true) {
    segments.push('Shift')
  }

  segments.push(normalizedShortcutKey(event.key))
  return segments.join('+')
}

function normalizedShortcutKey(key: string) {
  if (key === 'ArrowLeft') {
    return 'Left'
  }

  if (key === 'Delete') {
    return 'Backspace'
  }

  return key.length === 1 ? key.toUpperCase() : key
}
