import type { MobileNote, MobilePropertyValue, MobileTypeDefinition, MobileTypeDefinitions } from './mobileWorkspaceModel'
import { mobileNoteForWikilinkTarget, parseMobileWikilink } from './mobileWikilinks'

type NormalizedSuggestionKey = string
type PropertyKey = string
type PropertyValueText = string
type RelationshipKey = string

export type MobileTypeValueSuggestionItem = {
  label: string
  meta?: string
  value: string
}

const RELATIONSHIP_SCHEMA_KEYS = new Set(['belongs_to', 'has', 'related_to'])
const CANONICAL_RELATIONSHIP_KEYS: Partial<Record<NormalizedSuggestionKey, RelationshipKey>> = {
  belongs_to: 'belongs_to',
  has: 'has',
  related_to: 'related_to',
}

export function normalizeMobileRelationshipKey(key: RelationshipKey): RelationshipKey {
  const trimmed = key.trim()
  const relationshipKey = CANONICAL_RELATIONSHIP_KEYS[canonicalSuggestionKey(trimmed)]
  return relationshipKey === undefined ? trimmed : relationshipKey
}

export function selectedTypePropertyCandidates(
  selectedNote: MobileNote | null,
  typeDefinitions: MobileTypeDefinitions | undefined,
): PropertyKey[] {
  return propertyCandidatesForDefinition(typeDefinitionForNote(selectedNote, typeDefinitions))
}

export function selectedTypeRelationshipCandidates(
  selectedNote: MobileNote | null,
  typeDefinitions: MobileTypeDefinitions | undefined,
): RelationshipKey[] {
  return relationshipCandidatesForDefinition(typeDefinitionForNote(selectedNote, typeDefinitions))
}

export function allTypePropertyCandidates(typeDefinitions: MobileTypeDefinitions | undefined): PropertyKey[] {
  return Object.values(typeDefinitions ?? {}).flatMap(propertyCandidatesForDefinition)
}

export function allTypeRelationshipCandidates(typeDefinitions: MobileTypeDefinitions | undefined): RelationshipKey[] {
  return Object.values(typeDefinitions ?? {}).flatMap(relationshipCandidatesForDefinition)
}

export function typePropertyValueCandidates(
  normalizedKey: NormalizedSuggestionKey,
  typeDefinitions: MobileTypeDefinitions | undefined,
  selectedNote: MobileNote | null | undefined,
): PropertyValueText[] {
  return typeDefinitionsForValueSuggestions(typeDefinitions, selectedNote).flatMap((definition) => {
    return Object.entries(definition.properties ?? {}).flatMap(([key, value]) => {
      if (canonicalSuggestionKey(key) !== normalizedKey || !isTypePropertyCandidate(key, value)) return []
      return propertyValueTextValues(value)
    })
  })
}

export function typeViewValueSuggestionCandidates(
  notes: MobileNote[],
  normalizedKey: NormalizedSuggestionKey,
  typeDefinitions: MobileTypeDefinitions | undefined,
): MobileTypeValueSuggestionItem[] {
  return Object.values(typeDefinitions ?? {}).flatMap((definition) => [
    ...typePropertyValueSuggestionItems(definition, normalizedKey),
    ...typeRelationshipValueSuggestionItems(notes, definition, normalizedKey),
  ])
}

export function propertyValueTextValues(value: MobilePropertyValue): PropertyValueText[] {
  return Array.isArray(value) ? value.map(String) : [String(value)]
}

function propertyCandidatesForDefinition(definition: MobileTypeDefinition | undefined): PropertyKey[] {
  return Object.entries(definition?.properties ?? {})
    .filter(([key, value]) => isTypePropertyCandidate(key, value))
    .map(([key]) => key)
}

function relationshipCandidatesForDefinition(definition: MobileTypeDefinition | undefined): RelationshipKey[] {
  if (!definition) return []

  return [
    ...Object.entries(definition.relationships ?? {})
      .filter(([, refs]) => refs.length > 0)
      .map(([key]) => normalizeMobileRelationshipKey(key)),
    ...Object.keys(definition.properties ?? {})
      .filter(isRelationshipSchemaKey)
      .map(normalizeMobileRelationshipKey),
  ]
}

function typeDefinitionsForValueSuggestions(
  typeDefinitions: MobileTypeDefinitions | undefined,
  selectedNote: MobileNote | null | undefined,
): MobileTypeDefinition[] {
  if (!selectedNote) return Object.values(typeDefinitions ?? {})

  const definition = typeDefinitionForNote(selectedNote, typeDefinitions)
  return definition ? [definition] : []
}

function typeDefinitionForNote(
  selectedNote: MobileNote | null | undefined,
  typeDefinitions: MobileTypeDefinitions | undefined,
): MobileTypeDefinition | undefined {
  if (!selectedNote || selectedNote.type === 'Type') return undefined
  return typeDefinitions?.[selectedNote.type]
}

function typePropertyValueSuggestionItems(
  definition: MobileTypeDefinition,
  normalizedKey: NormalizedSuggestionKey,
): MobileTypeValueSuggestionItem[] {
  return Object.entries(definition.properties ?? {}).flatMap(([key, value]) => {
    if (canonicalSuggestionKey(key) !== normalizedKey || !isTypePropertyCandidate(key, value)) return []
    return propertyValueTextValues(value).map((candidate) => ({ label: candidate, value: candidate }))
  })
}

function typeRelationshipValueSuggestionItems(
  notes: MobileNote[],
  definition: MobileTypeDefinition,
  normalizedKey: NormalizedSuggestionKey,
): MobileTypeValueSuggestionItem[] {
  return Object.entries(definition.relationships ?? {}).flatMap(([key, refs]) => {
    if (canonicalSuggestionKey(normalizeMobileRelationshipKey(key)) !== normalizedKey) return []
    return refs.map((ref) => relationshipRefSuggestionItem(notes, ref))
  })
}

function relationshipRefSuggestionItem(notes: MobileNote[], ref: string): MobileTypeValueSuggestionItem {
  const target = wikilinkTarget(ref)
  const note = mobileNoteForWikilinkTarget(notes, target)
  const label = note?.title ?? wikilinkDisplayLabel(ref)

  return {
    label,
    meta: ref !== label ? ref : undefined,
    value: ref,
  }
}

function isTypePropertyCandidate(key: PropertyKey, value: MobilePropertyValue): boolean {
  return !isRelationshipSchemaKey(key) && !(Array.isArray(value) && value.length === 0)
}

function isRelationshipSchemaKey(key: RelationshipKey): boolean {
  return RELATIONSHIP_SCHEMA_KEYS.has(canonicalSuggestionKey(key))
}

function wikilinkDisplayLabel(ref: string): string {
  const target = wikilinkTarget(ref)
  return target.split('/').filter(Boolean).at(-1) ?? target
}

function wikilinkTarget(ref: string): string {
  return parseMobileWikilink(ref)?.target ?? ref.trim()
}

function canonicalSuggestionKey(key: string): NormalizedSuggestionKey {
  return key.trim().toLowerCase().replace(/[-\s]+/g, '_')
}
