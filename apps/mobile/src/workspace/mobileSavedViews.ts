import type {
  MobileNote,
  MobileSavedView,
  MobileViewDefinition,
  MobileViewFilterCondition,
  MobileViewFilterGroup,
  MobileViewFilterNode,
  MobileViewFilterOp,
} from './mobileWorkspaceModel'
import { evaluateArrayFieldCondition } from '../../../../src/utils/viewFilterArrayFields'
import safeRegex from 'safe-regex2'

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
type MobileArrayFieldKind = 'property' | 'relationship'
type ResolvedMobileField =
  | { arrayKind: MobileArrayFieldKind; kind: 'array'; values: string[] }
  | { kind: 'scalar'; value: string | number | boolean | null }
type FilterGroupKind = 'all' | 'any'
type BuiltInFieldResolver = (note: MobileNote) => ResolvedMobileField
type IndentLevel = number
type LineIndex = number
type MobileTextValues = string[]
type SortDirection = 'asc' | 'desc'
type SortField = { key: FieldKey; kind: 'builtIn' | 'property' }
type SortFieldValue = string | number | boolean | string[] | null
type SortValue = string | null
type ViewFilename = string
type ViewIndex = number
type ViewPath = string
type YamlText = string
type YamlScalar = string | number | boolean | null

const viewFilenameExtension = '.yml'
const fallbackViewFilenameStem = 'view'
const windowsReservedDeviceNames = new Set([
  'CON',
  'PRN',
  'AUX',
  'NUL',
  'COM1',
  'COM2',
  'COM3',
  'COM4',
  'COM5',
  'COM6',
  'COM7',
  'COM8',
  'COM9',
  'LPT1',
  'LPT2',
  'LPT3',
  'LPT4',
  'LPT5',
  'LPT6',
  'LPT7',
  'LPT8',
  'LPT9',
])

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
const builtInSortFields = new Set(['created', 'modified', 'status', 'title'])
const regexFilterOps = new Set<MobileViewFilterOp>(['contains', 'equals', 'not_contains', 'not_equals'])
const maxUserRegexLength = 256
const regexRepeatLimit = 25
const sortableDatePrefixPattern = /^\d{4}-\d{2}-\d{2}/u
const unknownStatusSortOrder = 999
const statusSortOrder = new Map<string, number>([
  ['Active', 0],
  ['Paused', 1],
  ['Done', 2],
  ['Finished', 3],
])

