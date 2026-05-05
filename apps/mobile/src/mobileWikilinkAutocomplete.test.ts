import { describe, expect, it } from 'vitest'
import { activeMobileWikilinkQuery, insertMobileWikilink, mobileNoteSuggestions } from './mobileWikilinkAutocomplete'
import type { MobileNote } from './mobileNoteProjection'

describe('mobile wikilink autocomplete', () => {
  it('detects an active wikilink trigger before the cursor', () => {
    expect(activeMobileWikilinkQuery({ cursor: 12, markdown: 'See [[mobile' })).toEqual({
      end: 12,
      query: 'mobile',
      start: 4,
    })
  })

  it('suggests notes by title or id and inserts canonical aliases', () => {
    const notes = [note({ id: 'mobile-roadmap', title: 'Mobile Roadmap' }), note({ id: 'workflow', title: 'Workflow Essay' })]
    const query = activeMobileWikilinkQuery({ cursor: 12, markdown: 'See [[mobile' })

    expect(mobileNoteSuggestions({ notes, query: 'road' }).map((item) => item.id)).toEqual(['mobile-roadmap'])
    expect(query ? insertMobileWikilink({ markdown: 'See [[mobile', note: notes[0], query }) : '').toBe('See [[mobile-roadmap|Mobile Roadmap]]')
  })
})

function note({
  id,
  title,
}: {
  id: string
  title: string
}): MobileNote {
  return {
    archived: false,
    backlinks: [],
    belongsTo: [],
    content: `# ${title}`,
    customProperties: {},
    date: '',
    favorite: false,
    favoriteIndex: null,
    has: [],
    icon: 'file-text',
    id,
    modified: '',
    outgoingLinks: [],
    relatedTo: [],
    relationships: {},
    snippet: '',
    tags: [],
    title,
    type: 'Note',
    words: 1,
  }
}
