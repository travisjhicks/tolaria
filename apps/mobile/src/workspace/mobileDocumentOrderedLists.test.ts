import { describe, expect, it } from 'vitest'
import {
  mobileMarkdownBodyToTentapHtml,
  tiptapJsonToMobileMarkdown,
  type TiptapJsonNode,
} from './mobileDocumentContent'

describe('mobile document ordered lists', () => {
  it('hydrates non-1 desktop ordered lists with their start number', () => {
    const html = mobileMarkdownBodyToTentapHtml('42. First retained rule\n43. Next retained rule\n')

    expect(html).toBe(
      '<ol start="42"><li><p>First retained rule</p></li><li><p>Next retained rule</p></li></ol>',
    )
  })

  it('serializes non-1 ordered lists back to desktop markdown', () => {
    const document: TiptapJsonNode = {
      type: 'doc',
      content: [
        {
          attrs: { start: 42 },
          type: 'orderedList',
          content: [
            { type: 'listItem', content: [paragraphNode('First retained rule')] },
            { type: 'listItem', content: [paragraphNode('Next retained rule')] },
          ],
        },
      ],
    }

    expect(tiptapJsonToMobileMarkdown(document)).toBe('42. First retained rule\n43. Next retained rule')
  })
})

function paragraphNode(text: string): TiptapJsonNode {
  return {
    type: 'paragraph',
    content: [{ text, type: 'text' }],
  }
}
