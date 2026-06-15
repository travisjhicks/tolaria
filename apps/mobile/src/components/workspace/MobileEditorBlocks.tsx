import { CheckSquare, Square } from 'phosphor-react-native'
import { Linking, StyleSheet, type TextStyle, View } from 'react-native'
import { Text } from '../ui/text'
import {
  desktopEditorParity,
} from '../../ui/desktopParity'
import { mobileColors, mobileRadius, mobileSpace } from '../../ui/tokens'
import type {
  MobileEditorBlock,
  MobileEditorInline,
  MobileEditorListItem,
  MobileEditorOrderedListItem,
  MobileEditorTaskItem,
} from '../../workspace/mobileWorkspaceModel'

type MobileEditorBlocksProps = {
  blocks: MobileEditorBlock[]
  fallbackBullets: string[]
  onNavigateWikilink: (target: string) => void
}

type EditorListProps =
  | {
    items: MobileEditorListItem[]
    onNavigateWikilink: (target: string) => void
    variant: 'bullet'
  }
  | {
    items: MobileEditorOrderedListItem[]
    onNavigateWikilink: (target: string) => void
    variant: 'ordered'
  }
  | {
    items: MobileEditorTaskItem[]
    onNavigateWikilink: (target: string) => void
    variant: 'task'
  }

const bulletSymbols = ['•', '◦', '▪'] as const

export function MobileEditorBlocks({
  blocks,
  fallbackBullets,
  onNavigateWikilink,
}: MobileEditorBlocksProps) {
  if (blocks.length === 0) {
    return <FallbackBullets bullets={fallbackBullets} />
  }

  return (
    <>
      {blocks.map((block, index) => (
        <EditorBlock block={block} key={`${block.kind}-${index}`} onNavigateWikilink={onNavigateWikilink} />
      ))}
    </>
  )
}

function FallbackBullets({ bullets }: { bullets: string[] }) {
  return (
    <>
      {bullets.map((item) => (
        <View key={item} style={listStyles.row} testID="editor-bullet-row">
          <Text style={listStyles.marker}>•</Text>
          <Text style={textStyles.body}>{item}</Text>
        </View>
      ))}
    </>
  )
}

function EditorBlock({
  block,
  onNavigateWikilink,
}: {
  block: MobileEditorBlock
  onNavigateWikilink: (target: string) => void
}) {
  if (block.kind === 'paragraph') return <EditorParagraph block={block} onNavigateWikilink={onNavigateWikilink} />
  if (block.kind === 'heading') return <EditorHeading block={block} />
  if (block.kind === 'bullets') return <EditorList items={block.items} variant="bullet" onNavigateWikilink={onNavigateWikilink} />
  if (block.kind === 'orderedList') return <EditorList items={block.items} variant="ordered" onNavigateWikilink={onNavigateWikilink} />
  if (block.kind === 'tasks') return <EditorList items={block.items} variant="task" onNavigateWikilink={onNavigateWikilink} />
  if (block.kind === 'quote') return <EditorQuote content={block.content} onNavigateWikilink={onNavigateWikilink} />
  if (block.kind === 'codeBlock') return <EditorCodeBlock code={block.code} language={block.language ?? null} />
  if (block.kind === 'divider') return <View style={dividerStyles.divider} testID="editor-divider" />
  return <EditorTable headers={block.headers} rows={block.rows} />
}

function EditorParagraph({
  block,
  onNavigateWikilink,
}: {
  block: Extract<MobileEditorBlock, { kind: 'paragraph' }>
  onNavigateWikilink: (target: string) => void
}) {
  return (
    <InlineText
      content={block.content}
      style={textStyles.paragraph}
      testID="editor-paragraph"
      onNavigateWikilink={onNavigateWikilink}
    />
  )
}

function EditorHeading({ block }: { block: Extract<MobileEditorBlock, { kind: 'heading' }> }) {
  return (
    <Text style={headingStylesForLevel(block.level)} testID={`editor-heading-${block.level}`}>
      {block.text}
    </Text>
  )
}

