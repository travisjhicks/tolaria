import type {
  MobileNote,
  MobileSavedView,
  MobileViewDefinition,
  MobileViewFilterCondition,
  MobileViewFilterGroup,
  MobileViewFilterNode,
  MobileViewFilterOp,
} from './mobileWorkspaceModel'

type ViewFileSource = {
  content: string
  relativePath: string
}

type YamlLine = {
  indent: number
  text: string
}

type FilterParseResult = {
  group: MobileViewFilterGroup
  nextIndex: number
}

type FieldKey = string
type ResolvedMobileField =
  | { kind: 'array'; values: string[] }
  | { kind: 'scalar'; value: string | number | boolean | null }
type FilterGroupKind = 'all' | 'any'
type BuiltInFieldResolver = (note: MobileNote) => ResolvedMobileField
type IndentLevel = number
type LineIndex = number
type MobileTextValues = string[]
type SortDirection = 'asc' | 'desc'
type SortValue = string | null
type ViewFilename = string
type ViewIndex = number
type ViewPath = string
type YamlText = string

const supportedFilterOps = new Set<MobileViewFilterOp>([
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'any_of',
  'none_of',
  'is_empty',
  'is_not_empty',
  'before',
  'after',
])

const builtInFieldResolvers: Record<string, BuiltInFieldResolver> = {
  archived: (note) => scalarField(note.archived === true),
  body: (note) => scalarField(note.snippet),
  created: (note) => scalarField(note.createdAt ?? note.created),
  favorite: (note) => scalarField(note.favorite),
  filename: (note) => scalarField(note.path?.split('/').at(-1) ?? note.id),
  isa: (note) => scalarField(note.type),
  modified: (note) => scalarField(note.modifiedAt ?? note.modified),
  status: (note) => scalarField(note.status),
  tags: (note) => arrayField(note.tags),
  title: (note) => scalarField(note.title),
  type: (note) => scalarField(note.type),
}

export function parseMobileSavedViewFile(file: ViewFileSource, index: ViewIndex): MobileSavedView | null {
  if (!isViewFile(file.relativePath)) return null

  const lines = yamlLines(file.content)
  const filename = file.relativePath.split('/').at(-1) ?? `view-${index + 1}.yml`
  const definition = parseViewDefinition(lines, filename, index)

  return {
    definition,
    filename,
    id: mobileSavedViewId(filename),
  }
}

export function orderedMobileSavedViews(views: MobileSavedView[]): MobileSavedView[] {
  return [...views].sort(compareSavedViews)
}

export function evaluateMobileSavedView(view: MobileSavedView, notes: MobileNote[]): MobileNote[] {
  const matchingNotes = notes.filter((note) => !note.archived && evaluateFilterGroup(view.definition.filters, note))
  return sortMobileViewNotes(matchingNotes, view.definition.sort)
}

export function mobileSavedViewId(filename: string) {
  return `view-${slugify(filename.replace(/\.[^.]+$/, ''))}`
}

function isViewFile(path: ViewPath) {
  return /^views\/[^/]+\.ya?ml$/u.test(path)
}

function parseViewDefinition(lines: YamlLine[], filename: ViewFilename, index: ViewIndex): MobileViewDefinition {
  return {
    color: optionalTopLevelString(lines, 'color'),
    filters: parseFilters(lines),
    icon: optionalTopLevelString(lines, 'icon'),
    listPropertiesDisplay: topLevelList(lines, 'listPropertiesDisplay'),
    name: optionalTopLevelString(lines, 'name') ?? fallbackViewName(filename, index),
    order: topLevelNumber(lines, 'order'),
    sort: optionalTopLevelString(lines, 'sort'),
  }
}

function parseFilters(lines: YamlLine[]): MobileViewFilterGroup {
  const filtersIndex = lines.findIndex((line) => line.indent === 0 && line.text === 'filters:')
  if (filtersIndex === -1) return { all: [] }

  const groupLine = lines[filtersIndex + 1]
  if (!groupLine || groupLine.indent !== 2) return { all: [] }

  return parseGroupAt(lines, filtersIndex + 1).group
}

function parseGroupAt(lines: YamlLine[], index: LineIndex): FilterParseResult {
  const line = lines[index]
  const kind = groupKind(line?.text ?? '')
  if (!line || !kind) return { group: { all: [] }, nextIndex: index + 1 }

  return parseGroupItems(lines, index + 1, line.indent + 2, kind)
}

