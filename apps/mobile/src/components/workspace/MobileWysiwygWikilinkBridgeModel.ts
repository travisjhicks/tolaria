import { mobileWikilinkHref } from '../../workspace/mobileWikilinks'
import {
  isMobileImageAttachment,
  type MobileAttachmentImport,
} from '../../workspace/mobileAttachments'
import {
  activeMobileEmojiShortcodeQuery,
  activeMobilePersonMentionQuery,
  activeMobileWikilinkQuery,
} from '../../workspace/mobileWikilinkAutocomplete'
import type { TiptapJsonNode } from '../../workspace/mobileDocumentContent'
import {
  mobileMarkdownSourceBlockFormat,
  mobileMarkdownSourceBlockActions,
  mobileMarkdownSourceBlockLines,
} from '../../workspace/mobileMarkdownSourceBlocks'
import type { MobileMarkdownFormatAction } from '../../workspace/mobileMarkdownFormatting'
import type { NativeWysiwygMarkdownBlockAction } from './MobileWysiwygFormatCommands'

type NativeWysiwygWikilinkTextNode = {
  marks?: Array<{ attrs: { href: string }; type: 'link' }>
  text: string
  type: 'text'
}
type NativeWysiwygInsertionResult = { inserted: boolean; node: TiptapJsonNode }
type NativeWysiwygInlineMatchInput = {
  kind: NativeWysiwygInlineAutocompleteKind
  position: number
  projection: NativeWysiwygProjectedInlineText
  query: string
  start: number
}
type NativeWysiwygProjectedInlineText = {
  cursor: number
  positions: number[]
  text: string
}

export type NativeWysiwygWikilinkPayload = {
  label: string
  target: string
}

export type NativeWysiwygSelection = {
  from: number
  to: number
}
export type NativeWysiwygInlineAutocompleteKind = 'emoji' | 'personMention' | 'slashCommand' | 'wikilink'
export type NativeWysiwygInlineAutocomplete = {
  kind: NativeWysiwygInlineAutocompleteKind
  query: string
  range: NativeWysiwygSelection
}

export type NativeWysiwygAttachmentPayload = MobileAttachmentImport
export type NativeWysiwygMarkdownBlockPayload = {
  action: NativeWysiwygMarkdownBlockAction
}
export type NativeWysiwygPlainTextPayload = {
  text: string
}
export type NativeWysiwygSlashCommandAction =
  | NativeWysiwygMarkdownBlockAction
  | Extract<MobileMarkdownFormatAction,
    | 'bulletList'
    | 'heading1'
    | 'heading2'
    | 'heading3'
    | 'heading4'
    | 'heading5'
    | 'heading6'
    | 'orderedList'
    | 'quote'
    | 'taskList'
  >
export type NativeWysiwygSlashCommandPayload = {
  action: NativeWysiwygSlashCommandAction
}

export function nativeWysiwygWikilinkContent(
  payload: NativeWysiwygWikilinkPayload,
): NativeWysiwygWikilinkTextNode[] | null {
  const target = payload.target.trim()
  if (!target) return null

  const label = payload.label.trim() || target
  return [
    {
      marks: [{ attrs: { href: mobileWikilinkHref(target) }, type: 'link' }],
      text: label,
      type: 'text',
    },
    { text: ' ', type: 'text' },
  ]
}

export function nativeWysiwygAttachmentContent(
  payload: NativeWysiwygAttachmentPayload,
): NativeWysiwygWikilinkTextNode[] | TiptapJsonNode[] | null {
  return isMobileImageAttachment(payload)
    ? nativeWysiwygImageAttachmentContent(payload)
    : nativeWysiwygLinkAttachmentContent(payload)
}