function EditorList(props: EditorListProps) {
  return (
    <View style={listStyles.group}>
      {props.items.map((item, index) => editorListRow(props, item, index))}
    </View>
  )
}

function editorListRow(props: EditorListProps, item: MobileEditorListItem, index: number) {
  if (props.variant === 'task') {
    return (
      <TaskRow
        item={item as MobileEditorTaskItem}
        key={`task-${index}`}
        testID="editor-task-row"
        onNavigateWikilink={props.onNavigateWikilink}
      />
    )
  }

  return (
    <ListRow
      item={item}
      key={`${props.variant}-${index}`}
      marker={listMarker(props.variant, item)}
      testID={`editor-${props.variant}-row`}
      textTestID={`editor-${props.variant}-text`}
      onNavigateWikilink={props.onNavigateWikilink}
    />
  )
}

function ListRow({
  item,
  marker,
  onNavigateWikilink,
  testID,
  textTestID,
}: {
  item: MobileEditorListItem
  marker: string
  onNavigateWikilink: (target: string) => void
  testID: string
  textTestID: string
}) {
  return (
    <View style={[listStyles.row, listDepthStyle(item.depth)]} testID={testID}>
      <Text style={listStyles.marker}>{marker}</Text>
      <InlineText content={item.content} style={textStyles.body} testID={textTestID} onNavigateWikilink={onNavigateWikilink} />
    </View>
  )
}

function TaskRow({
  item,
  onNavigateWikilink,
  testID,
}: {
  item: MobileEditorTaskItem
  onNavigateWikilink: (target: string) => void
  testID: string
}) {
  const Icon = item.checked ? CheckSquare : Square

  return (
    <View style={[listStyles.taskRow, listDepthStyle(item.depth)]} testID={testID}>
      <View style={listStyles.taskIcon}>
        <Icon
          color={item.checked ? mobileColors.primary : mobileColors.textMuted}
          size={desktopEditorParity.listCheckboxSize}
          weight={item.checked ? 'fill' : 'regular'}
        />
      </View>
      <InlineText content={item.content} style={textStyles.body} testID="editor-task-text" onNavigateWikilink={onNavigateWikilink} />
    </View>
  )
}

function EditorQuote({
  content,
  onNavigateWikilink,
}: {
  content: MobileEditorInline[]
  onNavigateWikilink: (target: string) => void
}) {
  return (
    <View style={quoteStyles.container} testID="editor-quote">
      <InlineText content={content} style={quoteStyles.text} testID="editor-quote-text" onNavigateWikilink={onNavigateWikilink} />
    </View>
  )
}

function EditorCodeBlock({
  code,
  language,
}: {
  code: string
  language: string | null
}) {
  return (
    <View style={codeBlockStyles.container} testID="editor-code-block">
      {language ? <Text style={codeBlockStyles.language} testID="editor-code-language">{language}</Text> : null}
      <Text selectable style={codeBlockStyles.code}>{code}</Text>
    </View>
  )
}

