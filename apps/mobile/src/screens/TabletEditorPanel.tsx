import {
  Check,
  Code,
  DotsThree,
  FileText,
  PencilSimple,
  Star,
} from 'phosphor-react-native'
import { ScrollView, StyleSheet, View } from 'react-native'
import { useCallback, useState } from 'react'
import { MobileEditorBlocks } from '../components/workspace/MobileEditorBlocks'
import { MobileMarkdownSourceEditor } from '../components/workspace/MobileMarkdownSourceEditor'
import { MobileNoteIcon, MobileTypeIcon } from '../components/workspace/MobileWorkspaceIcons'
import { MobileWysiwygMarkdownEditor } from '../components/workspace/MobileWysiwygMarkdownEditor'
import { Text } from '../components/ui/text'
import { mobileText } from '../i18n/mobileText'
import { MobileChip } from '../ui/MobileChip'
import { MobileIconButton } from '../ui/MobileIconButton'
import { MobilePanel, MobileToolbar, MobileToolbarTitle } from '../ui/MobilePanel'
import { desktopEditorParity, desktopToolbarActionParity } from '../ui/desktopParity'
import { mobileColors, mobileSpace, mobileType } from '../ui/tokens'
import { MobileLayoutProbeReadout } from '../qa/MobileLayoutProbeReadout'
import { useMobileLayoutProbe, type MobileLayoutProbe } from '../qa/mobileLayoutProbe'
import type { MobileEditorBlock, MobileNote } from '../workspace/mobileWorkspaceModel'
import {
  useMobileAttachmentImporter,
  type MobileAttachmentImporter,
} from '../workspace/mobileAttachmentImport'
import {
  useMobileAttachmentLinkOpener,
  type MobileAttachmentLinkOpener,
} from '../workspace/mobileAttachmentOpen'
import { shouldRenderEditorDocumentTitle } from './tabletEditorDocumentTitle'

type TabletEditorPanelProps = {
  blocks: MobileEditorBlock[]
  bullets: string[]
  compact: boolean
  initialEditing?: boolean
  initialEditingMode?: EditorEditingMode
  layoutProbe?: boolean
  note: MobileNote | null
  notes: MobileNote[]
  onNavigateWikilink: (target: string) => void
  onOpenMoreActions: () => void
  onToggleFavorite: () => void
  onUpdateContent: (noteId: string, content: string) => void
  sourceSelectionProbe?: boolean
  vaultRootUri?: string | null
  wysiwygAutocompleteProbe?: boolean
  wysiwygFormatCommandProbe?: boolean
  wysiwygWikilinkInsertProbe?: boolean
  wysiwygMutationProbe?: boolean
}

type EditorToolbarProps = {
  editing: boolean
  editingMode: EditorEditingMode
  fileMode: EditorFileMode
  note: MobileNote
  onOpenMoreActions: () => void
  onToggleEditing: () => void
  onToggleSourceMode: () => void
  onToggleFavorite: () => void
}

type EditorPanelBodyProps = {
  compact: boolean
  contentProps: EditorContentProps
  fileMode: EditorFileMode
  note: MobileNote
}

type EditorContentProps = {
  blocks: MobileEditorBlock[]
  bullets: string[]
  compact: boolean
  editing: boolean
  editingMode: EditorEditingMode
  note: MobileNote
  notes: MobileNote[]
  layoutProbe: MobileLayoutProbe
  plainText: boolean
  onNavigateWikilink: (target: string) => void
  onImportAttachment?: MobileAttachmentImporter
  onOpenLink: MobileAttachmentLinkOpener
  onUpdateContent: (noteId: string, content: string) => void
  sourceSelectionProbe?: boolean
  vaultRootUri?: string | null
  wysiwygAutocompleteProbe?: boolean
  wysiwygFormatCommandProbe?: boolean
  wysiwygWikilinkInsertProbe?: boolean
  wysiwygMutationProbe?: boolean
}

export type EditorEditingMode = 'source' | 'wysiwyg'
type EditorFileMode = 'binary' | 'markdown' | 'text'

