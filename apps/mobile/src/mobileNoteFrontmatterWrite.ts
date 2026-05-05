import { splitFrontmatter } from '@tolaria/markdown'

export type WritableMobileNoteFrontmatter = {
  archived?: boolean
  belongsTo?: string[]
  date?: string
  has?: string[]
  icon?: string
  relatedTo?: string[]
  status?: string
  tags?: string[]
  type?: string
}

const writableKeys = new Set(['archived', 'belongs_to', 'date', 'has', 'icon', 'related_to', 'status', 'tags', 'type'])

export function writeMobileNoteFrontmatter({
  content,
  metadata,
}: {
  content: string
  metadata: WritableMobileNoteFrontmatter
}) {
  const [frontmatter, body] = splitFrontmatter(content)
  const lines = [
    ...unknownFrontmatterLines(frontmatter),
    ...supportedFrontmatterLines(metadata),
  ]

  return lines.length > 0 ? `---\n${lines.join('\n')}\n---\n${body}` : body
}

function supportedFrontmatterLines(metadata: WritableMobileNoteFrontmatter) {
  return [
    booleanLine({ key: 'archived', value: metadata.archived }),
    scalarLine({ key: 'type', value: metadata.type }),
    scalarLine({ key: 'status', value: metadata.status }),
    scalarLine({ key: 'date', value: metadata.date }),
    scalarLine({ key: 'icon', value: metadata.icon }),
    listLine({ key: 'belongs_to', values: metadata.belongsTo }),
    listLine({ key: 'related_to', values: metadata.relatedTo }),
    listLine({ key: 'has', values: metadata.has }),
    listLine({ key: 'tags', values: metadata.tags }),
  ].filter(isText)
}

function unknownFrontmatterLines(frontmatter: string) {
  return frontmatter
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(isUnknownFrontmatterLine)
}

function scalarLine({ key, value }: { key: string; value: string | undefined }) {
  return isText(value) ? `${key}: ${yamlValue(value.trim())}` : null
}

function booleanLine({ key, value }: { key: string; value: boolean | undefined }) {
  return value ? `${key}: true` : null
}

function listLine({ key, values }: { key: string; values: string[] | undefined }) {
  const cleanedValues = values?.map((tag) => tag.trim()).filter(isText) ?? []
  return cleanedValues.length > 0 ? `${key}: [${cleanedValues.map(yamlValue).join(', ')}]` : null
}

function yamlValue(value: string) {
  return /^[A-Za-z0-9 _/-]+$/.test(value) ? value : JSON.stringify(value)
}

function isUnknownFrontmatterLine(line: string) {
  return isText(line) && line !== '---' && !writableKeys.has(line.split(':', 1)[0])
}

function isText(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
