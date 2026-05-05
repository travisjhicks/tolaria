import type { MobileVaultConfig } from './mobileVaultConfig'
import type { MobileVaultStorageDriver } from './mobileVaultStorage'

export type MobileRawNoteSaveResult =
  | {
      path: string
      status: 'saved'
    }
  | {
      path: string
      status: 'missing'
    }

export async function saveMobileRawNote({
  content,
  noteId,
  storage,
  vault,
}: {
  content: string
  noteId: string
  storage: MobileVaultStorageDriver
  vault: MobileVaultConfig
}): Promise<MobileRawNoteSaveResult> {
  const path = `${noteId}.md`
  const existingContent = await storage.readMarkdownFile(vault, path)
  if (existingContent === null) {
    return { path, status: 'missing' }
  }

  await storage.writeMarkdownFile(vault, path, content)
  return { path, status: 'saved' }
}
