import { useState, type ReactNode } from 'react'
import {
  Archive,
  CaretLeft,
  CaretRight,
  DotsThree,
  FileText,
  FolderOpen,
  Info,
  List,
  MagnifyingGlass,
  StackSimple,
} from 'phosphor-react-native'
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native'
import type { FixtureNote, FixtureSidebarSection, WorkspaceScenario } from '../fixtures/workspaceFixtures'
import { Button } from '../components/ui/button'
import { Text } from '../components/ui/text'
import { cn } from '../components/ui/utils'
import { mobileCopy, mobileText } from '../i18n/mobileText'
import { mobileColors, mobileRadius, mobileSpace, mobileType } from '../ui/tokens'

export type PhoneWorkspaceState = 'editor' | 'list' | 'sidebar'

export function PhoneWorkspaceMock({
  initialState = 'list',
  scenario,
}: {
  initialState?: PhoneWorkspaceState
  scenario: WorkspaceScenario
}) {
  const [phoneState, setPhoneState] = useState(initialState)
  const selectedNote = scenario.notes.find((note) => note.id === scenario.selectedNoteId) ?? scenario.notes[0] ?? null

  if (phoneState === 'sidebar') {
    return <PhoneSidebarDrawer scenario={scenario} onClose={() => setPhoneState('list')} onOpenEditor={() => setPhoneState('editor')} />
  }

  if (phoneState === 'editor' && selectedNote) {
    return <PhoneEditor note={selectedNote} bullets={scenario.editorBullets} onBack={() => setPhoneState('list')} />
  }

  return <PhoneNoteList notes={scenario.notes} onOpenEditor={() => setPhoneState('editor')} onOpenSidebar={() => setPhoneState('sidebar')} />
}

function PhoneNoteList({
  notes,
  onOpenEditor,
  onOpenSidebar,
}: {
  notes: FixtureNote[]
  onOpenEditor: () => void
  onOpenSidebar: () => void
}) {
  return (
    <View style={phoneStyles.screen}>
      <PhoneListHeader onOpenSidebar={onOpenSidebar} />
      <ScrollView contentContainerStyle={phoneStyles.listContent}>
        {notes.map((note) => <PhoneNoteRow key={note.id} note={note} onPress={onOpenEditor} />)}
      </ScrollView>
    </View>
  )
}

function PhoneListHeader({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  return (
    <View style={phoneStyles.header}>
      <CircleButton accessibilityLabel={mobileText('sidebar.action.expand')} onPress={onOpenSidebar}>
        <List color={mobileColors.textMuted} size={30} />
      </CircleButton>
      <View style={phoneStyles.headerTitleGroup}>
        <Text style={phoneStyles.headerTitle}>{mobileCopy.inbox}</Text>
      </View>
      <CircleButton accessibilityLabel={mobileCopy.searchNotes}>
        <MagnifyingGlass color={mobileColors.textMuted} size={30} />
      </CircleButton>
    </View>
  )
}

function PhoneNoteRow({
  note,
  onPress,
}: {
  note: FixtureNote
  onPress: () => void
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [phoneStyles.noteRow, pressed ? phoneStyles.pressed : null]}>
      <View style={phoneStyles.noteTitleRow}>
        <TypeIcon note={note} size={20} />
        <Text numberOfLines={2} style={phoneStyles.noteTitle}>{note.title}</Text>
      </View>
      <Text numberOfLines={2} style={phoneStyles.noteSnippet}>{note.snippet}</Text>
      <Text style={phoneStyles.noteDate}>{note.modified}</Text>
    </Pressable>
  )
}