const builtInFieldResolvers: Record<string, BuiltInFieldResolver> = {
  archived: (note) => scalarField(note.archived === true),
  body: (note) => scalarField(note.snippet),
  favorite: (note) => scalarField(note.favorite),
  filename: (note) => scalarField(note.path?.split('/').at(-1) ?? note.id),
  isa: (note) => scalarField(note.type),
  status: (note) => scalarField(note.status),
  tags: (note) => arrayField(note.tags, 'property'),
  title: (note) => scalarField(note.title),
  type: (note) => scalarField(note.type),
}
const doubleQuote = '"'
const singleQuote = '\''
const doubleQuotedScalarEscapes: Record<string, string> = {
  '\\\\': '\\',
  '\\"': '"',
  '\\/': '/',
  '\\b': '\b',
  '\\f': '\f',
  '\\n': '\n',
  '\\r': '\r',
  '\\t': '\t',
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

export type MobileViewMoveDirection = 'down' | 'up'

export function nextMobileSavedViewOrder(views: MobileSavedView[]): number {
  const explicitOrders = views
    .map((view) => view.definition.order)
    .filter((order): order is number => typeof order === 'number' && Number.isFinite(order))

  return explicitOrders.length > 0 ? Math.max(...explicitOrders) + 1 : views.length
}

export function canMoveMobileSavedView(
  views: MobileSavedView[],
  viewId: string,
  direction: MobileViewMoveDirection,
): boolean {
  const index = savedViewIndex(views, viewId)
  if (index === -1) return false

  const nextIndex = savedViewDestinationIndex(index, direction)
  return nextIndex >= 0 && nextIndex < views.length
}

export function moveMobileSavedView(
  views: MobileSavedView[],
  viewId: string,
  direction: MobileViewMoveDirection,
): MobileSavedView[] | null {
  if (!canMoveMobileSavedView(views, viewId, direction)) return null

  const index = savedViewIndex(views, viewId)
  const nextIndex = savedViewDestinationIndex(index, direction)
  const reordered = [...views]
  const [view] = reordered.splice(index, 1)
  reordered.splice(nextIndex, 0, view)
  return reordered
}

export function mobileSavedViewOrderUpdates(views: MobileSavedView[]): MobileSavedView[] {
  return views.map((view, order) => ({
    ...view,
    definition: { ...view.definition, order },
  }))
}

export function evaluateMobileSavedView(view: MobileSavedView, notes: MobileNote[]): MobileNote[] {
  const matchingNotes = notes.filter((note) => !note.archived && evaluateFilterGroup(view.definition.filters, note))
  return sortMobileNotesBySort(matchingNotes, view.definition.sort)
}

export function mobileSavedViewId(filename: string) {
  return `view-${slugify(filename.replace(/\.[^.]+$/, ''))}`
}

export function createMobileSavedViewFilename(name: string, existingFilenames: string[] = []): string {
  const baseStem = slugifyViewFilenameStem(name)
  const usedFilenames = new Set(existingFilenames.map((filename) => filename.toLocaleLowerCase()))
  let candidateStem = baseStem
  let suffix = 2

  while (usedFilenames.has(viewFilenameFromStem(candidateStem).toLocaleLowerCase())) {
    candidateStem = `${baseStem}-${suffix}`
    suffix += 1
  }

  return viewFilenameFromStem(candidateStem)
}

export function mobileSavedViewPath(filename: ViewFilename): ViewPath {
  return `views/${filename}`
}

export function serializeMobileSavedViewDefinition(definition: MobileViewDefinition): string {
  const lines = [
    `name: ${yamlScalar(definition.name)}`,
    `icon: ${yamlScalar(definition.icon)}`,
    `color: ${yamlScalar(definition.color)}`,
    `sort: ${yamlScalar(definition.sort)}`,
  ]

  if (typeof definition.order === 'number') lines.push(`order: ${definition.order}`)
  if (definition.listPropertiesDisplay?.length) {
    lines.push('listPropertiesDisplay:')
    lines.push(...definition.listPropertiesDisplay.map((item) => `  - ${yamlScalar(item)}`))
  }

  lines.push('filters:')
  lines.push(...serializedFilterGroup(definition.filters, 2))

  return `${lines.join('\n')}\n`
}

function isViewFile(path: ViewPath) {
  return /^(?:views|\.laputa\/views)\/[^/]+\.ya?ml$/u.test(path)
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

  const list = listValues(lines, index + 1, indent + 2)
  return {
    key: keyValue.key,
    nextIndex: index + 1 + list.consumed,
    value: list.values.length > 0 ? list.values : null,
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

function evaluateFilterGroup(
  group: MobileViewFilterGroup,
  note: MobileNote,
): boolean {
  if ('any' in group) return evaluateAnyFilterNodes(group.any, note)
  return evaluateAllFilterNodes(group.all, note)
}

function evaluateAnyFilterNodes(
  nodes: MobileViewFilterNode[],
  note: MobileNote,
): boolean {
  for (const node of nodes) {
    if (evaluateFilterNode(node, note)) return true
  }
  return false
}

function evaluateAllFilterNodes(
  nodes: MobileViewFilterNode[],
  note: MobileNote,
): boolean {
  for (const node of nodes) {
    if (!evaluateFilterNode(node, note)) return false
  }
  return true
}

function evaluateFilterNode(
  node: MobileViewFilterNode,
  note: MobileNote,
): boolean {
  if (isFilterGroup(node)) return evaluateFilterGroup(node, note)
  return evaluateCondition(node, note)
}

function evaluateCondition(
  condition: MobileViewFilterCondition,
  note: MobileNote,
): boolean {
  const field = resolveNoteField(note, condition.field)
  const emptyResult = emptyConditionResult(condition.op, field)
  if (emptyResult !== null) return emptyResult

  const regex = conditionRegex(condition)
  if (usesRegex(condition) && !regex) return false

  if (field.kind === 'array') return evaluateArrayCondition(condition, field, regex)
  return evaluateScalarCondition(condition, field.value, regex)
}

function evaluateArrayCondition(
  condition: MobileViewFilterCondition,
  field: Extract<ResolvedMobileField, { kind: 'array' }>,
  regex: RegExp | null,
) {
  return evaluateArrayFieldCondition({
    arrayKind: field.arrayKind,
    cond: condition,
    condVal: textValue(condition.value),
    regex,
    values: field.values,
  })
}

function textMatchResult(op: MobileViewFilterOp, matched: boolean): boolean {
  if (op === 'contains' || op === 'equals') return matched
  if (op === 'not_contains' || op === 'not_equals') return !matched
  return false
}

function conditionRegex(condition: MobileViewFilterCondition): RegExp | null {
  if (!usesRegex(condition)) return null

  const source = textValue(condition.value)
  if (source.length > maxUserRegexLength) return null

  try {
    const pattern = new RegExp(source, 'i')
    return safeRegex(source, { limit: regexRepeatLimit }) ? pattern : null
  } catch {
    return null
  }
}

function usesRegex(condition: MobileViewFilterCondition): boolean {
  return condition.regex === true && regexFilterOps.has(condition.op)
}

function evaluateScalarCondition(
  condition: MobileViewFilterCondition,
  value: string | number | boolean | null,
  regex: RegExp | null,
) {
  const dateResult = dateConditionResult(condition, value)
  if (dateResult !== null) return dateResult

  if (regex) return textMatchResult(condition.op, regex.test(textValue(value)))

  return scalarTextConditionResult(condition, value)
}

function scalarTextConditionResult(
  condition: MobileViewFilterCondition,
  value: string | number | boolean | null,
) {
  const comparisonResult = scalarTextComparisonResult(condition.op, value, condition.value)
  if (comparisonResult !== null) return comparisonResult

  const setResult = scalarSetConditionResult(condition, value)
  if (setResult !== null) return setResult
  return false
}

function scalarTextComparisonResult(op: MobileViewFilterOp, value: unknown, target: unknown): boolean | null {
  if (op === 'equals') return scalarEquals(value, target)
  if (op === 'not_equals') return !scalarEquals(value, target)
  if (op === 'contains') return scalarContains(value, target)
  if (op === 'not_contains') return !scalarContains(value, target)
  return null
}

function scalarEquals(value: unknown, target: unknown): boolean {
  const text = nullableText(value)
  const targetText = nullableText(target)
  if (text === null || targetText === null) return text === targetText
  return normalizedText(text) === normalizedText(targetText)
}

function scalarContains(value: unknown, target: unknown): boolean {
  const text = nullableText(value)
  const targetText = nullableText(target)
  if (text === null || targetText === null) return false
  return normalizedText(text).includes(normalizedText(targetText))
}

function scalarSetConditionResult(condition: MobileViewFilterCondition, value: unknown): boolean | null {
  const text = nullableText(value)
  if (condition.op === 'any_of') return text === null ? false : conditionValues(condition.value).includes(normalizedText(text))
  if (condition.op === 'none_of') return text === null ? true : !conditionValues(condition.value).includes(normalizedText(text))
  return null
}

function resolveNoteField(
  note: MobileNote,
  field: FieldKey,
): ResolvedMobileField {
  const lower = field.toLowerCase()
  return builtInFieldResolvers[lower]?.(note)
    ?? resolveRelationshipField(note, lower)
    ?? resolvePropertyField(note, lower)
    ?? scalarField(null)
}

function resolveRelationshipField(note: MobileNote, lowerField: FieldKey): ResolvedMobileField | null {
  const relationship = note.relationships.find((candidate) => relationshipKeys(candidate).includes(lowerField))
  if (!relationship) return null

  return arrayField(relationship.values.map((value) => value.ref ?? value.title), 'relationship')
}

function resolvePropertyField(note: MobileNote, lowerField: FieldKey): ResolvedMobileField | null {
  const property = note.properties?.find((candidate) => candidate.key.toLowerCase() === lowerField)
  if (!property) return null

  return Array.isArray(property.value) ? arrayField(property.value, 'property') : scalarField(property.value)
}

export function sortMobileNotesBySort(notes: MobileNote[], sort: SortValue): MobileNote[] {
  const sortSpec = sortConfig(sort)
  if (!sortSpec) return notes

  return [...notes].sort((left, right) => compareNotes(left, right, sortSpec.field, sortSpec.direction))
}

function compareNotes(left: MobileNote, right: MobileNote, field: SortField, direction: SortDirection) {
  if (field.kind === 'builtIn' && field.key === 'status') return compareStatusNotes(left, right, direction)

  const leftValue = sortFieldValue(left, field)
  const rightValue = sortFieldValue(right, field)
  const missingResult = compareMissingValues(leftValue, rightValue)
  if (missingResult !== null) return missingResult

  const result = comparePresentFieldValue(leftValue, rightValue)
  return direction === 'asc' ? result : -result
}

function sortFieldValue(note: MobileNote, field: SortField): SortFieldValue {
  if (field.kind === 'property') return sortPropertyValue(note, field.key)
  if (field.key === 'modified') return displayTimestamp(note)
  if (field.key === 'created') return note.createdAt ?? note.modifiedAt ?? 0
  if (field.key === 'title') return note.title
  if (field.key === 'type') return note.type
  if (field.key === 'status') return note.status
  return null
}

function compareStatusNotes(left: MobileNote, right: MobileNote, direction: SortDirection) {
  const leftOrder = statusSortOrder.get(left.status ?? '') ?? unknownStatusSortOrder
  const rightOrder = statusSortOrder.get(right.status ?? '') ?? unknownStatusSortOrder
  if (leftOrder !== rightOrder) {
    const result = leftOrder - rightOrder
    return direction === 'asc' ? result : -result
  }

  return displayTimestamp(right) - displayTimestamp(left)
}

function displayTimestamp(note: MobileNote) {
  return note.modifiedAt ?? note.createdAt ?? 0
}

function sortPropertyValue(note: MobileNote, key: FieldKey): SortFieldValue {
  const property = note.properties?.find((candidate) => candidate.key.toLowerCase() === key.toLowerCase())
  return property?.value ?? null
}

function sortConfig(sort: SortValue): { direction: SortDirection; field: SortField } | null {
  const rawSort = sort ?? ''
  const directionSeparator = rawSort.lastIndexOf(':')
  if (directionSeparator <= 0) return null

  const direction = rawSort.slice(directionSeparator + 1)
  const rawField = rawSort.slice(0, directionSeparator)
  if (direction !== 'asc' && direction !== 'desc') return null

  return { direction, field: sortField(rawField) }
}

function sortField(rawField: FieldKey): SortField {
  const propertyPrefix = 'property:'
  if (rawField.startsWith(propertyPrefix)) {
    return { key: rawField.slice(propertyPrefix.length), kind: 'property' }
  }

  const field = rawField.toLowerCase()
  return builtInSortFields.has(field) ? { key: field, kind: 'builtIn' } : { key: rawField, kind: 'property' }
}

function compareMissingValues(left: SortFieldValue, right: SortFieldValue) {
  if (left === null && right === null) return 0
  if (left === null) return 1
  if (right === null) return -1
  return null
}

function comparePresentFieldValue(left: SortFieldValue, right: SortFieldValue) {
  if (typeof left === 'number' && typeof right === 'number') return left - right
  if (typeof left === 'boolean' && typeof right === 'boolean') return Number(left) - Number(right)

  const leftTimestamp = sortableDateTimestamp(left)
  const rightTimestamp = sortableDateTimestamp(right)
  if (leftTimestamp !== null && rightTimestamp !== null) return leftTimestamp - rightTimestamp

  return normalizedText(left).localeCompare(normalizedText(right))
}

function sortableDateTimestamp(value: unknown): number | null {
  if (typeof value !== 'string') return null
  if (!sortableDatePrefixPattern.test(value)) return null

  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? null : timestamp
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
  const left = dateTimestamp(value)
  const right = dateTimestamp(condition.value)
  if (left === null || right === null) return null

  if (condition.op === 'equals') return isSameLocalDay(left, right)
  if (condition.op === 'not_equals') return !isSameLocalDay(left, right)
  if (condition.op !== 'before' && condition.op !== 'after') return null

  return condition.op === 'before' ? left < right : left > right
}

function dateTimestamp(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return normalizedTimestamp(value)
  if (typeof value !== 'string') return null

  const parsed = parseDateFilterInput(value)
  return parsed ? parsed.getTime() : null
}

function isSameLocalDay(leftTimestamp: number, rightTimestamp: number): boolean {
  const left = new Date(leftTimestamp)
  const right = new Date(rightTimestamp)
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate()
}

function normalizedTimestamp(value: number): number {
  return value > 10_000_000_000 ? value : value * 1000
}

function yamlLines(content: string): YamlLine[] {
  return content
    .split(/\r?\n/u)
    .map(stripYamlComment)
    .filter((line) => line.trim().length > 0)
    .map((line) => ({ indent: line.search(/\S/u), text: line.trim() }))
}

function stripYamlComment(line: YamlText): YamlText {
  const commentIndex = yamlCommentIndex(line)
  return commentIndex === -1 ? line : line.slice(0, commentIndex).trimEnd()
}

function yamlCommentIndex(line: YamlText): number {
  let quote: '"' | '\'' | null = null

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '\\' && quote === '"') {
      index += 1
      continue
    }
    if (isQuote(char)) {
      quote = quote === char ? null : quote ?? char
      continue
    }
    if (quote === null && isYamlCommentStart(line, index)) return index
  }

  return -1
}

function isYamlCommentStart(line: YamlText, index: number): boolean {
  return line[index] === '#' && (index === 0 || /\s/u.test(line[index - 1] ?? ''))
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
  const inlineValue = topLevelValue(lines, key)
  if (Array.isArray(inlineValue)) return inlineValue.map(String)

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
  const scalar = yamlScalarToken(value)
  return scalar.quoted ? scalar.text : parseUnquotedYamlValue(scalar.text)
}

function yamlScalarToken(value: YamlText) {
  const quote = scalarQuote(value)

  return {
    quoted: quote !== null,
    text: unquotedScalar(value, quote),
  }
}

function parseUnquotedYamlValue(value: YamlText): unknown {
  const literal = yamlLiteralValue(value)
  if (literal !== undefined) return literal
  return isInlineListLiteral(value) ? parseInlineList(value) : value
}

function yamlLiteralValue(value: YamlText): unknown {
  const lower = value.toLowerCase()
  if (lower === 'true') return true
  if (lower === 'false') return false
  if (lower === 'null' || lower === '~') return null
  return /^-?\d+(?:\.\d+)?$/u.test(value) ? Number(value) : undefined
}

function isInlineListLiteral(value: YamlText) {
  if (value.startsWith('[[')) return false
  return value.startsWith('[') && value.endsWith(']')
}

function parseInlineList(value: YamlText) {
  const inner = value.slice(1, -1)
  if (!inner.trim()) return []
  return splitInlineListItems(inner).map((item) => parseYamlValue(item.trim()))
}

function splitInlineListItems(value: YamlText): YamlText[] {
  const items: YamlText[] = []
  let quote: '"' | '\'' | null = null
  let startIndex = 0

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index]
    if (char === '\\' && quote === '"') {
      index += 1
      continue
    }
    if (isQuote(char)) {
      quote = quote === char ? null : quote ?? char
      continue
    }
    if (char === ',' && quote === null) {
      items.push(value.slice(startIndex, index))
      startIndex = index + 1
    }
  }

  items.push(value.slice(startIndex))
  return items
}

