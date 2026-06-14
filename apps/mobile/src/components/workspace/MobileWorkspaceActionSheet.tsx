import type { ReactNode } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Archive, FilePlus, LinkSimple, Star } from 'phosphor-react-native'
import { Text } from '../ui/text'
import { mobileText } from '../../i18n/mobileText'
import { MobileButton } from '../../ui/MobileButton'
import { MobileChip } from '../../ui/MobileChip'
import { MobileListRow } from '../../ui/MobileListRow'
import { MobilePanel, MobileToolbar, MobileToolbarSpacer, MobileToolbarTitle } from '../../ui/MobilePanel'
import { MobileTextInput } from '../../ui/MobileTextInput'
import { desktopPanelParity, desktopToolbarActionParity } from '../../ui/desktopParity'
import { mobileColors, mobileSpace, mobileType } from '../../ui/tokens'
import type { MobileNote } from '../../workspace/mobileWorkspaceModel'
import { MobileTypeIcon } from './MobileWorkspaceIcons'
import { chipTone, statusTone, tagTone } from './mobileWorkspaceTone'

export type MobileWorkspaceAction =
  | 'addProperty'
  | 'addRelationship'
  | 'createNote'
  | 'moreActions'
  | 'search'

type MobileWorkspaceActionSheetProps = {
  action: MobileWorkspaceAction
  createTitle: string
  notes: MobileNote[]
  onClose: () => void
  onCreateNote: () => void
  onCreateTitleChange: (value: string) => void
  onPropertyNameChange: (value: string) => void
  onPropertyValueChange: (value: string) => void
  onRelationshipNameChange: (value: string) => void
  onRelationshipNoteTitleChange: (value: string) => void
  onSaveProperty: () => void
  onSaveRelationship: () => void
  onSearchQueryChange: (value: string) => void
  onSelectNote: (noteId: string) => void
  propertyName: string
  propertyValue: string
  relationshipName: string
  relationshipNoteTitle: string
  searchQuery: string
  selectedNote: MobileNote | null
}

export function MobileWorkspaceActionSheet({
  action,
  createTitle,
  notes,
  onClose,
  onCreateNote,
  onCreateTitleChange,
  onPropertyNameChange,
  onPropertyValueChange,
  onRelationshipNameChange,
  onRelationshipNoteTitleChange,
  onSaveProperty,
  onSaveRelationship,
  onSearchQueryChange,
  onSelectNote,
  propertyName,
  propertyValue,
  relationshipName,
  relationshipNoteTitle,
  searchQuery,
  selectedNote,
}: MobileWorkspaceActionSheetProps) {
  return (
    <View style={styles.overlay} testID="workspace-action-sheet">
      <Pressable accessibilityLabel={mobileText('common.cancel')} style={styles.backdrop} testID="workspace-action-sheet-backdrop" onPress={onClose} />
      <MobilePanel style={styles.sheet} testID={`workspace-action-sheet-${action}`}>
        <MobileToolbar testID="workspace-action-sheet-toolbar">
          <MobileToolbarTitle title={actionTitle(action)} />
          <MobileToolbarSpacer />
          <MobileButton label={mobileText('common.cancel')} variant="ghost" onPress={onClose} />
        </MobileToolbar>
        <ActionContent
          action={action}
          createTitle={createTitle}
          notes={notes}
          onClose={onClose}
          onCreateNote={onCreateNote}
          onCreateTitleChange={onCreateTitleChange}
          onPropertyNameChange={onPropertyNameChange}
          onPropertyValueChange={onPropertyValueChange}
          onRelationshipNameChange={onRelationshipNameChange}
          onRelationshipNoteTitleChange={onRelationshipNoteTitleChange}
          onSaveProperty={onSaveProperty}
          onSaveRelationship={onSaveRelationship}
          onSearchQueryChange={onSearchQueryChange}
          onSelectNote={onSelectNote}
          propertyName={propertyName}
          propertyValue={propertyValue}
          relationshipName={relationshipName}
          relationshipNoteTitle={relationshipNoteTitle}
          searchQuery={searchQuery}
          selectedNote={selectedNote}
        />
      </MobilePanel>
    </View>
  )
}

