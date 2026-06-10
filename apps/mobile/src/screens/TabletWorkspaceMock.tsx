import { useState, type ReactNode } from 'react'
import {
  Archive,
  CaretDown,
  CaretRight,
  DotsThree,
  Folder,
  FileText,
  FolderOpen,
  MagnifyingGlass,
  Plus,
  SidebarSimple,
  StackSimple,
  Star,
  Tag,
  Tray,
  X,
} from 'phosphor-react-native'
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native'
import {
  workspaceScenarios,
  type FixtureNote,
  type FixtureRelationship,
  type FixtureRelationshipValue,
  type FixtureSidebarFolder,
  type FixtureSidebarIcon,
  type FixtureSidebarSection,
  type FixtureSyncStatus,
  type WorkspaceScenario,
} from '../fixtures/workspaceFixtures'
import { Text } from '../components/ui/text'
import { mobileCopy, mobileText } from '../i18n/mobileText'
import { MobileButton } from '../ui/MobileButton'
import { MobileChip } from '../ui/MobileChip'
import { MobileIconButton } from '../ui/MobileIconButton'
import { MobileListRow } from '../ui/MobileListRow'
import { MobilePanel, MobileToolbar, MobileToolbarSpacer, MobileToolbarTitle } from '../ui/MobilePanel'
import { MobilePropertyRow } from '../ui/MobilePropertyRow'
import { mobileColors, mobileRadius, mobileSpace, mobileType } from '../ui/tokens'

export function TabletWorkspaceMock({
  scenario = workspaceScenarios.default,
}: {
  scenario?: WorkspaceScenario
}) {
  const { width } = useWindowDimensions()
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(scenario.selectedNoteId ?? scenario.notes[0]?.id ?? null)
  const selectedNote = scenario.notes.find((note) => note.id === selectedNoteId) ?? scenario.notes[0] ?? null
  const compactTablet = width < 1180

  return (
    <View style={layoutStyles.shellRoot}>
      <View style={layoutStyles.shell}>
        {compactTablet ? null : <SidebarPanel sections={scenario.sidebarSections} />}
        <NoteListPanel
          compact={compactTablet}
          notes={scenario.notes}
          searchQuery={scenario.searchQuery}
          selectedNoteId={selectedNoteId}
          subtitle={scenario.noteListSubtitle}
          onSelectNote={setSelectedNoteId}
        />
        <EditorPanel compact={compactTablet} note={selectedNote} bullets={scenario.editorBullets} />
        <PropertiesPanel compact={compactTablet} note={selectedNote} />
      </View>
      <SyncStatusBar sync={scenario.sync} />
    </View>
  )
}

function SyncStatusBar({ sync }: { sync: FixtureSyncStatus }) {
  return (
    <View style={layoutStyles.syncBar}>
      <View style={layoutStyles.syncStatusGroup}>
        <Tray color={syncStatusColor(sync)} size={16} />
        <Text numberOfLines={1} style={layoutStyles.syncStatusText}>{syncStatusLabel(sync)}</Text>
        <Text numberOfLines={1} style={layoutStyles.syncDetailText}>{syncStatusDetail(sync)}</Text>
      </View>
      <MobileButton icon={<Tray color={mobileColors.text} size={14} />} label={mobileText('status.sync.now')} variant="ghost" />
    </View>
  )
}

function SidebarPanel({ sections }: { sections: FixtureSidebarSection[] }) {
  return (
    <MobilePanel style={sidebarStyles.panel}>
      <MobileToolbar>
        <MobileIconButton accessibilityLabel={mobileText('sidebar.action.collapse')}>
          <SidebarSimple color={mobileColors.textMuted} size={20} />
        </MobileIconButton>
        <Text numberOfLines={1} style={sidebarStyles.vaultTitle}>Tolaria Vault</Text>
      </MobileToolbar>
      <ScrollView contentContainerStyle={sidebarStyles.content}>
        {sections.map((section) => (
          <View key={section.id}>
            {section.label ? <SectionTitle count={section.count} label={sidebarSectionLabel(section.id, section.label)} /> : null}
            {section.items?.map((item) => (
              <SidebarItem
                active={item.active}
                count={item.count}
                icon={sidebarIcon(item.icon, item.active ? 'primary' : item.tone)}
                key={item.id}
                label={sidebarLabel(item.id, item.label)}
              />
            ))}
            {section.folders ? <FolderTree folders={section.folders} /> : null}
          </View>
        ))}
      </ScrollView>
    </MobilePanel>
  )
}

