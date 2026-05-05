import { describe, expect, it } from 'vitest'
import { createMobileEditorDraft } from './mobileEditorDraft'

describe('mobile editor draft', () => {
  it('serializes supported TenTap HTML into canonical Markdown', () => {
    expect(
      createMobileEditorDraft({
        note: {
          id: 'workflow',
          title: 'Workflow',
          content: '# Workflow\n\nOriginal markdown',
        },
        editorHtml: '<h1>Workflow</h1><p>Edited content</p><ul><li>First</li><li>Second</li></ul>',
      }),
    ).toEqual({
      noteId: 'workflow',
      sourceMarkdown: '# Workflow\n\nOriginal markdown',
      editorHtml: '<h1>Workflow</h1><p>Edited content</p><ul><li>First</li><li>Second</li></ul>',
      persistable: true,
      canonicalMarkdown: '# Workflow\n\nEdited content\n\n- First\n- Second',
    })
  })

  it('preserves source frontmatter outside the edited body', () => {
    const draft = createMobileEditorDraft({
      note: {
        id: 'workflow',
        title: 'Workflow',
        content: '---\ntype: Essay\n---\n\n# Workflow\n\nOriginal markdown',
      },
      editorHtml: '<h1>Workflow</h1><p>Edited content</p>',
    })

    expect(draft).toMatchObject({
      persistable: true,
      canonicalMarkdown: '---\ntype: Essay\n---\n# Workflow\n\nEdited content',
    })
  })

  it('decodes escaped text before writing Markdown', () => {
    const draft = createMobileEditorDraft({
      note: {
        id: 'symbols',
        title: 'Symbols',
        content: '# Symbols',
      },
      editorHtml: '<h1>Symbols</h1><p>Use &lt;tags&gt; &amp; &quot;quotes&quot;</p>',
    })

    expect(draft).toMatchObject({
      persistable: true,
      canonicalMarkdown: '# Symbols\n\nUse <tags> & "quotes"',
    })
  })

  it('serializes headings, ordered lists, and inline marks', () => {
    const draft = createMobileEditorDraft({
      note: {
        id: 'formatting',
        title: 'Formatting',
        content: '# Formatting',
      },
      editorHtml: [
        '<h2>Section</h2>',
        '<p>Use <strong>bold</strong>, <em>emphasis</em>, <code>code</code>, and <a href="https://tolaria.app">links</a>.</p>',
        '<ol><li>First</li><li>Second</li></ol>',
      ].join(''),
    })

    expect(draft).toMatchObject({
      persistable: true,
      canonicalMarkdown: [
        '## Section',
        '',
        'Use **bold**, *emphasis*, `code`, and [links](https://tolaria.app).',
        '',
        '1. First',
        '1. Second',
      ].join('\n'),
    })
  })

  it('serializes blockquotes, code blocks, and strikethrough', () => {
    const draft = createMobileEditorDraft({
      note: {
        id: 'formatting',
        title: 'Formatting',
        content: '# Formatting',
      },
      editorHtml: [
        '<blockquote><p>Quoted idea</p><p>Second line</p></blockquote>',
        '<pre><code class="language-ts">const value = &lt;string&gt;input</code></pre>',
        '<p>Keep <s>stale</s> text visible.</p>',
      ].join(''),
    })

    expect(draft).toMatchObject({
      persistable: true,
      canonicalMarkdown: [
        '> Quoted idea',
        '> Second line',
        '',
        '```ts',
        'const value = <string>input',
        '```',
        '',
        'Keep ~~stale~~ text visible.',
      ].join('\n'),
    })
  })

  it('serializes TenTap-style task list items', () => {
    const draft = createMobileEditorDraft({
      note: {
        id: 'tasks',
        title: 'Tasks',
        content: '# Tasks',
      },
      editorHtml: [
        '<ul data-type="taskList">',
        '<li data-checked="true"><label><input type="checkbox" checked=""></label><div><p>Done</p></div></li>',
        '<li data-checked="false"><label><input type="checkbox"></label><div><p>Todo</p></div></li>',
        '</ul>',
      ].join(''),
    })

    expect(draft).toMatchObject({
      persistable: true,
      canonicalMarkdown: '- [x] Done\n- [ ] Todo',
    })
  })

  it('blocks unsupported HTML instead of persisting unknown editor output', () => {
    expect(
      createMobileEditorDraft({
        note: {
          id: 'workflow',
          title: 'Workflow',
          content: '# Workflow\n\nOriginal markdown',
        },
        editorHtml: '<table><tbody><tr><td>Not yet supported</td></tr></tbody></table>',
      }),
    ).toEqual({
      noteId: 'workflow',
      sourceMarkdown: '# Workflow\n\nOriginal markdown',
      editorHtml: '<table><tbody><tr><td>Not yet supported</td></tr></tbody></table>',
      persistable: false,
      blockedReason: 'unsupportedEditorHtml',
    })
  })

  it('blocks unsupported inline HTML inside otherwise supported blocks', () => {
    expect(
      createMobileEditorDraft({
        note: {
          id: 'image',
          title: 'Image',
          content: '# Image',
        },
        editorHtml: '<p><img src="attachment.png" alt="Attachment"></p>',
      }),
    ).toMatchObject({
      noteId: 'image',
      persistable: false,
      blockedReason: 'unsupportedEditorHtml',
    })
  })
})
