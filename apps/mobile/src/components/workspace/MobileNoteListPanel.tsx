import { useMemo, type ReactNode } from 'react'
import { MagnifyingGlass, Plus } from 'phosphor-react-native'
import { FlatList, StyleSheet, View } from 'react-native'
import { Text } from '../ui/text'
import { mobileCopy, mobileText } from '../../i18n/mobileText'
import { MobileLayoutProbeReadout } from '../../qa/MobileLayoutProbeReadout'
import { useMobileLayoutProbe, type MobileLayoutProbe } from '../../qa/mobileLayoutProbe'
import { MobileChip } from '../../ui/MobileChip'
import { MobileIconButton } from '../../ui/MobileIconButton'
import { MobileListRow } from '../../ui/MobileListRow'
import { MobilePanel, MobileToolbar, MobileToolbarSpacer, MobileToolbarTitle } from '../../ui/MobilePanel'
import { desktopPanelParity, desktopToolbarActionParity, desktopToolbarParity } from '../../ui/desktopParity'
import { mobileColors, mobileSpace, mobileType } from '../../ui/tokens'
import { configuredMobileNoteRowChips, defaultMobileNoteRowChips } from '../../workspace/mobileNoteDisplay'
import type { MobileNeighborhood, MobileNeighborhoodGroup } from '../../workspace/mobileNeighborhood'
import type { MobileNote } from '../../workspace/mobileWorkspaceModel'
import { MobileTypeIcon } from './MobileWorkspaceIcons'
import { noteTypeColor, noteTypeSoftColor } from './mobileWorkspaceTone'

type MobileNoteListPanelProps = {
  compact: boolean
  displayPropertyKeys?: string[]
  fullWidth?: boolean
  leading?: ReactNode
  layoutProbe?: boolean
  neighborhood?: MobileNeighborhood | null
  notes: MobileNote[]
  onOpenCreateNote: () => void
  onOpenSearch: () => void
  onSelectNote: (noteId: string) => void
  searchQuery?: string
  selectedNoteId: string | null
  subtitle: string
  title?: string
}

export function MobileNoteListPanel(props: MobileNoteListPanelProps) {
  const {
    compact,
    displayPropertyKeys = [],
    fullWidth = false,
    leading,
    layoutProbe: layoutProbeEnabled = false,
    neighborhood = null,
    notes,
    onOpenCreateNote,
    onOpenSearch,
    onSelectNote,
    searchQuery,
    selectedNoteId,
    subtitle,
    title = mobileCopy.inbox,
  } = props
  const activeNoteId = selectedNoteId ?? notes[0]?.id ?? null
  const layoutProbe = useMobileLayoutProbe(layoutProbeEnabled)

  return (
    <MobilePanel {...layoutProbe.probe('noteList.panel')} style={[styles.panel, compact ? styles.panelCompact : null, fullWidth ? styles.panelFullWidth : null]} testID="note-list-panel">
      <MobileToolbar testID="note-list-toolbar">
        {leading}
        <View style={styles.toolbarTitleBlock}>
          <MobileToolbarTitle testID="note-list-toolbar-title" title={title} />
          <Text style={styles.toolbarSubtitle} testID="note-list-toolbar-subtitle">{subtitle}</Text>
        </View>
        <MobileToolbarSpacer />
        <MobileIconButton accessibilityLabel={mobileCopy.searchNotes} testID="note-list-search-action" onPress={onOpenSearch}>
          <MagnifyingGlass color={mobileColors.textMuted} size={desktopToolbarActionParity.iconSize} />
        </MobileIconButton>
        <MobileIconButton accessibilityLabel={mobileCopy.createNote} testID="note-list-create-action" onPress={onOpenCreateNote}>
          <Plus color={mobileColors.textMuted} size={desktopToolbarActionParity.iconSize} />
        </MobileIconButton>
      </MobileToolbar>
      {searchQuery ? <SearchPill searchQuery={searchQuery} /> : null}
      {neighborhood ? (
        <NeighborhoodNoteList
          activeNoteId={activeNoteId}
          displayPropertyKeys={displayPropertyKeys}
          layoutProbe={layoutProbe.probe}
          neighborhood={neighborhood}
          onSelectNote={onSelectNote}
        />
      ) : notes.length === 0 ? (
        <NoteListEmptyState searchQuery={searchQuery} />
      ) : (
        <FlatList
          {...layoutProbe.probe('noteList.list')}
          contentContainerStyle={styles.listContent}
          data={notes}
          extraData={selectedNoteId}
          initialNumToRender={16}
          keyExtractor={(note) => note.id}
          renderItem={({ item: note }) => noteRow({
            activeNoteId,
            displayPropertyKeys,
            layoutProbe: layoutProbe.probe,
            note,
            onSelectNote,
          })}
          removeClippedSubviews
          showsVerticalScrollIndicator={false}
          windowSize={5}
        />
      )}
      {layoutProbeEnabled ? <MobileLayoutProbeReadout metrics={layoutProbe.metrics} testID="note-list-layout-metrics" /> : null}
    </MobilePanel>
  )
}

