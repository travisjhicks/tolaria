import { describe, expect, it } from 'vitest'
import {
  assertNativeWysiwygMarkdownBlockProofs,
  formatNativeWysiwygMarkdownBlockFailures,
  nativeWysiwygMarkdownBlockLogLine,
  nativeWysiwygMarkdownBlockProbeEnabled,
  nativeWysiwygMarkdownBlockProbePlainTextPayload,
  nativeWysiwygMarkdownBlockProbePayloads,
  nativeWysiwygMarkdownBlockProof,
  nativeWysiwygMarkdownBlockStructuredCodeBlock,
  parseNativeWysiwygMarkdownBlockProofs,
} from './nativeWysiwygMarkdownBlockProbe'

describe('native WYSIWYG markdown block probe', () => {
  it('uses the canonical native markdown block payloads', () => {
    expect(nativeWysiwygMarkdownBlockProbePlainTextPayload()).toEqual({ text: 'Plain\nClipboard' })
    expect(nativeWysiwygMarkdownBlockProbePayloads()).toEqual([
      { action: 'divider' },
      { action: 'codeBlock' },
      { action: 'mathBlock' },
      { action: 'mermaid' },
      { action: 'table' },
      { action: 'whiteboard' },
    ])
  })

  it('builds a passing proof when inserted blocks save as desktop markdown', () => {
    expectPassingMarkdownBlockProof(markdownBlockProofContent(), { dividerSaved: true, noteId: 'note.md' })
  })

  it('does not confuse frontmatter delimiters with an inserted divider', () => {
    expectPassingMarkdownBlockProof(
      markdownBlockProofContent({ divider: false, frontmatter: true }),
      { dividerSaved: false },
    )
  })

  it('parses and asserts simulator log proofs', () => {
    const proof = nativeWysiwygMarkdownBlockProof({
      codeBlockStructured: true,
      content: markdownBlockProofContent({ title: 'Intro' }),
      mathBlockRendered: true,
      noteId: 'note.md',
    })

    expect(parseNativeWysiwygMarkdownBlockProofs(nativeWysiwygMarkdownBlockLogLine(proof))).toEqual([proof])
    expect(assertNativeWysiwygMarkdownBlockProofs([proof])).toEqual([])
  })

  it('reports missing and failed block proofs', () => {
    expect(formatNativeWysiwygMarkdownBlockFailures(
      assertNativeWysiwygMarkdownBlockProofs([]),
    )).toContain('editor.wysiwyg.markdownBlocks')
    expect(assertNativeWysiwygMarkdownBlockProofs([
      nativeWysiwygMarkdownBlockProof({ content: '# Note', noteId: 'note.md' }),
    ])).toEqual([
      {
        id: 'editor.wysiwyg.markdownBlocks.plainText',
        message: 'Native WYSIWYG paste-as-plain-text insertion saves unformatted clipboard text',
      },
      {
        id: 'editor.wysiwyg.markdownBlocks.divider',
        message: 'Native WYSIWYG divider insertion saves as desktop horizontal-rule markdown',
      },
      {
        id: 'editor.wysiwyg.markdownBlocks.codeBlock',
        message: 'Native WYSIWYG code-block insertion saves as desktop fenced-code markdown',
      },
      {
        id: 'editor.wysiwyg.markdownBlocks.codeBlockStructured',
        message: 'Native WYSIWYG code-block insertion remains a structured TenTap codeBlock before save',
      },
      {
        id: 'editor.wysiwyg.markdownBlocks.mathBlock',
        message: 'Native WYSIWYG math insertion saves as desktop display-math markdown',
      },
      {
        id: 'editor.wysiwyg.markdownBlocks.mathBlockRendered',
        message: 'Native WYSIWYG math insertion renders as MathML in the TenTap WebView',
      },
      {
        id: 'editor.wysiwyg.markdownBlocks.mermaid',
        message: 'Native WYSIWYG Mermaid insertion saves as desktop fenced-diagram markdown',
      },
      {
        id: 'editor.wysiwyg.markdownBlocks.table',
        message: 'Native WYSIWYG table insertion saves as desktop markdown table source lines',
      },
      {
        id: 'editor.wysiwyg.markdownBlocks.whiteboard',
        message: 'Native WYSIWYG whiteboard insertion saves as desktop tldraw fenced markdown',
      },
    ])
  })

  it('detects structured code-block nodes in native TenTap JSON', () => {
    expect(nativeWysiwygMarkdownBlockStructuredCodeBlock({
      content: [
        {
          attrs: { language: 'text' },
          content: [{ text: 'code', type: 'text' }],
          type: 'codeBlock',
        },
      ],
      type: 'doc',
    })).toBe(true)

    expect(nativeWysiwygMarkdownBlockStructuredCodeBlock({
      content: [
        {
          content: [
            { text: '```text', type: 'text' },
            { type: 'hardBreak' },
            { text: 'code', type: 'text' },
            { type: 'hardBreak' },
            { text: '```', type: 'text' },
          ],
          type: 'paragraph',
        },
      ],
      type: 'doc',
    })).toBe(false)
  })

  it('detects the native QA query flag', () => {
    expect(nativeWysiwygMarkdownBlockProbeEnabled(new globalThis.URLSearchParams('wysiwygMarkdownBlockProbe=1'))).toBe(true)
    expect(nativeWysiwygMarkdownBlockProbeEnabled(new globalThis.URLSearchParams('wysiwygMarkdownBlockProbe=0'))).toBe(false)
  })
})

function expectPassingMarkdownBlockProof(
  content: string,
  expected: { dividerSaved: boolean; noteId?: string },
): void {
  expect(nativeWysiwygMarkdownBlockProof({
    codeBlockStructured: true,
    content,
    mathBlockRendered: true,
    noteId: 'note.md',
  })).toMatchObject({
    codeBlockSaved: true,
    codeBlockStructured: true,
    mathBlockSaved: true,
    mathBlockRendered: true,
    mermaidSaved: true,
    plainTextSaved: true,
    tableSaved: true,
    whiteboardSaved: true,
    ...expected,
  })
}

function markdownBlockProofContent({
  divider = true,
  frontmatter = false,
  title = '# Note',
}: {
  divider?: boolean
  frontmatter?: boolean
  title?: string
} = {}): string {
  return [
    ...(frontmatter ? ['---', 'title: Note', '---'] : [title]),
    '',
    'Plain  ',
    'Clipboard',
    '',
    ...(divider ? ['---', ''] : []),
    '```text',
    'code',
    '```',
    '',
    '$$',
    '\\sqrt{a^2 + b^2}',
    '$$',
    '',
    '```mermaid',
    'flowchart TD',
    '    edit["Switch to the raw editor to edit"]',
    '```',
    '',
    '| Column | Value |',
    '| --- | --- |',
    '| Item | Detail |',
    '',
    '```tldraw id="board-1" height="520"',
    '{}',
    '```',
  ].join('\n')
}
