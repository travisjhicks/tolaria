import { mobileDocumentBody, mobileNoteEditableContent } from './mobileDocumentContent'
import type { MobileEditorBlock, MobileNote } from './mobileWorkspaceModel'

export type MobileTableOfContentsLevel = 1 | 2 | 3

export type MobileTableOfContentsItem = {
  children: MobileTableOfContentsItem[]
  id: string
  level: MobileTableOfContentsLevel
  title: string
}

type HeadingTitle = string
type MarkdownLine = string

type MobileTocHeading = {
  level: MobileTableOfContentsLevel
  title: HeadingTitle
}

type MobileTocInput = {
  blocks: MobileEditorBlock[]
  bullets: string[]
  note: MobileNote
  untitledLabel: HeadingTitle
}

export function buildMobileTableOfContents({
  blocks,
  bullets,
  note,
  untitledLabel,
}: MobileTocInput): MobileTableOfContentsItem {
  const title = note.title.trim() || untitledLabel
  const headings = mobileTocHeadings({
    ...note,
    editorBlocks: note.editorBlocks ?? blocks,
    editorBullets: note.editorBullets ?? bullets,
  })
  const root: MobileTableOfContentsItem = {
    children: [],
    id: 'toc-title',
    level: 1,
    title,
  }
  const stack: MobileTableOfContentsItem[] = [root]

  headings.forEach((heading, index) => {
    if (shouldSkipDuplicateTitleHeading({ heading, index, title })) return

    const item: MobileTableOfContentsItem = {
      children: [],
      id: `toc-heading-${index}`,
      level: heading.level,
      title: heading.title,
    }
    appendMobileTocHeading(stack, item)
  })

  return root
}

function mobileTocHeadings(note: Pick<MobileNote, 'editorBlocks' | 'editorBullets' | 'rawContent' | 'title'>): MobileTocHeading[] {
  return mobileDocumentBody(mobileNoteEditableContent(note))
    .split('\n')
    .map(markdownHeading)
    .filter((heading): heading is MobileTocHeading => heading !== null)
}

function markdownHeading(line: MarkdownLine): MobileTocHeading | null {
  const match = line.match(/^(#{1,3})\s+(.+?)\s*#*\s*$/u)
  if (!match) return null

  const title = stripInlineMarkdown(match[2] ?? '')
  if (!title) return null

  return {
    level: match[1]?.length as MobileTableOfContentsLevel,
    title,
  }
}

function shouldSkipDuplicateTitleHeading({
  heading,
  index,
  title,
}: {
  heading: MobileTocHeading
  index: number
  title: string
}) {
  return index === 0 && heading.level === 1 && sameHeadingTitle(heading.title, title)
}

function appendMobileTocHeading(
  stack: MobileTableOfContentsItem[],
  item: MobileTableOfContentsItem,
) {
  const parent = nearestMobileTocParent(stack, item.level)
  parent.children.push(item)
  stack[item.level] = item
  stack.length = item.level + 1
}

function nearestMobileTocParent(
  stack: MobileTableOfContentsItem[],
  level: MobileTableOfContentsLevel,
) {
  for (let index = stack.length - 1; index >= 0; index -= 1) {
    const item = stack[index]
    if (item && item.level < level) return item
  }
  return stack[0]!
}

function sameHeadingTitle(left: HeadingTitle, right: HeadingTitle) {
  return normalizedHeadingTitle(left) === normalizedHeadingTitle(right)
}

function normalizedHeadingTitle(value: HeadingTitle): HeadingTitle {
  return value.trim().replace(/\s+/gu, ' ')
}

function stripInlineMarkdown(text: MarkdownLine): HeadingTitle {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/gu, '$1')
    .replace(/\[\[[^|\]]+\|([^\]]+)\]\]/gu, '$1')
    .replace(/\[\[([^\]]+)\]\]/gu, '$1')
    .replace(/[*_`~]/gu, '')
    .trim()
}
