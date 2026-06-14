import { useCallback, useMemo, useState } from 'react'
import type {
  MobileNote,
  MobileSidebarItem,
  MobileWorkspaceSnapshot,
} from '../workspace/mobileWorkspaceModel'
import { evaluateMobileSavedView } from '../workspace/mobileSavedViews'
import type {
  MobileSidebarFolderSelection,
  MobileSidebarItemSelection,
} from '../components/workspace/MobileWorkspaceSidebar'

export type NoteCount = number
export type NoteCountText = string
export type NoteId = MobileNote['id']
export type ReadOnlyFormValue = string
export type SearchQuery = string
export type SidebarLabel = string
export type TabletSidebarSelection =
  | { count?: NoteCountText; id: string; kind: 'item'; label: SidebarLabel; sectionId: string; viewId?: string }
  | { id: string; kind: 'folder'; label: SidebarLabel }
type TabletSidebarItemSelection = Extract<TabletSidebarSelection, { kind: 'item' }>
type SidebarNotesResolver = (
  snapshot: MobileWorkspaceSnapshot,
  notes: MobileNote[],
  selection: TabletSidebarItemSelection,
) => MobileNote[]

const sidebarSectionResolvers: Record<string, SidebarNotesResolver> = {
  favorites: (_snapshot, notes, selection) => notes.filter((note) => note.favorite || note.title === selection.label),
  types: (_snapshot, notes, selection) => notes.filter((note) => noteMatchesType(note, selection)),
  views: (snapshot, _notes, selection) => notesForSavedView(snapshot, selection),
}

export function useTabletWorkspaceNavigation(snapshot: MobileWorkspaceSnapshot, searchQuery: SearchQuery) {
  const [sidebarSelection, setSidebarSelection] = useState<TabletSidebarSelection>(() => initialSidebarSelection(snapshot))
  const [selectedNoteId, setSelectedNoteId] = useState<NoteId | null>(initialSelectedNoteId(snapshot))
  const sidebarNotes = useMemo(() => notesForSidebarSelection(snapshot, sidebarSelection), [sidebarSelection, snapshot])
  const notes = useMemo(() => filterNotesBySearch(sidebarNotes, searchQuery), [searchQuery, sidebarNotes])
  const selectedNote = selectedMobileNote(snapshot, notes, selectedNoteId)

  const selectSidebarSelection = useCallback((selection: TabletSidebarSelection) => {
    const nextNotes = filterNotesBySearch(notesForSidebarSelection(snapshot, selection), searchQuery)
    setSidebarSelection(selection)
    setSelectedNoteId(nextNotes[0]?.id ?? null)
  }, [searchQuery, snapshot])

  return {
    activeFolderId: sidebarSelection.kind === 'folder' ? sidebarSelection.id : null,
    activeItemId: sidebarSelection.kind === 'item' ? sidebarSelection.id : null,
    editorBlocks: selectedNote?.editorBlocks ?? snapshot.editorBlocks,
    editorBullets: selectedNote?.editorBullets ?? snapshot.editorBullets,
    noteListSubtitle: noteListSubtitle(sidebarSelection, snapshot.noteListSubtitle, notes.length, searchQuery),
    noteListTitle: sidebarSelection.label,
    notes,
    selectFolder: useCallback((selection: MobileSidebarFolderSelection) => {
      selectSidebarSelection({
        id: selection.id,
        kind: 'folder',
        label: selection.name,
      })
    }, [selectSidebarSelection]),
    selectSidebarItem: useCallback((selection: MobileSidebarItemSelection) => {
      selectSidebarSelection({
        count: selection.count,
        id: selection.id,
        kind: 'item',
        label: selection.label,
        sectionId: selection.sectionId,
        viewId: selection.viewId,
      })
    }, [selectSidebarSelection]),
    selectedNote,
    selectedNoteId: selectedNote?.id ?? selectedNoteId,
    setSelectedNoteId,
  }
}

export function snapshotWithFavoriteOverrides(
  snapshot: MobileWorkspaceSnapshot,
  favoriteOverrides: Record<string, boolean>,
): MobileWorkspaceSnapshot {
  if (Object.keys(favoriteOverrides).length === 0) return snapshot

  return {
    ...snapshot,
    notes: snapshot.notes.map((note) => {
      const favorite = favoriteOverrides[note.id]
      return favorite === undefined ? note : { ...note, favorite }
    }),
  }
}