function NoteListPanel({
  compact,
  notes,
  onSelectNote,
  searchQuery,
  selectedNoteId,
  subtitle,
}: {
  compact: boolean
  notes: FixtureNote[]
  onSelectNote: (noteId: string) => void
  searchQuery?: string
  selectedNoteId: string | null
  subtitle: string
}) {
  return (
    <MobilePanel style={[noteListStyles.panel, compact ? noteListStyles.panelCompact : null]}>
      <MobileToolbar>
        <View style={noteListStyles.toolbarTitleBlock}>
          <MobileToolbarTitle title={mobileCopy.inbox} />
          <Text style={noteListStyles.toolbarSubtitle}>{subtitle}</Text>
        </View>
        <MobileToolbarSpacer />
        <MobileIconButton accessibilityLabel={mobileCopy.searchNotes}>
          <MagnifyingGlass color={mobileColors.textMuted} size={20} />
        </MobileIconButton>
        <MobileIconButton accessibilityLabel={mobileCopy.createNote}>
          <Plus color={mobileColors.textMuted} size={20} />
        </MobileIconButton>
      </MobileToolbar>
      {searchQuery ? (
        <View style={noteListStyles.searchPill}>
          <MagnifyingGlass color={mobileColors.textMuted} size={16} />
          <Text numberOfLines={1} style={noteListStyles.searchText}>{searchQuery}</Text>
        </View>
      ) : null}
      {notes.length === 0 ? (
        <NoteListEmptyState />
      ) : (
        <ScrollView>
          {notes.map((note) => (
            <MobileListRow
              chips={<NoteRowChips note={note} />}
              key={note.id}
              leading={<NoteTypeDot note={note} />}
              selected={note.id === selectedNoteId}
              subtitle={note.snippet}
              title={note.title}
              trailing={<NoteTypeIcon note={note} />}
              onPress={() => onSelectNote(note.id)}
            />
          ))}
        </ScrollView>
      )}
    </MobilePanel>
  )
}

function EditorPanel({
  bullets,
  compact,
  note,
}: {
  bullets: string[]
  compact: boolean
  note: FixtureNote | null
}) {
  if (!note) {
    return (
      <MobilePanel style={editorStyles.panel}>
        <MobileToolbar>
          <FileText color={mobileColors.textMuted} size={18} />
          <MobileToolbarTitle title={mobileText('inspector.empty.noNoteSelected')} />
        </MobileToolbar>
        <View style={editorStyles.emptyState}>
          <Text style={editorStyles.emptyTitle}>{mobileText('editor.empty.selectNote')}</Text>
        </View>
      </MobilePanel>
    )
  }

  return (
    <MobilePanel style={editorStyles.panel}>
      <MobileToolbar>
        <FileText color={mobileColors.textMuted} size={18} />
        <MobileToolbarTitle title={note.title} />
        <MobileChip label={note.workspace} tone="gray" />
        <MobileIconButton accessibilityLabel={mobileText('command.note.addFavorite')}>
          <Star color={note.favorite ? mobileColors.primary : mobileColors.textMuted} size={18} weight={note.favorite ? 'fill' : 'regular'} />
        </MobileIconButton>
        <MobileIconButton accessibilityLabel={mobileText('command.group.note')}>
          <DotsThree color={mobileColors.textMuted} size={20} weight="bold" />
        </MobileIconButton>
      </MobileToolbar>
      <ScrollView contentContainerStyle={[editorStyles.content, compact ? editorStyles.contentCompact : null]}>
        <Text style={[editorStyles.title, compact ? editorStyles.titleCompact : null]}>{note.title}</Text>
        {bullets.map((item) => (
          <View key={item} style={editorStyles.bulletRow}>
            <Text style={editorStyles.bullet}>•</Text>
            <Text style={editorStyles.text}>{item}</Text>
          </View>
        ))}
      </ScrollView>
    </MobilePanel>
  )
}

