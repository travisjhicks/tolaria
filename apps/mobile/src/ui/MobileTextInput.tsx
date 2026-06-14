import { StyleSheet, View, type TextInputProps } from 'react-native'
import { Input } from '../components/ui/input'
import { Text } from '../components/ui/text'
import { desktopPropertyParity } from './desktopParity'
import { mobileColors, mobileRadius, mobileSpace, mobileType } from './tokens'

export function MobileTextInput({
  label,
  style,
  testID,
  ...props
}: TextInputProps & {
  label: string
  testID?: string
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Input
        autoCapitalize="none"
        clearButtonMode="while-editing"
        placeholderTextColor={mobileColors.textFaint}
        style={[styles.input, style]}
        testID={testID}
        {...props}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  field: {
    gap: mobileSpace.xs,
  },
  input: {
    minHeight: 34,
    borderColor: mobileColors.borderStrong,
    borderRadius: mobileRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    color: mobileColors.text,
    fontSize: mobileType.body,
    paddingHorizontal: mobileSpace.sm,
    paddingVertical: mobileSpace.xs,
  },
  label: {
    color: mobileColors.textMuted,
    fontSize: desktopPropertyParity.labelTextSize,
  },
})
