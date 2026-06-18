import { Pressable, StyleSheet, type NativeSyntheticEvent, type TextInputSelectionChangeEventData, View } from 'react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Input } from '../ui/input'
import { Text } from '../ui/text'
import { MobileChip } from '../../ui/MobileChip'
import { desktopEditorParity } from '../../ui/desktopParity'
import { mobileColors, mobileRadius, mobileSpace, mobileType } from '../../ui/tokens'
import {
  activeMobilePersonMentionQuery,
  activeMobileWikilinkQuery,
  mobilePersonMentionAutocompleteSuggestions,
  mobileWikilinkAutocompleteSuggestions,
  mobileWikilinkAutocompleteTarget,
  replaceActiveMobilePersonMentionQuery,
  replaceActiveMobileWikilinkQuery,
} from '../../workspace/mobileWikilinkAutocomplete'
import {
  applyMobileMarkdownFormat,
  type MobileMarkdownFormatAction,
} from '../../workspace/mobileMarkdownFormatting'
import {
  mobileMarkdownSelectionAfterTextChange,
  type MobileMarkdownTextSelection,
} from '../../workspace/mobileMarkdownSourceSelection'
import { mobileNoteEditableContent } from '../../workspace/mobileDocumentContent'
import type { MobileEditorBlock, MobileNote } from '../../workspace/mobileWorkspaceModel'
import { nativeSourceSelectionProof } from '../../qa/nativeSourceSelectionProbe'
import { nativeSourceSelectionLogLine } from '../../qa/nativeSourceSelectionLog'
import { MobileMarkdownFormattingToolbar } from './MobileMarkdownFormattingToolbar'

export type MobileMarkdownSourceEditorProps = {
  blocks: MobileEditorBlock[]
  bullets: string[]
  compact: boolean
  note: MobileNote
  notes: MobileNote[]
  onUpdateContent: (noteId: string, content: string) => void
  sourceSelectionProbe?: boolean
}

type InlineAutocompleteKind = 'personMention' | 'wikilink'

