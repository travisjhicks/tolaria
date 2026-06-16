export type MobileMarkdownListKind = 'bullet' | 'ordered' | 'task'

export type MobileMarkdownListItem = {
  checked?: boolean
  depth: number
  markerNumber?: number
  text: string
}

type InlineHtmlRenderer = (text: string) => string
type ListRenderOptions = {
  depth: number
  index: number
  inlineHtml: InlineHtmlRenderer
  items: MobileMarkdownListItem[]
  kind: MobileMarkdownListKind
}
type RenderListResult = { html: string; nextIndex: number }

export function mobileMarkdownListHtml(
  kind: MobileMarkdownListKind,
  items: MobileMarkdownListItem[],
  inlineHtml: InlineHtmlRenderer,
): string {
  if (items.length === 0) return ''
  return renderList({ depth: items[0]?.depth ?? 0, index: 0, inlineHtml, items, kind }).html
}

function renderList({ depth, index, inlineHtml, items, kind }: ListRenderOptions): RenderListResult {
  const chunks = [listOpenTag(kind, items[index])]
  let cursor = index

  while (cursor < items.length) {
    const chunk = renderNextListChunk({ depth, index: cursor, inlineHtml, items, kind })
    if (!chunk) break
    chunks.push(chunk.html)
    cursor = chunk.nextIndex
  }

  chunks.push(listCloseTag(kind))
  return { html: chunks.join(''), nextIndex: cursor }
}

function renderNextListChunk(options: ListRenderOptions): RenderListResult | null {
  const item = options.items[options.index]
  if (!item || item.depth < options.depth) return null
  if (item.depth > options.depth) return renderList({ ...options, depth: item.depth })

  const child = renderChildList({ ...options, index: options.index + 1 })
  return {
    html: listItemHtml(options.kind, item, options.inlineHtml(item.text), child.html),
    nextIndex: child.nextIndex,
  }
}

function renderChildList(options: ListRenderOptions): RenderListResult {
  const nextItem = options.items[options.index]
  return nextItem && nextItem.depth > options.depth
    ? renderList({ ...options, depth: nextItem.depth })
    : { html: '', nextIndex: options.index }
}

function listOpenTag(kind: MobileMarkdownListKind, firstItem?: MobileMarkdownListItem): string {
  if (kind === 'ordered') return orderedListOpenTag(firstItem)
  if (kind === 'task') return '<ul data-type="taskList">'
  return '<ul>'
}

function orderedListOpenTag(firstItem?: MobileMarkdownListItem): string {
  const start = firstItem?.markerNumber
  return start && start > 1 ? `<ol start="${start}">` : '<ol>'
}

function listCloseTag(kind: MobileMarkdownListKind): string {
  return kind === 'ordered' ? '</ol>' : '</ul>'
}

function listItemHtml(
  kind: MobileMarkdownListKind,
  item: MobileMarkdownListItem,
  content: string,
  children: string,
): string {
  if (kind !== 'task') return `<li><p>${content}</p>${children}</li>`

  const checkedAttr = item.checked ? 'true' : 'false'
  const inputChecked = item.checked ? ' checked="checked"' : ''
  return [
    `<li data-type="taskItem" data-checked="${checkedAttr}">`,
    `<label><input type="checkbox"${inputChecked}><span></span></label>`,
    `<div><p>${content}</p>${children}</div>`,
    '</li>',
  ].join('')
}
