import { splitFrontmatter } from '@tolaria/markdown'

export type MobileEditorBlock = {
  id: string
  kind: 'bullet' | 'paragraph'
  text: string
}

export type MobileEditorDocument = {
  leadingTitle: string | null
  blocks: MobileEditorBlock[]
}

export type MobileEditorDocumentInput = {
  id: string
  title: string
  content: string
}

export function createMobileEditorDocument(input: MobileEditorDocumentInput): MobileEditorDocument {
  const [, body] = splitFrontmatter(input.content)

  return {
    leadingTitle: leadingTitle({ body, title: input.title }),
    blocks: createBlocks({ body, title: input.title }),
  }
}

export function createMobileEditorHtml(document: MobileEditorDocument) {
  return `${titleHtml(document.leadingTitle)}${document.blocks.map(blockToHtml).join('') || '<p></p>'}`
}

function leadingTitle({ body, title }: { body: string; title: string }) {
  const firstLine = body.split('\n').find((line) => line.trim().length > 0)?.trim()
  return firstLine && isTitleHeading({ line: firstLine, title }) ? title : null
}

function createBlocks({ body, title }: { body: string; title: string }) {
  return body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !isTitleHeading({ line, title }))
    .map((line, index) => createBlock({ index, line }))
}

function createBlock({ index, line }: { index: number; line: string }): MobileEditorBlock {
  const bulletText = bulletContent({ line })

  return {
    id: `${index}:${line}`,
    kind: bulletText ? 'bullet' : 'paragraph',
    text: bulletText ?? line,
  }
}

function bulletContent({ line }: { line: string }) {
  const match = /^[-*]\s+(.+)$/.exec(line)
  return match?.[1] ?? null
}

function isTitleHeading({ line, title }: { line: string; title: string }) {
  return line === `# ${title}`
}

function blockToHtml(block: MobileEditorBlock) {
  const text = inlineTextToHtml(block.text)
  return block.kind === 'bullet' ? `<ul><li>${text}</li></ul>` : `<p>${text}</p>`
}

function titleHtml(title: string | null) {
  return title ? `<h1>${escapeHtml({ value: title })}</h1>` : ''
}

function inlineTextToHtml(value: string) {
  return escapeHtml({ value }).replace(/\[\[([^[\]]+?)\]\]/g, (_match, inner: string) => {
    const [target, alias] = inner.split('|')
    const label = alias?.trim() || target.trim()
    return `<a data-tolaria-wikilink="true" href="tolaria-note:${encodeURIComponent(target.trim())}">${label}</a>`
  })
}

function escapeHtml({ value }: { value: string }) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
