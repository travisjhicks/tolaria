import { describe, expect, it } from 'vitest'
import { createMobileEditorDraft } from './mobileEditorDraft'
import { saveMobileEditorDraft } from './mobileEditorDraftSave'
import { createMobileVaultConfig } from './mobileVaultConfig'
import { createMemoryMobileVaultStorage } from './mobileVaultStorage'

const vault = createVault()

describe('mobile editor draft save', () => {
  it('writes persistable editor drafts as canonical Markdown', async () => {
    const storage = createMemoryMobileVaultStorage([])
    const draft = createMobileEditorDraft({
      note: { id: 'notes/workflow', title: 'Workflow', content: '# Workflow' },
      editorHtml: '<h1>Workflow</h1><p>Edited</p>',
    })

    await expect(saveMobileEditorDraft({ draft, storage, vault })).resolves.toEqual({
      status: 'saved',
      path: 'notes/workflow.md',
    })

    await expect(storage.readMarkdownFile(vault, 'notes/workflow.md')).resolves.toBe('# Workflow\n\nEdited')
  })

  it('does not write blocked editor drafts', async () => {
    const storage = createMemoryMobileVaultStorage([])
    const draft = createMobileEditorDraft({
      note: { id: 'workflow', title: 'Workflow', content: '# Workflow' },
      editorHtml: '<table><tbody><tr><td>Unsupported</td></tr></tbody></table>',
    })

    await expect(saveMobileEditorDraft({ draft, storage, vault })).resolves.toEqual({
      status: 'blocked',
      reason: 'unsupportedEditorHtml',
    })

    await expect(storage.listMarkdownFiles(vault)).resolves.toEqual([])
  })
})

function createVault() {
  const result = createMobileVaultConfig({ id: 'personal', name: 'Personal Journal' })
  if (!result.ok) {
    throw new Error(result.error)
  }

  return result.config
}