function PropertiesPanel({
  compact,
  note,
}: {
  compact: boolean
  note: FixtureNote | null
}) {
  return (
    <MobilePanel style={[propertyStyles.panel, compact ? propertyStyles.panelCompact : null]}>
      <MobileToolbar>
        <MobileToolbarTitle title={mobileCopy.properties} />
      </MobileToolbar>
      <ScrollView contentContainerStyle={propertyStyles.content}>
        {note ? (
          <>
            <MobilePropertyRow label="Type" value={<MobileChip label={note.type} tone={note.typeTone} />} />
            <MobilePropertyRow label={mobileText('noteList.sort.status')} value={<MobileChip label={note.status} tone={statusTone(note.status)} />} />
            <MobilePropertyRow label={mobileText('noteList.sort.created')} value={note.created} />
            <MobilePropertyRow label={mobileCopy.modified} value={note.modified} />
            <MobilePropertyRow label={mobileText('inspector.properties.workspace')} value={<WorkspaceBadge label={note.workspace} />} />
            <PropertySection label="Tags">
              <TagWrap labels={note.tags} />
            </PropertySection>
            <MobilePropertyRow label="Links" value={`${note.links}`} />
            <SectionTitle label="Relationships" />
            {note.relationships.map((relationship) => (
              <PropertySection
                key={`${relationship.kind}-${relationship.label ?? relationship.values.map((value) => value.title).join('-')}`}
                label={relationshipHeading(relationship)}
              >
                <RelationshipValues values={relationship.values} />
              </PropertySection>
            ))}
            <MobileButton
              icon={<Plus color={mobileColors.text} size={14} />}
              label={mobileText('inspector.properties.addProperty')}
              style={propertyStyles.fullWidthButton}
              variant="secondary"
            />
            <MobileButton
              icon={<Plus color={mobileColors.text} size={14} />}
              label={mobileText('inspector.relationship.addRelationship')}
              style={propertyStyles.fullWidthButton}
              variant="secondary"
            />
          </>
        ) : (
          <View style={propertyStyles.emptyState}>
            <Text style={propertyStyles.emptyTitle}>{mobileText('inspector.empty.noNoteSelected')}</Text>
            <Text style={propertyStyles.emptyText}>{mobileText('inspector.empty.noProperties')}</Text>
          </View>
        )}
      </ScrollView>
    </MobilePanel>
  )
}

function NoteListEmptyState() {
  return (
    <View style={noteListStyles.emptyState}>
      <Text style={noteListStyles.emptyTitle}>{mobileText('noteList.empty.allOrganized')}</Text>
      <Text style={noteListStyles.emptyText}>{mobileText('noteList.empty.noNotes')}</Text>
    </View>
  )
}

function NoteRowChips({ note }: { note: FixtureNote }) {
  return (
    <View style={noteListStyles.chipRow}>
      <MobileChip label={note.type} tone={note.typeTone} />
      <MobileChip label={note.status} tone={statusTone(note.status)} />
      {note.tags.slice(0, 1).map((tag) => <MobileChip key={tag} label={tag} tone="gray" />)}
    </View>
  )
}

