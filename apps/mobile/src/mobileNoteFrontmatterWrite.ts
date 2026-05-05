import { splitFrontmatter } from '@tolaria/markdown'

export type WritableMobileNoteFrontmatter = {
  archived?: boolean
  belongsTo?: string[]
  customProperties?: Record<string, string>
  date?: string
  favorite?: boolean
  favoriteIndex?: number | null
  has?: string[]
  icon?: string
  relatedTo?: string[]
  removedCustomPropertyKeys?: string[]
  removedRelationshipKeys?: string[]
  relationships?: Record<string, string[]>
  status?: string
  tags?: string[]
  type?: string
}

const writableKeys = new Set(['_favorite', '_favorite_index', 'archived', 'belongs_to', 'date', 'has', 'icon', 'related_to', 'status', 'tags', 'type'])

export function writeMobileNoteFrontmatter({
  content,
  metadata,
}: {
  content: string
  metadata: WritableMobileNoteFrontmatter
}) {
  const [frontmatter, body] = splitFrontmatter(content)
  const lines = [
    ...unknownFrontmatterLines({ frontmatter, metadata }),
    ...supportedFrontmatterLines(metadata),
  ]

  return lines.length > 0 ? `---\n${lines.join('\n')}\n---\n${body}` : body
}

function supportedFrontmatterLines(metadata: WritableMobileNoteFrontmatter) {
  return [
    booleanLine({ key: '_favorite', value: metadata.favorite }),
    numberLine({ key: '_favorite_index', value: metadata.favoriteIndex }),
    booleanLine({ key: 'archived', value: metadata.archived }),
    scalarLine({ key: 'type', value: metadata.type }),
    scalarLine({ key: 'status', value: metadata.status }),
    scalarLine({ key: 'date', value: metadata.date }),
    scalarLine({ key: 'icon', value: metadata.icon }),
    listLine({ key: 'belongs_to', values: metadata.belongsTo }),
    listLine({ key: 'related_to', values: metadata.relatedTo }),
    listLine({ key: 'has', values: metadata.has }),
    listLine({ key: 'tags', values: metadata.tags }),
    ...customPropertyLines(metadata.customProperties),
    ...customRelationshipLines(metadata.relationships),
  ].filter(isText)
}

function unknownFrontmatterLines({
  frontmatter,
  metadata,
}: {
  frontmatter: string
  metadata: WritableMobileNoteFrontmatter
}) {
  const dynamicKeys = new Set([
    ...Object.keys(metadata.customProperties ?? {}),
    ...Object.keys(metadata.relationships ?? {}),
    ...(metadata.removedCustomPropertyKeys ?? []),
    ...(metadata.removedRelationshipKeys ?? []),
  ])
  return frontmatter
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => isUnknownFrontmatterLine({ dynamicKeys, line }))
}

function scalarLine({ key, value }: { key: string; value: string | undefined }) {
  return isText(value) ? `${key}: ${yamlValue(value.trim())}` : null
}

function numberLine({ key, value }: { key: string; value: number | null | undefined }) {
  return typeof value === 'number' && Number.isFinite(value) ? `${key}: ${value}` : null
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

function isUnknownFrontmatterLine({
  dynamicKeys,
  line,
}: {
  dynamicKeys: Set<string>
  line: string
}) {
  const key = line.split(':', 1)[0]
  return isText(line) && line !== '---' && !writableKeys.has(key) && !dynamicKeys.has(key)
}

function customPropertyLines(properties: Record<string, string> | undefined) {
  return frontmatterRecordEntries(properties).map(([key, value]) => scalarLine({ key, value }))
}

function customRelationshipLines(relationships: Record<string, string[]> | undefined) {
  return frontmatterRecordEntries(relationships).map(([key, values]) => listLine({ key, values }))
}

function frontmatterRecordEntries<T>(record: Record<string, T> | undefined) {
  return Object.entries(record ?? {})
    .map(([key, value]) => [key.trim(), value] as const)
    .filter(([key]) => isText(key) && !writableKeys.has(key))
    .sort(([left], [right]) => left.localeCompare(right))
}

function isText(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
