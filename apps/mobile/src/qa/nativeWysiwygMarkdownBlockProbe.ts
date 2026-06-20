import type {
  NativeWysiwygMarkdownBlockPayload,
  NativeWysiwygPlainTextPayload,
} from '../components/workspace/MobileWysiwygWikilinkBridgeModel'

type MarkdownContent = string
type NoteId = string
type ProbeLogText = string
type ProbeLine = string

export type NativeWysiwygMarkdownBlockProof = {
  codeBlockSaved: boolean
  codeBlockStructured: boolean
  contentLength: number
  dividerSaved: boolean
  mathBlockSaved: boolean
  mathBlockRendered: boolean
  mermaidSaved: boolean
  noteId: NoteId
  plainTextSaved: boolean
  tableSaved: boolean
  whiteboardSaved: boolean
}

export type NativeWysiwygMarkdownBlockAssertionFailure = {
  id: string
  message: string
}

export const nativeWysiwygMarkdownBlockLogPrefix = 'TOLARIA_MOBILE_WYSIWYG_MARKDOWN_BLOCK_PROBE'

type ProofFieldName = keyof NativeWysiwygMarkdownBlockProof
type ProofFieldType = 'boolean' | 'number' | 'string'
type ProofFieldMap = {
  [Field in ProofFieldName]: NativeWysiwygMarkdownBlockProof[Field]
}
type TiptapJsonNode = {
  attrs?: Record<string, unknown>
  content?: TiptapJsonNode[]
  text?: string
  type?: string
}
type NativeWysiwygMarkdownBlockProofInput = {
  codeBlockStructured?: boolean
  content: MarkdownContent
  mathBlockRendered?: boolean
  noteId: NoteId
}

const expectedDivider = '---'
const expectedCodeBlock = '```text\ncode\n```'
const expectedMathBlock = '$$\n\\sqrt{a^2 + b^2}\n$$'
const expectedPlainText = 'Plain  \nClipboard'
const expectedMermaid = [
  '```mermaid',
  'flowchart TD',
  '    edit["Switch to the raw editor to edit"]',
  '```',
].join('\n')
const expectedTable = [
  '| Column | Value |',
  '| --- | --- |',
  '| Item | Detail |',
].join('\n')
const expectedWhiteboardFence = /```tldraw id="[^"]+" height="520"\n\{\}\n```/u

const proofFieldTypes = {
  codeBlockSaved: 'boolean',
  codeBlockStructured: 'boolean',
  contentLength: 'number',
  dividerSaved: 'boolean',
  mathBlockSaved: 'boolean',
  mathBlockRendered: 'boolean',
  mermaidSaved: 'boolean',
  noteId: 'string',
  plainTextSaved: 'boolean',
  tableSaved: 'boolean',
  whiteboardSaved: 'boolean',
} as const satisfies Record<ProofFieldName, ProofFieldType>

const proofFields = Object.keys(proofFieldTypes) as ProofFieldName[]

export function nativeWysiwygMarkdownBlockProbePayloads(): NativeWysiwygMarkdownBlockPayload[] {
  return [
    { action: 'divider' },
    { action: 'codeBlock' },
    { action: 'mathBlock' },
    { action: 'mermaid' },
    { action: 'table' },
    { action: 'whiteboard' },
  ]
}

export function nativeWysiwygMarkdownBlockProbePlainTextPayload(): NativeWysiwygPlainTextPayload {
  return { text: 'Plain\nClipboard' }
}

export function nativeWysiwygMarkdownBlockProof({
  codeBlockStructured = false,
  content,
  mathBlockRendered = false,
  noteId,
}: NativeWysiwygMarkdownBlockProofInput): NativeWysiwygMarkdownBlockProof {
  const normalizedContent = normalizedMarkdown(content)

  return {
    codeBlockSaved: normalizedContent.includes(expectedCodeBlock),
    codeBlockStructured,
    contentLength: content.length,
    dividerSaved: markdownBlocks(normalizedContent).includes(expectedDivider),
    mathBlockSaved: normalizedContent.includes(expectedMathBlock),
    mathBlockRendered,
    mermaidSaved: normalizedContent.includes(expectedMermaid),
    noteId,
    plainTextSaved: normalizedContent.includes(expectedPlainText),
    tableSaved: normalizedContent.includes(expectedTable),
    whiteboardSaved: expectedWhiteboardFence.test(normalizedContent),
  }
}

export function nativeWysiwygMarkdownBlockLogLine(
  proof: NativeWysiwygMarkdownBlockProof,
): ProbeLine {
  return `${nativeWysiwygMarkdownBlockLogPrefix} ${JSON.stringify(proof)}`
}

export function publishNativeWysiwygMarkdownBlockProof(input: NativeWysiwygMarkdownBlockProofInput): void {
  console.info(nativeWysiwygMarkdownBlockLogLine(nativeWysiwygMarkdownBlockProof(input)))
}

export function parseNativeWysiwygMarkdownBlockProofs(
  logText: ProbeLogText,
): NativeWysiwygMarkdownBlockProof[] {
  return logText
    .split('\n')
    .map(parseProofLine)
    .filter((proof): proof is NativeWysiwygMarkdownBlockProof => proof !== null)
}

