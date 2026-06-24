import { describe, expect, it } from 'vitest'
import { mobileNoteListToolbarChrome } from './MobileNoteListPanelChrome'

describe('mobile note-list panel chrome', () => {
  it('keeps note-list toolbar actions to search and direct create', () => {
    expect(mobileNoteListToolbarChrome.actionTestIds).toEqual([
      'note-list-search-action',
      'note-list-create-action',
    ])
  })

  it('does not reserve toolbar chrome for open/archive selectors', () => {
    expect(mobileNoteListToolbarChrome.actionTestIds.join(' ')).not.toMatch(/open|archive|filter|selector/u)
  })
})
