import { CaretLeft, Plus, X } from 'phosphor-react-native'
import { useState, type ReactNode } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import type { MobileNote } from './demoData'
import { mobileDerivedRelationshipGroups } from './mobileDerivedRelationships'
import { MobileEditablePropertyPickers } from './MobileEditablePropertyPickers'
import { MobileRelationshipNotePicker } from './MobileRelationshipNotePicker'
import type { MobileNotePropertyPatch } from './mobileNoteProperties'
import { nextMobilePropertyPicker, type MobilePropertyPickerKey } from './mobilePropertyPicker'
import {
  canonicalMobileRelationshipRef,
  filterMobileRelationshipRef,
  hasMobileRelationshipRef,
  mobileRelationshipDisplayLabel,
  mobileWikilinkForNote,
  resolveMobileRelationshipNote,
  uniqueMobileRelationshipRefs,
} from './mobileRelationshipRefs'
import { mobileRelationshipAppearance } from './mobileTypeAppearance'
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
        <PropertySection title="System">
          <MobileEditablePropertyPickers
            disabled={isSaving}
            note={note}
            openPicker={openPicker}
            onChangeProperties={onChangeProperties}
            onSelectPicker={selectPicker}
          />
        </PropertySection>
        <PropertySection title="Relationships">
          <EditableRelationships note={note} notes={notes} onChangeProperties={onChangeProperties} onOpenNote={onOpenNote} />
          <DerivedRelationships note={note} notes={notes} onOpenNote={onOpenNote} />
        </PropertySection>
        <CustomProperties note={note} onChangeProperties={onChangeProperties} />
        <PropertySection title="Info">
          <BacklinkGroup backlinks={note.backlinks} onOpenNote={onOpenNote} />
          <PropertyRow label="Words" value={String(note.words)} />
          <PropertyRow label="Modified" value={note.modified} />
        </PropertySection>
        <PropertySection title="History">
          <Text style={styles.historyItem}>eb373865c - Updated 1 note</Text>
          <Text style={styles.historyItem}>5e853fdfe - Updated 1 note</Text>
        </PropertySection>
      </ScrollView>
    </View>
  )
}

function PropertySection({
  children,
  title,
}: {
  children: ReactNode
  title: string
}) {
  return (
    <View style={styles.propertySection}>
      <Text style={styles.propertyGroupTitle}>{title}</Text>
      {children}
    </View>
  )
}

function EditableRelationships({
  note,
  notes,
  onChangeProperties,
  onOpenNote,
}: {
  note: MobileNote
  notes: MobileNote[]
  onChangeProperties?: (patch: MobileNotePropertyPatch) => void
  onOpenNote?: (noteId: string) => void
}) {
  return (
    <>
      <RelationshipGroup
        label="Belongs to"
        notes={notes}
        targets={note.belongsTo}
        onChangeTargets={(belongsTo) => onChangeProperties?.({ belongsTo })}
        onOpenNote={onOpenNote}
      />
      <RelationshipGroup
        label="Related to"
        notes={notes}
        targets={[...note.relatedTo, ...note.outgoingLinks]}
        writableTargets={note.relatedTo}
        onChangeTargets={(relatedTo) => onChangeProperties?.({ relatedTo })}
        onOpenNote={onOpenNote}
      />
      <RelationshipGroup
        label="Has"
        notes={notes}
        targets={note.has}
        onChangeTargets={(has) => onChangeProperties?.({ has })}
        onOpenNote={onOpenNote}
      />
      {Object.entries(note.relationships).map(([key, targets]) => (
        <RelationshipGroup
          key={key}
          label={formatRelationshipLabel(key)}
          notes={notes}
          onDeleteGroup={() => onChangeProperties?.({
            relationships: removeRelationshipKey({ key, relationships: note.relationships }),
            removedRelationshipKeys: [key],
          })}
          targets={targets}
          onChangeTargets={(nextTargets) => onChangeProperties?.({
            relationships: { ...note.relationships, [key]: nextTargets },
            removedRelationshipKeys: nextTargets.length === 0 ? [key] : undefined,
          })}
          onOpenNote={onOpenNote}
        />
      ))}
      <AddRelationshipGroup
        note={note}
        notes={notes}
        onAdd={(key, target) => onChangeProperties?.({ relationships: { ...note.relationships, [key]: [target] } })}
      />
    </>
  )
}