function PropertySection({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  return (
    <View style={propertyStyles.sectionRow}>
      <Text style={propertyStyles.sectionLabel}>{label}</Text>
      <View style={propertyStyles.sectionValue}>{children}</View>
    </View>
  )
}

function RelationshipValues({ values }: { values: FixtureRelationshipValue[] }) {
  return (
    <View style={propertyStyles.relationshipValues}>
      {values.map((value) => (
        <View key={`${value.type}-${value.title}`} style={[propertyStyles.relationshipRow, relationshipToneStyles[value.typeTone]]}>
          <TypeIcon type={value.type} tone={value.typeTone} size={14} />
          <Text numberOfLines={1} style={[propertyStyles.relationshipText, relationshipTextToneStyles[value.typeTone]]}>{value.title}</Text>
          <View style={propertyStyles.relationshipRemove}>
            <X color={noteTypeColor(value.typeTone)} size={11} weight="bold" />
          </View>
        </View>
      ))}
    </View>
  )
}

function relationshipHeading(relationship: FixtureRelationship): string {
  if (relationship.kind === 'custom') {
    return relationship.label ?? 'Custom'
  }

  if (relationship.kind === 'belongsTo') return 'Belongs to'
  if (relationship.kind === 'has') return 'Has'
  return 'Related to'
}

function TagWrap({ labels }: { labels: string[] }) {
  return (
    <View style={propertyStyles.tagWrap}>
      {labels.map((label) => <MobileChip key={label} label={label} tone={tagTone(label)} />)}
    </View>
  )
}

function NoteTypeDot({ note }: { note: FixtureNote }) {
  return <View style={[noteListStyles.typeDot, noteTypeDotStyles[note.typeTone]]} />
}

function NoteTypeIcon({ note }: { note: FixtureNote }) {
  return <TypeIcon type={note.type} tone={note.typeTone} size={16} />
}

function TypeIcon({
  size,
  tone,
  type,
}: {
  size: number
  tone: FixtureNote['typeTone']
  type: string
}) {
  const normalizedType = type.toLowerCase()

  if (normalizedType.includes('release')) {
    return <Archive color={noteTypeColor(tone)} size={size} />
  }

  if (normalizedType.includes('procedure')) {
    return <StackSimple color={noteTypeColor(tone)} size={size} />
  }

  if (normalizedType.includes('project')) {
    return <FolderOpen color={noteTypeColor(tone)} size={size} />
  }

  return <FileText color={noteTypeColor(tone)} size={size} />
}

function FolderTree({ folders }: { folders: FixtureSidebarFolder[] }) {
  return (
    <View style={folderTreeStyles.tree}>
      {folders.map((folder) => <FolderTreeRow depth={0} folder={folder} key={folder.id} />)}
    </View>
  )
}

function FolderTreeRow({
  depth,
  folder,
}: {
  depth: number
  folder: FixtureSidebarFolder
}) {
  const hasChildren = folder.children.length > 0

  return (
    <View>
      <View style={[folderTreeStyles.row, folder.active ? folderTreeStyles.rowActive : null, folderTreeIndent(depth)]}>
        <FolderTreeCaret expanded={folder.expanded} hasChildren={hasChildren} />
        <FolderTreeIcon active={folder.active} expanded={folder.expanded} />
        <Text numberOfLines={1} style={[folderTreeStyles.rowText, folder.active ? folderTreeStyles.rowTextActive : null]}>{folder.name}</Text>
      </View>
      {folder.expanded && hasChildren ? (
        <View style={folderTreeStyles.children}>
          {folder.children.map((child) => <FolderTreeRow depth={depth + 1} folder={child} key={child.id} />)}
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

function noteTypeColor(tone: FixtureNote['typeTone']) {
  if (tone === 'green') return mobileColors.green
  if (tone === 'orange') return mobileColors.orange
  return mobileColors.purple
}

function tagTone(label: string): 'blue' | 'green' | 'orange' | 'purple' | 'red' {
  const tones = ['blue', 'green', 'orange', 'purple', 'red'] as const
  const index = Array.from(label).reduce((sum, char) => sum + char.charCodeAt(0), 0) % tones.length

  return tones[index]
}

function sidebarIcon(icon: FixtureSidebarIcon, tone?: FixtureNote['typeTone'] | 'primary') {
  const color = sidebarIconColor(tone)

  if (icon === 'archive') return <Archive color={color} size={15} />
  if (icon === 'folder') return <FolderOpen color={color} size={15} />
  if (icon === 'inbox') return <Tray color={color} size={15} />
  if (icon === 'procedure') return <StackSimple color={color} size={15} />
  if (icon === 'star') return <Star color={color} size={15} />
  if (icon === 'tag') return <Tag color={color} size={15} />

  return <FileText color={color} size={15} />
}

function sidebarIconColor(tone?: FixtureNote['typeTone'] | 'primary') {
  if (tone === 'primary') return mobileColors.primary
  if (tone === 'green') return mobileColors.green
  if (tone === 'orange') return mobileColors.orange
  if (tone === 'purple') return mobileColors.purple

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

function syncStatusColor(sync: FixtureSyncStatus) {
  if (sync.kind === 'conflict') return mobileColors.danger
  if (sync.kind === 'pullRequired') return mobileColors.orange

  return mobileColors.green
}

function syncStatusDetail(sync: FixtureSyncStatus) {
  if (sync.kind === 'conflict') return mobileText('status.sync.resolveConflicts')
  if (sync.kind === 'pullRequired') return mobileText('status.sync.pullAndPush')
  if (sync.minutesAgo) return mobileText('status.sync.minutesAgo').replace('{minutes}', `${sync.minutesAgo}`)

  return mobileText('status.sync.justNow')
}

function syncStatusLabel(sync: FixtureSyncStatus) {
  if (sync.kind === 'conflict') return mobileText('status.sync.conflict')
  if (sync.kind === 'pullRequired') return mobileText('status.sync.pullRequired')

  return mobileText('status.sync.synced')
}

function SidebarItem({
  active = false,
  count,
  icon,
  label,
}: {
  active?: boolean
  count?: string
  icon: ReactNode
  label: string
}) {
  return (
    <View style={[sidebarStyles.item, active ? sidebarStyles.itemActive : null]}>
      {icon}
      <Text numberOfLines={1} style={[sidebarStyles.itemText, active ? sidebarStyles.itemTextActive : null]}>{label}</Text>
      {count ? <Text style={[sidebarStyles.count, active ? sidebarStyles.countActive : null]}>{count}</Text> : null}
    </View>
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
    <View style={sidebarStyles.sectionTitleRow}>
      <CaretDown color={mobileColors.textMuted} size={11} />
      <Text style={sidebarStyles.sectionTitle}>{label}</Text>
      {count ? <Text style={sidebarStyles.sectionCount}>{count}</Text> : null}
    </View>
  )
}

function WorkspaceBadge({ label }: { label: string }) {
  return <Text style={sharedStyles.workspaceBadge}>{label}</Text>
}

function statusTone(status: string): 'blue' | 'green' | 'orange' {
  if (status === 'Shipped') return 'green'
  if (status === 'Active') return 'blue'
  return 'orange'
}

const noteTypeDotStyles = StyleSheet.create({
  green: {
    backgroundColor: mobileColors.green,
  },
  orange: {
    backgroundColor: mobileColors.orange,
  },
  purple: {
    backgroundColor: mobileColors.purple,
  },
})

const relationshipToneStyles = StyleSheet.create({
  green: {
    backgroundColor: mobileColors.greenSoft,
  },
  orange: {
    backgroundColor: mobileColors.orangeSoft,
  },
  purple: {
    backgroundColor: mobileColors.purpleSoft,
  },
})

const relationshipTextToneStyles = StyleSheet.create({
  green: {
    color: mobileColors.green,
  },
  orange: {
    color: mobileColors.orange,
  },
  purple: {
    color: mobileColors.purple,
  },
})

const layoutStyles = StyleSheet.create({
  shellRoot: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: mobileColors.app,
  },
  shell: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: mobileColors.app,
  },
  syncBar: {
    alignItems: 'center',
    backgroundColor: mobileColors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: mobileColors.border,
    flexDirection: 'row',
    gap: mobileSpace.md,
    justifyContent: 'space-between',
    minHeight: 40,
    paddingHorizontal: mobileSpace.lg,
  },
  syncStatusGroup: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.sm,
    flex: 1,
    minWidth: 0,
  },
  syncStatusText: {
    color: mobileColors.text,
    fontSize: mobileType.body,
    fontWeight: '700',
  },
  syncDetailText: {
    color: mobileColors.textMuted,
    fontSize: mobileType.micro,
  },
})

const sharedStyles = StyleSheet.create({
  chipStack: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mobileSpace.xs,
    justifyContent: 'flex-end',
  },
  workspaceBadge: {
    overflow: 'hidden',
    borderRadius: mobileRadius.md,
    backgroundColor: mobileColors.graySoft,
    color: mobileColors.textMuted,
    fontSize: mobileType.micro,
    fontWeight: '800',
    paddingHorizontal: mobileSpace.sm,
    paddingVertical: mobileSpace.xs,
  },
})

const sidebarStyles = StyleSheet.create({
  panel: {
    width: 260,
    backgroundColor: mobileColors.sidebar,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  content: {
    padding: mobileSpace.sm,
  },
  count: {
    minWidth: 30,
    overflow: 'hidden',
    borderRadius: mobileRadius.md,
    backgroundColor: mobileColors.graySoft,
    color: mobileColors.textMuted,
    fontSize: mobileType.micro,
    fontWeight: '700',
    paddingHorizontal: mobileSpace.xs,
    paddingVertical: mobileSpace.xs,
    textAlign: 'center',
  },
  countActive: {
    backgroundColor: mobileColors.primary,
    color: mobileColors.textInverse,
  },
  item: {
    minHeight: 34,
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.sm,
    borderRadius: mobileRadius.md,
    paddingHorizontal: mobileSpace.md,
  },
  itemActive: {
    backgroundColor: mobileColors.selected,
  },
  itemText: {
    flex: 1,
    color: mobileColors.text,
    fontSize: mobileType.body,
    fontWeight: '600',
  },
  itemTextActive: {
    color: mobileColors.primary,
  },
  sectionCount: {
    color: mobileColors.textMuted,
    fontSize: mobileType.micro,
    fontWeight: '700',
  },
  sectionTitle: {
    flex: 1,
    color: mobileColors.textMuted,
    fontSize: mobileType.micro,
    fontWeight: '800',
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
    fontWeight: '700',
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
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.sm,
    borderRadius: mobileRadius.sm,
    paddingRight: mobileSpace.md,
  },
  rowActive: {
    backgroundColor: mobileColors.selected,
  },
  rowText: {
    flex: 1,
    color: mobileColors.text,
    fontSize: mobileType.body,
    fontWeight: '600',
  },
  rowTextActive: {
    color: mobileColors.primary,
  },
  tree: {
    gap: mobileSpace.xs,
    paddingBottom: mobileSpace.sm,
  },
})

const noteListStyles = StyleSheet.create({
  chipRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mobileSpace.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: mobileSpace.xl,
  },
  emptyText: {
    marginTop: mobileSpace.sm,
    color: mobileColors.textMuted,
    fontSize: mobileType.body,
    textAlign: 'center',
  },
  emptyTitle: {
    color: mobileColors.text,
    fontSize: mobileType.title,
    fontWeight: '700',
    textAlign: 'center',
  },
  panel: {
    borderRightWidth: StyleSheet.hairlineWidth,
    width: 340,
  },
  panelCompact: {
    width: 336,
  },
  searchPill: {
    minHeight: 36,
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.sm,
    borderBottomColor: mobileColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: mobileSpace.lg,
  },
  searchText: {
    flex: 1,
    color: mobileColors.text,
    fontSize: mobileType.body,
    fontWeight: '600',
  },
  toolbarSubtitle: {
    color: mobileColors.textMuted,
    fontSize: mobileType.caption,
    fontWeight: '600',
  },
  toolbarTitleBlock: {
    minWidth: 0,
  },
  typeDot: {
    borderRadius: mobileRadius.pill,
    height: 8,
    width: 8,
  },
})

const editorStyles = StyleSheet.create({
  bullet: {
    color: mobileColors.primary,
    fontSize: 20,
    lineHeight: 30,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: mobileSpace.md,
    marginBottom: mobileSpace.lg,
  },
  content: {
    alignSelf: 'center',
    maxWidth: 700,
    paddingHorizontal: mobileSpace.xxl,
    paddingVertical: 40,
    width: '100%',
  },
  contentCompact: {
    paddingHorizontal: mobileSpace.xl,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: mobileSpace.xxl,
  },
  emptyTitle: {
    color: mobileColors.textMuted,
    fontSize: mobileType.title,
    fontWeight: '700',
    textAlign: 'center',
  },
  panel: {
    flex: 1,
  },
  text: {
    flex: 1,
    color: mobileColors.text,
    fontSize: mobileType.bodyLarge,
    lineHeight: 26,
  },
  title: {
    color: mobileColors.text,
    fontSize: mobileType.hero,
    fontWeight: '800',
    lineHeight: 40,
    marginBottom: mobileSpace.xl,
  },
  titleCompact: {
    fontSize: 30,
    lineHeight: 36,
  },
})

const propertyStyles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: mobileSpace.lg,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: mobileSpace.xxl,
  },
  emptyText: {
    marginTop: mobileSpace.sm,
    color: mobileColors.textMuted,
    fontSize: mobileType.body,
    textAlign: 'center',
  },
  emptyTitle: {
    color: mobileColors.text,
    fontSize: mobileType.title,
    fontWeight: '700',
    textAlign: 'center',
  },
  fullWidthButton: {
    marginTop: mobileSpace.lg,
  },
  panel: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    width: 300,
  },
  panelCompact: {
    width: 280,
  },
  relationshipRow: {
    minHeight: 34,
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.sm,
    borderRadius: mobileRadius.md,
    paddingHorizontal: mobileSpace.md,
    paddingVertical: mobileSpace.xs,
    width: '100%',
  },
  relationshipRemove: {
    minHeight: 18,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: mobileRadius.pill,
    backgroundColor: mobileColors.card,
  },
  relationshipText: {
    flex: 1,
    fontSize: mobileType.body,
    fontWeight: '700',
  },
  relationshipValues: {
    alignItems: 'stretch',
    gap: mobileSpace.sm,
  },
  sectionLabel: {
    color: mobileColors.textMuted,
    fontSize: mobileType.body,
  },
  sectionRow: {
    minHeight: 44,
    borderBottomColor: mobileColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: mobileSpace.sm,
    paddingVertical: mobileSpace.md,
  },
  sectionValue: {
    minWidth: 0,
  },
  tagWrap: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mobileSpace.xs,
  },
})
