import { describe, expect, it } from 'vitest'
import {
  assertNativeSidebarLayoutMetrics,
  formatNativeLayoutAssertionFailures,
  latestNativeLayoutMetrics,
  nativeSidebarMetricContract,
  parseNativeLayoutMetrics,
  type NativeLayoutMetric,
} from './nativeLayoutMetrics'
import { desktopSidebarParity } from '../ui/desktopParity'

describe('native layout metrics', () => {
  it('keeps the native metric contract synced with desktop sidebar parity tokens', () => {
    expect(nativeSidebarMetricContract).toEqual({
      countPill: {
        compactHeight: desktopSidebarParity.countPillCompactHeight,
        height: desktopSidebarParity.countPillHeight,
      },
      folderSectionContentPaddingBottom: desktopSidebarParity.sectionContentPaddingBottom,
      folderRowContentInset: desktopSidebarParity.folderRowContentInset,
      folderRowIndent: desktopSidebarParity.folderRowIndent,
      itemPadding: desktopSidebarParity.itemPadding,
      primarySectionItemCount: 3,
      sectionHorizontalPadding: desktopSidebarParity.sectionHorizontalPadding,
      sectionTitleMinHeight: 30,
      topNavPadding: desktopSidebarParity.topNavPadding,
    })
  })

  it('parses simulator log metrics and keeps the latest metric per id', () => {
    const metrics = latestNativeLayoutMetrics(parseNativeLayoutMetrics([
      'noise before metric',
      'TOLARIA_MOBILE_LAYOUT_METRIC {"height":12,"id":"sidebar.item.inbox.row","platform":"ios","width":10,"x":1,"y":2}',
      'TOLARIA_MOBILE_LAYOUT_METRIC {"height":32,"id":"sidebar.item.inbox.row","platform":"ios","width":247.5,"x":6,"y":4}',
      'TOLARIA_MOBILE_LAYOUT_METRIC not-json',
    ].join('\n')))

    expect(metrics['sidebar.item.inbox.row']).toEqual({
      height: 32,
      id: 'sidebar.item.inbox.row',
      platform: 'ios',
      width: 247.5,
      x: 6,
      y: 4,
    })
  })

  it('accepts native sidebar metrics that match desktop spacing tokens', () => {
    const metrics = latestNativeLayoutMetrics([
      containerMetric({ height: 104, id: 'sidebar.section.primary.container', width: 259.5 }),
      itemMetric('sidebar.item.inbox', { hasCount: true, y: 4 }),
      itemMetric('sidebar.item.all-notes', { hasCount: true, y: 36 }),
      itemMetric('sidebar.item.archive', { hasCount: true, y: 68 }),
      containerMetric({ height: 90, id: 'sidebar.section.favorites.container', width: 259.5, y: 104 }),
      sectionMetric('favorites'),
      itemMetric('sidebar.item.personal-journal', { hasCount: false, y: 30 }),
      containerMetric({ height: 72, id: 'sidebar.section.views.container', width: 259.5, y: 194 }),
      sectionMetric('views', 40),
      itemMetric('sidebar.item.view-active-procedures', { hasCount: true, y: 40 }),
      containerMetric({ height: 130, id: 'sidebar.section.types.container', width: 259.5, y: 266 }),
      sectionMetric('types'),
      itemMetric('sidebar.item.essays', { hasCount: true, y: 30 }),
      containerMetric({ height: 220, id: 'sidebar.section.folders.container', width: 259.5, y: 396 }),
      sectionMetric('folders'),
      countPillMetric('sidebar.section.types.count', { compact: true }),
      folderTreeRootMetric(30, { height: 190, x: 6 }),
      containerMetric({ height: 90, id: 'sidebar.folder.writing.container' }),
      folderMetric('sidebar.folder.writing', 12),
      containerMetric({ height: 30, id: 'sidebar.folder.writing-essays.container' }),
      folderMetric('sidebar.folder.writing-essays', 37),
      containerMetric({ height: 30, id: 'sidebar.folder.writing-drafts.container', y: 30 }),
      folderMetric('sidebar.folder.writing-drafts', 37),
      containerMetric({ height: 90, id: 'sidebar.folder.tolaria.container', y: 90 }),
      folderMetric('sidebar.folder.tolaria', 12),
      containerMetric({ height: 30, id: 'sidebar.folder.tolaria-mobile.container' }),
      folderMetric('sidebar.folder.tolaria-mobile', 37),
      containerMetric({ height: 30, id: 'sidebar.folder.tolaria-releases.container', y: 30 }),
      folderMetric('sidebar.folder.tolaria-releases', 37),
    ].flat())

    expect(assertNativeSidebarLayoutMetrics(metrics)).toEqual([])
  })

  it('reports native sidebar rows that lose horizontal or vertical padding', () => {
    const metrics = latestNativeLayoutMetrics([
      containerMetric({ height: 94, id: 'sidebar.section.primary.container', width: 259.5 }),
      itemMetric('sidebar.item.inbox', { hasCount: true, rowHeight: 22, rowX: 0 }),
      itemMetric('sidebar.item.all-notes', { hasCount: true, y: 10 }),
      itemMetric('sidebar.item.archive', { hasCount: true, y: 64 }),
      containerMetric({ height: 76, id: 'sidebar.section.favorites.container', width: 259.5, y: 80 }),
      sectionMetric('favorites', 18),
      itemMetric('sidebar.item.personal-journal', { hasCount: false, y: 16 }),
      containerMetric({ height: 72, id: 'sidebar.section.views.container', width: 259.5, y: 156 }),
      sectionMetric('views', 40),
      itemMetric('sidebar.item.view-active-procedures', { hasCount: true, y: 40 }),
      containerMetric({ height: 130, id: 'sidebar.section.types.container', width: 259.5, y: 220 }),
      sectionMetric('types'),
      itemMetric('sidebar.item.essays', { hasCount: true, y: 30 }),
      countPillMetric('sidebar.item.essays.count', { textY: 0 }),
      containerMetric({ height: 180, id: 'sidebar.section.folders.container', width: 259.5, y: 350 }),
      sectionMetric('folders'),
      countPillMetric('sidebar.section.types.count', { compact: true }),
      folderTreeRootMetric(30, { height: 120, x: 0 }),
      containerMetric({ height: 70, id: 'sidebar.folder.writing.container' }),
      folderMetric('sidebar.folder.writing', 0),
      containerMetric({ height: 30, id: 'sidebar.folder.writing-essays.container' }),
      folderMetric('sidebar.folder.writing-essays', 37),
      containerMetric({ height: 30, id: 'sidebar.folder.writing-drafts.container' }),
      folderMetric('sidebar.folder.writing-drafts', 37),
      containerMetric({ height: 40, id: 'sidebar.folder.tolaria.container', y: 40 }),
      folderMetric('sidebar.folder.tolaria', 12),
      containerMetric({ height: 30, id: 'sidebar.folder.tolaria-mobile.container' }),
      folderMetric('sidebar.folder.tolaria-mobile', 37),
      containerMetric({ height: 30, id: 'sidebar.folder.tolaria-releases.container' }),
      folderMetric('sidebar.folder.tolaria-releases', 37),
    ].flat())

    const failures = assertNativeSidebarLayoutMetrics(metrics)
    const formatted = formatNativeLayoutAssertionFailures(failures)

    expect(formatted).toContain('sidebar.item.inbox: row keeps desktop section inset')
    expect(formatted).toContain('sidebar.item.inbox: row keeps desktop vertical padding')
    expect(formatted).toContain('sidebar.folder.writing: folder content keeps desktop indentation')
    expect(formatted).toContain('sidebar.section.favorites: section title keeps desktop header height')
    expect(formatted).toContain('sidebar.item.personal-journal.row: first row starts after the sidebar section title')
    expect(formatted).toContain('sidebar.item.all-notes: row starts after the previous sidebar row')
    expect(formatted).toContain('sidebar.item.essays.count: count text is vertically centered inside native pill')
    expect(formatted).toContain('sidebar.section.primary: primary section keeps desktop top padding')
    expect(formatted).toContain('sidebar.folderTree.root: folder tree keeps desktop section inset')
    expect(formatted).toContain('sidebar.folder.writing-drafts: metric starts after the previous metric')
  })
})

