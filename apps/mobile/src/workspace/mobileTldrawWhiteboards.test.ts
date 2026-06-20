import { describe, expect, it } from 'vitest'
import {
  mobileTldrawFenceSource,
  readMobileTldrawWhiteboards,
  updateMobileTldrawWhiteboard,
} from './mobileTldrawWhiteboards'
import {
  addMobileTldrawTextShapeToSnapshot,
  canAddMobileTldrawTextShapeToSnapshot,
} from './mobileTldrawSnapshot'

describe('mobile tldraw whiteboards', () => {
  it('reads desktop durable tldraw fences with dimensions and snapshots', () => {
    const boards = readMobileTldrawWhiteboards({ markdown: [
      '# Planning',
      '',
      '```tldraw id="map" height="640" width="900"',
      '{ "store": { "shape": true } }',
      '```',
      '',
      'Done',
    ].join('\n') })

    expect(boards).toEqual([{
      boardId: 'map',
      endLine: 4,
      height: '640',
      key: 'map',
      metadataSuffix: '',
      snapshot: '{ "store": { "shape": true } }',
      startLine: 2,
      width: '900',
    }])
  })

  it('updates one whiteboard without rewriting the rest of the note', () => {
    const content = [
      '---',
      'type: Essay',
      '---',
      '# Planning',
      '',
      '```tldraw id="map" height="640"',
      '{}',
      '```',
      '',
      'Tail',
    ].join('\n')

    const result = updateMobileTldrawWhiteboard({
      markdown: content,
      update: {
        height: '720',
        key: 'map',
        snapshot: '{ "document": { "shape": true } }',
        width: '980',
      },
    })

    expect(result.updated).toBe(true)
    expect(result.markdown).toBe([
      '---',
      'type: Essay',
      '---',
      '# Planning',
      '',
      '```tldraw id="map" height="720" width="980"',
      '{ "document": { "shape": true } }',
      '```',
      '',
      'Tail',
    ].join('\n'))
  })

  it('preserves extra desktop tldraw fence metadata when editing dimensions and snapshot', () => {
    const content = [
      '# Planning',
      '',
      '```tldraw id="map" height="640" width="900" compact="true" data-owner="desktop"',
      '{}',
      '```',
    ].join('\n')

    const [board] = readMobileTldrawWhiteboards({ markdown: content })
    expect(board?.metadataSuffix).toBe('compact="true" data-owner="desktop"')

    const result = updateMobileTldrawWhiteboard({
      markdown: content,
      update: {
        height: '720',
        key: 'map',
        snapshot: '{ "document": true }',
      },
    })

    expect(result.updated).toBe(true)
    expect(result.markdown).toBe([
      '# Planning',
      '',
      '```tldraw id="map" height="720" width="900" compact="true" data-owner="desktop"',
      '{ "document": true }',
      '```',
    ].join('\n'))
  })

  it('uses a longer fence when the snapshot contains backticks', () => {
    expect(mobileTldrawFenceSource({
      boardId: 'quoted',
      height: '520',
      metadataSuffix: 'compact="true"',
      snapshot: '{ "text": "```" }',
      width: '',
    })).toBe([
      '````tldraw id="quoted" height="520" compact="true"',
      '{ "text": "```" }',
      '````',
    ].join('\n'))
  })

  it('leaves content unchanged when the target board is missing', () => {
    const content = '# No board\n'

    expect(updateMobileTldrawWhiteboard({
      markdown: content,
      update: {
        key: 'missing',
        snapshot: '{}',
      },
    })).toEqual({ markdown: content, updated: false })
  })

  it('adds a desktop-compatible text shape to an existing store snapshot', () => {
    const result = addMobileTldrawTextShapeToSnapshot({
      snapshot: JSON.stringify({
        schema: {
          schemaVersion: 2,
          sequences: {},
        },
        store: {
          'document:document': {
            gridSize: 20,
            id: 'document:document',
            meta: {},
            name: 'Board',
            typeName: 'document',
          },
          'page:page': {
            id: 'page:page',
            index: 'a1',
            meta: {},
            name: 'Page 1',
            typeName: 'page',
          },
        },
      }),
      text: 'Draft next plan',
    })

    expect(result.added).toBe(true)
    expect(JSON.parse(result.snapshot)).toMatchObject({
      schema: {
        schemaVersion: 2,
      },
      store: {
        'document:document': {
          id: 'document:document',
          typeName: 'document',
        },
        'page:page': {
          id: 'page:page',
          typeName: 'page',
        },
        'shape:mobile-text-1': {
          index: 'a1',
          parentId: 'page:page',
          props: {
            richText: {
              content: [{
                content: [{ text: 'Draft next plan', type: 'text' }],
                type: 'paragraph',
              }],
              type: 'doc',
            },
          },
          type: 'text',
          typeName: 'shape',
        },
      },
    })
  })

  it('leaves incompatible snapshots unchanged instead of inventing a non-loading store', () => {
    expect(canAddMobileTldrawTextShapeToSnapshot({ snapshot: '{}' })).toBe(false)
    expect(addMobileTldrawTextShapeToSnapshot({ snapshot: '{}', text: 'Draft next plan' })).toEqual({
      added: false,
      snapshot: '{}',
    })
  })

  it('preserves existing desktop records when adding a mobile text shape', () => {
    const result = addMobileTldrawTextShapeToSnapshot({
      snapshot: JSON.stringify({
        records: {
          'document:document': {
            gridSize: 20,
            id: 'document:document',
            meta: { owner: 'desktop' },
            name: 'Board',
            typeName: 'document',
          },
          'page:existing': {
            id: 'page:existing',
            index: 'a1',
            meta: {},
            name: 'Desktop page',
            typeName: 'page',
          },
          'shape:desktop': {
            id: 'shape:desktop',
            index: 'a1',
            parentId: 'page:existing',
            typeName: 'shape',
          },
        },
      }),
      text: 'Mobile note',
    })

    const snapshot = JSON.parse(result.snapshot)
    expect(snapshot.records['document:document'].meta).toEqual({ owner: 'desktop' })
    expect(snapshot.records['shape:desktop']).toMatchObject({ parentId: 'page:existing' })
    expect(snapshot.records['shape:mobile-text-2']).toMatchObject({
      index: 'a2',
      parentId: 'page:existing',
      type: 'text',
    })
  })
})