function PhoneSidebarDrawer({
  onClose,
  onOpenEditor,
  scenario,
}: {
  onClose: () => void
  onOpenEditor: () => void
  scenario: WorkspaceScenario
}) {
  const { width } = useWindowDimensions()
  const drawerWidth = Math.min(310, Math.round(width * 0.76))

  return (
    <View style={phoneStyles.drawerRoot}>
      <View style={[phoneStyles.drawerPreview, { left: drawerWidth, width }]}>
        <PhoneNoteList notes={scenario.notes} onOpenEditor={onOpenEditor} onOpenSidebar={onClose} />
      </View>
      <View style={[phoneStyles.drawerPanel, { width: drawerWidth }]}>
        <CircleButton accessibilityLabel={mobileText('command.group.note')} dark>
          <DotsThree color={phoneColors.drawerMuted} size={30} weight="bold" />
        </CircleButton>
        <View style={phoneStyles.drawerNav}>
          <PhoneSidebarItem active icon={<FileText color={phoneColors.drawerText} size={22} />} label={mobileCopy.inbox} />
          <PhoneSidebarItem icon={<Archive color={phoneColors.drawerMuted} size={22} />} label={mobileCopy.archive} />
          {scenario.sidebarSections.map((section) => (
            <PhoneSidebarSection key={section.id} section={section} />
          ))}
        </View>
      </View>
    </View>
  )
}

function PhoneSidebarSection({ section }: { section: FixtureSidebarSection }) {
  if (section.id !== 'folders') return null

  return (
    <View style={phoneStyles.drawerSection}>
      {section.folders?.map((folder) => (
        <PhoneSidebarItem
          key={folder.id}
          icon={folder.active ? <FolderOpen color={phoneColors.drawerText} size={22} weight="fill" /> : <FolderOpen color={phoneColors.drawerMuted} size={22} />}
          label={folder.name}
          trailing={folder.children.length > 0 ? <CaretRight color={phoneColors.drawerMuted} size={20} /> : null}
        />
      ))}
    </View>
  )
}

function PhoneSidebarItem({
  active = false,
  icon,
  label,
  trailing,
}: {
  active?: boolean
  icon: ReactNode
  label: string
  trailing?: ReactNode
}) {
  return (
    <View style={[phoneStyles.drawerItem, active ? phoneStyles.drawerItemActive : null]}>
      {icon}
      <Text numberOfLines={1} style={[phoneStyles.drawerItemText, active ? phoneStyles.drawerItemTextActive : null]}>{label}</Text>
      {trailing}
    </View>
  )
}

