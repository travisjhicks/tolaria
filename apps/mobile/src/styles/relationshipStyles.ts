import { StyleSheet } from 'react-native'
import { colors, spacing } from '../theme'

export const relationshipStyles = StyleSheet.create({
  relationshipGroup: {
    paddingBottom: spacing.sm,
  },
  relationshipChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  relationshipChip: {
    minHeight: 30,
    justifyContent: 'center',
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.canvas,
  },
  relationshipChipText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
})
