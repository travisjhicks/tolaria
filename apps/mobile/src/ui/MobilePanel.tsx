import type { ReactNode } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { Text } from '../components/ui/text'
import { desktopPanelParity } from './desktopParity'
import { mobileColors, mobileSpace, mobileType } from './tokens'

export function MobilePanel({
  children,
  style,
  testID,
}: {
  children: ReactNode
  style?: StyleProp<ViewStyle>
  testID?: string
}) {
  return <View style={[styles.panel, style]} testID={testID}>{children}</View>
}

export function MobileToolbar({
  children,
}: {
  children: ReactNode
}) {
  return <View style={styles.toolbar}>{children}</View>
}

export function MobileToolbarTitle({ title }: { title: string }) {
  return <Text className="font-semibold text-foreground" numberOfLines={1} style={styles.title}>{title}</Text>
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
    fontSize: mobileType.body,
    fontWeight: '600',
  },
  toolbar: {
    minHeight: desktopPanelParity.toolbarHeight,
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.sm,
    borderBottomColor: mobileColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: mobileSpace.lg,
  },
})
