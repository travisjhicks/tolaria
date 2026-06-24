import { describe, expect, it } from 'vitest'
import { desktopPanelParity } from '../ui/desktopParity'
import {
  tabletLeftChromeDragOffset,
  tabletLeftChromeWidth,
  tabletPropertiesDragOffset,
} from './tabletWorkspacePanelTransitions'

describe('tabletLeftChromeWidth', () => {
  it('moves the sidebar and note list together on regular iPad layouts', () => {
    expect(tabletLeftChromeWidth({
      compactTablet: false,
      noteListVisible: true,
      sidebarVisible: true,
    })).toBe(desktopPanelParity.sidebarWidth + desktopPanelParity.noteListWidth)
  })

  it('keeps compact tablet chrome to the note list rail', () => {
    expect(tabletLeftChromeWidth({
      compactTablet: true,
      noteListVisible: true,
      sidebarVisible: true,
    })).toBe(desktopPanelParity.noteListWidth)
  })

  it('uses the target width while revealing hidden chrome', () => {
    expect(tabletLeftChromeWidth({
      compactTablet: false,
      noteListVisible: false,
      previewVisible: true,
      sidebarVisible: true,
    })).toBe(desktopPanelParity.sidebarWidth + desktopPanelParity.noteListWidth)
  })
})

describe('tabletLeftChromeDragOffset', () => {
  it('clamps visible left chrome while hiding it', () => {
    expect(tabletLeftChromeDragOffset({ dx: -900, visible: true, width: 600 })).toBe(-600)
    expect(tabletLeftChromeDragOffset({ dx: -120, visible: true, width: 600 })).toBe(-120)
    expect(tabletLeftChromeDragOffset({ dx: 80, visible: true, width: 600 })).toBe(0)
  })

  it('reveals hidden left chrome from its offscreen edge', () => {
    expect(tabletLeftChromeDragOffset({ dx: 0, visible: false, width: 600 })).toBe(-600)
    expect(tabletLeftChromeDragOffset({ dx: 180, visible: false, width: 600 })).toBe(-420)
    expect(tabletLeftChromeDragOffset({ dx: 900, visible: false, width: 600 })).toBe(0)
  })
})

describe('tabletPropertiesDragOffset', () => {
  it('clamps visible properties while hiding it to the right', () => {
    expect(tabletPropertiesDragOffset({ dx: 900, visible: true })).toBe(desktopPanelParity.inspectorWidth)
    expect(tabletPropertiesDragOffset({ dx: 120, visible: true })).toBe(120)
    expect(tabletPropertiesDragOffset({ dx: -80, visible: true })).toBe(0)
  })

  it('reveals hidden properties from the right edge', () => {
    expect(tabletPropertiesDragOffset({ dx: 0, visible: false })).toBe(desktopPanelParity.inspectorWidth)
    expect(tabletPropertiesDragOffset({ dx: -120, visible: false })).toBe(desktopPanelParity.inspectorWidth - 120)
    expect(tabletPropertiesDragOffset({ dx: -900, visible: false })).toBe(0)
  })
})
