import { useEffect, useState } from 'react'
import {
  buildMobileInspectorReferenceGroups,
  type MobileNeighborhoodGroup,
} from '../workspace/mobileNeighborhood'
import type { MobileNote, MobileWorkspaceSnapshot } from '../workspace/mobileWorkspaceModel'

type ReferenceGroupState = {
  groups: MobileNeighborhoodGroup[]
  noteId: string | null
}

const emptyReferenceGroupState: ReferenceGroupState = {
  groups: [],
  noteId: null,
}

export function useMobileInspectorReferenceGroups(
  note: MobileNote | null,
  snapshot: MobileWorkspaceSnapshot,
): MobileNeighborhoodGroup[] {
  const notes = snapshot.allNotes ?? snapshot.notes
  const [state, setState] = useState<ReferenceGroupState>(emptyReferenceGroupState)

  useEffect(() => {
    if (!note) {
      return undefined
    }

    let cancelled = false
    const noteId = note.id
    const timeoutId = setTimeout(() => {
      if (cancelled) return
      setState({
        groups: buildMobileInspectorReferenceGroups(note, notes),
        noteId,
      })
    }, 0)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [note, notes])

  return state.noteId === note?.id ? state.groups : []
}
