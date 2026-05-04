import { describe, expect, it } from 'vitest'
import { createMobileVaultConfig } from './mobileVaultConfig'
import { createMemoryMobileVaultStorage } from './mobileVaultStorage'

const vault = createVault()

describe('mobile vault storage', () => {
  it('lists only markdown files in stable path order', async () => {
    const storage = createMemoryMobileVaultStorage([
      { path: 'zeta.md', content: '# Zeta' },
      { path: 'asset.png', content: 'binary' },
      { path: 'alpha.md', content: '# Alpha' },
    ])

    await expect(storage.listMarkdownFiles(vault)).resolves.toEqual([
      { path: 'alpha.md', content: '# Alpha' },
      { path: 'zeta.md', content: '# Zeta' },
    ])
  })

  it('reads and writes markdown file content by vault path', async () => {
    const storage = createMemoryMobileVaultStorage([{ path: 'inbox.md', content: '# Inbox' }])

    await storage.writeMarkdownFile(vault, 'inbox.md', '# Updated Inbox')

    await expect(storage.readMarkdownFile(vault, 'inbox.md')).resolves.toBe('# Updated Inbox')
    await expect(storage.readMarkdownFile(vault, 'missing.md')).resolves.toBeNull()
  })
})

function createVault() {
  const result = createMobileVaultConfig({ id: 'personal', name: 'Personal Journal' })
  if (!result.ok) {
    throw new Error(result.error)
  }

  return result.config
}
