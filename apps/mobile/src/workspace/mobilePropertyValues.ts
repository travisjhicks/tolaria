import type { MobilePropertyValue } from './mobileWorkspaceModel'

type MobilePropertyKey = string
type MobilePropertyValueText = string
type MobileStringPropertyValueKind = Exclude<MobilePropertyValueKind, 'boolean' | 'list' | 'number' | 'string'>

export type MobilePropertyValueKind = 'boolean' | 'color' | 'date' | 'list' | 'number' | 'status' | 'string' | 'url'

export type MobilePropertyValueInput = {
  kind: MobilePropertyValueKind
  key: MobilePropertyKey
  valueText: MobilePropertyValueText
}

export type MobilePropertySuggestionValueInput = MobilePropertyValueInput & {
  suggestion: string
}

export function mobilePropertyValueFormText(value: MobilePropertyValue): string {
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}

export function mobilePropertyValueKind(
  key: MobilePropertyKey,
  value: MobilePropertyValue,
): MobilePropertyValueKind {
  if (isMobileListPropertyKey(key) || Array.isArray(value)) return 'list'
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return 'number'
  return mobileStringPropertyValueKind(key, value)
}

export function mobilePropertyValueKindForKey(
  key: MobilePropertyKey,
  currentKind: MobilePropertyValueKind,
): MobilePropertyValueKind {
  if (isMobileListPropertyKey(key)) return 'list'
  if (isMobileStatusPropertyKey(key)) return 'status'
  if (isMobileDatePropertyKey(key)) return 'date'
  if (isMobileUrlPropertyKey(key)) return 'url'
  if (isMobileColorPropertyKey(key)) return 'color'
  return currentKind
}

export function mobilePropertyValueTextForKindChange(
  currentValueText: MobilePropertyValueText,
  nextKind: MobilePropertyValueKind,
): string {
  if (nextKind !== 'boolean') return currentValueText
  if (isBooleanFalseText(currentValueText)) return 'false'
  return 'true'
}

export function parseMobilePropertyValue(input: MobilePropertyValueInput): MobilePropertyValue {
  const kind = mobilePropertyValueKindForKey(input.key, input.kind)
  if (kind === 'list') return listPropertyValue(input.valueText)
  if (kind === 'boolean') return booleanPropertyValue(input.valueText)
  if (kind === 'number') return numberPropertyValue(input.valueText)
  return input.valueText.trim()
}

export function mobilePropertySuggestionValue(input: MobilePropertySuggestionValueInput): string {
  const kind = mobilePropertyValueKindForKey(input.key, input.kind)
  if (kind !== 'list') return input.suggestion
  return listPropertySuggestionValue(input.valueText, input.suggestion)
}

export function isMobileListPropertyKey(key: MobilePropertyKey): boolean {
  return keyMatchesPatterns(key, listPropertyKeyPatterns)
}

function mobileStringPropertyValueKind(key: MobilePropertyKey, value: string): MobilePropertyValueKind {
  return stringPropertyValueKindDetectors.find((detector) => detector.matches(key, value))?.kind ?? 'string'
}

function isMobileStatusPropertyKey(key: MobilePropertyKey): boolean {
  return keyMatchesPatterns(key, statusPropertyKeyPatterns)
}

function isMobileDatePropertyKey(key: MobilePropertyKey): boolean {
  return keyMatchesPatterns(key, datePropertyKeyPatterns)
}

function isMobileUrlPropertyKey(key: MobilePropertyKey): boolean {
  return keyMatchesPatterns(key, urlPropertyKeyPatterns)
}

function isMobileColorPropertyKey(key: MobilePropertyKey): boolean {
  return keyMatchesPatterns(key, colorPropertyKeyPatterns)
}

function keyMatchesPatterns(key: MobilePropertyKey, patterns: readonly string[]): boolean {
  const lower = key.trim().toLowerCase()
  return patterns.some((pattern) => lower === pattern || lower.includes(pattern))
}

function listPropertyValue(value: MobilePropertyValueText): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

function listPropertySuggestionValue(valueText: MobilePropertyValueText, suggestion: string): string {
  const parts = valueText.split(',').map((part) => part.trim())
  const existing = parts.slice(0, -1).filter(Boolean)
  const withoutSuggestion = existing.filter((part) => part.toLowerCase() !== suggestion.toLowerCase())
  return [...withoutSuggestion, suggestion].join(', ')
}

function booleanPropertyValue(value: MobilePropertyValueText): boolean {
  return /^(true|yes|1|on)$/iu.test(value.trim())
}

function isBooleanFalseText(value: MobilePropertyValueText): boolean {
  return /^(false|no|0|off)$/iu.test(value.trim())
}

function numberPropertyValue(value: MobilePropertyValueText): number | string {
  const parsed = Number(value.trim())
  return Number.isFinite(parsed) ? parsed : value.trim()
}

function isMobileStatusPropertyValue(value: MobilePropertyValueText): boolean {
  return mobileStatusValues.has(value.trim().toLowerCase())
}

function isMobileDatePropertyValue(value: MobilePropertyValueText): boolean {
  return /^\d{4}-\d{2}-\d{2}$/u.test(value.trim())
}

function isMobileUrlPropertyValue(value: MobilePropertyValueText): boolean {
  return /^https?:\/\/\S+$/iu.test(value.trim())
}

function isMobileColorPropertyValue(value: MobilePropertyValueText): boolean {
  return /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/iu.test(value.trim())
}

const colorPropertyKeyPatterns = ['color', 'colour']
const datePropertyKeyPatterns = ['date', 'deadline', 'due', 'start', 'end', 'scheduled']
const listPropertyKeyPatterns = ['tags', 'keywords', 'categories', 'labels']
const statusPropertyKeyPatterns = ['status']
const urlPropertyKeyPatterns = ['url', 'uri', 'link', 'website']

const stringPropertyValueKindDetectors: readonly {
  kind: MobileStringPropertyValueKind
  matches: (key: MobilePropertyKey, value: MobilePropertyValueText) => boolean
}[] = [
  { kind: 'status', matches: (key, value) => isMobileStatusPropertyKey(key) || isMobileStatusPropertyValue(value) },
  { kind: 'date', matches: (key, value) => isMobileDatePropertyKey(key) || isMobileDatePropertyValue(value) },
  { kind: 'url', matches: (key, value) => isMobileUrlPropertyKey(key) || isMobileUrlPropertyValue(value) },
  { kind: 'color', matches: (key, value) => isMobileColorPropertyKey(key) || isMobileColorPropertyValue(value) },
]

const mobileStatusValues = new Set([
  'active',
  'archived',
  'blocked',
  'cancelled',
  'closed',
  'done',
  'draft',
  'dropped',
  'in progress',
  'mixed',
  'not started',
  'open',
  'paused',
  'pending',
  'published',
])
