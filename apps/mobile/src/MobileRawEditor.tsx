import { useMemo, useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import type { MobileNote } from './mobileNoteProjection'
import { activeMobileWikilinkQuery, insertMobileWikilink, mobileNoteSuggestions } from './mobileWikilinkAutocomplete'
import { styles } from './styles'

export function MobileRawEditor({
  notes,
  note,
  onRawMarkdownChange,
}: {
  notes: MobileNote[]
  note: MobileNote
  onRawMarkdownChange: (markdown: string) => void
}) {
  const [draft, setDraft] = useState(note.content)
  const [cursor, setCursor] = useState(note.content.length)
  const activeQuery = useMemo(() => activeMobileWikilinkQuery({ cursor, markdown: draft }), [cursor, draft])
  const suggestions = useMemo(
    () => activeQuery ? mobileNoteSuggestions({ excludeNoteId: note.id, notes, query: activeQuery.query }) : [],
    [activeQuery, note.id, notes],
  )

  return (
    <View style={styles.rawEditorContent}>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        multiline
        onChangeText={(markdown) => {
          setDraft(markdown)
          onRawMarkdownChange(markdown)
        }}
        onSelectionChange={(event) => setCursor(event.nativeEvent.selection.start)}
        scrollEnabled
        spellCheck={false}
        style={styles.rawEditorInput}
        textAlignVertical="top"
        value={draft}
      />
      {suggestions.length > 0 && activeQuery ? (
        <View style={styles.rawEditorSuggestionMenu}>
          {suggestions.map((suggestion) => (
            <Pressable
              key={suggestion.id}
              onPress={() => {
                const nextDraft = insertMobileWikilink({ markdown: draft, note: suggestion, query: activeQuery })
                setDraft(nextDraft)
                setCursor(activeQuery.start + suggestion.id.length + suggestion.title.length + 5)
                onRawMarkdownChange(nextDraft)
              }}
              style={({ pressed }) => [styles.rawEditorSuggestion, pressed ? styles.pressed : null]}
            >
              <Text style={styles.rawEditorSuggestionTitle}>{suggestion.title}</Text>
              <Text style={styles.rawEditorSuggestionMeta}>{suggestion.id}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  )
}