export function TabletEditorPanel(props: TabletEditorPanelProps) {
  const {
    blocks,
    bullets,
    compact,
    initialEditing = false,
    initialEditingMode = 'wysiwyg',
    layoutProbe: layoutProbeEnabled = false,
    note,
    notes,
    onNavigateWikilink,
    onOpenMoreActions,
    onToggleFavorite,
    onUpdateContent,
    sourceSelectionProbe = false,
    vaultRootUri = null,
    wysiwygAutocompleteProbe = false,
    wysiwygFormatCommandProbe = false,
    wysiwygWikilinkInsertProbe = false,
    wysiwygMutationProbe = false,
  } = props
  const [editing, setEditing] = useState(initialEditing)
  const [editingMode, setEditingMode] = useState<EditorEditingMode>(initialEditingMode)
  const importAttachment = useMobileAttachmentImporter(vaultRootUri)
  const openLink = useMobileAttachmentLinkOpener(vaultRootUri)
  const layoutProbe = useMobileLayoutProbe(layoutProbeEnabled)
  const toggleEditing = useCallback(() => {
    setEditing((current) => {
      if (!current) setEditingMode('wysiwyg')
      return !current
    })
  }, [])
  const toggleSourceMode = useCallback(() => {
    if (!editing) {
      setEditingMode('source')
      setEditing(true)
      return
    }
    setEditingMode((current) => current === 'source' ? 'wysiwyg' : 'source')
  }, [editing])

  if (!note) {
    return <EmptyEditorPanel />
  }

  const fileMode = editorFileMode(note)
  const plainText = fileMode === 'text'
  const effectiveEditing = editing || plainText
  const effectiveEditingMode = plainText ? 'source' : editingMode
  const contentProps: EditorContentProps = {
    blocks,
    bullets,
    compact,
    editing: effectiveEditing,
    editingMode: effectiveEditingMode,
    layoutProbe: layoutProbe.probe,
    note,
    notes,
    onImportAttachment: importAttachment,
    onNavigateWikilink,
    onOpenLink: openLink,
    onUpdateContent,
    plainText,
    sourceSelectionProbe,
    vaultRootUri,
    wysiwygAutocompleteProbe,
    wysiwygFormatCommandProbe,
    wysiwygMutationProbe,
    wysiwygWikilinkInsertProbe,
  }

  return (
    <MobilePanel {...layoutProbe.probe('editor.panel')} style={panelStyles.panel} testID="editor-panel">
      <EditorToolbar
        editingMode={effectiveEditingMode}
        editing={effectiveEditing}
        fileMode={fileMode}
        note={note}
        onOpenMoreActions={onOpenMoreActions}
        onToggleEditing={toggleEditing}
        onToggleSourceMode={toggleSourceMode}
        onToggleFavorite={onToggleFavorite}
      />
      <EditorPanelBody
        compact={compact}
        contentProps={contentProps}
        fileMode={fileMode}
        note={note}
      />
      {layoutProbeEnabled ? <MobileLayoutProbeReadout metrics={layoutProbe.metrics} testID="editor-layout-metrics" /> : null}
    </MobilePanel>
  )
}

