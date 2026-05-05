import { StyleSheet } from 'react-native'
import { colors, spacing } from '../theme'

export const customPropertyStyles = StyleSheet.create({
  customPropertyRow: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  customPropertyKey: {
    width: 90,
    color: colors.mutedText,
    fontSize: 13,
    fontWeight: '600',
  },
  customPropertyValue: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  customPropertyAddRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  customPropertyAddInput: {
    minHeight: 36,
    flex: 1,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.text,
    fontSize: 13,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.canvas,
  },
})
