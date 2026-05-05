import { describe, expect, it } from 'vitest'
import { readMobileNoteFrontmatter } from './mobileNoteFrontmatter'

describe('mobile note frontmatter', () => {
  it('reads supported scalar note metadata', () => {
    expect(readMobileNoteFrontmatter([
      '---',
      'type: Essay',
      'archived: true',
      'icon: pen-nib',
      'status: Active',
      'date: "2026-05-05"',
      'belongs_to: [Tolaria MVP]',
      'related_to: [workflow]',
      'has: [release]',
      '---',
      '# Workflow',
    ].join('\n'))).toEqual({
      archived: true,
      belongsTo: ['Tolaria MVP'],
      date: '2026-05-05',
      has: ['release'],
      icon: 'pen-nib',
      relatedTo: ['workflow'],
      status: 'Active',
      tags: [],
      type: 'Essay',
    })
  })

  it('reads inline tag lists', () => {
    expect(readMobileNoteFrontmatter('---\ntags: [Tolaria MVP, "mobile"]\n---\n# Note')).toEqual({
      archived: undefined,
      belongsTo: [],
      date: undefined,
      has: [],
      icon: undefined,
      relatedTo: [],
      status: undefined,
      tags: ['Tolaria MVP', 'mobile'],
      type: undefined,
    })
  })

  it('returns empty metadata when frontmatter is missing', () => {
    expect(readMobileNoteFrontmatter('# Note')).toEqual({
      archived: undefined,
      belongsTo: [],
      date: undefined,
      has: [],
      icon: undefined,
      relatedTo: [],
      status: undefined,
      tags: [],
      type: undefined,
    })
  })

  it('ignores unsupported relationship and boolean shapes', () => {
    expect(readMobileNoteFrontmatter('---\narchived: false\nrelated_to: workflow\ntags: mobile\n---\n# Note')).toEqual({
      archived: undefined,
      belongsTo: [],
      date: undefined,
      has: [],
      icon: undefined,
      relatedTo: [],
      status: undefined,
      tags: [],
      type: undefined,
    })
  })
})