function EditorPanelBody({
  compact,
  contentProps,
  fileMode,
  note,
}: EditorPanelBodyProps) {
  if (fileMode === 'binary') {
    return (
      <ScrollView contentContainerStyle={panelStyles.filePreviewContent} testID="editor-scroll">
        <MobileFilePreviewFallback note={note} />
      </ScrollView>
    )
  }

  if (contentProps.editing) {
    return (
      <View style={panelStyles.editorHost} testID="editor-scroll">
        <EditorContent {...contentProps} />
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={readModeContentStyle(note, compact)} testID="editor-scroll">
      <EditorContent {...contentProps} />
    </ScrollView>
  )
}

function EditorToolbar({
  editingMode,
  editing,
  fileMode,
  note,
  onOpenMoreActions,
  onToggleEditing,
  onToggleSourceMode,
  onToggleFavorite,
}: EditorToolbarProps) {
  return (
    <MobileToolbar testID="editor-toolbar">
      <FileText color={mobileColors.textMuted} size={desktopToolbarActionParity.iconSize} />
      <EditorToolbarIcon fileMode={fileMode} note={note} />
      <MobileToolbarTitle testID="editor-toolbar-title" title={note.title} />
      <MobileChip label={editorToolbarChipLabel(fileMode, note)} tone="gray" />
      <EditorToolbarActions
        editing={editing}
        editingMode={editingMode}
        fileMode={fileMode}
        note={note}
        onOpenMoreActions={onOpenMoreActions}
        onToggleEditing={onToggleEditing}
        onToggleFavorite={onToggleFavorite}
        onToggleSourceMode={onToggleSourceMode}
      />
    </MobileToolbar>
  )
}

function EditorToolbarIcon({
  fileMode,
  note,
}: Pick<EditorToolbarProps, 'fileMode' | 'note'>) {
  if (fileMode === 'markdown') {
    return (
      <MobileNoteIcon
        color={mobileColors.textMuted}
        icon={note.icon}
        size={desktopToolbarActionParity.iconSize}
        testID="editor-toolbar-note-icon"
      />
    )
  }

  return <MobileTypeIcon fileKind={note.fileKind} size={desktopToolbarActionParity.iconSize} tone={note.typeTone} type={note.type} />
}

function EditorToolbarActions(props: EditorToolbarProps) {
  if (props.fileMode !== 'markdown') return null

  return <MarkdownToolbarActions {...props} />
}

function MarkdownToolbarActions({
  editing,
  editingMode,
  note,
  onOpenMoreActions,
  onToggleEditing,
  onToggleFavorite,
  onToggleSourceMode,
}: EditorToolbarProps) {
  const sourceModeActive = editing && editingMode === 'source'

  return (
    <>
      <MobileIconButton
        accessibilityLabel={mobileText(note.favorite ? 'command.note.removeFavorite' : 'command.note.addFavorite')}
        testID="editor-favorite-action"
        onPress={onToggleFavorite}
      >
        <Star color={note.favorite ? mobileColors.primary : mobileColors.textMuted} size={desktopToolbarActionParity.iconSize} weight={note.favorite ? 'fill' : 'regular'} />
      </MobileIconButton>
      <MobileIconButton
        accessibilityLabel={mobileText(editing ? 'common.save' : 'menu.edit')}
        testID="editor-edit-action"
        onPress={onToggleEditing}
      >
        <EditorToggleIcon editing={editing} />
      </MobileIconButton>
      <MobileIconButton
        accessibilityLabel={mobileText(sourceModeActive ? 'editor.toolbar.rawReturn' : 'editor.toolbar.rawOpen')}
        selected={sourceModeActive}
        testID="editor-source-action"
        onPress={onToggleSourceMode}
      >
        <Code color={sourceModeActive ? mobileColors.primary : mobileColors.textMuted} size={desktopToolbarActionParity.iconSize} />
      </MobileIconButton>
      <MobileIconButton accessibilityLabel={mobileText('editor.toolbar.moreActions')} testID="editor-more-action" onPress={onOpenMoreActions}>
        <DotsThree color={mobileColors.textMuted} size={desktopToolbarActionParity.iconSize} weight="bold" />
      </MobileIconButton>
    </>
  )
}

function EditorToggleIcon({ editing }: { editing: boolean }) {
  return editing
    ? <Check color={mobileColors.primary} size={desktopToolbarActionParity.iconSize} weight="bold" />
    : <PencilSimple color={mobileColors.textMuted} size={desktopToolbarActionParity.iconSize} />
}

function EditorContent({
  blocks,
  bullets,
  compact,
  editing,
  editingMode,
  layoutProbe,
  note,
  notes,
  plainText,
  onImportAttachment,
  onNavigateWikilink,
  onOpenLink,
  onUpdateContent,
  sourceSelectionProbe = false,
  vaultRootUri = null,
  wysiwygAutocompleteProbe = false,
  wysiwygFormatCommandProbe = false,
  wysiwygWikilinkInsertProbe = false,
  wysiwygMutationProbe = false,
}: EditorContentProps) {
  if (editing) {
    if (plainText || editingMode === 'source') {
      return (
        <MobileMarkdownSourceEditor
          key={`${note.id}:${plainText ? 'text' : 'source'}`}
          blocks={blocks}
          bullets={bullets}
          compact={compact}
          note={note}
          notes={notes}
          onImportAttachment={onImportAttachment}
          onUpdateContent={onUpdateContent}
          plainText={plainText}
          sourceSelectionProbe={sourceSelectionProbe}
        />
      )
    }

    return (
      <MobileWysiwygMarkdownEditor
        key={`${note.id}:wysiwyg`}
        blocks={blocks}
        bullets={bullets}
        compact={compact}
        layoutProbe={layoutProbe}
        note={note}
        notes={notes}
        onImportAttachment={onImportAttachment}
        onUpdateContent={onUpdateContent}
        vaultRootUri={vaultRootUri}
        wysiwygAutocompleteProbe={wysiwygAutocompleteProbe}
        wysiwygFormatCommandProbe={wysiwygFormatCommandProbe}
        wysiwygWikilinkInsertProbe={wysiwygWikilinkInsertProbe}
        wysiwygMutationProbe={wysiwygMutationProbe}
      />
    )
  }

  return (
    <>
      {shouldRenderEditorDocumentTitle(note) ? (
        <View style={panelStyles.titleBlock} testID="editor-title-block">
          <Text style={[panelStyles.title, compact ? panelStyles.titleCompact : null]} testID="editor-title">{note.title}</Text>
        </View>
      ) : null}
      <MobileEditorBlocks
        blocks={blocks}
        fallbackBullets={bullets}
        onOpenLink={onOpenLink}
        onNavigateWikilink={onNavigateWikilink}
      />
    </>
  )
}

function editorFileMode(note: MobileNote): EditorFileMode {
  if (note.fileKind === 'binary') return 'binary'
  return note.fileKind === 'text' ? 'text' : 'markdown'
}

function editorToolbarChipLabel(fileMode: EditorFileMode, note: MobileNote): string {
  if (fileMode === 'text') return mobileText('filePreview.textFile')
  if (fileMode === 'binary') return mobileText('filePreview.file')
  return note.workspace
}

function readModeContentStyle(note: MobileNote, compact: boolean) {
  return [
    panelStyles.content,
    note.noteWidth === 'wide' ? panelStyles.contentWide : null,
    compact ? panelStyles.contentCompact : null,
  ]
}

function MobileFilePreviewFallback({ note }: { note: MobileNote }) {
  return (
    <View style={panelStyles.filePreviewFallback} testID="file-preview-fallback">
      <MobileTypeIcon fileKind={note.fileKind} size={32} tone={note.typeTone} type={note.type} />
      <Text style={panelStyles.filePreviewTitle}>{mobileText('filePreview.previewUnavailable')}</Text>
      <Text style={panelStyles.filePreviewDescription}>{mobileText('filePreview.previewUnavailableDescription')}</Text>
    </View>
  )
}

function EmptyEditorPanel() {
  return (
    <MobilePanel style={panelStyles.panel} testID="editor-panel">
      <MobileToolbar testID="editor-toolbar">
        <FileText color={mobileColors.textMuted} size={desktopToolbarActionParity.iconSize} />
        <MobileToolbarTitle testID="editor-toolbar-title" title={mobileText('inspector.empty.noNoteSelected')} />
      </MobileToolbar>
      <View style={panelStyles.emptyState}>
        <Text style={panelStyles.emptyTitle}>{mobileText('editor.empty.selectNote')}</Text>
      </View>
    </MobilePanel>
  )
}

const panelStyles = StyleSheet.create({
  content: {
    alignSelf: 'center',
    maxWidth: desktopEditorParity.contentMaxWidth,
    paddingHorizontal: desktopEditorParity.contentPaddingHorizontal,
    paddingVertical: desktopEditorParity.contentPaddingVertical,
    width: '100%',
  },
  contentCompact: {
    paddingHorizontal: mobileSpace.xl,
  },
  contentWide: {
    alignSelf: 'stretch',
    maxWidth: '100%',
    paddingHorizontal: 56,
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
    fontWeight: '600',
    textAlign: 'center',
  },
  editorHost: {
    flex: 1,
  },
  filePreviewContent: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    padding: mobileSpace.xxl,
  },
  filePreviewDescription: {
    maxWidth: 360,
    color: mobileColors.textMuted,
    fontSize: mobileType.body,
    lineHeight: 22,
    textAlign: 'center',
  },
  filePreviewFallback: {
    alignItems: 'center',
    gap: mobileSpace.md,
  },
  filePreviewTitle: {
    color: mobileColors.text,
    fontSize: mobileType.title,
    fontWeight: '600',
  },
  panel: {
    flex: 1,
  },
  title: {
    color: mobileColors.text,
    fontSize: desktopEditorParity.h1FontSize,
    fontWeight: '700',
    lineHeight: desktopEditorParity.h1LineHeight,
  },
  titleBlock: {
    borderBottomColor: mobileColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: desktopEditorParity.h1MarginBottom,
    paddingBottom: desktopEditorParity.h1PaddingBottom,
  },
  titleCompact: {
    fontSize: 30,
    lineHeight: 36,
  },
})
