import {
  Check,
  DotsThree,
  FileText,
  PencilSimple,
  Star,
} from 'phosphor-react-native'
import { Pressable, ScrollView, StyleSheet, type TextStyle, View } from 'react-native'
import { useMemo, useState } from 'react'
import { Text } from '../components/ui/text'
import { mobileText } from '../i18n/mobileText'
import { MobileChip } from '../ui/MobileChip'
import { MobileIconButton } from '../ui/MobileIconButton'
import { MobilePanel, MobileToolbar, MobileToolbarTitle } from '../ui/MobilePanel'
import { MobileTextInput } from '../ui/MobileTextInput'
import { desktopEditorParity, desktopToolbarActionParity } from '../ui/desktopParity'
import { mobileColors, mobileRadius, mobileSpace, mobileType } from '../ui/tokens'
import { parseLocalVaultDocument } from '../workspace/localVaultFrontmatter'
import {
  mobileWikilinkSuggestions,
  replaceTrailingWikilinkQuery,
  trailingWikilinkQuery,
} from '../workspace/mobileWorkspaceEditing'
import type { MobileEditorBlock, MobileEditorInline, MobileNote } from '../workspace/mobileWorkspaceModel'

type TabletEditorPanelProps = {
  blocks: MobileEditorBlock[]
  bullets: string[]
  compact: boolean
  note: MobileNote | null
  notes: MobileNote[]
  onOpenMoreActions: () => void
  onToggleFavorite: () => void
  onUpdateContent: (noteId: string, content: string) => void
  onUpdateTitle: (noteId: string, title: string) => void
}

export function TabletEditorPanel(props: TabletEditorPanelProps) {
  const {
    blocks,
    bullets,
    compact,
    note,
    notes,
    onOpenMoreActions,
    onToggleFavorite,
    onUpdateContent,
    onUpdateTitle,
  } = props
  const [editing, setEditing] = useState(false)

  if (!note) {
    return <EmptyEditorPanel />
  }

  return (
    <MobilePanel style={panelStyles.panel} testID="editor-panel">
      <MobileToolbar testID="editor-toolbar">
        <FileText color={mobileColors.textMuted} size={desktopToolbarActionParity.iconSize} />
        <MobileToolbarTitle testID="editor-toolbar-title" title={note.title} />
        <MobileChip label={note.workspace} tone="gray" />
        <MobileIconButton
          accessibilityLabel={mobileText(note.favorite ? 'command.note.removeFavorite' : 'command.note.addFavorite')}
          testID="editor-favorite-action"
          onPress={onToggleFavorite}
        >
          <Star color={note.favorite ? mobileColors.primary : mobileColors.textMuted} size={desktopToolbarActionParity.iconSize} weight={note.favorite ? 'fill' : 'regular'} />
        </MobileIconButton>
        <MobileIconButton
          accessibilityLabel={mobileText(editing ? 'common.save' : 'editor.toolbar.rawOpen')}
          testID="editor-edit-action"
          onPress={() => setEditing((current) => !current)}
        >
          {editing
            ? <Check color={mobileColors.primary} size={desktopToolbarActionParity.iconSize} weight="bold" />
            : <PencilSimple color={mobileColors.textMuted} size={desktopToolbarActionParity.iconSize} />}
        </MobileIconButton>
        <MobileIconButton accessibilityLabel={mobileText('editor.toolbar.moreActions')} testID="editor-more-action" onPress={onOpenMoreActions}>
          <DotsThree color={mobileColors.textMuted} size={desktopToolbarActionParity.iconSize} weight="bold" />
        </MobileIconButton>
      </MobileToolbar>
      <ScrollView contentContainerStyle={[panelStyles.content, compact ? panelStyles.contentCompact : null]} testID="editor-scroll">
        {editing ? (
          <MarkdownEditor
            compact={compact}
            note={note}
            notes={notes}
            onUpdateContent={onUpdateContent}
            onUpdateTitle={onUpdateTitle}
          />
        ) : (
          <>
            <View style={panelStyles.titleBlock} testID="editor-title-block">
              <Text style={[panelStyles.title, compact ? panelStyles.titleCompact : null]} testID="editor-title">{note.title}</Text>
            </View>
            <EditorBlocks blocks={blocks} fallbackBullets={bullets} />
          </>
        )}
      </ScrollView>
    </MobilePanel>
  )
}

