import { useCallback, useMemo, useState } from 'react'
import type {
  MobileNote,
  MobileSavedView,
  MobileSidebarItem,
  MobileWorkspaceSnapshot,
} from '../workspace/mobileWorkspaceModel'
import { evaluateMobileSavedView, sortMobileNotesBySort } from '../workspace/mobileSavedViews'
import {
  isMobileAllNotesEntry,
  isMobileInboxNote,
  isMobileMarkdownNote,
  type MobileNoteListFilter,
} from '../workspace/mobileNoteFilters'
import {
  buildMobileNeighborhood,
  filterMobileNeighborhood,
  flattenMobileNeighborhoodNotes,
  type MobileNeighborhood,
} from '../workspace/mobileNeighborhood'
import type {
  MobileSidebarFolderSelection,
  MobileSidebarItemSelection,
} from '../components/workspace/MobileWorkspaceSidebar'
import { mobileNoteListMatchesQuery, normalizedMobileSearchQuery } from '../workspace/mobileNoteSearch'

export type NoteCount = number
export type NoteCountText = string
export type NoteId = MobileNote['id']
export type ReadOnlyFormValue = string
export type SearchQuery = string
export type SidebarLabel = string
export type TabletSidebarSelection =
  | { count?: NoteCountText; id: string; kind: 'item'; label: SidebarLabel; sectionId: string; typeName?: string; viewId?: string }
  | { id: string; kind: 'folder'; label: SidebarLabel }
  | { id: string; kind: 'entity'; label: SidebarLabel }
type TabletSidebarItemSelection = Extract<TabletSidebarSelection, { kind: 'item' }>
type SidebarNotesResolver = (
  snapshot: MobileWorkspaceSnapshot,
  notes: MobileNote[],
  selection: TabletSidebarItemSelection,
) => MobileNote[]
type NoteListPropertyResolver = (
  snapshot: MobileWorkspaceSnapshot,
  selection: TabletSidebarItemSelection,
) => string[]
type SelectSidebarSelection = (selection: TabletSidebarSelection, sourceSnapshot?: MobileWorkspaceSnapshot) => void
type SetSidebarSelection = (selection: TabletSidebarSelection) => void

const sidebarSectionResolvers: Record<string, SidebarNotesResolver> = {
  favorites: (_snapshot, notes, selection) => notesForFavoriteSelection(notes, selection),
  types: (snapshot, notes, selection) => notesForTypeSelection(snapshot, notes, selection),
  views: (snapshot, _notes, selection) => notesForSavedView(snapshot, selection),
}
const noteListPropertyResolvers: Record<string, NoteListPropertyResolver> = {
  primary: (snapshot, selection) => primaryNoteListPropertiesForSelection(snapshot, selection),
  types: (snapshot, selection) => typeDefinitionForSelection(snapshot, selection)?.listPropertiesDisplay ?? [],
  views: (snapshot, selection) => savedViewForSelection(snapshot, selection)?.definition.listPropertiesDisplay ?? [],
}

