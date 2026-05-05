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
  notes = [],
  note,
  onChangeProperties,
  onClose,
  onOpenNote,
}: {
  failed?: boolean
  isSaving?: boolean
  notes?: MobileNote[]
  note: MobileNote
  onChangeProperties?: (patch: MobileNotePropertyPatch) => void
  onClose?: () => void
  onOpenNote?: (noteId: string) => void
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
        <RelationshipGroup label="Belongs to" notes={notes} targets={note.belongsTo} onOpenNote={onOpenNote} />
        <RelationshipGroup label="Related to" notes={notes} targets={[...note.relatedTo, ...note.outgoingLinks]} onOpenNote={onOpenNote} />
        <RelationshipGroup label="Has" notes={notes} targets={note.has} onOpenNote={onOpenNote} />
        <BacklinkGroup backlinks={note.backlinks} onOpenNote={onOpenNote} />
        <PropertyRow label="Words" value={String(note.words)} />
        <PropertyRow label="Modified" value={note.modified} />
        <Text style={styles.propertyGroupTitle}>History</Text>
        <Text style={styles.historyItem}>eb373865c - Updated 1 note</Text>
        <Text style={styles.historyItem}>5e853fdfe - Updated 1 note</Text>
      </ScrollView>
    </View>
  )
}

function RelationshipGroup({
  label,
  notes,
  onOpenNote,
  targets,
}: {
  label: string
  notes: MobileNote[]
  onOpenNote?: (noteId: string) => void
  targets: string[]
}) {
  const uniqueTargets = [...new Set(targets)]
  if (uniqueTargets.length === 0) {
    return null
  }

  return (
    <View style={styles.relationshipGroup}>
      <Text style={styles.propertyGroupTitle}>{label}</Text>
      <View style={styles.relationshipChipRow}>
        {uniqueTargets.map((target) => (
          <RelationshipChip
            key={target}
            note={findRelationshipNote({ notes, target })}
            target={target}
            onOpenNote={onOpenNote}
          />
        ))}
      </View>
    </View>
  )
}

function BacklinkGroup({
  backlinks,
  onOpenNote,
}: {
  backlinks: MobileNote['backlinks']
  onOpenNote?: (noteId: string) => void
}) {
  if (backlinks.length === 0) {
    return null
  }

  return (
    <View style={styles.relationshipGroup}>
      <Text style={styles.propertyGroupTitle}>Linked from</Text>
      <View style={styles.relationshipChipRow}>
        {backlinks.map((backlink) => (
          <RelationshipChip
            key={backlink.id}
            note={backlink}
            target={backlink.title}
            onOpenNote={onOpenNote}
          />
        ))}
      </View>
    </View>
  )
}

function RelationshipChip({
  note,
  onOpenNote,
  target,
}: {
  note?: { id: string; title: string }
  onOpenNote?: (noteId: string) => void
  target: string
}) {
  const chip = <Text style={styles.relationshipChipText}>{note?.title ?? target}</Text>

  return note && onOpenNote ? (
    <Pressable
      onPress={() => onOpenNote(note.id)}
      style={({ pressed }) => [styles.relationshipChip, pressed ? styles.pressed : null]}
    >
      {chip}
    </Pressable>
  ) : (
    <View style={styles.relationshipChip}>{chip}</View>
  )
}

function findRelationshipNote({
  notes,
  target,
}: {
  notes: MobileNote[]
  target: string
}) {
  const normalizedTarget = normalizeRelationshipTarget(target)
  return notes.find((note) => normalizeRelationshipTarget(note.id) === normalizedTarget || normalizeRelationshipTarget(note.title) === normalizedTarget)
}

function normalizeRelationshipTarget(target: string) {
  return target.trim().toLowerCase()
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
