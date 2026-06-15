import { CaretDown, CaretRight, Folder, FolderOpen } from 'phosphor-react-native'
import { Platform, Pressable, StyleSheet, View } from 'react-native'
import { Text } from '../ui/text'
import { probeProps, type MobileLayoutProbe } from '../../qa/mobileLayoutProbe'
import { desktopSidebarParity } from '../../ui/desktopParity'
import { mobileColors } from '../../ui/tokens'
import type { MobileSidebarFolder } from '../../workspace/mobileWorkspaceModel'

export type MobileSidebarFolderSelection = {
  id: string
  name: string
}

export function FolderTree({
  activeFolderId,
  folders,
  layoutProbe,
  onSelectFolder,
}: {
  activeFolderId?: string | null
  folders: MobileSidebarFolder[]
  layoutProbe?: MobileLayoutProbe
  onSelectFolder?: (selection: MobileSidebarFolderSelection) => void
}) {
  return (
    <View {...probeProps(layoutProbe, 'sidebar.folderTree.root')} style={folderTreeStyles.tree}>
      {folders.map((folder) => (
        <FolderTreeRow
          activeFolderId={activeFolderId}
          depth={0}
          folder={folder}
          key={folder.id}
          layoutProbe={layoutProbe}
          onSelectFolder={onSelectFolder}
        />
      ))}
    </View>
  )
}

function FolderTreeRow({
  activeFolderId,
  depth,
  folder,
  layoutProbe,
  onSelectFolder,
}: {
  activeFolderId?: string | null
  depth: number
  folder: MobileSidebarFolder
  layoutProbe?: MobileLayoutProbe
  onSelectFolder?: (selection: MobileSidebarFolderSelection) => void
}) {
  const hasChildren = folder.children.length > 0
  const active = activeFolderId ? folder.id === activeFolderId : folder.active
  const metricId = `sidebar.folder.${folder.id}`

  return (
    <View {...probeProps(layoutProbe, `${metricId}.container`)}>
      <Pressable
        {...probeProps(layoutProbe, `${metricId}.row`)}
        accessibilityLabel={folder.name}
        accessibilityRole="button"
        onPress={() => onSelectFolder?.({ id: folder.id, name: folder.name })}
        style={[
          folderTreeStyles.row,
          nativeFolderTreeRowStyle,
          active ? folderTreeStyles.rowActive : null,
          folderTreeIndent(depth),
        ]}
      >
        <View {...probeProps(layoutProbe, `${metricId}.content`)} style={folderTreeStyles.rowContent}>
          <FolderTreeCaret expanded={folder.expanded} hasChildren={hasChildren} />
          <FolderTreeIcon active={active} expanded={folder.expanded} />
          <Text
            {...probeProps(layoutProbe, `${metricId}.label`)}
            numberOfLines={1}
            style={[folderTreeStyles.rowText, nativeFolderTreeTextStyle, active ? folderTreeStyles.rowTextActive : null]}
          >
            {folder.name}
          </Text>
        </View>
      </Pressable>
      {folder.expanded && hasChildren ? (
        <View style={folderTreeStyles.children}>
          {folder.children.map((child) => (
            <FolderTreeRow
              activeFolderId={activeFolderId}
              depth={depth + 1}
              folder={child}
              key={child.id}
              layoutProbe={layoutProbe}
              onSelectFolder={onSelectFolder}
            />
          ))}
        </View>
      ) : null}
    </View>
  )
}

const folderTreeLayoutStyles = StyleSheet.create({
  caretSpacer: {
    width: 11,
  },
  children: {
    position: 'relative',
  },
  tree: {
    gap: 2,
    paddingBottom: desktopSidebarParity.sectionContentPaddingBottom,
  },
})

const folderTreeRowStyles = StyleSheet.create({
  row: {
    justifyContent: 'center',
    borderRadius: desktopSidebarParity.itemRadius,
    paddingBottom: desktopSidebarParity.itemPadding.regular.bottom,
    paddingRight: desktopSidebarParity.itemPadding.regular.right,
    paddingTop: desktopSidebarParity.itemPadding.regular.top,
    width: '100%',
  },
})

const folderTreeStateStyles = StyleSheet.create({
  rowActive: {
    backgroundColor: mobileColors.primarySoft,
  },
})

const folderTreeContentStyles = StyleSheet.create({
  rowContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: desktopSidebarParity.folderIconGap,
  },
})

const folderTreeTextStyles = StyleSheet.create({
  rowText: {
    flex: 1,
    color: mobileColors.text,
    fontSize: desktopSidebarParity.itemTextSize,
    fontWeight: '500',
  },
  rowTextActive: { color: mobileColors.primary, fontWeight: '600' },
})

const folderTreeStyles = {
  ...folderTreeLayoutStyles,
  ...folderTreeRowStyles,
  ...folderTreeStateStyles,
  ...folderTreeContentStyles,
  ...folderTreeTextStyles,
} as const

const nativeFolderTreeStyles = StyleSheet.create({
  row: { minHeight: 30 },
  text: { lineHeight: 18 },
})

const nativeFolderTreeRowStyle = Platform.OS === 'web' ? null : nativeFolderTreeStyles.row
const nativeFolderTreeTextStyle = Platform.OS === 'web' ? null : nativeFolderTreeStyles.text

function folderTreeIndent(depth: number) {
  return {
    paddingLeft: desktopSidebarParity.folderRowContentInset
      + depth * desktopSidebarParity.folderRowIndent,
  }
}

function FolderTreeCaret({
  expanded,
  hasChildren,
}: {
  expanded?: boolean
  hasChildren: boolean
}) {
  if (!hasChildren) {
    return <View style={folderTreeStyles.caretSpacer} />
  }

  return expanded ? <CaretDown color={mobileColors.textMuted} size={11} /> : <CaretRight color={mobileColors.textMuted} size={11} />
}

function FolderTreeIcon({
  active,
  expanded,
}: {
  active?: boolean
  expanded?: boolean
}) {
  const iconColor = active ? mobileColors.primary : mobileColors.textMuted

  if (active || expanded) {
    return <FolderOpen color={iconColor} size={16} weight={active ? 'fill' : 'regular'} />
  }

  return <Folder color={iconColor} size={16} />
}
