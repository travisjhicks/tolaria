import { describe, expect, it } from 'vitest'
import { notes } from './demoData'
import { selectMobileNoteAfterDelete } from './mobileNoteDelete'

describe('mobile note delete', () => {
  it('selects the next available note after deleting the active note', () => {
    expect(selectMobileNoteAfterDelete({ deletedNoteId: 'workflow', notes })).toBe('mobile-roadmap')
  })

  it('returns null when no notes remain', () => {
    expect(selectMobileNoteAfterDelete({ deletedNoteId: 'workflow', notes: [notes[0]] })).toBeNull()
  })
})