export function useTabletWorkspaceNavigation(snapshot: MobileWorkspaceSnapshot, searchQuery: SearchQuery) {
  const [sidebarSelection, setSidebarSelection] = useState<TabletSidebarSelection>(() => initialSidebarSelection(snapshot))
  const [noteListFilter, setNoteListFilter] = useState<MobileNoteListFilter>('open')
  const [selectedNoteId, setSelectedNoteId] = useState<NoteId | null>(initialSelectedNoteId(snapshot))
  const sidebarNotes = useMemo(() => (
    notesForSidebarSelection(snapshot, sidebarSelection, { noteListFilter })
  ), [noteListFilter, sidebarSelection, snapshot])
  const noteListProperties = useMemo(() => noteListPropertiesForSelection(snapshot, sidebarSelection), [sidebarSelection, snapshot])
  const noteListNeighborhood = useMemo(
    () => neighborhoodForSelection(snapshot, sidebarSelection, searchQuery, noteListProperties),
    [noteListProperties, searchQuery, sidebarSelection, snapshot],
  )
  const notes = useMemo(() => (
    noteListNeighborhood
      ? flattenMobileNeighborhoodNotes(noteListNeighborhood)
      : filterNotesBySearch(sidebarNotes, searchQuery, noteListProperties, snapshot.typeDefinitions)
  ), [noteListNeighborhood, noteListProperties, searchQuery, sidebarNotes, snapshot.typeDefinitions])
  const selectedNote = selectedMobileNote(snapshot, notes, selectedNoteId)

  const selectSidebarSelection = useCallback((selection: TabletSidebarSelection, sourceSnapshot = snapshot) => {
    const nextNoteListProperties = noteListPropertiesForSelection(sourceSnapshot, selection)
    const nextNotes = filterNotesBySearch(
      notesForSidebarSelection(sourceSnapshot, selection, { noteListFilter: 'open' }),
      searchQuery,
      nextNoteListProperties,
      sourceSnapshot.typeDefinitions,
    )
    setSidebarSelection(selection)
    setNoteListFilter('open')
    setSelectedNoteId(nextNotes[0]?.id ?? null)
  }, [searchQuery, snapshot])
  const selectNoteListFilter = useCallback((filter: MobileNoteListFilter) => {
    const nextNotes = filterNotesBySearch(
      notesForSidebarSelection(snapshot, sidebarSelection, { noteListFilter: filter }),
      searchQuery,
      noteListProperties,
      snapshot.typeDefinitions,
    )
    setNoteListFilter(filter)
    setSelectedNoteId(nextNotes[0]?.id ?? null)
  }, [noteListProperties, searchQuery, sidebarSelection, snapshot])
  const selectionActions = useTabletSelectionActions({
    selectSidebarSelection,
    setSidebarSelection,
    setSelectedNoteId,
    snapshot,
  })

  return {
    activeFolderId: sidebarSelection.kind === 'folder' ? sidebarSelection.id : null,
    activeItemId: sidebarSelection.kind === 'item' ? sidebarSelection.id : null,
    editorBlocks: editorBlocksForSelection(snapshot, selectedNote),
    editorBullets: editorBulletsForSelection(snapshot, selectedNote),
    noteListProperties,
    noteListNeighborhood,
    noteListFilter,
    noteListFilterCounts: noteListFilterCountsForSelection(snapshot, sidebarSelection),
    noteListFilterVisible: shouldShowNoteListFilter(sidebarSelection),
    noteListSubtitle: noteListSubtitle(
      sidebarSelection,
      snapshot.noteListSubtitle,
      notes.length,
      searchQuery,
      shouldShowNoteListFilter(sidebarSelection),
    ),
    noteListTitle: sidebarSelection.label,
    notes,
    onNoteListFilterChange: selectNoteListFilter,
    sidebarSelection,
    selectedNote,
    selectedNoteId: selectedNote?.id ?? selectedNoteId,
    setSelectedNoteId,
    ...selectionActions,
  }
}