type NeighborhoodRow =
  | { id: string; kind: 'source'; note: MobileNote }
  | { group: MobileNeighborhoodGroup; id: string; kind: 'header' }
  | { id: string; kind: 'note'; note: MobileNote }

function NeighborhoodNoteList({
  activeNoteId,
  displayPropertyKeys,
  layoutProbe,
  neighborhood,
  onSelectNote,
}: {
  activeNoteId: string | null
  displayPropertyKeys: string[]
  layoutProbe: MobileLayoutProbe
  neighborhood: MobileNeighborhood
  onSelectNote: (noteId: string) => void
}) {
  const rows = useMemo(() => neighborhoodRows(neighborhood), [neighborhood])

  return (
    <FlatList
      contentContainerStyle={styles.listContent}
      data={rows}
      extraData={activeNoteId}
      initialNumToRender={18}
      keyExtractor={(row) => row.id}
      renderItem={({ item }) => neighborhoodRow({
        activeNoteId,
        displayPropertyKeys,
        item,
        layoutProbe,
        onSelectNote,
      })}
      removeClippedSubviews
      showsVerticalScrollIndicator={false}
      windowSize={5}
    />
  )
}

function neighborhoodRows(neighborhood: MobileNeighborhood): NeighborhoodRow[] {
  return [
    { id: `source-${neighborhood.source.id}`, kind: 'source', note: neighborhood.source },
    ...neighborhood.groups.flatMap((group) => [
      { group, id: `group-${group.id}`, kind: 'header' } as const,
      ...group.notes.map((note) => ({ id: `group-${group.id}-${note.id}`, kind: 'note' as const, note })),
    ]),
  ]
}

function neighborhoodRow({
  activeNoteId,
  displayPropertyKeys,
  item,
  layoutProbe,
  onSelectNote,
}: {
  activeNoteId: string | null
  displayPropertyKeys: string[]
  item: NeighborhoodRow
  layoutProbe: MobileLayoutProbe
  onSelectNote: (noteId: string) => void
}) {
  if (item.kind === 'header') return <RelationshipGroupHeader group={item.group} />

  return noteRow({
    activeNoteId,
    displayPropertyKeys,
    forceSelected: item.kind === 'source',
    layoutProbe,
    note: item.note,
    onSelectNote,
  })
}