function unquotedScalar(value: YamlText, quote: '"' | '\'' | null) {
  if (quote === null) return value

  const inner = value.slice(1, -1)
  return quote === doubleQuote ? unescapeDoubleQuotedScalar(inner) : inner.replaceAll("''", "'")
}

function unescapeDoubleQuotedScalar(value: YamlText) {
  return value.replace(/\\(?:["\\/bfnrt]|x[\da-fA-F]{2}|u[\da-fA-F]{4}|U[\da-fA-F]{8})/gu, (escape) => {
    const shortEscape = doubleQuotedScalarEscape(escape)
    return shortEscape ?? unicodeEscapeText(escape)
  })
}

function doubleQuotedScalarEscape(value: YamlText): string | null {
  return doubleQuotedScalarEscapes[value] ?? null
}

function unicodeEscapeText(value: YamlText) {
  const codePoint = Number.parseInt(value.slice(2), 16)
  if (!Number.isFinite(codePoint)) return value

  try {
    return String.fromCodePoint(codePoint)
  } catch {
    return value
  }
}

function scalarQuote(value: YamlText): '"' | '\'' | null {
  const quote = value.at(0)
  if (isQuote(quote) && value.at(-1) === quote) return quote
  return null
}

function isQuote(value: string | undefined): value is '"' | '\'' {
  if (value === doubleQuote) return true
  return value === singleQuote
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
  const explicitKeys = [relationship.key, relationship.label]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase())

  return explicitKeys.length > 0 ? explicitKeys : fallbackRelationshipKeys(relationship.kind)
}

