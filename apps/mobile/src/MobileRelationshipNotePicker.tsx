import { X } from 'phosphor-react-native'
import { useMemo, useState } from 'react'
import { Modal, Pressable, Text, TextInput, View, type GestureResponderEvent } from 'react-native'
import type { MobileNote } from './mobileNoteProjection'
import { mobileNoteSuggestions } from './mobileWikilinkAutocomplete'
import { styles } from './styles'
import { colors } from './theme'

export function MobileRelationshipNotePicker({
  notes,
  onClose,
  onSelectNote,
  title,
  visible,
}: {
  notes: MobileNote[]
  onClose: () => void
  onSelectNote: (note: MobileNote) => void
  title: string
  visible: boolean
}) {
  const [query, setQuery] = useState('')
  const suggestions = useMemo(
    () => query.trim() ? mobileNoteSuggestions({ notes, query }) : [],
    [notes, query],
  )

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.relationshipPickerOverlay} onPress={onClose}>
        <Pressable style={styles.relationshipPickerPanel} onPress={stopPressPropagation}>
          <View style={styles.relationshipPickerHeader}>
            <Text style={styles.relationshipPickerTitle}>{title}</Text>
            <Pressable onPress={onClose} style={styles.relationshipPickerClose}>
              <X color={colors.textSoft} size={18} />
            </Pressable>
          </View>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            onChangeText={setQuery}
            placeholder="Search notes"
            placeholderTextColor={colors.mutedText}
            style={styles.relationshipPickerInput}
            value={query}
          />
          <View style={styles.relationshipPickerResults}>
            {query.trim() ? null : <Text style={styles.relationshipPickerEmpty}>Type to find a note.</Text>}
            {query.trim() && suggestions.length === 0 ? <Text style={styles.relationshipPickerEmpty}>No matching notes.</Text> : null}
            {suggestions.map((suggestion) => (
              <Pressable
                key={suggestion.id}
                onPress={() => {
                  onSelectNote(suggestion)
                  setQuery('')
                }}
                style={({ pressed }) => [styles.relationshipPickerResult, pressed ? styles.pressed : null]}
              >
                <Text numberOfLines={1} style={styles.relationshipPickerResultTitle}>{suggestion.title}</Text>
                <Text numberOfLines={1} style={styles.relationshipPickerResultMeta}>{suggestion.type}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function stopPressPropagation(event: GestureResponderEvent) {
  event.stopPropagation()
}
