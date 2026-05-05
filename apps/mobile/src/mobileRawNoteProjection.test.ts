import { describe, expect, it } from 'vitest'
import { notes } from './demoData'
import { applyMobileRawNoteContent } from './mobileRawNoteProjection'

describe('applyMobileRawNoteContent', () => {
  it('updates display fields and relationships from raw markdown', () => {
    const updated = applyMobileRawNoteContent({
      content: [
        '---',
        'type: Resource',
        'tags: [mobile]',
        'related_to: [release]',
        '---',
        '',
        '# Updated Raw Note',
        '',
        'Links to [[mobile-roadmap]].',
      ].join('\n'),
      noteId: 'workflow',
      notes,
    })

    const workflow = updated.find((note) => note.id === 'workflow')
    const roadmap = updated.find((note) => note.id === 'mobile-roadmap')

    expect(workflow).toMatchObject({
      modified: 'Saved now',
      relatedTo: ['release'],
      title: 'Updated Raw Note',
      type: 'Resource',
    })
    expect(workflow?.outgoingLinks).toEqual(['mobile-roadmap'])
    expect(roadmap?.backlinks).toContainEqual({ id: 'workflow', title: 'Updated Raw Note' })
  })
})
