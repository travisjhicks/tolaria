import type { MobileSidebarIcon, MobileTypeDefinitions } from '../workspace/mobileWorkspaceModel'
import {
  normalizedDisplayProperties,
  type MobileWorkspaceEdit,
} from '../workspace/mobileWorkspaceEditing'
import { typeDefinitionSchemaPatch } from '../workspace/mobileTypeDefinitionSchema'
import {
  canRenameMobileTypeDefinition,
  mobileTypeRenameTargetName,
} from '../workspace/mobileWorkspaceTypeRename'
import { mobileSidebarIconFromValue } from '../workspace/mobileWorkspaceMetadata'
import type { TabletReadOnlyForm } from './tabletWorkspaceTypes'

export function typeDefinitionSaveEdit(
  form: TabletReadOnlyForm,
  typeDefinitions: MobileTypeDefinitions | undefined,
): MobileWorkspaceEdit | null {
  const typeName = form.typeName.trim()
  const nextTypeName = mobileTypeRenameTargetName(form.typeRenameName)
  if (!typeName || !nextTypeName) return null
  if (!canRenameMobileTypeDefinition(typeDefinitions, typeName, nextTypeName)) return null

  const patch = {
    label: typeRenamePatchLabel(form),
    icon: normalizedIcon(form.typeIcon, 'file'),
    listPropertiesDisplay: normalizedDisplayProperties(form.typeDisplayProperties),
    ...typeDefinitionSchemaPatch(form.typeSchemaProperties, form.typeSchemaRelationships),
    sort: form.typeSort,
    template: form.typeTemplate,
    tone: form.typeTone,
    visible: form.typeVisible ? null : false,
  }
  const edits: MobileWorkspaceEdit[] = renamedTypeName(typeName, nextTypeName)
    ? [
      { nextTypeName, type: 'renameTypeDefinition', typeName },
      { patch, type: 'updateTypeDefinition', typeName: nextTypeName },
    ]
    : [{ patch, type: 'updateTypeDefinition', typeName }]

  return edits.length === 1 ? edits[0] : { edits, type: 'bulkEdit' }
}

function typeRenamePatchLabel(form: TabletReadOnlyForm): string | null {
  if (renamedTypeName(form.typeName, form.typeRenameName) && isDefaultTypeSectionLabel(form.typeName, form.typeSectionLabel)) {
    return null
  }

  return form.typeSectionLabel
}

function renamedTypeName(typeName: string, nextTypeName: string): boolean {
  return normalizedLabel(typeName) !== normalizedLabel(nextTypeName)
}

function isDefaultTypeSectionLabel(typeName: string, label: string): boolean {
  return normalizedLabel(label) === normalizedLabel(pluralizedTypeLabel(typeName))
}

function pluralizedTypeLabel(typeName: string): string {
  const cleanType = typeName.trim()
  if (cleanType.endsWith('s')) return cleanType
  if (cleanType.endsWith('y')) return `${cleanType.slice(0, -1)}ies`
  return `${cleanType}s`
}

function normalizedIcon(icon: string, fallback: MobileSidebarIcon) {
  return mobileSidebarIconFromValue(icon, fallback)
}

function normalizedLabel(value: string) {
  return value.trim().toLowerCase()
}