function useTabletSelectionActions({
  selectSidebarSelection,
  setSidebarSelection,
  setSelectedNoteId,
  snapshot,
}: {
  selectSidebarSelection: SelectSidebarSelection
  setSidebarSelection: SetSidebarSelection
  setSelectedNoteId: (noteId: NoteId | null) => void
  snapshot: MobileWorkspaceSnapshot
}) {
  return {
    selectDefaultSidebarItem: useCallback((sourceSnapshot = snapshot) => {
      selectSidebarSelection(initialSidebarSelection(sourceSnapshot), sourceSnapshot)
    }, [selectSidebarSelection, snapshot]),
    selectSavedView: useCallback((view: MobileSavedView, sourceSnapshot = snapshot) => {
      const matchingNotes = evaluateMobileSavedView(view, workspaceNotes(sourceSnapshot).filter(isMobileMarkdownNote))
      selectSidebarSelection({
        count: matchingNotes.length.toLocaleString(),
        id: view.id,
        kind: 'item',
        label: view.definition.name,
        sectionId: 'views',
        viewId: view.id,
      }, sourceSnapshot)
    }, [selectSidebarSelection, snapshot]),
    selectFolder: useCallback((selection: MobileSidebarFolderSelection, sourceSnapshot = snapshot) => {
      selectSidebarSelection({
        id: selection.id,
        kind: 'folder',
        label: selection.name,
      }, sourceSnapshot)
    }, [selectSidebarSelection, snapshot]),
    selectNeighborhoodNote: useCallback((noteId: NoteId, sourceSnapshot = snapshot) => {
      selectNeighborhoodNote({ noteId, setSelectedNoteId, setSidebarSelection, snapshot: sourceSnapshot })
    }, [setSelectedNoteId, setSidebarSelection, snapshot]),
    selectSidebarItem: useCallback((selection: MobileSidebarItemSelection, sourceSnapshot = snapshot) => {
      const favoriteSelection = favoriteNeighborhoodSelectionForSidebarItem(sourceSnapshot, selection)
      if (favoriteSelection) {
        selectNeighborhoodNote({
          noteId: favoriteSelection.id,
          setSelectedNoteId,
          setSidebarSelection,
          snapshot: sourceSnapshot,
        })
        return
      }

      selectSidebarSelection({
        count: selection.count,
        id: selection.id,
        kind: 'item',
        label: selection.label,
        sectionId: selection.sectionId,
        typeName: selection.typeName,
        viewId: selection.viewId,
      }, sourceSnapshot)
    }, [selectSidebarSelection, setSelectedNoteId, setSidebarSelection, snapshot]),
  }
}

