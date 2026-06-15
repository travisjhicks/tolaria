import type { ReactNode } from 'react'
import { MagnifyingGlass, Plus } from 'phosphor-react-native'
import { FlatList, StyleSheet, View } from 'react-native'
import { Text } from '../ui/text'
import { mobileCopy, mobileText } from '../../i18n/mobileText'
import { MobileLayoutProbeReadout } from '../../qa/MobileLayoutProbeReadout'
import { useMobileLayoutProbe } from '../../qa/mobileLayoutProbe'
import { MobileChip } from '../../ui/MobileChip'
import { MobileIconButton } from '../../ui/MobileIconButton'
import { MobileListRow } from '../../ui/MobileListRow'
import { MobilePanel, MobileToolbar, MobileToolbarSpacer, MobileToolbarTitle } from '../../ui/MobilePanel'
import { desktopPanelParity, desktopToolbarActionParity, desktopToolbarParity } from '../../ui/desktopParity'
import { mobileColors, mobileSpace, mobileType } from '../../ui/tokens'
import type { MobileNote, MobileTone } from '../../workspace/mobileWorkspaceModel'
import { MobileTypeIcon } from './MobileWorkspaceIcons'
import { chipTone, noteTypeColor, noteTypeSoftColor, statusTone, tagTone } from './mobileWorkspaceTone'

type MobileNoteListPanelProps = {
  compact: boolean
  displayPropertyKeys?: string[]
  fullWidth?: boolean
  leading?: ReactNode
  layoutProbe?: boolean
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
      {notes.length === 0 ? (
        <NoteListEmptyState searchQuery={searchQuery} />
      ) : (
        <FlatList
          {...layoutProbe.probe('noteList.list')}
          contentContainerStyle={styles.listContent}
          data={notes}
          extraData={selectedNoteId}
          initialNumToRender={16}
          keyExtractor={(note) => note.id}
          renderItem={({ item: note }) => (
            <MobileListRow
              chips={<NoteRowChips displayPropertyKeys={displayPropertyKeys} note={note} />}
              layoutProbe={layoutProbe.probe}
              metricId={`noteList.item.${note.id}`}
              selected={note.id === activeNoteId}
              selectedBackgroundColor={noteTypeSoftColor(note.typeTone)}
              selectedBorderColor={noteTypeColor(note.typeTone)}
              subtitle={note.snippet}
              testID={`note-row-${note.id}`}
              title={note.title}
              trailing={<MobileTypeIcon size={16} tone={note.typeTone} type={note.type} />}
              onPress={() => onSelectNote(note.id)}
            />
          )}
          removeClippedSubviews
          showsVerticalScrollIndicator={false}
          windowSize={5}
        />
      )}
      {layoutProbeEnabled ? <MobileLayoutProbeReadout metrics={layoutProbe.metrics} testID="note-list-layout-metrics" /> : null}
    </MobilePanel>
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

type NoteRowChip = {
  label: string
  tone: MobileTone
}

function NoteRowChips({
  displayPropertyKeys,
  note,
}: {
  displayPropertyKeys: string[]
  note: MobileNote
}) {
  const chips = displayPropertyKeys.length > 0
    ? configuredNoteRowChips(note, displayPropertyKeys)
    : defaultNoteRowChips(note)
  if (chips.length === 0) return null

  return (
    <View style={styles.chipRow}>
      {chips.map((chip, index) => (
        <MobileChip density="list" key={`${chip.label}-${index}`} label={chip.label} tone={chip.tone} />
      ))}
    </View>
  )
}

function defaultNoteRowChips(note: MobileNote): NoteRowChip[] {
  return [
    { label: note.type, tone: chipTone(note.typeTone) },
    ...(note.status ? [{ label: note.status, tone: statusTone(note.status) }] : []),
    ...note.tags.slice(0, 1).map((tag) => ({ label: tag, tone: tagTone(tag) })),
  ]
}

function configuredNoteRowChips(note: MobileNote, keys: string[]): NoteRowChip[] {
  return keys.flatMap((key) => displayPropertyChips(note, key))
}

function displayPropertyChips(note: MobileNote, key: string): NoteRowChip[] {
  const normalizedKey = key.trim().toLowerCase()
  if (!normalizedKey) return []
  if (isTypePropertyKey(normalizedKey)) {
    return [{ label: note.type, tone: chipTone(note.typeTone) }]
  }
  if (normalizedKey === 'status') {
    return note.status ? [{ label: note.status, tone: statusTone(note.status) }] : []
  }
  if (normalizedKey === 'tags') {
    return note.tags.map((tag) => ({ label: tag, tone: tagTone(tag) }))
  }

  return relationshipChips(note, normalizedKey) ?? propertyChips(note, normalizedKey)
}

function isTypePropertyKey(normalizedKey: string) {
  return ['type', 'isa', 'is_a'].includes(normalizedKey)
}

function relationshipChips(note: MobileNote, normalizedKey: string): NoteRowChip[] | null {
  const relationship = note.relationships.find((candidate) => {
    return relationshipKeys(candidate).includes(normalizedKey)
  })
  if (!relationship) return null

  return relationship.values.map((value) => ({ label: value.title, tone: chipTone(value.typeTone) }))
}

function relationshipKeys(relationship: MobileNote['relationships'][number]) {
  return [
    relationship.key,
    relationship.label,
    relationship.kind,
    relationship.kind === 'belongsTo' ? 'belongs_to' : null,
    relationship.kind === 'relatedTo' ? 'related_to' : null,
  ].filter((value): value is string => Boolean(value)).map((value) => value.toLowerCase())
}

function propertyChips(note: MobileNote, normalizedKey: string): NoteRowChip[] {
  const property = note.properties?.find((candidate) => candidate.key.toLowerCase() === normalizedKey)
  if (!property) return []

  const values = Array.isArray(property.value) ? property.value : [property.value]
  return values
    .map((value) => String(value).trim())
    .filter(Boolean)
    .map((label) => ({ label, tone: 'gray' }))
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
