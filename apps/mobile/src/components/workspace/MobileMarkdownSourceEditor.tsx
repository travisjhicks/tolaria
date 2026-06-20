import { Pressable, StyleSheet, type NativeSyntheticEvent, type TextInputSelectionChangeEventData, View } from 'react-native'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Input } from '../ui/input'
import { Text } from '../ui/text'
import { MobileChip } from '../../ui/MobileChip'
import { desktopEditorParity } from '../../ui/desktopParity'
import { mobileColors, mobileRadius, mobileSpace, mobileType } from '../../ui/tokens'
import {
  activeMobileEmojiShortcodeQuery,
  activeMobilePersonMentionQuery,
  activeMobileWikilinkQuery,
  mobilePersonMentionAutocompleteSuggestions,
  mobileWikilinkAutocompleteSuggestions,
  mobileWikilinkAutocompleteTarget,
  replaceActiveMobileEmojiShortcodeQuery,
  replaceActiveMobilePersonMentionQuery,
  replaceActiveMobileWikilinkQuery,
} from '../../workspace/mobileWikilinkAutocomplete'
import {
  applyMobileMarkdownFormat,
  insertMobileMarkdownPlainText,
  insertMobileMarkdownText,
  type MobileMarkdownFormatAction,
} from '../../workspace/mobileMarkdownFormatting'
import { readMobileClipboardText } from '../../workspace/mobileClipboard'
import {
  mobileAttachmentMarkdown,
  type MobileAttachmentImport,
} from '../../workspace/mobileAttachments'
import {
  useRegisteredMobileEditorCommands,
  type RegisterMobileEditorCommands,
} from '../../workspace/mobileEditorCommands'
import {
  mobileMarkdownSelectionAfterTextChange,
  type MobileMarkdownTextSelection,
} from '../../workspace/mobileMarkdownSourceSelection'
import { mobileNoteEditableContent } from '../../workspace/mobileDocumentContent'
import {
  commitMobileEditorDraft,
  createMobileEditorDraft,
  editMobileEditorDraft,
  mobileEditorDraftCommitDelayMs,
  mobileEditorDraftNeedsCommit,
  syncMobileEditorDraft,
  type MobileEditorDraftState,
} from '../../workspace/mobileEditorDraft'
import type { MobileEditorBlock, MobileNote } from '../../workspace/mobileWorkspaceModel'
import { nativeSourceSelectionProof } from '../../qa/nativeSourceSelectionProbe'
import { nativeSourceSelectionLogLine } from '../../qa/nativeSourceSelectionLog'
import { MobileMarkdownFormattingToolbar } from './MobileMarkdownFormattingToolbar'
import { mobileWysiwygEmojiPickerSuggestions } from './MobileWysiwygWikilinkPickerModel'

export type MobileMarkdownSourceEditorProps = {
  blocks: MobileEditorBlock[]
  bullets: string[]
  compact: boolean
  note: MobileNote
  notes: MobileNote[]
  onImportAttachment?: () => Promise<MobileAttachmentImport | null>
  onRegisterEditorCommands?: RegisterMobileEditorCommands
  onUpdateContent: (noteId: string, content: string) => void
  idleSave?: boolean
  plainText?: boolean
  sourceSelectionProbe?: boolean
}

type InlineAutocompleteKind = 'emoji' | 'personMention' | 'wikilink'
type MarkdownInlineAutocompleteSuggestion = {
  chipLabel: string
  emoji?: string
  id: string
  note?: MobileNote
  title: string
}
type TimerHandle = ReturnType<typeof setTimeout>

export function MobileMarkdownSourceEditor(props: MobileMarkdownSourceEditorProps) {
  const {
    blocks,
    bullets,
    compact,
    note,
    notes,
    onImportAttachment,
    onRegisterEditorCommands,
    onUpdateContent,
    idleSave = true,
    plainText = false,
    sourceSelectionProbe = false,
  } = props

  if (plainText) {
    return (
      <MobilePlainTextSourceEditor
        compact={compact}
        note={note}
        onRegisterEditorCommands={onRegisterEditorCommands}
        onUpdateContent={onUpdateContent}
        idleSave={idleSave}
        sourceSelectionProbe={sourceSelectionProbe}
      />
    )
  }

  return (
    <MarkdownSourceEditor
      blocks={blocks}
      bullets={bullets}
      compact={compact}
      note={note}
      notes={notes}
      onImportAttachment={onImportAttachment}
      onRegisterEditorCommands={onRegisterEditorCommands}
      onUpdateContent={onUpdateContent}
      idleSave={idleSave}
      sourceSelectionProbe={sourceSelectionProbe}
    />
  )
}

