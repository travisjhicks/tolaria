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

  it('renders angle-wrapped attachment links without leaking markdown angle syntax into hrefs', () => {
    const html = mobileMarkdownBodyToTentapHtml('[project brief.pdf](<attachments/project brief.pdf>)\n')

    expect(html).toBe('<p><a href="attachments/project brief.pdf">project brief.pdf</a></p>')
  })

  it('hydrates markdown links whose URLs contain balanced or escaped parentheses', () => {
    const html = mobileMarkdownBodyToTentapHtml(
      'Read [the spec](https://cdn.example.com/Workflow%20Plan%20(1).pdf) and [the copy](https://cdn.example.com/Workflow%20Plan%20\\(2\\).pdf).\n',
    )

    expect(html).toBe(
      '<p>Read <a href="https://cdn.example.com/Workflow%20Plan%20(1).pdf">the spec</a> and <a href="https://cdn.example.com/Workflow%20Plan%20(2).pdf">the copy</a>.</p>',
    )
  })

  it('hydrates markdown links whose labels contain balanced or escaped brackets', () => {
    const html = mobileMarkdownBodyToTentapHtml(
      'Read [Project [Alpha]](https://example.com/alpha) and [Project \\[Beta\\]](https://example.com/beta).\n',
    )

    expect(html).toBe(
      '<p>Read <a href="https://example.com/alpha">Project [Alpha]</a> and <a href="https://example.com/beta">Project [Beta]</a>.</p>',
    )
  })

  it('hydrates markdown autolinks as editable TenTap links', () => {
    const html = mobileMarkdownBodyToTentapHtml(
      'Location: <https://example.com/room?id=42> and <luca@example.com>\n',
    )

    expect(html).toBe(
      '<p>Location: <a href="https://example.com/room?id=42">https://example.com/room?id=42</a> and <a href="mailto:luca@example.com">luca@example.com</a></p>',
    )
  })

  it('preserves desktop highlight markdown while leaving code spans literal', () => {
    const html = mobileMarkdownBodyToTentapHtml('Use ==highlight== but keep `==literal==` as code.\n')

    expect(html).toContain('<mark>highlight</mark>')
    expect(html).toContain('<code>==literal==</code>')
    expect(html).not.toContain('<code><mark>literal</mark></code>')
  })

  it('hydrates inline math as a native TenTap math node without touching code spans', () => {
    const html = mobileMarkdownBodyToTentapHtml('Use $x^2$ but keep `$x^2$` literal.\n')

    expect(html).toContain('data-type="mathInline"')
    expect(html).toContain('data-latex="x^2"')
    expect(html).toContain('<code>$x^2$</code>')
  })

  it('hydrates escaped inline markdown punctuation as literal text', () => {
    const html = mobileMarkdownBodyToTentapHtml('Keep \\(No highlights\\) and ¯\\_(ツ)_/¯\n')

    expect(html).toBe('<p>Keep (No highlights) and ¯_(ツ)_/¯</p>')
    expect(html).not.toContain('<em>')
  })

  it('hydrates simple markdown tables as native TenTap table HTML', () => {
    const html = mobileMarkdownBodyToTentapHtml('| Surface | **Target** |\n| --- | --- |\n| Editor | WYSIWYG |\n')

    expect(html).toBe(
      '<table><thead><tr><th><p>Surface</p></th><th><p><strong>Target</strong></p></th></tr></thead>'
      + '<tbody><tr><td><p>Editor</p></td><td><p>WYSIWYG</p></td></tr></tbody></table>',
    )
  })

  it('hydrates aligned markdown tables as native TenTap table HTML with alignment metadata', () => {
    const html = mobileMarkdownBodyToTentapHtml('| Surface | Target |\n| :--- | ---: |\n| Editor | WYSIWYG |\n')

    expect(html).toBe(
      '<table><thead><tr><th data-tolaria-alignment="left" style="text-align: left"><p>Surface</p></th><th data-tolaria-alignment="right" style="text-align: right"><p>Target</p></th></tr></thead>'
      + '<tbody><tr><td data-tolaria-alignment="left" style="text-align: left"><p>Editor</p></td><td data-tolaria-alignment="right" style="text-align: right"><p>WYSIWYG</p></td></tr></tbody></table>',
    )
  })

  it('hydrates root display math blocks as native TenTap math nodes', () => {
    const html = mobileMarkdownBodyToTentapHtml('Intro\n\n$$\n\\int_0^1 x\\,dx\n$$\n\nDone\n')

    expect(html).toContain('<p>Intro</p>')
    expect(html).toContain('data-type="mathBlock"')
    expect(html).toContain('data-latex="\\int_0^1 x\\,dx"')
    expect(html).toContain('<p>Done</p>')
  })

  it('hydrates single-line root display math as a native TenTap math node', () => {
    const html = mobileMarkdownBodyToTentapHtml('$$x^2$$\n')

    expect(html).toContain('data-type="mathBlock"')
    expect(html).toContain('data-latex="x^2"')
  })

  it('hydrates blockquotes without collapsing explicit breaks or quoted paragraphs', () => {
    const html = mobileMarkdownBodyToTentapHtml('> First quote line  \n> Second line\n> \n> Follow-up paragraph\n\nDone\n')

    expect(html).toBe('<blockquote><p>First quote line<br>Second line</p><p>Follow-up paragraph</p></blockquote>\n<p>Done</p>')
  })

  it('keeps indented display math blocks editable as source until nested block editing is supported', () => {
    const html = mobileMarkdownBodyToTentapHtml('  $$\n  x^2\n  $$\n\nDone\n')

    expect(html).toBe('<p>  $$<br>  x^2<br>  $$</p>\n<p>Done</p>')
  })

  it('keeps unsupported details blocks editable as escaped markdown source', () => {
    const html = mobileMarkdownBodyToTentapHtml([
      '<details><summary>Manufacturing</summary>',
      '',
      'Made in Italy',
      '',
      '</details>',
      '',
      'Done',
      '',
    ].join('\n'))

    expect(html).toBe(
      '<p>&lt;details&gt;&lt;summary&gt;Manufacturing&lt;/summary&gt;<br><br>Made in Italy<br><br>&lt;/details&gt;</p>\n<p>Done</p>',
    )
  })

  it('keeps unsupported html comment blocks editable as markdown source', () => {
    const html = mobileMarkdownBodyToTentapHtml([
      'Intro',
      '',
      '<!--',
      '{"fold":true}',
      '-->',
      '',
      'Done',
      '',
    ].join('\n'))

    expect(html).toBe('<p>Intro</p>\n<p>&lt;!--<br>{&quot;fold&quot;:true}<br>--&gt;</p>\n<p>Done</p>')
  })

  it('hydrates nested desktop markdown lists without flattening indentation', () => {
    const html = mobileMarkdownBodyToTentapHtml('- Parent\n  - Child with **bold**\n- Sibling\n')
    const taskHtml = mobileMarkdownBodyToTentapHtml('- [x] Parent\n  - [ ] Child\n')

    expect(html).toBe(
      '<ul><li><p>Parent</p><ul><li><p>Child with <strong>bold</strong></p></li></ul></li><li><p>Sibling</p></li></ul>',
    )
    expect(taskHtml).toBe(
      '<ul data-type="taskList"><li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><p>Parent</p><ul data-type="taskList"><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Child</p></div></li></ul></div></li></ul>',
    )
  })

  it('hydrates simple fenced code blocks as native TenTap codeBlock nodes with language metadata', () => {
    const html = mobileMarkdownBodyToTentapHtml('```ts\nconst parity = "desktop"\n```\n\nDone\n')

    expect(html).toBe('<pre><code class="language-ts" data-language="ts">const parity = &quot;desktop&quot;</code></pre>\n<p>Done</p>')
  })

  it('keeps complex fenced-code metadata editable as exact source until native codeBlock metadata can round-trip it', () => {
    const html = mobileMarkdownBodyToTentapHtml('```plain text\nprompt: keep [[literal]]\n```\n\nDone\n')

    expect(html).toBe('<p>```plain text<br>prompt: keep [[literal]]<br>```</p>\n<p>Done</p>')
    expect(mobileMarkdownBodyToTentapHtml('~~~mermaid\nflowchart LR\nA --> B\n~~~\n')).toBe(
      '<p>~~~mermaid<br>flowchart LR<br>A --&gt; B<br>~~~</p>',
    )
  })

  it('keeps indented fenced code editable as source until nested block editing is supported', () => {
    const html = mobileMarkdownBodyToTentapHtml('  ```ts\n  const x = 1\n  ```\n\nDone\n')

    expect(html).toBe('<p>  ```ts<br>  const x = 1<br>  ```</p>\n<p>Done</p>')
    expect(html).not.toContain('<pre>')
  })

  it('keeps root indented text blocks editable as source until indented code editing is supported', () => {
    const html = mobileMarkdownBodyToTentapHtml('    Teach your AI agent the workflow context.\n    Then run the task.\n\nDone\n')

    expect(html).toBe('<p>    Teach your AI agent the workflow context.<br>    Then run the task.</p>\n<p>Done</p>')
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

  it('renders standalone markdown images whose URLs contain balanced parentheses', () => {
    const html = mobileMarkdownBodyToTentapHtml(
      '![](https://cdn.example.com/Opengraph%20-%20Home%20Page%20(1).jpg)\n',
    )
    const escapedHtml = mobileMarkdownBodyToTentapHtml(
      '![](https://cdn.example.com/Opengraph%20-%20Home%20Page%20\\(1\\).jpg)\n',
    )

    expect(html).toBe(
      '<img src="https://cdn.example.com/Opengraph%20-%20Home%20Page%20(1).jpg" alt="">',
    )
    expect(escapedHtml).toBe(html)
  })

  it('preserves markdown image titles as native image metadata', () => {
    const html = mobileMarkdownBodyToTentapHtml('![shot](attachments/file.png "starter vault")\n')

    expect(html).toBe('<img src="attachments/file.png" alt="shot" title="starter vault">')
  })

  it('hydrates markdown images with non-code leading spaces as native TenTap image nodes', () => {
    const html = mobileMarkdownBodyToTentapHtml('  ![](https://example.com/agent.png)\n\nDone\n')

    expect(html).toBe('<img src="https://example.com/agent.png" alt="">\n<p>Done</p>')
  })

  it('keeps code-indented markdown images editable as source until indented code editing is supported', () => {
    const html = mobileMarkdownBodyToTentapHtml('    ![](https://example.com/agent.png)\n\nDone\n')

    expect(html).toBe('<p>    ![](https://example.com/agent.png)</p>\n<p>Done</p>')
    expect(html).not.toContain('<img')
  })

  it('keeps indented markdown headings editable as source until nested block editing is supported', () => {
    const html = mobileMarkdownBodyToTentapHtml('  ### Daniel Yeboah\n\nDone\n')

    expect(html).toBe('<p>  ### Daniel Yeboah</p>\n<p>Done</p>')
    expect(html).not.toContain('<h3>')
  })

  it('keeps detached indented list markers editable as source until nested block editing is supported', () => {
    const html = mobileMarkdownBodyToTentapHtml('  1. Contextualize: Dump TOC into an LLM.\n  2. Summarize major sections.\n\nDone\n')

    expect(html).toBe('<p>  1. Contextualize: Dump TOC into an LLM.<br>  2. Summarize major sections.</p>\n<p>Done</p>')
    expect(html).not.toContain('<ol>')
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

  it('serializes aligned TenTap table cells back to desktop markdown divider syntax', () => {
    const document: TiptapJsonNode = {
      type: 'doc',
      content: [
        {
          type: 'table',
          content: [
            {
              type: 'tableRow',
              content: [
                { attrs: { align: 'left' }, type: 'tableHeader', content: [{ text: 'Surface', type: 'text' }] },
                { attrs: { tolariaAlignment: 'center' }, type: 'tableHeader', content: [{ text: 'Desktop', type: 'text' }] },
                { attrs: { align: 'right' }, type: 'tableHeader', content: [{ text: 'Mobile', type: 'text' }] },
              ],
            },
            {
              type: 'tableRow',
              content: [
                { attrs: { tolariaAlignment: 'left' }, type: 'tableCell', content: [{ text: 'Editor', type: 'text' }] },
                { attrs: { tolariaAlignment: 'center' }, type: 'tableCell', content: [{ text: 'BlockNote', type: 'text' }] },
                { attrs: { tolariaAlignment: 'right' }, type: 'tableCell', content: [{ text: 'TenTap', type: 'text' }] },
              ],
            },
          ],
        },
      ],
    }

    expect(tiptapJsonToMobileMarkdown(document)).toBe([
      '| Surface | Desktop | Mobile |',
      '| :--- | :---: | ---: |',
      '| Editor | BlockNote | TenTap |',
    ].join('\n'))
  })

  it('keeps source-fallback code fences from native TenTap paragraphs as editable markdown lines', () => {
    expect(tiptapJsonToMobileMarkdown(paragraphDocument(
      '```ts',
      'const parity = "desktop";',
      'ship(parity)',
      '```',
    ))).toBe(['```ts', 'const parity = "desktop";', 'ship(parity)', '```'].join('\n'))
  })

  it('serializes native codeBlock nodes back to desktop fenced markdown', () => {
    const document: TiptapJsonNode = {
      type: 'doc',
      content: [
        {
          attrs: { language: 'ts' },
          content: [{ text: 'const parity = "desktop"', type: 'text' }],
          type: 'codeBlock',
        },
      ],
    }

    expect(tiptapJsonToMobileMarkdown(document)).toBe('```ts\nconst parity = "desktop"\n```')
  })

  it('serializes native codeBlock nodes with longer fences when code contains backticks', () => {
    const document: TiptapJsonNode = {
      type: 'doc',
      content: [
        {
          attrs: { language: 'md' },
          content: [{ text: '```ts\nconst nested = true\n```', type: 'text' }],
          type: 'codeBlock',
        },
      ],
    }

    expect(tiptapJsonToMobileMarkdown(document)).toBe('````md\n```ts\nconst nested = true\n```\n````')
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

  it('serializes link destinations with spaces using desktop angle syntax', () => {
    expect(tiptapJsonToMobileMarkdown(linkDocument('attachments/project brief.pdf'))).toBe(
      '[project brief.pdf](<attachments/project brief.pdf>)',
    )
  })

  it('serializes link labels with brackets as escaped desktop markdown labels', () => {
    expect(tiptapJsonToMobileMarkdown(linkDocument('https://example.com/alpha', 'Project [Alpha]'))).toBe(
      '[Project \\[Alpha\\]](https://example.com/alpha)',
    )
  })

  it('serializes link destinations with parentheses as escaped desktop markdown destinations', () => {
    const markdown = tiptapJsonToMobileMarkdown(linkDocument('https://cdn.example.com/Workflow%20Plan%20(1).pdf', 'spec'))

    expect(markdown).toBe('[spec](https://cdn.example.com/Workflow%20Plan%20\\(1\\).pdf)')
    expect(mobileMarkdownBodyToTentapHtml(`${markdown}\n`)).toBe(
      '<p><a href="https://cdn.example.com/Workflow%20Plan%20(1).pdf">spec</a></p>',
    )
  })

  it('serializes native attachment link URIs back to portable markdown destinations', () => {
    expect(tiptapJsonToMobileMarkdown(
      linkDocument('file:///vault/root/attachments/project%20brief.pdf'),
      { vaultRootUri: 'file:///vault/root/' },
    )).toBe(
      '[project brief.pdf](<attachments/project brief.pdf>)',
    )
  })

  it('serializes url and email autolinks back to durable markdown autolink syntax', () => {
    const document: TiptapJsonNode = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { text: 'Location: ', type: 'text' },
            {
              marks: [{ attrs: { href: 'https://example.com/room?id=42' }, type: 'link' }],
              text: 'https://example.com/room?id=42',
              type: 'text',
            },
            { text: ' and ', type: 'text' },
            {
              marks: [{ attrs: { href: 'mailto:luca@example.com' }, type: 'link' }],
              text: 'luca@example.com',
              type: 'text',
            },
          ],
        },
      ],
    }

    expect(tiptapJsonToMobileMarkdown(document)).toBe(
      'Location: <https://example.com/room?id=42> and <luca@example.com>',
    )
  })

  it('escapes literal inline markdown punctuation when serializing plain text', () => {
    const document = paragraphDocument('Keep (No highlights) and ¯_(ツ)_/¯')

    expect(tiptapJsonToMobileMarkdown(document)).toBe('Keep (No highlights) and ¯\\_(ツ)\\_/¯')
  })

  it('serializes display math hard breaks back to durable markdown source', () => {
    const document = paragraphDocument('$$', '\\int_0^1 x\\,dx', '$$')

    expect(tiptapJsonToMobileMarkdown(document)).toBe('$$\n\\int_0^1 x\\,dx\n$$')
  })

  it('serializes native display math nodes back to desktop markdown source', () => {
    const document: TiptapJsonNode = {
      type: 'doc',
      content: [
        {
          attrs: { latex: '\\int_0^1 x\\,dx' },
          type: 'mathBlock',
        },
      ],
    }

    expect(tiptapJsonToMobileMarkdown(document)).toBe('$$\n\\int_0^1 x\\,dx\n$$')
  })

  it('serializes native inline math nodes back to desktop markdown source', () => {
    const document: TiptapJsonNode = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { text: 'Use ', type: 'text' },
            { attrs: { latex: 'x^2' }, type: 'mathInline' },
            { text: ' today.', type: 'text' },
          ],
        },
      ],
    }

    expect(tiptapJsonToMobileMarkdown(document)).toBe('Use $x^2$ today.')
  })

  it('keeps indented display math paragraphs as editable markdown source after native saves', () => {
    const document = paragraphDocument('  $$', '  x^2', '  $$')

    expect(tiptapJsonToMobileMarkdown(document)).toBe('  $$\n  x^2\n  $$')
  })

  it('keeps indented fenced code paragraphs as editable markdown source after native saves', () => {
    const document = paragraphDocument('  ```ts', '  const x = 1', '  ```')

    expect(tiptapJsonToMobileMarkdown(document)).toBe('  ```ts\n  const x = 1\n  ```')
  })

  it('keeps root indented text paragraphs as editable markdown source after native saves', () => {
    const document = paragraphDocument('    Teach your AI agent the workflow context.', '    Then run the task.')

    expect(tiptapJsonToMobileMarkdown(document)).toBe(
      '    Teach your AI agent the workflow context.\n    Then run the task.',
    )
  })

  it('keeps non-math TenTap hard breaks as markdown hard break markers', () => {
    const document = paragraphDocument('Line one', 'Line two')

    expect(tiptapJsonToMobileMarkdown(document)).toBe('Line one  \nLine two')
  })

  it('keeps unsupported table paragraphs as editable markdown table lines after native saves', () => {
    const document = paragraphDocument('| Surface | Target |', '| --- | --- |', '| Editor | WYSIWYG |')

    expect(tiptapJsonToMobileMarkdown(document)).toBe([
      '| Surface | Target |',
      '| --- | --- |',
      '| Editor | WYSIWYG |',
    ].join('\n'))
  })

  it('keeps unsupported details paragraphs as editable markdown source after native saves', () => {
    const document = paragraphDocument('<details><summary>Manufacturing</summary>', '', 'Made in Italy', '', '</details>')

    expect(tiptapJsonToMobileMarkdown(document)).toBe([
      '<details><summary>Manufacturing</summary>',
      '',
      'Made in Italy',
      '',
      '</details>',
    ].join('\n'))
  })

  it('keeps unsupported html comment paragraphs as editable markdown source after native saves', () => {
    const document = paragraphDocument('<!--', '{"fold":true}', '-->')

    expect(tiptapJsonToMobileMarkdown(document)).toBe(['<!--', '{"fold":true}', '-->'].join('\n'))
  })

  it('keeps detached indented list paragraphs as editable markdown source after native saves', () => {
    const document = paragraphDocument(
      '  1. Contextualize: Dump TOC into an LLM.',
      '  2. Summarize major sections.',
    )

    expect(tiptapJsonToMobileMarkdown(document)).toBe([
      '  1. Contextualize: Dump TOC into an LLM.',
      '  2. Summarize major sections.',
    ].join('\n'))
  })

  it('serializes blockquote paragraphs with quoted hard breaks and blank quote separators', () => {
    const document: TiptapJsonNode = {
      type: 'doc',
      content: [
        {
          type: 'blockquote',
          content: [
            paragraphNode('First quote line', 'Second line'),
            paragraphNode('Follow-up paragraph'),
          ],
        },
      ],
    }

    expect(tiptapJsonToMobileMarkdown(document)).toBe('> First quote line  \n> Second line\n> \n> Follow-up paragraph')
  })

  it('serializes TenTap image nodes back to portable markdown images', () => {
    expect(tiptapJsonToMobileMarkdown(imageDocument({
      alt: 'Architecture diagram',
      src: 'attachments/mobile diagram.png',
    }))).toBe('![Architecture diagram](<attachments/mobile diagram.png>)')
  })

  it('serializes native attachment image URIs back to portable markdown images', () => {
    expect(tiptapJsonToMobileMarkdown(
      imageDocument({
        alt: 'Architecture diagram',
        src: 'file:///vault/root/attachments/mobile%20diagram.png',
      }),
      { vaultRootUri: 'file:///vault/root/' },
    )).toBe(
      '![Architecture diagram](<attachments/mobile diagram.png>)',
    )
  })

  it('serializes TenTap image titles back to desktop markdown image titles', () => {
    expect(tiptapJsonToMobileMarkdown(imageDocument({
      alt: 'shot',
      src: 'attachments/file.png',
      title: 'starter vault',
    }))).toBe('![shot](attachments/file.png "starter vault")')
  })

  it('serializes image URLs with closing parentheses as escaped markdown destinations', () => {
    expect(tiptapJsonToMobileMarkdown(imageDocument({
      alt: '',
      src: 'https://cdn.example.com/Opengraph%20-%20Home%20Page%20(1).jpg',
    }))).toBe(
      '![](https://cdn.example.com/Opengraph%20-%20Home%20Page%20\\(1\\).jpg)',
    )
  })
})

function paragraphDocument(...lines: string[]): TiptapJsonNode {
  return { type: 'doc', content: [paragraphNode(...lines)] }
}

function linkDocument(href: string, text = 'project brief.pdf'): TiptapJsonNode {
  return {
    type: 'doc',
    content: [{
      type: 'paragraph',
      content: [{
        marks: [{ attrs: { href }, type: 'link' }],
        text,
        type: 'text',
      }],
    }],
  }
}

function imageDocument(attrs: Record<string, string>): TiptapJsonNode {
  return {
    type: 'doc',
    content: [{
      attrs,
      type: 'image',
    }],
  }
}

function paragraphNode(...lines: string[]): TiptapJsonNode {
  return {
    type: 'paragraph',
    content: lines.flatMap((line, index): TiptapJsonNode[] => [
      ...(index > 0 ? [{ type: 'hardBreak' }] : []),
      ...(line ? [{ text: line, type: 'text' }] : []),
    ]),
  }
}
