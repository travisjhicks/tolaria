import { useCallback } from 'react'
import type { MobileAttachmentImport } from './mobileAttachments'

export type MobileAttachmentImporter = () => Promise<MobileAttachmentImport | null>

export function useMobileAttachmentImporter(vaultRootUri?: string | null): MobileAttachmentImporter {
  void vaultRootUri
  return useCallback(async () => null, [])
}
