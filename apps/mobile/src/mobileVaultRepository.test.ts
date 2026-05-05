import { describe, expect, it } from 'vitest'
import { createMobileVaultConfig } from './mobileVaultConfig'
import { createFixtureMobileVaultRepository, createStoredMobileVaultRepository } from './mobileVaultRepository'
import { createMemoryMobileVaultStorage } from './mobileVaultStorage'
import type { MobileNoteSource } from './mobileNoteProjection'

const sources: MobileNoteSource[] = [
  createSource('workflow', 'Workflow Orchestration Essay'),
  createSource('release', 'v2026-05-02'),
]

describe('mobile vault repository', () => {
  it('lists projected notes in vault order', async () => {
    const repository = createFixtureMobileVaultRepository(sources)
    const notes = await repository.listNotes()

    expect(notes.map((note) => note.id)).toEqual(['workflow', 'release'])
    expect(notes[0].title).toBe('Workflow Orchestration Essay')
  })

  it('reads a projected note by id', async () => {
    const repository = createFixtureMobileVaultRepository(sources)

    await expect(repository.readNote('release')).resolves.toMatchObject({
      id: 'release',
      title: 'v2026-05-02',
    })
  })

  it('returns null for missing notes', async () => {
    const repository = createFixtureMobileVaultRepository(sources)

    await expect(repository.readNote('missing')).resolves.toBeNull()
  })

  it('projects notes from app-local markdown storage', async () => {
    const repository = createStoredMobileVaultRepository({
      storage: createMemoryMobileVaultStorage([
        { path: 'inbox/workflow.md', content: '# Workflow\n\nStored markdown body.' },
        { path: 'release.md', content: '# Release\n\nRelease body.' },
      ]),
      vault: createVault(),
    })

    const notes = await repository.listNotes()

    expect(notes.map((note) => note.id)).toEqual(['inbox/workflow', 'release'])
    await expect(repository.readNote('release')).resolves.toMatchObject({
      id: 'release',
      title: 'Release',
    })
  })

  it('projects supported frontmatter metadata from app-local markdown storage', async () => {
    const repository = createStoredMobileVaultRepository({
      storage: createMemoryMobileVaultStorage([
        {
          path: 'workflow.md',
          content: [
            '---',
            'type: Essay',
            'archived: true',
            'icon: pen-nib',
            'status: Active',
            'date: 2026-05-05',
            'tags: [Tolaria MVP, mobile]',
            'belongs_to: [Tolaria MVP]',
            'related_to: [release]',
            'has: [migration]',
            '---',
            '# Workflow',
          ].join('\n'),
        },
      ]),
      vault: createVault(),
    })

    await expect(repository.readNote('workflow')).resolves.toMatchObject({
      id: 'workflow',
      archived: true,
      belongsTo: ['Tolaria MVP'],
      type: 'Essay',
      has: ['migration'],
      icon: 'pen-nib',
      status: 'Active',
      date: '2026-05-05',
      relatedTo: ['release'],
      tags: ['Tolaria MVP', 'mobile'],
    })
  })

  it('deletes notes from app-local markdown storage by id', async () => {
    const repository = createStoredMobileVaultRepository({
      storage: createMemoryMobileVaultStorage([
        { path: 'inbox/workflow.md', content: '# Workflow\n\nStored markdown body.' },
        { path: 'release.md', content: '# Release\n\nRelease body.' },
      ]),
      vault: createVault(),
    })

    await repository.deleteNote('inbox/workflow')

    const notes = await repository.listNotes()
    expect(notes.map((note) => note.id)).toEqual(['release'])
  })
})

function createSource(id: string, title: string): MobileNoteSource {
  return {
    archived: false,
    belongsTo: [],
    id,
    type: 'Essay',
    has: [],
    icon: 'pen-nib',
    date: 'May 13, 2026',
    modified: '6h ago',
    filename: `${id}.md`,
    relatedTo: [],
    tags: ['Tolaria MVP'],
    content: `---\ntitle: ${title}\n---\n\n# ${title}\n\nBody text for ${title}.`,
  }
}

function createVault() {
  const result = createMobileVaultConfig({ id: 'personal', name: 'Personal Journal' })
  if (!result.ok) {
    throw new Error(result.error)
  }

  return result.config
}
