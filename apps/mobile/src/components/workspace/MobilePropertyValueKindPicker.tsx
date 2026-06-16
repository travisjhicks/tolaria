import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from '../ui/text'
import { mobileText } from '../../i18n/mobileText'
import { mobileColors, mobileSpace, mobileType } from '../../ui/tokens'
import type { MobilePropertyValueKind } from '../../workspace/mobilePropertyValues'

export function MobilePropertyValueKindPicker({
  lockedListKind,
  onSelect,
  selectedKind,
}: {
  lockedListKind: boolean
  onSelect: (value: MobilePropertyValueKind) => void
  selectedKind: MobilePropertyValueKind
}) {
  return (
    <View style={styles.kindGroup} testID="workspace-property-kind-picker">
      <Text style={styles.kindLabel}>{mobileText('inspector.properties.valueKind')}</Text>
      <View style={styles.kindOptions}>
        {propertyValueKindOptions.map((option) => (
          <PropertyValueKindButton
            disabled={lockedListKind && option.kind !== 'list'}
            key={option.kind}
            kind={option.kind}
            label={mobileText(option.labelKey)}
            selected={selectedKind === option.kind}
            onPress={() => onSelect(option.kind)}
          />
        ))}
      </View>
    </View>
  )
}

export function MobileBooleanPropertyValuePicker({
  onChange,
  value,
}: {
  onChange: (value: string) => void
  value: string
}) {
  const selectedValue = /^(true|yes|1|on)$/iu.test(value.trim()) ? 'true' : 'false'
  return (
    <View style={styles.booleanOptions} testID="workspace-property-boolean-picker">
      <PropertyValueButton
        label={mobileText('inspector.properties.yes')}
        selected={selectedValue === 'true'}
        testID="workspace-property-boolean-yes"
        onPress={() => onChange('true')}
      />
      <PropertyValueButton
        label={mobileText('inspector.properties.no')}
        selected={selectedValue === 'false'}
        testID="workspace-property-boolean-no"
        onPress={() => onChange('false')}
      />
    </View>
  )
}

function PropertyValueKindButton({
  disabled,
  kind,
  label,
  onPress,
  selected,
}: {
  disabled: boolean
  kind: MobilePropertyValueKind
  label: string
  onPress: () => void
  selected: boolean
}) {
  return (
    <Pressable
      aria-selected={selected}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      style={({ pressed }) => [
        styles.kindButton,
        selected ? styles.selectedButton : null,
        disabled ? styles.disabledButton : null,
        pressed && !disabled ? styles.pressedButton : null,
      ]}
      testID={`workspace-property-kind-${kind}`}
      onPress={() => {
        if (!disabled) onPress()
      }}
    >
      <Text style={[styles.buttonText, selected ? styles.selectedButtonText : null, disabled ? styles.disabledButtonText : null]}>{label}</Text>
    </Pressable>
  )
}

function PropertyValueButton({
  label,
  onPress,
  selected,
  testID,
}: {
  label: string
  onPress: () => void
  selected: boolean
  testID: string
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.booleanButton,
        selected ? styles.selectedButton : null,
        pressed ? styles.pressedButton : null,
      ]}
      testID={testID}
      onPress={onPress}
    >
      <Text style={[styles.buttonText, selected ? styles.selectedButtonText : null]}>{label}</Text>
    </Pressable>
  )
}

const propertyValueKindOptions: Array<{ kind: MobilePropertyValueKind; labelKey: Parameters<typeof mobileText>[0] }> = [
  { kind: 'string', labelKey: 'inspector.properties.valueKind.text' },
  { kind: 'list', labelKey: 'inspector.properties.valueKind.list' },
  { kind: 'number', labelKey: 'inspector.properties.valueKind.number' },
  { kind: 'boolean', labelKey: 'inspector.properties.valueKind.boolean' },
  { kind: 'status', labelKey: 'inspector.properties.valueKind.status' },
  { kind: 'date', labelKey: 'inspector.properties.valueKind.date' },
  { kind: 'url', labelKey: 'inspector.properties.valueKind.url' },
  { kind: 'color', labelKey: 'inspector.properties.valueKind.color' },
]

const styles = StyleSheet.create({
  booleanButton: {
    minHeight: 30,
    minWidth: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    paddingHorizontal: mobileSpace.sm,
  },
  booleanOptions: {
    flexDirection: 'row',
    gap: mobileSpace.xs,
  },
  buttonText: {
    color: mobileColors.textMuted,
    fontSize: mobileType.caption,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.45,
  },
  disabledButtonText: {
    color: mobileColors.textFaint,
  },
  kindButton: {
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    paddingHorizontal: mobileSpace.sm,
  },
  kindGroup: {
    gap: mobileSpace.xs,
  },
  kindLabel: {
    color: mobileColors.textMuted,
    fontSize: mobileType.caption,
  },
  kindOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mobileSpace.xs,
  },
  pressedButton: {
    backgroundColor: mobileColors.graySoft,
  },
  selectedButton: {
    backgroundColor: mobileColors.selected,
  },
  selectedButtonText: {
    color: mobileColors.primary,
  },
})