function InlineText({
  content,
  onNavigateWikilink,
  style,
  testID,
}: {
  content: MobileEditorInline[]
  onNavigateWikilink: (target: string) => void
  style: TextStyle
  testID?: string
}) {
  return (
    <Text style={style} testID={testID}>
      {content.map((segment, index) => (
        <Text
          key={`${segment.text}-${index}`}
          style={inlineSegmentStyles(segment)}
          testID={inlineSegmentTestId(segment)}
          onPress={inlineSegmentPressHandler(segment, onNavigateWikilink)}
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

function headingStylesForLevel(level: number) {
  if (level === 1) return [textStyles.heading, textStyles.headingOne]
  if (level === 2) return textStyles.heading
  if (level === 3) return [textStyles.heading, textStyles.headingSmall]
  return [textStyles.heading, textStyles.headingFour]
}

function inlineSegmentStyles(segment: MobileEditorInline): TextStyle[] {
  const styles: TextStyle[] = []
  if (segment.bold) styles.push(inlineStyles.bold)
  if (segment.italic) styles.push(inlineStyles.italic)
  if (segment.code) styles.push(inlineStyles.code)
  if (segment.strike) styles.push(inlineStyles.strike)
  if (segment.linkHref) styles.push(inlineStyles.link)
  if (segment.wikilinkTarget) styles.push(inlineStyles.wikilink)
  return styles
}

function inlineSegmentTestId(segment: MobileEditorInline): string | undefined {
  if (segment.wikilinkTarget) return `editor-wikilink-${testIdSegment(segment.wikilinkTarget)}`
  if (segment.linkHref) return `editor-link-${testIdSegment(segment.linkHref)}`
  if (segment.strike) return 'editor-strikethrough'
  return undefined
}

function inlineSegmentPressHandler(
  segment: MobileEditorInline,
  onNavigateWikilink: (target: string) => void,
) {
  if (segment.wikilinkTarget) return () => onNavigateWikilink(segment.wikilinkTarget ?? '')
  if (segment.linkHref) return () => { void Linking.openURL(segment.linkHref ?? '') }
  return undefined
}

function listMarker(variant: Exclude<EditorListProps['variant'], 'task'>, item: MobileEditorListItem) {
  if (variant === 'ordered') return (item as MobileEditorOrderedListItem).marker
  return bulletSymbols[(item.depth ?? 0) % bulletSymbols.length]
}

function listDepthStyle(depth: number | undefined) {
  return depth ? { paddingLeft: depth * desktopEditorParity.listIndentSize } : null
}

function testIdSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

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
  headingFour: {
    fontSize: desktopEditorParity.h4FontSize,
    lineHeight: desktopEditorParity.h4LineHeight,
    marginBottom: desktopEditorParity.h4MarginBottom,
    marginTop: desktopEditorParity.h4MarginTop,
  },
  headingOne: {
    fontSize: desktopEditorParity.h1FontSize,
    lineHeight: desktopEditorParity.h1LineHeight,
    marginBottom: desktopEditorParity.h1MarginBottom,
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
    fontSize: desktopEditorParity.inlineCodeFontSize,
    paddingHorizontal: desktopEditorParity.inlineCodePaddingHorizontal,
    paddingVertical: desktopEditorParity.inlineCodePaddingVertical,
  },
  italic: {
    color: mobileColors.text,
    fontStyle: 'italic',
  },
  link: {
    color: mobileColors.primary,
    textDecorationLine: 'underline',
  },
  strike: {
    color: mobileColors.textMuted,
    textDecorationLine: 'line-through',
  },
  wikilink: {
    color: mobileColors.primary,
  },
})

const listStyles = StyleSheet.create({
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
    marginBottom: desktopEditorParity.listItemSpacing,
  },
  taskIcon: {
    width: desktopEditorParity.listIndentSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskRow: {
    flexDirection: 'row',
    gap: desktopEditorParity.listCheckboxGap,
    marginBottom: desktopEditorParity.listItemSpacing,
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

const codeBlockStyles = StyleSheet.create({
  code: {
    color: mobileColors.text,
    fontFamily: 'Menlo',
    fontSize: desktopEditorParity.inlineCodeFontSize,
    lineHeight: 20,
  },
  container: {
    borderColor: mobileColors.border,
    borderRadius: mobileRadius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: mobileColors.sidebar,
    marginVertical: mobileSpace.md,
    paddingHorizontal: mobileSpace.md,
    paddingVertical: mobileSpace.sm,
  },
  language: {
    color: mobileColors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: mobileSpace.xs,
    textTransform: 'uppercase',
  },
})

const dividerStyles = StyleSheet.create({
  divider: {
    borderTopColor: mobileColors.border,
    borderTopWidth: desktopEditorParity.horizontalRuleThickness,
    marginVertical: desktopEditorParity.horizontalRuleMarginVertical,
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
