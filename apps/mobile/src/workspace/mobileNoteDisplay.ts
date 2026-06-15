import type { MobileNote, MobileTone } from './mobileWorkspaceModel'

export type MobileTagTone = 'blue' | 'green' | 'orange' | 'purple' | 'red'
type DisplayPropertyKey = string
type NormalizedDisplayPropertyKey = string
type StatusLabel = string
type TagLabel = string

export type MobileNoteDisplayChip = {
  label: string
  tone: MobileTone
}

export function defaultMobileNoteRowChips(note: MobileNote): MobileNoteDisplayChip[] {
  return [
    { label: note.type, tone: chipTone(note.typeTone) },
    ...(note.status ? [{ label: note.status, tone: statusTone(note.status) }] : []),
    ...note.tags.slice(0, 1).map((tag) => ({ label: tag, tone: tagTone(tag) })),
  ]
}

export function configuredMobileNoteRowChips(note: MobileNote, keys: DisplayPropertyKey[]): MobileNoteDisplayChip[] {
  return keys.flatMap((key) => displayPropertyChips(note, key))
}

export function mobileNoteDisplayLabels(note: MobileNote, keys: DisplayPropertyKey[]): string[] {
  const chips = keys.length > 0 ? configuredMobileNoteRowChips(note, keys) : defaultMobileNoteRowChips(note)
  return chips.map((chip) => chip.label)
}

export function chipTone(tone: MobileTone) {
  return tone
}

export function statusTone(status: StatusLabel): 'blue' | 'green' | 'orange' {
  if (status === 'Shipped') return 'green'
  if (status === 'Active') return 'blue'
  return 'orange'
}

export function tagTone(label: TagLabel): MobileTagTone {
  const tones = ['blue', 'green', 'orange', 'purple', 'red'] as const
  const index = Array.from(label).reduce((sum, char) => sum + char.charCodeAt(0), 0) % tones.length

  return tones[index]
}

function displayPropertyChips(note: MobileNote, key: DisplayPropertyKey): MobileNoteDisplayChip[] {
  const normalizedKey = key.trim().toLowerCase()
  if (!normalizedKey) return []
  if (isTypePropertyKey(normalizedKey)) return [{ label: note.type, tone: chipTone(note.typeTone) }]
  if (normalizedKey === 'status') return note.status ? [{ label: note.status, tone: statusTone(note.status) }] : []
  if (normalizedKey === 'tags') return note.tags.map((tag) => ({ label: tag, tone: tagTone(tag) }))

  return relationshipChips(note, normalizedKey) ?? propertyChips(note, normalizedKey)
}

function isTypePropertyKey(normalizedKey: NormalizedDisplayPropertyKey) {
  return ['type', 'isa', 'is_a'].includes(normalizedKey)
}

function relationshipChips(note: MobileNote, normalizedKey: NormalizedDisplayPropertyKey): MobileNoteDisplayChip[] | null {
  const relationship = note.relationships.find((candidate) => relationshipKeys(candidate).includes(normalizedKey))
  if (!relationship) return null

  return relationship.values.map((value) => ({ label: value.title, tone: chipTone(value.typeTone) }))
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

function propertyChips(note: MobileNote, normalizedKey: NormalizedDisplayPropertyKey): MobileNoteDisplayChip[] {
  const property = note.properties?.find((candidate) => candidate.key.toLowerCase() === normalizedKey)
  if (!property) return []

  const values = Array.isArray(property.value) ? property.value : [property.value]
  return values
    .map((value) => String(value).trim())
    .filter(Boolean)
    .map((label) => ({ label, tone: 'gray' }))
}