function itemMetric(
  id: string,
  {
    hasCount,
    rowHeight = hasCount ? 32 : 30,
    rowX = 6,
    y = 0,
  }: {
    hasCount: boolean
    rowHeight?: number
    rowX?: number
    y?: number
  },
): NativeLayoutMetric[] {
  const contentHeight = hasCount ? 20 : 18
  const contentWidth = hasCount ? 227.5 : 219.5
  const rowWidth = 247.5

  return [
    {
      height: rowHeight,
      id: `${id}.row`,
      platform: 'ios',
      width: rowWidth,
      x: rowX,
      y,
    },
    {
      height: contentHeight,
      id: `${id}.content`,
      platform: 'ios',
      width: contentWidth,
      x: 12,
      y: hasCount ? 6 : 7,
    },
    ...(hasCount ? countPillMetric(`${id}.count`) : []),
  ]
}

function countPillMetric(
  id: string,
  {
    compact = false,
    textY = compact ? 2 : 3,
  }: {
    compact?: boolean
    textY?: number
  } = {},
): NativeLayoutMetric[] {
  const height = compact ? desktopSidebarParity.countPillCompactHeight : desktopSidebarParity.countPillHeight

  return [
    {
      height,
      id: `${id}.container`,
      platform: 'ios',
      width: 22,
      x: 202,
      y: 0,
    },
    {
      height: 14,
      id: `${id}.text`,
      platform: 'ios',
      width: 18,
      x: 2,
      y: textY,
    },
  ]
}

function folderMetric(id: string, contentX: number, y = 0): NativeLayoutMetric[] {
  return [
    {
      height: 30,
      id: `${id}.row`,
      platform: 'ios',
      width: 247.5,
      x: 0,
      y,
    },
    {
      height: 18,
      id: `${id}.content`,
      platform: 'ios',
      width: 219.5,
      x: contentX,
      y: 6,
    },
  ]
}

function folderTreeRootMetric(
  y: number,
  {
    height = 120,
    x = 0,
  }: {
    height?: number
    x?: number
  } = {},
): NativeLayoutMetric[] {
  return [{
    height,
    id: 'sidebar.folderTree.root',
    platform: 'ios',
    width: 247.5,
    x,
    y,
  }]
}

function sectionMetric(sectionId: string, rowHeight = 30): NativeLayoutMetric[] {
  return [{
    height: rowHeight,
    id: `sidebar.section.${sectionId}.row`,
    platform: 'ios',
    width: 247.5,
    x: 6,
    y: 0,
  }]
}

function containerMetric(
  {
    height,
    id,
    width = 247.5,
    x = 0,
    y = 0,
  }: {
    height: number
    id: string
    width?: number
    x?: number
    y?: number
  },
): NativeLayoutMetric {
  return {
    height,
    id,
    platform: 'ios',
    width,
    x,
    y,
  }
}
