import type { MobileVaultConfig } from './mobileVaultConfig'

export type MobileVaultFile = {
  path: string
  content: string
}

export type MobileVaultStorageDriver = {
  listMarkdownFiles: (vault: MobileVaultConfig) => Promise<MobileVaultFile[]>
  readMarkdownFile: (vault: MobileVaultConfig, path: string) => Promise<string | null>
  writeMarkdownFile: (vault: MobileVaultConfig, path: string, content: string) => Promise<void>
}

export function createMemoryMobileVaultStorage(files: MobileVaultFile[]): MobileVaultStorageDriver {
  const fileByPath = new Map(files.map((file) => [file.path, file.content]))

  return {
    listMarkdownFiles: () => Promise.resolve(markdownFiles(fileByPath)),
    readMarkdownFile: (_vault, path) => Promise.resolve(fileByPath.get(path) ?? null),
    writeMarkdownFile: async (_vault, path, content) => {
      fileByPath.set(path, content)
    },
  }
}

function markdownFiles(fileByPath: Map<string, string>) {
  return [...fileByPath.entries()]
    .filter(([path]) => path.endsWith('.md'))
    .map(([path, content]) => ({ path, content }))
    .sort((left, right) => left.path.localeCompare(right.path))
}
