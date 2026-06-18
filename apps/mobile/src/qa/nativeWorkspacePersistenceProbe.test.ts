import { describe, expect, it } from 'vitest'
import {
  assertNativeWorkspacePersistenceProofs,
  nativeWorkspacePersistenceLogLine,
  parseNativeWorkspacePersistenceProofs,
  type NativeWorkspacePersistenceProof,
} from './nativeWorkspacePersistenceProbe'

describe('native workspace persistence probe', () => {
  it('passes when native workspace writes rehydrate from the Expo filesystem repository', () => {
    expect(assertNativeWorkspacePersistenceProofs([passingWorkspaceProof()])).toEqual([])
  })

  it('parses simulator log lines and reports repository failures', () => {
    const proof = {
      ...passingWorkspaceProof(),
      createdNoteHydrated: false,
      persistedToNativeRepository: false,
    }
    const parsed = parseNativeWorkspacePersistenceProofs(`noise\n${nativeWorkspacePersistenceLogLine(proof)}\n`)

    expect(parsed).toEqual([proof])
    expect(assertNativeWorkspacePersistenceProofs(parsed).map((failure) => failure.id)).toEqual([
      'workspace.persistence.native',
      'workspace.persistence.createNote',
    ])
  })

  it('ignores malformed and incomplete proof lines', () => {
    const logText = [
      'TOLARIA_MOBILE_WORKSPACE_PERSISTENCE_PROBE not-json',
      nativeWorkspacePersistenceLogLine({ ...passingWorkspaceProof(), savedViewHydrated: false }),
      'TOLARIA_MOBILE_WORKSPACE_PERSISTENCE_PROBE {"savedViewHydrated":true}',
    ].join('\n')

    expect(parseNativeWorkspacePersistenceProofs(logText)).toEqual([
      { ...passingWorkspaceProof(), savedViewHydrated: false },
    ])
  })
})

function passingWorkspaceProof(): NativeWorkspacePersistenceProof {
  return {
    createdNoteHydrated: true,
    deletedTypeDefinitionRemoved: true,
    deletedViewRemoved: true,
    folderDeleteApplied: true,
    folderRenameApplied: true,
    movedNoteContentPreserved: true,
    persistedToNativeRepository: true,
    savedViewHydrated: true,
    typeDefinitionHydrated: true,
  }
}
