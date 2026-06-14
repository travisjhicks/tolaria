import { describe, expect, it } from 'vitest'
import { workspaceScenarioForId } from '../fixtures/workspaceFixtures'
import {
  applyMobileWorkspaceEdit,
  replaceTrailingWikilinkQuery,
  trailingWikilinkQuery,
} from './mobileWorkspaceEditing'

describe('applyMobileWorkspaceEdit', () => {
  it('creates a selected editable note with markdown content', () => {
    const snapshot = applyMobileWorkspaceEdit(workspaceScenarioForId('default'), {
      title: 'Mobile Editing Contract',
      type: 'createNote',
    })

    expect(snapshot.selectedNoteId).toBe('mobile-editing-contract.md')
    expect(snapshot.notes[0]).toMatchObject({
      id: 'mobile-editing-contract.md',
      rawContent: '# Mobile Editing Contract\n\n',
      title: 'Mobile Editing Contract',
      type: 'Note',
    })
  })

  it('updates note content and re-derives title, snippet, links, and editor blocks', () => {
    const snapshot = applyMobileWorkspaceEdit(workspaceScenarioForId('default'), {
      content: '# Revised Mobile Essay\n\nA body with [[open-source-project]].\n\n## Details\n\n- One\n',
      noteId: 'workflow-orchestration',
      type: 'updateNoteContent',
    })

    const note = snapshot.notes.find((candidate) => candidate.id === 'workflow-orchestration')
    expect(note).toMatchObject({
      favorite: true,
      links: 1,
      snippet: 'A body with open-source-project.',
      status: 'Draft',
      title: 'Revised Mobile Essay',
      type: 'Essay',
    })
    expect(note?.editorBlocks?.some((block) => block.kind === 'heading')).toBe(true)
  })

  it('removes existing fixture relationships without dropping the other relationship groups', () => {
    const snapshot = applyMobileWorkspaceEdit(workspaceScenarioForId('default'), {
      key: 'related_to',
      noteId: 'workflow-orchestration',
      ref: '[[Release Notes]]',
      type: 'removeRelationship',
    })

    const note = snapshot.notes.find((candidate) => candidate.id === 'workflow-orchestration')
    const relatedToRefs = note?.relationships.find((candidate) => candidate.key === 'related_to')?.values.map((value) => value.ref)
    const belongsToRefs = note?.relationships.find((candidate) => candidate.key === 'belongs_to')?.values.map((value) => value.ref)

    expect(relatedToRefs ?? []).not.toContain('[[Release Notes]]')
    expect(belongsToRefs).toEqual(['[[LLM Workflow]]', '[[Tolaria MVP]]'])
  })

  it('writes scalar properties into frontmatter and exposes them as properties', () => {
    const snapshot = applyMobileWorkspaceEdit(workspaceScenarioForId('default'), {
      key: 'priority',
      noteId: 'workflow-orchestration',
      type: 'updateProperty',
      value: 'High',
    })

    const note = snapshot.notes.find((candidate) => candidate.id === 'workflow-orchestration')
    expect(note?.rawContent).toContain('priority: High')
    expect(note?.properties).toContainEqual({ key: 'priority', label: 'Priority', value: 'High' })
  })

  it('adds and removes typed relationships using exact wikilink refs', () => {
    const withRelationship = applyMobileWorkspaceEdit(workspaceScenarioForId('default'), {
      key: 'belongs_to',
      noteId: 'workflow-orchestration',
      targetTitle: 'How I Run an Open Source Project',
      type: 'addRelationship',
    })

    const note = withRelationship.notes.find((candidate) => candidate.id === 'workflow-orchestration')
    const relationship = note?.relationships.find((candidate) => candidate.key === 'belongs_to')
    const ref = relationship?.values.find((value) => value.title === 'How I Run an Open Source Project')?.ref

    expect(ref).toBe('[[Tolaria/Mobile UI/How I Run an Open Source Project]]')
    expect(relationship?.values.at(-1)).toMatchObject({
      title: 'How I Run an Open Source Project',
      type: 'Procedure',
      typeTone: 'purple',
    })

    const withoutRelationship = applyMobileWorkspaceEdit(withRelationship, {
      key: 'belongs_to',
      noteId: 'workflow-orchestration',
      ref: ref ?? '',
      type: 'removeRelationship',
    })

    const updatedNote = withoutRelationship.notes.find((candidate) => candidate.id === 'workflow-orchestration')
    const refs = updatedNote?.relationships.find((candidate) => candidate.key === 'belongs_to')?.values.map((value) => value.ref)
    expect(refs ?? []).not.toContain(ref)
  })
})

describe('mobile wikilink editing helpers', () => {
  it('detects and replaces the trailing wikilink query', () => {
    const note = workspaceScenarioForId('default').notes[1]
    const content = '# Draft\n\nSee [[open'

    expect(trailingWikilinkQuery(content)).toBe('open')
    expect(replaceTrailingWikilinkQuery(content, 'open', note)).toBe(
      '# Draft\n\nSee [[Tolaria/Mobile UI/How I Run an Open Source Project]]',
    )
  })
})
