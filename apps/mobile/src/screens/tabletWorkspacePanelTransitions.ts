import { desktopPanelParity } from '../ui/desktopParity'

export const tabletPanelTransitionDurationMs = 160

export function tabletLeftChromeWidth({
  compactTablet,
  noteListVisible,
  previewVisible = false,
  sidebarVisible,
}: {
  compactTablet: boolean
  noteListVisible: boolean
  previewVisible?: boolean
  sidebarVisible: boolean
}) {
  const targetVisible = previewVisible || noteListVisible
  if (!targetVisible) return 0

  return desktopPanelParity.noteListWidth
    + (sidebarVisible && !compactTablet ? desktopPanelParity.sidebarWidth : 0)
}

export function tabletLeftChromeDragOffset({
  dx,
  visible,
  width,
}: {
  dx: number
  visible: boolean
  width: number
}) {
  if (width <= 0) return 0
  if (visible) return clamp(dx, -width, 0)
  return clamp(-width + dx, -width, 0)
}

export function tabletPropertiesDragOffset({
  dx,
  visible,
  width = desktopPanelParity.inspectorWidth,
}: {
  dx: number
  visible: boolean
  width?: number
}) {
  if (width <= 0) return 0
  if (visible) return clamp(dx, 0, width)
  return clamp(width + dx, 0, width)
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}
