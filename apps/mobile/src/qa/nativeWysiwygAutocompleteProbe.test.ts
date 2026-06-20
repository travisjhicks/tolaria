import { describe, expect, it } from 'vitest'
import {
  assertNativeWysiwygAutocompleteProofs,
  formatNativeWysiwygAutocompleteFailures,
  nativeWysiwygAutocompleteLogLine,
  nativeWysiwygAutocompleteProbeContent,
  nativeWysiwygAutocompleteProbeEnabled,
  nativeWysiwygAutocompleteProbeSelection,
  nativeWysiwygAutocompleteProbeSteps,
  nativeWysiwygAutocompleteProof,
  parseNativeWysiwygAutocompleteProofs,
} from './nativeWysiwygAutocompleteProbe'

describe('native WYSIWYG autocomplete probe', () => {
  it('keeps the legacy single-step helpers pointed at the wikilink probe', () => {
    expect(nativeWysiwygAutocompleteProbeContent()).toMatchObject({
      content: [{ content: [{ text: 'See [[AI' }] }],
      type: 'doc',
    })
    expect(nativeWysiwygAutocompleteProbeSelection()).toEqual({ from: 9, to: 9 })
  })

  it('runs native documents for wikilink, person mention, emoji, and slash-command autocomplete', () => {
    expect(nativeWysiwygAutocompleteProbeSteps()).toEqual([
      {
        content: {
          content: [{ content: [{ text: 'See [[AI', type: 'text' }], type: 'paragraph' }],
          type: 'doc',
        },
        selection: { from: 9, to: 9 },
      },
      {
        content: {
          content: [{ content: [{ text: 'Ask @Lu', type: 'text' }], type: 'paragraph' }],
          type: 'doc',
        },
        selection: { from: 8, to: 8 },
      },
      {
        content: {
          content: [{ content: [{ text: 'Ship :rock', type: 'text' }], type: 'paragraph' }],
          type: 'doc',
        },
        selection: { from: 11, to: 11 },
      },
      {
        content: {
          content: [{ content: [{ text: 'Insert /table', type: 'text' }], type: 'paragraph' }],
          type: 'doc',
        },
        selection: { from: 14, to: 14 },
      },
    ])
  })

  it('parses and asserts simulator log proofs for desktop autocomplete families', () => {
    const wikilinkProof = nativeWysiwygAutocompleteProof({
      kind: 'wikilink',
      query: 'AI',
      range: { from: 5, to: 9 },
    })
    const personMentionProof = nativeWysiwygAutocompleteProof({
      kind: 'personMention',
      query: 'Lu',
      range: { from: 5, to: 8 },
    })
    const emojiProof = nativeWysiwygAutocompleteProof({
      kind: 'emoji',
      query: 'rock',
      range: { from: 6, to: 11 },
    })
    const slashCommandProof = nativeWysiwygAutocompleteProof({
      kind: 'slashCommand',
      query: 'table',
      range: { from: 8, to: 14 },
    })
    const log = [
      nativeWysiwygAutocompleteLogLine(wikilinkProof),
      nativeWysiwygAutocompleteLogLine(personMentionProof),
      nativeWysiwygAutocompleteLogLine(emojiProof),
      nativeWysiwygAutocompleteLogLine(slashCommandProof),
    ].join('\n')

    expect(parseNativeWysiwygAutocompleteProofs(log)).toEqual([
      wikilinkProof,
      personMentionProof,
      emojiProof,
      slashCommandProof,
    ])
    expect(assertNativeWysiwygAutocompleteProofs([
      wikilinkProof,
      personMentionProof,
      emojiProof,
      slashCommandProof,
    ])).toEqual([])
  })

  it('reports missing and failed autocomplete proofs', () => {
    expect(formatNativeWysiwygAutocompleteFailures(assertNativeWysiwygAutocompleteProofs([]))).toContain('editor.wysiwyg.autocomplete')
    expect(assertNativeWysiwygAutocompleteProofs([
      nativeWysiwygAutocompleteProof(null),
    ])).toEqual([
      {
        id: 'editor.wysiwyg.autocomplete.wikilink',
        message: 'Native WYSIWYG detects wikilink autocomplete with the exact replacement range',
      },
      {
        id: 'editor.wysiwyg.autocomplete.personMention',
        message: 'Native WYSIWYG detects person mention autocomplete with the exact replacement range',
      },
      {
        id: 'editor.wysiwyg.autocomplete.emoji',
        message: 'Native WYSIWYG detects emoji shortcode autocomplete with the exact replacement range',
      },
      {
        id: 'editor.wysiwyg.autocomplete.slashCommand',
        message: 'Native WYSIWYG detects slash-command autocomplete with the exact replacement range',
      },
    ])
  })

  it('detects the native QA query flag', () => {
    expect(nativeWysiwygAutocompleteProbeEnabled(new globalThis.URLSearchParams('wysiwygAutocompleteProbe=1'))).toBe(true)
    expect(nativeWysiwygAutocompleteProbeEnabled(new globalThis.URLSearchParams('wysiwygAutocompleteProbe=0'))).toBe(false)
  })
})
