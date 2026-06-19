import { describe, expect, it } from 'vitest'
import { workspaceScenarioForId } from '../fixtures/workspaceFixtures'
import { applyMobileWorkspaceEdit, applyMobileWorkspaceEditWithWrites } from './mobileWorkspaceEditing'
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

  it('retargets alias-prefixed relationship refs when cross-workspace notes move', () => {
    const base = workspaceScenarioForId('default')
    const source = {
      ...base.notes[0],
      id: 'source.md',
      path: 'source.md',
      rawContent: [
        '---',
        'mentions:',
        '  - [[team/projects/remote]]',
        '---',
        '# Source',
        '',
        'See [[team/projects/remote|Remote]].',
        '',
      ].join('\n'),
      relationships: [],
      workspace: 'Personal',
      workspaceAlias: 'personal',
    }
    const remote = {
      ...base.notes[1],
      id: 'projects/remote.md',
      path: 'projects/remote.md',
      rawContent: '# Remote\n\nMove me.\n',
      title: 'Remote',
      workspace: 'Team',
      workspaceAlias: 'team',
    }
    const result = applyMobileWorkspaceEditWithWrites({
      ...base,
      allNotes: [source, remote],
      folderPaths: ['archive'],
      notes: [source, remote],
    }, {
      folderPath: 'archive',
      noteId: remote.id,
      type: 'moveNoteToFolder',
    })
    const updatedSource = result.snapshot.allNotes?.find((note) => note.id === source.id)

    expect(updatedSource?.rawContent).toContain('  - [[team/archive/remote]]')
    expect(updatedSource?.rawContent).toContain('[[team/archive/remote|Remote]]')
    expect(updatedSource?.relationships.find((relationship) => relationship.key === 'mentions')?.values).toContainEqual(
      expect.objectContaining({
        id: 'archive/remote.md',
        ref: '[[team/archive/remote]]',
        title: 'Remote',
      }),
    )
    expect(result.writes).toEqual([
      {
        kind: 'moveNote',
        path: 'projects/remote.md',
        toPath: 'archive/remote.md',
      },
      {
        content: updatedSource?.rawContent,
        kind: 'saveNote',
        path: 'source.md',
      },
    ])
  })

  it('appends canonical relationship edits to existing desktop relationship labels', () => {
    const base = workspaceScenarioForId('default')
    const source = {
      ...base.notes[0],
      rawContent: [
        '---',
        'Related to:',
        '  - "[[Old Project]]"',
        '---',
        '# Source',
        '',
        'Source body.',
        '',
      ].join('\n'),
      relationships: [],
    }
    const result = applyMobileWorkspaceEditWithWrites({
      ...base,
      allNotes: [source, ...base.notes.slice(1)],
      notes: [source, ...base.notes.slice(1)],
    }, {
      key: 'related_to',
      noteId: source.id,
      targetRef: '[[New Project]]',
      targetTitle: 'New Project',
      type: 'addRelationship',
    })
    const updatedSource = result.snapshot.notes.find((note) => note.id === source.id)

    expect(updatedSource?.rawContent).toContain('Related to:\n  - "[[Old Project]]"\n  - "[[New Project]]"')
    expect(updatedSource?.rawContent).not.toContain('related_to:')
    expect(updatedSource?.relationships.find((relationship) => relationship.key === 'Related to')?.values).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ref: '[[Old Project]]' }),
        expect.objectContaining({ ref: '[[New Project]]' }),
      ]),
    )
    expect(result.writes).toEqual([{
      content: updatedSource?.rawContent,
      kind: 'saveNote',
      path: 'Tolaria/Mobile UI/Workflow Orchestration Essay.md',
    }])
  })

  it('removes canonical relationship edits from existing desktop relationship labels', () => {
    const base = workspaceScenarioForId('default')
    const source = {
      ...base.notes[0],
      rawContent: [
        '---',
        'Related to:',
        '  - "[[Old Project]]"',
        '  - "[[New Project]]"',
        '---',
        '# Source',
        '',
        'Source body.',
        '',
      ].join('\n'),
      relationships: [],
    }
    const result = applyMobileWorkspaceEditWithWrites({
      ...base,
      allNotes: [source, ...base.notes.slice(1)],
      notes: [source, ...base.notes.slice(1)],
    }, {
      key: 'related_to',
      noteId: source.id,
      ref: '[[Old Project]]',
      type: 'removeRelationship',
    })
    const updatedSource = result.snapshot.notes.find((note) => note.id === source.id)

    expect(updatedSource?.rawContent).toContain('Related to:\n  - "[[New Project]]"')
    expect(updatedSource?.rawContent).not.toContain('[[Old Project]]')
    expect(updatedSource?.rawContent).not.toContain('related_to:')
    expect(updatedSource?.relationships.find((relationship) => relationship.key === 'Related to')?.values).toEqual([
      expect.objectContaining({ ref: '[[New Project]]' }),
    ])
    expect(result.writes).toEqual([{
      content: updatedSource?.rawContent,
      kind: 'saveNote',
      path: 'Tolaria/Mobile UI/Workflow Orchestration Essay.md',
    }])
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
