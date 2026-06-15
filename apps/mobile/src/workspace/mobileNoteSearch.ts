import { mobileNoteDisplayLabels } from './mobileNoteDisplay'
import type { MobileNote } from './mobileWorkspaceModel'

export function normalizedMobileSearchQuery(value: string) {
  return normalizeSearchText(value)
}

export function mobileQuickOpenSearchText(note: MobileNote) {
  return normalizeSearchText([
    note.title,
    ...(note.aliases ?? []),
    noteFilename(note),
    noteFilenameStem(note),
    note.snippet,
    note.type,
    note.status,
    note.tags.join(' '),
    note.path ?? '',
  ].join(' '))
}

export function mobileNoteListMatchesQuery(
  note: MobileNote,
  query: string,
  displayPropertyKeys: string[] = [],
) {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return true

  return mobileNoteListSearchText(note, displayPropertyKeys).includes(normalizedQuery)
}

export function mobileNoteListSearchText(note: MobileNote, displayPropertyKeys: string[] = []) {
  return normalizeSearchText([
    note.title,
    note.snippet,
    ...mobileNoteDisplayLabels(note, displayPropertyKeys),
  ].join(' '))
}

function normalizeSearchText(value: string) {
  return value.normalize('NFKD').replace(/\p{Mark}/gu, '').trim().toLowerCase()
}

function noteFilename(note: MobileNote) {
  return (note.path ?? note.id).split('/').at(-1) ?? note.id
}

function noteFilenameStem(note: MobileNote) {
  return noteFilename(note).replace(/\.md$/iu, '')
}
