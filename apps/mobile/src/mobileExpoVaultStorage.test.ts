import { describe, expect, it } from 'vitest'
import { createExpoMobileVaultStorage, type ExpoMobileVaultFileSystem } from './mobileExpoVaultStorage'
import { createMobileVaultConfig } from './mobileVaultConfig'

const vault = createVault()

describe('Expo mobile vault storage', () => {
  it('lists nested markdown files from the app-local vault directory', async () => {
    const fileSystem = createFakeFileSystem({
      'file:///documents/vaults/personal-journal/zeta.md': '# Zeta',
      'file:///documents/vaults/personal-journal/notes/alpha.md': '# Alpha',
      'file:///documents/vaults/personal-journal/asset.png': 'binary',
    })

    await expect(createExpoMobileVaultStorage(fileSystem).listMarkdownFiles(vault)).resolves.toEqual([
      { path: 'notes/alpha.md', content: '# Alpha' },
      { path: 'zeta.md', content: '# Zeta' },
    ])
  })

  it('creates parent directories before writing markdown files', async () => {
    const fileSystem = createFakeFileSystem({})
    const storage = createExpoMobileVaultStorage(fileSystem)

    await storage.writeMarkdownFile(vault, 'notes/new.md', '# New')

    await expect(storage.readMarkdownFile(vault, 'notes/new.md')).resolves.toBe('# New')
  })

  it('rejects paths outside the app-local vault directory', async () => {
    const storage = createExpoMobileVaultStorage(createFakeFileSystem({}))

    await expect(storage.writeMarkdownFile(vault, '../outside.md', '# Nope')).rejects.toThrow(
      'Unsafe mobile vault path',
    )
  })
})

function createVault() {
  const result = createMobileVaultConfig({ id: 'personal', name: 'Personal Journal' })
  if (!result.ok) {
    throw new Error(result.error)
  }

  return result.config
}

function createFakeFileSystem(files: Record<string, string>): ExpoMobileVaultFileSystem {
  const fileByUri = new Map(Object.entries(files))
  const directoryUris = new Set(['file:///documents'])
  for (const uri of fileByUri.keys()) {
    addParentDirectories(directoryUris, uri)
  }

  return {
    documentDirectory: 'file:///documents',
    getInfoAsync: async (uri) => ({
      exists: fileByUri.has(uri) || directoryUris.has(uri),
      isDirectory: directoryUris.has(uri),
    }),
    makeDirectoryAsync: async (uri) => {
      addDirectory(directoryUris, uri)
    },
    readAsStringAsync: async (uri) => {
      const content = fileByUri.get(uri)
      if (content === undefined) {
        throw new Error(`Missing fake file: ${uri}`)
      }

      return content
    },
    readDirectoryAsync: async (uri) => listDirectoryNames({ directoryUris, fileByUri, uri }),
    writeAsStringAsync: async (uri, content) => {
      addParentDirectories(directoryUris, uri)
      fileByUri.set(uri, content)
    },
  }
}

function listDirectoryNames(input: {
  directoryUris: Set<string>
  fileByUri: Map<string, string>
  uri: string
}) {
  const names = new Set<string>()
  const prefix = `${input.uri.replace(/\/+$/, '')}/`
  for (const uri of [...input.directoryUris, ...input.fileByUri.keys()]) {
    const remaining = uri.startsWith(prefix) ? uri.slice(prefix.length) : ''
    const name = remaining.split('/')[0]
    if (name) {
      names.add(name)
    }
  }

  return [...names].sort()
}

function addParentDirectories(directoryUris: Set<string>, fileUri: string) {
  addDirectory(directoryUris, fileUri.split('/').slice(0, -1).join('/'))
}

function addDirectory(directoryUris: Set<string>, uri: string) {
  const segments = uri.split('/')
  for (const index of segments.keys()) {
    if (index > 1) {
      directoryUris.add(segments.slice(0, index + 1).join('/'))
    }
  }
}