export function nativeWysiwygDocumentWithInsertedWikilink({
  json,
  payload,
  selection,
}: {
  json: unknown
  payload: NativeWysiwygWikilinkPayload,
  selection?: NativeWysiwygSelection
}): TiptapJsonNode | null {
  if (!isTiptapDocument(json)) return null
  const content = nativeWysiwygWikilinkContent(payload)
  if (!content) return null

  return insertInlineContentWithFallback(json, content, selection)
}

export function nativeWysiwygDocumentWithInsertedAttachment({
  json,
  payload,
  selection,
}: {
  json: unknown
  payload: NativeWysiwygAttachmentPayload
  selection?: NativeWysiwygSelection
}): TiptapJsonNode | null {
  if (!isTiptapDocument(json)) return null

  return isMobileImageAttachment(payload)
    ? insertImageAttachment(json, payload, selection)
    : insertLinkAttachment(json, payload, selection)
}

export function nativeWysiwygDocumentWithInsertedMarkdownBlock({
  json,
  payload,
  selection,
}: {
  json: unknown
  payload: NativeWysiwygMarkdownBlockPayload
  selection?: NativeWysiwygSelection
}): TiptapJsonNode | null {
  if (!isTiptapDocument(json)) return null

  return insertBlockAfterSelection(json, nativeWysiwygMarkdownBlockNode(payload.action), selection).node
}

export function nativeWysiwygDocumentWithInsertedSlashCommandBlock({
  json,
  payload,
  selection,
}: {
  json: unknown
  payload: NativeWysiwygSlashCommandPayload
  selection?: NativeWysiwygSelection
}): TiptapJsonNode | null {
  if (!isTiptapDocument(json)) return null

  if (!selection) return insertBlockAfterSelection(json, nativeWysiwygSlashCommandBlockNode(payload.action)).node

  return insertSlashCommandBlockAtSelection(json, payload.action, normalizedSelection(selection))
}

export function nativeWysiwygDocumentWithInsertedPlainText({
  json,
  payload,
  selection,
}: {
  json: unknown
  payload: NativeWysiwygPlainTextPayload
  selection?: NativeWysiwygSelection
}): TiptapJsonNode | null {
  if (!isTiptapDocument(json)) return null

  const content = nativeWysiwygPlainTextContent(payload)
  if (!content) return null

  return insertInlineContentWithFallback(json, content, selection)
}

export function nativeWysiwygPlainTextContent(
  payload: NativeWysiwygPlainTextPayload,
): TiptapJsonNode[] | null {
  if (!payload.text) return null

  return payload.text.split('\n').flatMap((line, index): TiptapJsonNode[] => [
    ...(index > 0 ? [{ type: 'hardBreak' }] : []),
    ...(line ? [{ text: line, type: 'text' }] : []),
  ])
}

function nativeWysiwygImageAttachmentContent(payload: NativeWysiwygAttachmentPayload): TiptapJsonNode[] | null {
  const path = payload.path.trim()
  if (!path) return null

  return [{
    attrs: { alt: payload.name.trim() || 'attachment', src: path },
    type: 'image',
  }]
}

function nativeWysiwygLinkAttachmentContent(
  payload: NativeWysiwygAttachmentPayload,
): NativeWysiwygWikilinkTextNode[] | null {
  const path = payload.path.trim()
  if (!path) return null

  return [
    {
      marks: [{ attrs: { href: path }, type: 'link' }],
      text: payload.name.trim() || path,
      type: 'text',
    },
    { text: ' ', type: 'text' },
  ]
}

function nativeWysiwygMarkdownBlockNode(action: NativeWysiwygMarkdownBlockAction): TiptapJsonNode {
  if (action === 'codeBlock') return nativeWysiwygCodeBlockNode()
  if (action === 'mathBlock') return nativeWysiwygMathBlockNode()
  if (action === 'table') return nativeWysiwygTableNode()
  return nativeWysiwygSourceParagraph(mobileMarkdownSourceBlockLines(action))
}

