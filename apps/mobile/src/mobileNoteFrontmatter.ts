import { splitFrontmatter } from '@tolaria/markdown'

export type MobileNoteFrontmatter = {
  archived?: boolean
  belongsTo: string[]
  date?: string
  has: string[]
  icon?: string
  relatedTo: string[]
  status?: string
  tags: string[]
  type?: string
}

export function readMobileNoteFrontmatter(content: string): MobileNoteFrontmatter {
  const [frontmatter] = splitFrontmatter(content)
  const lines = frontmatterLines(frontmatter)

  return {
    archived: readField({ key: 'archived', lines, parse: parseBooleanField }),
    belongsTo: readField({ key: 'belongs_to', lines, parse: parseListField }),
    date: readField({ key: 'date', lines, parse: parseScalarField }),
    has: readField({ key: 'has', lines, parse: parseListField }),
    icon: readField({ key: 'icon', lines, parse: parseScalarField }),
    relatedTo: readField({ key: 'related_to', lines, parse: parseListField }),
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
  lines: string[]
  parse: (value: string | undefined) => T
}) {
  const value = readRawField({ key, lines })
  return parse(value)
}

function parseScalarField(value: string | undefined) {
  return value && !value.startsWith('[') ? unquote(value) : undefined
}

function parseBooleanField(value: string | undefined) {
  return value === 'true' ? true : undefined
}

function parseListField(value: string | undefined) {
  return value?.startsWith('[') ? readInlineList(value) : []
}

function readRawField({
  key,
  lines,
}: {
  key: string
  lines: string[]
}) {
  const prefix = `${key}:`
  return lines.find((line) => line.startsWith(prefix))?.slice(prefix.length).trim()
}

function readInlineList(value: string) {
  return value
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((item) => unquote(item.trim()))
    .filter(Boolean)
}

function frontmatterLines(frontmatter: string) {
  return frontmatter
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && line !== '---')
}

function unquote(value: string) {
  return value.replace(/^['"]|['"]$/g, '')
}
