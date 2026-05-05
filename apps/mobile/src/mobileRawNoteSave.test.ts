import { describe, expect, it } from 'vitest'
import { saveMobileRawNote } from './mobileRawNoteSave'
import { createMobileVaultConfig } from './mobileVaultConfig'
import { createMemoryMobileVaultStorage } from './mobileVaultStorage'

const vault = createVault()

describe('mobile raw note save', () => {
  it('writes raw markdown to the app-local note file', async () => {
    const storage = createMemoryMobileVaultStorage([{ path: 'workflow.md', content: '# Workflow' }])

    await expect(saveMobileRawNote({
      content: '# Workflow\n\nUpdated [[release]]',
      noteId: 'workflow',
      storage,
      vault,
    })).resolves.toEqual({ path: 'workflow.md', status: 'saved' })

    await expect(storage.readMarkdownFile(vault, 'workflow.md')).resolves.toBe('# Workflow\n\nUpdated [[release]]')
  })

  it('does not create missing files from raw save', async () => {
    const storage = createMemoryMobileVaultStorage([])

    await expect(saveMobileRawNote({
      content: '# Missing',
      noteId: 'missing',
      storage,
      vault,
    })).resolves.toEqual({ path: 'missing.md', status: 'missing' })
  })
})

function createVault() {
  const result = createMobileVaultConfig({ id: 'personal', name: 'Personal Journal' })
  if (!result.ok) {
    throw new Error(result.error)
  }

  return result.config
}