function nativeWysiwygSlashCommandBlockNode(action: NativeWysiwygSlashCommandAction): TiptapJsonNode {
  if (isNativeWysiwygMarkdownBlockActionValue(action)) return nativeWysiwygMarkdownBlockNode(action)
  return nativeWysiwygFormattedBlockNode(action, [])
}

function nativeWysiwygCodeBlockNode(): TiptapJsonNode {
  return {
    attrs: { language: 'text' },
    content: [{ text: mobileMarkdownSourceBlockFormat('codeBlock')?.fallback ?? '', type: 'text' }],
    type: 'codeBlock',
  }
}

function nativeWysiwygMathBlockNode(): TiptapJsonNode {
  return {
    attrs: {
      latex: mobileMarkdownSourceBlockFormat('mathBlock')?.fallback ?? '',
    },
    type: 'mathBlock',
  }
}

function nativeWysiwygTableNode(): TiptapJsonNode {
  return {
    content: [
      nativeWysiwygTableRow('tableHeader', ['Column', 'Value']),
      nativeWysiwygTableRow('tableCell', ['Item', 'Detail']),
    ],
    type: 'table',
  }
}

function nativeWysiwygTableRow(cellType: 'tableCell' | 'tableHeader', cells: string[]): TiptapJsonNode {
  return {
    content: cells.map((cell) => nativeWysiwygTableCell(cellType, cell)),
    type: 'tableRow',
  }
}

function nativeWysiwygTableCell(cellType: 'tableCell' | 'tableHeader', text: string): TiptapJsonNode {
  return {
    content: [{ content: [{ text, type: 'text' }], type: 'paragraph' }],
    type: cellType,
  }
}

function nativeWysiwygSourceParagraph(lines: string[]): TiptapJsonNode {
  return {
    content: lines.flatMap((line, index): TiptapJsonNode[] => [
      ...(index > 0 ? [{ type: 'hardBreak' }] : []),
      ...(line ? [{ text: line, type: 'text' }] : []),
    ]),
    type: 'paragraph',
  }
}

function insertImageAttachment(
  node: TiptapJsonNode,
  payload: NativeWysiwygAttachmentPayload,
  selection?: NativeWysiwygSelection,
): TiptapJsonNode | null {
  const content = nativeWysiwygImageAttachmentContent(payload)
  if (!content) return null

  return insertBlockAfterSelection(node, content[0], selection)?.node ?? null
}

function insertLinkAttachment(
  node: TiptapJsonNode,
  payload: NativeWysiwygAttachmentPayload,
  selection?: NativeWysiwygSelection,
): TiptapJsonNode | null {
  const content = nativeWysiwygLinkAttachmentContent(payload)
  if (!content) return null

  return insertInlineContentWithFallback(node, content, selection)
}

function insertInlineContentWithFallback(
  node: TiptapJsonNode,
  content: TiptapJsonNode[],
  selection?: NativeWysiwygSelection,
): TiptapJsonNode | null {
  const selectedDocument = selection
    ? insertWikilinkAtSelection(node, content, normalizedSelection(selection))
    : null
  if (selectedDocument?.inserted) return selectedDocument.node

  return appendWikilinkToFirstParagraph(node, content)?.node ?? null
}

export function nativeWysiwygInlineAutocompleteAtSelection({
  json,
  selection,
}: {
  json: unknown
  selection?: NativeWysiwygSelection
}): NativeWysiwygInlineAutocomplete | null {
  if (!isTiptapDocument(json) || !selection) return null
  const normalized = normalizedSelection(selection)
  if (normalized.from !== normalized.to) return null

  return findInlineAutocompleteAtPosition(json, normalized.from)
}