export function MobileMarkdownSourceEditor({
  blocks,
  bullets,
  compact,
  note,
  notes,
  onUpdateContent,
  sourceSelectionProbe = false,
}: MobileMarkdownSourceEditorProps) {
  const content = mobileNoteEditableContent({
    ...note,
    editorBlocks: note.editorBlocks ?? blocks,
    editorBullets: bullets,
  })
  const autocomplete = useMarkdownInlineAutocomplete({
    content,
    noteId: note.id,
    notes,
    onUpdateContent,
  })
  useNativeSourceSelectionProbe(sourceSelectionProbe)

  return (
    <View style={editorStyles.container} testID="editor-markdown-form">
      <MobileMarkdownFormattingToolbar onFormat={autocomplete.applyFormat} />
      <Input
        multiline
        scrollEnabled
        placeholderTextColor={mobileColors.textFaint}
        style={[editorStyles.input, compact ? editorStyles.inputCompact : null]}
        testID="editor-markdown-input"
        textAlignVertical="top"
        value={content}
        selection={autocomplete.controlledSelection}
        onChangeText={autocomplete.handleMarkdownChange}
        onSelectionChange={autocomplete.handleSelectionChange}
      />
      {autocomplete.suggestions.length > 0 ? (
        <View style={editorStyles.suggestions} testID={autocomplete.suggestionsTestId}>
          {autocomplete.suggestions.map((suggestion) => (
            <Pressable
              accessibilityLabel={suggestion.title}
              accessibilityRole="button"
              key={suggestion.id}
              style={({ pressed }) => [editorStyles.suggestionRow, pressed ? editorStyles.suggestionRowPressed : null]}
              testID={`${autocomplete.rowTestIdPrefix}-${testIdSegment(suggestion.id)}`}
              onPress={() => autocomplete.insertSuggestion(suggestion)}
            >
              <Text numberOfLines={1} style={editorStyles.suggestionTitle}>{suggestion.title}</Text>
              <MobileChip label={suggestion.type} tone="gray" />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  )
}

function useNativeSourceSelectionProbe(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return undefined

    const timer = setTimeout(() => {
      console.info(nativeSourceSelectionLogLine(nativeSourceSelectionProof()))
    }, 250)

    return () => clearTimeout(timer)
  }, [enabled])
}

function useMarkdownInlineAutocomplete({
  content,
  noteId,
  notes,
  onUpdateContent,
}: {
  content: string
  noteId: string
  notes: MobileNote[]
  onUpdateContent: (noteId: string, content: string) => void
}) {
  const [selection, setSelection] = useState<MobileMarkdownTextSelection>(textStartSelection())
  const [controlledSelection, setControlledSelection] = useState<MobileMarkdownTextSelection | undefined>(textStartSelection())
  const state = useMemo(() => markdownInlineAutocompleteState(content, selection.start, notes), [content, notes, selection.start])

  const handleSelectionChange = useCallback((event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
    setSelection(event.nativeEvent.selection)
    setControlledSelection(undefined)
  }, [])
  const handleMarkdownChange = useCallback((nextContent: string) => {
    onUpdateContent(noteId, nextContent)
    const nextSelection = mobileMarkdownSelectionAfterTextChange(content, nextContent, selection)
    const activeAutocomplete = hasActiveInlineAutocomplete(nextContent, nextSelection.start)
    setSelection(nextSelection)
    setControlledSelection(activeAutocomplete ? nextSelection : undefined)
  }, [content, noteId, onUpdateContent, selection])
  const applyFormat = useCallback((action: MobileMarkdownFormatAction) => {
    const result = applyMobileMarkdownFormat(content, selection, action)
    onUpdateContent(noteId, result.text)
    setSelection(result.selection)
    setControlledSelection(result.selection)
  }, [content, noteId, onUpdateContent, selection])
  const insertSuggestion = useCallback((suggestion: MobileNote) => {
    const replacement = markdownInlineAutocompleteReplacement(content, selection.start, state.kind, suggestion)
    if (!replacement) return

    const nextSelection = { end: replacement.cursor, start: replacement.cursor }
    onUpdateContent(noteId, replacement.text)
    setSelection(nextSelection)
    setControlledSelection(nextSelection)
  }, [content, noteId, onUpdateContent, selection.start, state.kind])

  return {
    applyFormat,
    controlledSelection,
    handleMarkdownChange,
    handleSelectionChange,
    insertSuggestion,
    rowTestIdPrefix: inlineAutocompleteRowTestIdPrefix(state.kind),
    suggestions: state.suggestions,
    suggestionsTestId: inlineAutocompleteTestId(state.kind),
  }
}

function markdownInlineAutocompleteState(
  content: string,
  cursor: number,
  notes: MobileNote[],
) {
  const wikilinkMatch = activeMobileWikilinkQuery(content, cursor)
  if (wikilinkMatch) {
    return {
      kind: 'wikilink' as const,
      suggestions: mobileWikilinkAutocompleteSuggestions(notes, wikilinkMatch.query),
    }
  }

  const personMentionMatch = activeMobilePersonMentionQuery(content, cursor)
  return {
    kind: personMentionMatch ? 'personMention' as const : null,
    suggestions: personMentionMatch ? mobilePersonMentionAutocompleteSuggestions(notes, personMentionMatch.query) : [],
  }
}

function markdownInlineAutocompleteReplacement(
  content: string,
  cursor: number,
  kind: InlineAutocompleteKind | null,
  suggestion: MobileNote,
) {
  if (kind === null) return null

  const target = mobileWikilinkAutocompleteTarget(suggestion)
  return kind === 'personMention'
    ? replaceActiveMobilePersonMentionQuery(content, cursor, target)
    : replaceActiveMobileWikilinkQuery(content, cursor, target)
}

function hasActiveInlineAutocomplete(text: string, cursor: number): boolean {
  if (activeMobileWikilinkQuery(text, cursor)) return true
  return activeMobilePersonMentionQuery(text, cursor) !== null
}

function textStartSelection(): MobileMarkdownTextSelection {
  return { end: 0, start: 0 }
}

function inlineAutocompleteTestId(kind: InlineAutocompleteKind | null): string {
  return kind === 'personMention' ? 'editor-person-mention-suggestions' : 'editor-wikilink-suggestions'
}

function inlineAutocompleteRowTestIdPrefix(kind: InlineAutocompleteKind | null): string {
  return kind === 'personMention' ? 'editor-person-mention-suggestion' : 'editor-wikilink-suggestion'
}

function testIdSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const editorStyles = StyleSheet.create({
  container: {
    gap: mobileSpace.md,
  },
  input: {
    minHeight: 420,
    borderColor: mobileColors.borderStrong,
    borderRadius: mobileRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    color: mobileColors.text,
    fontFamily: 'Menlo',
    fontSize: desktopEditorParity.bodyFontSize,
    lineHeight: desktopEditorParity.bodyLineHeight,
    paddingHorizontal: mobileSpace.md,
    paddingVertical: mobileSpace.md,
  },
  inputCompact: {
    minHeight: 360,
  },
  suggestionRow: {
    minHeight: 32,
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
  suggestions: {
    gap: mobileSpace.xs,
  },
  suggestionTitle: {
    minWidth: 0,
    flex: 1,
    color: mobileColors.text,
    fontSize: mobileType.body,
    fontWeight: '500',
  },
})
