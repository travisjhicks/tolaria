import { describe, expect, it } from 'vitest'
import {
  mobileMarkdownBodyToTentapHtml,
  tiptapJsonToMobileMarkdown,
  type TiptapJsonNode,
} from './mobileDocumentContent'

describe('mobile document list hard breaks', () => {
  it('keeps list items with two-space hard breaks editable as source', () => {
    const html = mobileMarkdownBodyToTentapHtml('- Awesome CursorRules  \n- Project rules\n')

    expect(html).toBe('<p>- Awesome CursorRules  <br>- Project rules</p>')
    expect(html).not.toContain('<ul>')
  })

  it('keeps list items with backslash hard breaks editable as source', () => {
    const html = mobileMarkdownBodyToTentapHtml('- positive camber = top of tire closer\\\n- negative camber = top farther\n')

    expect(html).toBe('<p>- positive camber = top of tire closer\\<br>- negative camber = top farther</p>')
    expect(html).not.toContain('<ul>')
  })

  it('keeps list hard-break source lines after native saves', () => {
    const document: TiptapJsonNode = {
      type: 'doc',
      content: [
        paragraphNode('- Awesome CursorRules  ', '- Project rules'),
      ],
    }

    expect(tiptapJsonToMobileMarkdown(document)).toBe('- Awesome CursorRules  \n- Project rules')
  })
})

function paragraphNode(...lines: string[]): TiptapJsonNode {
  return {
    type: 'paragraph',
    content: lines.flatMap((line, index): TiptapJsonNode[] => [
      ...(index > 0 ? [{ type: 'hardBreak' }] : []),
      ...(line ? [{ text: line, type: 'text' }] : []),
    ]),
  }
}