function insertWikilinkAtSelection(
  node: TiptapJsonNode,
  wikilinkContent: TiptapJsonNode[],
  selection: NativeWysiwygSelection,
  nodeStart = 0,
): NativeWysiwygInsertionResult | null {
  if (isInlineContainer(node)) {
    return insertWikilinkIntoInlineContainer(node, wikilinkContent, selection, nodeStart + 1)
  }

  const children = node.content ?? []
  let childStart = node.type === 'doc' ? nodeStart : nodeStart + 1
  for (const [index, child] of children.entries()) {
    const childEnd = childStart + tiptapNodeSize(child)
    if (selection.from >= childStart && selection.from <= childEnd) {
      const childResult = insertWikilinkAtSelection(child, wikilinkContent, selection, childStart)
      if (childResult?.inserted) return withReplacedChild(node, index, childResult.node)
    }
    childStart = childEnd
  }

  return null
}

function findInlineAutocompleteAtPosition(
  node: TiptapJsonNode,
  position: number,
  nodeStart = 0,
): NativeWysiwygInlineAutocomplete | null {
  if (isInlineContainer(node)) {
    return inlineAutocompleteForContainer(node, position, nodeStart + 1)
  }

  const children = node.content ?? []
  let childStart = node.type === 'doc' ? nodeStart : nodeStart + 1
  for (const child of children) {
    const childEnd = childStart + tiptapNodeSize(child)
    if (position >= childStart && position <= childEnd) {
      const match = findInlineAutocompleteAtPosition(child, position, childStart)
      if (match) return match
    }
    childStart = childEnd
  }

  return null
}

function inlineAutocompleteForContainer(
  node: TiptapJsonNode,
  position: number,
  contentStart: number,
): NativeWysiwygInlineAutocomplete | null {
  if (positionInsideCodeMark(node.content ?? [], position, contentStart)) return null

  const projection = projectedInlineText(node.content ?? [], position, contentStart)
  const wikilinkMatch = activeMobileWikilinkQuery(projection.text, projection.cursor)
  if (wikilinkMatch) {
    return inlineAutocompleteMatch({
      kind: 'wikilink',
      position,
      projection,
      query: wikilinkMatch.query,
      start: wikilinkMatch.start,
    })
  }

  const mentionMatch = activeMobilePersonMentionQuery(projection.text, projection.cursor)
  if (mentionMatch && mentionMatch.query.length > 0) {
    return inlineAutocompleteMatch({
      kind: 'personMention',
      position,
      projection,
      query: mentionMatch.query,
      start: mentionMatch.start,
    })
  }

  const emojiMatch = activeMobileEmojiShortcodeQuery(projection.text, projection.cursor)
  if (emojiMatch) {
    return inlineAutocompleteMatch({
      kind: 'emoji',
      position,
      projection,
      query: emojiMatch.query,
      start: emojiMatch.start,
    })
  }

  return null
}

function inlineAutocompleteMatch({
  kind,
  position,
  projection,
  query,
  start,
}: NativeWysiwygInlineMatchInput): NativeWysiwygInlineAutocomplete | null {
  const from = projection.positions[start]
  if (from === undefined) return null

  return {
    kind,
    query,
    range: { from, to: position },
  }
}

function projectedInlineText(
  nodes: TiptapJsonNode[],
  position: number,
  contentStart: number,
): NativeWysiwygProjectedInlineText {
  const positions: number[] = []
  let cursor = contentStart
  let text = ''
  let textCursor: number | null = null

  for (const node of nodes) {
    const nodeSize = tiptapNodeSize(node)
    const nodeEnd = cursor + nodeSize
    if (typeof node.text === 'string') {
      if (position >= cursor && position <= nodeEnd) textCursor = text.length + position - cursor
      for (let index = 0; index < node.text.length; index += 1) positions.push(cursor + index)
      text += node.text
    } else {
      if (position >= cursor && position <= nodeEnd) textCursor = text.length
      positions.push(cursor)
      text += '\n'
    }
    cursor = nodeEnd
  }

  return {
    cursor: textCursor ?? text.length,
    positions,
    text,
  }
}

