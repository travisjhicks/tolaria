import type { ReactNode } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { Text } from '../components/ui/text'
import { mobileColors, mobileSpace, mobileType } from './tokens'

export function MobilePanel({
  children,
  style,
}: {
  children: ReactNode
  style?: StyleProp<ViewStyle>
}) {
  return <View style={[styles.panel, style]}>{children}</View>
}

export function MobileToolbar({
  children,
}: {
  children: ReactNode
}) {
  return <View style={styles.toolbar}>{children}</View>
}

export function MobileToolbarTitle({ title }: { title: string }) {
  return <Text className="font-bold text-foreground" numberOfLines={1} style={styles.title}>{title}</Text>
}

export function MobileToolbarSpacer() {
  return <View style={styles.spacer} />
}

const styles = StyleSheet.create({
  panel: {
    minWidth: 0,
    backgroundColor: mobileColors.card,
    borderColor: mobileColors.border,
  },
  spacer: {
    flex: 1,
  },
  title: {
    color: mobileColors.text,
    fontSize: mobileType.title,
    fontWeight: '700',
  },
  toolbar: {
    minHeight: 56,
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.sm,
    borderBottomColor: mobileColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: mobileSpace.md,
  },
})
