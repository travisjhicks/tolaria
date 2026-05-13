import {
  canSerializeMobileEditorTable,
  isMobileEditorTableBlock,
  mobileEditorTableMarkdown,
} from './mobileEditorTableMarkdown'
import { decodeMobileHtmlEntities } from './mobileHtmlEntities'

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
  'hr',
  'i',
  'img',
  'input',
  'label',
  'li',
  'ol',
  'p',
  'pre',
  's',
  'strike',
  'strong',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'ul',
])

export function serializeSupportedMobileEditorHtml(input: EditorHtmlInput) {
  const html = normalizeBlockSpacing(input)
  const blocks = html.match(/<(h[1-6]|p|ul|ol|blockquote|pre|table)(?:\s[^>]*)?>[\s\S]*?<\/\1>|<hr(?:\s[^>]*)?\s*\/?>/gi)
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
  return blocks.join('') === html && !blocks.some((block) => blocksUnsafeEditorOutput({ html: block }))
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

  if (isHorizontalRule(input)) {
    return '---'
  }

  if (isMobileEditorTableBlock(input)) {
    return mobileEditorTableMarkdown(input)
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

function isHorizontalRule(input: HtmlInput) {
  return input.html.match(/^<hr/i)
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
    decodeMobileHtmlEntities({ text: codeBlockText(input) }).trimEnd(),
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
  return decodeMobileHtmlEntities({ text: stripRemainingTags(markInlineHtml(input)).trim() })
}

function markInlineHtml(input: HtmlInput) {
  return input.html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<img\b[^>]*>/gi, (tag) => imageMarkdown({ tag }) ?? tag)
    .replace(/<(strong|b)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi, '**$2**')
    .replace(/<(em|i)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi, '*$2*')
    .replace(/<(s|strike|del)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi, '~~$2~~')
    .replace(/<code(?:\s[^>]*)?>([\s\S]*?)<\/code>/gi, '`$1`')
    .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, (tag, label) => linkMarkdown({ tag, label }) ?? tag)
}

function containsUnsupportedTag(input: HtmlInput) {
  return [...input.html.matchAll(/<\/?([a-z0-9-]+)/gi)]
    .some((match) => !supportedHtmlTags.has(match[1].toLowerCase()))
}

function blocksUnsafeEditorOutput(input: HtmlInput) {
  return containsUnsupportedTag(input) || containsUnsafeImage(input) || containsUnsafeLink(input) || containsUnsafeTable(input)
}

function containsUnsafeImage(input: HtmlInput) {
  return [...input.html.matchAll(/<img\b[^>]*>/gi)].some((match) => !imageMarkdown({ tag: match[0] }))
}

function containsUnsafeLink(input: HtmlInput) {
  return [...input.html.matchAll(/<a\b[^>]*>/gi)].some((match) => !linkMarkdown({ tag: match[0], label: '' }))
}

function containsUnsafeTable(input: HtmlInput) {
  return Boolean(isMobileEditorTableBlock(input)) && !canSerializeMobileEditorTable(input)
}

function imageMarkdown(input: { tag: string }) {
  const src = imageSource(input)
  if (!src) {
    return null
  }

  const alt = htmlAttribute({ tag: input.tag, name: 'alt' }) ?? ''
  return `![${decodeMobileHtmlEntities({ text: alt })}](${decodeMobileHtmlEntities({ text: src })})`
}

function imageSource(input: { tag: string }) {
  const src = htmlAttribute({ tag: input.tag, name: 'src' })
  return src && isPersistableImageSource({ src }) ? src : null
}

function linkMarkdown(input: { tag: string; label: string }) {
  const wikilink = wikilinkMarkdown(input)
  if (wikilink) {
    return wikilink
  }

  const href = linkDestination(input)
  return href ? `[${input.label}](${href})` : null
}

function wikilinkMarkdown(input: { tag: string; label: string }) {
  const href = htmlAttribute({ tag: input.tag, name: 'href' })
  if (!href?.startsWith('tolaria-note:')) {
    return null
  }

  const target = decodeURIComponent(href.slice('tolaria-note:'.length)).trim()
  const label = decodeMobileHtmlEntities({ text: input.label }).trim()
  if (!target) {
    return null
  }

  return label && label !== target ? `[[${target}|${label}]]` : `[[${target}]]`
}

function linkDestination(input: { tag: string }) {
  const href = htmlAttribute({ tag: input.tag, name: 'href' })
  return href && isPersistableLinkDestination({ href }) ? decodeMobileHtmlEntities({ text: href }) : null
}

function htmlAttribute(input: { tag: string; name: string }) {
  const match = input.tag.match(new RegExp(`${input.name}=["']([^"']+)["']`, 'i'))
  return match?.[1] ?? null
}

function isPersistableImageSource(input: { src: string }) {
  if (input.src.match(/[\n\r]/)) {
    return false
  }

  return isRemoteImageSource(input) || isRelativeImageSource(input)
}

function isRemoteImageSource(input: { src: string }) {
  return input.src.startsWith('https://') || input.src.startsWith('http://')
}

function isRelativeImageSource(input: { src: string }) {
  return !input.src.startsWith('/') && !input.src.startsWith('//') && !input.src.match(/^[A-Za-z][A-Za-z0-9+.-]*:/)
}

function isPersistableLinkDestination(input: { href: string }) {
  const href = decodeMobileHtmlEntities({ text: input.href })
  if (href.match(/[\n\r]/)) {
    return false
  }

  return isRemoteLinkDestination({ href }) || isMailLinkDestination({ href }) || isRelativeLinkDestination({ href }) || isWikilinkDestination({ href })
}

function isRemoteLinkDestination(input: { href: string }) {
  return input.href.startsWith('https://') || input.href.startsWith('http://')
}

function isMailLinkDestination(input: { href: string }) {
  return input.href.startsWith('mailto:')
}

function isRelativeLinkDestination(input: { href: string }) {
  return !input.href.startsWith('/') && !input.href.startsWith('//') && !input.href.match(/^[A-Za-z][A-Za-z0-9+.-]*:/)
}

function isWikilinkDestination(input: { href: string }) {
  return input.href.startsWith('tolaria-note:') && input.href.length > 'tolaria-note:'.length
}

function stripRemainingTags(value: string) {
  return value.replace(/<[^>]+>/g, '')
}