function MarkdownEditor({
  compact,
  note,
  notes,
  onUpdateContent,
  onUpdateTitle,
}: {
  compact: boolean
  note: MobileNote
  notes: MobileNote[]
  onUpdateContent: (noteId: string, content: string) => void
  onUpdateTitle: (noteId: string, title: string) => void
}) {
  const content = parseLocalVaultDocument(note.rawContent ?? `# ${note.title}\n\n`).body
  const wikilinkQuery = trailingWikilinkQuery(content)
  const suggestions = useMemo(
    () => wikilinkQuery === null ? [] : mobileWikilinkSuggestions(notes, wikilinkQuery),
    [notes, wikilinkQuery],
  )

  return (
    <View style={editorFormStyles.form} testID="editor-markdown-form">
      <MobileTextInput
        label={mobileText('noteList.sort.title')}
        testID="editor-title-input"
        value={note.title}
        onChangeText={(title) => onUpdateTitle(note.id, title)}
      />
      <MobileTextInput
        label={mobileText('editor.raw.label')}
        multiline
        scrollEnabled={false}
        style={[editorFormStyles.bodyInput, compact ? editorFormStyles.bodyInputCompact : null]}
        testID="editor-markdown-input"
        textAlignVertical="top"
        value={content}
        onChangeText={(nextContent) => onUpdateContent(note.id, nextContent)}
      />
      {suggestions.length > 0 ? (
        <View style={editorFormStyles.suggestions} testID="editor-wikilink-suggestions">
          {suggestions.map((suggestion) => (
            <Pressable
              accessibilityLabel={suggestion.title}
              accessibilityRole="button"
              key={suggestion.id}
              style={({ pressed }) => [editorFormStyles.suggestionRow, pressed ? editorFormStyles.suggestionRowPressed : null]}
              testID={`editor-wikilink-suggestion-${suggestion.id}`}
              onPress={() => {
                onUpdateContent(note.id, replaceTrailingWikilinkQuery(content, wikilinkQuery ?? '', suggestion))
              }}
            >
              <Text numberOfLines={1} style={editorFormStyles.suggestionTitle}>{suggestion.title}</Text>
              <MobileChip label={suggestion.type} tone="gray" />
            </Pressable>
          ))}
        </View>
      ) : null}
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

function EditorBlocks({
  blocks,
  fallbackBullets,
}: {
  blocks: MobileEditorBlock[]
  fallbackBullets: string[]
}) {
  if (blocks.length === 0) {
    return <FallbackBullets bullets={fallbackBullets} />
  }

  return (
    <>
      {blocks.map((block, index) => <EditorBlock block={block} key={`${block.kind}-${index}`} />)}
    </>
  )
}

function FallbackBullets({ bullets }: { bullets: string[] }) {
  return (
    <>
      {bullets.map((item) => (
        <View key={item} style={bulletStyles.row} testID="editor-bullet-row">
          <Text style={bulletStyles.marker}>•</Text>
          <Text style={textStyles.body}>{item}</Text>
        </View>
      ))}
    </>
  )
}

function EditorBlock({ block }: { block: MobileEditorBlock }) {
  if (block.kind === 'paragraph') {
    return <InlineText content={block.content} style={textStyles.paragraph} testID="editor-paragraph" />
  }

  if (block.kind === 'heading') {
    return <EditorHeading block={block} />
  }

  if (block.kind === 'bullets') {
    return <EditorBulletList items={block.items} />
  }

  if (block.kind === 'quote') {
    return <EditorQuote content={block.content} />
  }

  return <EditorTable headers={block.headers} rows={block.rows} />
}

function EditorHeading({ block }: { block: Extract<MobileEditorBlock, { kind: 'heading' }> }) {
  return (
    <Text style={[textStyles.heading, block.level === 3 ? textStyles.headingSmall : null]} testID={`editor-heading-${block.level}`}>
      {block.text}
    </Text>
  )
}

function EditorBulletList({ items }: { items: MobileEditorInline[][] }) {
  return (
    <View style={bulletStyles.group}>
      {items.map((item, index) => (
        <View key={`bullet-${index}`} style={bulletStyles.row} testID="editor-bullet-row">
          <Text style={bulletStyles.marker}>•</Text>
          <InlineText content={item} style={textStyles.body} testID="editor-bullet-text" />
        </View>
      ))}
    </View>
  )
}

function EditorQuote({ content }: { content: MobileEditorInline[] }) {
  return (
    <View style={quoteStyles.container} testID="editor-quote">
      <InlineText content={content} style={quoteStyles.text} testID="editor-quote-text" />
    </View>
  )
}

function InlineText({
  content,
  style,
  testID,
}: {
  content: MobileEditorInline[]
  style: TextStyle
  testID?: string
}) {
  return (
    <Text style={style} testID={testID}>
      {content.map((segment, index) => (
        <Text
          key={`${segment.text}-${index}`}
          style={[
            segment.bold ? inlineStyles.bold : null,
            segment.italic ? inlineStyles.italic : null,
            segment.code ? inlineStyles.code : null,
          ]}
        >
          {segment.text}
        </Text>
      ))}
    </Text>
  )
}

function EditorTable({
  headers,
  rows,
}: {
  headers: string[]
  rows: string[][]
}) {
  return (
    <View style={tableStyles.table} testID="editor-table">
      <View style={[tableStyles.row, tableStyles.headerRow]}>
        {headers.map((header) => (
          <Text key={header} style={[tableStyles.cell, tableStyles.headerCell]}>{header}</Text>
        ))}
      </View>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={tableStyles.row}>
          {row.map((cell, cellIndex) => (
            <Text key={`${cell}-${cellIndex}`} style={tableStyles.cell}>{cell}</Text>
          ))}
        </View>
      ))}
    </View>
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

const textStyles = StyleSheet.create({
  body: {
    flex: 1,
    color: mobileColors.text,
    fontSize: desktopEditorParity.bodyFontSize,
    lineHeight: desktopEditorParity.bodyLineHeight,
  },
  heading: {
    color: mobileColors.text,
    fontSize: desktopEditorParity.h2FontSize,
    fontWeight: '600',
    lineHeight: desktopEditorParity.h2LineHeight,
    marginBottom: desktopEditorParity.h2MarginBottom,
    marginTop: desktopEditorParity.h2MarginTop,
  },
  headingSmall: {
    fontSize: desktopEditorParity.h3FontSize,
    lineHeight: desktopEditorParity.h3LineHeight,
    marginBottom: desktopEditorParity.h3MarginBottom,
    marginTop: desktopEditorParity.h3MarginTop,
  },
  paragraph: {
    color: mobileColors.text,
    fontSize: desktopEditorParity.bodyFontSize,
    lineHeight: desktopEditorParity.bodyLineHeight,
    marginBottom: desktopEditorParity.paragraphSpacing,
  },
})

const inlineStyles = StyleSheet.create({
  bold: {
    color: mobileColors.text,
    fontWeight: '700',
  },
  code: {
    overflow: 'hidden',
    borderRadius: 3,
    backgroundColor: mobileColors.graySoft,
    color: mobileColors.textMuted,
    fontFamily: 'Menlo',
    fontSize: 14,
  },
  italic: {
    color: mobileColors.text,
    fontStyle: 'italic',
  },
})

const editorFormStyles = StyleSheet.create({
  bodyInput: {
    minHeight: 420,
    fontFamily: 'Menlo',
    fontSize: 14,
    lineHeight: 21,
    paddingVertical: mobileSpace.sm,
  },
  bodyInputCompact: {
    minHeight: 360,
  },
  form: {
    gap: mobileSpace.md,
  },
  suggestionRow: {
    minHeight: 32,
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.sm,
    borderRadius: 6,
    paddingHorizontal: mobileSpace.sm,
    paddingVertical: mobileSpace.xs,
  },
  suggestionRowPressed: {
    backgroundColor: mobileColors.graySoft,
  },
  suggestions: {
    gap: mobileSpace.xs,
  },
  suggestionTitle: {
    minWidth: 0,
    flex: 1,
    color: mobileColors.text,
    fontSize: mobileType.body,
    fontWeight: '500',
  },
})

const bulletStyles = StyleSheet.create({
  group: {
    marginBottom: desktopEditorParity.paragraphSpacing,
  },
  marker: {
    color: mobileColors.primary,
    fontSize: desktopEditorParity.listBulletSize,
    lineHeight: desktopEditorParity.bodyLineHeight,
    minWidth: desktopEditorParity.listIndentSize,
  },
  row: {
    flexDirection: 'row',
    gap: desktopEditorParity.listBulletGap,
    marginBottom: mobileSpace.xs,
  },
})

const quoteStyles = StyleSheet.create({
  container: {
    borderLeftColor: mobileColors.primary,
    borderLeftWidth: 3,
    marginVertical: desktopEditorParity.quoteMarginVertical,
    paddingLeft: desktopEditorParity.quotePaddingLeft,
  },
  text: {
    color: mobileColors.textMuted,
    fontSize: desktopEditorParity.bodyFontSize,
    fontStyle: 'italic',
    lineHeight: desktopEditorParity.bodyLineHeight,
  },
})

const tableStyles = StyleSheet.create({
  cell: {
    flex: 1,
    borderBottomColor: mobileColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRightColor: mobileColors.border,
    borderRightWidth: StyleSheet.hairlineWidth,
    color: mobileColors.text,
    fontSize: desktopEditorParity.tableFontSize,
    lineHeight: 20,
    paddingHorizontal: desktopEditorParity.tableCellPaddingHorizontal,
    paddingVertical: desktopEditorParity.tableCellPaddingVertical,
  },
  headerCell: {
    backgroundColor: mobileColors.card,
    fontWeight: '600',
  },
  headerRow: {
    backgroundColor: mobileColors.card,
  },
  row: {
    flexDirection: 'row',
  },
  table: {
    overflow: 'hidden',
    borderColor: mobileColors.border,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRadius: mobileRadius.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: mobileSpace.md,
  },
})
