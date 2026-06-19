import type { MobileNote } from './mobileWorkspaceModel'

export type MobileNoteListFilter = 'archived' | 'open'

type MobileMarkdownCandidate = Pick<MobileNote, 'fileKind'>
type MobileAllNotesCandidate = Pick<MobileNote, 'fileKind' | 'id' | 'path'>
type MobileInboxCandidate = Pick<MobileNote, 'archived' | 'fileKind' | 'organized' | 'type'>

const attachmentsFolder = 'attachments'

export function isMobileMarkdownNote(note: MobileMarkdownCandidate): boolean {
  return (note.fileKind ?? 'markdown') === 'markdown'
}

export function isMobileAllNotesEntry(note: MobileAllNotesCandidate): boolean {
  return isMobileMarkdownNote(note) && !mobileNotePathIsInsideFolder(notePath(note), attachmentsFolder)
}

export function isMobileInboxNote(note: MobileInboxCandidate): boolean {
  return isMobileMarkdownNote(note) && !note.archived && !note.organized && note.type !== 'Type'
}

function notePath(note: Pick<MobileNote, 'id' | 'path'>): string {
  return note.path ?? note.id
}

function mobileNotePathIsInsideFolder(path: string, folder: string): boolean {
  const normalizedPath = normalizePath(path)
  const normalizedFolder = normalizePath(folder)
  return normalizedPath.startsWith(`${normalizedFolder}/`) || normalizedPath.includes(`/${normalizedFolder}/`)
}

function normalizePath(path: string): string {
  return path.replaceAll('\\', '/').replace(/^\/+|\/+$/g, '').toLowerCase()
}
