import { describe, expect, it } from 'vitest'
import {
  createMobileGitHubOAuthRequest,
  normalizeMobileGitHubAuthorizationResult,
} from './mobileGitHubOAuth'

describe('createMobileGitHubOAuthRequest', () => {
  it('builds a PKCE authorization-code request for GitHub OAuth', () => {
    expect(createMobileGitHubOAuthRequest({
      clientId: ' abc123 ',
      redirectUri: ' tolaria://oauth/github ',
    })).toEqual({
      ok: true,
      request: {
        clientId: 'abc123',
        extraParams: { allow_signup: 'true' },
        redirectUri: 'tolaria://oauth/github',
        responseType: 'code',
        scopes: ['repo'],
        usePKCE: true,
      },
    })
  })

  it.each([
    { clientId: '', error: 'missingClientId', redirectUri: 'tolaria://oauth/github' },
    { clientId: 'abc123', error: 'missingRedirectUri', redirectUri: '' },
  ] as const)('rejects $error', ({ clientId, error, redirectUri }) => {
    expect(createMobileGitHubOAuthRequest({ clientId, redirectUri })).toEqual({
      error,
      ok: false,
    })
  })
})

describe('normalizeMobileGitHubAuthorizationResult', () => {
  it('extracts the temporary authorization code', () => {
    expect(normalizeMobileGitHubAuthorizationResult({
      params: { code: 'temporary-code' },
      type: 'success',
    })).toEqual({
      code: 'temporary-code',
      state: 'authorized',
    })
  })

  it('keeps user cancellation separate from auth failure', () => {
    expect(normalizeMobileGitHubAuthorizationResult({ type: 'cancel' })).toEqual({
      state: 'cancelled',
    })
  })

  it('normalizes provider errors without exposing raw result objects', () => {
    expect(normalizeMobileGitHubAuthorizationResult({
      params: { error: 'access_denied' },
      type: 'error',
    })).toEqual({
      message: 'access_denied',
      state: 'failed',
    })
  })
})
