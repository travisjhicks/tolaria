import type { ReactNode } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from '../components/ui/text'
import { mobileColors, mobileRadius, mobileSpace, mobileType } from './tokens'

type MobileListRowProps = {
  chips?: ReactNode
  leading?: ReactNode
  meta?: string
  onPress?: () => void
  selected?: boolean
  subtitle: string
  title: string
  trailing?: ReactNode
}

export function MobileListRow(props: MobileListRowProps) {
  const {
    chips,
    leading,
    meta,
    onPress,
    selected = false,
    subtitle,
    title,
    trailing,
  } = props

  return (
    <View style={[styles.frame, selected ? styles.selected : null]}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.base,
          pressed ? styles.pressed : null,
        ]}
      >
        <View style={styles.header}>
          {leading}
          <Text numberOfLines={1} style={[styles.title, selected ? styles.titleSelected : null]}>{title}</Text>
          {trailing}
        </View>
        <Text numberOfLines={2} style={styles.subtitle}>{subtitle}</Text>
        <View style={styles.footer}>
          {chips}
          {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        </View>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: mobileSpace.md,
    paddingVertical: mobileSpace.md,
  },
  frame: {
    alignSelf: 'stretch',
    borderColor: 'transparent',
    borderLeftColor: 'transparent',
    borderLeftWidth: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: mobileRadius.md,
    marginBottom: mobileSpace.xs,
    overflow: 'hidden',
    width: '100%',
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
    backgroundColor: mobileColors.graySoft,
  },
  selected: {
    backgroundColor: mobileColors.selected,
    borderColor: mobileColors.selectedStrong,
    borderLeftColor: mobileColors.primary,
  },
  subtitle: {
    marginTop: mobileSpace.sm,
    color: mobileColors.textMuted,
    fontSize: mobileType.caption,
    lineHeight: 18,
  },
  title: {
    flex: 1,
    color: mobileColors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  titleSelected: {
    fontWeight: '600',
  },
})
