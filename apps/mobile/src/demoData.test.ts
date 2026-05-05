import { describe, expect, it } from 'vitest'
import { notes } from './demoData'
import { createMobileSidebarSections } from './mobileSidebarNavigation'

describe('mobile demo data', () => {
  it('derives note titles and snippets through shared markdown utilities', () => {
    expect(notes[0].title).toBe('Workflow Orchestration Essay')
    expect(notes[0].snippet).toContain('The current narrative / temptation')
    expect(notes[0].words).toBeGreaterThan(20)
  })

  it('keeps the initial sidebar focused on inbox', () => {
    const sidebarSections = createMobileSidebarSections(notes)

    expect(sidebarSections[0].items[0]).toMatchObject({
      label: 'Inbox',
      selection: { kind: 'library', id: 'inbox' },
    })
  })
})