function fallbackRelationshipKeys(kind: MobileNote['relationships'][number]['kind']) {
  if (kind === 'belongsTo') return ['belongs_to']
  if (kind === 'relatedTo') return ['related_to']
  if (kind === 'has') return ['has']
  return []
}

function scalarField(value: string | number | boolean | null): ResolvedMobileField {
  return { kind: 'scalar', value }
}

function arrayField(values: MobileTextValues, arrayKind: MobileArrayFieldKind): ResolvedMobileField {
  return { arrayKind, kind: 'array', values }
}

function conditionValues(value: unknown): string[] {
  return Array.isArray(value) ? value.map(normalizedText) : [normalizedText(value)]
}

function normalizedText(value: unknown) {
  return textValue(value).toLowerCase()
}

function nullableText(value: unknown) {
  if (value === null || value === undefined) return null
  return String(value).trim()
}

function textValue(value: unknown) {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function fallbackViewName(filename: ViewFilename, index: ViewIndex) {
  const fallback = filename.replace(/\.[^.]+$/, '').replaceAll('-', ' ').trim()
  return fallback ? titleCase(fallback) : `View ${index + 1}`
}

function titleCase(value: YamlText) {
  return value.replace(/\b\w/gu, (char) => char.toUpperCase())
}

function slugifyViewFilenameStem(name: string): string {
  const stem = name
    .normalize('NFKC')
    .toLocaleLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/(^-+|-+$)/gu, '')

  return avoidReservedDeviceName(stem || fallbackViewFilenameStem)
}

