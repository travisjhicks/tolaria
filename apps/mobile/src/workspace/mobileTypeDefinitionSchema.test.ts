import { describe, expect, it } from 'vitest'
import { workspaceScenarioForId } from '../fixtures/workspaceFixtures'
import type { MobileNote, MobileTypeDefinition } from './mobileWorkspaceModel'
import {
  addTypeSchemaProperty,
  addTypeSchemaRelationshipRef,
  mobileTypeSchemaRelationshipValueText,
  typeDefinitionSchemaPatch,
  typeSchemaPropertiesForForm,
  typeSchemaRelationshipTargetSuggestions,
  typeSchemaRelationshipsForForm,
} from './mobileTypeDefinitionSchema'

describe('mobile type definition schema helpers', () => {
  it('splits Type scalar defaults from relationship schema rows', () => {
    const definition: MobileTypeDefinition = {
      properties: {
        Priority: 'High',
        has: 'Milestone',
      },
      relationships: {
        depends_on: ['[[Project Board]]'],
      },
    }

    expect(typeSchemaPropertiesForForm(definition)).toEqual([
      { key: 'Priority', value: 'High' },
    ])
    expect(typeSchemaRelationshipsForForm(definition)).toEqual([
      { key: 'depends_on', refs: ['[[Project Board]]'] },
      { key: 'has', placeholderValue: 'Milestone', refs: [] },
    ])
  })

  it('writes schema rows back to the desktop Type frontmatter contract', () => {
    expect(typeDefinitionSchemaPatch([
      { key: 'Priority', value: 'High' },
    ], [
      { key: 'depends_on', refs: ['[[Project Board]]'] },
      { key: 'has', placeholderValue: 'Milestone', refs: [] },
    ])).toEqual({
      properties: {
        Priority: 'High',
        has: 'Milestone',
      },
      relationships: {
        depends_on: ['[[Project Board]]'],
      },
    })
  })

  it('parses property defaults and resolves relationship targets from notes', () => {
    const notes = workspaceScenarioForId('default').notes
    const properties = addTypeSchemaProperty([], 'Stage', 'Design, Build')
    const relationships = addTypeSchemaRelationshipRef({
      key: 'belongs to',
      notes,
      relationships: [],
      targetTitle: 'How I Run an Open Source Project',
    })

    expect(properties).toEqual([{ key: 'Stage', value: ['Design', 'Build'] }])
    expect(relationships).toEqual([{ key: 'belongs_to', refs: ['[[Tolaria/Mobile UI/How I Run an Open Source Project]]'] }])
    expect(mobileTypeSchemaRelationshipValueText(relationships[0], notes)).toBe('How I Run an Open Source Project')
  })

  it('searches and saves type relationship targets through desktop note identities', () => {
    const notes = workspaceScenarioForId('default').notes.map((note) => note.id === 'open-source-project'
      ? { ...note, aliases: ['OSS Project'] }
      : note)

    expect(typeSchemaRelationshipTargetSuggestions(notes, 'oss')).toEqual([
      expect.objectContaining({
        label: 'How I Run an Open Source Project',
        value: '[[Tolaria/Mobile UI/How I Run an Open Source Project]]',
      }),
    ])
    expect(typeSchemaRelationshipTargetSuggestions(notes, 'Tolaria/Mobile UI')).toContainEqual(expect.objectContaining({
      label: 'How I Run an Open Source Project',
    }))
    expect(addTypeSchemaRelationshipRef({
      key: 'related to',
      notes,
      relationships: [],
      targetTitle: 'OSS Project',
    })).toEqual([
      { key: 'related_to', refs: ['[[Tolaria/Mobile UI/How I Run an Open Source Project]]'] },
    ])
  })

  it('uses selected type relationship refs when titles are ambiguous', () => {
    const base = workspaceScenarioForId('default')
    const notes: MobileNote[] = [
      duplicateReference(base.notes[1], 'duplicate-reference-a', 'Writing/Duplicate Reference.md', 'Essay', 'green'),
      duplicateReference(base.notes[1], 'duplicate-reference-b', 'Projects/Duplicate Reference.md', 'Procedure', 'purple'),
    ]

    expect(addTypeSchemaRelationshipRef({
      key: 'related to',
      notes,
      relationships: [],
      targetRef: '[[Projects/Duplicate Reference]]',
      targetTitle: 'Duplicate Reference',
    })).toEqual([
      { key: 'related_to', refs: ['[[Projects/Duplicate Reference]]'] },
    ])
  })
})

function duplicateReference(
  base: MobileNote,
  id: string,
  path: string,
  type: MobileNote['type'],
  typeTone: MobileNote['typeTone'],
): MobileNote {
  return {
    ...base,
    id,
    path,
    title: 'Duplicate Reference',
    type,
    typeTone,
  }
}
