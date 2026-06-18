import { describe, expect, it } from 'vitest'
import { workspaceScenarioForId } from '../fixtures/workspaceFixtures'
import { applyMobileWorkspaceEditWithWrites } from './mobileWorkspaceEditing'
import type {
  MobileNote,
  MobileTypeDefinition,
  MobileWorkspaceSnapshot,
} from './mobileWorkspaceModel'

describe('mobile type definition path rewrites', () => {
  it('retargets Type schema relationship refs when notes move folders', () => {
    const snapshot = schemaReferenceSnapshot(['archive', 'projects'])
    const result = applyMobileWorkspaceEditWithWrites(snapshot, {
      folderPath: 'archive',
      noteId: 'projects/remote.md',
      type: 'moveNoteToFolder',
    })
    const project = result.snapshot.typeDefinitions?.Project

    expect(project?.relationships?.depends_on).toEqual(['[[team/archive/remote]]'])
    expect(project?.rawContent).toContain('[[team/archive/remote]]')
    expect(result.writes).toEqual([
      {
        kind: 'moveNote',
        path: 'projects/remote.md',
        toPath: 'archive/remote.md',
      },
      {
        content: project?.rawContent,
        kind: 'saveNote',
        path: 'types/project.md',
      },
    ])
  })

  it('retargets Type schema relationship refs when folder subtrees are renamed', () => {
    const snapshot = schemaReferenceSnapshot(['projects'])
    const result = applyMobileWorkspaceEditWithWrites(snapshot, {
      folderPath: 'projects',
      name: 'archive',
      type: 'renameFolder',
    })
    const project = result.snapshot.typeDefinitions?.Project

    expect(project?.relationships?.depends_on).toEqual(['[[team/archive/remote]]'])
    expect(project?.rawContent).toContain('[[team/archive/remote]]')
    expect(result.writes).toEqual([
      { kind: 'renameFolder', path: 'projects', toPath: 'archive' },
      {
        content: project?.rawContent,
        kind: 'saveNote',
        path: 'types/project.md',
      },
    ])
  })
})

function schemaReferenceSnapshot(folderPaths: string[]): MobileWorkspaceSnapshot {
  const base = workspaceScenarioForId('default')
  const remote = remoteTeamNote(base.notes[1]!)

  return {
    ...base,
    allNotes: [remote],
    folderPaths,
    notes: [remote],
    typeDefinitions: {
      Project: projectTypeDefinition(),
    },
  }
}

function remoteTeamNote(base: MobileNote): MobileNote {
  return {
    ...base,
    id: 'projects/remote.md',
    path: 'projects/remote.md',
    rawContent: '# Remote\n\nMove me.\n',
    relationships: [],
    title: 'Remote',
    workspace: 'Team',
    workspaceAlias: 'team',
  }
}

function projectTypeDefinition(): MobileTypeDefinition {
  return {
    path: 'types/project.md',
    rawContent: [
      '---',
      'type: Type',
      'depends_on:',
      '  - "[[team/projects/remote]]"',
      '---',
      '# Project',
      '',
    ].join('\n'),
    relationships: {
      depends_on: ['[[team/projects/remote]]'],
    },
  }
}
