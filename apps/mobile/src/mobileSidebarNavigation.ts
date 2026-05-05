import type { IconName } from './NamedIcon'
import type { MobileNote } from './mobileNoteProjection'

export type MobileSidebarSelection =
  | { kind: 'library'; id: 'all' | 'archive' | 'inbox' }
  | { kind: 'type'; type: string }

export type MobileSidebarItem = {
  count: number
  icon: IconName
  label: string
  selection: MobileSidebarSelection
}

export type MobileSidebarSection = {
  items: MobileSidebarItem[]
  title: string
}

export const defaultMobileSidebarSelection: MobileSidebarSelection = { kind: 'library', id: 'inbox' }

export function createMobileSidebarSections(notes: MobileNote[]): MobileSidebarSection[] {
  return [
    {
      title: 'Library',
      items: [
        libraryItem({ count: inboxNotes(notes).length, icon: 'tray', id: 'inbox', label: 'Inbox' }),
        libraryItem({ count: activeNotes(notes).length, icon: 'file-text', id: 'all', label: 'All Notes' }),
        libraryItem({ count: archivedNotes(notes).length, icon: 'archive', id: 'archive', label: 'Archive' }),
      ],
    },
    {
      title: 'Types',
      items: noteTypes(notes).map((type) => ({
        count: activeNotes(notes).filter((note) => note.type === type).length,
        icon: iconForType(type),
        label: pluralTypeLabel(type),
        selection: { kind: 'type', type },
      })),
    },
  ]
}

export function filterNotesForSidebarSelection({
  notes,
  selection,
}: {
  notes: MobileNote[]
  selection: MobileSidebarSelection
}) {
  if (selection.kind === 'type') {
    return activeNotes(notes).filter((note) => note.type === selection.type)
  }

  switch (selection.id) {
    case 'all':
      return activeNotes(notes)
    case 'archive':
      return archivedNotes(notes)
    default:
      return inboxNotes(notes)
  }
}

export function mobileSidebarTitle(selection: MobileSidebarSelection) {
  return selection.kind === 'type' ? pluralTypeLabel(selection.type) : libraryTitle(selection.id)
}

export function isMobileSidebarSelectionActive({
  candidate,
  current,
}: {
  candidate: MobileSidebarSelection
  current: MobileSidebarSelection
}) {
  return candidate.kind === current.kind
    && (candidate.kind === 'type' ? candidate.type === (current as { type: string }).type : candidate.id === (current as { id: string }).id)
}

function libraryItem({
  count,
  icon,
  id,
  label,
}: {
  count: number
  icon: IconName
  id: 'all' | 'archive' | 'inbox'
  label: string
}): MobileSidebarItem {
  return {
    count,
    icon,
    label,
    selection: { kind: 'library', id },
  }
}

function inboxNotes(notes: MobileNote[]) {
  return activeNotes(notes).filter((note) => !note.status || note.status === 'Draft')
}

function activeNotes(notes: MobileNote[]) {
  return notes.filter((note) => !note.archived)
}

function archivedNotes(notes: MobileNote[]) {
  return notes.filter((note) => note.archived)
}

function noteTypes(notes: MobileNote[]) {
  return [...new Set(activeNotes(notes).map((note) => note.type))].sort()
}

function libraryTitle(id: 'all' | 'archive' | 'inbox') {
  return id === 'all' ? 'All Notes' : id === 'archive' ? 'Archive' : 'Inbox'
}

function pluralTypeLabel(type: string) {
  return type.endsWith('s') ? type : `${type}s`
}

function iconForType(type: string): IconName {
  if (type === 'Essay') {
    return 'pen-nib'
  }

  if (type === 'Project') {
    return 'wrench'
  }

  if (type === 'Resource') {
    return 'books'
  }

  if (type === 'Release Note') {
    return 'flag'
  }

  return 'file-text'
}
