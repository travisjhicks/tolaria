import { demoNoteSources } from './demoData'
import type { MobileEditorDraft } from './mobileEditorDraft'
import { saveMobileEditorDraft } from './mobileEditorDraftSave'
import { saveMobileNoteFrontmatter } from './mobileNoteFrontmatterSave'
import type { WritableMobileNoteFrontmatter } from './mobileNoteFrontmatterWrite'
import { createMobileNoteFile } from './mobileNoteCreate'
import {
  createMobileVaultConfigFromMetadata,
  defaultMobileVaultMetadata,
  type MobileVaultMetadata,
} from './mobileVaultMetadata'
import { createNativeMobileVaultStorage } from './mobileNativeVaultStorage'
import { createStoredMobileVaultRepository } from './mobileVaultRepository'
import { seedMobileVaultIfEmpty } from './mobileVaultSeed'
import type { MobileVaultFile } from './mobileVaultStorage'

export async function loadDemoVaultNotes(vaultMetadata = defaultMobileVaultMetadata) {
  const storage = createNativeMobileVaultStorage()
  const demoVault = createDemoVaultConfig(vaultMetadata)
  await seedMobileVaultIfEmpty({ files: demoVaultFiles(), storage, vault: demoVault })
  await addMissingDemoVaultFiles({ files: demoVaultFiles(), storage, vault: demoVault })

  return createStoredMobileVaultRepository({ storage, vault: demoVault }).listNotes()
}

export function saveDemoVaultDraft(draft: MobileEditorDraft, vaultMetadata = defaultMobileVaultMetadata) {
  return saveMobileEditorDraft({
    draft,
    storage: createNativeMobileVaultStorage(),
    vault: createDemoVaultConfig(vaultMetadata),
  })
}

export async function createDemoVaultNote({
  title,
  vaultMetadata = defaultMobileVaultMetadata,
}: {
  title?: string
  vaultMetadata?: MobileVaultMetadata
} = {}) {
  const storage = createNativeMobileVaultStorage()
  const demoVault = createDemoVaultConfig(vaultMetadata)
  const file = createMobileNoteFile({ title })
  await storage.writeMarkdownFile(demoVault, file.path, file.content)

  return createStoredMobileVaultRepository({ storage, vault: demoVault }).readNote(file.path.replace(/\.md$/, ''))
}

export async function deleteDemoVaultNote(noteId: string, vaultMetadata = defaultMobileVaultMetadata) {
  const storage = createNativeMobileVaultStorage()
  await createStoredMobileVaultRepository({
    storage,
    vault: createDemoVaultConfig(vaultMetadata),
  }).deleteNote(noteId)
}

export function saveDemoVaultNoteFrontmatter({
  metadata,
  noteId,
  vaultMetadata = defaultMobileVaultMetadata,
}: {
  metadata: WritableMobileNoteFrontmatter
  noteId: string
  vaultMetadata?: MobileVaultMetadata
}) {
  return saveDemoVaultDocumentChange({
    vaultMetadata,
    write: ({ storage, vault }) => saveMobileNoteFrontmatter({ metadata, noteId, storage, vault }),
  })
}

function demoVaultFiles(): MobileVaultFile[] {
  return demoNoteSources.map((source) => ({
    path: source.filename,
    content: source.content,
  }))
}

function createDemoVaultConfig(vaultMetadata: MobileVaultMetadata) {
  return createMobileVaultConfigFromMetadata(vaultMetadata)
}

function createDemoVaultStorageContext(vaultMetadata: MobileVaultMetadata) {
  return {
    storage: createNativeMobileVaultStorage(),
    vault: createDemoVaultConfig(vaultMetadata),
  }
}

function saveDemoVaultDocumentChange<T>({
  vaultMetadata,
  write,
}: {
  vaultMetadata: MobileVaultMetadata
  write: (context: ReturnType<typeof createDemoVaultStorageContext>) => T
}) {
  return write(createDemoVaultStorageContext(vaultMetadata))
}

async function addMissingDemoVaultFiles({
  files,
  storage,
  vault,
}: {
  files: MobileVaultFile[]
  storage: ReturnType<typeof createNativeMobileVaultStorage>
  vault: ReturnType<typeof createDemoVaultConfig>
}) {
  const existingPaths = new Set((await storage.listMarkdownFiles(vault)).map((file) => file.path))
  const missingFiles = files.filter((file) => !existingPaths.has(file.path))
  await Promise.all(missingFiles.map((file) => storage.writeMarkdownFile(vault, file.path, file.content)))
}