function positionInsideCodeMark(
  nodes: TiptapJsonNode[],
  position: number,
  contentStart: number,
): boolean {
  let cursor = contentStart

  for (const node of nodes) {
    const nodeEnd = cursor + tiptapNodeSize(node)
    if (positionTargetsCodeMarkedText(node, position, cursor, nodeEnd)) {
      return true
    }
    cursor = nodeEnd
  }

  return false
}

function positionTargetsCodeMarkedText(
  node: TiptapJsonNode,
  position: number,
  nodeStart: number,
  nodeEnd: number,
): boolean {
  if (typeof node.text !== 'string') return false
  if (!hasCodeMark(node)) return false

  return position > nodeStart && position <= nodeEnd
}

function hasCodeMark(node: TiptapJsonNode): boolean {
  return node.marks?.some((mark) => mark.type === 'code') ?? false
}

function appendWikilinkToFirstParagraph(
  node: TiptapJsonNode,
  wikilinkContent: TiptapJsonNode[],
): NativeWysiwygInsertionResult | null {
  return appendWikilinkToNodeType(node, wikilinkContent, 'paragraph')
    ?? appendWikilinkToNodeType(node, wikilinkContent, 'heading')
}

function insertBlockAfterSelection(
  node: TiptapJsonNode,
  block: TiptapJsonNode,
  selection?: NativeWysiwygSelection,
): NativeWysiwygInsertionResult {
  const children = node.content ?? []
  const insertionIndex = selection ? blockInsertionIndex(children, normalizedSelection(selection)) : children.length

  return {
    inserted: true,
    node: {
      ...node,
      content: [
        ...children.slice(0, insertionIndex).map(cloneNode),
        cloneNode(block),
        ...children.slice(insertionIndex).map(cloneNode),
      ],
    },
  }
}

function blockInsertionIndex(
  children: TiptapJsonNode[],
  selection: NativeWysiwygSelection,
): number {
  let childStart = 0
  for (const [index, child] of children.entries()) {
    const childEnd = childStart + tiptapNodeSize(child)
    if (selection.from >= childStart && selection.from <= childEnd) return index + 1
    childStart = childEnd
  }

  return children.length
}

function insertSlashCommandBlockAtSelection(
  node: TiptapJsonNode,
  action: NativeWysiwygSlashCommandAction,
  selection: NativeWysiwygSelection,
): TiptapJsonNode {
  const children = node.content ?? []
  const result = slashCommandBlockChildren(children, action, selection)
  return result.inserted
    ? { ...node, content: result.children }
    : insertBlockAfterSelection(node, nativeWysiwygSlashCommandBlockNode(action), selection).node
}

function slashCommandBlockChildren(
  children: TiptapJsonNode[],
  action: NativeWysiwygSlashCommandAction,
  selection: NativeWysiwygSelection,
): { children: TiptapJsonNode[]; inserted: boolean } {
  const nextChildren: TiptapJsonNode[] = []
  let childStart = 0
  let inserted = false

  for (const child of children) {
    const childEnd = childStart + tiptapNodeSize(child)
    if (inserted) {
      nextChildren.push(cloneNode(child))
    } else if (slashCommandSelectionTargetsChild(child, selection, childStart, childEnd)) {
      nextChildren.push(...slashCommandReplacementBlocks(child, action, selection, childStart + 1))
      inserted = true
    } else {
      nextChildren.push(cloneNode(child))
    }
    childStart = childEnd
  }

  return { children: nextChildren, inserted }
}

function slashCommandSelectionTargetsChild(
  child: TiptapJsonNode,
  selection: NativeWysiwygSelection,
  childStart: number,
  childEnd: number,
): boolean {
  if (!isInlineContainer(child)) return false
  if (selection.from < childStart) return false
  return selection.to <= childEnd
}

