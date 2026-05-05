import { describe, expect, it } from 'vitest'
import { writeMobileNoteFrontmatter } from './mobileNoteFrontmatterWrite'

describe('mobile note frontmatter write', () => {
  it('creates frontmatter for supported mobile metadata', () => {
    expect(writeMobileNoteFrontmatter({
      content: '# Workflow\n\nBody',
      metadata: {
        archived: true,
        belongsTo: ['Tolaria MVP'],
        customProperties: { review_stage: 'Draft' },
        date: '2026-05-05',
        favorite: true,
        favoriteIndex: 0,
        has: ['Release Notes'],
        icon: 'pen-nib',
        relatedTo: ['workflow'],
        relationships: { people: ['Luca'] },
        status: 'Draft',
        tags: ['Tolaria MVP', 'mobile'],
        type: 'Essay',
      },
    })).toBe([
      '---',
      '_favorite: true',
      '_favorite_index: 0',
      'archived: true',
      'type: Essay',
      'status: Draft',
      'date: 2026-05-05',
      'icon: pen-nib',
      'belongs_to: [Tolaria MVP]',
      'related_to: [workflow]',
      'has: [Release Notes]',
      'tags: [Tolaria MVP, mobile]',
      'review_stage: Draft',
      'people: [Luca]',
      '---',
      '# Workflow',
      '',
      'Body',
    ].join('\n'))
  })

  it('updates supported fields while preserving unknown metadata', () => {
    expect(writeMobileNoteFrontmatter({
      content: [
        '---',
        'archived: true',
        'title: Legacy',
        'type: Note',
        'private: true',
        'related_to: [old]',
        'tags: [old]',
        '---',
        '# Workflow',
      ].join('\n'),
      metadata: {
        archived: false,
        tags: ['mobile'],
        type: 'Project',
      },
    })).toBe([
      '---',
      'title: Legacy',
      'private: true',
      'type: Project',
      'tags: [mobile]',
      '---',
      '# Workflow',
    ].join('\n'))
  })

  it('removes frontmatter when no known or unknown metadata remains', () => {
    expect(writeMobileNoteFrontmatter({
      content: '---\ntype: Note\ntags: [old]\n---\n# Workflow',
      metadata: {},
    })).toBe('# Workflow')
  })

  it('quotes values that need YAML escaping', () => {
    expect(writeMobileNoteFrontmatter({
      content: '# Workflow',
      metadata: {
        status: 'Needs: Review',
        tags: ['AI/ML', 'needs, comma'],
      },
    })).toBe('---\nstatus: "Needs: Review"\ntags: [AI/ML, "needs, comma"]\n---\n# Workflow')
  })

  it('updates dynamic metadata without duplicating old lines', () => {
    expect(writeMobileNoteFrontmatter({
      content: '---\npeople: [Old]\nreview_stage: Old\n---\n# Workflow',
      metadata: {
        customProperties: { review_stage: 'Ready' },
        relationships: { people: ['New'] },
      },
    })).toBe('---\nreview_stage: Ready\npeople: [New]\n---\n# Workflow')
  })

  it('removes dynamic metadata when removal keys are provided', () => {
    expect(writeMobileNoteFrontmatter({
      content: '---\npeople: [Old]\nreview_stage: Old\n---\n# Workflow',
      metadata: {
        removedCustomPropertyKeys: ['review_stage'],
        removedRelationshipKeys: ['people'],
      },
    })).toBe('# Workflow')
  })
})