function ActionContent(props: MobileWorkspaceActionSheetProps) {
  if (props.action === 'search') return <SearchContent {...props} />
  if (props.action === 'createNote') return <CreateNoteContent {...props} />
  if (props.action === 'addProperty') return <AddPropertyContent {...props} />
  if (props.action === 'addRelationship') return <AddRelationshipContent {...props} />
  return <MoreActionsContent note={props.selectedNote} onClose={props.onClose} />
}

function SearchContent({
  notes,
  onClose,
  onSearchQueryChange,
  onSelectNote,
  searchQuery,
}: MobileWorkspaceActionSheetProps) {
  const searchResults = searchNotes(notes, searchQuery)

  return (
    <View style={styles.content}>
      <MobileTextInput
        autoFocus
        label={mobileText('noteList.searchAction')}
        placeholder={mobileText('noteList.searchPlaceholder')}
        testID="workspace-search-input"
        value={searchQuery}
        onChangeText={onSearchQueryChange}
      />
      <ScrollView contentContainerStyle={styles.resultList} keyboardShouldPersistTaps="handled" testID="workspace-search-results">
        {searchResults.length === 0 ? <EmptyState>{mobileText('noteList.empty.noMatching')}</EmptyState> : null}
        {searchResults.map((note) => (
          <MobileListRow
            key={note.id}
            chips={<NoteRowChips note={note} />}
            selected={false}
            subtitle={note.snippet}
            testID={`workspace-search-result-${note.id}`}
            title={note.title}
            trailing={<MobileTypeIcon size={16} tone={note.typeTone} type={note.type} />}
            onPress={() => {
              onSelectNote(note.id)
              onSearchQueryChange('')
              onClose()
            }}
          />
        ))}
      </ScrollView>
    </View>
  )
}

function searchNotes(notes: MobileNote[], query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  const activeNotes = notes.filter((note) => !note.archived)
  if (!normalizedQuery) return activeNotes.slice(0, 16)

  return activeNotes
    .filter((note) => searchText(note).includes(normalizedQuery))
    .slice(0, 16)
}

function searchText(note: MobileNote) {
  return [
    note.title,
    note.snippet,
    note.type,
    note.status,
    note.tags.join(' '),
    note.path ?? '',
  ].join(' ').toLowerCase()
}

function CreateNoteContent({
  createTitle,
  onClose,
  onCreateNote,
  onCreateTitleChange,
}: MobileWorkspaceActionSheetProps) {
  return (
    <View style={styles.content}>
      <MobileTextInput
        autoFocus
        label={mobileText('command.note.newNote')}
        placeholder={mobileText('noteList.createNote')}
        testID="workspace-create-note-title-input"
        value={createTitle}
        onChangeText={onCreateTitleChange}
      />
      <SheetFooter>
        <MobileButton label={mobileText('common.cancel')} variant="ghost" onPress={onClose} />
        <MobileButton disabled={createTitle.trim().length === 0} label={mobileText('common.create')} variant="primary" onPress={onCreateNote} />
      </SheetFooter>
    </View>
  )
}

function AddPropertyContent({
  onClose,
  onPropertyNameChange,
  onPropertyValueChange,
  onSaveProperty,
  propertyName,
  propertyValue,
}: MobileWorkspaceActionSheetProps) {
  return (
    <View style={styles.content}>
      <MobileTextInput
        autoFocus
        label={mobileText('inspector.properties.propertyName')}
        placeholder={mobileText('inspector.properties.propertyName')}
        testID="workspace-property-name-input"
        value={propertyName}
        onChangeText={onPropertyNameChange}
      />
      <MobileTextInput
        label={mobileText('inspector.properties.valuePlaceholder')}
        placeholder={mobileText('inspector.properties.valuePlaceholder')}
        testID="workspace-property-value-input"
        value={propertyValue}
        onChangeText={onPropertyValueChange}
      />
      <SheetFooter>
        <MobileButton label={mobileText('common.cancel')} variant="ghost" onPress={onClose} />
        <MobileButton disabled={propertyName.trim().length === 0} label={mobileText('common.save')} variant="primary" onPress={onSaveProperty} />
      </SheetFooter>
    </View>
  )
}

