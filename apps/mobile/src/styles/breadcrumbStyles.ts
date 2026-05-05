import { StyleSheet } from 'react-native'
import { colors, spacing } from '../theme'

export const breadcrumbStyles = StyleSheet.create({
  editorBreadcrumb: {
    minWidth: 0,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  editorBreadcrumbText: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '600',
  },
  editorBreadcrumbDivider: {
    color: colors.border,
    fontSize: 14,
  },
  editorBreadcrumbTitle: {
    minWidth: 0,
    flexShrink: 1,
    color: colors.textSoft,
    fontSize: 14,
    fontWeight: '700',
  },
  editorBreadcrumbButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.canvas,
  },
})
