import type { MobileNote } from './demoData'
import type { WritableMobileNoteFrontmatter } from './mobileNoteFrontmatterWrite'

export type MobileNotePropertyPatch = Partial<WritableMobileNoteFrontmatter>

export const mobileNoteTypeOptions = ['Note', 'Essay', 'Project', 'Evergreen'] as const
export const mobileNoteStatusOptions = ['', 'Draft', 'Active', 'Done'] as const
export const mobileNoteIconOptions = ['file-text', 'pen-nib', 'wrench', 'books'] as const
export const mobileNoteTagOptions = ['Tolaria MVP', 'mobile', 'Release Notes', 'Evergreen'] as const

export function createMobileNoteFrontmatterPatch({
  note,
  patch,
}: {
  note: MobileNote
  patch: MobileNotePropertyPatch
}): WritableMobileNoteFrontmatter {
  const metadata: WritableMobileNoteFrontmatter = {
    archived: patch.archived ?? note.archived,
    belongsTo: patch.belongsTo ?? note.belongsTo,
    customProperties: patch.customProperties ?? note.customProperties,
    date: patch.date ?? note.date,
    favorite: patch.favorite ?? note.favorite,
    favoriteIndex: patch.favoriteIndex ?? note.favoriteIndex,
    has: patch.has ?? note.has,
    icon: patch.icon ?? note.icon,
    relatedTo: patch.relatedTo ?? note.relatedTo,
    relationships: patch.relationships ?? note.relationships,
    status: patch.status ?? note.status,
    tags: patch.tags ?? note.tags,
    type: patch.type ?? note.type,
  }

  return {
    ...metadata,
    ...(patch.removedCustomPropertyKeys ? { removedCustomPropertyKeys: patch.removedCustomPropertyKeys } : {}),
    ...(patch.removedRelationshipKeys ? { removedRelationshipKeys: patch.removedRelationshipKeys } : {}),
  }
}

export function isMobileNotePropertySelected({
  current,
  option,
}: {
  current: string | undefined
  option: string
}) {
  return (current ?? '') === option
}

export function toggleMobileNoteTag(tags: string[], tag: string) {
  return tags.includes(tag) ? tags.filter((item) => item !== tag) : [...tags, tag]
}

export function formatMobileNoteTags(tags: readonly string[]) {
  return tags.join(', ')
}

export function parseMobileNoteTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag, index, tags) => tag.length > 0 && tags.indexOf(tag) === index)
}