function AddRelationshipContent({
  notes,
  onClose,
  onRelationshipNameChange,
  onRelationshipNoteTitleChange,
  onSaveRelationship,
  relationshipName,
  relationshipNoteTitle,
}: MobileWorkspaceActionSheetProps) {
  const suggestions = relationshipSuggestions(notes, relationshipNoteTitle)

  return (
    <View style={styles.content}>
      <MobileTextInput
        autoFocus
        label={mobileText('inspector.relationship.name')}
        placeholder={mobileText('inspector.relationship.name')}
        testID="workspace-relationship-name-input"
        value={relationshipName}
        onChangeText={onRelationshipNameChange}
      />
      <MobileTextInput
        label={mobileText('inspector.relationship.noteTitle')}
        placeholder={mobileText('inspector.relationship.noteTitle')}
        testID="workspace-relationship-note-title-input"
        value={relationshipNoteTitle}
        onChangeText={onRelationshipNoteTitleChange}
      />
      {suggestions.length > 0 ? (
        <View style={styles.suggestionList} testID="workspace-relationship-note-suggestions">
          {suggestions.map((note) => (
            <Pressable
              accessibilityLabel={note.title}
              accessibilityRole="button"
              key={note.id}
              style={({ pressed }) => [styles.suggestionRow, pressed ? styles.suggestionRowPressed : null]}
              testID={`workspace-relationship-note-suggestion-${note.id}`}
              onPress={() => onRelationshipNoteTitleChange(note.title)}
            >
              <MobileTypeIcon size={16} tone={note.typeTone} type={note.type} />
              <Text numberOfLines={1} style={styles.suggestionTitle}>{note.title}</Text>
              <MobileChip label={note.type} tone={chipTone(note.typeTone)} />
            </Pressable>
          ))}
        </View>
      ) : null}
      <SheetFooter>
        <MobileButton label={mobileText('common.cancel')} variant="ghost" onPress={onClose} />
        <MobileButton disabled={relationshipName.trim().length === 0 || relationshipNoteTitle.trim().length === 0} label={mobileText('inspector.relationship.add')} variant="primary" onPress={onSaveRelationship} />
      </SheetFooter>
    </View>
  )
}

function MoreActionsContent({
  note,
  onClose,
}: {
  note: MobileNote | null
  onClose: () => void
}) {
  return (
    <View style={styles.content}>
      {note ? <SelectedNoteSummary note={note} /> : null}
      <ActionRow icon={<Archive color={mobileColors.textMuted} size={desktopToolbarActionParity.iconSize} />} label={mobileText('command.note.archiveNote')} onPress={onClose} />
      <ActionRow icon={<LinkSimple color={mobileColors.textMuted} size={desktopToolbarActionParity.iconSize} />} label={mobileText('command.note.copyDeepLink')} onPress={onClose} />
      <ActionRow icon={<FilePlus color={mobileColors.textMuted} size={desktopToolbarActionParity.iconSize} />} label={mobileText('command.note.exportPdf')} onPress={onClose} />
    </View>
  )
}

function SelectedNoteSummary({ note }: { note: MobileNote }) {
  return (
    <View style={styles.summary} testID="workspace-action-sheet-note-summary">
      <MobileTypeIcon size={desktopToolbarActionParity.iconSize} tone={note.typeTone} type={note.type} />
      <Text numberOfLines={1} style={styles.summaryTitle}>{note.title}</Text>
      {note.favorite ? <Star color={mobileColors.primary} size={desktopToolbarActionParity.iconSize} weight="fill" /> : null}
      <MobileChip label={note.type} tone={chipTone(note.typeTone)} />
    </View>
  )
}

