export const mobileGitHubOAuthDiscovery = {
  authorizationEndpoint: 'https://github.com/login/oauth/authorize',
  tokenEndpoint: 'https://github.com/login/oauth/access_token',
}

export const defaultMobileGitHubOAuthScopes = ['repo']

export type MobileGitHubOAuthRequestConfig = {
  clientId: string
  extraParams: Record<string, string>
  redirectUri: string
  responseType: 'code'
  scopes: string[]
  usePKCE: true
}

export type CreateMobileGitHubOAuthRequestResult =
  | {
      ok: true
      request: MobileGitHubOAuthRequestConfig
    }
  | {
      ok: false
      error: 'missingClientId' | 'missingRedirectUri'
    }

export type MobileGitHubAuthorizationResult =
  | {
      code: string
      state: 'authorized'
    }
  | {
      state: 'cancelled'
    }
  | {
      message: string
      state: 'failed'
    }

export function createMobileGitHubOAuthRequest({
  clientId,
  redirectUri,
  scopes = defaultMobileGitHubOAuthScopes,
}: {
  clientId: string
  redirectUri: string
  scopes?: string[]
}): CreateMobileGitHubOAuthRequestResult {
  if (!clientId.trim()) {
    return { error: 'missingClientId', ok: false }
  }

  if (!redirectUri.trim()) {
    return { error: 'missingRedirectUri', ok: false }
  }

  return {
    ok: true,
    request: {
      clientId: clientId.trim(),
      extraParams: { allow_signup: 'true' },
      redirectUri: redirectUri.trim(),
      responseType: 'code',
      scopes,
      usePKCE: true,
    },
  }
}

export function normalizeMobileGitHubAuthorizationResult(result: {
  error?: { message?: string } | null
  params?: Record<string, string>
  type: string
}): MobileGitHubAuthorizationResult {
  if (result.type === 'success' && result.params?.code) {
    return { code: result.params.code, state: 'authorized' }
  }

  if (['cancel', 'dismiss'].includes(result.type)) {
    return { state: 'cancelled' }
  }

  return {
    message: oauthFailureMessage(result),
    state: 'failed',
  }
}

function oauthFailureMessage(result: {
  error?: { message?: string } | null
  params?: Record<string, string>
  type: string
}) {
  return result.error?.message
    ?? result.params?.error_description
    ?? result.params?.error
    ?? `GitHub OAuth ended with ${result.type}.`
}