function parseGroupItems(
  lines: YamlLine[],
  startIndex: LineIndex,
  itemIndent: IndentLevel,
  kind: FilterGroupKind,
): FilterParseResult {
  const nodes: MobileViewFilterNode[] = []
  let index = startIndex

  while (index < lines.length) {
    const line = lines[index]
    if (line.indent < itemIndent) break
    if (line.indent !== itemIndent || !line.text.startsWith('- ')) {
      index += 1
      continue
    }

    const parsed = parseFilterNode(lines, index, itemIndent)
    nodes.push(parsed.node)
    index = parsed.nextIndex
  }

  return { group: kind === 'any' ? { any: nodes } : { all: nodes }, nextIndex: index }
}

function parseFilterNode(
  lines: YamlLine[],
  index: LineIndex,
  itemIndent: IndentLevel,
): { nextIndex: number; node: MobileViewFilterNode } {
  const inlineText = lines[index].text.slice(2).trim()
  const inlineGroup = groupKind(inlineText)
  if (inlineGroup) {
    const result = parseGroupItems(lines, index + 1, itemIndent + 4, inlineGroup)
    return { nextIndex: result.nextIndex, node: result.group }
  }

  return parseCondition(lines, index, itemIndent, inlineText)
}

function parseCondition(
  lines: YamlLine[],
  index: LineIndex,
  itemIndent: IndentLevel,
  inlineText: YamlText,
): { nextIndex: number; node: MobileViewFilterCondition } {
  const entries: Record<string, unknown> = {}
  applyKeyValue(entries, inlineText)

  let nextIndex = index + 1
  while (nextIndex < lines.length && lines[nextIndex].indent > itemIndent) {
    const line = lines[nextIndex]
    if (line.indent === itemIndent + 2) {
      const parsed = parseConditionProperty(lines, nextIndex, itemIndent + 2)
      if (parsed) {
        Reflect.set(entries, parsed.key, parsed.value)
        nextIndex = parsed.nextIndex
        continue
      }
    }
    nextIndex += 1
  }

  return {
    nextIndex,
    node: normalizeCondition(entries),
  }
}

function parseConditionProperty(lines: YamlLine[], index: LineIndex, indent: IndentLevel) {
  const keyValue = keyValueText(lines[index].text)
  if (!keyValue) return null

  if (keyValue.value !== '') {
    return { key: keyValue.key, nextIndex: index + 1, value: parseYamlValue(keyValue.value) }
  }

  return {
    key: keyValue.key,
    nextIndex: index + 1 + listValues(lines, index + 1, indent + 2).consumed,
    value: listValues(lines, index + 1, indent + 2).values,
  }
}

function normalizeCondition(entries: Record<string, unknown>): MobileViewFilterCondition {
  return {
    field: typeof entries.field === 'string' ? entries.field : '',
    op: normalizedFilterOp(entries.op),
    regex: entries.regex === true,
    value: entries.value,
  }
}

function normalizedFilterOp(value: unknown): MobileViewFilterOp {
  if (typeof value !== 'string') return 'equals'
  return supportedFilterOps.has(value as MobileViewFilterOp) ? value as MobileViewFilterOp : 'equals'
}

function evaluateFilterGroup(group: MobileViewFilterGroup, note: MobileNote): boolean {
  if ('any' in group) return group.any.some((node) => evaluateFilterNode(node, note))
  return group.all.every((node) => evaluateFilterNode(node, note))
}

function evaluateFilterNode(node: MobileViewFilterNode, note: MobileNote): boolean {
  if (isFilterGroup(node)) return evaluateFilterGroup(node, note)
  return evaluateCondition(node, note)
}

function evaluateCondition(condition: MobileViewFilterCondition, note: MobileNote): boolean {
  const field = resolveNoteField(note, condition.field)
  const emptyResult = emptyConditionResult(condition.op, field)
  if (emptyResult !== null) return emptyResult

  if (field.kind === 'array') return evaluateArrayCondition(condition, field.values)
  return evaluateScalarCondition(condition, field.value)
}

function evaluateArrayCondition(condition: MobileViewFilterCondition, values: string[]) {
  const filterValues = conditionValues(condition.value)
  const normalizedValues = values.map(normalizedText)
  const target = normalizedText(condition.value)

  if (condition.op === 'any_of') return filterValues.some((value) => normalizedValues.includes(value))
  if (condition.op === 'none_of') return filterValues.every((value) => !normalizedValues.includes(value))
  if (condition.op === 'equals') return normalizedValues.includes(target)
  if (condition.op === 'not_equals') return !normalizedValues.includes(target)
  if (condition.op === 'contains') return normalizedValues.some((value) => value.includes(target))
  if (condition.op === 'not_contains') return normalizedValues.every((value) => !value.includes(target))

  return false
}

