import type { NativeWysiwygInlineAutocomplete } from '../components/workspace/MobileWysiwygWikilinkBridgeModel'

type ProbeLogText = string
type ProbeLine = string

export type NativeWysiwygAutocompleteProof = {
  kind: string
  query: string
  rangeFrom: number
  rangeTo: number
}

export type NativeWysiwygAutocompleteProbeStep = {
  content: object
  selection: { from: number; to: number }
}

export type NativeWysiwygAutocompleteAssertionFailure = {
  id: string
  message: string
}

export const nativeWysiwygAutocompleteLogPrefix = 'TOLARIA_MOBILE_WYSIWYG_AUTOCOMPLETE_PROBE'

export function nativeWysiwygAutocompleteProbeContent(): object {
  return nativeWysiwygAutocompleteProbeSteps()[0].content
}

export function nativeWysiwygAutocompleteProbeSelection(): { from: number; to: number } {
  return nativeWysiwygAutocompleteProbeSteps()[0].selection
}

export function nativeWysiwygAutocompleteProbeSteps(): NativeWysiwygAutocompleteProbeStep[] {
  return [
    {
      content: textProbeContent('See [[AI'),
      selection: { from: 9, to: 9 },
    },
    {
      content: textProbeContent('Ask @Lu'),
      selection: { from: 8, to: 8 },
    },
    {
      content: textProbeContent('Ship :rock'),
      selection: { from: 11, to: 11 },
    },
    {
      content: textProbeContent('Insert /table'),
      selection: { from: 14, to: 14 },
    },
  ]
}

function textProbeContent(text: string): object {
  return {
    content: [
      {
        content: [{ text, type: 'text' }],
        type: 'paragraph',
      },
    ],
    type: 'doc',
  }
}

export function nativeWysiwygAutocompleteProof(
  match: NativeWysiwygInlineAutocomplete | null,
): NativeWysiwygAutocompleteProof {
  return {
    kind: match?.kind ?? '',
    query: match?.query ?? '',
    rangeFrom: match?.range.from ?? -1,
    rangeTo: match?.range.to ?? -1,
  }
}

export function nativeWysiwygAutocompleteLogLine(
  proof: NativeWysiwygAutocompleteProof,
): ProbeLine {
  return `${nativeWysiwygAutocompleteLogPrefix} ${JSON.stringify(proof)}`
}

export function parseNativeWysiwygAutocompleteProofs(
  logText: ProbeLogText,
): NativeWysiwygAutocompleteProof[] {
  return logText
    .split('\n')
    .map(parseProofLine)
    .filter((proof): proof is NativeWysiwygAutocompleteProof => proof !== null)
}

export function assertNativeWysiwygAutocompleteProofs(
  proofs: NativeWysiwygAutocompleteProof[],
): NativeWysiwygAutocompleteAssertionFailure[] {
  const latest = proofs.at(-1)
  if (!latest) {
    return [{ id: 'editor.wysiwyg.autocomplete', message: 'Native WYSIWYG autocomplete proof was not logged' }]
  }

  return [
    proofFailure(
      hasAutocompleteProof(proofs, { kind: 'wikilink', query: 'AI', rangeFrom: 5, rangeTo: 9 }),
      'editor.wysiwyg.autocomplete.wikilink',
      'Native WYSIWYG detects wikilink autocomplete with the exact replacement range',
    ),
    proofFailure(
      hasAutocompleteProof(proofs, { kind: 'personMention', query: 'Lu', rangeFrom: 5, rangeTo: 8 }),
      'editor.wysiwyg.autocomplete.personMention',
      'Native WYSIWYG detects person mention autocomplete with the exact replacement range',
    ),
    proofFailure(
      hasAutocompleteProof(proofs, { kind: 'emoji', query: 'rock', rangeFrom: 6, rangeTo: 11 }),
      'editor.wysiwyg.autocomplete.emoji',
      'Native WYSIWYG detects emoji shortcode autocomplete with the exact replacement range',
    ),
    proofFailure(
      hasAutocompleteProof(proofs, { kind: 'slashCommand', query: 'table', rangeFrom: 8, rangeTo: 14 }),
      'editor.wysiwyg.autocomplete.slashCommand',
      'Native WYSIWYG detects slash-command autocomplete with the exact replacement range',
    ),
  ].filter((failure): failure is NativeWysiwygAutocompleteAssertionFailure => failure !== null)
}

export function formatNativeWysiwygAutocompleteFailures(
  failures: NativeWysiwygAutocompleteAssertionFailure[],
): string {
  return failures.map((failure) => `${failure.id}: ${failure.message}`).join('\n')
}

export function nativeWysiwygAutocompleteProbeEnabled(searchParams: URLSearchParams): boolean {
  return searchParams.get('wysiwygAutocompleteProbe') === '1'
}

function parseProofLine(line: ProbeLine): NativeWysiwygAutocompleteProof | null {
  const prefixIndex = line.indexOf(nativeWysiwygAutocompleteLogPrefix)
  if (prefixIndex === -1) return null

  const rawJson = line.slice(prefixIndex + nativeWysiwygAutocompleteLogPrefix.length).trim()
  try {
    return parsedProof(JSON.parse(rawJson))
  } catch {
    return null
  }
}

function parsedProof(value: unknown): NativeWysiwygAutocompleteProof | null {
  if (!value || typeof value !== 'object') return null

  const candidate = value as Partial<NativeWysiwygAutocompleteProof>
  if (typeof candidate.kind !== 'string') return null
  if (typeof candidate.query !== 'string') return null
  if (typeof candidate.rangeFrom !== 'number') return null
  if (typeof candidate.rangeTo !== 'number') return null

  return {
    kind: candidate.kind,
    query: candidate.query,
    rangeFrom: candidate.rangeFrom,
    rangeTo: candidate.rangeTo,
  }
}

function hasAutocompleteProof(
  proofs: NativeWysiwygAutocompleteProof[],
  expected: NativeWysiwygAutocompleteProof,
): boolean {
  return proofs.some((proof) => (
    proof.kind === expected.kind
    && proof.query === expected.query
    && proof.rangeFrom === expected.rangeFrom
    && proof.rangeTo === expected.rangeTo
  ))
}

function proofFailure(
  passed: boolean,
  id: string,
  message: string,
): NativeWysiwygAutocompleteAssertionFailure | null {
  return passed ? null : { id, message }
}
