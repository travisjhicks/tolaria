import type { ReactNode } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { Text } from '../components/ui/text'
import { desktopPanelParity, desktopToolbarParity } from './desktopParity'
import { mobileColors } from './tokens'

type MobileToolbarTitleVariant = 'default' | 'inspector'

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
  testID,
}: {
  children: ReactNode
  testID?: string
}) {
  return <View style={styles.toolbar} testID={testID}>{children}</View>
}

export function MobileToolbarTitle({
  testID,
  title,
  variant = 'default',
}: {
  testID?: string
  title: string
  variant?: MobileToolbarTitleVariant
}) {
  return <Text numberOfLines={1} style={titleStyleByVariant[variant]} testID={testID}>{title}</Text>
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
    fontSize: desktopToolbarParity.titleFontSize,
    fontWeight: desktopToolbarParity.titleFontWeight,
  },
  titleInspector: {
    color: mobileColors.textMuted,
    fontSize: desktopToolbarParity.inspectorTitleFontSize,
    fontWeight: desktopToolbarParity.titleFontWeight,
  },
  toolbar: {
    minHeight: desktopPanelParity.toolbarHeight,
    alignItems: 'center',
    flexDirection: 'row',
    gap: desktopToolbarParity.gap,
    borderBottomColor: mobileColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: desktopToolbarParity.paddingHorizontal,
  },
})

const titleStyleByVariant = {
  default: styles.title,
  inspector: styles.titleInspector,
} as const
