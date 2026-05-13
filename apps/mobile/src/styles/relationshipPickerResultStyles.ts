import { StyleSheet } from 'react-native'
import { colors, radii, spacing } from '../theme'

export const relationshipPickerResultStyles = StyleSheet.create({
  relationshipPickerResults: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  relationshipPickerResult: {
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primarySoft,
  },
  relationshipPickerResultTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  relationshipPickerResultMeta: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '600',
  },
  relationshipPickerEmpty: {
    color: colors.mutedText,
    fontSize: 14,
  },
})
