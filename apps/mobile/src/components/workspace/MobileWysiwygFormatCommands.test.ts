import { describe, expect, it, vi } from 'vitest'
import { mobileColors } from '../../ui/tokens'
import type { MobileMarkdownFormatAction } from '../../workspace/mobileMarkdownFormatting'
import {
  applyNativeWysiwygFormat,
  nativeWysiwygFormattingActions,
  type NativeWysiwygCommandBridge,
} from './MobileWysiwygFormatCommands'

describe('native WYSIWYG format commands', () => {
  it.each([
    ['bold', 'toggleBold', []],
    ['italic', 'toggleItalic', []],
    ['strike', 'toggleStrike', []],
    ['code', 'toggleCode', []],
    ['bulletList', 'toggleBulletList', []],
    ['orderedList', 'toggleOrderedList', []],
    ['taskList', 'toggleTaskList', []],
    ['quote', 'toggleBlockquote', []],
    ['heading1', 'toggleHeading', [1]],
    ['heading2', 'toggleHeading', [2]],
    ['heading3', 'toggleHeading', [3]],
    ['heading4', 'toggleHeading', [4]],
    ['heading5', 'toggleHeading', [5]],
    ['heading6', 'toggleHeading', [6]],
    ['highlight', 'toggleHighlight', [mobileColors.yellowSoft]],
  ] as const)('maps %s to the TenTap %s command', (action, method, args) => {
    const editor = fakeEditor()

    applyNativeWysiwygFormat(editor, action)

    expect(editor[method]).toHaveBeenCalledWith(...args)
    expect(calledMethods(editor)).toEqual([method])
  })

  it('keeps source-only markdown commands out of the native WYSIWYG toolbar', () => {
    const sourceOnlyActions: MobileMarkdownFormatAction[] = ['wikilink', 'divider', 'codeBlock', 'table']

    expect(nativeWysiwygFormattingActions).not.toEqual(expect.arrayContaining(sourceOnlyActions))

    for (const action of sourceOnlyActions) {
      const editor = fakeEditor()
      applyNativeWysiwygFormat(editor, action)
      expect(calledMethods(editor)).toEqual([])
    }
  })
})

type FakeEditor = Required<NativeWysiwygCommandBridge>
type FakeEditorMethod = keyof FakeEditor

function fakeEditor(): FakeEditor {
  return {
    toggleBlockquote: vi.fn(),
    toggleBold: vi.fn(),
    toggleBulletList: vi.fn(),
    toggleCode: vi.fn(),
    toggleHeading: vi.fn(),
    toggleHighlight: vi.fn(),
    toggleItalic: vi.fn(),
    toggleOrderedList: vi.fn(),
    toggleStrike: vi.fn(),
    toggleTaskList: vi.fn(),
  }
}

function calledMethods(editor: FakeEditor): FakeEditorMethod[] {
  return Object.entries(editor)
    .filter(([, method]) => vi.mocked(method).mock.calls.length > 0)
    .map(([method]) => method as FakeEditorMethod)
}
