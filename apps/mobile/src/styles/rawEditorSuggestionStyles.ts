import { StyleSheet } from 'react-native'
import { colors, spacing } from '../theme'

export const rawEditorSuggestionStyles = StyleSheet.create({
  rawEditorSuggestionMenu: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    left: spacing.xl,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    backgroundColor: colors.canvas,
  },
  rawEditorSuggestion: {
    minHeight: 46,
    justifyContent: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
  },
  rawEditorSuggestionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  rawEditorSuggestionMeta: {
    marginTop: 2,
    color: colors.mutedText,
    fontSize: 12,
  },
})
