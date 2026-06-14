import type { Page } from '@playwright/test'
import { access, readdir, readFile, stat } from 'node:fs/promises'
import { basename, join, relative } from 'node:path'
import { performance } from 'node:perf_hooks'
import { buildLocalVaultWorkspaceSnapshot, type LocalVaultFile } from '../src/workspace/localVaultSnapshot'
import type { MobileSidebarFolder, MobileWorkspaceSnapshot } from '../src/workspace/mobileWorkspaceModel'
import { HOST_WORKSPACE_SNAPSHOT_STORAGE_KEY } from '../src/workspace/readOnlyWorkspaceRepository'

export type LocalVaultSnapshotState = {
  buildDurationMs: number
  fileCount: number
  readDurationMs: number
  snapshot: MobileWorkspaceSnapshot
  totalDurationMs: number
  vaultPath: string
}

const defaultLocalVaultPath = '/Users/luca/Laputa'
export const localVaultPath = process.env.MOBILE_QA_VAULT_PATH ?? defaultLocalVaultPath

let localVaultSnapshotPromise: Promise<LocalVaultSnapshotState | null> | null = null

export async function installLocalVaultSnapshot(page: Page): Promise<LocalVaultSnapshotState | null> {
  const state = await localVaultSnapshotState()
  if (!state) return null

  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, value)
    },
    {
      key: HOST_WORKSPACE_SNAPSHOT_STORAGE_KEY,
      value: JSON.stringify(state.snapshot),
    },
  )

  return state
}

export async function localVaultSnapshotState(): Promise<LocalVaultSnapshotState | null> {
  localVaultSnapshotPromise ??= buildLocalVaultSnapshotState()
  return localVaultSnapshotPromise
}

export function firstSidebarFolder(snapshot: MobileWorkspaceSnapshot): MobileSidebarFolder | null {
  const folders = snapshot.sidebarSections.find((section) => section.id === 'folders')?.folders ?? []
  return firstFolder(folders)
}

function firstFolder(folders: MobileSidebarFolder[]): MobileSidebarFolder | null {
  for (const folder of folders) {
    if (folder.name) return folder
    const child = firstFolder(folder.children)
    if (child) return child
  }

  return null
}

async function buildLocalVaultSnapshotState(): Promise<LocalVaultSnapshotState | null> {
  if (!localVaultPath) return null

  try {
    await access(localVaultPath)
  } catch {
    return null
  }

  const startedAt = performance.now()
  const files = await readLocalVaultFiles(localVaultPath)
  const readAt = performance.now()
  const snapshot = buildLocalVaultWorkspaceSnapshot({
    files,
    vaultLabel: basename(localVaultPath),
    vaultPath: localVaultPath,
  })
  const endedAt = performance.now()

  return {
    buildDurationMs: endedAt - readAt,
    fileCount: files.length,
    readDurationMs: readAt - startedAt,
    snapshot,
    totalDurationMs: endedAt - startedAt,
    vaultPath: localVaultPath,
  }
}

async function readLocalVaultFiles(vaultPath: string): Promise<LocalVaultFile[]> {
  const markdownPaths = await listMarkdownFiles(vaultPath)
  const files: LocalVaultFile[] = []

  for (let index = 0; index < markdownPaths.length; index += 64) {
    const chunk = markdownPaths.slice(index, index + 64)
    files.push(...await Promise.all(chunk.map((absolutePath) => readLocalVaultFile(vaultPath, absolutePath))))
  }

  return files
}

async function listMarkdownFiles(rootPath: string): Promise<string[]> {
  const entries = await readdir(rootPath, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const absolutePath = join(rootPath, entry.name)
    if (entry.isDirectory() && shouldReadDirectory(entry.name)) {
      files.push(...await listMarkdownFiles(absolutePath))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(absolutePath)
    }
  }

  return files
}

function shouldReadDirectory(name: string): boolean {
  return !name.startsWith('.') && name !== 'node_modules'
}

async function readLocalVaultFile(vaultPath: string, absolutePath: string): Promise<LocalVaultFile> {
  const [content, metadata] = await Promise.all([
    readFile(absolutePath, 'utf8'),
    stat(absolutePath),
  ])

  return {
    absolutePath,
    content,
    createdAt: metadata.birthtimeMs,
    modifiedAt: metadata.mtimeMs,
    relativePath: relative(vaultPath, absolutePath).replaceAll('\\', '/'),
    size: metadata.size,
  }
}
