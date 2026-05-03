import { useMemo, useState } from 'react'
import {
  FlatList,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import {
  CaretLeft,
  DotsThreeVertical,
  Info,
  List,
  MagnifyingGlass,
  PencilSimple,
  SlidersHorizontal,
} from 'phosphor-react-native'
import { MobileNote, notes, sidebarSections } from './demoData'
import {
  createCompactNavigationState,
  transitionCompactNavigation,
  type CompactNavigationEvent,
  type CompactPanel,
} from './compactNavigation'
import { NamedIcon, type IconName } from './NamedIcon'
import { styles } from './styles'
import { colors } from './theme'

export function MobileApp() {
  const { width } = useWindowDimensions()
  const isTablet = width >= 820
  const showsProperties = width >= 1120
  const [compactNavigation, setCompactNavigation] = useState(() => createCompactNavigationState(notes[0].id))
  const selectedNote = useMemo(
    () => notes.find((note) => note.id === compactNavigation.selectedNoteId) ?? notes[0],
    [compactNavigation.selectedNoteId],
  )

  const selectNote = (note: MobileNote) => {
    setCompactNavigation((state) => transitionCompactNavigation(state, { type: 'selectNote', noteId: note.id }))
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        {isTablet ? (
          <View style={styles.tabletShell}>
            <SidebarPanel />
            <NoteListPanel selectedNoteId={compactNavigation.selectedNoteId} onSelectNote={selectNote} />
            <EditorPanel note={selectedNote} />
            {showsProperties ? <PropertiesPanel note={selectedNote} /> : null}
          </View>
        ) : (
          <CompactShell
            activePanel={compactNavigation.panel}
            note={selectedNote}
            selectedNoteId={compactNavigation.selectedNoteId}
            onNavigate={(event) => setCompactNavigation((state) => transitionCompactNavigation(state, event))}
            onSelectNote={selectNote}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

function CompactShell({
  activePanel,
  note,
  onNavigate,
  onSelectNote,
  selectedNoteId,
}: {
  activePanel: CompactPanel
  note: MobileNote
  onNavigate: (event: CompactNavigationEvent) => void
  onSelectNote: (note: MobileNote) => void
  selectedNoteId: string
}) {
  if (activePanel === 'sidebar') {
    return <SidebarPanel onClose={() => onNavigate({ type: 'closeSidebar' })} />
  }

  if (activePanel === 'note') {
    return (
      <EditorPanel
        note={note}
        onBack={() => onNavigate({ type: 'backToList' })}
        onOpenProperties={() => onNavigate({ type: 'openProperties' })}
      />
    )
  }

  if (activePanel === 'properties') {
    return <PropertiesPanel note={note} onClose={() => onNavigate({ type: 'closeProperties' })} />
  }

  return (
    <NoteListPanel
      selectedNoteId={selectedNoteId}
      onOpenSidebar={() => onNavigate({ type: 'openSidebar' })}
      onSelectNote={onSelectNote}
    />
  )
}

function SidebarPanel({ onClose }: { onClose?: () => void }) {
  return (
    <View style={styles.sidebar}>
      <Toolbar>
        {onClose ? <IconButton icon={<CaretLeft size={24} color={colors.textSoft} />} onPress={onClose} /> : null}
        <View style={styles.toolbarSpacer} />
        <IconButton icon={<SlidersHorizontal size={22} color={colors.textSoft} />} />
      </Toolbar>
      <ScrollView contentContainerStyle={styles.sidebarContent}>
        {sidebarSections.map((section) => (
          <View key={section.title} style={styles.sidebarSection}>
            <Text style={styles.sidebarSectionTitle}>{section.title}</Text>
            {section.items.map((item) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.sidebarItem,
                  item.id === 'inbox' ? styles.sidebarItemSelected : null,
                  pressed ? styles.pressed : null,
                ]}
              >
                <NamedIcon name={item.icon as IconName} size={20} color={item.id === 'inbox' ? colors.primary : colors.iconMuted} />
                <Text style={styles.sidebarItemText}>{item.label}</Text>
                {item.count > 0 ? <Text style={styles.sidebarCount}>{item.count}</Text> : null}
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

function NoteListPanel({
  onOpenSidebar,
  onSelectNote,
  selectedNoteId,
}: {
  onOpenSidebar?: () => void
  onSelectNote: (note: MobileNote) => void
  selectedNoteId: string
}) {
  return (
    <View style={styles.noteList}>
      <Toolbar>
        {onOpenSidebar ? <IconButton icon={<List size={25} color={colors.textSoft} />} onPress={onOpenSidebar} /> : null}
        <Text style={styles.listTitle}>Inbox</Text>
        <View style={styles.toolbarSpacer} />
        <IconButton icon={<MagnifyingGlass size={23} color={colors.textSoft} />} />
      </Toolbar>
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.noteListContent}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onSelectNote(item)}
            style={({ pressed }) => [
              styles.noteRow,
              item.id === selectedNoteId ? styles.noteRowSelected : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <View style={styles.noteRowHeader}>
              <Text style={styles.noteTitle}>{item.title}</Text>
              <NamedIcon name={item.icon as IconName} size={18} color={colors.primary} />
            </View>
            <Text numberOfLines={2} style={styles.noteSnippet}>{item.snippet}</Text>
            <View style={styles.noteMetaRow}>
              <Text style={styles.noteMeta}>{item.modified}</Text>
              <Text style={styles.noteMeta}>Created {item.date}</Text>
            </View>
            <View style={styles.tagRow}>
              {item.tags.slice(0, 2).map((tag) => <Tag key={tag} label={tag} />)}
            </View>
          </Pressable>
        )}
      />
      <Pressable style={styles.composeButton}>
        <PencilSimple size={28} color="#ffffff" />
      </Pressable>
    </View>
  )
}

function EditorPanel({
  note,
  onBack,
  onOpenProperties,
}: {
  note: MobileNote
  onBack?: () => void
  onOpenProperties?: () => void
}) {
  const bodyLines = note.content.split('\n').filter((line) => line.trim() && !line.startsWith('---') && !line.includes(': '))
  return (
    <View style={styles.editor}>
      <Toolbar>
        {onBack ? <IconButton icon={<CaretLeft size={25} color={colors.textSoft} />} onPress={onBack} /> : null}
        <View style={styles.toolbarSpacer} />
        {onOpenProperties ? <IconButton icon={<Info size={23} color={colors.textSoft} />} onPress={onOpenProperties} /> : null}
        <IconButton icon={<DotsThreeVertical size={23} color={colors.textSoft} />} />
      </Toolbar>
      <ScrollView contentContainerStyle={styles.editorContent}>
        <View style={styles.breadcrumbRow}>
          <Text style={styles.breadcrumbText}>{note.type}</Text>
          <Text style={styles.breadcrumbDivider}>/</Text>
          <Text style={styles.breadcrumbText}>{note.id}</Text>
        </View>
        <Text style={styles.editorTitle}>{note.title}</Text>
        {bodyLines.slice(1).map((line) => (
          <Text key={line} style={line.startsWith('-') ? styles.editorBullet : styles.editorParagraph}>
            {line}
          </Text>
        ))}
      </ScrollView>
    </View>
  )
}

function PropertiesPanel({ note, onClose }: { note: MobileNote; onClose?: () => void }) {
  return (
    <View style={styles.properties}>
      <Toolbar>
        <Text style={styles.propertiesTitle}>Properties</Text>
        <View style={styles.toolbarSpacer} />
        {onClose ? <IconButton icon={<CaretLeft size={23} color={colors.textSoft} />} onPress={onClose} /> : null}
      </Toolbar>
      <ScrollView contentContainerStyle={styles.propertiesContent}>
        <PropertyRow label="Type" value={note.type} />
        <PropertyRow label="Date" value={note.date} />
        <PropertyRow label="Words" value={String(note.words)} />
        <PropertyRow label="Modified" value={note.modified} />
        <Text style={styles.propertyGroupTitle}>Tags</Text>
        <View style={styles.tagRow}>
          {note.tags.map((tag) => <Tag key={tag} label={tag} />)}
        </View>
        <Text style={styles.propertyGroupTitle}>History</Text>
        <Text style={styles.historyItem}>eb373865c - Updated 1 note</Text>
        <Text style={styles.historyItem}>5e853fdfe - Updated 1 note</Text>
      </ScrollView>
    </View>
  )
}

function Toolbar({ children }: { children: React.ReactNode }) {
  return <View style={styles.toolbar}>{children}</View>
}

function IconButton({ icon, onPress }: { icon: React.ReactNode; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}>
      {icon}
    </Pressable>
  )
}

function PropertyRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.propertyRow}>
      <Text style={styles.propertyLabel}>{label}</Text>
      <Text style={styles.propertyValue}>{value}</Text>
    </View>
  )
}

function Tag({ label }: { label: string }) {
  return <Text style={styles.tag}>{label}</Text>
}
