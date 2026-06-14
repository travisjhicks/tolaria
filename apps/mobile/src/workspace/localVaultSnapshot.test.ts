import { describe, expect, it } from 'vitest'
import { buildLocalVaultWorkspaceSnapshot, type LocalVaultFile } from './localVaultSnapshot'

describe('buildLocalVaultWorkspaceSnapshot', () => {
  it('maps real vault frontmatter into mobile notes, relationships, and type colors', () => {
    const snapshot = buildLocalVaultWorkspaceSnapshot({
      files: realVaultRelationshipFiles(),
      vaultLabel: 'Laputa',
      vaultPath: '/Users/luca/Laputa',
    })

    expect(snapshot.source).toMatchObject({ kind: 'localVault', label: 'Laputa', totalNotes: 2 })
    expect(snapshot.notes).toHaveLength(1)
    expect(snapshot.notes[0]).toMatchObject({
      rawContent: tolariaMobileContent,
      title: 'Tolaria Mobile',
      type: 'Project',
      typeTone: 'red',
      workspace: 'Laputa',
    })
    expect(snapshot.notes[0]?.relationships[0]).toMatchObject({
      key: 'related_to',
    })
    expect(snapshot.notes[0]?.relationships[0]?.values[0]).toMatchObject({
      ref: '[[workflow-orchestration|Workflow Orchestration]]',
      title: 'Workflow Orchestration',
      type: 'Note',
    })
    expect((snapshot.notes[0]?.editorBlocks ?? []).some((block) => block.kind === 'table')).toBe(true)
  })

  it('caps the rendered note list while keeping total vault counts', () => {
    const files = Array.from({ length: 5 }, (_, index) => vaultFile(`note-${index}.md`, `---
type: Note
---
# Note ${index}

Body ${index}.
`, index))

    const snapshot = buildLocalVaultWorkspaceSnapshot({
      files,
      maxNotes: 2,
      vaultLabel: 'Laputa',
      vaultPath: '/Users/luca/Laputa',
    })

    expect(snapshot.notes.map((note) => note.title)).toEqual(['Note 4', 'Note 3'])
    expect(snapshot.noteListSubtitle).toBe('2 / 5')
    expect(snapshot.source).toMatchObject({ totalNotes: 5, visibleNotes: 2 })
  })
})

function vaultFile(relativePath: string, content: string, index = 0): LocalVaultFile {
  return {
    absolutePath: `/vault/${relativePath}`,
    content,
    createdAt: 1_700_000_000_000 + index,
    modifiedAt: 1_700_000_000_000 + index,
    relativePath,
    size: content.length,
  }
}

function realVaultRelationshipFiles(): LocalVaultFile[] {
  return [
    vaultFile('project.md', projectTypeContent),
    vaultFile('tolaria-mobile.md', tolariaMobileContent),
    vaultFile('workflow-orchestration.md', workflowOrchestrationContent),
  ]
}

const projectTypeContent = `---
type: Type
color: red
icon: folder
---
# Project
`

const tolariaMobileContent = `---
type: Project
_organized: false
related_to:
  - "[[workflow-orchestration|Workflow Orchestration]]"
---
# Tolaria Mobile

Use **desktop parity** first.

## Tasks

- Keep relationships typed.
- Render tables.

| Area | State |
| --- | --- |
| UI | Draft |
`

const workflowOrchestrationContent = `---
type: Note
_organized: true
---
# Workflow Orchestration

Reference note.
`