function selectNeighborhoodNote({
  noteId,
  setSelectedNoteId,
  setSidebarSelection,
  snapshot,
}: {
  noteId: NoteId
  setSelectedNoteId: (noteId: NoteId | null) => void
  setSidebarSelection: SetSidebarSelection
  snapshot: MobileWorkspaceSnapshot
}) {
  const sourceNote = workspaceNotes(snapshot).find((note) => note.id === noteId)
  if (!sourceNote) {
    setSelectedNoteId(noteId)
    return
  }

  setSidebarSelection({
    id: sourceNote.id,
    kind: 'entity',
    label: sourceNote.title,
  })
  setSelectedNoteId(sourceNote.id)
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

export function notesForSidebarSelection(
  snapshot: MobileWorkspaceSnapshot,
  selection: TabletSidebarSelection,
  options: { noteListFilter?: MobileNoteListFilter } = {},
) {
  const notes = workspaceNotes(snapshot)
  if (selection.kind === 'entity') return []
  if (selection.kind === 'folder') {
    return notes.filter((note) => noteMatchesArchiveFilter(note, options.noteListFilter) && noteBelongsToFolder(note, selection))
  }

  const sectionResolver = sidebarSectionResolvers[selection.sectionId]
  const sectionNotes = sectionResolver?.(snapshot, notes, selection) ?? primaryNotesForSelection(notes, selection)
  return selection.sectionId === 'types'
    ? sectionNotes.filter((note) => noteMatchesArchiveFilter(note, options.noteListFilter))
    : sectionNotes
}

export function noteListFilterCountsForSelection(
  snapshot: MobileWorkspaceSnapshot,
  selection: TabletSidebarSelection,
): Record<MobileNoteListFilter, number> {
  if (!shouldShowNoteListFilter(selection)) return { archived: 0, open: 0 }

  return {
    archived: notesForSidebarSelection(snapshot, selection, { noteListFilter: 'archived' }).length,
    open: notesForSidebarSelection(snapshot, selection, { noteListFilter: 'open' }).length,
  }
}

function shouldShowNoteListFilter(selection: TabletSidebarSelection): boolean {
  return selection.kind === 'folder' || (selection.kind === 'item' && selection.sectionId === 'types')
}

function primaryNotesForSelection(notes: MobileNote[], selection: TabletSidebarItemSelection) {
  if (selection.id === 'archive') return notes.filter((note) => note.archived && isMobileMarkdownNote(note))
  if (selection.id === 'all-notes') return notes.filter((note) => !note.archived && isMobileAllNotesEntry(note))
  if (selection.id === 'inbox') return inboxNotes(notes)

  return notes
}

function neighborhoodForSelection(
  snapshot: MobileWorkspaceSnapshot,
  selection: TabletSidebarSelection,
  searchQuery: SearchQuery,
  displayPropertyKeys: string[],
): MobileNeighborhood | null {
  if (selection.kind !== 'entity') return null

  const notes = workspaceNotes(snapshot)
  const source = notes.find((note) => note.id === selection.id)
  if (!source) return null

  return filterMobileNeighborhood(buildMobileNeighborhood(source, notes), searchQuery, displayPropertyKeys)
}

function workspaceNotes(snapshot: MobileWorkspaceSnapshot) {
  return snapshot.allNotes ?? snapshot.notes
}

function notesForSavedView(
  snapshot: MobileWorkspaceSnapshot,
  selection: TabletSidebarItemSelection,
) {
  const view = savedViewForSelection(snapshot, selection)
  if (!view) return []

  return evaluateMobileSavedView(view, workspaceNotes(snapshot).filter(isMobileMarkdownNote))
}

function notesForFavoriteSelection(notes: MobileNote[], selection: TabletSidebarItemSelection) {
  const selectedNote = favoriteNoteForSelection(notes, selection)
  return selectedNote ? [selectedNote] : []
}

export function favoriteNeighborhoodSelectionForSidebarItem(
  snapshot: MobileWorkspaceSnapshot,
  selection: MobileSidebarItemSelection,
): TabletSidebarSelection | null {
  if (selection.sectionId !== 'favorites') return null

  const note = favoriteNoteForSelection(workspaceNotes(snapshot), selection)
  if (!note) return null

  return {
    id: note.id,
    kind: 'entity',
    label: note.title,
  }
}

function favoriteNoteForSelection(notes: MobileNote[], selection: Pick<TabletSidebarItemSelection, 'id' | 'label'>) {
  const selectedNoteId = favoriteNoteId(selection.id)
  return notes.find((note) => isMobileMarkdownNote(note) && !note.archived && note.favorite && (
    selectedNoteId ? note.id === selectedNoteId : note.title === selection.label
  )) ?? null
}

function favoriteNoteId(itemId: string) {
  const prefix = 'favorite-'
  return itemId.startsWith(prefix) ? itemId.slice(prefix.length) : null
}

function notesForTypeSelection(
  snapshot: MobileWorkspaceSnapshot,
  notes: MobileNote[],
  selection: TabletSidebarItemSelection,
) {
  const matchingNotes = notes.filter((note) => isMobileMarkdownNote(note) && noteMatchesType(note, selection))
  return sortMobileNotesBySort(matchingNotes, typeDefinitionForSelection(snapshot, selection)?.sort ?? null)
}

function noteMatchesArchiveFilter(note: MobileNote, filter: MobileNoteListFilter = 'open') {
  return filter === 'archived' ? note.archived === true : !note.archived
}

export function noteListPropertiesForSelection(
  snapshot: MobileWorkspaceSnapshot,
  selection: TabletSidebarSelection,
) {
  if (selection.kind !== 'item') return []
  return noteListPropertyResolvers[selection.sectionId]?.(snapshot, selection) ?? []
}

function primaryNoteListPropertiesForSelection(
  snapshot: MobileWorkspaceSnapshot,
  selection: TabletSidebarItemSelection,
) {
  if (selection.id === 'all-notes') return snapshot.noteListPropertyOverrides?.allNotes ?? []
  if (selection.id === 'inbox') return snapshot.noteListPropertyOverrides?.inbox ?? []
  return []
}

function savedViewForSelection(
  snapshot: MobileWorkspaceSnapshot,
  selection: TabletSidebarItemSelection,
) {
  return snapshot.views?.find((candidate) => candidate.id === selection.viewId || candidate.id === selection.id) ?? null
}

function typeDefinitionForSelection(
  snapshot: MobileWorkspaceSnapshot,
  selection: TabletSidebarItemSelection,
) {
  const typeName = typeNameForSelection(snapshot, selection)
  return typeName ? snapshot.typeDefinitions?.[typeName] : null
}

function typeNameForSelection(
  snapshot: MobileWorkspaceSnapshot,
  selection: TabletSidebarItemSelection,
) {
  if (selection.typeName) return selection.typeName

  return snapshot.sidebarSections
    .find((section) => section.id === 'types')
    ?.items
    ?.find((item) => item.id === selection.id)
    ?.typeName ?? null
}

export function filterNotesBySearch(
  notes: MobileNote[],
  searchQuery: SearchQuery,
  displayPropertyKeys: string[] = [],
  typeDefinitions?: MobileWorkspaceSnapshot['typeDefinitions'],
) {
  const normalizedSearch = normalizedMobileSearchQuery(searchQuery)
  if (!normalizedSearch) return notes

  return notes.filter((note) => mobileNoteListMatchesQuery(note, normalizedSearch, displayPropertyKeys, typeDefinitions))
}

function inboxNotes(notes: MobileNote[]) {
  return notes.filter(isMobileInboxNote)
}

function noteBelongsToFolder(note: MobileNote, selection: Extract<TabletSidebarSelection, { kind: 'folder' }>) {
  const folderPath = noteFolderPath(note)
  if (!folderPath) return false
  const normalizedNoteFolder = normalizedFolderPath(folderPath)
  const normalizedSelection = normalizedFolderPath(selection.id)
  return normalizedNoteFolder === normalizedSelection || normalizedNoteFolder.startsWith(`${normalizedSelection}/`)
}

function noteMatchesType(note: MobileNote, selection: TabletSidebarItemSelection) {
  if (selection.typeName) return normalizedLabel(note.type) === normalizedLabel(selection.typeName)

  return normalizedLabel(selection.id) === normalizedLabel(`type-${note.type}`)
    || normalizedLabel(selection.label).replace(/s$/, '') === normalizedLabel(note.type)
}

function normalizedLabel(label: SidebarLabel) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function normalizedFolderPath(path: SidebarLabel) {
  return path.toLowerCase().replace(/^\/+|\/+$/g, '').replace(/\/+/g, '/')
}

function noteFolderPath(note: MobileNote) {
  return (note.path ?? note.id).split('/').slice(0, -1).join('/')
}

function noteListSubtitle(
  selection: TabletSidebarSelection,
  inboxSubtitle: NoteCountText,
  noteCount: NoteCount,
  searchQuery: SearchQuery,
  filterVisible = false,
) {
  const visibleCount = noteCount.toLocaleString()
  if (filterVisible || normalizedMobileSearchQuery(searchQuery) || selection.kind !== 'item') return visibleCount
  if (selection.id === 'inbox') return inboxSubtitle

  return selection.count ?? visibleCount
}

function selectedMobileNote(
  snapshot: MobileWorkspaceSnapshot,
  notes: MobileNote[],
  selectedNoteId: NoteId | null,
) {
  const selectedNote = notes.find((note) => note.id === selectedNoteId)
    ?? workspaceNotes(snapshot).find((note) => note.id === selectedNoteId)
    ?? notes[0]

  if (!selectedNote) return null
  return snapshot.notes.find((note) => note.id === selectedNote.id) ?? selectedNote
}

function editorBlocksForSelection(snapshot: MobileWorkspaceSnapshot, selectedNote: MobileNote | null) {
  if (!selectedNote) return snapshot.editorBlocks
  if (!isMobileMarkdownNote(selectedNote)) return []
  if (selectedNote.editorBlocks) return selectedNote.editorBlocks
  return snapshot.allNotes ? [] : snapshot.editorBlocks
}

function editorBulletsForSelection(snapshot: MobileWorkspaceSnapshot, selectedNote: MobileNote | null) {
  if (!selectedNote) return snapshot.editorBullets
  if (!isMobileMarkdownNote(selectedNote)) return []
  if (selectedNote.editorBullets) return selectedNote.editorBullets
  return snapshot.allNotes ? [] : snapshot.editorBullets
}
