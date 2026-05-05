import { createNativeMobileVaultStorage } from './mobileNativeVaultStorage'
import { saveMobileRawNote } from './mobileRawNoteSave'
import { createMobileVaultConfigFromMetadata, defaultMobileVaultMetadata, type MobileVaultMetadata } from './mobileVaultMetadata'

export function saveDemoVaultRawNote({
  content,
  noteId,
  vaultMetadata = defaultMobileVaultMetadata,
}: {
  content: string
  noteId: string
  vaultMetadata?: MobileVaultMetadata
}) {
  return saveMobileRawNote({
    content,
    noteId,
    storage: createNativeMobileVaultStorage(),
    vault: createMobileVaultConfigFromMetadata(vaultMetadata),
  })
}
