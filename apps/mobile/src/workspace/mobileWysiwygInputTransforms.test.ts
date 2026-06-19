import { describe, expect, it } from 'vitest'
import { tiptapJsonToMobileMarkdown, type TiptapJsonNode } from './mobileDocumentContent'
import { nativeWysiwygDocumentWithInputTransforms } from './mobileWysiwygInputTransforms'

describe('native WYSIWYG input transforms', () => {
  it.each([
    ['Flow ->', 8, 'Flow →'],
    ['Flow <-', 8, 'Flow ←'],
    ['Flow <->', 9, 'Flow ↔'],
    ['Flow ←>', 8, 'Flow ↔'],
  ])('applies desktop arrow ligatures for %s', (text, cursor, expectedMarkdown) => {
    const nextDocument = nativeWysiwygDocumentWithInputTransforms({
      json: documentNode(paragraphNode(text)),
      selection: { from: cursor, to: cursor },
    })

    expect(tiptapJsonToMobileMarkdown(nextDocument)).toBe(expectedMarkdown)
  })

  it.each([
    ['Flow \\->', 9, 'Flow ->'],
    ['Flow \\<-', 9, 'Flow <-'],
    ['Flow \\<->', 10, 'Flow <->'],
  ])('keeps escaped desktop arrow input literal for %s', (text, cursor, expectedMarkdown) => {
    const nextDocument = nativeWysiwygDocumentWithInputTransforms({
      json: documentNode(paragraphNode(text)),
      selection: { from: cursor, to: cursor },
    })

    expect(tiptapJsonToMobileMarkdown(nextDocument)).toBe(expectedMarkdown)
  })

  it('turns completed desktop highlight syntax into a native mark', () => {
    const nextDocument = nativeWysiwygDocumentWithInputTransforms({
      json: documentNode(paragraphNode('Use ==marked== today.')),
      selection: { from: 15, to: 15 },
    })

    expect(tiptapJsonToMobileMarkdown(nextDocument)).toBe('Use ==marked== today.')
    expect(paragraphMarks(nextDocument)).toContain('highlight')
  })

  it('does not transform empty, whitespace-padded, or code-marked highlight syntax', () => {
    for (const text of ['Use ==== today.', 'Use == marked== today.', 'Use ==marked == today.']) {
      expect(nativeWysiwygDocumentWithInputTransforms({
        json: documentNode(paragraphNode(text)),
        selection: { from: 1 + text.indexOf('== today.') + 2, to: 1 + text.indexOf('== today.') + 2 },
      })).toBeNull()
    }

    expect(nativeWysiwygDocumentWithInputTransforms({
      json: documentNode(paragraphNode('Use ==marked==', [{ type: 'code' }])),
      selection: { from: 15, to: 15 },
    })).toBeNull()
  })

  it('does not transform inside code-marked arrow text', () => {
    expect(nativeWysiwygDocumentWithInputTransforms({
      json: documentNode(paragraphNode('Flow ->', [{ type: 'code' }])),
      selection: { from: 8, to: 8 },
    })).toBeNull()
  })
})

function paragraphMarks(node: TiptapJsonNode | null): string[] {
  return node?.content
    ?.flatMap((block) => block.content ?? [])
    .flatMap((inline) => inline.marks ?? [])
    .map((mark) => mark.type ?? '')
    .filter(Boolean) ?? []
}

function documentNode(...content: TiptapJsonNode[]): TiptapJsonNode {
  return { content, type: 'doc' }
}

function paragraphNode(text: string, marks?: TiptapJsonNode['marks']): TiptapJsonNode {
  return {
    content: [{ marks, text, type: 'text' }],
    type: 'paragraph',
  }
}
