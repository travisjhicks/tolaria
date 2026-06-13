import type { ReactNode } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from '../components/ui/text'
import { desktopNoteItemParity } from './desktopParity'
import { mobileColors, mobileSpace, mobileType } from './tokens'

type MobileListRowProps = {
  chips?: ReactNode
  leading?: ReactNode
  meta?: string
  onPress?: () => void
  selected?: boolean
  selectedBackgroundColor?: string
  selectedBorderColor?: string
  subtitle: string
  testID?: string
  title: string
  trailing?: ReactNode
}

export function MobileListRow(props: MobileListRowProps) {
  const selected = props.selected ?? false

  return (
    <View
      testID={props.testID}
      style={frameStyle({
        selected,
        selectedBackgroundColor: props.selectedBackgroundColor,
        selectedBorderColor: props.selectedBorderColor,
      })}
    >
      <Pressable
        accessibilityRole="button"
        onPress={props.onPress}
        style={({ pressed }) => rowContentStyle({ pressed, selected })}
      >
        <View style={styles.header}>
          {props.leading}
          <Text numberOfLines={1} style={[styles.title, selected ? styles.titleSelected : null]}>{props.title}</Text>
          {props.trailing}
        </View>
        <Text numberOfLines={2} style={styles.subtitle}>{props.subtitle}</Text>
        <View style={styles.footer}>
          {props.chips}
          {props.meta ? <Text style={styles.meta}>{props.meta}</Text> : null}
        </View>
      </Pressable>
    </View>
  )
}

function frameStyle({
  selected,
  selectedBackgroundColor,
  selectedBorderColor,
}: {
  selected: boolean
  selectedBackgroundColor?: string
  selectedBorderColor?: string
}) {
  return [
    styles.frame,
    selected ? styles.selected : null,
    selected && selectedBackgroundColor ? { backgroundColor: selectedBackgroundColor } : null,
    selected && selectedBorderColor ? { borderLeftColor: selectedBorderColor } : null,
  ]
}

function rowContentStyle({
  pressed,
  selected,
}: {
  pressed: boolean
  selected: boolean
}) {
  return [
    styles.base,
    selected ? styles.baseSelected : null,
    pressed ? styles.pressed : null,
  ]
}

const styles = StyleSheet.create({
  base: {
    paddingBottom: desktopNoteItemParity.padding.bottom,
    paddingLeft: desktopNoteItemParity.padding.left,
    paddingRight: desktopNoteItemParity.padding.right,
    paddingTop: desktopNoteItemParity.padding.top,
  },
  baseSelected: {
    paddingLeft: desktopNoteItemParity.selectedPaddingLeft,
  },
  frame: {
    alignSelf: 'stretch',
    borderBottomColor: mobileColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderLeftColor: 'transparent',
    borderLeftWidth: 0,
    overflow: 'hidden',
    width: '100%',
  },
  footer: {
    marginTop: desktopNoteItemParity.contentGap,
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
    backgroundColor: mobileColors.control,
  },
  selected: {
    borderLeftWidth: desktopNoteItemParity.borderLeftWidth,
  },
  subtitle: {
    marginTop: desktopNoteItemParity.contentGap,
    color: mobileColors.textMuted,
    fontSize: desktopNoteItemParity.snippetTextSize,
    lineHeight: desktopNoteItemParity.snippetLineHeight,
  },
  title: {
    flex: 1,
    color: mobileColors.text,
    fontSize: desktopNoteItemParity.titleTextSize,
    fontWeight: '500',
    lineHeight: desktopNoteItemParity.titleLineHeight,
  },
  titleSelected: {
    fontWeight: '600',
  },
})
