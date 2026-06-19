import { describe, expect, it } from 'vitest'
import {
  mobileMarkdownEditableSourceBlockSource,
  readMobileMarkdownEditableSourceBlocks,
  updateMobileMarkdownEditableSourceBlock,
} from './mobileMarkdownSourceBlocksEditing'

describe('mobile markdown source block editing', () => {
  it('reads desktop-compatible code, mermaid, and math blocks', () => {
    const blocks = readMobileMarkdownEditableSourceBlocks({ markdown: [
      '# Source blocks',
      '',
      '```ts',
      'const answer = 42',
      '```',
      '',
      '```mermaid',
      'flowchart LR',
      '  A --> B',
      '```',
      '',
      '$$',
      'a^2 + b^2 = c^2',
      '$$',
    ].join('\n') })

    expect(blocks).toEqual([
      {
        content: 'const answer = 42',
        endLine: 4,
        fence: '```',
        infoSuffix: '',
        key: 'line:2',
        kind: 'codeBlock',
        language: 'ts',
        startLine: 2,
      },
      {
        content: 'flowchart LR\n  A --> B',
        endLine: 9,
        fence: '```',
        infoSuffix: '',
        key: 'line:6',
        kind: 'mermaid',
        language: 'mermaid',
        startLine: 6,
      },
      {
        content: 'a^2 + b^2 = c^2',
        endLine: 13,
        fence: '$$',
        infoSuffix: '',
        key: 'line:11',
        kind: 'mathBlock',
        language: '',
        startLine: 11,
      },
    ])
  })

  it('updates one source block without rewriting the rest of the note', () => {
    const markdown = [
      'Intro',
      '',
      '~~~js',
      'console.log("old")',
      '~~~',
      '',
      'Tail',
    ].join('\n')

    const result = updateMobileMarkdownEditableSourceBlock({
      markdown,
      update: {
        content: 'console.log("new")',
        key: 'line:2',
        kind: 'codeBlock',
        language: 'ts',
      },
    })

    expect(result.updated).toBe(true)
    expect(result.markdown).toBe([
      'Intro',
      '',
      '~~~ts',
      'console.log("new")',
      '~~~',
      '',
      'Tail',
    ].join('\n'))
  })

  it('preserves desktop code-fence metadata when editing code content or language', () => {
    const markdown = [
      'Intro',
      '',
      '```ts title="Mobile editor" {1,3}',
      'const previous = true',
      '```',
      '',
      'Tail',
    ].join('\n')

    const [block] = readMobileMarkdownEditableSourceBlocks({ markdown })
    expect(block).toMatchObject({
      infoSuffix: 'title="Mobile editor" {1,3}',
      language: 'ts',
    })

    const result = updateMobileMarkdownEditableSourceBlock({
      markdown,
      update: {
        content: 'const next = true',
        key: 'line:2',
        kind: 'codeBlock',
        language: 'tsx',
      },
    })

    expect(result.updated).toBe(true)
    expect(result.markdown).toBe([
      'Intro',
      '',
      '```tsx title="Mobile editor" {1,3}',
      'const next = true',
      '```',
      '',
      'Tail',
    ].join('\n'))
  })

  it('skips tldraw fences so whiteboards keep their dedicated editor', () => {
    const blocks = readMobileMarkdownEditableSourceBlocks({ markdown: [
      '```tldraw id="board"',
      '{}',
      '```',
      '',
      '```mermaid',
      'flowchart TD',
      '```',
    ].join('\n') })

    expect(blocks).toHaveLength(1)
    expect(blocks[0]?.kind).toBe('mermaid')
  })

  it('writes math and mermaid blocks with desktop-compatible fences', () => {
    expect(mobileMarkdownEditableSourceBlockSource({
      content: 'E = mc^2',
      fence: '$$',
      kind: 'mathBlock',
      language: '',
    })).toBe('$$\nE = mc^2\n$$')

    expect(mobileMarkdownEditableSourceBlockSource({
      content: 'flowchart TD\n  A --> B',
      fence: '```',
      infoSuffix: 'title="Flow"',
      kind: 'mermaid',
      language: 'ignored',
    })).toBe('```mermaid title="Flow"\nflowchart TD\n  A --> B\n```')
  })

  it('leaves content unchanged when the target block is missing', () => {
    const content = '# No block\n'

    expect(updateMobileMarkdownEditableSourceBlock({
      markdown: content,
      update: {
        content: 'noop',
        key: 'line:8',
        kind: 'codeBlock',
        language: 'text',
      },
    })).toEqual({ markdown: content, updated: false })
  })
})