function viewFilenameFromStem(stem: string): ViewFilename {
  return `${stem}${viewFilenameExtension}`
}

function avoidReservedDeviceName(stem: string): string {
  return windowsReservedDeviceNames.has(stem.toLocaleUpperCase()) ? `${stem}-view` : stem
}

const relativeNumberWords = new Map([
  ['a', 1],
  ['an', 1],
  ['one', 1],
  ['two', 2],
  ['three', 3],
  ['four', 4],
  ['five', 5],
  ['six', 6],
  ['seven', 7],
  ['eight', 8],
  ['nine', 9],
  ['ten', 10],
  ['eleven', 11],
  ['twelve', 12],
])
const relativeDayOffsets = new Map([
  ['today', 0],
  ['yesterday', -1],
  ['tomorrow', 1],
])

function parseDateFilterInput(value: string, reference = new Date()): Date | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const relative = parseRelativeDateInput(trimmed, reference)
  if (relative) return relative

  if (isIsoDateOnly(trimmed)) return parseIsoDateOnly(trimmed)

  const timestamp = Date.parse(trimmed)
  return Number.isNaN(timestamp) ? null : new Date(timestamp)
}

function parseIsoDateOnly(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/u)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const parsed = new Date(year, month - 1, day)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day
    ? parsed
    : null
}

