import { describe, expect, it } from 'vitest'
import {
  nativeWorkspaceSelectionFromDirectory,
  pickNativeWorkspaceDirectoryWithPicker,
} from './nativeWorkspacePicker'

describe('native workspace picker', () => {
  it('builds native repository requests from picked directories', () => {
    expect(nativeWorkspaceSelectionFromDirectory({
      name: 'Laputa',
      uri: 'file:///Users/luca/Laputa/',
    })).toEqual({
      vaultAlias: 'laputa',
      vaultLabel: 'Laputa',
      vaultRootUri: 'file:///Users/luca/Laputa/',
    })
  })

  it('derives a decoded vault label when the picker omits a directory name', () => {
    expect(nativeWorkspaceSelectionFromDirectory({
      uri: 'file:///Users/luca/Work%20Vault/',
    })).toEqual({
      vaultAlias: 'work-vault',
      vaultLabel: 'Work Vault',
      vaultRootUri: 'file:///Users/luca/Work%20Vault/',
    })
  })

  it('treats picker cancellation as no selected vault', async () => {
    await expect(pickNativeWorkspaceDirectoryWithPicker(async () => {
      throw new Error('cancelled')
    })).resolves.toBeNull()
  })
})