export function assertNativeWysiwygMarkdownBlockProofs(
  proofs: NativeWysiwygMarkdownBlockProof[],
): NativeWysiwygMarkdownBlockAssertionFailure[] {
  const latest = proofs.at(-1)
  if (!latest) {
    return [{
      id: 'editor.wysiwyg.markdownBlocks',
      message: 'Native WYSIWYG markdown block insertion proof was not logged',
    }]
  }

  return [
    proofFailure(
      latest.plainTextSaved,
      'editor.wysiwyg.markdownBlocks.plainText',
      'Native WYSIWYG paste-as-plain-text insertion saves unformatted clipboard text',
    ),
    proofFailure(
      latest.dividerSaved,
      'editor.wysiwyg.markdownBlocks.divider',
      'Native WYSIWYG divider insertion saves as desktop horizontal-rule markdown',
    ),
    proofFailure(
      latest.codeBlockSaved,
      'editor.wysiwyg.markdownBlocks.codeBlock',
      'Native WYSIWYG code-block insertion saves as desktop fenced-code markdown',
    ),
    proofFailure(
      latest.codeBlockStructured,
      'editor.wysiwyg.markdownBlocks.codeBlockStructured',
      'Native WYSIWYG code-block insertion remains a structured TenTap codeBlock before save',
    ),
    proofFailure(
      latest.mathBlockSaved,
      'editor.wysiwyg.markdownBlocks.mathBlock',
      'Native WYSIWYG math insertion saves as desktop display-math markdown',
    ),
    proofFailure(
      latest.mathBlockRendered,
      'editor.wysiwyg.markdownBlocks.mathBlockRendered',
      'Native WYSIWYG math insertion renders as MathML in the TenTap WebView',
    ),
    proofFailure(
      latest.mermaidSaved,
      'editor.wysiwyg.markdownBlocks.mermaid',
      'Native WYSIWYG Mermaid insertion saves as desktop fenced-diagram markdown',
    ),
    proofFailure(
      latest.tableSaved,
      'editor.wysiwyg.markdownBlocks.table',
      'Native WYSIWYG table insertion saves as desktop markdown table source lines',
    ),
    proofFailure(
      latest.whiteboardSaved,
      'editor.wysiwyg.markdownBlocks.whiteboard',
      'Native WYSIWYG whiteboard insertion saves as desktop tldraw fenced markdown',
    ),
  ].filter((failure): failure is NativeWysiwygMarkdownBlockAssertionFailure => failure !== null)
}

export function formatNativeWysiwygMarkdownBlockFailures(
  failures: NativeWysiwygMarkdownBlockAssertionFailure[],
): string {
  return failures.map((failure) => `${failure.id}: ${failure.message}`).join('\n')
}

export function nativeWysiwygMarkdownBlockProbeEnabled(searchParams: URLSearchParams): boolean {
  return searchParams.get('wysiwygMarkdownBlockProbe') === '1'
}

export function nativeWysiwygMarkdownBlockStructuredCodeBlock(json: unknown): boolean {
  return hasCodeBlockNode(json)
}

function parseProofLine(line: ProbeLine): NativeWysiwygMarkdownBlockProof | null {
  const prefixIndex = line.indexOf(nativeWysiwygMarkdownBlockLogPrefix)
  if (prefixIndex === -1) return null

  const rawJson = line.slice(prefixIndex + nativeWysiwygMarkdownBlockLogPrefix.length).trim()
  try {
    return parsedProof(JSON.parse(rawJson))
  } catch {
    return null
  }
}

function parsedProof(value: unknown): NativeWysiwygMarkdownBlockProof | null {
  if (!isRecord(value)) return null
  if (!isNativeWysiwygMarkdownBlockProof(value)) return null

  return {
    codeBlockSaved: value.codeBlockSaved,
    codeBlockStructured: value.codeBlockStructured,
    contentLength: value.contentLength,
    dividerSaved: value.dividerSaved,
    mathBlockSaved: value.mathBlockSaved,
    mathBlockRendered: value.mathBlockRendered,
    mermaidSaved: value.mermaidSaved,
    noteId: value.noteId,
    plainTextSaved: value.plainTextSaved,
    tableSaved: value.tableSaved,
    whiteboardSaved: value.whiteboardSaved,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function isNativeWysiwygMarkdownBlockProof(
  value: Record<string, unknown>,
): value is ProofFieldMap {
  return proofFields.every((field) => typeof value[field] === proofFieldTypes[field])
}

function hasCodeBlockNode(value: unknown): boolean {
  if (!isTiptapJsonNode(value)) return false
  if (isProbeCodeBlockNode(value)) return true

  return tiptapChildNodes(value).some(hasCodeBlockNode)
}

function isProbeCodeBlockNode(node: TiptapJsonNode): boolean {
  return node.type === 'codeBlock'
    && node.attrs?.language === 'text'
    && tiptapChildNodes(node).some(isProbeCodeTextNode)
}

function isProbeCodeTextNode(node: TiptapJsonNode): boolean {
  return node.type === 'text' && node.text === 'code'
}

function tiptapChildNodes(node: TiptapJsonNode): TiptapJsonNode[] {
  return Array.isArray(node.content) ? node.content : []
}

function isTiptapJsonNode(value: unknown): value is TiptapJsonNode {
  return Boolean(value && typeof value === 'object')
}

function normalizedMarkdown(content: MarkdownContent): MarkdownContent {
  return content.replace(/\r\n/g, '\n')
}

function markdownBlocks(content: MarkdownContent): string[] {
  return content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
}

function proofFailure(
  passed: boolean,
  id: string,
  message: string,
): NativeWysiwygMarkdownBlockAssertionFailure | null {
  return passed ? null : { id, message }
}
