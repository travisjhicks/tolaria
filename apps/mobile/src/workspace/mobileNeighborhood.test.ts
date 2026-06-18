import { describe, expect, it } from 'vitest'
import {
  buildMobileNeighborhood,
  filterMobileNeighborhood,
  flattenMobileNeighborhoodNotes,
} from './mobileNeighborhood'
import type { MobileNote, MobileRelationship, MobileTone } from './mobileWorkspaceModel'

describe('mobile neighborhood', () => {
  it('builds desktop-parity direct, inverse, and duplicate relationship groups', () => {
    const parent = note({ id: 'parent', title: 'Parent', type: 'Project' })
    const shared = note({
      id: 'shared',
      modifiedAt: 20,
      relationships: [relationship('related_to', [{
        id: 'parent',
        ref: '[[parent]]',
        title: 'Parent',
      }])],
      title: 'Shared Note',
    })
    const directOnly = note({ id: 'direct', modifiedAt: 10, title: 'Direct Target' })
    const source = {
      ...parent,
      relationships: [relationship('Related to', [
        { id: 'direct', ref: '[[direct]]', title: 'Direct Target' },
        { id: 'shared', ref: '[[shared]]', title: 'Shared Note' },
      ])],
    }

    const neighborhood = buildMobileNeighborhood(source, [source, directOnly, shared])

    expect(neighborhood.groups.map((group) => group.label)).toEqual(['Related to', 'Referenced by'])
    expect(neighborhood.groups.find((group) => group.label === 'Related to')?.notes.map((item) => item.id)).toEqual(['shared', 'direct'])
    expect(neighborhood.groups.find((group) => group.label === 'Referenced by')?.notes.map((item) => item.id)).toEqual(['shared'])
    expect(flattenMobileNeighborhoodNotes(neighborhood).map((item) => item.id)).toEqual(['parent', 'shared', 'direct', 'shared'])
  })

  it('keeps desktop inverse labels and Type instances', () => {
    const source = note({ id: 'type-essay', title: 'Essay', type: 'Type' })
    const child = note({
      id: 'child',
      relationships: [relationship('belongs_to', [{ id: 'type-essay', ref: '[[Essay]]', title: 'Essay' }])],
      title: 'Child',
      type: 'Essay',
    })
    const topic = note({
      id: 'topic',
      relationships: [relationship('Topics', [{ id: 'type-essay', ref: '[[Essay]]', title: 'Essay' }])],
      title: 'Topic',
    })

    const neighborhood = buildMobileNeighborhood(source, [source, child, topic])

    expect(neighborhood.groups.map((group) => group.label)).toEqual(['Instances', 'Children', '← Topics'])
    expect(neighborhood.groups.find((group) => group.label === 'Instances')?.notes.map((item) => item.id)).toEqual(['child'])
  })

  it('filters relationship groups using note-list search fields', () => {
    const source = note({
      id: 'source',
      relationships: [relationship('related_to', [
        { id: 'keep', ref: '[[keep]]', title: 'Keep' },
        { id: 'drop', ref: '[[drop]]', title: 'Drop' },
      ])],
      title: 'Source',
    })
    const keep = note({ id: 'keep', snippet: 'contains sprint planning', title: 'Keep' })
    const drop = note({ id: 'drop', snippet: 'release notes', title: 'Drop' })

    const filtered = filterMobileNeighborhood(buildMobileNeighborhood(source, [source, keep, drop]), 'sprint')

    expect(filtered.groups).toHaveLength(1)
    expect(filtered.groups[0].notes.map((item) => item.id)).toEqual(['keep'])
  })
})

function relationship(
  key: string,
  values: Array<{ id?: string; ref?: string; title: string; type?: string; typeTone?: MobileTone }>,
): MobileRelationship {
  return {
    key,
    kind: key === 'belongs_to' || key === 'Belongs to' ? 'belongsTo' : key === 'related_to' || key === 'Related to' ? 'relatedTo' : 'custom',
    values: values.map((value) => ({
      type: 'Note',
      typeTone: 'gray',
      ...value,
    })),
  }
}

function note(overrides: Partial<MobileNote>): MobileNote {
  return {
    created: '-',
    date: '-',
    favorite: false,
    id: 'note',
    links: 0,
    modified: '-',
    modifiedAt: 0,
    relationships: [],
    snippet: '',
    status: '',
    tags: [],
    title: 'Note',
    type: 'Note',
    typeTone: 'gray',
    workspace: 'TV',
    ...overrides,
  }
}
