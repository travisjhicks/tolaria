import { projectMobileNote, projectMobileNotes, type MobileNote, type MobileNoteSource } from './mobileNoteProjection'
import type { MobileVaultConfig } from './mobileVaultConfig'
import type { MobileVaultFile, MobileVaultStorageDriver } from './mobileVaultStorage'

export type MobileVaultRepository = {
  listNotes: () => Promise<MobileNote[]>
  readNote: (id: string) => Promise<MobileNote | null>
}

export function createFixtureMobileVaultRepository(sources: MobileNoteSource[]): MobileVaultRepository {
  const notes = projectMobileNotes(sources)

  return {
    listNotes: () => Promise.resolve(notes),
    readNote: (id) => Promise.resolve(notes.find((note) => note.id === id) ?? null),
  }
}

export function createStoredMobileVaultRepository({
  storage,
  vault,
}: {
  storage: MobileVaultStorageDriver
  vault: MobileVaultConfig
}): MobileVaultRepository {
  return {
    listNotes: async () => projectMobileNotes((await storage.listMarkdownFiles(vault)).map(fileToSource)),
    readNote: async (id) => {
      const file = await findFileById({ id, storage, vault })
      return file ? projectMobileNote(fileToSource(file)) : null
    },
  }
}

async function findFileById({
  id,
  storage,
  vault,
}: {
  id: string
  storage: MobileVaultStorageDriver
  vault: MobileVaultConfig
}) {
  return (await storage.listMarkdownFiles(vault)).find((file) => fileId(file.path) === id) ?? null
}

function fileToSource(file: MobileVaultFile): MobileNoteSource {
  return {
    id: fileId(file.path),
    type: 'Note',
    icon: 'file-text',
    date: '',
    modified: '',
    filename: file.path,
    content: file.content,
    tags: [],
  }
}

function fileId(path: string) {
  return path.replace(/\.md$/, '')
}