function PhoneEditor({
  bullets,
  note,
  onBack,
}: {
  bullets: string[]
  note: FixtureNote
  onBack: () => void
}) {
  return (
    <View style={phoneStyles.screen}>
      <View style={phoneStyles.editorHeader}>
        <CircleButton accessibilityLabel="Back" onPress={onBack}>
          <CaretLeft color={mobileColors.textMuted} size={32} />
        </CircleButton>
        <View style={phoneStyles.editorActions}>
          <Info color={mobileColors.textMuted} size={26} />
          <DotsThree color={mobileColors.textMuted} size={26} weight="bold" />
        </View>
      </View>
      <ScrollView contentContainerStyle={phoneStyles.editorContent}>
        <Text style={phoneStyles.editorTitle}>{note.title}</Text>
        {bullets.map((item) => (
          <View key={item} style={phoneStyles.editorBulletRow}>
            <Text style={phoneStyles.editorBullet}>*</Text>
            <Text style={phoneStyles.editorText}>{item}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

function CircleButton({
  accessibilityLabel,
  children,
  dark = false,
  onPress,
}: {
  accessibilityLabel: string
  children: ReactNode
  dark?: boolean
  onPress?: () => void
}) {
  return (
    <Button
      accessibilityLabel={accessibilityLabel}
      className={cn(
        'h-[62px] w-[62px] rounded-full bg-white p-0 shadow-lg shadow-black/10 active:opacity-75 [&_svg]:!h-[30px] [&_svg]:!w-[30px]',
        dark ? 'border border-[#343A3A] bg-[#222727] shadow-none' : null,
      )}
      onPress={onPress}
      size="icon"
      style={phoneStyles.circleButtonShadow}
      variant="ghost"
    >
      {children}
    </Button>
  )
}

function TypeIcon({ note, size }: { note: FixtureNote; size: number }) {
  const color = typeColor(note.typeTone)
  const normalizedType = note.type.toLowerCase()

  if (normalizedType.includes('release')) return <Archive color={color} size={size} />
  if (normalizedType.includes('procedure')) return <StackSimple color={color} size={size} />

  return <FileText color={color} size={size} />
}

function typeColor(tone: FixtureNote['typeTone']) {
  if (tone === 'green') return mobileColors.green
  if (tone === 'orange') return mobileColors.orange

  return mobileColors.purple
}

const phoneColors = {
  drawer: '#202424',
  drawerCard: '#424848',
  drawerMuted: '#B7BBBB',
  drawerText: '#F6F7F5',
}

const sharedPhoneStyles = StyleSheet.create({
  circleButtonShadow: {
    shadowColor: '#000000',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },
  pressed: {
    opacity: 0.72,
  },
  screen: {
    flex: 1,
    backgroundColor: mobileColors.app,
  },
})

const drawerPhoneStyles = StyleSheet.create({
  drawerItem: {
    minHeight: 58,
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.lg,
    borderRadius: mobileRadius.lg,
    paddingHorizontal: mobileSpace.xl,
  },
  drawerItemActive: {
    backgroundColor: phoneColors.drawerCard,
  },
  drawerItemText: {
    flex: 1,
    color: phoneColors.drawerMuted,
    fontSize: 24,
    fontWeight: '600',
  },
  drawerItemTextActive: {
    color: phoneColors.drawerText,
  },
  drawerNav: {
    marginTop: 42,
    gap: mobileSpace.sm,
  },
  drawerPanel: {
    flex: 1,
    backgroundColor: phoneColors.drawer,
    paddingHorizontal: mobileSpace.lg,
    paddingTop: 58,
  },
  drawerPreview: {
    bottom: 0,
    position: 'absolute',
    top: 0,
  },
  drawerRoot: {
    flex: 1,
    backgroundColor: phoneColors.drawer,
    overflow: 'hidden',
  },
  drawerSection: {
    marginTop: mobileSpace.md,
    gap: mobileSpace.xs,
  },
})

const editorPhoneStyles = StyleSheet.create({
  editorActions: {
    minWidth: 118,
    minHeight: 62,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: mobileSpace.lg,
    borderRadius: mobileRadius.pill,
    backgroundColor: mobileColors.card,
    shadowColor: '#000000',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },
  editorBullet: {
    color: mobileColors.primary,
    fontSize: mobileType.bodyLarge,
    lineHeight: 31,
  },
  editorBulletRow: {
    flexDirection: 'row',
    gap: mobileSpace.lg,
    marginBottom: mobileSpace.lg,
  },
  editorContent: {
    paddingHorizontal: mobileSpace.xl,
    paddingBottom: 56,
  },
  editorHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: mobileSpace.xl,
    paddingTop: 58,
    paddingBottom: mobileSpace.xl,
  },
  editorText: {
    flex: 1,
    color: mobileColors.text,
    fontSize: 23,
    lineHeight: 35,
  },
  editorTitle: {
    color: mobileColors.text,
    fontSize: 42,
    fontWeight: '700',
    lineHeight: 50,
    marginBottom: 44,
  },
})

const listPhoneStyles = StyleSheet.create({
  header: {
    minHeight: 116,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: mobileSpace.xl,
    paddingTop: 46,
  },
  headerTitle: {
    color: mobileColors.text,
    fontSize: 25,
    fontWeight: '700',
  },
  headerTitleGroup: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: mobileSpace.xl,
    paddingBottom: 56,
  },
  noteDate: {
    color: mobileColors.textMuted,
    fontSize: 16,
    marginTop: mobileSpace.lg,
  },
  noteRow: {
    borderBottomColor: mobileColors.borderStrong,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: mobileSpace.lg,
  },
  noteSnippet: {
    color: mobileColors.textMuted,
    fontSize: 21,
    lineHeight: 31,
    marginTop: mobileSpace.sm,
  },
  noteTitle: {
    flex: 1,
    color: mobileColors.text,
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 28,
  },
  noteTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.sm,
  },
})

const phoneStyles = {
  ...sharedPhoneStyles,
  ...drawerPhoneStyles,
  ...editorPhoneStyles,
  ...listPhoneStyles,
}
