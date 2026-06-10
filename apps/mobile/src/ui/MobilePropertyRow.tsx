import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from '../components/ui/text'
import { mobileColors, mobileSpace, mobileType } from './tokens'

export function MobilePropertyRow({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.value}>{typeof value === 'string' ? <Text style={styles.valueText}>{value}</Text> : value}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  label: {
    width: 86,
    color: mobileColors.textMuted,
    fontSize: mobileType.body,
  },
  row: {
    minHeight: 44,
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.sm,
    borderBottomColor: mobileColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  value: {
    flex: 1,
    alignItems: 'flex-end',
    minWidth: 0,
  },
  valueText: {
    color: mobileColors.text,
    fontSize: mobileType.body,
    fontWeight: '600',
    textAlign: 'right',
  },
})
