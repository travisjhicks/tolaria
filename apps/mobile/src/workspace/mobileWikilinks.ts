import type { MobileNote } from './mobileWorkspaceModel'
import { normalizedMobileSearchQuery } from './mobileNoteSearch'

type WikilinkText = string
type WikilinkTarget = string
type MobileWikilinkResolutionKey = {
  exactTarget: string
  humanizedLastSegment: string | null
  lastSegment: string
}

export type MobileParsedWikilink = {
  display: string
  target: WikilinkTarget
}

export function parseMobileWikilink(value: WikilinkText): MobileParsedWikilink | null {
  const match = value.trim().match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/u)
  if (!match) return null

  return {
    display: (match[2] ?? match[1]).trim(),
    target: match[1].trim(),
  }
}

export function normalizeMobileWikilinkTarget(value: string): string {
  return normalizedMobileSearchQuery(value).replace(/\.md$/iu, '')
}

function mobileWikilinkResolutionKey(normalizedTarget: string): MobileWikilinkResolutionKey {
  const segments = normalizedTarget.split('/').filter(Boolean)
  const lastSegment = segments.at(-1) ?? normalizedTarget
  const humanizedLastSegment = lastSegment.replaceAll('-', ' ')

  return {
    exactTarget: normalizedTarget,
    humanizedLastSegment: humanizedLastSegment === lastSegment ? null : humanizedLastSegment,
    lastSegment,
  }
}

function findMobileNoteByPathSuffix(
  notes: MobileNote[],
  key: MobileWikilinkResolutionKey,
): MobileNote | null {
  if (!key.exactTarget.includes('/')) return null

  return notes.find((note) => {
    const pathStem = normalizeMobileWikilinkTarget(note.path ?? note.id)
    return pathStem === key.exactTarget || pathStem.endsWith(`/${key.exactTarget}`)
  }) ?? null
}

function findMobileNoteByFilenameStem(
  notes: MobileNote[],
  key: MobileWikilinkResolutionKey,
): MobileNote | null {
  return notes.find((note) => {
    const stem = note.path ?? note.id
    const filenameStem = normalizeMobileWikilinkTarget(stem.split('/').at(-1) ?? stem)
    return filenameStem === key.exactTarget || filenameStem === key.lastSegment
  }) ?? null
}

function findMobileNoteByAlias(
  notes: MobileNote[],
  key: MobileWikilinkResolutionKey,
): MobileNote | null {
  return notes.find((note) => {
    return (note.aliases ?? []).some((alias) => normalizeMobileWikilinkTarget(alias) === key.exactTarget)
  }) ?? null
}

function findMobileNoteByTitle(
  notes: MobileNote[],
  key: MobileWikilinkResolutionKey,
): MobileNote | null {
  return notes.find((note) => {
    const title = normalizeMobileWikilinkTarget(note.title)
    return title === key.exactTarget
      || title === key.lastSegment
      || title === key.humanizedLastSegment
  }) ?? null
}

export function mobileNoteForWikilinkTarget(
  notes: MobileNote[],
  target: WikilinkTarget,
): MobileNote | null {
  const normalizedTarget = normalizeMobileWikilinkTarget(target)
  if (!normalizedTarget) return null

  const key = mobileWikilinkResolutionKey(normalizedTarget)
  return findMobileNoteByPathSuffix(notes, key)
    ?? findMobileNoteByFilenameStem(notes, key)
    ?? findMobileNoteByAlias(notes, key)
    ?? findMobileNoteByTitle(notes, key)
}

export function mobileWikilinkTargetForNote(note: MobileNote): WikilinkTarget {
  return (note.path ?? note.id).replace(/\.[^.]+$/u, '')
}

export function mobileNoteIdForWikilinkTarget(
  notes: MobileNote[],
  target: WikilinkTarget,
): string | null {
  return mobileNoteForWikilinkTarget(notes, target)?.id ?? null
}
