import { describe, expect, it } from 'vitest'
import { parseEditorMessage } from './mobileEditorMessages'

describe('mobile editor messages', () => {
  it('parses hardware Tab list indentation messages', () => {
    expect(parseEditorMessage(JSON.stringify({
      direction: 'in',
      type: 'listIndent',
    }))).toEqual({
      direction: 'in',
      type: 'listIndent',
    })

    expect(parseEditorMessage(JSON.stringify({
      direction: 'out',
      type: 'listIndent',
    }))).toEqual({
      direction: 'out',
      type: 'listIndent',
    })
  })

  it('rejects malformed list indentation messages', () => {
    expect(parseEditorMessage(JSON.stringify({
      direction: 'sideways',
      type: 'listIndent',
    }))).toBeNull()
  })
})
