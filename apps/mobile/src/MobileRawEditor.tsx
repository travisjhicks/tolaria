import { useState } from 'react'
import { TextInput, View } from 'react-native'
import type { MobileNote } from './mobileNoteProjection'
import { styles } from './styles'

export function MobileRawEditor({
  note,
  onRawMarkdownChange,
}: {
  note: MobileNote
  onRawMarkdownChange: (markdown: string) => void
}) {
  const [draft, setDraft] = useState(note.content)

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
        scrollEnabled
        spellCheck={false}
        style={styles.rawEditorInput}
        textAlignVertical="top"
        value={draft}
      />
    </View>
  )
}
