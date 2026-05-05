import { describe, expect, it } from 'vitest'
import { createMobileSidebarSections, filterNotesForSidebarSelection, mobileSidebarTitle } from './mobileSidebarNavigation'
import type { MobileNote } from './mobileNoteProjection'

describe('mobile sidebar navigation', () => {
  it('filters inbox, all notes, archive, and type selections', () => {
    const notes = [
      note({ id: 'draft', status: 'Draft', type: 'Essay' }),
      note({ id: 'active', status: 'Active', type: 'Project' }),
      note({ archived: true, id: 'archived', type: 'Essay' }),
    ]

    expect(filterNotesForSidebarSelection({ notes, selection: { kind: 'library', id: 'inbox' } }).map((item) => item.id)).toEqual(['draft'])
    expect(filterNotesForSidebarSelection({ notes, selection: { kind: 'library', id: 'all' } }).map((item) => item.id)).toEqual(['draft', 'active'])
    expect(filterNotesForSidebarSelection({ notes, selection: { kind: 'library', id: 'archive' } }).map((item) => item.id)).toEqual(['archived'])
    expect(filterNotesForSidebarSelection({ notes, selection: { kind: 'type', type: 'Project' } }).map((item) => item.id)).toEqual(['active'])
  })

  it('builds sidebar sections from current local notes', () => {
    const sections = createMobileSidebarSections([
      note({ id: 'draft', status: 'Draft', type: 'Essay' }),
      note({ id: 'active', status: 'Active', type: 'Project' }),
      note({ archived: true, id: 'archived', type: 'Essay' }),
    ])

    expect(sections[0].items.map((item) => [item.label, item.count])).toEqual([
      ['Inbox', 1],
      ['All Notes', 2],
      ['Archive', 1],
    ])
    expect(sections[1].items.map((item) => item.label)).toEqual(['Essays', 'Projects'])
  })

  it('formats list titles for library and type selections', () => {
    expect(mobileSidebarTitle({ kind: 'library', id: 'all' })).toBe('All Notes')
    expect(mobileSidebarTitle({ kind: 'type', type: 'Essay' })).toBe('Essays')
  })
})

function note({
  archived = false,
  id,
  status,
  type,
}: {
  archived?: boolean
  id: string
  status?: string
  type: string
}): MobileNote {
  return {
    archived,
    backlinks: [],
    belongsTo: [],
    content: `# ${id}`,
    date: '',
    has: [],
    icon: 'file-text',
    id,
    modified: '',
    outgoingLinks: [],
    relatedTo: [],
    snippet: '',
    status,
    tags: [],
    title: id,
    type,
    words: 1,
  }
}
