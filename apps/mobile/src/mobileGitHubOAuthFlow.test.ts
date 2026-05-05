import { describe, expect, it } from 'vitest'
import {
  connectMobileGitHubOAuth,
  type MobileGitHubOAuthSession,
} from './mobileGitHubOAuthFlow'
import { createMobileSecureGitCredentialStorage } from './mobileSecureGitCredentialStorage'
import type { MobileSecureStore } from './mobileSecureGitCredentialStorage'

describe('connectMobileGitHubOAuth', () => {
  it('stores a GitHub credential record after successful OAuth', async () => {
    const secureStore = createMemorySecureStore()
    const storage = createMobileSecureGitCredentialStorage(secureStore)

    await expect(connectMobileGitHubOAuth({
      credentialStorage: storage,
      now: () => '2026-05-05T12:00:00.000Z',
      session: successfulSession(),
    })).resolves.toEqual({ state: 'connected' })

    await expect(secureStore.getItemAsync('tolaria:git-credential:githubOAuth:github.com'))
      .resolves.toContain('"accessToken":"github-token"')
    await expect(storage.loadState({ host: 'github.com', strategy: 'githubOAuth' }))
      .resolves.toEqual({ state: 'available' })
  })

  it('does not store credentials when the user cancels', async () => {
    const secureStore = createMemorySecureStore()

    await expect(connectMobileGitHubOAuth({
      credentialStorage: createMobileSecureGitCredentialStorage(secureStore),
      now: () => '2026-05-05T12:00:00.000Z',
      session: { authorize: async () => ({ state: 'cancelled' }) },
    })).resolves.toEqual({ state: 'cancelled' })

    await expect(secureStore.getItemAsync('tolaria:git-credential:githubOAuth:github.com'))
      .resolves.toBeNull()
  })
})

function successfulSession(): MobileGitHubOAuthSession {
  return {
    authorize: async () => ({
      state: 'succeeded',
      token: {
        accessToken: 'github-token',
        scope: 'repo',
        tokenType: 'bearer',
      },
    }),
  }
}

function createMemorySecureStore(): MobileSecureStore {
  const values = new Map<string, string>()

  return {
    deleteItemAsync: async (key) => {
      values.delete(key)
    },
    getItemAsync: async (key) => values.get(key) ?? null,
    setItemAsync: async (key, value) => {
      values.set(key, value)
    },
  }
}
