import { CaretDown, CaretRight } from 'phosphor-react-native'
import { useState, type ReactNode } from 'react'
import { Pressable, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native'
import type { MobileNote } from './demoData'
import { NamedIcon, type IconName } from './NamedIcon'
import {
  formatMobileNoteTags,
  isMobileNotePropertySelected,
  mobileNoteIconOptions,
  mobileNoteStatusOptions,
  mobileNoteTagOptions,
  mobileNoteTypeOptions,
  parseMobileNoteTags,
  toggleMobileNoteTag,
  type MobileNotePropertyPatch,
} from './mobileNoteProperties'
import { mobilePropertyDisplayValue, type MobilePropertyPickerKey } from './mobilePropertyPicker'
import { styles } from './styles'
import { colors } from './theme'

export function MobileEditablePropertyPickers({
  disabled,
  note,
  onChangeProperties,
  onSelectPicker,
  openPicker,
}: {
  disabled: boolean
  note: MobileNote
  onChangeProperties?: (patch: MobileNotePropertyPatch) => void
  onSelectPicker: (selected: MobilePropertyPickerKey) => void
  openPicker: MobilePropertyPickerKey | null
}) {
  const today = formatMobilePropertyDate(new Date())

  return (
    <>
      <EditableTextProperty
        disabled={disabled}
        isOpen={openPicker === 'type'}
        key={`type:${note.id}:${note.type}`}
        label="Type"
        placeholder="Type"
        suggestions={mobileNoteTypeOptions}
        value={note.type}
        onCommit={(type) => onChangeProperties?.({ type })}
        onOpen={() => onSelectPicker('type')}
        variant="combo"
      />
      <EditableTextProperty
        disabled={disabled}
        isOpen={openPicker === 'status'}
        key={`status:${note.id}:${note.status ?? ''}`}
        label="Status"
        placeholder="Status"
        suggestions={mobileNoteStatusOptions}
        value={note.status ?? ''}
        onCommit={(status) => onChangeProperties?.({ status })}
        onOpen={() => onSelectPicker('status')}
      />
      <EditableTextProperty
        disabled={disabled}
        isOpen={openPicker === 'date'}
        key={`date:${note.id}:${note.date}`}
        label="Date"
        placeholder="Date"
        suggestions={[today, '']}
        value={note.date}
        onCommit={(date) => onChangeProperties?.({ date })}
        onOpen={() => onSelectPicker('date')}
      />
      <IconProperty
        disabled={disabled}
        isOpen={openPicker === 'icon'}
        note={note}
        onChangeProperties={onChangeProperties}
        onOpen={() => onSelectPicker('icon')}
      />
      <TagsProperty
        disabled={disabled}
        isOpen={openPicker === 'tags'}
        key={`tags:${note.id}:${formatMobileNoteTags(note.tags)}`}
        note={note}
        onChangeProperties={onChangeProperties}
        onOpen={() => onSelectPicker('tags')}
      />
    </>
  )
}

function EditableTextProperty({
  disabled,
  isOpen,
  label,
  onCommit,
  onOpen,
  placeholder,
  suggestions,
  value,
  variant = 'chips',
}: {
  disabled: boolean
  isOpen: boolean
  label: string
  onCommit: (value: string) => void
  onOpen: () => void
  placeholder: string
  suggestions: readonly string[]
  value: string
  variant?: 'chips' | 'combo'
}) {
  const [draft, setDraft] = useState(value)
  const commitDraft = () => commitTextValue({ current: value, next: draft, onCommit })

  return (
    <PropertyPickerSection
      disabled={disabled}
      isOpen={isOpen}
      label={label}
      value={mobilePropertyDisplayValue({ value })}
      onOpen={onOpen}
    >
      <View style={styles.propertyPickerOptions}>
        <TextInput
          autoCapitalize="sentences"
          editable={!disabled}
          keyboardType="default"
          onBlur={commitDraft}
          onChangeText={setDraft}
          onSubmitEditing={commitDraft}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedText}
          returnKeyType="done"
          style={styles.propertyTextInput}
          value={draft}
        />
        {variant === 'combo'
          ? (
            <PropertyComboOptions
              disabled={disabled}
              suggestions={suggestions}
              value={value}
              onSelect={(selected) => {
                setDraft(selected)
                onCommit(selected)
              }}
            />
          )
          : (
            <PropertyChipOptions>
              {suggestions.map((option) => (
                <PropertyTextChip
                  disabled={disabled}
                  key={option || 'none'}
                  option={option}
                  value={value}
                  onSelect={(selected) => {
                    setDraft(selected)
                    onCommit(selected)
                  }}
                />
              ))}
            </PropertyChipOptions>
          )}
      </View>
    </PropertyPickerSection>
  )
}

function IconProperty({
  disabled,
  isOpen,
  note,
  onChangeProperties,
  onOpen,
}: {
  disabled: boolean
  isOpen: boolean
  note: MobileNote
  onChangeProperties?: (patch: MobileNotePropertyPatch) => void
  onOpen: () => void
}) {
  return (
    <PropertyPickerSection
      disabled={disabled}
      isOpen={isOpen}
      label="Icon"
      value={mobilePropertyDisplayValue({ value: note.icon })}
      onOpen={onOpen}
    >
      <PropertyChipOptions>
        {mobileNoteIconOptions.map((option) => (
          <PropertyIconChip
            disabled={disabled}
            key={option}
            option={option}
            value={note.icon}
            onSelect={(icon) => onChangeProperties?.({ icon })}
          />
        ))}
      </PropertyChipOptions>
    </PropertyPickerSection>
  )
}

