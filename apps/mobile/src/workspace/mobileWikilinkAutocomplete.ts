import type { MobileNote } from './mobileWorkspaceModel'
import { mobileWikilinkTargetForNote } from './mobileWikilinks'

type CursorOffset = number
type MarkdownContent = string
type WikilinkQuery = string
type WikilinkTarget = string

export type MobileWikilinkAutocompleteMatch = {
  cursor: CursorOffset
  query: WikilinkQuery
  start: CursorOffset
}

export type MobileWikilinkAutocompleteReplacement = {
  cursor: CursorOffset
  text: MarkdownContent
}

const MAX_WIKILINK_SUGGESTIONS = 10

export function activeMobileWikilinkQuery(
  text: MarkdownContent,
  cursor: CursorOffset,
): MobileWikilinkAutocompleteMatch | null {
  const boundedCursor = boundedTextCursor(text, cursor)
  const beforeCursor = text.slice(0, boundedCursor)
  const triggerIndex = beforeCursor.lastIndexOf('[[')
  if (triggerIndex === -1) return null

  const query = beforeCursor.slice(triggerIndex + 2)
  if (query.includes(']') || query.includes('\n')) return null

  return {
    cursor: boundedCursor,
    query,
    start: triggerIndex,
  }
}

export function replaceActiveMobileWikilinkQuery(
  text: MarkdownContent,
  cursor: CursorOffset,
  target: WikilinkTarget,
): MobileWikilinkAutocompleteReplacement | null {
  const match = activeMobileWikilinkQuery(text, cursor)
  if (!match) return null

  const replacement = `[[${target}]]`
  return {
    cursor: match.start + replacement.length,
    text: `${text.slice(0, match.start)}${replacement}${text.slice(match.cursor)}`,
  }
}

export function mobileWikilinkAutocompleteSuggestions(
  notes: MobileNote[],
  query: WikilinkQuery,
): MobileNote[] {
  const candidates = notes.filter((note) => !note.archived)
  if (query.length === 0) return topMobileWikilinkSuggestions(candidates)

  return finalizeMobileWikilinkSuggestions(candidates
    .filter((note) => mobileWikilinkMatchesQuery(note, query)))
}

export const mobileWikilinkAutocompleteTarget = mobileWikilinkTargetForNote

function topMobileWikilinkSuggestions(notes: MobileNote[]): MobileNote[] {
  return prepareMobileWikilinkSuggestions(notes)
    .sort((left, right) => left.title.localeCompare(right.title))
    .slice(0, MAX_WIKILINK_SUGGESTIONS)
}

function finalizeMobileWikilinkSuggestions(notes: MobileNote[]): MobileNote[] {
  return prepareMobileWikilinkSuggestions(notes)
    .slice(0, MAX_WIKILINK_SUGGESTIONS)
}

function prepareMobileWikilinkSuggestions(notes: MobileNote[]): MobileNote[] {
  return disambiguateMobileWikilinkTitles(deduplicateMobileWikilinksByPath(notes))
}

function mobileWikilinkMatchesQuery(note: MobileNote, query: WikilinkQuery): boolean {
  const normalizedQuery = normalizeSearchText(query)
  return mobileWikilinkSearchValues(note).some((value) => normalizeSearchText(value).includes(normalizedQuery))
}

function deduplicateMobileWikilinksByPath(notes: MobileNote[]): MobileNote[] {
  const seen = new Set<string>()
  return notes.filter((note) => {
    const path = mobileWikilinkIdentityPath(note)
    if (seen.has(path)) return false
    seen.add(path)
    return true
  })
}

function disambiguateMobileWikilinkTitles(notes: MobileNote[]): MobileNote[] {
  const titleCounts = new Map<string, number>()
  for (const note of notes) {
    titleCounts.set(note.title, (titleCounts.get(note.title) ?? 0) + 1)
  }

  return notes.map((note) => {
    if ((titleCounts.get(note.title) ?? 0) <= 1) return note

    const parentFolder = mobileWikilinkParentFolder(note)
    return parentFolder ? { ...note, title: `${note.title} (${parentFolder})` } : note
  })
}

function mobileWikilinkParentFolder(note: MobileNote): string {
  const parts = mobileWikilinkIdentityPath(note).split('/').filter(Boolean)
  return parts.length >= 2 ? parts[parts.length - 2] : ''
}

function mobileWikilinkIdentityPath(note: MobileNote): string {
  return note.path ?? note.id
}

function filenameStem(path: string): string {
  const parts = path.split('/').filter(Boolean)
  const filename = parts.length > 0 ? parts[parts.length - 1] : path
  return filename.replace(/\.[^.]+$/u, '')
}

function boundedTextCursor(text: MarkdownContent, cursor: CursorOffset): CursorOffset {
  if (!Number.isFinite(cursor)) return text.length
  return Math.max(0, Math.min(cursor, text.length))
}

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase()
}

function mobileWikilinkPathSearchValues(note: MobileNote): string[] {
  if (!note.path) return [filenameStem(note.id)]
  return [note.path, filenameStem(note.path)]
}

function mobileWikilinkSearchValues(note: MobileNote): string[] {
  return [
    note.title,
    note.type,
    ...mobileWikilinkPathSearchValues(note),
    ...(note.aliases ?? []),
    ...note.tags,
  ]
}
