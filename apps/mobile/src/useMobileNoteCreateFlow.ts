import { useCallback, useState } from 'react'
import type { MobileNote } from './demoData'

export function useMobileNoteCreateFlow({
  createNote,
  onCreated,
}: {
  createNote: (title: string) => Promise<MobileNote | null>
  onCreated: (note: MobileNote) => void
}) {
  const [failed, setFailed] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const create = useCallback(() => {
    if (isCreating) {
      return
    }

    setFailed(false)
    setIsCreating(true)
    void createNote('')
      .then((note) => {
        if (note) {
          onCreated(note)
        }
      })
      .catch(() => {
        setFailed(true)
      })
      .finally(() => {
        setIsCreating(false)
      })
  }, [createNote, isCreating, onCreated])

  return {
    create,
    failed,
    isCreating,
  }
}