function DerivedRelationships({
  note,
  notes,
  onOpenNote,
}: {
  note: MobileNote
  notes: MobileNote[]
  onOpenNote?: (noteId: string) => void
}) {
  const groups = mobileDerivedRelationshipGroups({ note, notes })
  return (
    <>
      {groups.map((group) => (
        <RelationshipGroup
          key={group.label}
          label={group.label}
          notes={notes}
          targets={group.targets}
          onOpenNote={onOpenNote}
        />
      ))}
    </>
  )
}

function RelationshipGroup({
  label,
  notes,
  onChangeTargets,
  onDeleteGroup,
  onOpenNote,
  targets,
  writableTargets = targets,
}: {
  label: string
  notes: MobileNote[]
  onChangeTargets?: (targets: string[]) => void
  onDeleteGroup?: () => void
  onOpenNote?: (noteId: string) => void
  targets: string[]
  writableTargets?: string[]
}) {
  const [isAdding, setIsAdding] = useState(false)
  const uniqueTargets = uniqueMobileRelationshipRefs(targets)
  const addTarget = (selectedNote: MobileNote) => {
    const target = canonicalMobileRelationshipRef({ notes, value: mobileWikilinkForNote(selectedNote) })
    if (!target) return

    onChangeTargets?.(uniqueMobileRelationshipRefs([...writableTargets, target]))
    setIsAdding(false)
  }

  return (
    <View style={styles.relationshipGroup}>
      <RelationshipHeader
        canAdd={Boolean(onChangeTargets)}
        canDelete={Boolean(onDeleteGroup)}
        label={label}
        onAdd={() => setIsAdding(true)}
        onDelete={onDeleteGroup}
      />
      <View style={styles.relationshipChipRow}>
        {uniqueTargets.length === 0 ? <Text style={styles.relationshipEmpty}>None</Text> : null}
        {uniqueTargets.map((target) => (
          <RelationshipChip
            key={target}
            note={resolveMobileRelationshipNote({ notes, target })}
            onRemove={hasMobileRelationshipRef({ target, values: writableTargets }) && onChangeTargets
              ? () => onChangeTargets(filterMobileRelationshipRef({ target, values: writableTargets }))
              : undefined}
            target={target}
            onOpenNote={onOpenNote}
          />
        ))}
      </View>
      <MobileRelationshipNotePicker
        notes={notes}
        title={`Add ${label}`}
        visible={isAdding}
        onClose={() => setIsAdding(false)}
        onSelectNote={addTarget}
      />
    </View>
  )
}

