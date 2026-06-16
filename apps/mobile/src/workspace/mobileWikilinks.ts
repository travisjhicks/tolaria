import type { MobileNote } from './mobileWorkspaceModel'
import { normalizedMobileSearchQuery } from './mobileNoteSearch'

type WikilinkText = string
type WikilinkTarget = string

export type MobileParsedWikilink = {
  display: string
  target: WikilinkTarget
}

export function parseMobileWikilink(value: WikilinkText): MobileParsedWikilink | null {
  const match = value.match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/u)
  if (!match) return null

  return {
    display: (match[2] ?? match[1]).trim(),
    target: match[1].trim(),
  }
}

function mobileNoteTargetCandidates(note: MobileNote): string[] {
  const idStem = note.id.replace(/\.[^.]+$/u, '')
  const pathStem = (note.path ?? note.id).replace(/\.[^.]+$/u, '')

  return [
    note.title,
    ...(note.aliases ?? []),
    note.id,
    idStem,
    note.path ?? '',
    pathStem,
  ]
}

function normalizeWikilinkTarget(value: string): string {
  return normalizedMobileSearchQuery(value).replace(/\.md$/iu, '')
}

export function mobileNoteForWikilinkTarget(
  notes: MobileNote[],
  target: WikilinkTarget,
): MobileNote | null {
  const normalizedTarget = normalizeWikilinkTarget(target)
  if (!normalizedTarget) return null

  return notes.find((note) => mobileNoteTargetCandidates(note).some((candidate) => {
    return normalizeWikilinkTarget(candidate) === normalizedTarget
  })) ?? null
}

export function mobileNoteIdForWikilinkTarget(
  notes: MobileNote[],
  target: WikilinkTarget,
): string | null {
  return mobileNoteForWikilinkTarget(notes, target)?.id ?? null
}

export function mobileWikilinkTargetForNote(note: MobileNote): WikilinkTarget {
  return (note.path ?? note.id).replace(/\.[^.]+$/u, '')
}