function isIsoDateOnly(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/u.test(value)
}

function parseRelativeDateInput(value: string, reference: Date): Date | null {
  const normalized = value.trim().toLowerCase()
  const base = startOfLocalDay(reference)
  const namedOffset = relativeDayOffsets.get(normalized)
  if (namedOffset !== undefined) return shiftDate(base, 'day', namedOffset)

  const relative = relativeDateParts(normalized)
  if (!relative) return null

  return shiftDate(base, relative.unit, relative.future ? relative.amount : -relative.amount)
}

function relativeDateParts(value: string): { amount: number; future: boolean; unit: 'day' | 'month' | 'week' | 'year' } | null {
  const tokens = value.split(/\s+/u)
  return futureRelativeDateParts(tokens) ?? pastRelativeDateParts(tokens)
}

function futureRelativeDateParts(tokens: string[]): { amount: number; future: true; unit: 'day' | 'month' | 'week' | 'year' } | null {
  if (tokens.length !== 3 || tokens[0] !== 'in') return null
  const amount = relativeAmount(tokens[1] ?? '')
  const unit = relativeUnit(tokens[2] ?? '')
  if (amount === null || unit === null) return null

  return { amount, future: true, unit }
}

function pastRelativeDateParts(tokens: string[]): { amount: number; future: false; unit: 'day' | 'month' | 'week' | 'year' } | null {
  if (tokens.length !== 3 || tokens[2] !== 'ago') return null
  const amount = relativeAmount(tokens[0] ?? '')
  const unit = relativeUnit(tokens[1] ?? '')
  if (amount === null || unit === null) return null

  return { amount, future: false, unit }
}

function relativeAmount(value: string): number | null {
  if (/^\d+$/u.test(value)) return Number(value)
  return relativeNumberWords.get(value) ?? null
}

