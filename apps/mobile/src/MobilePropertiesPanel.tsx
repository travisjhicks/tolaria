import { CaretLeft } from 'phosphor-react-native'
import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import type { MobileNote } from './demoData'
import { MobileEditablePropertyPickers } from './MobileEditablePropertyPickers'
import type { MobileNotePropertyPatch } from './mobileNoteProperties'
import { nextMobilePropertyPicker, type MobilePropertyPickerKey } from './mobilePropertyPicker'
import { styles } from './styles'
import { colors } from './theme'

export function MobilePropertiesPanel({
  failed = false,
  isSaving = false,
  note,
  onChangeProperties,
  onClose,
}: {
  failed?: boolean
  isSaving?: boolean
  note: MobileNote
  onChangeProperties?: (patch: MobileNotePropertyPatch) => void
  onClose?: () => void
}) {
  const [openPicker, setOpenPicker] = useState<MobilePropertyPickerKey | null>(null)
  const selectPicker = (selected: MobilePropertyPickerKey) => {
    setOpenPicker((current) => nextMobilePropertyPicker({ current, selected }))
  }

  return (
    <View style={styles.properties}>
      <PanelToolbar onClose={onClose} />
      <ScrollView contentContainerStyle={styles.propertiesContent}>
        {failed ? <Text style={styles.propertyError}>Could not save property.</Text> : null}
        <MobileEditablePropertyPickers
          disabled={isSaving}
          note={note}
          openPicker={openPicker}
          onChangeProperties={onChangeProperties}
          onSelectPicker={selectPicker}
        />
        <PropertyRow label="Words" value={String(note.words)} />
        <PropertyRow label="Modified" value={note.modified} />
        <Text style={styles.propertyGroupTitle}>History</Text>
        <Text style={styles.historyItem}>eb373865c - Updated 1 note</Text>
        <Text style={styles.historyItem}>5e853fdfe - Updated 1 note</Text>
      </ScrollView>
    </View>
  )
}

function PanelToolbar({ onClose }: { onClose?: () => void }) {
  return (
    <View style={styles.toolbar}>
      <Text style={styles.propertiesTitle}>Properties</Text>
      <View style={styles.toolbarSpacer} />
      {onClose ? (
        <Pressable onPress={onClose} style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}>
          <CaretLeft size={23} color={colors.textSoft} />
        </Pressable>
      ) : null}
    </View>
  )
}

function PropertyRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <View style={styles.propertyRow}>
      <Text style={styles.propertyLabel}>{label}</Text>
      <Text style={styles.propertyValue}>{value}</Text>
    </View>
  )
}
