import { describe, expect, it } from 'vitest'
import type { MobileNote } from './mobileWorkspaceModel'
import { mobileNoteIdForWikilinkTarget, parseMobileWikilink } from './mobileWikilinks'

describe('mobile wikilink resolution', () => {
  it('parses desktop wikilink frontmatter values with surrounding whitespace', () => {
    expect(parseMobileWikilink(' [[Cafe Notes.md|Café]] ')).toEqual({
      display: 'Café',
      target: 'Cafe Notes.md',
    })
  })

  it('resolves aliases using the same note identity candidates as desktop', () => {
    expect(mobileNoteIdForWikilinkTarget([
      note({
        aliases: ['Alpha Project'],
        id: 'projects/project-alpha.md',
        path: 'projects/project-alpha.md',
        title: 'Project A',
      }),
    ], 'alpha project')).toBe('projects/project-alpha.md')
  })

  it('resolves title targets with the same diacritic folding as search and autocomplete', () => {
    expect(mobileNoteIdForWikilinkTarget([
      note({
        id: 'journal/cafe-notes.md',
        path: 'journal/cafe-notes.md',
        title: 'Café Notes',
      }),
    ], 'Cafe Notes')).toBe('journal/cafe-notes.md')
  })

  it('resolves md-suffixed path and title targets to the same note identity', () => {
    expect(mobileNoteIdForWikilinkTarget([
      note({
        id: 'research/project-alpha.md',
        path: 'research/project-alpha.md',
        title: 'Project Alpha',
      }),
    ], 'research/project-alpha.md')).toBe('research/project-alpha.md')
    expect(mobileNoteIdForWikilinkTarget([
      note({
        id: 'research/project-alpha.md',
        path: 'research/project-alpha.md',
        title: 'Project Alpha',
      }),
    ], 'Project Alpha.md')).toBe('research/project-alpha.md')
  })

  it('resolves desktop legacy path-style targets through path suffixes and filename stems', () => {
    expect(mobileNoteIdForWikilinkTarget([
      note({
        id: 'docs/adr/0031-foo.md',
        path: 'docs/adr/0031-foo.md',
        title: '0031 Foo',
      }),
      note({
        id: 'hello.md',
        path: 'hello.md',
        title: 'Hello',
      }),
    ], 'adr/0031-foo')).toBe('docs/adr/0031-foo.md')

    expect(mobileNoteIdForWikilinkTarget([
      note({
        id: 'alice.md',
        path: 'alice.md',
        title: 'Alice',
      }),
    ], 'person/alice')).toBe('alice.md')
  })

  it('resolves desktop kebab-case targets through humanized titles', () => {
    expect(mobileNoteIdForWikilinkTarget([
      note({
        id: 'renamed-file.md',
        path: 'renamed-file.md',
        title: 'My Project',
      }),
    ], 'my-project')).toBe('renamed-file.md')
  })
})

function note(overrides: Partial<MobileNote>): MobileNote {
  return {
    created: 'today',
    date: 'today',
    favorite: false,
    id: 'note.md',
    links: 0,
    modified: 'today',
    relationships: [],
    snippet: '',
    status: '',
    tags: [],
    title: 'Note',
    type: 'Note',
    typeTone: 'gray',
    workspace: 'Vault',
    ...overrides,
  }
}
