export type MobileMarkdownSourceBlockAction =
  | 'codeBlock'
  | 'divider'
  | 'mathBlock'
  | 'mermaid'
  | 'table'

export type MobileMarkdownSourceBlockFormat = {
  closing: string
  fallback: string
  opening: string
  selectFallback: boolean
}

const defaultMathBlockLatex = '\\sqrt{a^2 + b^2}'

const defaultMermaidDiagram = [
  'flowchart TD',
  '    edit["Switch to the raw editor to edit"]',
].join('\n')

const markdownTableSnippet = [
  '| Column | Value |',
  '| --- | --- |',
  '| Item | Detail |',
].join('\n')

export const mobileMarkdownSourceBlockActions = [
  'divider',
  'codeBlock',
  'mathBlock',
  'mermaid',
  'table',
] as const satisfies readonly MobileMarkdownSourceBlockAction[]

const mobileMarkdownSourceBlockFormats: Record<MobileMarkdownSourceBlockAction, MobileMarkdownSourceBlockFormat> = {
  codeBlock: { closing: '\n```', fallback: 'code', opening: '```text\n', selectFallback: true },
  divider: { closing: '', fallback: '---', opening: '', selectFallback: false },
  mathBlock: { closing: '\n$$', fallback: defaultMathBlockLatex, opening: '$$\n', selectFallback: true },
  mermaid: { closing: '\n```', fallback: defaultMermaidDiagram, opening: '```mermaid\n', selectFallback: true },
  table: { closing: '', fallback: markdownTableSnippet, opening: '', selectFallback: false },
}

export function mobileMarkdownSourceBlockFormat(
  action: string,
): MobileMarkdownSourceBlockFormat | null {
  return isMobileMarkdownSourceBlockAction(action)
    ? mobileMarkdownSourceBlockFormats[action]
    : null
}

export function mobileMarkdownSourceBlockText(
  action: MobileMarkdownSourceBlockAction,
): string {
  const format = mobileMarkdownSourceBlockFormats[action]
  return `${format.opening}${format.fallback}${format.closing}`
}

export function mobileMarkdownSourceBlockLines(
  action: MobileMarkdownSourceBlockAction,
): string[] {
  return mobileMarkdownSourceBlockText(action).split('\n')
}

function isMobileMarkdownSourceBlockAction(
  action: string,
): action is MobileMarkdownSourceBlockAction {
  return mobileMarkdownSourceBlockActions.some((candidate) => candidate === action)
}
