import { describe, expect, it } from 'vitest'
import { projectMobileNote, projectMobileNotes, type MobileNoteSource } from './mobileNoteProjection'

const sourceNote: MobileNoteSource = {
  archived: false,
  belongsTo: ['Tolaria MVP'],
  id: 'workflow',
  type: 'Essay',
  has: ['release'],
  icon: 'pen-nib',
  date: 'May 13, 2026',
  modified: '6h ago',
  filename: 'workflow-orchestration-kestra.md',
  relatedTo: ['orchestration'],
  tags: ['Design Inspiration', 'Tolaria MVP'],
  content: [
    '---',
    'title: Workflow Orchestration Essay',
    'type: Essay',
    '---',
    '',
    '# Workflow Orchestration Essay',
    '',
    'The current narrative / temptation is everything routed through an LLM.',
  ].join('\n'),
}

describe('mobile note projection', () => {
  it('derives list and editor metadata from markdown content', () => {
    const note = projectMobileNote(sourceNote)

    expect(note).toMatchObject({
      id: 'workflow',
      title: 'Workflow Orchestration Essay',
      archived: false,
      belongsTo: ['Tolaria MVP'],
      has: ['release'],
      outgoingLinks: [],
      relatedTo: ['orchestration'],
      snippet: 'The current narrative / temptation is everything routed through an LLM.',
      words: 11,
    })
  })

  it('keeps projection order stable for note lists', () => {
    const notes = projectMobileNotes([
      sourceNote,
      { ...sourceNote, id: 'release', filename: 'release.md' },
    ])

    expect(notes.map((note) => note.id)).toEqual(['workflow', 'release'])
  })

  it('derives backlinks from wikilinks that target note ids or titles', () => {
    const notes = projectMobileNotes([
      sourceNote,
      {
        ...sourceNote,
        id: 'release',
        filename: 'release.md',
        content: '# Release\n\nSee [[workflow]] and [[Workflow Orchestration Essay|the essay]].',
      },
    ])

    expect(notes[0].backlinks).toEqual([{ id: 'release', title: 'Release' }])
  })
})