function initialSelectedNoteId(snapshot: MobileWorkspaceSnapshot) {
  return snapshot.selectedNoteId ?? snapshot.notes[0]?.id ?? null
}

function initialSidebarSelection(snapshot: MobileWorkspaceSnapshot): TabletSidebarSelection {
  const primaryItem = snapshot.sidebarSections
    .find((section) => section.id === 'primary')
    ?.items
    ?.find(activeSidebarItem)

  return {
    count: primaryItem?.count,
    id: primaryItem?.id ?? 'inbox',
    kind: 'item',
    label: primaryItem?.label ?? 'Inbox',
    sectionId: 'primary',
  }
}

function activeSidebarItem(item: MobileSidebarItem) {
  return item.active === true
}

function notesForSidebarSelection(snapshot: MobileWorkspaceSnapshot, selection: TabletSidebarSelection) {
  const notes = workspaceNotes(snapshot)
  if (selection.kind === 'folder') return notes.filter((note) => noteBelongsToFolder(note, selection.label))

  const sectionResolver = sidebarSectionResolvers[selection.sectionId]
  return sectionResolver?.(snapshot, notes, selection) ?? primaryNotesForSelection(notes, selection)
}

function primaryNotesForSelection(notes: MobileNote[], selection: TabletSidebarItemSelection) {
  if (selection.id === 'archive') return notes.filter((note) => note.archived)
  if (selection.id === 'all-notes') return notes.filter((note) => !note.archived)
  if (selection.id === 'inbox') return inboxNotes(notes)

  return notes
}

function workspaceNotes(snapshot: MobileWorkspaceSnapshot) {
  return snapshot.allNotes ?? snapshot.notes
}

function notesForSavedView(
  snapshot: MobileWorkspaceSnapshot,
  selection: TabletSidebarItemSelection,
) {
  const view = snapshot.views?.find((candidate) => candidate.id === selection.viewId || candidate.id === selection.id)
  if (!view) return []

  return evaluateMobileSavedView(view, workspaceNotes(snapshot))
}

function filterNotesBySearch(notes: MobileNote[], searchQuery: SearchQuery) {
  const normalizedSearch = normalizedSearchQuery(searchQuery)
  if (!normalizedSearch) return notes

  return notes.filter((note) => searchableNoteText(note).includes(normalizedSearch))
}

function searchableNoteText(note: MobileNote) {
  return normalizedSearchQuery([
    note.title,
    note.snippet,
    note.type,
    note.status,
    note.tags.join(' '),
    note.path ?? '',
  ].join(' '))
}

function inboxNotes(notes: MobileNote[]) {
  const filteredNotes = notes.filter((note) => !note.archived && !note.organized)
  return filteredNotes.length > 0 ? filteredNotes : notes
}

function noteBelongsToFolder(note: MobileNote, folderName: SidebarLabel) {
  return (note.path ?? '').split('/').slice(0, -1).some((segment) => normalizedLabel(segment) === normalizedLabel(folderName))
}

function noteMatchesType(note: MobileNote, selection: TabletSidebarItemSelection) {
  return normalizedLabel(selection.id) === normalizedLabel(`type-${note.type}`)
    || normalizedLabel(selection.label).replace(/s$/, '') === normalizedLabel(note.type)
}

function normalizedLabel(label: SidebarLabel) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function normalizedSearchQuery(value: SearchQuery) {
  return value.trim().toLowerCase()
}

function noteListSubtitle(selection: TabletSidebarSelection, inboxSubtitle: NoteCountText, noteCount: NoteCount, searchQuery: SearchQuery) {
  const visibleCount = noteCount.toLocaleString()
  if (normalizedSearchQuery(searchQuery) || selection.kind !== 'item') return visibleCount
  if (selection.id === 'inbox') return inboxSubtitle

  return selection.count ?? visibleCount
}

function selectedMobileNote(
  snapshot: MobileWorkspaceSnapshot,
  notes: MobileNote[],
  selectedNoteId: NoteId | null,
) {
  const workspaceSelectedNote = workspaceNotes(snapshot).find((note) => note.id === selectedNoteId)
  return notes.find((note) => note.id === selectedNoteId) ?? workspaceSelectedNote ?? notes[0] ?? null
}