function RelationshipHeader({
  canAdd,
  canDelete,
  label,
  onAdd,
  onDelete,
}: {
  canAdd: boolean
  canDelete: boolean
  label: string
  onAdd: () => void
  onDelete?: () => void
}) {
  return (
    <View style={styles.relationshipHeader}>
      <Text style={styles.propertyGroupTitle}>{label}</Text>
      <View style={styles.relationshipHeaderActions}>
        {canDelete ? (
          <Pressable onPress={onDelete} style={({ pressed }) => [styles.relationshipAddButton, pressed ? styles.pressed : null]}>
            <X color={colors.textSoft} size={14} />
          </Pressable>
        ) : null}
        {canAdd ? (
          <Pressable onPress={onAdd} style={({ pressed }) => [styles.relationshipAddButton, pressed ? styles.pressed : null]}>
            <Plus color={colors.textSoft} size={14} />
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}

function AddRelationshipGroup({
  note,
  notes,
  onAdd,
}: {
  note: MobileNote
  notes: MobileNote[]
  onAdd: (key: string, target: string) => void
}) {
  const [name, setName] = useState('')
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const openTargetPicker = () => {
    const key = relationshipKeyFromLabel(name)
    if (key && !note.relationships[key]) {
      setPendingKey(key)
    }
  }

  return (
    <View style={styles.relationshipGroup}>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={setName}
        onSubmitEditing={openTargetPicker}
        placeholder="+ Add relationship"
        placeholderTextColor={colors.mutedText}
        style={styles.relationshipInput}
        value={name}
      />
      <MobileRelationshipNotePicker
        notes={notes}
        title={`Add ${formatRelationshipLabel(pendingKey ?? 'relationship')}`}
        visible={Boolean(pendingKey)}
        onClose={() => setPendingKey(null)}
        onSelectNote={(targetNote) => {
          if (!pendingKey) return

          onAdd(pendingKey, mobileWikilinkForNote(targetNote))
          setName('')
          setPendingKey(null)
        }}
      />
    </View>
  )
}

function CustomProperties({
  note,
  onChangeProperties,
}: {
  note: MobileNote
  onChangeProperties?: (patch: MobileNotePropertyPatch) => void
}) {
  const entries = Object.entries(note.customProperties)

  return (
    <PropertySection title="Custom properties">
      {entries.length === 0 ? <Text style={styles.relationshipEmpty}>None</Text> : null}
      {entries.map(([key, value]) => (
        <PropertyRow
          key={key}
          label={formatRelationshipLabel(key)}
          value={value}
          onDelete={() => onChangeProperties?.({
            customProperties: removeCustomPropertyKey({ customProperties: note.customProperties, key }),
            removedCustomPropertyKeys: [key],
          })}
        />
      ))}
    </PropertySection>
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
  onRemove,
  target,
}: {
  note?: { id: string; title: string; type?: string }
  onOpenNote?: (noteId: string) => void
  onRemove?: () => void
  target: string
}) {
  const appearance = mobileRelationshipAppearance(note?.type)
  const chip = <Text style={styles.relationshipChipText}>{note?.title ?? mobileRelationshipDisplayLabel(target)}</Text>

  const content = (
    <>
      {chip}
      {onRemove ? (
        <Pressable onPress={onRemove} style={styles.relationshipRemoveButton}>
          <X color={appearance.color} size={12} />
        </Pressable>
      ) : null}
    </>
  )

  return note && onOpenNote ? (
    <Pressable
      onPress={() => onOpenNote(note.id)}
      style={({ pressed }) => [
        styles.relationshipChip,
        { backgroundColor: appearance.backgroundColor, borderColor: appearance.borderColor },
        pressed ? styles.pressed : null,
      ]}
    >
      {content}
    </Pressable>
  ) : (
    <View style={[styles.relationshipChip, { backgroundColor: appearance.backgroundColor, borderColor: appearance.borderColor }]}>{content}</View>
  )
}

function formatRelationshipLabel(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function relationshipKeyFromLabel(label: string) {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
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
  onDelete,
  value,
}: {
  label: string
  onDelete?: () => void
  value: string
}) {
  return (
    <View style={styles.propertyRow}>
      <Text style={styles.propertyLabel}>{label}</Text>
      <Text style={styles.propertyValue}>{value}</Text>
      {onDelete ? (
        <Pressable onPress={onDelete} style={styles.relationshipRemoveButton}>
          <X color={colors.textSoft} size={14} />
        </Pressable>
      ) : null}
    </View>
  )
}

function removeRelationshipKey({
  key,
  relationships,
}: {
  key: string
  relationships: Record<string, string[]>
}) {
  return Object.fromEntries(Object.entries(relationships).filter(([relationshipKey]) => relationshipKey !== key))
}

function removeCustomPropertyKey({
  customProperties,
  key,
}: {
  customProperties: Record<string, string>
  key: string
}) {
  return Object.fromEntries(Object.entries(customProperties).filter(([propertyKey]) => propertyKey !== key))
}