function evaluateScalarCondition(
  condition: MobileViewFilterCondition,
  value: string | number | boolean | null,
) {
  const dateResult = dateConditionResult(condition, value)
  if (dateResult !== null) return dateResult

  const text = normalizedText(value)
  const target = normalizedText(condition.value)
  if (condition.op === 'equals') return text === target
  if (condition.op === 'not_equals') return text !== target
  if (condition.op === 'contains') return text.includes(target)
  if (condition.op === 'not_contains') return !text.includes(target)
  if (condition.op === 'any_of') return conditionValues(condition.value).includes(text)
  if (condition.op === 'none_of') return !conditionValues(condition.value).includes(text)

  return false
}

function resolveNoteField(note: MobileNote, field: FieldKey): ResolvedMobileField {
  const lower = field.toLowerCase()
  return builtInFieldResolvers[lower]?.(note)
    ?? resolveRelationshipField(note, lower)
    ?? resolvePropertyField(note, lower)
    ?? scalarField(null)
}

function resolveRelationshipField(note: MobileNote, lowerField: FieldKey): ResolvedMobileField | null {
  const relationship = note.relationships.find((candidate) => relationshipKeys(candidate).includes(lowerField))
  if (!relationship) return null

  return arrayField(relationship.values.flatMap((value) => [value.title, value.ref ?? value.title]))
}

function resolvePropertyField(note: MobileNote, lowerField: FieldKey): ResolvedMobileField | null {
  const property = note.properties?.find((candidate) => candidate.key.toLowerCase() === lowerField)
  if (!property) return null

  return Array.isArray(property.value) ? arrayField(property.value) : scalarField(property.value)
}

function sortMobileViewNotes(notes: MobileNote[], sort: SortValue): MobileNote[] {
  const sortSpec = sortConfig(sort)
  if (!sortSpec) return notes

  return [...notes].sort((left, right) => compareNotes(left, right, sortSpec.field, sortSpec.direction))
}

function compareNotes(left: MobileNote, right: MobileNote, field: FieldKey, direction: SortDirection) {
  const result = compareFieldValue(sortFieldValue(left, field), sortFieldValue(right, field))
  return direction === 'asc' ? result : -result
}

function sortFieldValue(note: MobileNote, field: FieldKey): string | number | boolean | null {
  if (field === 'modified') return note.modifiedAt ?? 0
  if (field === 'created') return note.createdAt ?? 0
  if (field === 'title') return note.title
  if (field === 'type') return note.type
  if (field === 'status') return note.status
  return null
}

function sortConfig(sort: SortValue): { direction: SortDirection; field: FieldKey } | null {
  const [field, direction = 'asc'] = (sort ?? '').split(':')
  if (!field) return null
  return { direction: direction === 'desc' ? 'desc' : 'asc', field: field.toLowerCase() }
}

function compareFieldValue(left: string | number | boolean | null, right: string | number | boolean | null) {
  if (typeof left === 'number' && typeof right === 'number') return left - right
  return normalizedText(left).localeCompare(normalizedText(right))
}

function emptyConditionResult(op: MobileViewFilterOp, field: ResolvedMobileField): boolean | null {
  if (op !== 'is_empty' && op !== 'is_not_empty') return null

  const empty = field.kind === 'array'
    ? field.values.length === 0
    : field.value === null || field.value === '' || field.value === false

  return op === 'is_empty' ? empty : !empty
}

function dateConditionResult(
  condition: MobileViewFilterCondition,
  value: string | number | boolean | null,
): boolean | null {
  if (condition.op !== 'before' && condition.op !== 'after') return null

  const left = dateTimestamp(value)
  const right = dateTimestamp(condition.value)
  if (left === null || right === null) return false

  return condition.op === 'before' ? left < right : left > right
}

function dateTimestamp(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return null

  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : null
}

