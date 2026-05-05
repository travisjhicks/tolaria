import { StyleSheet } from 'react-native'
import { colors, spacing } from '../theme'

export const relationshipEditingStyles = StyleSheet.create({
  relationshipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  relationshipAddButton: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: colors.canvas,
  },
  relationshipAddBox: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  relationshipInput: {
    minHeight: 36,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.text,
    fontSize: 14,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.canvas,
  },
  relationshipSuggestion: {
    minHeight: 32,
    justifyContent: 'center',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primarySoft,
  },
  relationshipSuggestionText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
})
