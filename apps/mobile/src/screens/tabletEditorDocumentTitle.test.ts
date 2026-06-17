import { describe, expect, it } from 'vitest'
import { shouldRenderEditorDocumentTitle } from './tabletEditorDocumentTitle'

describe('shouldRenderEditorDocumentTitle', () => {
  it('renders the title block when raw markdown starts with a real H1', () => {
    expect(shouldRenderEditorDocumentTitle({
      rawContent: '---\ntype: Essay\n---\n# Workflow Orchestration Essay\n\nBody.\n',
      title: 'Workflow Orchestration Essay',
    })).toBe(true)
  })

  it('does not invent an editor H1 for body-only raw markdown', () => {
    expect(shouldRenderEditorDocumentTitle({
      rawContent: 'Paragraph without title.\n',
      title: 'Paragraph Filename',
    })).toBe(false)
  })

  it('does not render fallback frontmatter titles as document H1 content', () => {
    expect(shouldRenderEditorDocumentTitle({
      rawContent: '---\ntitle: Frontmatter Title\n---\nParagraph body.\n',
      title: 'Frontmatter Title',
    })).toBe(false)
  })

  it('keeps fixture-only lab notes visually titled', () => {
    expect(shouldRenderEditorDocumentTitle({
      title: 'Fixture Title',
    })).toBe(true)
  })

  it('does not render empty title text', () => {
    expect(shouldRenderEditorDocumentTitle({
      rawContent: '# \n\nBody.\n',
      title: ' ',
    })).toBe(false)
  })
})
