import { Pressable, StyleSheet, View } from 'react-native'
import { CheckCircle } from 'phosphor-react-native'
import { Text } from '../ui/text'
import { mobileText } from '../../i18n/mobileText'
import { MobileTextInput } from '../../ui/MobileTextInput'
import { mobileColors, mobileSpace, mobileType } from '../../ui/tokens'

type MobileViewDisplayPropertiesPickerProps = {
  options: string[]
  query: string
  selectedProperties: string[]
  onQueryChange: (value: string) => void
  onSelectedPropertiesChange: (value: string[]) => void
}

export function MobileViewDisplayPropertiesPicker({
  onQueryChange,
  onSelectedPropertiesChange,
  options,
  query,
  selectedProperties,
}: MobileViewDisplayPropertiesPickerProps) {
  const orderedOptions = orderedDisplayPropertyOptions(options, selectedProperties)

  return (
    <View style={styles.picker} testID="workspace-view-property-picker">
      <Text style={styles.label}>{mobileText('noteList.properties.showInNoteList')}</Text>
      <MobileTextInput
        label={mobileText('noteList.properties.searchLabel')}
        placeholder={mobileText('noteList.properties.searchPlaceholder')}
        testID="workspace-view-property-search-input"
        value={query}
        onChangeText={onQueryChange}
      />
      <View style={styles.optionList} testID="workspace-view-property-options">
        {orderedOptions.length === 0 ? (
          <Text style={styles.empty}>{mobileText('noteList.properties.noMatches')}</Text>
        ) : orderedOptions.map((key) => (
          <PropertyOption
            key={key}
            label={key}
            selected={selectedDisplayProperty(selectedProperties, key)}
            onPress={() => onSelectedPropertiesChange(toggleDisplayProperty(selectedProperties, key))}
          />
        ))}
      </View>
    </View>
  )
}

function PropertyOption({
  label,
  onPress,
  selected,
}: {
  label: string
  onPress: () => void
  selected: boolean
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => [
        styles.option,
        selected ? styles.optionSelected : null,
        pressed ? styles.optionPressed : null,
      ]}
      testID={`workspace-view-property-option-${testIdSegment(label)}`}
      onPress={onPress}
    >
      <CheckCircle color={selected ? mobileColors.primary : mobileColors.textFaint} size={16} weight={selected ? 'fill' : 'regular'} />
      <Text numberOfLines={1} style={[styles.optionText, selected ? styles.optionTextSelected : null]}>{label}</Text>
    </Pressable>
  )
}

function orderedDisplayPropertyOptions(options: string[], selected: string[]) {
  const selectedKeys = normalizedPropertyKeys(selected)
  const optionKeys = normalizedPropertyKeys(options)
  return [
    ...selectedKeys.filter((key) => optionKeys.some((option) => displayPropertyKey(option) === displayPropertyKey(key))),
    ...optionKeys.filter((key) => !selectedKeys.some((selectedKey) => displayPropertyKey(selectedKey) === displayPropertyKey(key))),
  ]
}

function toggleDisplayProperty(selected: string[], key: string) {
  if (selectedDisplayProperty(selected, key)) {
    return selected.filter((current) => displayPropertyKey(current) !== displayPropertyKey(key))
  }

  return [...normalizedPropertyKeys(selected), key]
}

function selectedDisplayProperty(selected: string[], key: string) {
  return selected.some((current) => displayPropertyKey(current) === displayPropertyKey(key))
}

function normalizedPropertyKeys(keys: string[]) {
  const seen = new Set<string>()
  return keys
    .map((key) => key.trim())
    .filter((key) => {
      const normalized = key.toLowerCase()
      if (!normalized || seen.has(normalized)) return false
      seen.add(normalized)
      return true
    })
}

function displayPropertyKey(value: string) {
  return value.trim().toLowerCase()
}

function testIdSegment(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/gu, '-').replace(/^-|-$/gu, '') || 'property'
}

const styles = StyleSheet.create({
  empty: {
    color: mobileColors.textMuted,
    fontSize: mobileType.caption,
  },
  label: {
    color: mobileColors.textMuted,
    fontSize: mobileType.caption,
    fontWeight: '600',
  },
  option: {
    minHeight: 32,
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.sm,
    borderRadius: 6,
    paddingHorizontal: mobileSpace.sm,
    paddingVertical: mobileSpace.xs,
  },
  optionList: {
    gap: mobileSpace.xs,
  },
  optionPressed: {
    backgroundColor: mobileColors.graySoft,
  },
  optionSelected: {
    backgroundColor: mobileColors.primarySoft,
  },
  optionText: {
    minWidth: 0,
    flex: 1,
    color: mobileColors.textMuted,
    fontSize: mobileType.body,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: mobileColors.primary,
  },
  picker: {
    gap: mobileSpace.sm,
    borderColor: mobileColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: mobileSpace.md,
  },
})
