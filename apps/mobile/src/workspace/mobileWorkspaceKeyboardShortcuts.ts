import { useEffect } from 'react'

type KeyboardShortcutHandlers = {
  onCreateNote?: () => void
  onOpenFindInNote?: () => void
  onOpenCommandPalette: () => void
  onOpenSearch: () => void
  onSelectNextNote?: () => void
  onSelectPreviousNote?: () => void
  onToggleRawEditor?: () => void
}
type MobileWorkspaceKeyboardAction =
  | 'commandPalette'
  | 'createNote'
  | 'findInNote'
  | 'nextNote'
  | 'previousNote'
  | 'search'
  | 'toggleRawEditor'

type KeyboardDocument = {
  addEventListener: (type: 'keydown', listener: (event: KeyboardEvent) => void) => void
  removeEventListener: (type: 'keydown', listener: (event: KeyboardEvent) => void) => void
}

export function useMobileWorkspaceKeyboardShortcuts({
  onCreateNote,
  onOpenFindInNote,
  onOpenCommandPalette,
  onOpenSearch,
  onSelectNextNote,
  onSelectPreviousNote,
  onToggleRawEditor,
}: KeyboardShortcutHandlers) {
  useEffect(() => {
    const document = keyboardDocument()
    if (!document) return undefined

    const handleKeyDown = (event: KeyboardEvent) => {
      const action = mobileWorkspaceKeyboardAction(event)
      if (!action) return
      if (noteNavigationAction(action) && keyboardEventTargetAcceptsTextInput(event)) return

      event.preventDefault()
      if (action === 'commandPalette') onOpenCommandPalette()
      else if (action === 'findInNote') onOpenFindInNote?.()
      else if (action === 'nextNote') onSelectNextNote?.()
      else if (action === 'previousNote') onSelectPreviousNote?.()
      else if (action === 'search') onOpenSearch()
      else if (action === 'toggleRawEditor') onToggleRawEditor?.()
      else onCreateNote?.()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [
    onCreateNote,
    onOpenCommandPalette,
    onOpenFindInNote,
    onOpenSearch,
    onSelectNextNote,
    onSelectPreviousNote,
    onToggleRawEditor,
  ])
}

function keyboardDocument(): KeyboardDocument | null {
  const maybeDocument = (globalThis as { document?: KeyboardDocument }).document
  return maybeDocument ?? null
}

export function mobileWorkspaceKeyboardAction(
  event: Pick<KeyboardEvent, 'altKey' | 'ctrlKey' | 'key' | 'metaKey' | 'shiftKey'>,
): MobileWorkspaceKeyboardAction | null {
  const key = event.key.toLowerCase()
  if (!event.metaKey && !event.ctrlKey) {
    if (event.altKey || event.shiftKey) return null
    if (key === 'arrowdown') return 'nextNote'
    if (key === 'arrowup') return 'previousNote'
    return null
  }
  if (event.altKey || event.shiftKey) return null

  if (key === 'k') return 'commandPalette'
  if (key === 'f') return 'findInNote'
  if (key === 'o' || key === 'p') return 'search'
  if (key === '\\' || key === 'backslash') return 'toggleRawEditor'
  if (key === 'n') return 'createNote'
  return null
}

function noteNavigationAction(action: MobileWorkspaceKeyboardAction) {
  return action === 'nextNote' || action === 'previousNote'
}

function keyboardEventTargetAcceptsTextInput(event: KeyboardEvent) {
  const target = event.target as { isContentEditable?: boolean; tagName?: string } | null
  if (!target) return false
  const tagName = target.tagName?.toLowerCase()

  return target.isContentEditable === true || tagName === 'input' || tagName === 'textarea'
}
