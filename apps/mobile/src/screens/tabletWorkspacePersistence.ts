import { useCallback, useEffect, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from 'react'
import {
  applyMobileWorkspaceEditWithWrites,
  type MobileWorkspaceEdit,
  type MobileWorkspaceWrite,
} from '../workspace/mobileWorkspaceEditing'
import type { MobileWorkspaceSnapshot } from '../workspace/mobileWorkspaceModel'
import type {
  ReadOnlyWorkspaceRepository,
  ReadOnlyWorkspaceRequest,
} from '../workspace/readOnlyWorkspaceRepository'
import {
  emptyMobileWorkspaceHistory,
  mobileWorkspaceHistoryEntry,
  recordMobileWorkspaceHistory,
  type MobileWorkspaceHistoryEntry,
} from './tabletWorkspaceHistory'

type WorkspaceSnapshotRef = MutableRefObject<MobileWorkspaceSnapshot>
type WorkspaceSnapshotSetter = Dispatch<SetStateAction<MobileWorkspaceSnapshot>>
type WorkspaceEditOptions = { recordHistory?: boolean }

export function useWorkspaceEditPipeline({
  repository,
  repositoryRequest,
  snapshot,
}: {
  repository: ReadOnlyWorkspaceRepository
  repositoryRequest?: ReadOnlyWorkspaceRequest
  snapshot: MobileWorkspaceSnapshot
}) {
  const [workspaceSnapshot, setWorkspaceSnapshot] = useState(snapshot)
  const [workspaceHistory, setWorkspaceHistory] = useState(emptyMobileWorkspaceHistory)
  const workspaceSnapshotRef = useRef(workspaceSnapshot)
  const applyWorkspaceEdit = useCallback((edit: MobileWorkspaceEdit, options: WorkspaceEditOptions = {}) => {
    const previousSnapshot = workspaceSnapshotRef.current
    const result = applyMobileWorkspaceEditWithWrites(previousSnapshot, edit)
    updateWorkspaceSnapshot(result.snapshot, workspaceSnapshotRef, setWorkspaceSnapshot)
    if (options.recordHistory !== false) {
      setWorkspaceHistory((history) => recordMobileWorkspaceHistory(
        history,
        mobileWorkspaceHistoryEntry(previousSnapshot, result.snapshot, edit),
      ))
    }
    if (result.writes.length > 0) void persistWorkspaceWrites({
      repository,
      repositoryRequest,
      setWorkspaceSnapshot,
      workspaceSnapshotRef,
      writes: result.writes,
    })
    return result
  }, [repository, repositoryRequest])
  const applyWorkspaceHistoryEntry = useCallback((entry: MobileWorkspaceHistoryEntry, direction: 'redo' | 'undo') => {
    const edits = direction === 'undo' ? entry.undoEdits : entry.redoEdits
    for (const edit of edits) applyWorkspaceEdit(edit, { recordHistory: false })
  }, [applyWorkspaceEdit])
  const undoWorkspaceEdit = useCallback(() => {
    const entry = latestWorkspaceHistoryEntry(workspaceHistory.past)
    if (!entry) return

    setWorkspaceHistory({
      future: [entry, ...workspaceHistory.future],
      past: workspaceHistory.past.slice(0, -1),
    })
    applyWorkspaceHistoryEntry(entry, 'undo')
  }, [applyWorkspaceHistoryEntry, workspaceHistory])
  const redoWorkspaceEdit = useCallback(() => {
    const entry = workspaceHistory.future[0]
    if (!entry) return

    setWorkspaceHistory({
      future: workspaceHistory.future.slice(1),
      past: [...workspaceHistory.past, entry],
    })
    applyWorkspaceHistoryEntry(entry, 'redo')
  }, [applyWorkspaceHistoryEntry, workspaceHistory])

  useEffect(() => {
    workspaceSnapshotRef.current = workspaceSnapshot
  }, [workspaceSnapshot])

  return {
    applyWorkspaceEdit,
    canRedoWorkspaceEdit: workspaceHistory.future.length > 0,
    canUndoWorkspaceEdit: workspaceHistory.past.length > 0,
    redoWorkspaceEdit,
    undoWorkspaceEdit,
    workspaceSnapshot,
  }
}

function latestWorkspaceHistoryEntry(entries: MobileWorkspaceHistoryEntry[]) {
  return entries.at(-1) ?? null
}

function updateWorkspaceSnapshot(
  snapshot: MobileWorkspaceSnapshot,
  workspaceSnapshotRef: WorkspaceSnapshotRef,
  setWorkspaceSnapshot: WorkspaceSnapshotSetter,
) {
  workspaceSnapshotRef.current = snapshot
  setWorkspaceSnapshot(snapshot)
}

async function persistWorkspaceWrites({
  repository,
  repositoryRequest,
  setWorkspaceSnapshot,
  workspaceSnapshotRef,
  writes,
}: {
  repository: ReadOnlyWorkspaceRepository
  repositoryRequest?: ReadOnlyWorkspaceRequest
  setWorkspaceSnapshot: WorkspaceSnapshotSetter
  workspaceSnapshotRef: WorkspaceSnapshotRef
  writes: MobileWorkspaceWrite[]
}) {
  try {
    await repository.persistWrites(writes, repositoryRequest)
  } catch {
    markWorkspaceWriteFailed(workspaceSnapshotRef, setWorkspaceSnapshot)
  }
}

function markWorkspaceWriteFailed(
  workspaceSnapshotRef: WorkspaceSnapshotRef,
  setWorkspaceSnapshot: WorkspaceSnapshotSetter,
) {
  setWorkspaceSnapshot((current) => {
    const failedSnapshot = snapshotWithWriteFailure(current)
    workspaceSnapshotRef.current = failedSnapshot
    return failedSnapshot
  })
}

function snapshotWithWriteFailure(snapshot: MobileWorkspaceSnapshot): MobileWorkspaceSnapshot {
  if (snapshot.sync.kind === 'writeFailed') return snapshot

  return {
    ...snapshot,
    sync: { kind: 'writeFailed' },
  }
}
