import { Archive, Code, PencilSimpleLine, Star, Tray } from 'phosphor-react-native'
import type { ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'
import type { MobileNote } from './demoData'
import type { MobileEditorSaveState } from './mobileEditorSaveState'
import { styles } from './styles'
import { colors } from './theme'

export function MobileEditorBreadcrumb({
  isRawMode,
  note,
  onToggleArchive,
  onToggleFavorite,
  onToggleRawMode,
  saveState,
}: {
  isRawMode: boolean
  note: MobileNote
  onToggleArchive: () => void
  onToggleFavorite: () => void
  onToggleRawMode: () => void
  saveState: MobileEditorSaveState
}) {
  const ArchiveIcon = note.archived ? Tray : Archive
  const RawIcon = isRawMode ? PencilSimpleLine : Code

  return (
    <View style={styles.editorBreadcrumb}>
      <Text numberOfLines={1} style={styles.editorBreadcrumbText}>{note.type}</Text>
      <Text style={styles.editorBreadcrumbDivider}>/</Text>
      <Text numberOfLines={1} style={styles.editorBreadcrumbTitle}>{note.id}</Text>
      <Text style={[styles.editorSaveState, saveStateStyle(saveState)]}>{saveState.label}</Text>
      <BreadcrumbButton label={isRawMode ? 'Rich editor' : 'Raw editor'} onPress={onToggleRawMode}>
        <RawIcon color={isRawMode ? colors.primary : colors.textSoft} size={18} />
      </BreadcrumbButton>
      <BreadcrumbButton label={note.favorite ? 'Remove favorite' : 'Add favorite'} onPress={onToggleFavorite}>
        <Star color={note.favorite ? colors.primary : colors.textSoft} size={18} weight={note.favorite ? 'fill' : 'regular'} />
      </BreadcrumbButton>
      <BreadcrumbButton label={note.archived ? 'Move to inbox' : 'Archive'} onPress={onToggleArchive}>
        <ArchiveIcon color={colors.textSoft} size={18} />
      </BreadcrumbButton>
    </View>
  )
}

function saveStateStyle(saveState: MobileEditorSaveState) {
  switch (saveState.state) {
    case 'blocked':
      return styles.editorSaveState_blocked
    case 'failed':
      return styles.editorSaveState_failed
    case 'queued':
      return styles.editorSaveState_queued
    case 'saved':
      return styles.editorSaveState_saved
    case 'saving':
      return styles.editorSaveState_saving
    default:
      return styles.editorSaveState_idle
  }
}

function BreadcrumbButton({
  children,
  label,
  onPress,
}: {
  children: ReactNode
  label: string
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.editorBreadcrumbButton, pressed ? styles.pressed : null]}
    >
      {children}
    </Pressable>
  )
}