function MarkdownSourceEditor(props: Omit<MobileMarkdownSourceEditorProps, 'plainText'>) {
  const {
    blocks,
    bullets,
    compact,
    note,
    notes,
    onImportAttachment,
    onRegisterEditorCommands,
    onUpdateContent,
    idleSave,
    sourceSelectionProbe,
  } = props

  const sourceContent = mobileNoteEditableContent({
    ...note,
    editorBlocks: note.editorBlocks ?? blocks,
    editorBullets: bullets,
  })
  const editorDraft = useMobileSourceEditorDraft({
    noteId: note.id,
    idleSave,
    onCommit: onUpdateContent,
    sourceContent,
  })
  const autocomplete = useMarkdownInlineAutocomplete({
    content: editorDraft.content,
    noteId: note.id,
    notes,
    onImportAttachment,
    sourceNote: note,
    onUpdateContent: editorDraft.updateContent,
  })
  useRegisteredMobileEditorCommands(onRegisterEditorCommands, {
    pastePlainText: () => {
      void autocomplete.applyFormat('pastePlainText')
    },
    save: editorDraft.save,
  })
  useNativeSourceSelectionProbe(sourceSelectionProbe === true)

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
        value={editorDraft.content}
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
              <MobileChip label={suggestion.chipLabel} tone="gray" />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  )
}

function MobilePlainTextSourceEditor({
  compact,
  note,
  onRegisterEditorCommands,
  onUpdateContent,
  idleSave,
  sourceSelectionProbe,
}: Pick<MobileMarkdownSourceEditorProps, 'compact' | 'idleSave' | 'note' | 'onRegisterEditorCommands' | 'onUpdateContent' | 'sourceSelectionProbe'>) {
  const editorDraft = useMobileSourceEditorDraft({
    noteId: note.id,
    idleSave,
    onCommit: onUpdateContent,
    sourceContent: note.rawContent ?? '',
  })
  useRegisteredMobileEditorCommands(onRegisterEditorCommands, {
    save: editorDraft.save,
  })
  useNativeSourceSelectionProbe(sourceSelectionProbe === true)

  return (
    <View style={editorStyles.container} testID="editor-text-file-form">
      <Input
        multiline
        scrollEnabled
        placeholderTextColor={mobileColors.textFaint}
        style={[editorStyles.input, compact ? editorStyles.inputCompact : null]}
        testID="editor-text-file-input"
        textAlignVertical="top"
        value={editorDraft.content}
        onChangeText={(nextContent) => editorDraft.updateContent(note.id, nextContent)}
      />
    </View>
  )
}

function useMobileSourceEditorDraft({
  idleSave = true,
  noteId,
  onCommit,
  sourceContent,
}: {
  idleSave?: boolean
  noteId: string
  onCommit: (noteId: string, content: string) => void
  sourceContent: string
}) {
  const commitTimerRef = useRef<TimerHandle | null>(null)
  const onCommitRef = useRef(onCommit)
  const [draft, setDraft] = useState(() => createMobileEditorDraft(noteId, sourceContent))
  const draftRef = useRef<MobileEditorDraftState>(draft)

  useEffect(() => {
    onCommitRef.current = onCommit
  }, [onCommit])
  useEffect(() => {
    draftRef.current = draft
  }, [draft])

  const clearScheduledCommit = useCallback(() => {
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current)
    commitTimerRef.current = null
  }, [])
  const flushDraft = useCallback((updateState: boolean) => {
    clearScheduledCommit()
    const current = draftRef.current
    if (!mobileEditorDraftNeedsCommit(current)) return

    onCommitRef.current(current.noteId, current.draftContent)
    const committed = commitMobileEditorDraft(current)
    draftRef.current = committed
    if (updateState) setDraft(committed)
  }, [clearScheduledCommit])
  const commitDraft = useCallback(() => flushDraft(true), [flushDraft])
  const scheduleCommit = useCallback(() => {
    clearScheduledCommit()
    commitTimerRef.current = setTimeout(commitDraft, mobileEditorDraftCommitDelayMs)
  }, [clearScheduledCommit, commitDraft])
  const updateContent = useCallback((_noteId: string, nextContent: string) => {
    const nextDraft = editMobileEditorDraft(draftRef.current, nextContent)
    draftRef.current = nextDraft
    setDraft(nextDraft)
    if (mobileEditorDraftNeedsCommit(nextDraft) && idleSave) scheduleCommit()
    else clearScheduledCommit()
  }, [clearScheduledCommit, idleSave, scheduleCommit])

  useEffect(() => {
    setDraft((current) => {
      const nextDraft = syncMobileEditorDraft(current, { content: sourceContent, noteId })
      draftRef.current = nextDraft
      return nextDraft
    })
  }, [noteId, sourceContent])
  useEffect(() => () => {
    flushDraft(false)
  }, [flushDraft])

  return {
    content: draft.draftContent,
    save: commitDraft,
    updateContent,
  }
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
  onImportAttachment,
  sourceNote,
  onUpdateContent,
}: {
  content: string
  noteId: string
  notes: MobileNote[]
  onImportAttachment?: () => Promise<MobileAttachmentImport | null>
  sourceNote: MobileNote
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
  const applyFormat = useCallback(async (action: MobileMarkdownFormatAction) => {
    if (action === 'pastePlainText') {
      const text = await readMobileClipboardText()
      if (!text) return

      const result = insertMobileMarkdownPlainText({
        selection,
        text: content,
        value: text,
      })
      onUpdateContent(noteId, result.text)
      setSelection(result.selection)
      setControlledSelection(result.selection)
      return
    }

    if (action === 'attachment') {
      const attachment = await onImportAttachment?.()
      if (!attachment) return

      const result = insertMobileMarkdownText({
        selection,
        text: content,
        value: mobileAttachmentMarkdown(attachment),
      })
      onUpdateContent(noteId, result.text)
      setSelection(result.selection)
      setControlledSelection(result.selection)
      return
    }

    const result = applyMobileMarkdownFormat(content, selection, action)
    onUpdateContent(noteId, result.text)
    setSelection(result.selection)
    setControlledSelection(result.selection)
  }, [content, noteId, onImportAttachment, onUpdateContent, selection])
  const insertSuggestion = useCallback((suggestion: MarkdownInlineAutocompleteSuggestion) => {
    const replacement = markdownInlineAutocompleteReplacement({
      content,
      cursor: selection.start,
      kind: state.kind,
      sourceNote,
      suggestion,
    })
    if (!replacement) return

    const nextSelection = { end: replacement.cursor, start: replacement.cursor }
    onUpdateContent(noteId, replacement.text)
    setSelection(nextSelection)
    setControlledSelection(nextSelection)
  }, [content, noteId, onUpdateContent, selection.start, sourceNote, state.kind])

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
      suggestions: noteAutocompleteSuggestions(mobileWikilinkAutocompleteSuggestions(notes, wikilinkMatch.query)),
    }
  }

  const personMentionMatch = activeMobilePersonMentionQuery(content, cursor)
  if (personMentionMatch) {
    return {
      kind: 'personMention' as const,
      suggestions: noteAutocompleteSuggestions(mobilePersonMentionAutocompleteSuggestions(notes, personMentionMatch.query)),
    }
  }

  const emojiMatch = activeMobileEmojiShortcodeQuery(content, cursor)
  return {
    kind: emojiMatch ? 'emoji' as const : null,
    suggestions: emojiMatch ? emojiAutocompleteSuggestions(emojiMatch.query) : [],
  }
}

