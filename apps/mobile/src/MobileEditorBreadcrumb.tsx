import { Text, View } from 'react-native'
import type { MobileNote } from './demoData'
import type { MobileEditorSaveState } from './mobileEditorSaveState'
import { styles } from './styles'

export function MobileEditorBreadcrumb({
  note,
  saveState,
}: {
  note: MobileNote
  saveState: MobileEditorSaveState
}) {
  return (
    <View style={styles.editorBreadcrumb}>
      <Text numberOfLines={1} style={styles.editorBreadcrumbText}>{note.type}</Text>
      <Text style={styles.editorBreadcrumbDivider}>/</Text>
      <Text numberOfLines={1} style={styles.editorBreadcrumbTitle}>{note.id}</Text>
      <Text style={[styles.editorSaveState, saveStateStyle(saveState)]}>{saveState.label}</Text>
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
