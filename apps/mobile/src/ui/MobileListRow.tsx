import type { ReactNode } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from '../components/ui/text'
import { probeProps, type MobileLayoutProbe } from '../qa/mobileLayoutProbe'
import { desktopNoteItemParity } from './desktopParity'
import { mobileColors, mobileSpace, mobileType } from './tokens'

type MobileListRowProps = {
  chips?: ReactNode
  leading?: ReactNode
  layoutProbe?: MobileLayoutProbe
  meta?: string
  metricId?: string
  onPress?: () => void
  selected?: boolean
  selectedBackgroundColor?: string
  selectedBorderColor?: string
  subtitle: string
  testID?: string
  title: string
  trailing?: ReactNode
}

const baseContentStyle = {
  paddingBottom: desktopNoteItemParity.padding.bottom,
  paddingLeft: desktopNoteItemParity.padding.left,
  paddingRight: desktopNoteItemParity.padding.right,
  paddingTop: desktopNoteItemParity.padding.top,
} as const

export function MobileListRow(props: MobileListRowProps) {
  const selected = props.selected ?? false
  const frameColors = selected ? {
    backgroundColor: props.selectedBackgroundColor,
    borderLeftColor: props.selectedBorderColor,
  } : null

  return (
    <View
      {...rowProbeProps(props.layoutProbe, props.metricId, 'frame')}
      testID={props.testID}
      style={[styles.frame, selected ? styles.selected : null, frameColors]}
    >
      <Pressable
        {...rowProbeProps(props.layoutProbe, props.metricId, 'body')}
        accessibilityRole="button"
        onPress={props.onPress}
        style={selected ? styles.baseSelected : styles.base}
      >
        <View {...rowProbeProps(props.layoutProbe, props.metricId, 'header')} style={styles.header}>
          {props.leading}
          <Text
            {...rowProbeProps(props.layoutProbe, props.metricId, 'title')}
            numberOfLines={1}
            style={[styles.title, selected ? styles.titleSelected : null]}
          >
            {props.title}
          </Text>
          {props.trailing}
        </View>
        <Text {...rowProbeProps(props.layoutProbe, props.metricId, 'subtitle')} numberOfLines={2} style={styles.subtitle}>{props.subtitle}</Text>
        <View {...rowProbeProps(props.layoutProbe, props.metricId, 'footer')} style={styles.footer}>
          {props.chips}
          {props.meta ? <Text style={styles.meta}>{props.meta}</Text> : null}
        </View>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  base: baseContentStyle,
  baseSelected: {
    ...baseContentStyle,
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

function rowProbeProps(layoutProbe: MobileLayoutProbe | undefined, metricId: string | undefined, segment: string) {
  return metricId ? probeProps(layoutProbe, `${metricId}.${segment}`) : {}
}