function ActionRow({
  icon,
  label,
  onPress,
}: {
  icon: ReactNode
  label: string
  onPress: () => void
}) {
  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" style={({ pressed }) => [styles.actionRow, pressed ? styles.actionRowPressed : null]} onPress={onPress}>
      {icon}
      <Text numberOfLines={1} style={styles.actionText}>{label}</Text>
    </Pressable>
  )
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>{children}</Text>
    </View>
  )
}

function SheetFooter({ children }: { children: ReactNode }) {
  return <View style={styles.footer}>{children}</View>
}

function NoteRowChips({ note }: { note: MobileNote }) {
  return (
    <View style={styles.chipRow}>
      <MobileChip density="list" label={note.type} tone={chipTone(note.typeTone)} />
      {note.status ? <MobileChip density="list" label={note.status} tone={statusTone(note.status)} /> : null}
      {note.tags.slice(0, 1).map((tag) => <MobileChip density="list" key={tag} label={tag} tone={tagTone(tag)} />)}
    </View>
  )
}

function relationshipSuggestions(notes: MobileNote[], query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return []

  return notes
    .filter((note) => !note.archived && [
      note.title,
      note.type,
      note.path ?? '',
      note.tags.join(' '),
    ].join(' ').toLowerCase().includes(normalized))
    .slice(0, 6)
}

function actionTitle(action: MobileWorkspaceAction) {
  if (action === 'search') return mobileText('noteList.searchAction')
  if (action === 'createNote') return mobileText('command.note.newNote')
  if (action === 'addProperty') return mobileText('inspector.properties.addProperty')
  if (action === 'addRelationship') return mobileText('inspector.relationship.addRelationship').replace(/^\+\s*/, '')
  return mobileText('editor.toolbar.moreActions')
}

const styles = StyleSheet.create({
  actionRow: {
    minWidth: 0,
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.sm,
    borderRadius: 4,
    paddingHorizontal: mobileSpace.sm,
    paddingVertical: mobileSpace.sm,
  },
  actionRowPressed: {
    backgroundColor: mobileColors.control,
  },
  actionText: {
    minWidth: 0,
    flex: 1,
    color: mobileColors.text,
    fontSize: mobileType.body,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(55, 53, 47, 0.14)',
  },
  chipRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mobileSpace.xs,
  },
  content: {
    gap: mobileSpace.md,
    padding: mobileSpace.md,
  },
  emptyState: {
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: mobileColors.textMuted,
    fontSize: mobileType.body,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: mobileSpace.sm,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: desktopPanelParity.toolbarHeight + mobileSpace.xl,
    zIndex: 20,
  },
  resultList: {
    borderColor: mobileColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  suggestionList: {
    gap: mobileSpace.xs,
  },
  suggestionRow: {
    minHeight: 34,
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.sm,
    borderRadius: 6,
    paddingHorizontal: mobileSpace.sm,
    paddingVertical: mobileSpace.xs,
  },
  suggestionRowPressed: {
    backgroundColor: mobileColors.graySoft,
  },
  suggestionTitle: {
    minWidth: 0,
    flex: 1,
    color: mobileColors.text,
    fontSize: mobileType.body,
    fontWeight: '500',
  },
  sheet: {
    maxHeight: 620,
    width: 520,
    borderColor: mobileColors.borderStrong,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000000',
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
  },
  summary: {
    minWidth: 0,
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.sm,
    borderBottomColor: mobileColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: mobileSpace.md,
  },
  summaryTitle: {
    minWidth: 0,
    flex: 1,
    color: mobileColors.text,
    fontSize: mobileType.body,
    fontWeight: '500',
  },
})
