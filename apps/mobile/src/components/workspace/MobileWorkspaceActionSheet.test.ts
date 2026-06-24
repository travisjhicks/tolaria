import { describe, expect, it } from 'vitest'
import { desktopPanelParity } from '../../ui/desktopParity'
import { mobileSpace } from '../../ui/tokens'
import {
  mobileActionSheetLayoutContract,
  mobileSingleTextFieldSubmitDisabled,
  mobileWorkspaceRelationshipTargetMaxSuggestions,
  mobileWorkspaceFormSheetAutoFocus,
  mobileWorkspaceFormSheetMaxSuggestions,
  mobileWorkspaceActionGroupLayoutContract,
  mobileWorkspaceFormSectionLayoutContract,
  mobileWorkspaceSortPickerLayoutContract,
} from './MobileWorkspaceActionSheetModel'

describe('mobile workspace action sheet', () => {
  it('keeps sheet spacing explicit for native modals', () => {
    expect(mobileActionSheetLayoutContract).toEqual({
      contentGap: mobileSpace.md,
      contentPadding: mobileSpace.lg,
      overlayPaddingHorizontal: mobileSpace.xl,
      overlayPaddingVertical: desktopPanelParity.toolbarHeight + mobileSpace.xl,
      sheetMaxHeight: '84%',
      sheetMaxWidth: 640,
    })
  })

  it('allows title-less note creation while keeping required field guards', () => {
    expect(mobileSingleTextFieldSubmitDisabled({
      allowEmptyInput: true,
      inputValue: '',
    })).toBe(false)

    expect(mobileSingleTextFieldSubmitDisabled({
      inputValue: '',
    })).toBe(true)

    expect(mobileSingleTextFieldSubmitDisabled({
      allowEmptyInput: true,
      inputValue: '',
      submitDisabled: true,
    })).toBe(true)
  })

  it('opens workspace form sheets without forcing the native keyboard over the sheet', () => {
    expect(mobileWorkspaceFormSheetAutoFocus).toBe(false)
  })

  it('bounds form sheet suggestions so the footer remains reachable on first open', () => {
    expect(mobileWorkspaceFormSheetMaxSuggestions).toBe(3)
    expect(mobileWorkspaceRelationshipTargetMaxSuggestions).toBe(2)
  })

  it('keeps nested form sections grouped with explicit native spacing', () => {
    expect(mobileWorkspaceFormSectionLayoutContract).toEqual({
      gap: mobileSpace.sm,
      padding: mobileSpace.sm,
      radius: 8,
    })
  })

  it('keeps reorder/delete action groups wrapped with fixed native touch height', () => {
    expect(mobileWorkspaceActionGroupLayoutContract).toEqual({
      gap: mobileSpace.xs,
      minHeight: 32,
      paddingHorizontal: mobileSpace.sm,
      paddingVertical: mobileSpace.xs,
      radius: 6,
    })
  })

  it('keeps view sort options rendered as compact selectable controls', () => {
    expect(mobileWorkspaceSortPickerLayoutContract).toEqual({
      gap: mobileSpace.xs,
      optionMinHeight: 32,
      optionRadius: 6,
      optionTextSize: 12,
    })
  })
})