function markdownInlineAutocompleteReplacement({
  content,
  cursor,
  kind,
  sourceNote,
  suggestion,
}: {
  content: string
  cursor: number
  kind: InlineAutocompleteKind | null
  sourceNote: MobileNote
  suggestion: MarkdownInlineAutocompleteSuggestion
}) {
  if (kind === null) return null
  if (kind === 'emoji') {
    return suggestion.emoji
      ? replaceActiveMobileEmojiShortcodeQuery(content, cursor, suggestion.emoji)
      : null
  }
  if (!suggestion.note) return null

  const target = mobileWikilinkAutocompleteTarget(suggestion.note, sourceNote)
  return kind === 'personMention'
    ? replaceActiveMobilePersonMentionQuery(content, cursor, target)
    : replaceActiveMobileWikilinkQuery(content, cursor, target)
}

function hasActiveInlineAutocomplete(text: string, cursor: number): boolean {
  if (activeMobileWikilinkQuery(text, cursor)) return true
  if (activeMobilePersonMentionQuery(text, cursor)) return true
  return activeMobileEmojiShortcodeQuery(text, cursor) !== null
}

function textStartSelection(): MobileMarkdownTextSelection {
  return { end: 0, start: 0 }
}

function inlineAutocompleteTestId(kind: InlineAutocompleteKind | null): string {
  if (kind === 'emoji') return 'editor-emoji-suggestions'
  return kind === 'personMention' ? 'editor-person-mention-suggestions' : 'editor-wikilink-suggestions'
}

function inlineAutocompleteRowTestIdPrefix(kind: InlineAutocompleteKind | null): string {
  if (kind === 'emoji') return 'editor-emoji-suggestion'
  return kind === 'personMention' ? 'editor-person-mention-suggestion' : 'editor-wikilink-suggestion'
}

function noteAutocompleteSuggestions(notes: MobileNote[]): MarkdownInlineAutocompleteSuggestion[] {
  return notes.map((note) => ({
    chipLabel: note.type,
    id: note.id,
    note,
    title: note.title,
  }))
}

function emojiAutocompleteSuggestions(query: string): MarkdownInlineAutocompleteSuggestion[] {
  return mobileWysiwygEmojiPickerSuggestions(query).map((entry) => ({
    chipLabel: entry.emoji,
    emoji: entry.emoji,
    id: entry.name,
    title: entry.name,
  }))
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
