import { projectMobileNote, projectMobileNotes, type MobileNote, type MobileNoteSource } from './mobileNoteProjection'
import { readMobileNoteFrontmatter } from './mobileNoteFrontmatter'
import type { MobileVaultConfig } from './mobileVaultConfig'
import type { MobileVaultFile, MobileVaultStorageDriver } from './mobileVaultStorage'

export type MobileVaultRepository = {
  deleteNote: (id: string) => Promise<void>
  listNotes: () => Promise<MobileNote[]>
  readNote: (id: string) => Promise<MobileNote | null>
}

export function createFixtureMobileVaultRepository(sources: MobileNoteSource[]): MobileVaultRepository {
  const notes = projectMobileNotes(sources)

  return {
    deleteNote: () => Promise.resolve(),
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
    deleteNote: async (id) => {
      const file = await findFileById({ id, storage, vault })
      if (file) {
        await storage.deleteMarkdownFile(vault, file.path)
      }
    },
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
  const metadata = readMobileNoteFrontmatter(file.content)

  return {
    id: fileId(file.path),
    archived: metadata.archived ?? false,
    belongsTo: metadata.belongsTo,
    type: metadata.type ?? 'Note',
    has: metadata.has,
    icon: metadata.icon ?? 'file-text',
    date: metadata.date ?? '',
    modified: '',
    filename: file.path,
    content: file.content,
    relatedTo: metadata.relatedTo,
    status: metadata.status,
    tags: metadata.tags,
  }
}

function fileId(path: string) {
  return path.replace(/\.md$/, '')
}
