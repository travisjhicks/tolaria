import type { ReactNode } from 'react'
import {
  Archive,
  CaretDown,
  CaretRight,
  FileText,
  Folder,
  FolderOpen,
  SidebarSimple,
  StackSimple,
  Star,
  Tag,
  Tray,
} from 'phosphor-react-native'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Text } from '../ui/text'
import { mobileCopy, mobileText } from '../../i18n/mobileText'
import { MobileIconButton } from '../../ui/MobileIconButton'
import { MobilePanel, MobileToolbar } from '../../ui/MobilePanel'
import { mobileColors, mobileRadius, mobileSpace, mobileType } from '../../ui/tokens'
import type {
  MobileNote,
  MobileSidebarFolder,
  MobileSidebarIcon,
  MobileSidebarSection,
} from '../../workspace/mobileWorkspaceModel'
import { noteTypeColor } from './mobileWorkspaceTone'

export type MobileSidebarFolderSelection = {
  id: string
  name: string
}

export type MobileSidebarItemSelection = {
  count?: string
  id: string
  label: string
  sectionId: string
}

export function MobileWorkspaceSidebar({
  activeFolderId,
  activeItemId,
  onSelectFolder,
  onSelectItem,
  sections,
  title = 'Tolaria Vault',
}: {
  activeFolderId?: string | null
  activeItemId?: string | null
  onSelectFolder?: (selection: MobileSidebarFolderSelection) => void
  onSelectItem?: (selection: MobileSidebarItemSelection) => void
  sections: MobileSidebarSection[]
  title?: string
}) {
  return (
    <MobilePanel style={styles.panel}>
      <MobileToolbar>
        <MobileIconButton accessibilityLabel={mobileText('sidebar.action.collapse')}>
          <SidebarSimple color={mobileColors.textMuted} size={20} />
        </MobileIconButton>
        <Text numberOfLines={1} style={styles.vaultTitle}>{title}</Text>
      </MobileToolbar>
      <ScrollView contentContainerStyle={styles.content}>
        {sections.map((section) => (
          <View key={section.id}>
            {section.label ? <SectionTitle count={section.count} label={sidebarSectionLabel(section.id, section.label)} /> : null}
            {section.items?.map((item) => {
              const active = activeItemId ? item.id === activeItemId : item.active
              const label = sidebarLabel(item.id, item.label)

              return (
                <SidebarItem
                  active={active}
                  count={item.count}
                  icon={sidebarIcon(item.icon, active ? 'primary' : item.tone)}
                  key={item.id}
                  label={label}
                  onPress={() => onSelectItem?.({
                    count: item.count,
                    id: item.id,
                    label,
                    sectionId: section.id,
                  })}
                />
              )
            })}
            {section.folders ? (
              <FolderTree
                activeFolderId={activeFolderId}
                folders={section.folders}
                onSelectFolder={onSelectFolder}
              />
            ) : null}
          </View>
        ))}
      </ScrollView>
    </MobilePanel>
  )
}

function SidebarItem({
  active = false,
  count,
  icon,
  label,
  onPress,
}: {
  active?: boolean
  count?: string
  icon: ReactNode
  label: string
  onPress?: () => void
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.item, active ? styles.itemActive : null, pressed ? styles.itemPressed : null]}
    >
      <View style={styles.itemContent}>
        {icon}
        <Text numberOfLines={1} style={[styles.itemText, active ? styles.itemTextActive : null]}>{label}</Text>
        {count ? <Text style={[styles.count, active ? styles.countActive : null]}>{count}</Text> : null}
      </View>
    </Pressable>
  )
}

function SectionTitle({
  count,
  label,
}: {
  count?: string
  label: string
}) {
  return (
    <View style={styles.sectionTitleRow}>
      <CaretDown color={mobileColors.textMuted} size={11} />
      <Text style={styles.sectionTitle}>{label}</Text>
      {count ? <Text style={styles.sectionCount}>{count}</Text> : null}
    </View>
  )
}

