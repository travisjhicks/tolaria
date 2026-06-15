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
