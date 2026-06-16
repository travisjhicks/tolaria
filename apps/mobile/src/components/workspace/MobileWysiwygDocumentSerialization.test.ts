import { describe, expect, it } from 'vitest'
import { nativeWysiwygDocumentContentFromJson } from './MobileWysiwygDocumentSerialization'
import type { TiptapJsonNode } from '../../workspace/mobileDocumentContent'

describe('native WYSIWYG document serialization', () => {
  it('preserves raw frontmatter while replacing the editable document body', () => {
    const result = nativeWysiwygDocumentContentFromJson({
      currentContent: [
        '---',
        '# Desktop comments and formatting stay untouched.',
        'type: Essay',
        'aliases: ["Mobile, UI", "Tablet"]',
        '---',
        '# Old title',
        '',
      ].join('\n'),
      initialBodyHasContent: true,
      isFirstSerialization: false,
      json: documentNode(
        headingNode(1, 'Workflow Orchestration Essay'),
        paragraphNode('Updated body.'),
      ),
    })

    expect(result).toEqual({
      content: [
        '---',
        '# Desktop comments and formatting stay untouched.',
        'type: Essay',
        'aliases: ["Mobile, UI", "Tablet"]',
        '---',
        '# Workflow Orchestration Essay',
        '',
        'Updated body.',
        '',
      ].join('\n'),
      markdown: ['# Workflow Orchestration Essay', '', 'Updated body.'].join('\n'),
      skipped: false,
    })
  })

  it('does not invent a title when the native editor saves body-only notes', () => {
    const result = nativeWysiwygDocumentContentFromJson({
      currentContent: 'Paragraph without title.\n',
      initialBodyHasContent: true,
      isFirstSerialization: false,
      json: documentNode(paragraphNode('Body still has no H1.')),
    })

    expect(result.content).toBe('Body still has no H1.\n')
  })

  it('keeps unsupported Expo Go table content editable as markdown lines', () => {
    const result = nativeWysiwygDocumentContentFromJson({
      currentContent: tableDocumentSource(),
      initialBodyHasContent: true,
      isFirstSerialization: false,
      json: documentNode(paragraphNode('| Surface | Target |', '| --- | --- |', '| Editor | WYSIWYG |')),
    })

    expect(result.content).toBe(tableDocumentSource())
    expect(result.markdown).toBe(['| Surface | Target |', '| --- | --- |', '| Editor | WYSIWYG |'].join('\n'))
  })

  it('skips the first empty native serialization for hydrated documents', () => {
    const result = nativeWysiwygDocumentContentFromJson({
      currentContent: '# Existing body\n\nKeep me.\n',
      initialBodyHasContent: true,
      isFirstSerialization: true,
      json: documentNode(),
    })

    expect(result).toEqual({
      content: '# Existing body\n\nKeep me.\n',
      markdown: '',
      skipped: true,
    })
  })
})

function documentNode(...content: TiptapJsonNode[]): TiptapJsonNode {
  return { content, type: 'doc' }
}

function headingNode(level: number, text: string): TiptapJsonNode {
  return {
    attrs: { level },
    content: [{ text, type: 'text' }],
    type: 'heading',
  }
}

function paragraphNode(...lines: string[]): TiptapJsonNode {
  return {
    content: lines.flatMap((line, index): TiptapJsonNode[] => [
      ...(index > 0 ? [{ type: 'hardBreak' }] : []),
      ...(line ? [{ text: line, type: 'text' }] : []),
    ]),
    type: 'paragraph',
  }
}

function tableDocumentSource(): string {
  return ['| Surface | Target |', '| --- | --- |', '| Editor | WYSIWYG |', ''].join('\n')
}
