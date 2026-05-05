type EditorHtmlInput = {
  editorHtml: string
}

type HtmlInput = {
  html: string
}

type ListItemInput = HtmlInput & {
  ordered: boolean
}

const supportedHtmlTags = new Set([
  'a',
  'b',
  'blockquote',
  'br',
  'code',
  'del',
  'div',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'i',
  'input',
  'label',
  'li',
  'ol',
  'p',
  'pre',
  's',
  'strike',
  'strong',
  'ul',
])

export function serializeSupportedMobileEditorHtml(input: EditorHtmlInput) {
  const html = normalizeBlockSpacing(input)
  const blocks = html.match(/<(h[1-6]|p|ul|ol|blockquote|pre)(?:\s[^>]*)?>[\s\S]*?<\/\1>/gi)
  if (!blocks) {
    return null
  }

  if (!canSerializeBlocks({ blocks, html })) {
    return null
  }

  return blocks.map((block) => serializeBlock({ html: block })).join('\n\n')
}

function canSerializeBlocks({
  blocks,
  html,
}: {
  blocks: RegExpMatchArray
  html: string
}) {
  return blocks.join('') === html && !blocks.some(containsUnsupportedTag)
}

function serializeBlock(input: HtmlInput) {
  const headingLevel = headingMarkdownLevel(input)
  if (headingLevel) {
    return `${'#'.repeat(headingLevel)} ${inlineMarkdown(input)}`
  }

  if (isListBlock(input)) {
    return listItemMarkdown(input).join('\n')
  }

  if (isBlockquote(input)) {
    return blockquoteMarkdown(input)
  }

  if (isCodeBlock(input)) {
    return codeBlockMarkdown(input)
  }

  return inlineMarkdown(input)
}

function normalizeBlockSpacing(input: EditorHtmlInput) {
  return input.editorHtml.trim().replace(/>\s+</g, '><')
}

function headingMarkdownLevel(input: HtmlInput) {
  const match = input.html.match(/^<h([1-6])/i)
  return match ? Number(match[1]) : null
}

function isListBlock(input: HtmlInput) {
  return input.html.match(/^<(ul|ol)/i)
}

function isBlockquote(input: HtmlInput) {
  return input.html.match(/^<blockquote/i)
}

function isCodeBlock(input: HtmlInput) {
  return input.html.match(/^<pre/i)
}

function listItemMarkdown(input: HtmlInput) {
  const ordered = input.html.match(/^<ol/i)
  return [...input.html.matchAll(/<li(?:\s[^>]*)?>([\s\S]*?)<\/li>/gi)].map((match) =>
    formatListItem({ ordered: Boolean(ordered), html: match[0] }),
  )
}

function formatListItem(input: ListItemInput) {
  const taskMarker = markdownTaskMarker(input)
  const prefix = taskMarker ? `- ${taskMarker}` : input.ordered ? '1.' : '-'

  return `${prefix} ${inlineMarkdown(input)}`
}

function markdownTaskMarker(input: HtmlInput) {
  if (input.html.match(/data-checked=["']true/i) || input.html.match(/<input[^>]+checked/i)) {
    return '[x]'
  }

  if (input.html.match(/data-checked=["']false/i) || input.html.match(/<input[^>]+type=["']checkbox/i)) {
    return '[ ]'
  }

  return null
}

function blockquoteMarkdown(input: HtmlInput) {
  const paragraphLines = [...input.html.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi)].map((match) =>
    inlineMarkdown({ html: match[0] }),
  )
  const lines = paragraphLines.length > 0 ? paragraphLines : [inlineMarkdown(input)]

  return lines.map((line) => `> ${line}`).join('\n')
}

function codeBlockMarkdown(input: HtmlInput) {
  return [
    `\`\`\`${codeBlockLanguage(input)}`,
    decodeHtmlEntities({ text: codeBlockText(input) }).trimEnd(),
    '```',
  ].join('\n')
}

function codeBlockLanguage(input: HtmlInput) {
  return input.html.match(/language-([A-Za-z0-9_-]+)/)?.[1] ?? ''
}

function codeBlockText(input: HtmlInput) {
  const code = input.html.match(/<code(?:\s[^>]*)?>([\s\S]*?)<\/code>/i)?.[1] ?? input.html
  return stripRemainingTags(code.replace(/<br\s*\/?>/gi, '\n'))
}

function inlineMarkdown(input: HtmlInput) {
  return decodeHtmlEntities({ text: stripRemainingTags(markInlineHtml(input)).trim() })
}

function markInlineHtml(input: HtmlInput) {
  return input.html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<(strong|b)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi, '**$2**')
    .replace(/<(em|i)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi, '*$2*')
    .replace(/<(s|strike|del)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi, '~~$2~~')
    .replace(/<code(?:\s[^>]*)?>([\s\S]*?)<\/code>/gi, '`$1`')
    .replace(/<a(?:\s[^>]*)?href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
}

function containsUnsupportedTag(input: string) {
  return [...input.matchAll(/<\/?([a-z0-9-]+)/gi)]
    .some((match) => !supportedHtmlTags.has(match[1].toLowerCase()))
}

function stripRemainingTags(value: string) {
  return value.replace(/<[^>]+>/g, '')
}

function decodeHtmlEntities(input: { text: string }) {
  return input.text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
}
