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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
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
  relationshipRemoveButton: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
