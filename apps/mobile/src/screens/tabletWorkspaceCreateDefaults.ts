import type {
  MobileCreateNoteDefaults,
  MobilePropertyValue,
  MobileTypeDefinition,
  MobileTypeDefinitions,
} from '../workspace/mobileWorkspaceModel'
import { normalizeRelationshipKey } from '../workspace/mobileWorkspaceSuggestions'
import type { TabletSidebarSelection } from './tabletWorkspaceNavigation'

type MutableCreateDefaults = Pick<MobileCreateNoteDefaults, 'template' | 'type'> & {
  properties: Record<string, MobilePropertyValue>
  relationships: Record<string, string[]>
}

const ignoredTypePropertyDefaultFields = new Set(['is_a', 'title', 'type'])
const relationshipDefaultFields = new Set(['belongs_to', 'related_to', 'has'])

export function createNoteDefaultsForSelection(
  selection: TabletSidebarSelection,
  typeDefinitions?: MobileTypeDefinitions,
): MobileCreateNoteDefaults {
  if (selection.kind === 'folder') return { folderPath: selection.id }
  if (selection.kind === 'item' && selection.sectionId === 'types') return defaultsForTypeSection(selection, typeDefinitions)

  return {}
}

function defaultsForTypeSection(
  selection: Extract<TabletSidebarSelection, { kind: 'item' }>,
  typeDefinitions: MobileTypeDefinitions | undefined,
): MobileCreateNoteDefaults {
  const type = selection.typeName ?? singularLabel(selection.label)
  const defaults = emptyDefaults()
  defaults.type = type
  applyTypeDefinitionDefaults(defaults, typeDefinitions?.[type])
  return compactDefaults(defaults)
}

function applyTypeDefinitionDefaults(
  defaults: MutableCreateDefaults,
  definition: MobileTypeDefinition | undefined,
) {
  if (!definition) return

  if (definition.template) defaults.template = definition.template
  Object.assign(defaults.properties, valuedProperties(definition.properties ?? {}))
  Object.assign(defaults.relationships, valuedRelationships(definition.relationships ?? {}))
}

function valuedProperties(properties: Record<string, MobilePropertyValue>) {
  return Object.fromEntries(
    Object.entries(properties).filter(([key, value]) => {
      const normalizedKey = normalizedFieldKey(key)
      return isDefaultablePropertyValue(value)
        && !ignoredTypePropertyDefaultFields.has(normalizedKey)
        && !isRelationshipDefaultField(normalizedKey)
    }),
  )
}

function valuedRelationships(relationships: Record<string, string[]>) {
  return Object.fromEntries(
    Object.entries(relationships).flatMap(([key, refs]) => {
      const values = refs.map((ref) => ref.trim()).filter(Boolean)
      return values.length > 0 ? [[normalizeRelationshipKey(key), values]] : []
    }),
  )
}

function isDefaultablePropertyValue(value: MobilePropertyValue): value is string | number | boolean {
  if (typeof value === 'string') return value.trim().length > 0
  return typeof value === 'number' || typeof value === 'boolean'
}

function normalizedFieldKey(field: string): string {
  return field.trim().replace(/^property:/iu, '').toLowerCase().replaceAll(' ', '_')
}

function isRelationshipDefaultField(key: string): boolean {
  return relationshipDefaultFields.has(key) || key.startsWith('has_')
}

function compactDefaults(defaults: MutableCreateDefaults): MobileCreateNoteDefaults {
  const compact: MobileCreateNoteDefaults = {}

  if (defaults.type) compact.type = defaults.type
  if (defaults.template) compact.template = defaults.template
  addRecordDefault(compact, 'properties', defaults.properties)
  addRecordDefault(compact, 'relationships', defaults.relationships)

  return compact
}

function addRecordDefault<Key extends keyof Pick<MobileCreateNoteDefaults, 'properties' | 'relationships'>>(
  defaults: MobileCreateNoteDefaults,
  key: Key,
  values: NonNullable<MobileCreateNoteDefaults[Key]>,
) {
  if (Object.keys(values).length > 0) defaults[key] = values
}

function emptyDefaults(): MutableCreateDefaults {
  return {
    properties: {},
    relationships: {},
  }
}

function singularLabel(label: string) {
  return label.replace(/s$/u, '')
}
