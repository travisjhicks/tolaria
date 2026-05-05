import { StyleSheet } from 'react-native'
import { colors, spacing } from '../theme'

export const propertyChipStyles = StyleSheet.create({
  propertyDisabled: {
    opacity: 0.55,
  },
  propertyError: {
    marginBottom: spacing.md,
    color: '#b74234',
    fontSize: 13,
    fontWeight: '700',
  },
  propertyChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  propertyPickerOptions: {
    paddingBottom: spacing.md,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  propertyTextInput: {
    minHeight: 38,
    marginTop: spacing.sm,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: spacing.md,
  },
  propertyChip: {
    minHeight: 30,
    justifyContent: 'center',
    borderRadius: 999,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.canvas,
  },
  propertyChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  propertyIconChip: {
    width: 38,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.canvas,
  },
  propertyChipText: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: '700',
  },
  propertyChipTextSelected: {
    color: colors.primary,
  },
})
