import { describe, expect, it } from 'vitest'
import { createNativeMobileGitTransport, type MobileGitNativeModule } from './mobileNativeGitTransport'
import type { MobileGitRemote } from './mobileGitRemote'

describe('native mobile git transport', () => {
  it('fails explicitly until the native module is available', async () => {
    await expect(createNativeMobileGitTransport(null).pull({
      remote: remote(),
      vault: { id: 'personal', name: 'Personal Journal' },
    })).resolves.toEqual({
      message: 'Mobile Git native module is not available yet.',
      state: 'failed',
    })
  })

  it('maps transport requests to the native module boundary', async () => {
    const requests: unknown[] = []
    const nativeModule: MobileGitNativeModule = {
      pull: async (request) => {
        requests.push(request)
        return { ok: true }
      },
      push: async () => ({ message: 'Push rejected.', ok: false }),
    }

    await expect(createNativeMobileGitTransport(nativeModule).pull({
      remote: remote(),
      vault: { id: 'personal', name: 'Personal Journal' },
    })).resolves.toEqual({ state: 'completed' })

    expect(requests).toEqual([
      {
        remoteUrl: 'https://github.com/refactoringhq/tolaria.git',
        vaultId: 'personal',
      },
    ])
  })

  it('normalizes native failures into transport failures', async () => {
    const nativeModule: MobileGitNativeModule = {
      pull: async () => ({ ok: true }),
      push: async () => ({ message: 'Push rejected.', ok: false }),
    }

    await expect(createNativeMobileGitTransport(nativeModule).push({
      remote: remote(),
      vault: { id: 'personal', name: 'Personal Journal' },
    })).resolves.toEqual({
      message: 'Push rejected.',
      state: 'failed',
    })
  })
})

function remote(): MobileGitRemote {
  return {
    authStrategy: 'githubOAuth',
    host: 'github.com',
    owner: 'refactoringhq',
    repository: 'tolaria',
    url: 'https://github.com/refactoringhq/tolaria.git',
  }
}