function TagsProperty({
  disabled,
  isOpen,
  note,
  onChangeProperties,
  onOpen,
}: {
  disabled: boolean
  isOpen: boolean
  note: MobileNote
  onChangeProperties?: (patch: MobileNotePropertyPatch) => void
  onOpen: () => void
}) {
  const [draft, setDraft] = useState(formatMobileNoteTags(note.tags))
  const commitDraft = () => onChangeProperties?.({ tags: parseMobileNoteTags(draft) })

  return (
    <PropertyPickerSection
      disabled={disabled}
      isOpen={isOpen}
      label="Tags"
      value={note.tags.length > 0 ? formatMobileNoteTags(note.tags) : 'None'}
      onOpen={onOpen}
    >
      <View style={styles.propertyPickerOptions}>
        <TextInput
          autoCapitalize="none"
          editable={!disabled}
          keyboardType="default"
          onBlur={commitDraft}
          onChangeText={setDraft}
          onSubmitEditing={commitDraft}
          placeholder="Tags"
          placeholderTextColor={colors.mutedText}
          returnKeyType="done"
          style={styles.propertyTextInput}
          value={draft}
        />
        <PropertyChipOptions>
          {mobileNoteTagOptions.map((option) => (
            <PropertyTextChip
              disabled={disabled}
              key={option}
              option={option}
              value={note.tags}
              onSelect={(tag) => {
                const tags = toggleMobileNoteTag(note.tags, tag)
                setDraft(formatMobileNoteTags(tags))
                onChangeProperties?.({ tags })
              }}
            />
          ))}
        </PropertyChipOptions>
      </View>
    </PropertyPickerSection>
  )
}

function PropertyPickerSection({
  children,
  disabled,
  isOpen,
  label,
  onOpen,
  value,
}: {
  children: ReactNode
  disabled: boolean
  isOpen: boolean
  label: string
  onOpen: () => void
  value: string
}) {
  return (
    <>
      <PropertyPickerRow disabled={disabled} isOpen={isOpen} label={label} value={value} onPress={onOpen} />
      {isOpen ? children : null}
    </>
  )
}

function PropertyPickerRow({
  disabled,
  isOpen,
  label,
  onPress,
  value,
}: {
  disabled: boolean
  isOpen: boolean
  label: string
  onPress: () => void
  value: string
}) {
  const Caret = isOpen ? CaretDown : CaretRight

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.propertyRow, disabled ? styles.propertyDisabled : null, pressed ? styles.pressed : null]}
    >
      <Text style={styles.propertyLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.propertyValue}>{value}</Text>
      <Caret size={16} color={colors.textSoft} />
    </Pressable>
  )
}

function PropertyIconChip({
  disabled,
  onSelect,
  option,
  value,
}: {
  disabled: boolean
  onSelect: (option: string) => void
  option: string
  value: string | undefined
}) {
  const isSelected = isMobileNotePropertySelected({ current: value, option })

  return (
    <SelectablePropertyChip
      disabled={disabled}
      isSelected={isSelected}
      onPress={() => onSelect(option)}
      style={styles.propertyIconChip}
    >
      <NamedIcon color={isSelected ? colors.primary : colors.textSoft} name={option as IconName} size={20} />
    </SelectablePropertyChip>
  )
}

function PropertyChipOptions({ children }: { children: ReactNode }) {
  return (
    <View style={styles.propertyChipRow}>
      {children}
    </View>
  )
}

function PropertyComboOptions({
  disabled,
  onSelect,
  suggestions,
  value,
}: {
  disabled: boolean
  onSelect: (option: string) => void
  suggestions: readonly string[]
  value: string
}) {
  return (
    <View style={styles.propertyComboBox}>
      {suggestions.map((option) => {
        const isSelected = isMobileNotePropertySelected({ current: value, option })

        return (
          <Pressable
            disabled={disabled}
            key={option || 'none'}
            onPress={() => onSelect(option)}
            style={({ pressed }) => [
              styles.propertyComboOption,
              isSelected ? styles.propertyComboOptionSelected : null,
              disabled ? styles.propertyDisabled : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={[styles.propertyComboOptionText, isSelected ? styles.propertyComboOptionTextSelected : null]}>
              {option || 'None'}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

function PropertyTextChip({
  disabled,
  onSelect,
  option,
  value,
}: {
  disabled: boolean
  onSelect: (option: string) => void
  option: string
  value: readonly string[] | string | undefined
}) {
  const isSelected = Array.isArray(value)
    ? value.includes(option)
    : isMobileNotePropertySelected({ current: typeof value === 'string' ? value : undefined, option })

  return (
    <SelectablePropertyChip
      disabled={disabled}
      isSelected={isSelected}
      onPress={() => onSelect(option)}
      style={styles.propertyChip}
    >
      <Text style={[styles.propertyChipText, isSelected ? styles.propertyChipTextSelected : null]}>
        {option || 'None'}
      </Text>
    </SelectablePropertyChip>
  )
}

function SelectablePropertyChip({
  children,
  disabled,
  isSelected,
  onPress,
  style,
}: {
  children: ReactNode
  disabled: boolean
  isSelected: boolean
  onPress: () => void
  style: StyleProp<ViewStyle>
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        style,
        isSelected ? styles.propertyChipSelected : null,
        disabled ? styles.propertyDisabled : null,
        pressed ? styles.pressed : null,
      ]}
    >
      {children}
    </Pressable>
  )
}

function commitTextValue({
  current,
  next,
  onCommit,
}: {
  current: string
  next: string
  onCommit: (value: string) => void
}) {
  const normalized = next.trim()
  if (normalized !== current) {
    onCommit(normalized)
  }
}

function formatMobilePropertyDate(date: Date) {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}