function relativeUnit(value: string): 'day' | 'month' | 'week' | 'year' | null {
  const unit = value.toLowerCase().replace(/s$/u, '')
  if (unit === 'day' || unit === 'week' || unit === 'month' || unit === 'year') return unit
  return null
}

function startOfLocalDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate())
}

function shiftDate(value: Date, unit: 'day' | 'month' | 'week' | 'year', amount: number): Date {
  if (unit === 'month') return shiftCalendarMonth(value, amount)
  if (unit === 'year') return shiftCalendarYear(value, amount)

  const next = new Date(value)
  next.setDate(next.getDate() + (unit === 'week' ? amount * 7 : amount))
  return next
}

function shiftCalendarMonth(value: Date, amount: number): Date {
  const next = new Date(value)
  const day = next.getDate()
  next.setDate(1)
  next.setMonth(next.getMonth() + amount)
  next.setDate(Math.min(day, daysInMonth(next.getFullYear(), next.getMonth())))
  return next
}

function shiftCalendarYear(value: Date, amount: number): Date {
  const next = new Date(value)
  const day = next.getDate()
  next.setDate(1)
  next.setFullYear(next.getFullYear() + amount)
  next.setDate(Math.min(day, daysInMonth(next.getFullYear(), next.getMonth())))
  return next
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function serializedFilterGroup(group: MobileViewFilterGroup, indent: number): string[] {
  const kind = 'any' in group ? 'any' : 'all'
  const nodes = 'any' in group ? group.any : group.all
  const prefix = spaces(indent)

  return [
    `${prefix}${kind}:`,
    ...nodes.flatMap((node) => serializedFilterNode(node, indent + 2)),
  ]
}

function serializedFilterNode(node: MobileViewFilterNode, indent: number): string[] {
  if (isFilterGroup(node)) return serializedNestedFilterGroup(node, indent)
  return serializedFilterCondition(node, indent)
}

function serializedNestedFilterGroup(group: MobileViewFilterGroup, indent: number): string[] {
  const kind = 'any' in group ? 'any' : 'all'
  const nodes = 'any' in group ? group.any : group.all
  const prefix = spaces(indent)

  return [
    `${prefix}- ${kind}:`,
    ...nodes.flatMap((node) => serializedFilterNode(node, indent + 4)),
  ]
}

function serializedFilterCondition(condition: MobileViewFilterCondition, indent: number): string[] {
  const prefix = spaces(indent)
  const childPrefix = spaces(indent + 2)
  const lines = [
    `${prefix}- field: ${yamlScalar(condition.field)}`,
    `${childPrefix}op: ${yamlScalar(condition.op)}`,
  ]

  if (condition.regex === true) lines.push(`${childPrefix}regex: true`)
  if (condition.value !== undefined) lines.push(...serializedYamlValue('value', condition.value, indent + 2))

  return lines
}

function serializedYamlValue(key: string, value: unknown, indent: number): string[] {
  const prefix = spaces(indent)
  if (!Array.isArray(value)) return [`${prefix}${key}: ${yamlScalar(yamlSerializableScalar(value))}`]

  return [
    `${prefix}${key}:`,
    ...value.map((item) => `${spaces(indent + 2)}- ${yamlScalar(yamlSerializableScalar(item))}`),
  ]
}

function yamlSerializableScalar(value: unknown): YamlScalar {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) return value
  return String(value)
}

function yamlScalar(value: YamlScalar): string {
  if (value === null) return 'null'
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

function spaces(count: number) {
  return ' '.repeat(count)
}

function compareSavedViews(left: MobileSavedView, right: MobileSavedView) {
  const leftOrder = left.definition.order
  const rightOrder = right.definition.order
  if (typeof leftOrder === 'number' && typeof rightOrder === 'number') return leftOrder - rightOrder
  if (typeof leftOrder === 'number') return -1
  if (typeof rightOrder === 'number') return 1
  return left.filename.localeCompare(right.filename)
}

function savedViewIndex(views: MobileSavedView[], viewId: string): number {
  return views.findIndex((view) => view.id === viewId || view.filename === viewId)
}

function savedViewDestinationIndex(index: number, direction: MobileViewMoveDirection): number {
  return direction === 'up' ? index - 1 : index + 1
}

function slugify(value: YamlText) {
  return value.toLowerCase().replace(/[^a-z0-9]+/gu, '-').replace(/^-|-$/gu, '') || 'view'
}
