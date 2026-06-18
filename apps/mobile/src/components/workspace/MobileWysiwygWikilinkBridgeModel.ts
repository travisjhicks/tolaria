import { mobileWikilinkHref } from '../../workspace/mobileWikilinks'
import {
  isMobileImageAttachment,
  type MobileAttachmentImport,
} from '../../workspace/mobileAttachments'
import {
  activeMobilePersonMentionQuery,
  activeMobileWikilinkQuery,
} from '../../workspace/mobileWikilinkAutocomplete'
import type { TiptapJsonNode } from '../../workspace/mobileDocumentContent'

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
export type NativeWysiwygInlineAutocompleteKind = 'personMention' | 'wikilink'
export type NativeWysiwygInlineAutocomplete = {
  kind: NativeWysiwygInlineAutocompleteKind
  query: string
  range: NativeWysiwygSelection
}

export type NativeWysiwygAttachmentPayload = MobileAttachmentImport

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
  if (!mentionMatch || mentionMatch.query.length === 0) return null

  return inlineAutocompleteMatch({
    kind: 'personMention',
    position,
    projection,
    query: mentionMatch.query,
    start: mentionMatch.start,
  })
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

  return [
    ...inlineNodesBefore(nodes, selection.from, contentStart),
    ...wikilinkContent.map(cloneNode),
    ...inlineNodesAfter(nodes, wikilinkContent, selection.to, contentStart),
  ]
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
