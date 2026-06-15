import type { MobileNote } from './mobileWorkspaceModel'
import { mobileQuickOpenSearchText, normalizedMobileSearchQuery } from './mobileNoteSearch'

export type MobileQuickOpenDirection = 'next' | 'previous'

export const mobileQuickOpenResultLimit = 16

export function mobileQuickOpenResults(
  notes: MobileNote[],
  query: string,
  limit = mobileQuickOpenResultLimit,
): MobileNote[] {
  const normalizedQuery = normalizedMobileSearchQuery(query)
  const activeNotes = notes.filter((note) => !note.archived)
  if (!normalizedQuery) return activeNotes.slice(0, limit)

  return activeNotes
    .filter((note) => mobileQuickOpenSearchText(note).includes(normalizedQuery))
    .slice(0, limit)
}

export function mobileQuickOpenMoveIndex(
  currentIndex: number,
  resultCount: number,
  direction: MobileQuickOpenDirection,
): number {
  if (resultCount <= 0) return 0
  if (direction === 'next') return Math.min(currentIndex + 1, resultCount - 1)

  return Math.max(currentIndex - 1, 0)
}

export function mobileQuickOpenSelectedNote(
  results: MobileNote[],
  selectedIndex: number,
): MobileNote | null {
  return results.at(selectedIndex) ?? null
}
