export type LocalVaultFrontmatterValue = LocalVaultFrontmatterScalar | LocalVaultFrontmatterScalar[]
type LocalVaultFrontmatterScalar = string | number | boolean | null
type FrontmatterBody = string
type FrontmatterKey = string
type FrontmatterLine = string
type FrontmatterText = string
type MarkdownContent = string
type LocalVaultFrontmatterKeys = readonly FrontmatterKey[]

export type LocalVaultFrontmatter = Record<string, LocalVaultFrontmatterValue>

export type LocalVaultDocument = {
  body: MarkdownContent
  frontmatter: LocalVaultFrontmatter
}

const FRONTMATTER_OPEN = /^---\r?\n/
const FRONTMATTER_CLOSE = /\r?\n---(?:\r?\n|$)/

export function parseLocalVaultDocument(content: MarkdownContent): LocalVaultDocument {
  const open = content.match(FRONTMATTER_OPEN)
  if (!open) return { body: content, frontmatter: {} }

  const rest = content.slice(open[0].length)
  const close = rest.match(FRONTMATTER_CLOSE)
  if (!close || close.index === undefined) return { body: content, frontmatter: {} }

  const rawFrontmatter: FrontmatterBody = rest.slice(0, close.index)
  const body = rest.slice(close.index + close[0].length)

  return {
    body,
    frontmatter: parseFrontmatterLines(rawFrontmatter.split(/\r?\n/)),
  }
}

export function frontmatterScalar(
  frontmatter: LocalVaultFrontmatter,
  keys: LocalVaultFrontmatterKeys,
): string | null {
  return stringValue(firstFrontmatterValue(frontmatter, keys))
}

export function frontmatterList(
  frontmatter: LocalVaultFrontmatter,
  keys: LocalVaultFrontmatterKeys,
): string[] {
  const value = firstFrontmatterValue(frontmatter, keys)
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string')
  return []
}

export function frontmatterFlag(
  frontmatter: LocalVaultFrontmatter,
  keys: LocalVaultFrontmatterKeys,
): boolean {
  const value = firstFrontmatterValue(frontmatter, keys)
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return truthyText(value)
  return false
}

export function frontmatterRelationships(
  frontmatter: LocalVaultFrontmatter,
): Record<string, string[]> {
  const relationships: Record<string, string[]> = {}

  for (const [key, value] of Object.entries(frontmatter)) {
    if (reservedFrontmatterKeys.has(key)) continue

    const wikilinks = wikilinkValues(value)
    if (wikilinks.length > 0) relationships[key] = wikilinks
  }

  return relationships
}

export function frontmatterProperties(
  frontmatter: LocalVaultFrontmatter,
): Record<string, LocalVaultFrontmatterValue> {
  const properties: Record<string, LocalVaultFrontmatterValue> = {}

  for (const [key, value] of Object.entries(frontmatter)) {
    if (reservedFrontmatterKeys.has(key) || wikilinkValues(value).length > 0) continue
    properties[key] = value
  }

  return properties
}

function parseFrontmatterLines(lines: FrontmatterLine[]): LocalVaultFrontmatter {
  const frontmatter: LocalVaultFrontmatter = {}
  let listKey: string | null = null
  let listItems: LocalVaultFrontmatterScalar[] = []

  for (const line of lines) {
    const listItem = parseListItem(line)
    if (listKey && listItem !== null) {
      listItems.push(parseScalar(listItem))
      continue
    }

    flushList(frontmatter, listKey, listItems)
    listKey = null
    listItems = []

    const keyValue = parseKeyValueLine(line)
    if (!keyValue) continue

    const { key, value } = keyValue
    if (!value) {
      listKey = key
      continue
    }

    frontmatter[key] = parseValue(value)
  }

  flushList(frontmatter, listKey, listItems)
  return frontmatter
}

function parseKeyValueLine(line: FrontmatterLine): { key: FrontmatterKey; value: FrontmatterText } | null {
  if (!line || line.startsWith(' ') || line.startsWith('\t')) return null

  const match = line.match(/^["']?([^"':]+)["']?\s*:\s*(.*)$/)
  if (!match) return null

  return {
    key: match[1].trim(),
    value: match[2].trim(),
  }
}

function parseListItem(line: FrontmatterLine): FrontmatterText | null {
  const match = line.match(/^\s+-\s+(.*)$/)
  return match ? match[1].trim() : null
}

function flushList(
  frontmatter: LocalVaultFrontmatter,
  key: FrontmatterKey | null,
  items: LocalVaultFrontmatterScalar[],
) {
  if (key && items.length > 0) frontmatter[key] = items
}

function parseValue(value: FrontmatterText): LocalVaultFrontmatterValue {
  if (isInlineArrayLiteral(value)) return parseInlineArray(value)
  return parseScalar(value)
}

function isInlineArrayLiteral(value: FrontmatterText): boolean {
  return value.startsWith('[') && value.endsWith(']') && !value.startsWith('[[')
}

function parseInlineArray(value: FrontmatterText): LocalVaultFrontmatterScalar[] {
  return value.slice(1, -1).split(',').map((item) => parseScalar(item.trim()))
}

function parseScalar(value: FrontmatterText): LocalVaultFrontmatterScalar | null {
  const clean = unquote(value)
  const lower = clean.toLowerCase()

  if (lower === 'null') return null
  if (lower === 'true' || lower === 'yes') return true
  if (lower === 'false' || lower === 'no') return false
  if (isNumericScalar(clean)) return Number(clean)

  return clean
}

function unquote(value: FrontmatterText): FrontmatterText {
  const quote = value.at(0)
  if (!isQuote(quote)) return value
  return value.at(-1) === quote ? value.slice(1, -1) : value
}

function isQuote(value: string | undefined): value is '"' | '\'' {
  return quoteCharacters.has(value ?? '')
}

function isNumericScalar(value: FrontmatterText): boolean {
  return /^-?\d+(?:\.\d+)?$/.test(value)
}

function truthyText(value: FrontmatterText): boolean {
  const lower = value.toLowerCase()
  return lower === 'true' || lower === 'yes' || lower === '1'
}

function wikilinkValues(value: LocalVaultFrontmatterValue): string[] {
  if (typeof value === 'string' && value.includes('[[')) return [value]
  if (!Array.isArray(value)) return []

  return value.filter((item): item is string => typeof item === 'string' && item.includes('[['))
}

const reservedFrontmatterKeys = new Set([
  'Archived',
  'Is A',
  'Status',
  '_archived',
  '_color',
  '_favorite',
  '_favorite_index',
  '_icon',
  '_list_properties_display',
  '_order',
  '_organized',
  '_sidebar_label',
  '_sort',
  '_width',
  'aliases',
  'archived',
  'color',
  'favorite',
  'icon',
  'is_a',
  'order',
  'sidebar label',
  'sidebar_label',
  'sort',
  'status',
  'template',
  'title',
  'type',
  'Tags',
  'tags',
  'view',
  'visible',
  'width',
])

const quoteCharacters = new Set(['"', '\''])

function firstFrontmatterValue(
  frontmatter: LocalVaultFrontmatter,
  keys: LocalVaultFrontmatterKeys,
): LocalVaultFrontmatterValue | undefined {
  return keys.map((key) => frontmatter[key]).find((value) => value !== undefined)
}

function stringValue(value: LocalVaultFrontmatterValue | undefined): string | null {
  if (typeof value === 'string') return value
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  return null
}
