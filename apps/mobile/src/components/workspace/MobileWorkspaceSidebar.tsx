import type { ReactNode } from 'react'
import {
  Archive,
  CaretDown,
  FileText,
  FolderOpen,
  Funnel,
  SidebarSimple,
  StackSimple,
  Star,
  Tag,
  Tray,
} from 'phosphor-react-native'
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Text } from '../ui/text'
import { mobileCopy, mobileText } from '../../i18n/mobileText'
import { MobileLayoutProbeReadout } from '../../qa/MobileLayoutProbeReadout'
import { probeProps, useMobileLayoutProbe, type MobileLayoutProbe } from '../../qa/mobileLayoutProbe'
import { MobileIconButton } from '../../ui/MobileIconButton'
import { MobilePanel, MobileToolbar } from '../../ui/MobilePanel'
import { desktopPanelParity, desktopSidebarParity, desktopToolbarActionParity } from '../../ui/desktopParity'
import { mobileColors, mobileSpace, mobileType } from '../../ui/tokens'
import type {
  MobileNote,
  MobileSidebarIcon,
  MobileSidebarSection,
} from '../../workspace/mobileWorkspaceModel'
import { MobileSidebarCountPill } from './MobileSidebarCountPill'
import { FolderTree, type MobileSidebarFolderSelection } from './MobileWorkspaceSidebarFolderTree'
import { noteTypeColor, noteTypeSoftColor } from './mobileWorkspaceTone'

export type { MobileSidebarFolderSelection } from './MobileWorkspaceSidebarFolderTree'

export type MobileSidebarItemSelection = {
  count?: string
  id: string
  label: string
  sectionId: string
  viewId?: string
}

export function MobileWorkspaceSidebar({
  activeFolderId,
  activeItemId,
  layoutProbe: layoutProbeEnabled = false,
  onSelectFolder,
  onSelectItem,
  sections,
  title = 'Tolaria Vault',
}: {
  activeFolderId?: string | null
  activeItemId?: string | null
  onSelectFolder?: (selection: MobileSidebarFolderSelection) => void
  onSelectItem?: (selection: MobileSidebarItemSelection) => void
  layoutProbe?: boolean
  sections: MobileSidebarSection[]
  title?: string
}) {
  const layoutProbe = useMobileLayoutProbe(layoutProbeEnabled)

  return (
    <MobilePanel {...layoutProbe.probe('sidebar.panel')} style={styles.panel} testID="workspace-sidebar-panel">
      <MobileToolbar testID="sidebar-toolbar">
        <MobileIconButton accessibilityLabel={mobileText('sidebar.action.collapse')} testID="sidebar-collapse-action">
          <SidebarSimple color={mobileColors.textMuted} size={desktopToolbarActionParity.iconSize} />
        </MobileIconButton>
        <Text numberOfLines={1} style={styles.vaultTitle} testID="sidebar-toolbar-title">{title}</Text>
      </MobileToolbar>
      <ScrollView {...layoutProbe.probe('sidebar.scroll')} contentContainerStyle={styles.content}>
        {sections.map((section) => (
          <View
            key={section.id}
            style={[styles.section, section.id === 'primary' ? styles.primarySection : styles.groupSection]}
            testID={`sidebar-section-${section.id}`}
          >
            {section.label ? <SectionTitle count={section.count} label={sidebarSectionLabel(section.id, section.label)} layoutProbe={layoutProbe.probe} sectionId={section.id} /> : null}
            {section.items?.map((item) => {
              const active = activeItemId ? item.id === activeItemId : item.active
              const label = sidebarLabel(item.id, item.label)
              const activeColor = sidebarActiveColor(item.tone)
              const metricId = `sidebar.item.${item.id}`

              return (
                <SidebarItem
                  active={active}
                  activeBackgroundColor={sidebarActiveBackgroundColor(item.tone)}
                  activeColor={activeColor}
                  count={item.count}
                  icon={sidebarIcon(item.icon, active ? item.tone ?? 'primary' : item.tone)}
                  key={item.id}
                  label={label}
                  layoutProbe={layoutProbe.probe}
                  metricId={metricId}
                  slug={item.id}
                  onPress={() => onSelectItem?.({
                    count: item.count,
                    id: item.id,
                    label,
                    sectionId: section.id,
                    viewId: item.viewId,
                  })}
                />
              )
            })}
            {section.folders ? (
              <FolderTree
                activeFolderId={activeFolderId}
                folders={section.folders}
                layoutProbe={layoutProbe.probe}
                onSelectFolder={onSelectFolder}
              />
            ) : null}
          </View>
        ))}
      </ScrollView>
      {layoutProbeEnabled ? <MobileLayoutProbeReadout metrics={layoutProbe.metrics} testID="sidebar-layout-metrics" /> : null}
    </MobilePanel>
  )
}

