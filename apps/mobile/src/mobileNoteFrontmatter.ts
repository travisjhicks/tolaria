import { splitFrontmatter } from '@tolaria/markdown'

export type MobileNoteFrontmatter = {
  archived?: boolean
  belongsTo: string[]
  customProperties: Record<string, string>
  date?: string
  favorite?: boolean
  favoriteIndex?: number
  has: string[]
  icon?: string
  relatedTo: string[]
  relationships: Record<string, string[]>
  status?: string
  tags: string[]
  type?: string
}

type FrontmatterEntry = readonly [FrontmatterKey, FrontmatterValue]
type FrontmatterKey = string
type FrontmatterLine = string
type FrontmatterValue = string

const supportedKeys = new Set([
  '_favorite',
  '_favorite_index',
  'archived',
  'belongs_to',
  'date',
  'has',
  'icon',
  'related_to',
  'status',
  'tags',
  'type',
])

export function readMobileNoteFrontmatter(content: string): MobileNoteFrontmatter {
  const [frontmatter] = splitFrontmatter(content)
  const lines = frontmatterLines(frontmatter)

  return {
    archived: readField({ key: 'archived', lines, parse: parseBooleanField }),
    belongsTo: readField({ key: 'belongs_to', lines, parse: parseListField }),
    customProperties: readCustomProperties(lines),
    date: readField({ key: 'date', lines, parse: parseScalarField }),
    favorite: readField({ key: '_favorite', lines, parse: parseBooleanField }),
    favoriteIndex: readField({ key: '_favorite_index', lines, parse: parseNumberField }),
    has: readField({ key: 'has', lines, parse: parseListField }),
    icon: readField({ key: 'icon', lines, parse: parseScalarField }),
    relatedTo: readField({ key: 'related_to', lines, parse: parseListField }),
    relationships: readCustomRelationships(lines),
    status: readField({ key: 'status', lines, parse: parseScalarField }),
    tags: readField({ key: 'tags', lines, parse: parseListField }),
    type: readField({ key: 'type', lines, parse: parseScalarField }),
  }
}

function readField<T>({
  key,
  lines,
  parse,
}: {
  key: string
  lines: FrontmatterLine[]
  parse: (value: FrontmatterValue | undefined) => T
}) {
  const value = readRawField({ key, lines })
  return parse(value)
}

function parseScalarField(value: FrontmatterValue | undefined) {
  return value && !value.startsWith('[') ? unquote(value) : undefined
}

function parseBooleanField(value: FrontmatterValue | undefined) {
  return value === 'true' ? true : undefined
}

function parseNumberField(value: FrontmatterValue | undefined) {
  const parsed = value ? Number(value) : Number.NaN
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseListField(value: FrontmatterValue | undefined) {
  return value?.startsWith('[') ? readInlineList(value) : []
}

function readCustomProperties(lines: FrontmatterLine[]) {
  return Object.fromEntries(
    frontmatterEntries(lines)
      .filter(([key, value]) => !supportedKeys.has(key) && !value.startsWith('['))
      .map(([key, value]) => [key, unquote(value)]),
  )
}

function readCustomRelationships(lines: FrontmatterLine[]) {
  return Object.fromEntries(
    frontmatterEntries(lines)
      .filter(([key, value]) => !supportedKeys.has(key) && value.startsWith('['))
      .map(([key, value]) => [key, readInlineList(value)]),
  )
}

function frontmatterEntries(lines: FrontmatterLine[]): FrontmatterEntry[] {
  return lines
    .map((line) => {
      const separator = line.indexOf(':')
      return separator > 0
        ? [line.slice(0, separator).trim(), line.slice(separator + 1).trim()] as const
        : null
    })
    .filter(isEntry)
}

function readRawField({
  key,
  lines,
}: {
  key: FrontmatterKey
  lines: FrontmatterLine[]
}) {
  const prefix = `${key}:`
  return lines.find((line) => line.startsWith(prefix))?.slice(prefix.length).trim()
}

function readInlineList(value: FrontmatterValue) {
  return value
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((item) => unquote(item.trim()))
    .filter(Boolean)
}

function frontmatterLines(frontmatter: string): FrontmatterLine[] {
  return frontmatter
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && line !== '---')
}

function unquote(value: FrontmatterValue) {
  return value.replace(/^['"]|['"]$/g, '')
}

function isEntry<T>(value: T | null): value is T {
  return value !== null
}