function noteRow({
  activeNoteId,
  displayPropertyKeys,
  forceSelected = false,
  layoutProbe,
  note,
  onSelectNote,
}: {
  activeNoteId: string | null
  displayPropertyKeys: string[]
  forceSelected?: boolean
  layoutProbe: MobileLayoutProbe
  note: MobileNote
  onSelectNote: (noteId: string) => void
}) {
  return (
    <MobileListRow
      chips={<NoteRowChips displayPropertyKeys={displayPropertyKeys} note={note} />}
      layoutProbe={layoutProbe}
      metricId={`noteList.item.${note.id}`}
      selected={forceSelected || note.id === activeNoteId}
      selectedBackgroundColor={noteTypeSoftColor(note.typeTone)}
      selectedBorderColor={noteTypeColor(note.typeTone)}
      subtitle={note.snippet}
      testID={`note-row-${note.id}`}
      title={note.title}
      trailing={<MobileTypeIcon size={16} tone={note.typeTone} type={note.type} />}
      onPress={() => onSelectNote(note.id)}
    />
  )
}

function RelationshipGroupHeader({ group }: { group: MobileNeighborhoodGroup }) {
  return (
    <View style={styles.groupHeader} testID={`relationship-group-${group.id}`}>
      <Text style={styles.groupLabel}>{group.label}</Text>
      <Text style={styles.groupCount}>{group.notes.length}</Text>
    </View>
  )
}

function SearchPill({ searchQuery }: { searchQuery: string }) {
  return (
    <View style={styles.searchPill}>
      <MagnifyingGlass color={mobileColors.textMuted} size={16} />
      <Text numberOfLines={1} style={styles.searchText}>{searchQuery}</Text>
    </View>
  )
}

function NoteListEmptyState({ searchQuery }: { searchQuery?: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{mobileText(searchQuery ? 'noteList.empty.noMatching' : 'noteList.empty.allOrganized')}</Text>
      <Text style={styles.emptyText}>{mobileText('noteList.empty.noNotes')}</Text>
    </View>
  )
}

function NoteRowChips({
  displayPropertyKeys,
  note,
}: {
  displayPropertyKeys: string[]
  note: MobileNote
}) {
  const chips = displayPropertyKeys.length > 0
    ? configuredMobileNoteRowChips(note, displayPropertyKeys)
    : defaultMobileNoteRowChips(note)
  if (chips.length === 0) return null

  return (
    <View style={styles.chipRow}>
      {chips.map((chip, index) => (
        <MobileChip density="list" key={`${chip.label}-${index}`} label={chip.label} tone={chip.tone} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  chipRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mobileSpace.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: mobileSpace.xl,
  },
  emptyText: {
    marginTop: mobileSpace.sm,
    color: mobileColors.textMuted,
    fontSize: mobileType.body,
    textAlign: 'center',
  },
  emptyTitle: {
    color: mobileColors.text,
    fontSize: mobileType.title,
    fontWeight: '600',
    textAlign: 'center',
  },
  groupCount: {
    color: mobileColors.textMuted,
    fontSize: mobileType.micro,
    fontWeight: '400',
    fontVariant: ['tabular-nums'],
  },
  groupHeader: {
    minHeight: 32,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: mobileColors.graySoft,
    paddingHorizontal: mobileSpace.lg,
  },
  groupLabel: {
    color: mobileColors.textMuted,
    fontSize: mobileType.micro,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  panel: {
    alignSelf: 'stretch',
    borderRightWidth: StyleSheet.hairlineWidth,
    height: '100%',
    width: desktopPanelParity.noteListWidth,
  },
  panelCompact: {
    width: 336,
  },
  panelFullWidth: {
    width: '100%',
  },
  listContent: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  searchPill: {
    minHeight: 36,
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.sm,
    borderBottomColor: mobileColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: mobileSpace.lg,
  },
  searchText: {
    flex: 1,
    color: mobileColors.text,
    fontSize: mobileType.body,
    fontWeight: '500',
  },
  toolbarSubtitle: {
    color: mobileColors.textMuted,
    fontSize: desktopToolbarParity.subtitleFontSize,
    fontWeight: desktopToolbarParity.subtitleFontWeight,
  },
  toolbarTitleBlock: {
    minWidth: 0,
  },
})
