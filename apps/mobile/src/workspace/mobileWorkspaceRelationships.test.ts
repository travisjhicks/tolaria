import { describe, expect, it } from 'vitest'
import { workspaceScenarioForId } from '../fixtures/workspaceFixtures'
import { applyMobileWorkspaceEdit } from './mobileWorkspaceEditing'
import type { MobileNote } from './mobileWorkspaceModel'

describe('mobile workspace relationship editing', () => {
  it('uses exact selected relationship refs when titles are ambiguous', () => {
    const base = workspaceScenarioForId('default')
    const notes = [
      base.notes[0],
      duplicateReference('duplicate-reference-a', 'Writing/Duplicate Reference.md', 'Essay', 'green'),
      duplicateReference('duplicate-reference-b', 'Projects/Duplicate Reference.md', 'Procedure', 'purple'),
      ...base.notes.slice(1),
    ]
    const snapshot = { ...base, allNotes: notes, notes }

    const withRelationship = applyMobileWorkspaceEdit(snapshot, {
      key: 'related_to',
      noteId: 'workflow-orchestration',
      targetRef: '[[Projects/Duplicate Reference]]',
      targetTitle: 'Duplicate Reference',
      type: 'addRelationship',
    })

    const note = withRelationship.notes.find((candidate) => candidate.id === 'workflow-orchestration')
    expect(note?.relationships.find((relationship) => relationship.key === 'related_to')?.values).toContainEqual(
      expect.objectContaining({
        ref: '[[Projects/Duplicate Reference]]',
        title: 'Duplicate Reference',
        type: 'Procedure',
        typeTone: 'purple',
      }),
    )
  })

  it('prefixes typed cross-workspace relationship targets with the target workspace alias', () => {
    const base = workspaceScenarioForId('default')
    const source = {
      ...base.notes[0],
      workspace: 'Personal',
      workspaceAlias: 'personal',
    }
    const remote = {
      ...base.notes[1],
      id: 'team/projects/remote.md',
      path: 'projects/remote.md',
      title: 'Remote',
      workspace: 'Team',
      workspaceAlias: 'team',
    }
    const snapshot = {
      ...base,
      allNotes: [source, remote, ...base.notes.slice(2)],
      notes: [source, remote, ...base.notes.slice(2)],
    }

    const withRelationship = applyMobileWorkspaceEdit(snapshot, {
      key: 'Mentions',
      noteId: source.id,
      targetTitle: 'Remote',
      type: 'addRelationship',
    })

    expect(withRelationship.notes.find((candidate) => candidate.id === source.id)?.rawContent).toContain(
      '  - "[[team/projects/remote]]"',
    )
  })
})

function duplicateReference(
  id: string,
  path: string,
  type: MobileNote['type'],
  typeTone: MobileNote['typeTone'],
): MobileNote {
  const base = workspaceScenarioForId('default').notes[1]
  return {
    ...base,
    id,
    path,
    title: 'Duplicate Reference',
    type,
    typeTone,
  }
}
