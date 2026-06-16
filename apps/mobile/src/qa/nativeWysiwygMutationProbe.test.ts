import { describe, expect, it } from 'vitest'
import {
  assertNativeWysiwygMutationProofs,
  nativeWysiwygMutationLogLine,
  nativeWysiwygMutationProof,
  nativeWysiwygMutationPreProofLogText,
  nativeWysiwygMutationProbeInitialContent,
  parseNativeWysiwygMutationProofs,
} from './nativeWysiwygMutationProbe'

describe('native WYSIWYG mutation probe', () => {
  it('seeds metadata-only fixture notes with desktop-style markdown frontmatter', () => {
    expect(nativeWysiwygMutationProbeInitialContent({
      favorite: true,
      snippet: 'The current narrative and temptation: everything routed through an LLM.',
      status: 'Draft',
      tags: ['Design', 'AI'],
      title: 'Workflow Orchestration Essay',
      type: 'Essay',
    })).toBe([
      '---',
      'type: Essay',
      'Status: Draft',
      'tags:',
      '  - Design',
      '  - AI',
      '_favorite: true',
      '---',
      '# Workflow Orchestration Essay',
      '',
      'The current narrative and temptation: everything routed through an LLM.',
      '',
    ].join('\n'))
  })

  it('builds a passing proof from the saved markdown content', () => {
    const proof = nativeWysiwygMutationProof({
      content: [
        '---',
        'type: Essay',
        'Status: Draft',
        'tags:',
        '  - Design',
        '  - AI',
        '_favorite: true',
        '---',
        '# Native WYSIWYG Mutation Probe',
        '',
        'Native bridge mutation saved through TenTap.',
        '',
        '| Surface | Target |',
        '| --- | --- |',
        '| Editor | Native WYSIWYG |',
        '',
      ].join('\n'),
      noteId: 'workflow-orchestration',
    })

    expect(assertNativeWysiwygMutationProofs([proof])).toEqual([])
  })

  it('parses native simulator log lines and reports missing invariants', () => {
    const proof = nativeWysiwygMutationProof({
      content: '# Native WYSIWYG Mutation Probe\n\nNative bridge mutation saved through TenTap.\n',
      noteId: 'workflow-orchestration',
    })
    const parsed = parseNativeWysiwygMutationProofs(`noise\n${nativeWysiwygMutationLogLine(proof)}\n`)

    expect(parsed).toEqual([proof])
    expect(assertNativeWysiwygMutationProofs(parsed).map((failure) => failure.id)).toEqual([
      'editor.wysiwyg.mutation.frontmatter',
      'editor.wysiwyg.mutation.type',
      'editor.wysiwyg.mutation.status',
      'editor.wysiwyg.mutation.tags',
      'editor.wysiwyg.mutation.favorite',
      'editor.wysiwyg.mutation.table',
    ])
  })

  it('keeps layout assertions on pre-mutation logs while still parsing the proof', () => {
    const proof = nativeWysiwygMutationProof({
      content: [
        '---',
        'type: Essay',
        'Status: Draft',
        'tags:',
        '  - Design',
        '  - AI',
        '_favorite: true',
        '---',
        '# Native WYSIWYG Mutation Probe',
        '',
        'Native bridge mutation saved through TenTap.',
        '',
        '| Surface | Target |',
        '| --- | --- |',
        '| Editor | Native WYSIWYG |',
        '',
      ].join('\n'),
      noteId: 'workflow-orchestration',
    })
    const logText = [
      'TOLARIA_MOBILE_LAYOUT_METRIC {"id":"before"}',
      nativeWysiwygMutationLogLine(proof),
      'TOLARIA_MOBILE_LAYOUT_METRIC {"id":"after"}',
    ].join('\n')

    expect(nativeWysiwygMutationPreProofLogText(logText)).toBe('TOLARIA_MOBILE_LAYOUT_METRIC {"id":"before"}\n')
    expect(assertNativeWysiwygMutationProofs(parseNativeWysiwygMutationProofs(logText))).toEqual([])
  })
})
