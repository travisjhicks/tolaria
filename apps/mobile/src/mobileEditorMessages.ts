export type MobileEditorMessage =
  | { target: string; type: 'openWikilink' }
  | { command: 'fileNewNote'; type: 'shortcut' }
  | { direction: 'in' | 'out'; type: 'listIndent' }
  | { query: string | null; type: 'wikilinkQuery' }

export function parseEditorMessage(data: string): MobileEditorMessage | null {
  try {
    return normalizeEditorMessage(JSON.parse(data))
  } catch {
    return null
  }
}

function normalizeEditorMessage(value: unknown): MobileEditorMessage | null {
  if (!isMessageRecord(value)) {
    return null
  }
  if (isWikilinkQueryMessage(value)) {
    return { query: value.query, type: 'wikilinkQuery' }
  }
  if (isListIndentMessage(value)) {
    return { direction: value.direction, type: 'listIndent' }
  }
  if (value.type === 'openWikilink' && typeof value.target === 'string') {
    return { target: value.target, type: 'openWikilink' }
  }
  if (value.type === 'shortcut' && value.command === 'fileNewNote') {
    return { command: 'fileNewNote', type: 'shortcut' }
  }

  return null
}

function isMessageRecord(value: unknown): value is {
  command?: unknown
  direction?: unknown
  query?: unknown
  target?: unknown
  type?: unknown
} {
  return typeof value === 'object' && value !== null
}

function isWikilinkQueryMessage(value: {
  query?: unknown
  type?: unknown
}): value is {
  query: string | null
  type: 'wikilinkQuery'
} {
  return value.type === 'wikilinkQuery'
    && (typeof value.query === 'string' || value.query === null)
}

function isListIndentMessage(value: {
  direction?: unknown
  type?: unknown
}): value is {
  direction: 'in' | 'out'
  type: 'listIndent'
} {
  return value.type === 'listIndent'
    && (value.direction === 'in' || value.direction === 'out')
}