function yamlLines(content: string): YamlLine[] {
  return content
    .split(/\r?\n/u)
    .map((rawLine) => rawLine.replace(/\s+#.*$/u, ''))
    .filter((line) => line.trim().length > 0)
    .map((line) => ({ indent: line.search(/\S/u), text: line.trim() }))
}

function optionalTopLevelString(lines: YamlLine[], key: FieldKey) {
  const value = topLevelValue(lines, key)
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function topLevelNumber(lines: YamlLine[], key: FieldKey) {
  const value = topLevelValue(lines, key)
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function topLevelList(lines: YamlLine[], key: FieldKey) {
  const index = lines.findIndex((line) => line.indent === 0 && line.text === `${key}:`)
  if (index === -1) return undefined

  const { values } = listValues(lines, index + 1, 2)
  return values.length > 0 ? values.map(String) : undefined
}

function topLevelValue(lines: YamlLine[], key: FieldKey): unknown {
  const prefix = `${key}:`
  const line = lines.find((candidate) => candidate.indent === 0 && candidate.text.startsWith(prefix))
  if (!line) return null
  return parseYamlValue(line.text.slice(prefix.length).trim())
}

function listValues(lines: YamlLine[], startIndex: LineIndex, indent: IndentLevel) {
  const values: unknown[] = []
  let index = startIndex
  while (isListValue(lines[index], indent)) {
    values.push(parseYamlValue(lines[index].text.slice(2).trim()))
    index += 1
  }
  return { consumed: index - startIndex, values }
}

function isListValue(line: YamlLine | undefined, indent: number) {
  return line?.indent === indent && line.text.startsWith('- ')
}

function applyKeyValue(target: Record<string, unknown>, text: YamlText) {
  const parsed = keyValueText(text)
  if (parsed) Reflect.set(target, parsed.key, parseYamlValue(parsed.value))
}

function keyValueText(text: YamlText) {
  const separatorIndex = text.indexOf(':')
  if (separatorIndex === -1) return null

  return {
    key: text.slice(0, separatorIndex).trim(),
    value: text.slice(separatorIndex + 1).trim(),
  }
}

function parseYamlValue(value: YamlText): unknown {
  const unquoted = unquote(value)
  const lower = unquoted.toLowerCase()
  if (lower === 'true') return true
  if (lower === 'false') return false
  if (lower === 'null') return null
  if (/^-?\d+(?:\.\d+)?$/u.test(unquoted)) return Number(unquoted)
  if (unquoted.startsWith('[') && unquoted.endsWith(']')) return parseInlineList(unquoted)
  return unquoted
}

function parseInlineList(value: YamlText) {
  return value.slice(1, -1).split(',').map((item) => parseYamlValue(item.trim()))
}

function unquote(value: YamlText) {
  const quote = value.at(0)
  if ((quote === '"' || quote === '\'') && value.at(-1) === quote) return value.slice(1, -1)
  return value
}

function groupKind(text: YamlText): FilterGroupKind | null {
  if (text === 'all:') return 'all'
  if (text === 'any:') return 'any'
  return null
}

function isFilterGroup(node: MobileViewFilterNode): node is MobileViewFilterGroup {
  return 'all' in node || 'any' in node
}

function relationshipKeys(relationship: MobileNote['relationships'][number]) {
  return [
    relationship.key,
    relationship.label,
    relationship.kind,
    relationship.kind === 'belongsTo' ? 'belongs_to' : null,
    relationship.kind === 'relatedTo' ? 'related_to' : null,
  ].filter((value): value is string => Boolean(value)).map((value) => value.toLowerCase())
}

function scalarField(value: string | number | boolean | null): ResolvedMobileField {
  return { kind: 'scalar', value }
}

function arrayField(values: MobileTextValues): ResolvedMobileField {
  return { kind: 'array', values }
}

function conditionValues(value: unknown): string[] {
  return Array.isArray(value) ? value.map(normalizedText) : [normalizedText(value)]
}

function normalizedText(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value).trim().toLowerCase()
}

function fallbackViewName(filename: ViewFilename, index: ViewIndex) {
  const fallback = filename.replace(/\.[^.]+$/, '').replaceAll('-', ' ').trim()
  return fallback ? titleCase(fallback) : `View ${index + 1}`
}

function titleCase(value: YamlText) {
  return value.replace(/\b\w/gu, (char) => char.toUpperCase())
}

function compareSavedViews(left: MobileSavedView, right: MobileSavedView) {
  const leftOrder = left.definition.order
  const rightOrder = right.definition.order
  if (typeof leftOrder === 'number' && typeof rightOrder === 'number') return leftOrder - rightOrder
  if (typeof leftOrder === 'number') return -1
  if (typeof rightOrder === 'number') return 1
  return left.definition.name.localeCompare(right.definition.name)
}

function slugify(value: YamlText) {
  return value.toLowerCase().replace(/[^a-z0-9]+/gu, '-').replace(/^-|-$/gu, '') || 'view'
}