function SidebarItem({
  active = false,
  activeBackgroundColor = mobileColors.primarySoft,
  activeColor = mobileColors.primary,
  count,
  icon,
  label,
  layoutProbe,
  metricId,
  onPress,
  slug,
}: {
  active?: boolean
  activeBackgroundColor?: string
  activeColor?: string
  count?: string
  icon: ReactNode
  label: string
  layoutProbe?: MobileLayoutProbe
  metricId: string
  onPress?: () => void
  slug: string
}) {
  return (
    <Pressable
      {...probeProps(layoutProbe, `${metricId}.row`)}
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.item,
        sidebarItemPadding(Boolean(count)),
        active ? { backgroundColor: activeBackgroundColor } : null,
      ]}
      testID={`sidebar-item-${slug}`}
    >
      <View {...probeProps(layoutProbe, `${metricId}.content`)} style={styles.itemContent}>
        {icon}
        <Text
          {...probeProps(layoutProbe, `${metricId}.label`)}
          numberOfLines={1}
          style={[styles.itemText, nativeItemTextStyle, active ? { color: activeColor } : null]}
          testID={`sidebar-item-${slug}-label`}
        >
          {label}
        </Text>
        {count ? (
          <MobileSidebarCountPill
            activeColor={active ? activeColor : undefined}
            testID={`sidebar-item-${slug}-count`}
            value={count}
          />
        ) : null}
      </View>
    </Pressable>
  )
}

function SectionTitle({
  count,
  label,
  layoutProbe,
  sectionId,
}: {
  count?: string
  label: string
  layoutProbe?: MobileLayoutProbe
  sectionId: string
}) {
  const metricId = `sidebar.section.${sectionId}`

  return (
    <View
      {...probeProps(layoutProbe, `${metricId}.row`)}
      style={[styles.sectionTitleRow, nativeSectionTitleRowStyle, count ? styles.sectionTitleRowWithCount : styles.sectionTitleRowRegular]}
      testID={`sidebar-section-title-${sectionId}`}
    >
      <CaretDown color={mobileColors.textMuted} size={11} />
      <Text
        {...probeProps(layoutProbe, `${metricId}.label`)}
        style={[styles.sectionTitle, nativeSectionTitleTextStyle]}
        testID={`sidebar-section-title-text-${sectionId}`}
      >
        {label}
      </Text>
      {count ? <MobileSidebarCountPill compact testID={`sidebar-section-count-${sectionId}`} value={count} /> : null}
    </View>
  )
}

function sidebarIcon(icon: MobileSidebarIcon, tone?: MobileNote['typeTone'] | 'primary') {
  const color = sidebarIconColor(tone)

  if (icon === 'archive') return <Archive color={color} size={15} />
  if (icon === 'folder') return <FolderOpen color={color} size={15} />
  if (icon === 'inbox') return <Tray color={color} size={15} />
  if (icon === 'procedure') return <StackSimple color={color} size={15} />
  if (icon === 'star') return <Star color={color} size={15} />
  if (icon === 'tag') return <Tag color={color} size={15} />
  if (icon === 'view') return <Funnel color={color} size={15} />

  return <FileText color={color} size={15} />
}

function sidebarIconColor(tone?: MobileNote['typeTone'] | 'primary') {
  if (tone === 'primary') return mobileColors.primary
  if (tone) return noteTypeColor(tone)

  return mobileColors.textMuted
}

function sidebarActiveColor(tone?: MobileNote['typeTone']) {
  return tone ? noteTypeColor(tone) : mobileColors.primary
}

function sidebarActiveBackgroundColor(tone?: MobileNote['typeTone']) {
  return tone ? noteTypeSoftColor(tone) : mobileColors.primarySoft
}