function slashCommandReplacementBlocks(
  node: TiptapJsonNode,
  action: NativeWysiwygSlashCommandAction,
  selection: NativeWysiwygSelection,
  contentStart: number,
): TiptapJsonNode[] {
  const before = inlineNodesBefore(node.content ?? [], selection.from, contentStart)
  const after = inlineNodesAfter(node.content ?? [], [], selection.to, contentStart)
  const remainingContent = isNativeWysiwygMarkdownBlockActionValue(action)
    ? inlineContentWithoutTrailingWhitespace([...before, ...after])
    : inlineContentAroundRemovedSlashQuery(before, after)

  if (!isNativeWysiwygMarkdownBlockActionValue(action)) {
    return [nativeWysiwygFormattedBlockNode(action, remainingContent)]
  }

  const prefixBlock = inlineContentHasMeaningfulText(remainingContent)
    ? [{ ...node, content: remainingContent }]
    : []

  return [...prefixBlock, nativeWysiwygMarkdownBlockNode(action)]
}

function nativeWysiwygFormattedBlockNode(
  action: Exclude<NativeWysiwygSlashCommandAction, NativeWysiwygMarkdownBlockAction>,
  content: TiptapJsonNode[],
): TiptapJsonNode {
  if (action.startsWith('heading')) {
    return {
      attrs: { level: Number(action.replace('heading', '')) },
      content: cloneInlineContent(content),
      type: 'heading',
    }
  }
  if (action === 'bulletList') return nativeWysiwygListBlock('bulletList', 'listItem', content)
  if (action === 'orderedList') return nativeWysiwygListBlock('orderedList', 'listItem', content)
  if (action === 'taskList') return nativeWysiwygListBlock('taskList', 'taskItem', content)
  return {
    content: [nativeWysiwygParagraphNode(content)],
    type: 'blockquote',
  }
}

function nativeWysiwygListBlock(
  listType: 'bulletList' | 'orderedList' | 'taskList',
  itemType: 'listItem' | 'taskItem',
  content: TiptapJsonNode[],
): TiptapJsonNode {
  return {
    content: [{
      attrs: itemType === 'taskItem' ? { checked: false } : undefined,
      content: [nativeWysiwygParagraphNode(content)],
      type: itemType,
    }],
    type: listType,
  }
}

function nativeWysiwygParagraphNode(content: TiptapJsonNode[]): TiptapJsonNode {
  return {
    content: cloneInlineContent(content),
    type: 'paragraph',
  }
}

function cloneInlineContent(content: TiptapJsonNode[]): TiptapJsonNode[] | undefined {
  return content.length > 0 ? content.map(cloneNode) : undefined
}

function inlineContentAroundRemovedSlashQuery(
  before: TiptapJsonNode[],
  after: TiptapJsonNode[],
): TiptapJsonNode[] {
  const trimmedBefore = trimTrailingInlineWhitespace(before)
  const trimmedAfter = trimLeadingInlineWhitespace(after)
  if (inlineContentHasMeaningfulText(trimmedBefore) && inlineContentHasMeaningfulText(trimmedAfter)) {
    return [...trimmedBefore, { text: ' ', type: 'text' }, ...trimmedAfter]
  }
  return [...trimmedBefore, ...trimmedAfter]
}

function trimTrailingInlineWhitespace(nodes: TiptapJsonNode[]): TiptapJsonNode[] {
  const lastNode = nodes.at(-1)
  if (typeof lastNode?.text !== 'string') return nodes.map(cloneNode)

  const trimmedText = lastNode.text.replace(/\s+$/u, '')
  const prefix = nodes.slice(0, -1).map(cloneNode)
  return trimmedText ? [...prefix, textNodeWithText(lastNode, trimmedText)] : prefix
}

function trimLeadingInlineWhitespace(nodes: TiptapJsonNode[]): TiptapJsonNode[] {
  const firstNode = nodes[0]
  if (typeof firstNode?.text !== 'string') return nodes.map(cloneNode)

  const trimmedText = firstNode.text.replace(/^\s+/u, '')
  const suffix = nodes.slice(1).map(cloneNode)
  return trimmedText ? [textNodeWithText(firstNode, trimmedText), ...suffix] : suffix
}

