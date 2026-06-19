import { describe, expect, it } from 'vitest'
import appCommandManifest from '../../../../src/shared/appCommandManifest.json'
import {
  mobileDesktopCommandParityEntries,
  mobileDesktopCommandParityGaps,
  mobileDesktopCommandParityImplementedCount,
} from './mobileDesktopCommandParity'

describe('mobile desktop command parity', () => {
  it('classifies every desktop app command for the mobile editing foundation', () => {
    const entries = mobileDesktopCommandParityEntries()

    expect(entries.map((entry) => entry.command).sort()).toEqual(Object.keys(appCommandManifest.commands).sort())
    expect(entries.every((entry) => entry.desktopId.length > 0)).toBe(true)
    expect(entries.every((entry) => entry.evidence.length > 0)).toBe(true)
  })

  it('keeps mobile-relevant desktop command gaps closed', () => {
    expect(mobileDesktopCommandParityGaps()).toEqual([])
  })

  it('proves most non-git desktop commands already have mobile editing or navigation coverage', () => {
    expect(mobileDesktopCommandParityImplementedCount()).toBeGreaterThan(24)
  })
})
