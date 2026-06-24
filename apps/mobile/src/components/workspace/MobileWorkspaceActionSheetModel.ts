import { desktopPanelParity } from '../../ui/desktopParity'
import { mobileSpace } from '../../ui/tokens'

export const mobileActionSheetLayoutContract = {
  contentGap: mobileSpace.md,
  contentPadding: mobileSpace.lg,
  overlayPaddingHorizontal: mobileSpace.xl,
  overlayPaddingVertical: desktopPanelParity.toolbarHeight + mobileSpace.xl,
  sheetMaxHeight: '84%',
  sheetMaxWidth: 640,
} as const

export const mobileWorkspaceFormSheetAutoFocus = false
export const mobileWorkspaceFormSheetMaxSuggestions = 3
export const mobileWorkspaceRelationshipTargetMaxSuggestions = 2

export function mobileSingleTextFieldSubmitDisabled({
  allowEmptyInput = false,
  inputValue,
  submitDisabled = false,
}: {
  allowEmptyInput?: boolean
  inputValue: string
  submitDisabled?: boolean
}) {
  return submitDisabled || (!allowEmptyInput && inputValue.trim().length === 0)
}
