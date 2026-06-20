import type { MobileNote } from './mobileWorkspaceModel'
import { mobileQuickOpenSearchText, normalizedMobileSearchQuery } from './mobileNoteSearch'
import { fuzzyMatch } from '../../../../src/utils/fuzzyMatch'
import { slugifyNoteStem } from '../../../../src/utils/noteSlug'

export type MobileQuickOpenDirection = 'next' | 'previous'

export const mobileQuickOpenResultLimit = 16
const noQuickOpenMatch: MobileQuickOpenMatch = {
  match: false,
  rank: Number.POSITIVE_INFINITY,
  score: 0,
}

type MobileQuickOpenMatch = {
  match: boolean
  rank: number
  score: number
}

type MobileQuickOpenSearchCandidate = {
  exactRank: number
  fuzzyRank: number
  prefixRank: number
  value: string
}

export function mobileQuickOpenResults(
  notes: MobileNote[],
  query: string,
  limit = mobileQuickOpenResultLimit,
): MobileNote[] {
  const normalizedQuery = normalizedMobileSearchQuery(query)
  const activeNotes = notes.filter((note) => !note.archived)
  if (!normalizedQuery) return activeNotes.slice(0, limit)

  return activeNotes
    .map((note, index) => ({
      index,
      match: mobileQuickOpenRankNote(note, normalizedQuery),
      note,
    }))
    .filter(({ match }) => match.match)
    .sort((left, right) => (
      left.match.rank - right.match.rank ||
      right.match.score - left.match.score ||
      left.index - right.index
    ))
    .map(({ note }) => note)
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

function mobileQuickOpenRankNote(note: MobileNote, normalizedQuery: string): MobileQuickOpenMatch {
  const queryForms = quickOpenSearchForms(normalizedQuery)
  const candidateMatch = quickOpenCandidatesForNote(note).reduce((best, candidate) => (
    betterQuickOpenMatch(best, matchQuickOpenCandidate(queryForms, candidate))
  ), noQuickOpenMatch)
  if (candidateMatch.match) return candidateMatch

  const fullText = mobileQuickOpenSearchText(note)
  const textIndex = fullText.indexOf(normalizedQuery)
  if (textIndex === -1) return noQuickOpenMatch

  return {
    match: true,
    rank: 5,
    score: -textIndex,
  }
}

function quickOpenCandidatesForNote(note: MobileNote): MobileQuickOpenSearchCandidate[] {
  const filename = noteFilename(note)

  return [
    { exactRank: 0, fuzzyRank: 4, prefixRank: 2, value: note.title },
    ...(note.aliases ?? []).map((value) => ({ exactRank: 1, fuzzyRank: 4, prefixRank: 3, value })),
    { exactRank: 1, fuzzyRank: 4, prefixRank: 3, value: filename },
    { exactRank: 1, fuzzyRank: 4, prefixRank: 3, value: filenameStem(filename) },
  ]
}

function matchQuickOpenCandidate(
  queryForms: string[],
  candidate: MobileQuickOpenSearchCandidate,
): MobileQuickOpenMatch {
  return quickOpenSearchForms(candidate.value).reduce((best, target) => {
    let targetBest = best
    for (const queryForm of queryForms) {
      if (target === queryForm) {
        targetBest = betterQuickOpenMatch(targetBest, {
          match: true,
          rank: candidate.exactRank,
          score: Number.MAX_SAFE_INTEGER,
        })
        continue
      }
      if (target.startsWith(queryForm)) {
        targetBest = betterQuickOpenMatch(targetBest, {
          match: true,
          rank: candidate.prefixRank,
          score: -target.length,
        })
        continue
      }

      const fuzzy = fuzzyMatch(queryForm, target)
      if (fuzzy.match) {
        targetBest = betterQuickOpenMatch(targetBest, {
          ...fuzzy,
          rank: candidate.fuzzyRank,
        })
      }
    }

    return targetBest
  }, noQuickOpenMatch)
}

function betterQuickOpenMatch(
  left: MobileQuickOpenMatch,
  right: MobileQuickOpenMatch,
): MobileQuickOpenMatch {
  if (!right.match) return left
  if (!left.match) return right
  if (right.rank !== left.rank) return right.rank < left.rank ? right : left
  return right.score > left.score ? right : left
}

function quickOpenSearchForms(value: string): string[] {
  const normalized = normalizedMobileSearchQuery(value)
  const withoutExtension = filenameStem(normalized)
  const slug = hasQuickOpenSearchToken(withoutExtension) ? slugifyNoteStem(withoutExtension) : ''

  return Array.from(new Set([normalized, withoutExtension, slug].filter(Boolean)))
}

function hasQuickOpenSearchToken(value: string): boolean {
  return /\p{Letter}|\p{Number}/u.test(value)
}

function noteFilename(note: MobileNote): string {
  return (note.path ?? note.id).split('/').at(-1) ?? note.id
}

function filenameStem(value: string): string {
  return value.replace(/\.md$/iu, '')
}