function FolderTree({
  activeFolderId,
  folders,
  onSelectFolder,
}: {
  activeFolderId?: string | null
  folders: MobileSidebarFolder[]
  onSelectFolder?: (selection: MobileSidebarFolderSelection) => void
}) {
  return (
    <View style={folderTreeStyles.tree}>
      {folders.map((folder) => (
        <FolderTreeRow
          activeFolderId={activeFolderId}
          depth={0}
          folder={folder}
          key={folder.id}
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
  onSelectFolder,
}: {
  activeFolderId?: string | null
  depth: number
  folder: MobileSidebarFolder
  onSelectFolder?: (selection: MobileSidebarFolderSelection) => void
}) {
  const hasChildren = folder.children.length > 0
  const active = activeFolderId ? folder.id === activeFolderId : folder.active

  return (
    <View>
      <Pressable
        accessibilityLabel={folder.name}
        accessibilityRole="button"
        onPress={() => onSelectFolder?.({ id: folder.id, name: folder.name })}
        style={({ pressed }) => [
          folderTreeStyles.row,
          active ? folderTreeStyles.rowActive : null,
          pressed ? folderTreeStyles.rowPressed : null,
          folderTreeIndent(depth),
        ]}
      >
        <View style={folderTreeStyles.rowContent}>
          <FolderTreeCaret expanded={folder.expanded} hasChildren={hasChildren} />
          <FolderTreeIcon active={active} expanded={folder.expanded} />
          <Text numberOfLines={1} style={[folderTreeStyles.rowText, active ? folderTreeStyles.rowTextActive : null]}>{folder.name}</Text>
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
              onSelectFolder={onSelectFolder}
            />
          ))}
        </View>
      ) : null}
    </View>
  )
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

function folderTreeIndent(depth: number) {
  return { paddingLeft: mobileSpace.md + depth * 16 }
}

function sidebarIcon(icon: MobileSidebarIcon, tone?: MobileNote['typeTone'] | 'primary') {
  const color = sidebarIconColor(tone)

  if (icon === 'archive') return <Archive color={color} size={15} />
  if (icon === 'folder') return <FolderOpen color={color} size={15} />
  if (icon === 'inbox') return <Tray color={color} size={15} />
  if (icon === 'procedure') return <StackSimple color={color} size={15} />
  if (icon === 'star') return <Star color={color} size={15} />
  if (icon === 'tag') return <Tag color={color} size={15} />

  return <FileText color={color} size={15} />
}

function sidebarIconColor(tone?: MobileNote['typeTone'] | 'primary') {
  if (tone === 'primary') return mobileColors.primary
  if (tone) return noteTypeColor(tone)

  return mobileColors.textMuted
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

  return fallback
}

const styles = StyleSheet.create({
  content: {
    padding: mobileSpace.sm,
  },
  count: {
    minWidth: 22,
    height: 18,
    overflow: 'hidden',
    borderRadius: mobileRadius.pill,
    backgroundColor: mobileColors.graySoft,
    color: mobileColors.textMuted,
    fontSize: mobileType.micro,
    fontWeight: '400',
    paddingHorizontal: 6,
    textAlign: 'center',
  },
  countActive: {
    backgroundColor: mobileColors.primary,
    color: mobileColors.textInverse,
  },
  item: {
    minHeight: 34,
    justifyContent: 'center',
    borderRadius: mobileRadius.md,
    width: '100%',
  },
  itemContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.sm,
    paddingHorizontal: mobileSpace.md,
  },
  itemActive: {
    backgroundColor: mobileColors.selected,
  },
  itemPressed: {
    backgroundColor: mobileColors.graySoft,
  },
  itemText: {
    flex: 1,
    color: mobileColors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  itemTextActive: {
    color: mobileColors.primary,
    fontWeight: '600',
  },
  panel: {
    alignSelf: 'stretch',
    width: 260,
    height: '100%',
    backgroundColor: mobileColors.sidebar,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  sectionCount: {
    color: mobileColors.textMuted,
    fontSize: mobileType.micro,
    fontWeight: '400',
  },
  sectionTitle: {
    flex: 1,
    color: mobileColors.textMuted,
    fontSize: mobileType.micro,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sectionTitleRow: {
    minHeight: 32,
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.xs,
    marginTop: mobileSpace.md,
    paddingHorizontal: mobileSpace.sm,
  },
  vaultTitle: {
    flex: 1,
    color: mobileColors.text,
    fontSize: mobileType.body,
    fontWeight: '600',
  },
})

const folderTreeStyles = StyleSheet.create({
  caretSpacer: {
    width: 11,
  },
  children: {
    position: 'relative',
  },
  row: {
    minHeight: 32,
    justifyContent: 'center',
    borderRadius: mobileRadius.sm,
    paddingRight: mobileSpace.md,
    width: '100%',
  },
  rowContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.sm,
  },
  rowActive: {
    backgroundColor: mobileColors.selected,
  },
  rowPressed: {
    backgroundColor: mobileColors.graySoft,
  },
  rowText: {
    flex: 1,
    color: mobileColors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  rowTextActive: {
    color: mobileColors.primary,
    fontWeight: '600',
  },
  tree: {
    gap: mobileSpace.xs,
    paddingBottom: mobileSpace.sm,
  },
})
