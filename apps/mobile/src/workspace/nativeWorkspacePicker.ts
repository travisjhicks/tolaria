import { mobileWorkspaceAlias } from './mobileWorkspaceAlias'

export type NativeWorkspaceSelection = {
  vaultAlias: string | null
  vaultLabel: string
  vaultRootUri: string
}

type PickedWorkspaceDirectory = {
  name?: string | null
  uri?: string | null
}

type WorkspaceDirectoryPicker = (initialUri?: string) => Promise<PickedWorkspaceDirectory>
type ExpoFileSystemPickerModule = {
  Directory: {
    pickDirectoryAsync: WorkspaceDirectoryPicker
  }
}

declare const require: (moduleName: string) => ExpoFileSystemPickerModule

let expoFileSystemModule: ExpoFileSystemPickerModule | null = null

export async function pickNativeWorkspaceDirectory(
  initialUri?: string | null,
): Promise<NativeWorkspaceSelection | null> {
  return pickNativeWorkspaceDirectoryWithPicker(
    expoFileSystem().Directory.pickDirectoryAsync,
    initialUri ?? undefined,
  )
}

export async function pickNativeWorkspaceDirectoryWithPicker(
  pickDirectory: WorkspaceDirectoryPicker,
  initialUri?: string,
): Promise<NativeWorkspaceSelection | null> {
  try {
    return nativeWorkspaceSelectionFromDirectory(await pickDirectory(initialUri))
  } catch {
    return null
  }
}

export function nativeWorkspaceSelectionFromDirectory(
  directory: PickedWorkspaceDirectory,
): NativeWorkspaceSelection | null {
  const vaultRootUri = directory.uri?.trim()
  if (!vaultRootUri) return null

  const vaultLabel = directory.name?.trim() || fallbackWorkspaceLabel(vaultRootUri)
  return {
    vaultAlias: mobileWorkspaceAlias({ label: vaultLabel, path: vaultRootUri }),
    vaultLabel,
    vaultRootUri,
  }
}

function expoFileSystem(): ExpoFileSystemPickerModule {
  expoFileSystemModule ??= require('expo-file-system')
  return expoFileSystemModule
}

function fallbackWorkspaceLabel(uri: string) {
  const segment = uri.replace(/\/+$/u, '').split('/').filter(Boolean).at(-1)
  if (!segment) return 'Tolaria Vault'

  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}
