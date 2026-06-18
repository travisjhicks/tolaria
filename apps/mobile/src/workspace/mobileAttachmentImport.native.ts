import { useCallback } from 'react'
import * as DocumentPicker from 'expo-document-picker'
import type { Directory, File } from 'expo-file-system'
import {
  mobileAttachmentRelativePath,
  uniqueMobileAttachmentFileName,
  type MobileAttachmentImport,
} from './mobileAttachments'

type ExpoFileSystemModule = {
  Directory: typeof Directory
  File: typeof File
}

type DocumentPickerAsset = {
  mimeType?: string
  name: string
  uri: string
}

declare const require: (moduleName: string) => ExpoFileSystemModule

let expoFileSystemModule: ExpoFileSystemModule | null = null

export type MobileAttachmentImporter = () => Promise<MobileAttachmentImport | null>

export function useMobileAttachmentImporter(vaultRootUri?: string | null): MobileAttachmentImporter {
  return useCallback(async () => {
    if (!vaultRootUri) return null

    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: '*/*',
    })
    if (result.canceled) return null

    const asset = result.assets[0]
    return asset ? copyAssetToVaultAttachment(vaultRootUri, asset) : null
  }, [vaultRootUri])
}

async function copyAssetToVaultAttachment(
  vaultRootUri: string,
  asset: DocumentPickerAsset,
): Promise<MobileAttachmentImport> {
  const module = expoFileSystem()
  const attachments = new module.Directory(vaultRootUri, 'attachments')
  attachments.create({ idempotent: true, intermediates: true })

  const fileName = uniqueMobileAttachmentFileName({
    existingNames: attachmentEntryNames(attachments),
    name: asset.name,
    nowMs: Date.now(),
  })
  const destination = new module.File(attachments, fileName)
  await new module.File(asset.uri).copy(destination)

  return {
    mimeType: asset.mimeType ?? null,
    name: asset.name,
    path: mobileAttachmentRelativePath(fileName),
  }
}

function attachmentEntryNames(directory: Directory): string[] {
  if (!directory.exists) return []

  return directory.list().map((entry) => entry.name)
}

function expoFileSystem(): ExpoFileSystemModule {
  expoFileSystemModule ??= require('expo-file-system')
  return expoFileSystemModule
}
