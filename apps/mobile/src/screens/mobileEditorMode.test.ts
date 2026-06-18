import { describe, expect, it } from 'vitest'
import { initialMobileEditorStateFromMode } from './mobileEditorMode'

describe('mobile editor mode URL state', () => {
  it('keeps the default route in read mode', () => {
    expect(initialMobileEditorStateFromMode(null)).toEqual({
      initialEditorEditing: false,
      initialEditorEditingMode: 'wysiwyg',
    })
  })

  it('opens the source editor for raw-mode QA routes', () => {
    expect(initialMobileEditorStateFromMode('raw')).toEqual({
      initialEditorEditing: true,
      initialEditorEditingMode: 'source',
    })
    expect(initialMobileEditorStateFromMode('source')).toEqual({
      initialEditorEditing: true,
      initialEditorEditingMode: 'source',
    })
  })

  it('opens the native TenTap editor for wysiwyg-mode QA routes', () => {
    expect(initialMobileEditorStateFromMode('wysiwyg')).toEqual({
      initialEditorEditing: true,
      initialEditorEditingMode: 'wysiwyg',
    })
  })
})