function sidebarLabel(id: string, fallback: string) {
  if (id === 'all-notes') return mobileCopy.allNotes
  if (id === 'archive') return mobileCopy.archive
  if (id === 'inbox') return mobileCopy.inbox

  return fallback
}

function sidebarSectionLabel(id: string, fallback: string) {
  if (id === 'folders') return mobileText('sidebar.group.folders')
  if (id === 'favorites') return mobileCopy.favorites
  if (id === 'types') return mobileCopy.types
  if (id === 'views') return mobileCopy.views

  return fallback
}

const panelStyles = StyleSheet.create({
  content: { padding: 0 },
  groupSection: { paddingHorizontal: desktopSidebarParity.sectionHorizontalPadding },
  panel: {
    alignSelf: 'stretch',
    width: desktopPanelParity.sidebarWidth,
    height: '100%',
    backgroundColor: mobileColors.sidebar,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  primarySection: {
    paddingBottom: desktopSidebarParity.topNavPadding.bottom,
    paddingLeft: desktopSidebarParity.topNavPadding.left,
    paddingRight: desktopSidebarParity.topNavPadding.right,
    paddingTop: desktopSidebarParity.topNavPadding.top,
  },
  section: { borderBottomColor: mobileColors.border, borderBottomWidth: StyleSheet.hairlineWidth },
  vaultTitle: {
    flex: 1,
    color: mobileColors.text,
    fontSize: mobileType.body,
    fontWeight: '600',
  },
})

const itemStyles = StyleSheet.create({
  item: {
    justifyContent: 'center',
    borderRadius: desktopSidebarParity.itemRadius,
    width: '100%',
  },
  itemContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: desktopSidebarParity.itemGap,
  },
  itemPressed: { backgroundColor: mobileColors.control },
  itemText: {
    flex: 1,
    color: mobileColors.text,
    fontSize: desktopSidebarParity.itemTextSize,
    fontWeight: '500',
  },
})

const sectionTitleStyles = StyleSheet.create({
  sectionTitle: {
    flex: 1,
    color: mobileColors.textMuted,
    fontSize: desktopSidebarParity.countPillTextSize,
    fontWeight: desktopSidebarParity.sectionTitleFontWeight,
    letterSpacing: desktopSidebarParity.sectionTitleLetterSpacing,
  },
  sectionTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.xs,
  },
  sectionTitleRowRegular: {
    paddingBottom: desktopSidebarParity.groupHeaderPadding.regular.bottom,
    paddingLeft: desktopSidebarParity.groupHeaderPadding.regular.left,
    paddingRight: desktopSidebarParity.groupHeaderPadding.regular.right,
    paddingTop: desktopSidebarParity.groupHeaderPadding.regular.top,
  },
  sectionTitleRowWithCount: {
    paddingBottom: desktopSidebarParity.groupHeaderPadding.withCount.bottom,
    paddingLeft: desktopSidebarParity.groupHeaderPadding.withCount.left,
    paddingRight: desktopSidebarParity.groupHeaderPadding.withCount.right,
    paddingTop: desktopSidebarParity.groupHeaderPadding.withCount.top,
  },
})

const styles = {
  ...panelStyles,
  ...itemStyles,
  ...sectionTitleStyles,
} as const

const nativeRowStyles = StyleSheet.create({
  sectionTitleRow: { minHeight: 30 },
})

const nativeTextStyles = StyleSheet.create({
  itemText: { lineHeight: 18 },
  sectionTitle: { lineHeight: 14 },
})

const nativeItemTextStyle = Platform.OS === 'web' ? null : nativeTextStyles.itemText
const nativeSectionTitleRowStyle = Platform.OS === 'web' ? null : nativeRowStyles.sectionTitleRow
const nativeSectionTitleTextStyle = Platform.OS === 'web' ? null : nativeTextStyles.sectionTitle


function sidebarItemPadding(hasCount: boolean) {
  const padding = hasCount ? desktopSidebarParity.itemPadding.withCount : desktopSidebarParity.itemPadding.regular

  return {
    paddingBottom: padding.bottom,
    paddingLeft: padding.left,
    paddingRight: padding.right,
    paddingTop: padding.top,
  }
}
