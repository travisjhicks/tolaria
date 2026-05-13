import { StyleSheet } from 'react-native'
import { colors, radii, spacing } from '../theme'

export const relationshipPickerStyles = StyleSheet.create({
  relationshipPickerOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: 'rgba(41, 40, 37, 0.26)',
  },
  relationshipPickerPanel: {
    width: '100%',
    maxWidth: 420,
    maxHeight: 520,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    backgroundColor: colors.canvas,
  },
  relationshipPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  relationshipPickerTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  relationshipPickerClose: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.sidebar,
  },
  relationshipPickerInput: {
    minHeight: 42,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.sidebar,
  },
})