function isNativeWysiwygMarkdownBlockActionValue(
  action: NativeWysiwygSlashCommandAction,
): action is NativeWysiwygMarkdownBlockAction {
  return mobileMarkdownSourceBlockActions.includes(action as NativeWysiwygMarkdownBlockAction)
}

function inlineContentWithoutTrailingWhitespace(nodes: TiptapJsonNode[]): TiptapJsonNode[] {
  const lastNode = nodes.at(-1)
  if (typeof lastNode?.text !== 'string') return nodes

  const trimmedText = lastNode.text.replace(/\s+$/u, '')
  const prefix = nodes.slice(0, -1)
  return trimmedText ? [...prefix, textNodeWithText(lastNode, trimmedText)] : prefix
}

function inlineContentHasMeaningfulText(nodes: TiptapJsonNode[]): boolean {
  return nodes.some((node) => (
    typeof node.text === 'string' ? node.text.trim().length > 0 : true
  ))
}

function appendWikilinkToNodeType(
  node: TiptapJsonNode,
  wikilinkContent: TiptapJsonNode[],
  type: string,
): NativeWysiwygInsertionResult | null {
  if (node.type === type) {
    return {
      inserted: true,
      node: {
        ...node,
        content: [...(node.content ?? []), ...wikilinkContent.map(cloneNode)],
      },
    }
  }

  for (const [index, child] of (node.content ?? []).entries()) {
    const childResult = appendWikilinkToNodeType(child, wikilinkContent, type)
    if (childResult?.inserted) return withReplacedChild(node, index, childResult.node)
  }

  return null
}

function insertWikilinkIntoInlineContainer(
  node: TiptapJsonNode,
  wikilinkContent: TiptapJsonNode[],
  selection: NativeWysiwygSelection,
  contentStart: number,
): NativeWysiwygInsertionResult {
  return {
    inserted: true,
    node: {
      ...node,
      content: inlineContentWithInsertedWikilink(node.content ?? [], wikilinkContent, selection, contentStart),
    },
  }
}

function inlineContentWithInsertedWikilink(
  nodes: TiptapJsonNode[],
  wikilinkContent: TiptapJsonNode[],
  selection: NativeWysiwygSelection,
  contentStart: number,
): TiptapJsonNode[] {
  if (nodes.length === 0) return wikilinkContent.map(cloneNode)

  const contextualContent = inlineContentForSelection(nodes, wikilinkContent, selection, contentStart)
  return [
    ...inlineNodesBefore(nodes, selection.from, contentStart),
    ...contextualContent.map(cloneNode),
    ...inlineNodesAfter(nodes, contextualContent, selection.to, contentStart),
  ]
}

function inlineContentForSelection(
  nodes: TiptapJsonNode[],
  content: TiptapJsonNode[],
  selection: NativeWysiwygSelection,
  contentStart: number,
): TiptapJsonNode[] {
  const nextCharacter = firstInlineTextCharacterAtOrAfter(nodes, selection.to, contentStart)
  if (keepsTrailingInlineSeparator(nextCharacter)) return content

  return withoutTrailingInlineSeparator(content)
}

function firstInlineTextCharacterAtOrAfter(
  nodes: TiptapJsonNode[],
  position: number,
  contentStart: number,
): string | null {
  let cursor = contentStart

  for (const node of nodes) {
    const nodeEnd = cursor + tiptapNodeSize(node)
    if (typeof node.text === 'string') {
      if (position < nodeEnd) return node.text.at(Math.max(position - cursor, 0)) ?? null
    } else if (position <= nodeEnd) {
      return null
    }
    cursor = nodeEnd
  }

  return null
}

function keepsTrailingInlineSeparator(nextCharacter: string | null): boolean {
  if (nextCharacter === null) return true
  if (/\s/u.test(nextCharacter)) return true

  return !/^[,.;:!?%)}\]”’]/u.test(nextCharacter)
}

