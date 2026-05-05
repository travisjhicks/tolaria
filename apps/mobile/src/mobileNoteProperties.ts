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
  return {
    date: patch.date ?? note.date,
    icon: patch.icon ?? note.icon,
    status: patch.status ?? note.status,
    tags: patch.tags ?? note.tags,
    type: patch.type ?? note.type,
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
