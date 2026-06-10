import type { ReactNode } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from '../components/ui/text'
import { mobileColors, mobileSpace, mobileType } from './tokens'

export function MobileListRow({
  chips,
  leading,
  meta,
  onPress,
  selected = false,
  subtitle,
  title,
  trailing,
}: {
  chips?: ReactNode
  leading?: ReactNode
  meta?: string
  onPress?: () => void
  selected?: boolean
  subtitle: string
  title: string
  trailing?: ReactNode
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        selected ? styles.selected : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={styles.header}>
        {leading}
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
        {trailing}
      </View>
      <Text numberOfLines={2} style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.footer}>
        {chips}
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    borderBottomColor: mobileColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderLeftColor: 'transparent',
    borderLeftWidth: 3,
    paddingHorizontal: mobileSpace.lg,
    paddingVertical: mobileSpace.md,
  },
  footer: {
    marginTop: mobileSpace.md,
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mobileSpace.sm,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.sm,
  },
  meta: {
    color: mobileColors.textMuted,
    fontSize: mobileType.caption,
  },
  pressed: {
    opacity: 0.72,
  },
  selected: {
    backgroundColor: mobileColors.selected,
    borderLeftColor: mobileColors.primary,
  },
  subtitle: {
    marginTop: mobileSpace.sm,
    color: mobileColors.textMuted,
    fontSize: mobileType.body,
    lineHeight: 20,
  },
  title: {
    flex: 1,
    color: mobileColors.text,
    fontSize: mobileType.bodyLarge,
    fontWeight: '700',
  },
})
