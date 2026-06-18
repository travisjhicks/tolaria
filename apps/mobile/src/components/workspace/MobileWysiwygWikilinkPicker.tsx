import { useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Text } from '../ui/text'
import { mobileText } from '../../i18n/mobileText'
import { MobileButton } from '../../ui/MobileButton'
import { MobileChip } from '../../ui/MobileChip'
import { MobileListRow } from '../../ui/MobileListRow'
import { MobilePanel, MobileToolbar, MobileToolbarSpacer, MobileToolbarTitle } from '../../ui/MobilePanel'
import { MobileTextInput } from '../../ui/MobileTextInput'
import { mobileColors, mobileSpace } from '../../ui/tokens'
import type { MobileNote } from '../../workspace/mobileWorkspaceModel'
import { MobileTypeIcon } from './MobileWorkspaceIcons'
import {
  mobileWysiwygWikilinkPayloadForNote,
  mobileWysiwygWikilinkPickerSuggestions,
} from './MobileWysiwygWikilinkPickerModel'
import type {
  NativeWysiwygInlineAutocompleteKind,
  NativeWysiwygWikilinkPayload,
} from './MobileWysiwygWikilinkBridgeModel'

type MobileWysiwygWikilinkPickerProps = {
  initialQuery?: string
  kind?: NativeWysiwygInlineAutocompleteKind
  notes: MobileNote[]
  onClose: () => void
  onSelect: (payload: NativeWysiwygWikilinkPayload) => void
  sourceNote?: MobileNote | null
}

export function MobileWysiwygWikilinkPicker({
  initialQuery = '',
  kind = 'wikilink',
  notes,
  onClose,
  onSelect,
  sourceNote = null,
}: MobileWysiwygWikilinkPickerProps) {
  const [query, setQuery] = useState(initialQuery)
  const suggestions = useMemo(
    () => mobileWysiwygWikilinkPickerSuggestions(notes, query, kind),
    [kind, notes, query],
  )

  return (
    <View style={styles.host} testID="editor-wysiwyg-wikilink-picker">
      <Pressable style={styles.backdrop} testID="editor-wysiwyg-wikilink-backdrop" onPress={onClose} />
      <MobilePanel style={styles.panel}>
        <MobileToolbar testID="editor-wysiwyg-wikilink-toolbar">
          <MobileToolbarTitle title={mobileText('editor.formatting.wikilink')} />
          <MobileToolbarSpacer />
          <MobileButton label={mobileText('common.cancel')} variant="ghost" onPress={onClose} />
        </MobileToolbar>
        <View style={styles.content}>
          <MobileTextInput
            autoFocus
            label={mobileText('noteList.searchAction')}
            placeholder={mobileText('noteList.searchPlaceholder')}
            testID="editor-wysiwyg-wikilink-search"
            value={query}
            onChangeText={setQuery}
          />
          <ScrollView contentContainerStyle={styles.suggestionList} keyboardShouldPersistTaps="handled">
            {suggestions.length === 0 ? (
              <Text style={styles.empty} testID="editor-wysiwyg-wikilink-empty">{mobileText('noteList.empty.noMatching')}</Text>
            ) : null}
            {suggestions.map((note) => (
              <MobileListRow
                chips={<MobileChip label={note.type} tone={note.typeTone} />}
                key={note.id}
                subtitle={note.snippet}
                testID={`editor-wysiwyg-wikilink-suggestion-${testIdSegment(note.id)}`}
                title={note.title}
                trailing={<MobileTypeIcon size={16} tone={note.typeTone} type={note.type} />}
                onPress={() => onSelect(mobileWysiwygWikilinkPayloadForNote(note, sourceNote))}
              />
            ))}
          </ScrollView>
        </View>
      </MobilePanel>
    </View>
  )
}

function testIdSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    gap: mobileSpace.md,
    padding: mobileSpace.md,
  },
  empty: {
    color: mobileColors.textMuted,
    paddingHorizontal: mobileSpace.sm,
    paddingVertical: mobileSpace.md,
  },
  host: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: mobileSpace.md,
  },
  panel: {
    maxHeight: 420,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: mobileColors.text,
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
  },
  suggestionList: {
    gap: 0,
  },
})
