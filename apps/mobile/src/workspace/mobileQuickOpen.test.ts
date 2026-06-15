import { describe, expect, it } from 'vitest'
import { workspaceScenarioForId } from '../fixtures/workspaceFixtures'
import {
  mobileQuickOpenMoveIndex,
  mobileQuickOpenResultLimit,
  mobileQuickOpenResults,
  mobileQuickOpenSelectedNote,
} from './mobileQuickOpen'

describe('mobile quick open', () => {
  it('returns the first active notes for an empty query', () => {
    const notes = workspaceScenarioForId('default').notes

    expect(mobileQuickOpenResults(notes, '').map((note) => note.id).slice(0, 3)).toEqual([
      'workflow-orchestration',
      'open-source-project',
      'release-2026-05-02',
    ])
  })

  it('excludes archived notes and caps empty-query results', () => {
    const notes = Array.from({ length: mobileQuickOpenResultLimit + 3 }, (_, index) => ({
      ...workspaceScenarioForId('default').notes[0]!,
      archived: index === 1,
      id: `note-${index}`,
      title: `Note ${index}`,
    }))

    const results = mobileQuickOpenResults(notes, '')

    expect(results).toHaveLength(mobileQuickOpenResultLimit)
    expect(results.map((note) => note.id)).not.toContain('note-1')
  })

  it('matches title, preview, metadata, tags, and path text', () => {
    const notes = workspaceScenarioForId('default').notes

    expect(mobileQuickOpenResults(notes, 'workflow orchestration').map((note) => note.id)).toEqual(['workflow-orchestration'])
    expect(mobileQuickOpenResults(notes, 'unexpected success').map((note) => note.id)).toEqual(['open-source-project'])
    expect(mobileQuickOpenResults(notes, 'tolaria/releases').map((note) => note.id)).toEqual(['release-2026-05-02'])
    expect(mobileQuickOpenResults(notes, 'design').map((note) => note.id)).toContain('workflow-orchestration')
    expect(mobileQuickOpenResults(notes, 'procedure').map((note) => note.id)).toContain('open-source-project')
  })

  it('matches desktop quick-open alias and filename forms', () => {
    const note = {
      ...workspaceScenarioForId('default').notes[0]!,
      aliases: ['Weekly Review'],
      id: 'cafe-notes',
      path: 'journal/cafe-notes.md',
      title: 'Café Notes',
    }

    expect(mobileQuickOpenResults([note], 'weekly review').map((result) => result.id)).toEqual(['cafe-notes'])
    expect(mobileQuickOpenResults([note], 'cafe-notes.md').map((result) => result.id)).toEqual(['cafe-notes'])
    expect(mobileQuickOpenResults([note], 'Cafe Notes').map((result) => result.id)).toEqual(['cafe-notes'])
  })

  it('returns no results for unmatched queries', () => {
    expect(mobileQuickOpenResults(workspaceScenarioForId('default').notes, 'zzzzzzz')).toEqual([])
  })

  it('clamps keyboard selection like desktop quick open', () => {
    expect(mobileQuickOpenMoveIndex(0, 3, 'previous')).toBe(0)
    expect(mobileQuickOpenMoveIndex(0, 3, 'next')).toBe(1)
    expect(mobileQuickOpenMoveIndex(2, 3, 'next')).toBe(2)
    expect(mobileQuickOpenMoveIndex(4, 0, 'next')).toBe(0)
  })

  it('returns the selected note or null', () => {
    const results = mobileQuickOpenResults(workspaceScenarioForId('default').notes, '')

    expect(mobileQuickOpenSelectedNote(results, 1)?.id).toBe('open-source-project')
    expect(mobileQuickOpenSelectedNote(results, 99)).toBeNull()
  })
})
