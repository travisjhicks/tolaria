import type { TiptapJsonMark, TiptapJsonNode } from './mobileDocumentContent'

type NativeWysiwygInputTransformInput = {
  json: unknown
  selection?: NativeWysiwygSelection
}

type NativeWysiwygSelection = {
  from: number
  to: number
}

type InlineTransform = {
  after: string
  before: string
  marked?: {
    marks: TiptapJsonMark[]
    text: string
  }
}

type InlineTransformResult = {
  node: TiptapJsonNode
  transformed: boolean
}

const highlightMarkType = 'highlight'

export function nativeWysiwygDocumentWithInputTransforms({
  json,
  selection,
}: NativeWysiwygInputTransformInput): TiptapJsonNode | null {
  if (!isTiptapDocument(json) || !selection) return null
  const normalized = normalizedSelection(selection)
  if (normalized.from !== normalized.to) return null

  const transformed = transformNodeAtSelection(json, normalized)
  return transformed?.transformed ? transformed.node : null
}

function transformNodeAtSelection(
  node: TiptapJsonNode,
  selection: NativeWysiwygSelection,
  nodeStart = 0,
): InlineTransformResult | null {
  if (isInlineContainer(node)) {
    return transformInlineContainerAtSelection(node, selection, nodeStart + 1)
  }

  const children = node.content ?? []
  let childStart = node.type === 'doc' ? nodeStart : nodeStart + 1
  for (const [index, child] of children.entries()) {
    const childEnd = childStart + tiptapNodeSize(child)
    if (selection.from >= childStart && selection.from <= childEnd) {
      const transformed = transformNodeAtSelection(child, selection, childStart)
      if (transformed?.transformed) return withReplacedChild(node, index, transformed.node)
    }
    childStart = childEnd
  }

  return null
}

function transformInlineContainerAtSelection(
  node: TiptapJsonNode,
  selection: NativeWysiwygSelection,
  contentStart: number,
): InlineTransformResult | null {
  let cursor = contentStart
  for (const [index, child] of (node.content ?? []).entries()) {
    const childEnd = cursor + tiptapNodeSize(child)
    if (selection.from >= cursor && selection.from <= childEnd) {
      const transformed = transformTextNodeAtSelection(child, selection.from - cursor)
      if (!transformed) return null

      return {
        node: {
          ...node,
          content: [
            ...(node.content ?? []).slice(0, index).map(cloneNode),
            ...inlineTransformNodes(transformed),
            ...(node.content ?? []).slice(index + 1).map(cloneNode),
          ],
        },
        transformed: true,
      }
    }
    cursor = childEnd
  }

  return null
}

function transformTextNodeAtSelection(node: TiptapJsonNode, offset: number): InlineTransform | null {
  if (node.type !== 'text' || typeof node.text !== 'string') return null
  if (hasCodeMark(node.marks)) return null

  const before = node.text.slice(0, offset)
  const after = node.text.slice(offset)
  const marks = node.marks?.map(cloneMark) ?? []

  return completedHighlightTransform({ after, before, marks })
    ?? arrowLigatureTransform({ after, before })
}

function arrowLigatureTransform({
  after,
  before,
}: Pick<InlineTransform, 'after' | 'before'>): InlineTransform | null {
  const change = arrowLigatureChange(before)
  if (!change) return null

  return {
    after,
    before: `${before.slice(0, -change.remove)}${change.insert}`,
  }
}

function arrowLigatureChange(before: string): { insert: string; remove: number } | null {
  if (before.endsWith('\\<->')) return { insert: '<->', remove: 4 }
  if (before.endsWith('\\->')) return { insert: '->', remove: 3 }
  if (before.endsWith('\\<-')) return { insert: '<-', remove: 3 }
  if (before.endsWith('<->')) return { insert: '↔', remove: 3 }
  if (before.endsWith('←>')) return { insert: '↔', remove: 2 }
  if (before.endsWith('->')) return { insert: '→', remove: 2 }
  if (before.endsWith('<-')) return { insert: '←', remove: 2 }

  return null
}

function completedHighlightTransform({
  after,
  before,
  marks,
}: Pick<InlineTransform, 'after' | 'before'> & {
  marks: TiptapJsonMark[]
}): InlineTransform | null {
  if (!before.endsWith('==')) return null

  const closingStart = before.length - 2
  const openingStart = before.lastIndexOf('==', closingStart - 1)
  if (openingStart === -1) return null

  const contentStart = openingStart + 2
  const content = before.slice(contentStart, closingStart)
  if (!validHighlightContent(content)) return null

  return {
    after,
    before: before.slice(0, openingStart),
    marked: {
      marks: withHighlightMark(marks),
      text: content,
    },
  }
}

function validHighlightContent(content: string): boolean {
  if (content.trim().length === 0) return false
  if (/^\s|\s$/u.test(content)) return false
  return !/[\r\n]/u.test(content)
}

function inlineTransformNodes(transform: InlineTransform): TiptapJsonNode[] {
  return [
    textNode(transform.before),
    transform.marked ? textNode(transform.marked.text, transform.marked.marks) : null,
    textNode(transform.after),
  ].filter((node): node is TiptapJsonNode => node !== null)
}

function textNode(text: string, marks?: TiptapJsonMark[]): TiptapJsonNode | null {
  if (!text) return null
  return marks && marks.length > 0
    ? { marks: marks.map(cloneMark), text, type: 'text' }
    : { text, type: 'text' }
}

function withHighlightMark(marks: TiptapJsonMark[]): TiptapJsonMark[] {
  return marks.some((mark) => mark.type === highlightMarkType)
    ? marks.map(cloneMark)
    : [...marks.map(cloneMark), { type: highlightMarkType }]
}

function hasCodeMark(marks: TiptapJsonMark[] | undefined): boolean {
  return Boolean(marks?.some((mark) => mark.type === 'code'))
}

function withReplacedChild(
  node: TiptapJsonNode,
  index: number,
  child: TiptapJsonNode,
): InlineTransformResult {
  return {
    node: {
      ...cloneNode(node),
      content: (node.content ?? []).map((candidate, candidateIndex) => (
        candidateIndex === index ? child : cloneNode(candidate)
      )),
    },
    transformed: true,
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

function cloneMark(mark: TiptapJsonMark): TiptapJsonMark {
  return {
    ...mark,
    attrs: mark.attrs ? { ...mark.attrs } : undefined,
  }
}

function cloneNode(node: TiptapJsonNode): TiptapJsonNode {
  return {
    ...node,
    attrs: node.attrs ? { ...node.attrs } : undefined,
    content: node.content?.map(cloneNode),
    marks: node.marks?.map(cloneMark),
  }
}
