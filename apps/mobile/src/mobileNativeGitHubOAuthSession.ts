import * as AuthSession from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import {
  createMobileGitHubOAuthRequest,
  mobileGitHubOAuthDiscovery,
  normalizeMobileGitHubAuthorizationResult,
} from './mobileGitHubOAuth'
import type { MobileGitHubOAuthSession, MobileGitHubOAuthSessionResult } from './mobileGitHubOAuthFlow'

WebBrowser.maybeCompleteAuthSession()

export type MobileNativeGitHubOAuthSessionConfig = {
  clientId: string
  redirectScheme?: string
}

export function createNativeMobileGitHubOAuthSession({
  clientId,
  redirectScheme = 'tolaria',
}: MobileNativeGitHubOAuthSessionConfig): MobileGitHubOAuthSession {
  return {
    authorize: async () => authorizeGitHub({ clientId, redirectScheme }),
  }
}

async function authorizeGitHub({
  clientId,
  redirectScheme,
}: {
  clientId: string
  redirectScheme: string
}): Promise<MobileGitHubOAuthSessionResult> {
  const redirectUri = AuthSession.makeRedirectUri({
    path: 'oauth/github',
    scheme: redirectScheme,
  })
  const requestResult = createMobileGitHubOAuthRequest({ clientId, redirectUri })
  if (!requestResult.ok) {
    return { message: requestResult.error, state: 'failed' }
  }

  const request = await AuthSession.loadAsync({
    ...requestResult.request,
    responseType: AuthSession.ResponseType.Code,
  }, mobileGitHubOAuthDiscovery)
  const authorizationResult = normalizeMobileGitHubAuthorizationResult(
    await request.promptAsync(mobileGitHubOAuthDiscovery),
  )
  if (authorizationResult.state !== 'authorized') {
    return authorizationResult
  }

  const token = await AuthSession.exchangeCodeAsync({
    clientId: requestResult.request.clientId,
    code: authorizationResult.code,
    extraParams: { code_verifier: request.codeVerifier ?? '' },
    redirectUri: requestResult.request.redirectUri,
  }, mobileGitHubOAuthDiscovery)

  return {
    state: 'succeeded',
    token: {
      accessToken: token.accessToken,
      ...(token.scope ? { scope: token.scope } : {}),
      tokenType: token.tokenType,
    },
  }
}
