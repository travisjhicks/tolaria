import { describe, expect, it } from 'vitest'
import {
  nativeSourceSelectionProof,
  nativeSourceSelectionProbeEnabled,
} from './nativeSourceSelectionProbe'
import {
  assertNativeSourceSelectionProofs,
  nativeSourceSelectionLogLine,
  parseNativeSourceSelectionProofs,
} from './nativeSourceSelectionLog'

describe('native source selection probe', () => {
  it('builds a passing proof for source editor cursor preservation', () => {
    expect(assertNativeSourceSelectionProofs([nativeSourceSelectionProof()])).toEqual([])
  })

  it('parses native simulator log lines and reports missing invariants', () => {
    const proof = { ...nativeSourceSelectionProof(), insertionPreserved: false }
    const parsed = parseNativeSourceSelectionProofs(`noise\n${nativeSourceSelectionLogLine(proof)}\n`)

    expect(parsed).toEqual([proof])
    expect(assertNativeSourceSelectionProofs(parsed).map((failure) => failure.id)).toEqual([
      'editor.source.selection.insertion',
    ])
  })

  it('detects source selection probe query params', () => {
    expect(nativeSourceSelectionProbeEnabled(new globalThis.URLSearchParams('sourceSelectionProbe=1'))).toBe(true)
    expect(nativeSourceSelectionProbeEnabled(new globalThis.URLSearchParams('sourceSelectionProbe=0'))).toBe(false)
  })
})
