import { describe, expect, it } from 'vitest'
import { applyMobileMarkdownFormat } from './mobileMarkdownFormatting'

describe('mobile markdown formatting', () => {
  it('wraps selected inline text and collapses after the inserted marker', () => {
    expect(applyMobileMarkdownFormat('Make this important', { start: 5, end: 9 }, 'bold')).toEqual({
      selection: { start: 13, end: 13 },
      text: 'Make **this** important',
    })
  })

  it('inserts placeholder inline formatting when no text is selected', () => {
    expect(applyMobileMarkdownFormat('Write ', { start: 6, end: 6 }, 'italic')).toEqual({
      selection: { start: 7, end: 18 },
      text: 'Write *italic text*',
    })
  })

  it('feeds the existing wikilink autocomplete when no text is selected', () => {
    expect(applyMobileMarkdownFormat('See ', { start: 4, end: 4 }, 'wikilink')).toEqual({
      selection: { start: 6, end: 6 },
      text: 'See [[',
    })
  })

  it('wraps selected wikilink text into desktop markdown syntax', () => {
    expect(applyMobileMarkdownFormat('See Project Alpha', { start: 4, end: 17 }, 'wikilink')).toEqual({
      selection: { start: 21, end: 21 },
      text: 'See [[Project Alpha]]',
    })
  })

  it('normalizes heading markers on the selected line', () => {
    expect(applyMobileMarkdownFormat('# Old heading\nBody', { start: 2, end: 2 }, 'heading2')).toEqual({
      selection: { start: 14, end: 14 },
      text: '## Old heading\nBody',
    })
  })

  it('prefixes every selected line for list and quote commands', () => {
    expect(applyMobileMarkdownFormat('One\nTwo', { start: 0, end: 7 }, 'bulletList')).toEqual({
      selection: { start: 11, end: 11 },
      text: '- One\n- Two',
    })
    expect(applyMobileMarkdownFormat('One\nTwo', { start: 0, end: 7 }, 'quote')).toEqual({
      selection: { start: 11, end: 11 },
      text: '> One\n> Two',
    })
  })

  it('inserts markdown tables as separated blocks and selects the first header cell', () => {
    expect(applyMobileMarkdownFormat('Intro', { start: 5, end: 5 }, 'table')).toEqual({
      selection: { start: 9, end: 15 },
      text: 'Intro\n\n| Column | Value |\n| --- | --- |\n| Item | Detail |',
    })
  })
})
