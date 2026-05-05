import { describe, expect, it } from 'vitest'
import { notes } from './demoData'
import {
  createMobileNoteFrontmatterPatch,
  formatMobileNoteTags,
  isMobileNotePropertySelected,
  parseMobileNoteTags,
  toggleMobileNoteTag,
} from './mobileNoteProperties'

describe('createMobileNoteFrontmatterPatch', () => {
  it('preserves note metadata while changing one property', () => {
    expect(createMobileNoteFrontmatterPatch({
      note: { ...notes[0], date: 'May 5, 2026', icon: 'file-text', tags: ['Tolaria'], status: 'Draft' },
      patch: { type: 'Project' },
    })).toEqual({
      date: 'May 5, 2026',
      icon: 'file-text',
      status: 'Draft',
      tags: ['Tolaria'],
      type: 'Project',
    })
  })

  it('can clear optional status without changing other metadata', () => {
    expect(createMobileNoteFrontmatterPatch({
      note: { ...notes[0], status: 'Active' },
      patch: { status: '' },
    }).status).toBe('')
  })
})

describe('isMobileNotePropertySelected', () => {
  it('treats an empty option as selected for missing metadata', () => {
    expect(isMobileNotePropertySelected({ current: undefined, option: '' })).toBe(true)
    expect(isMobileNotePropertySelected({ current: 'Draft', option: '' })).toBe(false)
  })
})

describe('toggleMobileNoteTag', () => {
  it('adds and removes a tag without disturbing the other tags', () => {
    expect(toggleMobileNoteTag(['Tolaria MVP'], 'mobile')).toEqual(['Tolaria MVP', 'mobile'])
    expect(toggleMobileNoteTag(['Tolaria MVP', 'mobile'], 'mobile')).toEqual(['Tolaria MVP'])
  })
})

describe('mobile note tag text helpers', () => {
  it('formats and parses keyboard-entered tag lists', () => {
    expect(formatMobileNoteTags(['Tolaria MVP', 'mobile'])).toBe('Tolaria MVP, mobile')
    expect(parseMobileNoteTags(' Tolaria MVP, mobile, mobile, ')).toEqual(['Tolaria MVP', 'mobile'])
  })
})
