import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from '../ui/text'
import { mobileColors, mobileSpace, mobileType } from '../../ui/tokens'

export type MobileWorkspaceSuggestionItem = {
  label: string
  meta?: string
  testId?: string
  value: string
}

export function MobileWorkspaceSuggestionList({
  items,
  labels,
  onSelect,
  testID,
  testIDPrefix,
}: {
  items?: MobileWorkspaceSuggestionItem[]
  labels?: string[]
  onSelect: (value: string, item: MobileWorkspaceSuggestionItem) => void
  testID: string
  testIDPrefix: string
}) {
  const suggestions = suggestionItems(labels, items)
  if (suggestions.length === 0) return null

  return (
    <View style={styles.list} testID={testID}>
      {suggestions.map((item) => (
        <Pressable
          accessibilityLabel={humanizeSuggestionLabel(item.label)}
          accessibilityRole="button"
          key={`${item.value}-${item.label}`}
          style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
          testID={`${testIDPrefix}-${item.testId ?? testIdSegment(item.value)}`}
          onPress={() => onSelect(item.value, item)}
        >
          <Text numberOfLines={1} style={styles.title}>{humanizeSuggestionLabel(item.label)}</Text>
          <Text numberOfLines={1} style={styles.meta}>{item.meta ?? item.value}</Text>
        </Pressable>
      ))}
    </View>
  )
}

function suggestionItems(
  labels: string[] | undefined,
  items: MobileWorkspaceSuggestionItem[] | undefined,
): MobileWorkspaceSuggestionItem[] {
  return items ?? labels?.map((label) => ({ label, value: label })) ?? []
}

function humanizeSuggestionLabel(label: string) {
  return label
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function testIdSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const styles = StyleSheet.create({
  list: {
    gap: mobileSpace.xs,
  },
  meta: {
    maxWidth: 160,
    color: mobileColors.textMuted,
    fontSize: mobileType.caption,
  },
  row: {
    minHeight: 34,
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.sm,
    borderRadius: 6,
    paddingHorizontal: mobileSpace.sm,
    paddingVertical: mobileSpace.xs,
  },
  rowPressed: {
    backgroundColor: mobileColors.graySoft,
  },
  title: {
    minWidth: 0,
    flex: 1,
    color: mobileColors.text,
    fontSize: mobileType.body,
    fontWeight: '500',
  },
})
