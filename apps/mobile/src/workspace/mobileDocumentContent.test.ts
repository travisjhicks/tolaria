import { describe, expect, it } from 'vitest'
import {
  mobileDocumentBody,
  mobileDocumentWithBody,
  mobileMarkdownBodyToTentapHtml,
  mobileNoteEditableContent,
  tiptapJsonToMobileMarkdown,
  type TiptapJsonNode,
} from './mobileDocumentContent'

describe('mobile document content', () => {
  it('keeps real raw markdown as the only editable document source', () => {
    const content = mobileNoteEditableContent({
      rawContent: 'Paragraph without H1.\n',
      title: 'Not inserted',
    })

    expect(content).toBe('Paragraph without H1.\n')
  })

  it('hydrates fixture-only notes from an optional H1 and visible editor blocks', () => {
    const content = mobileNoteEditableContent({
      title: 'Workflow Orchestration Essay',
      editorBlocks: [
        {
          kind: 'paragraph',
          content: [
            { text: 'Keep ' },
            { bold: true, text: 'relationships' },
            { text: ' visible.' },
          ],
        },
        {
          kind: 'bullets',
          items: [{ content: [{ text: 'Copy desktop first' }] }],
        },
      ],
    })

    expect(content).toBe([
      '# Workflow Orchestration Essay',
      '',
      'Keep **relationships** visible.',
      '',
      '- Copy desktop first',
      '',
    ].join('\n'))
  })

  it('extracts the editable markdown body without inventing a title', () => {
    const body = mobileDocumentBody(`---
type: Essay
---
Paragraph without a heading.
`)

    expect(body).toBe('Paragraph without a heading.\n')
  })

  it('preserves frontmatter when the wysiwyg body changes', () => {
    const content = mobileDocumentWithBody(`---
type: Essay
tags:
  - Design
---
# Old title
`, '# New title\n\nUpdated body.\n')

    expect(content).toBe(`---
type: Essay
tags:
  - Design
---
# New title

Updated body.
`)
  })

  it('preserves raw frontmatter text when only the wysiwyg body changes', () => {
    const content = mobileDocumentWithBody(`---
# Keep YAML comments and formatting exactly as authored.
title: "Workflow: mobile"
aliases: ["Mobile, UI", "Tablet"]
related_to:
  - "[[LLM Workflow]]"
status: Draft
---
# Old title
`, '# New title\n\nUpdated body.\n')

    expect(content).toBe(`---
# Keep YAML comments and formatting exactly as authored.
title: "Workflow: mobile"
aliases: ["Mobile, UI", "Tablet"]
related_to:
  - "[[LLM Workflow]]"
status: Draft
---
# New title

Updated body.
`)
  })

  it('renders markdown body as initial TenTap html without generating an H1', () => {
    const html = mobileMarkdownBodyToTentapHtml('Paragraph with **bold** and [[Project Alpha|project]].\n')

    expect(html).toContain('<p>Paragraph with <strong>bold</strong>')
    expect(html).toContain('href="tolaria://wikilink/Project%20Alpha"')
    expect(html).not.toContain('<h1>')
  })

  it('preserves desktop highlight markdown while leaving code spans literal', () => {
    const html = mobileMarkdownBodyToTentapHtml('Use ==highlight== but keep `==literal==` as code.\n')

    expect(html).toContain('<mark>highlight</mark>')
    expect(html).toContain('<code>==literal==</code>')
    expect(html).not.toContain('<code><mark>literal</mark></code>')
  })

  it('keeps unsupported markdown table lines editable in TenTap basic mode', () => {
    const html = mobileMarkdownBodyToTentapHtml('| Surface | Target |\n| --- | --- |\n| Editor | WYSIWYG |\n')

    expect(html).toBe('<p>| Surface | Target |<br>| --- | --- |<br>| Editor | WYSIWYG |</p>')
    expect(html).not.toContain('<table>')
  })

  it('keeps unsupported display math blocks editable as markdown lines in TenTap basic mode', () => {
    const html = mobileMarkdownBodyToTentapHtml('Intro\n\n$$\n\\int_0^1 x\\,dx\n$$\n\nDone\n')

    expect(html).toBe('<p>Intro</p>\n<p>$$<br>\\int_0^1 x\\,dx<br>$$</p>\n<p>Done</p>')
  })

  it('hydrates explicit markdown hard breaks as TenTap line breaks', () => {
    const html = mobileMarkdownBodyToTentapHtml('Line one  \nLine two\nSoft\nwrapped\n\nBackslash\\\nbreak\n')

    expect(html).toBe('<p>Line one<br>Line two Soft wrapped</p>\n<p>Backslash<br>break</p>')
  })

  it('renders standalone markdown images as TenTap image nodes without changing portable attachment refs', () => {
    const html = mobileMarkdownBodyToTentapHtml('![Architecture diagram](<attachments/mobile diagram.png>)\n')

    expect(html).toBe('<img src="attachments/mobile diagram.png" alt="Architecture diagram">')
    expect(html).not.toContain('<a ')
  })

  it('serializes TenTap JSON back to Tolaria markdown', () => {
    const document: TiptapJsonNode = {
      type: 'doc',
      content: [
        {
          attrs: { level: 1 },
          type: 'heading',
          content: [{ text: 'Workflow Orchestration Essay', type: 'text' }],
        },
        {
          type: 'paragraph',
          content: [
            { text: 'Keep ', type: 'text' },
            { marks: [{ type: 'bold' }], text: 'relationships', type: 'text' },
            { text: ' visible with ', type: 'text' },
            { marks: [{ type: 'highlight' }], text: 'highlighted context', type: 'text' },
            { text: ' and ', type: 'text' },
            {
              marks: [{ attrs: { href: 'tolaria://wikilink/Tolaria%2FMobile%20UI' }, type: 'link' }],
              text: 'Mobile UI',
              type: 'text',
            },
            { text: '.', type: 'text' },
          ],
        },
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ text: 'Copy desktop first', type: 'text' }] }] },
          ],
        },
      ],
    }

    expect(tiptapJsonToMobileMarkdown(document)).toBe([
      '# Workflow Orchestration Essay',
      '',
      'Keep **relationships** visible with ==highlighted context== and [[Tolaria/Mobile UI|Mobile UI]].',
      '',
      '- Copy desktop first',
    ].join('\n'))
  })

  it('serializes task lists and tables from TenTap JSON', () => {
    const document: TiptapJsonNode = {
      type: 'doc',
      content: [
        {
          type: 'taskList',
          content: [
            { attrs: { checked: true }, type: 'taskItem', content: [{ type: 'paragraph', content: [{ text: 'Done', type: 'text' }] }] },
            { attrs: { checked: false }, type: 'taskItem', content: [{ type: 'paragraph', content: [{ text: 'Next', type: 'text' }] }] },
          ],
        },
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              content: [
                { type: 'tableHeader', content: [{ text: 'Surface', type: 'text' }] },
                { type: 'tableHeader', content: [{ text: 'Target', type: 'text' }] },
              ],
            },
            {
              type: 'tableRow',
              content: [
                { type: 'tableCell', content: [{ text: 'Editor', type: 'text' }] },
                { type: 'tableCell', content: [{ text: 'WYSIWYG', type: 'text' }] },
              ],
            },
          ],
        },
      ],
    }

    expect(tiptapJsonToMobileMarkdown(document)).toBe([
      '- [x] Done',
      '- [ ] Next',
      '',
      '| Surface | Target |',
      '| --- | --- |',
      '| Editor | WYSIWYG |',
    ].join('\n'))
  })

  it('serializes plain TenTap wikilinks without redundant display aliases', () => {
    const document: TiptapJsonNode = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { text: 'See ', type: 'text' },
            {
              marks: [{ attrs: { href: 'tolaria://wikilink/Project%20Alpha' }, type: 'link' }],
              text: 'Project Alpha',
              type: 'text',
            },
            { text: ' and ', type: 'text' },
            {
              marks: [{ attrs: { href: 'tolaria://wikilink/Tolaria%2FMobile%20UI' }, type: 'link' }],
              text: 'Mobile UI',
              type: 'text',
            },
            { text: '.', type: 'text' },
          ],
        },
      ],
    }

    expect(tiptapJsonToMobileMarkdown(document)).toBe('See [[Project Alpha]] and [[Tolaria/Mobile UI|Mobile UI]].')
  })

  it('serializes display math hard breaks back to durable markdown source', () => {
    const document: TiptapJsonNode = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { text: '$$', type: 'text' },
            { type: 'hardBreak' },
            { text: '\\int_0^1 x\\,dx', type: 'text' },
            { type: 'hardBreak' },
            { text: '$$', type: 'text' },
          ],
        },
      ],
    }

    expect(tiptapJsonToMobileMarkdown(document)).toBe('$$\n\\int_0^1 x\\,dx\n$$')
  })

  it('keeps non-math TenTap hard breaks as markdown hard break markers', () => {
    const document: TiptapJsonNode = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { text: 'Line one', type: 'text' },
            { type: 'hardBreak' },
            { text: 'Line two', type: 'text' },
          ],
        },
      ],
    }

    expect(tiptapJsonToMobileMarkdown(document)).toBe('Line one  \nLine two')
  })

  it('keeps unsupported table paragraphs as editable markdown table lines after native saves', () => {
    const document: TiptapJsonNode = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { text: '| Surface | Target |', type: 'text' },
            { type: 'hardBreak' },
            { text: '| --- | --- |', type: 'text' },
            { type: 'hardBreak' },
            { text: '| Editor | WYSIWYG |', type: 'text' },
          ],
        },
      ],
    }

    expect(tiptapJsonToMobileMarkdown(document)).toBe([
      '| Surface | Target |',
      '| --- | --- |',
      '| Editor | WYSIWYG |',
    ].join('\n'))
  })

  it('serializes TenTap image nodes back to portable markdown images', () => {
    const document: TiptapJsonNode = {
      type: 'doc',
      content: [
        {
          attrs: {
            alt: 'Architecture diagram',
            src: 'attachments/mobile diagram.png',
          },
          type: 'image',
        },
      ],
    }

    expect(tiptapJsonToMobileMarkdown(document)).toBe('![Architecture diagram](<attachments/mobile diagram.png>)')
  })
})
