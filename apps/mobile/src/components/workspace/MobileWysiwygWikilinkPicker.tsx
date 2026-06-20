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
  mobileWysiwygEmojiPayloadForEntry,
  mobileWysiwygEmojiPickerSuggestions,
  mobileWysiwygSlashCommandPayloadForAction,
  mobileWysiwygSlashCommandPickerSuggestions,
  type MobileWysiwygSlashCommandSuggestion,
  mobileWysiwygWikilinkPayloadForNote,
  mobileWysiwygWikilinkPickerSuggestions,
} from './MobileWysiwygWikilinkPickerModel'
import type {
  NativeWysiwygInlineAutocompleteKind,
  NativeWysiwygMarkdownBlockPayload,
  NativeWysiwygPlainTextPayload,
  NativeWysiwygWikilinkPayload,
} from './MobileWysiwygWikilinkBridgeModel'
import type { NativeWysiwygMarkdownBlockAction } from './MobileWysiwygFormatCommands'

const slashCommandLabelKeys = {
  codeBlock: 'editor.formatting.codeBlock',
  divider: 'editor.formatting.divider',
  mathBlock: 'editor.formatting.mathBlock',
  mermaid: 'editor.formatting.mermaid',
  table: 'editor.formatting.table',
  whiteboard: 'editor.formatting.whiteboard',
} as const satisfies Record<NativeWysiwygMarkdownBlockAction, Parameters<typeof mobileText>[0]>

type MobileWysiwygWikilinkPickerProps = {
  initialQuery?: string
  kind?: NativeWysiwygInlineAutocompleteKind
  notes: MobileNote[]
  onClose: () => void
  onSelectMarkdownBlock: (payload: NativeWysiwygMarkdownBlockPayload) => void
  onSelect: (payload: NativeWysiwygWikilinkPayload) => void
  onSelectEmoji: (payload: NativeWysiwygPlainTextPayload) => void
  sourceNote?: MobileNote | null
}

export function MobileWysiwygWikilinkPicker({
  initialQuery = '',
  kind = 'wikilink',
  notes,
  onClose,
  onSelectMarkdownBlock,
  onSelect,
  onSelectEmoji,
  sourceNote = null,
}: MobileWysiwygWikilinkPickerProps) {
  const [query, setQuery] = useState(initialQuery)
  const suggestions = useMemo(
    () => mobileWysiwygWikilinkPickerSuggestions(notes, query, kind),
    [kind, notes, query],
  )
  const emojiSuggestions = useMemo(
    () => kind === 'emoji' ? mobileWysiwygEmojiPickerSuggestions(query) : [],
    [kind, query],
  )
  const slashCommandSuggestions = useMemo(
    () => kind === 'slashCommand' ? mobileWysiwygSlashCommandPickerSuggestions(query) : [],
    [kind, query],
  )
  const hasSuggestions = pickerHasSuggestions({ emojiSuggestions, kind, slashCommandSuggestions, suggestions })

  return (
    <View style={styles.host} testID="editor-wysiwyg-wikilink-picker">
      <Pressable style={styles.backdrop} testID="editor-wysiwyg-wikilink-backdrop" onPress={onClose} />
      <MobilePanel style={styles.panel}>
        <MobileToolbar testID="editor-wysiwyg-wikilink-toolbar">
          <MobileToolbarTitle title={pickerTitle(kind)} />
          <MobileToolbarSpacer />
          <MobileButton label={mobileText('common.cancel')} variant="ghost" onPress={onClose} />
        </MobileToolbar>
        <View style={styles.content}>
          <MobileTextInput
            autoFocus
            label={pickerSearchLabel(kind)}
            placeholder={pickerSearchPlaceholder(kind)}
            testID="editor-wysiwyg-wikilink-search"
            value={query}
            onChangeText={setQuery}
          />
          <ScrollView contentContainerStyle={styles.suggestionList} keyboardShouldPersistTaps="handled">
            {!hasSuggestions ? (
              <Text style={styles.empty} testID="editor-wysiwyg-wikilink-empty">{pickerEmptyLabel(kind)}</Text>
            ) : null}
            {emojiSuggestions.map((entry) => (
              <MobileListRow
                key={entry.emoji}
                subtitle={entry.group}
                testID={`editor-wysiwyg-emoji-suggestion-${testIdSegment(entry.name)}`}
                title={entry.name}
                trailing={<Text style={styles.emoji}>{entry.emoji}</Text>}
                onPress={() => onSelectEmoji(mobileWysiwygEmojiPayloadForEntry(entry))}
              />
            ))}
            {slashCommandSuggestions.map((suggestion) => (
              <MobileListRow
                key={suggestion.action}
                subtitle={slashCommandSubtitle(suggestion)}
                testID={`editor-wysiwyg-slash-command-${testIdSegment(suggestion.action)}`}
                title={slashCommandLabel(suggestion.action)}
                onPress={() => onSelectMarkdownBlock(mobileWysiwygSlashCommandPayloadForAction(suggestion.action))}
              />
            ))}
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

function pickerTitle(kind: NativeWysiwygInlineAutocompleteKind) {
  if (kind === 'emoji') return mobileText('editor.formatting.emoji')
  if (kind === 'slashCommand') return mobileText('editor.formatting.toolbar')
  return mobileText('editor.formatting.wikilink')
}

function pickerSearchLabel(kind: NativeWysiwygInlineAutocompleteKind) {
  if (kind === 'emoji') return mobileText('editor.formatting.searchEmoji')
  return mobileText('noteList.searchAction')
}

function pickerSearchPlaceholder(kind: NativeWysiwygInlineAutocompleteKind) {
  if (kind === 'emoji') return mobileText('editor.formatting.searchEmojiPlaceholder')
  return mobileText('noteList.searchPlaceholder')
}

function pickerEmptyLabel(kind: NativeWysiwygInlineAutocompleteKind) {
  if (kind === 'emoji') return mobileText('editor.formatting.noMatchingEmoji')
  return mobileText('noteList.empty.noMatching')
}

function pickerHasSuggestions({
  emojiSuggestions,
  kind,
  slashCommandSuggestions,
  suggestions,
}: {
  emojiSuggestions: unknown[]
  kind: NativeWysiwygInlineAutocompleteKind
  slashCommandSuggestions: unknown[]
  suggestions: unknown[]
}) {
  if (kind === 'emoji') return emojiSuggestions.length > 0
  if (kind === 'slashCommand') return slashCommandSuggestions.length > 0
  return suggestions.length > 0
}

function slashCommandLabel(action: NativeWysiwygMarkdownBlockAction): string {
  return mobileText(slashCommandLabelKeys[action])
}

function slashCommandSubtitle(suggestion: MobileWysiwygSlashCommandSuggestion): string {
  return suggestion.keywords.join(', ')
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
  emoji: {
    fontSize: 20,
    lineHeight: 24,
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