function withoutTrailingInlineSeparator(content: TiptapJsonNode[]): TiptapJsonNode[] {
  const trailingNode = content.at(-1)
  return trailingNode?.text === ' ' ? content.slice(0, -1) : content
}

function inlineNodesBefore(
  nodes: TiptapJsonNode[],
  position: number,
  contentStart: number,
): TiptapJsonNode[] {
  const before: TiptapJsonNode[] = []
  let cursor = contentStart

  for (const node of nodes) {
    const nodeEnd = cursor + tiptapNodeSize(node)
    appendInlineSlice(before, node, 0, Math.min(position, nodeEnd) - cursor)
    if (position <= nodeEnd) break
    cursor = nodeEnd
  }

  return before
}

function inlineNodesAfter(
  nodes: TiptapJsonNode[],
  wikilinkContent: TiptapJsonNode[],
  position: number,
  contentStart: number,
): TiptapJsonNode[] {
  const after: TiptapJsonNode[] = []
  let cursor = contentStart
  let trimLeadingSpace = wikilinkContent.at(-1)?.text === ' '

  for (const node of nodes) {
    const nodeEnd = cursor + tiptapNodeSize(node)
    if (position < nodeEnd) {
      const beforeLength = after.length
      appendInlineSlice(after, node, Math.max(position - cursor, 0), nodeEnd - cursor, { trimLeadingSpace })
      trimLeadingSpace = trimLeadingSpace && after.length === beforeLength
    }
    cursor = nodeEnd
  }

  return after
}

function appendInlineSlice(
  nodes: TiptapJsonNode[],
  node: TiptapJsonNode,
  from: number,
  to: number,
  options: { trimLeadingSpace?: boolean } = {},
): void {
  if (from >= to) return
  if (typeof node.text === 'string') {
    const text = node.text.slice(from, to)
    const normalizedText = options.trimLeadingSpace && text.startsWith(' ') ? text.slice(1) : text
    if (normalizedText) nodes.push(textNodeWithText(node, normalizedText))
    return
  }
  if (from === 0 && to >= tiptapNodeSize(node)) nodes.push(cloneNode(node))
}

function withReplacedChild(
  node: TiptapJsonNode,
  index: number,
  child: TiptapJsonNode,
): NativeWysiwygInsertionResult {
  return {
    inserted: true,
    node: {
      ...node,
      content: (node.content ?? []).map((candidate, candidateIndex) => (
        candidateIndex === index ? child : cloneNode(candidate)
      )),
    },
  }
}

function normalizedSelection(selection: NativeWysiwygSelection): NativeWysiwygSelection {
  return {
    from: Math.max(0, Math.min(selection.from, selection.to)),
    to: Math.max(0, Math.max(selection.from, selection.to)),
  }
}

function isInlineContainer(node: TiptapJsonNode): boolean {
  return node.type === 'paragraph' || node.type === 'heading'
}

function isTiptapDocument(value: unknown): value is TiptapJsonNode {
  return Boolean(value && typeof value === 'object' && (value as TiptapJsonNode).type === 'doc')
}

function tiptapNodeSize(node: TiptapJsonNode): number {
  if (typeof node.text === 'string') return node.text.length
  if (!node.content) return 1

  return node.content.reduce((size, child) => size + tiptapNodeSize(child), 2)
}

function textNodeWithText(node: TiptapJsonNode, text: string): TiptapJsonNode {
  return { ...cloneNode(node), text }
}

function cloneNode(node: TiptapJsonNode): TiptapJsonNode {
  return {
    ...node,
    attrs: node.attrs ? { ...node.attrs } : undefined,
    content: node.content?.map(cloneNode),
    marks: node.marks?.map((mark) => ({
      ...mark,
      attrs: mark.attrs ? { ...mark.attrs } : undefined,
    })),
  }
}
