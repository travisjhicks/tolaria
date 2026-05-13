import { StyleSheet } from 'react-native'
import { colors, spacing } from '../theme'

export const propertyComboStyles = StyleSheet.create({
  propertyComboBox: {
    overflow: 'hidden',
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.canvas,
  },
  propertyComboOption: {
    minHeight: 38,
    justifyContent: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
  },
  propertyComboOptionSelected: {
    backgroundColor: colors.primarySoft,
  },
  propertyComboOptionText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  propertyComboOptionTextSelected: {
    color: colors.primary,
  },
})
